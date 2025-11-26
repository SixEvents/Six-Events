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
    const data = email.data as ReservationEmailData;
    const transporter = createGmailTransporter();

    const htmlContent = generateReservationEmailHTML({
      recipientName: email.recipient_name,
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

    return true;
  } catch (error) {
    console.error('Error sending reservation email:', error);
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
