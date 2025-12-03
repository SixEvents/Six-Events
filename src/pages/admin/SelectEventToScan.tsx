import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Calendar, MapPin, Users, CheckCircle, Clock, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface EventWithStats {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  total_places: number;
  available_places: number;
  total_tickets: number;
  scanned_tickets: number;
  pending_tickets: number;
  inside_now?: number;
}

export default function SelectEventToScan() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();

    // Subscribe to validations to refresh stats in real-time
    const channel = supabase
      .channel('validations-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'qr_code_validations' }, () => {
        loadEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadEvents = async () => {
    try {
      // Charger tous les événements
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;

      // Pour chaque événement, charger les statistiques des tickets
      const eventsWithStats = await Promise.all(
        (eventsData || []).map(async (event) => {
          // Primeiro buscar todas as reservations deste evento
          const { data: reservations } = await supabase
            .from('reservations')
            .select('id')
            .eq('event_id', event.id);

          const reservationIds = reservations?.map(r => r.id) || [];

          // Depois buscar tickets dessas reservations
          let totalTickets = 0;
          let scannedTickets = 0;
          let pendingTickets = 0;
          let insideNow = 0;

          if (reservationIds.length > 0) {
            const { data: tickets } = await supabase
              .from('tickets')
              .select('id, status')
              .in('reservation_id', reservationIds);

            totalTickets = tickets?.length || 0;
            scannedTickets = tickets?.filter(t => 
              t.status === 'used' || t.status === 'temporarily_valid'
            ).length || 0;
            pendingTickets = tickets?.filter(t => 
              t.status === 'valid'
            ).length || 0;
            // Calcular quem está dentro agora via últimas validações
            const ticketIds = (tickets || []).map(t => t.id);
            if (ticketIds.length > 0) {
              const { data: validations } = await supabase
                .from('qr_code_validations')
                .select('ticket_id, action, created_at')
                  .in('ticket_id', ticketIds)
                  .order('created_at', { ascending: true });

                // Usar apenas a última validação de cada ticket
                const latest = new Map<string, string>();
              (validations || []).forEach(v => {
                  latest.set(v.ticket_id, v.action);
              });
              
                // Contar: entry e reentry = dentro, exit = fora
                insideNow = Array.from(latest.values()).filter(action => 
                  action === 'entry' || action === 'reentry'
                ).length;
            }
          }

          return {
            id: event.id,
            name: event.title || event.name,
            date: event.date,
            time: event.time,
            location: event.location,
            total_places: event.total_places,
            available_places: event.available_places,
            total_tickets: totalTickets,
            scanned_tickets: scannedTickets,
            pending_tickets: pendingTickets,
            inside_now: insideNow
          };
        })
      );

      setEvents(eventsWithStats);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (eventId: string) => {
    // Sauvegarder l'événement sélectionné dans le localStorage
    localStorage.setItem('selectedEventForScan', eventId);
    // Naviguer vers le scanner
    navigate('/admin/qr-scanner');
  };

  const getProgressPercentage = (scanned: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((scanned / total) * 100);
  };

  const getStatusColor = (scanned: number, total: number) => {
    const percentage = getProgressPercentage(scanned, total);
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <QrCode className="w-12 h-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Scanner de Billets
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Sélectionnez un événement pour commencer à scanner les billets
          </p>
        </motion.div>

        {/* Liste des événements */}
        {events.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Aucun événement disponible</h3>
              <p className="text-muted-foreground">
                Il n'y a actuellement aucun événement à scanner
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => {
              const progress = getProgressPercentage(event.scanned_tickets, event.total_tickets);
              const statusColor = getStatusColor(event.scanned_tickets, event.total_tickets);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group h-full flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-start justify-between">
                        <span className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                          {event.name}
                        </span>
                        <Badge variant={event.total_tickets > 0 ? 'default' : 'secondary'}>
                          {event.total_tickets} billets
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col">
                      {/* Informations de l'événement */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2 text-primary" />
                          {new Date(event.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })} à {event.time}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-2 text-primary" />
                          {event.location}
                        </div>
                      </div>

                      {/* Statistiques */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-primary">
                              {event.total_tickets}
                            </div>
                            <div className="text-xs text-muted-foreground">Total</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {event.scanned_tickets}
                            </div>
                            <div className="text-xs text-muted-foreground">Scannés</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-orange-600">
                              {event.pending_tickets}
                            </div>
                            <div className="text-xs text-muted-foreground">En attente</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              {event.inside_now || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">À l'intérieur</div>
                          </div>
                        </div>

                        {/* Barre de progression */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold">Progression</span>
                            <span className="font-bold">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                              className={`h-full ${statusColor} transition-all duration-300`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bouton scanner */}
                      <Button
                        onClick={() => handleSelectEvent(event.id)}
                        variant="hero"
                        size="lg"
                        className="w-full mt-auto group-hover:scale-105 transition-transform"
                        disabled={event.total_tickets === 0}
                      >
                        <QrCode className="w-5 h-5 mr-2" />
                        Scanner cet événement
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
              <span>Complet (≥75%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
              <span>Bon (50-74%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500 mr-2" />
              <span>Moyen (25-49%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
              <span>Faible (&lt;25%)</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
