import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  createGmailTransporter,
  generateReservationEmailHTML,
  generatePartyBuilderDemandHTML,
  generatePartyBuilderClientConfirmationHTML,
  type ReservationEmailData,
  type PartyBuilderDemandData,
} from './lib/gmail.js';

const app = express();
const PORT = process.env.EMAIL_SERVICE_PORT || 3001;

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Processar fila de emails
async function processEmailQueue() {
  try {
    console.log('🔍 Checking email queue...');

    // Buscar emails pendentes (máximo 10 por vez)
    const { data: emails, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3) // Máximo 3 tentativas
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching email queue:', error);
      return;
    }

    if (!emails || emails.length === 0) {
      console.log('✅ No emails in queue');
      return;
    }

    console.log(`📧 Processing ${emails.length} emails...`);

    for (const email of emails) {
      try {
        // Marcar como processando (incrementar attempts)
        await supabase
          .from('email_queue')
          .update({ 
            attempts: email.attempts + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', email.id);

        // Enviar email baseado no tipo
        let success = false;

        if (email.type === 'reservation_confirmation') {
          success = await sendReservationEmail(email);
        } else if (email.type === 'party_builder_quote' || email.type === 'party_builder_request') {
          success = await sendPartyBuilderQuoteEmail(email);
        } else if (email.type === 'party_builder_status_update') {
          success = await sendPartyBuilderStatusUpdateEmail(email);
        }

        // Atualizar status
        if (success) {
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              error_message: null,
            })
            .eq('id', email.id);

          // Atualizar reservation se aplicável
          if (email.reservation_id) {
            await supabase
              .from('reservations')
              .update({
                confirmation_email_sent: true,
                confirmation_email_sent_at: new Date().toISOString(),
              })
              .eq('id', email.reservation_id);
          }

          console.log(`✅ Email sent to ${email.recipient_email}`);
        } else {
          // Se falhou e já tentou 3 vezes, marcar como failed
          if (email.attempts >= 2) {
            await supabase
              .from('email_queue')
              .update({
                status: 'failed',
                error_message: 'Max attempts reached',
              })
              .eq('id', email.id);
            console.error(`❌ Email failed after ${email.attempts + 1} attempts: ${email.recipient_email}`);
          } else {
            console.warn(`⚠️ Email failed, will retry: ${email.recipient_email}`);
          }
        }
      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);
        
        await supabase
          .from('email_queue')
          .update({
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', email.id);
      }
    }
  } catch (error) {
    console.error('Error in processEmailQueue:', error);
  }
}

// Enviar email de confirmação de reserva
async function sendReservationEmail(email: any): Promise<boolean> {
  try {
    console.log(`📤 Sending reservation email to ${email.recipient_email}...`);
    const data = email.data as ReservationEmailData;
    
    console.log(`  Data:`, {
      eventName: data.eventName,
      ticketCount: data.ticketCount,
      totalAmount: data.totalAmount,
      qrCodesCount: data.qrCodes?.length || 0,
      participantsCount: data.participants?.length || 0,
    });
    
    const transporter = createGmailTransporter();

    const htmlContent = generateReservationEmailHTML({
      recipientName: email.recipient_name || 'Client',
      eventName: data.eventName,
      eventDate: data.eventDate,
      eventLocation: data.eventLocation,
      ticketCount: data.ticketCount,
      participants: data.participants,
      totalAmount: data.totalAmount,
      qrCodes: data.qrCodes,
    });

    await transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Six Events',
        address: process.env.EMAIL_FROM || '6events.mjt@gmail.com',
      },
      to: email.recipient_email,
      subject: `✅ Confirmation de réservation - ${data.eventName}`,
      html: htmlContent,
    });

    console.log(`✅ Reservation email sent successfully to ${email.recipient_email}`);
    return true;
  } catch (error) {
    console.error('Error sending reservation email:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Enviar email de demande Party Builder
async function sendPartyBuilderQuoteEmail(email: any): Promise<boolean> {
  try {
    const data = email.data as PartyBuilderDemandData;
    const transporter = createGmailTransporter();

    // Email para a empresa (6events.mjt@gmail.com)
    const companyHtml = generatePartyBuilderDemandHTML(data);
    await transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Six Events',
        address: process.env.EMAIL_FROM || '6events.mjt@gmail.com',
      },
      to: '6events.mjt@gmail.com',
      subject: `🎉 Nouvelle demande Party Builder - ${data.clientName}`,
      html: companyHtml,
    });

    // Email para o cliente
    const clientHtml = generatePartyBuilderClientConfirmationHTML(data);
    await transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Six Events',
        address: process.env.EMAIL_FROM || '6events.mjt@gmail.com',
      },
      to: data.clientEmail,
      subject: `✨ Votre demande a été envoyée - Six Events`,
      html: clientHtml,
    });

    return true;
  } catch (error) {
    console.error('Error sending party builder email:', error);
    return false;
  }
}

