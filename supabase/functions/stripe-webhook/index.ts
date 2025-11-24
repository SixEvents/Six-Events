import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import QRCode from 'https://esm.sh/qrcode@1.5.3';
import { Resend } from 'https://esm.sh/resend@3.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper para gerar código único
function generateUniqueCode(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`.toUpperCase();
}

// Helper para gerar dados do QR code
function generateQRCodeData(data: any): string {
  return JSON.stringify(data);
}

// Gerar QR Code como Data URL
async function generateQRCodeDataURL(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 2,
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    // Verificar assinatura do webhook
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log('Webhook event received:', event.type);

    // Processar apenas eventos de checkout completado
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extrair metadata
      const metadata = session.metadata;
      if (!metadata) {
        console.error('No metadata in session');
        return new Response('No metadata', { status: 400 });
      }

      const {
        event_id,
        user_id,
        buyer_name,
        buyer_email,
        buyer_phone,
        quantity,
        total_price,
        participants,
        event_title,
        event_date,
        event_location,
      } = metadata;

      // Inicializar Supabase client com service role
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('Supabase credentials not configured');
        return new Response('Supabase not configured', { status: 500 });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

      // 1. Criar reserva no banco de dados
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          event_id,
          user_id: user_id || null,
          buyer_name,
          buyer_email,
          buyer_phone,
          number_of_places: parseInt(quantity),
          total_price: parseFloat(total_price),
          payment_method: 'stripe',
          payment_status: 'paid',
          status: 'confirmed',
          stripe_payment_id: session.payment_intent as string,
          stripe_checkout_session_id: session.id,
        })
        .select()
        .single();

      if (reservationError) {
        console.error('Error creating reservation:', reservationError);
        throw reservationError;
      }

      console.log('Reservation created:', reservation.id);

      // 2. Criar tickets com QR codes
      const participantsList = JSON.parse(participants);
      const ticketsData = [];

      for (let i = 0; i < participantsList.length; i++) {
        const participantName = participantsList[i];
        const qrCodeData = generateQRCodeData({
          ticketId: generateUniqueCode(),
          reservationId: reservation.id,
          eventId: event_id,
          participantName,
          ticketNumber: i + 1,
          eventDate: event_date,
          timestamp: Date.now(),
        });

        ticketsData.push({
          reservation_id: reservation.id,
          participant_name: participantName,
          ticket_number: i + 1,
          qr_code_data: qrCodeData,
          status: 'valid',
        });
      }

      const { error: ticketsError } = await supabase
        .from('tickets')
        .insert(ticketsData);

      if (ticketsError) {
        console.error('Error creating tickets:', ticketsError);
        throw ticketsError;
      }

      console.log(`Created ${ticketsData.length} tickets`);

      // 3. Atualizar lugares disponíveis do evento
      const { data: currentEvent } = await supabase
        .from('events')
        .select('available_places')
        .eq('id', event_id)
        .single();

      if (currentEvent) {
        const newAvailablePlaces = (currentEvent.available_places || 0) - parseInt(quantity);
        await supabase
          .from('events')
          .update({ available_places: Math.max(0, newAvailablePlaces) })
          .eq('id', event_id);
      }

      // 4. Gerar QR Codes como imagens
      const qrCodes = [];
      for (let i = 0; i < ticketsData.length; i++) {
        const ticket = ticketsData[i];
        const dataUrl = await generateQRCodeDataURL(ticket.qr_code_data);
        qrCodes.push({
          name: ticket.participant_name,
          dataUrl,
        });
      }

      // 5. Enviar email de confirmação com QR codes
      const resend = new Resend(Deno.env.get('RESEND_API_KEY') || '');

      // Gerar HTML dos QR codes
      const qrCodesHtml = qrCodes
        .map(
          (qr, index) => `
        <div style="text-align: center; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: bold;">
            Billet ${index + 1} - ${qr.name}
          </p>
          <img src="${qr.dataUrl}" alt="QR Code ${qr.name}" style="width: 200px; height: 200px; border: 2px solid #e5e7eb; border-radius: 8px;" />
        </div>
      `
        )
        .join('');

      const emailHtml = `
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
                        Bonjour ${buyer_name},
                      </h2>
                      
                      <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                        Votre paiement a été confirmé avec succès ! Vous trouverez ci-dessous tous les détails de votre événement.
                      </p>
                      
                      <!-- Event Details -->
                      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                        <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: bold;">
                          📅 Détails de l'événement
                        </h3>
                        
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; font-weight: bold;">Événement :</td>
                            <td style="color: #111827; font-size: 14px;">${event_title}</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; font-weight: bold;">Date :</td>
                            <td style="color: #111827; font-size: 14px;">${event_date}</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; font-weight: bold;">Lieu :</td>
                            <td style="color: #111827; font-size: 14px;">${event_location}</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; font-weight: bold;">Billets :</td>
                            <td style="color: #111827; font-size: 14px;">${quantity} billet(s)</td>
                          </tr>
                        </table>
                      </div>
                      
                      <!-- Participants -->
                      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                        <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: bold;">
                          👥 Participants
                        </h3>
                        <ul style="margin: 0; padding-left: 20px; color: #111827; font-size: 14px; line-height: 1.8;">
                          ${participantsList.map((p: string) => `<li>${p}</li>`).join('')}
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
                            <td style="color: #111827; font-size: 14px;">💳 Carte bancaire (Stripe)</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; font-weight: bold;">Statut :</td>
                            <td style="color: #10b981; font-size: 14px; font-weight: bold;">✅ Payé</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; font-weight: bold;">Total :</td>
                            <td style="color: #111827; font-size: 18px; font-weight: bold;">${total_price}€</td>
                          </tr>
                        </table>
                      </div>
                      
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
      `;

      await resend.emails.send({
        from: `${Deno.env.get('RESEND_FROM_NAME') || 'Six Events'} <${Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'}>`,
        to: buyer_email,
        subject: `✅ Confirmation de réservation - ${event_title}`,
        html: emailHtml,
      });

      console.log('Confirmation email sent to:', buyer_email);

      // Atualizar flag de email enviado
      await supabase
        .from('reservations')
        .update({
          confirmation_email_sent: true,
          confirmation_email_sent_at: new Date().toISOString(),
        })
        .eq('id', reservation.id);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
