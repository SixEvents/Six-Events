import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateUniqueCode(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`.toUpperCase();
}

function generateQRCodeData(data: any): string {
  return JSON.stringify(data);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error('Session ID manquant');
    }

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Buscar sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      throw new Error('Session non trouvée');
    }

    if (session.payment_status !== 'paid') {
      throw new Error(`Paiement non confirmé (status: ${session.payment_status})`);
    }

    // Extrair metadata
    const metadata = session.metadata;
    if (!metadata) {
      throw new Error('Métadonnées manquantes');
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

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe
    const { data: existing } = await supabase
      .from('reservations')
      .select('id')
      .eq('stripe_checkout_session_id', sessionId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Réservation déjà existante',
          reservation: existing,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar places disponíveis
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('available_places')
      .eq('id', event_id)
      .single();

    if (eventError) throw eventError;

    const requestedPlaces = parseInt(quantity);
    if ((event.available_places || 0) < requestedPlaces) {
      throw new Error(`Plus assez de places (demandé: ${requestedPlaces}, disponible: ${event.available_places})`);
    }

    // Atualizar places
    const newAvailablePlaces = (event.available_places || 0) - requestedPlaces;
    await supabase
      .from('events')
      .update({ available_places: Math.max(0, newAvailablePlaces) })
      .eq('id', event_id);

    // Criar reserva
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
        stripe_checkout_session_id: sessionId,
      })
      .select()
      .single();

    if (reservationError) throw reservationError;

    // Criar tickets
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

    await supabase.from('tickets').insert(ticketsData);

    // Enfileirar email
    await supabase.from('email_queue').insert({
      type: 'reservation_confirmation',
      recipient_email: buyer_email,
      recipient_name: buyer_name,
      reservation_id: reservation.id,
      data: JSON.stringify({
        eventName: event_title,
        eventDate: event_date,
        eventLocation: event_location,
        ticketCount: requestedPlaces,
        participants: participantsList,
        totalAmount: parseFloat(total_price),
      }),
      status: 'pending',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Réservation créée avec succès',
        reservation,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
