/**
 * Sistema de envio de emails usando Gmail SMTP
 * Email: 6events.mjt@gmail.com
 * IMPORTANTE: Usar "Senha de App" do Google, não a senha normal!
 * 
 * Como gerar senha de app:
 * 1. Ir em: https://myaccount.google.com/apppasswords
 * 2. Criar senha para "Mail"
 * 3. Copiar a senha gerada (16 caracteres)
 * 4. Adicionar em GMAIL_APP_PASSWORD no .env
 */

import nodemailer from 'nodemailer';

// Configurar transporter do Gmail
export const createGmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.GMAIL_USER || '6events.mjt@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD, // SENHA DE APP (não senha normal)
    },
  });
};

// Tipos
export interface EmailRecipient {
  email: string;
  name: string;
}

export interface ReservationEmailData {
  recipientName: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  ticketCount: number;
  participants: string[];
  totalAmount: number;
  qrCodes: Array<{
    name: string;
    dataUrl: string;
  }>;
}

export interface PartyBuilderDemandData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: string;
  eventLocation?: string;
  numberOfChildren: number;
  theme: string;
  animations: string[];
  decorations: string[];
  cake: string;
  extras: string[];
  estimatedPrice: number;
  specialRequests?: string;
}

// Template de email de confirmação de reserva
export const generateReservationEmailHTML = (data: ReservationEmailData): string => {
  const { recipientName, eventName, eventDate, eventLocation, ticketCount, participants, totalAmount, qrCodes } = data;
  
  // Proteção contra undefined
  const safeQrCodes = qrCodes || [];
  const safeParticipants = participants || [];
  const safeTotalAmount = totalAmount || 0;
  
  const qrCodesHtml = safeQrCodes.map((qr, index) => `
    <div style="text-align: center; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: bold;">
        Billet ${index + 1} - ${qr.name}
      </p>
      <img src="${qr.dataUrl}" alt="QR Code ${qr.name}" style="width: 200px; height: 200px; border: 2px solid #e5e7eb; border-radius: 8px;" />
    </div>
  `).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation de réservation - Six Events</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #000000;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(236, 72, 153, 0.3);">
              
              <!-- Header avec gradient rose/noir -->
              <tr>
                <td style="background: linear-gradient(135deg, #ec4899 0%, #000000 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                    ✅ Six Events
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 18px;">
                    Votre réservation est confirmée !
                  </p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">
                    Bonjour ${recipientName},
                  </h2>
                  
                  <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                    Merci pour votre confiance ! Votre réservation a été confirmée avec succès. Vous trouverez ci-dessous tous les détails de votre événement.
                  </p>
                  
                  <!-- Event Details -->
                  <div style="background: linear-gradient(135deg, #fce7f3 0%, #f3f4f6 100%); border-radius: 8px; border-left: 4px solid #ec4899; padding: 24px; margin-bottom: 30px;">
                    <h3 style="margin: 0 0 16px 0; color: #ec4899; font-size: 20px; font-weight: bold;">
                      📅 Détails de l'événement
                    </h3>
                    
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; font-weight: bold; width: 140px;">Événement :</td>
                        <td style="color: #111827; font-size: 14px; font-weight: bold;">${eventName}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; font-weight: bold;">📆 Date :</td>
                        <td style="color: #111827; font-size: 14px;">${eventDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; font-weight: bold;">📍 Lieu :</td>
                        <td style="color: #111827; font-size: 14px;">${eventLocation}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; font-weight: bold;">🎫 Billets :</td>
                        <td style="color: #111827; font-size: 14px; font-weight: bold;">${ticketCount} billet(s)</td>
                      </tr>
                    </table>
                  </div>
                  
                  <!-- Participants -->
                  <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                    <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: bold;">
                      👥 Participants
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #111827; font-size: 14px; line-height: 1.8;">
                      ${safeParticipants.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                  </div>
                  
                  <!-- Payment Info -->
                  <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                    <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: bold;">
                      💰 Total payé
                    </h3>
                    <p style="color: #ec4899; font-size: 32px; font-weight: bold; margin: 0;">
                      ${safeTotalAmount.toFixed(2)}€
                    </p>
                  </div>
                  
                  <!-- QR Codes -->
                  <div style="background: linear-gradient(135deg, #eff6ff 0%, #fce7f3 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; border: 2px solid #ec4899;">
                    <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: bold; text-align: center;">
                      🎫 Vos billets QR Code
                    </h3>
                    
                    <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; text-align: center;">
                      <strong>Présentez ces QR codes à l'entrée de l'événement</strong>
                    </p>
                    
                    ${qrCodesHtml}
                    
                    <div style="background-color: #dbeafe; border-radius: 4px; padding: 12px; margin-top: 20px; border: 1px solid #3b82f6;">
                      <p style="margin: 0; color: #1e3a8a; font-size: 12px; text-align: center;">
                        💡 <strong>Conseil :</strong> Sauvegardez ces QR codes sur votre téléphone ou imprimez cet email pour un accès rapide
                      </p>
                    </div>
                  </div>
                  
                  <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
                    <strong style="color: #ec4899;">Nous avons hâte de vous voir à l'événement ! 🎉</strong>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: linear-gradient(135deg, #000000 0%, #ec4899 100%); padding: 30px; text-align: center;">
                  <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px;">
                    <strong>Six Events</strong> - Votre spécialiste événementiel
                  </p>
                  <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px;">
                    📧 Email : <a href="mailto:6events.mjt@gmail.com" style="color: #fce7f3; text-decoration: none;">6events.mjt@gmail.com</a>
                  </p>
                  <p style="margin: 0; color: #fce7f3; font-size: 12px;">
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
  `;
};

// Template de demande Party Builder (para l'entreprise)
export const generatePartyBuilderDemandHTML = (data: PartyBuilderDemandData): string => {
  // Proteção contra undefined
  const safeAnimations = data.animations || [];
  const safeDecorations = data.decorations || [];
  const safeExtras = data.extras || [];
  const safeEstimatedPrice = data.estimatedPrice || 0;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Nouvelle demande Party Builder</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        
        <h1 style="color: #ec4899; border-bottom: 3px solid #ec4899; padding-bottom: 10px;">
          🎉 Nouvelle Demande Party Builder
        </h1>
        
        <h2 style="color: #111827; margin-top: 30px;">📋 Informations Client</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #6b7280;">Nom :</td>
            <td style="padding: 8px; color: #111827;">${data.clientName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #6b7280;">Email :</td>
            <td style="padding: 8px; color: #111827;"><a href="mailto:${data.clientEmail}">${data.clientEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #6b7280;">Téléphone :</td>
            <td style="padding: 8px; color: #111827;">${data.clientPhone}</td>
          </tr>
        </table>
        
        <h2 style="color: #111827; margin-top: 30px;">🎂 Détails de l'Événement</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #6b7280;">Date souhaitée :</td>
            <td style="padding: 8px; color: #111827;">${data.eventDate}</td>
          </tr>
          ${data.eventLocation ? `
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #6b7280;">Lieu :</td>
            <td style="padding: 8px; color: #111827;">${data.eventLocation}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #6b7280;">Nombre d'enfants :</td>
            <td style="padding: 8px; color: #111827; font-weight: bold;">${data.numberOfChildren}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #6b7280;">Thème :</td>
            <td style="padding: 8px; color: #ec4899; font-weight: bold;">${data.theme}</td>
          </tr>
        </table>
        
        <h2 style="color: #111827; margin-top: 30px;">🎨 Configuration Choisie</h2>
        
        <h3 style="color: #6b7280; font-size: 16px;">Animations :</h3>
        <ul style="color: #111827;">
          ${safeAnimations.map(anim => `<li>${anim}</li>`).join('')}
        </ul>
        
        <h3 style="color: #6b7280; font-size: 16px;">Décorations :</h3>
        <ul style="color: #111827;">
          ${safeDecorations.map(deco => `<li>${deco}</li>`).join('')}
        </ul>
        
        <h3 style="color: #6b7280; font-size: 16px;">Gâteau :</h3>
        <p style="color: #111827; font-weight: bold;">${data.cake}</p>
        
        ${safeExtras.length > 0 ? `
        <h3 style="color: #6b7280; font-size: 16px;">Extras :</h3>
        <ul style="color: #111827;">
          ${safeExtras.map(extra => `<li>${extra}</li>`).join('')}
        </ul>
        ` : ''}
        
        ${data.specialRequests ? `
        <h3 style="color: #6b7280; font-size: 16px;">Demandes spéciales :</h3>
        <p style="color: #111827; background-color: #fef3c7; padding: 12px; border-radius: 4px; border-left: 4px solid #f59e0b;">
          ${data.specialRequests}
        </p>
        ` : ''}
        
        <div style="background: linear-gradient(135deg, #ec4899 0%, #000000 100%); color: #ffffff; padding: 20px; border-radius: 8px; margin-top: 30px; text-align: center;">
          <h2 style="margin: 0 0 10px 0; font-size: 24px;">Prix Estimé</h2>
          <p style="margin: 0; font-size: 36px; font-weight: bold;">${safeEstimatedPrice.toFixed(2)}€</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
            (Prix indicatif - À confirmer avec le client)
          </p>
        </div>
        
        <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin-top: 30px; border-radius: 4px;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            <strong>⏰ Action requise :</strong><br>
            Contactez le client sous 24-48h avec un devis personnalisé et détaillé.
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};

// Template de confirmation pour le client (Party Builder)
export const generatePartyBuilderClientConfirmationHTML = (data: PartyBuilderDemandData): string => {
  // Proteção contra undefined
  const safeEstimatedPrice = data.estimatedPrice || 0;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Votre demande a été envoyée !</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #000000; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(236, 72, 153, 0.3);">
        
        <div style="background: linear-gradient(135deg, #ec4899 0%, #000000 100%); padding: 40px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
            ✅ Demande Envoyée !
          </h1>
        </div>
        
        <div style="padding: 40px;">
          <h2 style="color: #111827; font-size: 24px;">Bonjour ${data.clientName},</h2>
          
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Merci pour votre confiance ! Votre demande de Party Builder a été envoyée avec succès à notre équipe.
          </p>
          
          <div style="background: linear-gradient(135deg, #fce7f3 0%, #f3f4f6 100%); border-radius: 8px; border-left: 4px solid #ec4899; padding: 20px; margin: 30px 0;">
            <h3 style="margin: 0 0 12px 0; color: #ec4899; font-size: 18px;">📋 Résumé de votre demande</h3>
            <ul style="margin: 0; padding-left: 20px; color: #111827; line-height: 1.8;">
              <li><strong>Date :</strong> ${data.eventDate}</li>
              <li><strong>Thème :</strong> ${data.theme}</li>
              <li><strong>Nombre d'enfants :</strong> ${data.numberOfChildren}</li>
              <li><strong>Prix estimé :</strong> ${safeEstimatedPrice.toFixed(2)}€</li>
            </ul>
          </div>
          
          <div style="background-color: #dbeafe; border-radius: 8px; padding: 20px; margin: 30px 0; border: 2px solid #3b82f6;">
            <p style="margin: 0; color: #1e40af; font-size: 16px; text-align: center;">
              <strong>⏰ Prochaine étape :</strong><br>
              L'équipe Six Events vous contactera sous <strong>24-48 heures</strong> avec un devis personnalisé et détaillé.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Vous recevrez un email de confirmation avec toutes les modalités de paiement et les détails de votre événement.
          </p>
          
          <p style="margin: 30px 0 0 0; color: #111827; font-size: 16px; text-align: center;">
            <strong style="color: #ec4899;">À très bientôt ! 🎉</strong>
          </p>
        </div>
        
        <div style="background: linear-gradient(135deg, #000000 0%, #ec4899 100%); padding: 30px; text-align: center;">
          <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px;">
            <strong>Six Events</strong> - Votre spécialiste événementiel
          </p>
          <p style="margin: 0; color: #ffffff; font-size: 14px;">
            📧 Email : <a href="mailto:6events.mjt@gmail.com" style="color: #fce7f3; text-decoration: none;">6events.mjt@gmail.com</a>
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};
