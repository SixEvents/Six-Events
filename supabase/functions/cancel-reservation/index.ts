import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    // Créer client Supabase avec service_role pour contourner RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer le token d'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Parser le corps de la requête
    const { reservationId } = await req.json();

    if (!reservationId) {
      throw new Error('Missing reservationId');
    }

    // 1. Récupérer les détails de la réservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('event_id, number_of_places, user_id, status')
      .eq('id', reservationId)
      .single();

    if (reservationError) {
      throw new Error(`Error fetching reservation: ${reservationError.message}`);
    }

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Vérifier que la réservation n'est pas déjà annulée
    if (reservation.status === 'cancelled') {
      throw new Error('Reservation already cancelled');
    }

    // 2. Vérifier que l'utilisateur authentifié est bien le propriétaire
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    if (user.id !== reservation.user_id) {
      throw new Error('Unauthorized: You can only cancel your own reservations');
    }

    // 3. Restaurer les places dans l'événement
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('available_places')
      .eq('id', reservation.event_id)
      .single();

    if (eventError) {
      throw new Error(`Error fetching event: ${eventError.message}`);
    }

    const newAvailablePlaces = (event.available_places || 0) + reservation.number_of_places;

    const { error: updateEventError } = await supabase
      .from('events')
      .update({ available_places: newAvailablePlaces })
      .eq('id', reservation.event_id);

    if (updateEventError) {
      throw new Error(`Error updating event places: ${updateEventError.message}`);
    }

    // 4. Supprimer les tickets associés (QR codes)
    const { error: deleteTicketsError } = await supabase
      .from('tickets')
      .delete()
      .eq('reservation_id', reservationId);

    if (deleteTicketsError) {
      throw new Error(`Error deleting tickets: ${deleteTicketsError.message}`);
    }

    // 5. Supprimer la réservation
    const { error: deleteReservationError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId);

    if (deleteReservationError) {
      throw new Error(`Error deleting reservation: ${deleteReservationError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reservation cancelled successfully',
        placesRestored: reservation.number_of_places,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while cancelling the reservation',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
