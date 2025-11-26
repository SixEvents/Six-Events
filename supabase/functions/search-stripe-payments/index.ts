import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      throw new Error('Email manquant');
    }

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Buscar sessões de checkout com este email (últimas 100)
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
    });

    // Filtrar por email e payment_status = paid
    const paidSessions = sessions.data.filter(
      (session) => 
        session.customer_details?.email === email &&
        session.payment_status === 'paid'
    );

    if (paidSessions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          payments: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Inicializar Supabase para verificar se já existem reservas
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar quais já têm reserva
    const paymentsWithStatus = await Promise.all(
      paidSessions.map(async (session) => {
        const { data: reservation } = await supabase
          .from('reservations')
          .select('id')
          .eq('stripe_checkout_session_id', session.id)
          .maybeSingle();

        return {
          id: session.id,
          created: session.created,
          amount_total: session.amount_total,
          payment_status: session.payment_status,
          metadata: session.metadata,
          hasReservation: !!reservation,
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        payments: paymentsWithStatus,
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
