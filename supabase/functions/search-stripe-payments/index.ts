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

    // Buscar sessões dos últimos 365 dias (1 ano)
    const oneYearAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
    
    console.log(`Buscando pagamentos para email: ${email}`);
    console.log(`Data limite: ${new Date(oneYearAgo * 1000).toISOString()}`);
    
    let allSessions: any[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    // Buscar todas as sessões com paginação
    while (hasMore) {
      const params: any = {
        limit: 100,
        created: { gte: oneYearAgo },
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const sessions = await stripe.checkout.sessions.list(params);
      allSessions = allSessions.concat(sessions.data);
      
      hasMore = sessions.has_more;
      if (hasMore && sessions.data.length > 0) {
        startingAfter = sessions.data[sessions.data.length - 1].id;
      }
    }

    console.log(`Total de sessões encontradas: ${allSessions.length}`);

    // Filtrar por email e payment_status = paid
    const paidSessions = allSessions.filter(
      (session) => 
        session.customer_details?.email?.toLowerCase() === email.toLowerCase() &&
        session.payment_status === 'paid'
    );

    console.log(`Sessões pagas para ${email}: ${paidSessions.length}`);

    if (paidSessions.length === 0) {
      console.log(`Nenhuma sessão paga encontrada para ${email}`);
      console.log(`Total de sessões verificadas: ${allSessions.length}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          payments: [],
          totalSearched: allSessions.length,
          message: `Nenhum pagamento encontrado nos últimos 365 dias para ${email}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Sessões pagas encontradas:`, paidSessions.map(s => ({
      id: s.id,
      date: new Date(s.created * 1000).toISOString(),
      amount: s.amount_total,
      email: s.customer_details?.email,
      event: s.metadata?.event_title,
    })));

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
