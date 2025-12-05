import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Reservation, Ticket } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Calendar, MapPin, Users, Download, QrCode, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

export default function MyReservations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<(Reservation & { tickets?: Ticket[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [expandedReservation, setExpandedReservation] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          event:events(*),
          tickets(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = (ticketId: string, participantName: string) => {
    const svgElement = document.getElementById(`qr-${ticketId}`) as SVGElement;
    if (svgElement) {
      // Converter SVG para PNG
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = 200;
      canvas.height = 200;
      
      img.onload = () => {
        ctx?.drawImage(img, 0, 0, 200, 200);
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `ticket-${participantName.replace(/\s/g, '-')}.png`;
        link.href = url;
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  const downloadAllQRCodes = (reservation: Reservation & { tickets?: Ticket[] }) => {
    reservation.tickets?.forEach((ticket, index) => {
      setTimeout(() => downloadQRCode(ticket.id, ticket.participant_name), index * 300);
    });
  };

  const cancelReservation = async (reservationId: string) => {
    setCancellingId(reservationId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté pour annuler une réservation',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-reservation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ reservationId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'annulation');
      }

      toast({
        title: 'Réservation annulée',
        description: `${result.placesRestored} place(s) ont été restituées`,
      });

      // Rafraîchir la liste des réservations
      await fetchReservations();
    } catch (error: any) {
      console.error('Error cancelling reservation:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'annuler la réservation',
        variant: 'destructive',
      });
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 transition-colors duration-200">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 dark:text-white">Mes Réservations</h1>
          <Card className="p-12 text-center transition-colors duration-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="text-6xl mb-4">🎟️</div>
            <h3 className="text-2xl font-bold mb-2 dark:text-white">Aucune réservation</h3>
            <p className="text-muted-foreground mb-6">
              Vous n'avez pas encore réservé d'événements
            </p>
            <Button onClick={() => window.location.href = '/events'} variant="hero">
              Découvrir les événements
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 md:py-12 px-3 md:px-4 transition-colors duration-200">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8 dark:text-white">Mes Réservations</h1>

        <div className="space-y-6">
          {reservations.map((reservation, index) => (
            <motion.div
              key={reservation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="transition-all duration-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex-1 w-full">
                      <CardTitle className="text-lg md:text-xl lg:text-2xl mb-2 dark:text-white">
                        {reservation.event?.title || 'Événement'}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={
                            reservation.status === 'confirmed' ? 'default' :
                            reservation.status === 'pending' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {reservation.status === 'confirmed' ? 'Confirmée' :
                           reservation.status === 'pending' ? 'En attente' : 'Annulée'}
                        </Badge>
                        {reservation.payment_status === 'pending' && (
                          <Badge variant="secondary">
                            💵 Paiement sur place
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl md:text-2xl lg:text-3xl font-bold text-primary">
                        {reservation.total_price?.toFixed(2)}€
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground">
                        {reservation.number_of_places} place{(reservation.number_of_places || 0) > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-4 md:p-6">
                  {/* Event Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <Calendar className="w-4 md:w-5 h-4 md:h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Date</p>
                        <p className="text-sm md:text-base font-semibold dark:text-white">
                          {reservation.event?.date 
                            ? format(new Date(reservation.event.date), 'EEEE d MMMM yyyy', { locale: fr })
                            : 'Date non définie'}
                        </p>
                      </div>
                    </div>
                    
                    {reservation.event?.location && (
                      <div className="flex items-center gap-2 md:gap-3">
                        <MapPin className="w-4 md:w-5 h-4 md:h-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-xs md:text-sm text-muted-foreground">Lieu</p>
                          <p className="text-sm md:text-base font-semibold dark:text-white">{reservation.event.location}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Tickets */}
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 md:mb-4 gap-3">
                      <h4 className="font-semibold flex items-center gap-2 dark:text-white text-sm md:text-base">
                        <QrCode className="w-4 md:w-5 h-4 md:h-5 text-primary flex-shrink-0" />
                        Billets ({reservation.tickets?.length || 0})
                      </h4>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          onClick={() => setExpandedReservation(
                            expandedReservation === reservation.id ? null : reservation.id
                          )}
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none text-xs md:text-sm h-9"
                        >
                          {expandedReservation === reservation.id ? 'Masquer' : 'Voir les QR Codes'}
                        </Button>
                        {reservation.tickets && reservation.tickets.length > 0 && (
                          <Button
                            onClick={() => downloadAllQRCodes(reservation)}
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none text-xs md:text-sm h-9"
                          >
                            <Download className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
                            <span className="hidden sm:inline">Tout télécharger</span>
                            <span className="sm:hidden">Téléch.</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {expandedReservation === reservation.id && reservation.tickets && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-3 md:mt-4">
                        {reservation.tickets.map((ticket) => (
                          <Card
                            key={ticket.id}
                            className="p-3 md:p-4 transition-colors duration-200 dark:bg-gray-700"
                          >
                            <div className="flex flex-col items-center gap-2 md:gap-3">
                              <div className="bg-white p-2 md:p-4 rounded-lg">
                                <QRCodeSVG
                                  id={`qr-${ticket.id}`}
                                  value={ticket.qr_code_data}
                                  size={140}
                                  level="H"
                                  includeMargin
                                />
                              </div>
                              <div className="text-center w-full">
                                <p className="text-sm md:text-base font-semibold dark:text-white">
                                  {ticket.participant_name}
                                </p>
                                <p className="text-xs md:text-sm text-muted-foreground">
                                  Billet #{ticket.ticket_number}
                                </p>
                                <Badge
                                  variant={
                                    ticket.status === 'valid' ? 'default' :
                                    ticket.status === 'used' ? 'secondary' :
                                    ticket.status === 'temporarily_valid' ? 'secondary' :
                                    'destructive'
                                  }
                                  className="mt-2"
                                >
                                  {ticket.status === 'valid' ? 'Valide' :
                                   ticket.status === 'used' ? 'Utilisé' :
                                   ticket.status === 'temporarily_valid' ? 'Sortie temporaire' :
                                   'Annulé'}
                                </Badge>
                              </div>
                              <Button
                                onClick={() => downloadQRCode(ticket.id, ticket.participant_name)}
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Télécharger
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Buyer Info */}
                  <Separator />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-xs md:text-sm text-muted-foreground">
                      <p>Réservation effectuée le {format(new Date(reservation.created_at!), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                      <p>ID: {reservation.id.substring(0, 8)}</p>
                    </div>
                    
                    {reservation.status !== 'cancelled' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={cancellingId === reservation.id}
                            className="w-full sm:w-auto text-xs md:text-sm h-9"
                          >
                            {cancellingId === reservation.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Annulation...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Annuler la réservation
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir annuler cette réservation ?
                              <br /><br />
                              <strong>Cette action est irréversible :</strong>
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>{reservation.number_of_places} place(s) seront restituées</li>
                                <li>Tous les QR codes seront supprimés</li>
                                <li>La réservation sera définitivement effacée</li>
                              </ul>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelReservation(reservation.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Confirmer l'annulation
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
