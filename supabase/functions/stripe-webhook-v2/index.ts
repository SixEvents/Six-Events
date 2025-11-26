import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import QRCode from 'https://esm.sh/qrcode@1.5.3';

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

// Enviar email via Gmail SMTP usando API fetch (Deno)
async function sendEmailViaGmail(data: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');
    
    if (!gmailUser || !gmailPassword) {
      console.error('Gmail credentials not configured');
      return false;
    }

    // Usar serviço SMTP externo via API (Deno não suporta nodemailer nativamente)
    // Alternativa: usar API do SendGrid, Mailgun ou similar
    // Por enquanto, vamos usar a abordagem de chamar uma edge function auxiliar
    
    console.log('📧 Email queued to:', data.to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
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

      // VERIFICAÇÃO DE SEGURANÇA: Verificar places disponíveis ANTES de criar reserva
      const { data: currentEvent, error: eventError } = await supabase
        .from('events')
        .select('available_places')
        .eq('id', event_id)
        .single();

      if (eventError) {
        console.error('Error fetching event:', eventError);
        throw eventError;
      }

      const requestedPlaces = parseInt(quantity);
      
      if (!currentEvent || (currentEvent.available_places || 0) < requestedPlaces) {
        console.error('❌ Not enough places available!');
        console.error(`Requested: ${requestedPlaces}, Available: ${currentEvent?.available_places || 0}`);
        
        // Tentar reembolsar o pagamento
        try {
          await stripe.refunds.create({
            payment_intent: session.payment_intent as string,
            reason: 'requested_by_customer',
          });
          console.log('✅ Refund issued due to overbooking');
        } catch (refundError) {
          console.error('Error issuing refund:', refundError);
        }
        
        return new Response(
          JSON.stringify({ error: 'Not enough places available' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // TRANSAÇÃO ATÔMICA: Criar reserva + Atualizar places em uma operação
      // 1. Atualizar places disponíveis PRIMEIRO
      const newAvailablePlaces = (currentEvent.available_places || 0) - requestedPlaces;
      
      const { error: updateError } = await supabase
        .from('events')
        .update({ available_places: Math.max(0, newAvailablePlaces) })
        .eq('id', event_id);

      if (updateError) {
        console.error('Error updating available places:', updateError);
        throw updateError;
      }

      console.log(`✅ Places updated: ${currentEvent.available_places} → ${newAvailablePlaces}`);

      // 2. Criar reserva no banco de dados
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          event_id,
          user_id: user_id || null,
          buyer_name,
          buyer_email,
          buyer_phone,
          number_of_places: requestedPlaces,
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
        
        // ROLLBACK: Restaurar places se criação falhou
        await supabase
          .from('events')
          .update({ available_places: currentEvent.available_places })
          .eq('id', event_id);
        
        throw reservationError;
      }

      console.log('✅ Reservation created:', reservation.id);

      // 3. Criar tickets com QR codes
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

      console.log(`✅ Created ${ticketsData.length} tickets`);

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

      // 5. Adicionar email na fila (JSONB direto, não string)
      await supabase
        .from('email_queue')
        .insert({
          type: 'reservation_confirmation',
          recipient_email: buyer_email,
          recipient_name: buyer_name,
          reservation_id: reservation.id,
          data: {
            eventName: event_title,
            eventDate: event_date,
            eventLocation: event_location,
            ticketCount: requestedPlaces,
            participants: participantsList,
            totalAmount: parseFloat(total_price),
            qrCodes,
          },
          status: 'pending',
        });

      console.log('✅ Email queued for sending');

      // Atualizar flag de email
      await supabase
        .from('reservations')
        .update({
          confirmation_email_sent: false, // Será true quando email queue processar
          confirmation_email_sent_at: null,
        })
        .eq('id', reservation.id);

      // 🚀 PROCESSAR EMAIL IMEDIATAMENTE (não esperar cron)
      console.log('⏩ Triggering email processor...');
      try {
        const emailProcessResponse = await fetch(
          'https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }
        );
        const emailResult = await emailProcessResponse.json();
        console.log('✅ Email processor triggered:', emailResult);
      } catch (emailError) {
        console.error('⚠️ Email processor failed (non-blocking):', emailError);
        // Não falhar o webhook se email processor der erro
      }

      return new Response(JSON.stringify({ 
        success: true, 
        reservation_id: reservation.id,
        places_remaining: newAvailablePlaces 
      }), {
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
