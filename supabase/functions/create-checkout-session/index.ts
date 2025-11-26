import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Parse request body
    const {
      eventId,
      eventTitle,
      eventDate,
      eventLocation,
      quantity,
      totalPrice,
      buyerName,
      buyerEmail,
      buyerPhone,
      participants,
      userId,
    } = await req.json();

    // Validar dados
    if (!eventId || !eventTitle || !quantity || !totalPrice || !buyerEmail) {
      return new Response(
        JSON.stringify({ error: 'Données manquantes' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar valor mínimo do Stripe (0.50 EUR)
    if (totalPrice < 0.50) {
      return new Response(
        JSON.stringify({ error: 'Le montant minimum pour un paiement est de 0,50€' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Creating Stripe session with:', {
      eventTitle,
      quantity,
      totalPrice,
      unitAmount: Math.round((totalPrice / quantity) * 100)
    });

    // Criar sessão de checkout Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Événement: ${eventTitle}`,
              description: `${quantity} billet(s) pour ${eventTitle}`,
              metadata: {
                event_id: eventId,
                event_date: eventDate,
                event_location: eventLocation,
              },
            },
            unit_amount: Math.round((totalPrice / quantity) * 100), // Converter para centavos
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/payment-cancelled`,
      customer_email: buyerEmail,
      metadata: {
        event_id: eventId,
        user_id: userId || '',
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone,
        quantity: quantity.toString(),
        total_price: totalPrice.toString(),
        participants: JSON.stringify(participants),
        event_title: eventTitle,
        event_date: eventDate,
        event_location: eventLocation,
      },
    });

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url // URL pour redirection directe
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