// Enviar email de atualização de status Party Builder
async function sendPartyBuilderStatusUpdateEmail(email: any): Promise<boolean> {
  try {
    const data = JSON.parse(email.data);
    const transporter = createGmailTransporter();

    const statusMessages: Record<string, { title: string; message: string; emoji: string }> = {
      processing: {
        emoji: '⏳',
        title: 'Votre demande est en cours d\'étude',
        message: 'Notre équipe travaille actuellement sur votre demande. Nous vous recontacterons très bientôt avec un devis personnalisé.'
      },
      quoted: {
        emoji: '💰',
        title: 'Devis disponible',
        message: `Nous avons le plaisir de vous proposer un devis pour votre événement.${data.finalPrice ? ` Montant: ${data.finalPrice}€` : ''}`
      },
      accepted: {
        emoji: '🎉',
        title: 'Votre demande a été acceptée !',
        message: 'Félicitations ! Votre événement est confirmé. Notre équipe va vous contacter pour finaliser les détails.'
      },
      rejected: {
        emoji: '😔',
        title: 'Votre demande',
        message: 'Nous sommes désolés mais nous ne pouvons pas accepter votre demande pour le moment. N\'hésitez pas à nous contacter pour plus d\'informations.'
      },
      completed: {
        emoji: '✅',
        title: 'Événement terminé',
        message: 'Votre événement est terminé ! Nous espérons que tout s\'est bien passé. Merci de nous avoir fait confiance !'
      }
    };

    const statusInfo = statusMessages[data.newStatus] || statusMessages.processing;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EC4899; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #EC4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">${statusInfo.emoji} ${statusInfo.title}</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${data.clientName}</strong>,</p>
            
            <p>${statusInfo.message}</p>

            <div class="info-box">
              <h3 style="margin-top: 0; color: #EC4899;">📋 Détails de votre demande</h3>
              <p><strong>Thème:</strong> ${data.customTheme.substring(0, 200)}${data.customTheme.length > 200 ? '...' : ''}</p>
              ${data.finalPrice ? `<p><strong>Prix:</strong> ${data.finalPrice}€</p>` : ''}
              ${data.adminNotes ? `<p><strong>Notes:</strong> ${data.adminNotes}</p>` : ''}
            </div>

            <p>Pour toute question, n'hésitez pas à nous contacter:</p>
            <ul>
              <li>📧 Email: 6events.mjt@gmail.com</li>
              <li>📱 Téléphone: [Votre numéro]</li>
            </ul>

            <div class="footer">
              <p>Merci de votre confiance ❤️<br>
              <strong>L'équipe Six Events</strong></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Six Events',
        address: process.env.EMAIL_FROM || '6events.mjt@gmail.com',
      },
      to: data.clientEmail,
      subject: `${statusInfo.emoji} ${statusInfo.title} - Six Events`,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('Error sending party builder status update email:', error);
    return false;
  }
}

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint para processar manualmente
app.post('/process-queue', async (req, res) => {
  try {
    await processEmailQueue();
    res.json({ success: true, message: 'Queue processed' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Iniciar processamento automático a cada 30 segundos
const POLL_INTERVAL = 30000; // 30 segundos
setInterval(processEmailQueue, POLL_INTERVAL);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`📧 Email Service running on port ${PORT}`);
  console.log(`🔄 Processing queue every ${POLL_INTERVAL / 1000} seconds`);
  
  // Processar imediatamente ao iniciar
  processEmailQueue();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
