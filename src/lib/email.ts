/**
 * Sistema de envio de emails usando Resend
 * Este arquivo deve ser usado APENAS no backend (Supabase Edge Functions)
 * NUNCA importe no frontend!
 */

import { Resend } from 'resend';

// Tipos
export interface EmailRecipient {
  email: string;
  name: string;
}

export interface PasswordResetEmailData {
  recipient: EmailRecipient;
  resetLink: string;
}

export interface ReservationConfirmationEmailData {
  recipient: EmailRecipient;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketCount: number;
  participants: string[];
  paymentMethod: 'stripe' | 'cash';
  paymentStatus: 'paid' | 'pending';
  totalAmount: number;
  qrCodes: Array<{
    name: string;
    dataUrl: string;
  }>;
}

// Configuração Resend
export const initializeResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not found in environment variables');
  }
  return new Resend(apiKey);
};

// Template de email de recuperação de senha
export const generatePasswordResetEmail = (data: PasswordResetEmailData) => {
  const { recipient, resetLink } = data;
  
  return {
    from: `${process.env.RESEND_FROM_NAME || 'Six Events'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
    to: recipient.email,
    subject: '🔐 Réinitialiser votre mot de passe - Six Events',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialiser votre mot de passe</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #ec4899 0%, #9333ea 100%); padding: 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                      🔐 Six Events
                    </h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">
                      Bonjour ${recipient.name},
                    </h2>
                    
                    <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                      Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Six Events.
                    </p>
                    
                    <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                      Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
                    </p>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ec4899 0%, #9333ea 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                            Réinitialiser mon mot de passe
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                        ⚠️ <strong>Important :</strong><br>
                        • Ce lien expire dans <strong>1 heure</strong><br>
                        • Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
                      </p>
                    </div>
                    
                    <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                      Vous ne pouvez pas cliquer sur le bouton ? Copiez et collez ce lien dans votre navigateur :<br>
                      <a href="${resetLink}" style="color: #ec4899; word-break: break-all;">${resetLink}</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      Besoin d'aide ? Contactez-nous à <a href="mailto:support@sixevents.com" style="color: #ec4899; text-decoration: none;">support@sixevents.com</a>
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} Six Events. Tous droits réservés.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
};

// Template de email de confirmação de reserva
export const generateReservationConfirmationEmail = (data: ReservationConfirmationEmailData) => {
  const { recipient, eventName, eventDate, eventTime, eventLocation, ticketCount, participants, paymentMethod, paymentStatus, totalAmount, qrCodes } = data;
  
  const paymentMethodText = paymentMethod === 'stripe' ? '💳 Carte bancaire (Stripe)' : '💵 Espèces (à payer sur place)';
  const paymentStatusText = paymentStatus === 'paid' ? '✅ Payé' : '⏳ Paiement en attente';
  const paymentStatusColor = paymentStatus === 'paid' ? '#10b981' : '#f59e0b';
  
  // Gerar HTML dos QR codes
  const qrCodesHtml = qrCodes.map((qr, index) => `
    <div style="text-align: center; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: bold;">
        Billet ${index + 1} - ${qr.name}
      </p>
      <img src="${qr.dataUrl}" alt="QR Code ${qr.name}" style="width: 200px; height: 200px; border: 2px solid #e5e7eb; border-radius: 8px;" />
    </div>
  `).join('');
  
  return {
    from: `${process.env.RESEND_FROM_NAME || 'Six Events'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
    to: recipient.email,
    subject: `✅ Confirmation de réservation - ${eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de réservation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #ec4899 0%, #9333ea 100%); padding: 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                      ✅ Réservation confirmée !
                    </h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">
                      Bonjour ${recipient.name},
                    </h2>
                    
                    <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                      Votre réservation a été confirmée avec succès ! Vous trouverez ci-dessous tous les détails de votre événement.
                    </p>
                    
                    <!-- Event Details -->
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                      <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: bold;">
                        📅 Détails de l'événement
                      </h3>
                      
                      <table width="100%" cellpadding="8" cellspacing="0">
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; font-weight: bold;">Événement :</td>
                          <td style="color: #111827; font-size: 14px;">${eventName}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; font-weight: bold;">Date :</td>
                          <td style="color: #111827; font-size: 14px;">${eventDate}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; font-weight: bold;">Heure :</td>
                          <td style="color: #111827; font-size: 14px;">${eventTime}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; font-weight: bold;">Lieu :</td>
                          <td style="color: #111827; font-size: 14px;">${eventLocation}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; font-weight: bold;">Billets :</td>
                          <td style="color: #111827; font-size: 14px;">${ticketCount} billet(s)</td>
                        </tr>
                      </table>
                    </div>
                    
                    <!-- Participants -->
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                      <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: bold;">
                        👥 Participants
                      </h3>
                      <ul style="margin: 0; padding-left: 20px; color: #111827; font-size: 14px; line-height: 1.8;">
                        ${participants.map(p => `<li>${p}</li>`).join('')}
                      </ul>
                    </div>
                    
                    <!-- Payment Info -->
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                      <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: bold;">
                        💰 Informations de paiement
                      </h3>
                      
                      <table width="100%" cellpadding="8" cellspacing="0">
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; font-weight: bold;">Méthode :</td>
                          <td style="color: #111827; font-size: 14px;">${paymentMethodText}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; font-weight: bold;">Statut :</td>
                          <td style="color: ${paymentStatusColor}; font-size: 14px; font-weight: bold;">${paymentStatusText}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; font-weight: bold;">Total :</td>
                          <td style="color: #111827; font-size: 18px; font-weight: bold;">${totalAmount.toFixed(2)}€</td>
                        </tr>
                      </table>
                    </div>
                    
                    ${paymentMethod === 'cash' ? `
                      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                          ⚠️ <strong>Paiement en espèces :</strong><br>
                          Veuillez apporter le montant exact (${totalAmount.toFixed(2)}€) le jour de l'événement. Le paiement sera effectué à l'entrée.
                        </p>
                      </div>
                    ` : ''}
                    
                    <!-- QR Codes -->
                    <div style="background-color: #eff6ff; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                      <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: bold; text-align: center;">
                        🎫 Vos billets QR Code
                      </h3>
                      
                      <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; text-align: center;">
                        Présentez ces QR codes à l'entrée de l'événement
                      </p>
                      
                      ${qrCodesHtml}
                      
                      <div style="background-color: #dbeafe; border-radius: 4px; padding: 12px; margin-top: 20px;">
                        <p style="margin: 0; color: #1e3a8a; font-size: 12px; text-align: center;">
                          💡 <strong>Astuce :</strong> Sauvegardez ces QR codes sur votre téléphone ou imprimez cet email
                        </p>
                      </div>
                    </div>
                    
                    <!-- Important Notice -->
                    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 30px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">
                        ⚠️ <strong>Important :</strong><br>
                        • Conservez cet email jusqu'au jour de l'événement<br>
                        • Arrivez 15 minutes avant l'heure de début<br>
                        • En cas de problème, contactez-nous immédiatement
                      </p>
                    </div>
                    
                    <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                      Nous avons hâte de vous voir à l'événement ! 🎉
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      Besoin d'aide ? Contactez-nous à <a href="mailto:support@sixevents.com" style="color: #ec4899; text-decoration: none;">support@sixevents.com</a>
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} Six Events. Tous droits réservés.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
};

// Função para enviar email de recuperação de senha
export const sendPasswordResetEmail = async (data: PasswordResetEmailData) => {
  const resend = initializeResend();
  const emailData = generatePasswordResetEmail(data);
  
  try {
    const result = await resend.emails.send(emailData);
    console.log('Password reset email sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
};

// Função para enviar email de confirmação de reserva
export const sendReservationConfirmationEmail = async (data: ReservationConfirmationEmailData) => {
  const resend = initializeResend();
  const emailData = generateReservationConfirmationEmail(data);
  
  try {
    const result = await resend.emails.send(emailData);
    console.log('Reservation confirmation email sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending reservation confirmation email:', error);
    return { success: false, error };
  }
};
