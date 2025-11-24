import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Reservation, Ticket } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Calendar, MapPin, Users, Download, QrCode, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

export default function MyReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<(Reservation & { tickets?: Ticket[] })[]>([]);
  const [loading, setLoading] = useState(true);
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
    <div className="min-h-screen bg-background py-12 px-4 transition-colors duration-200">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold mb-8 dark:text-white">Mes Réservations</h1>

        <div className="space-y-6">
          {reservations.map((reservation, index) => (
            <motion.div
              key={reservation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="transition-all duration-200 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2 dark:text-white">
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
                      <div className="text-3xl font-bold text-primary">
                        {reservation.total_price?.toFixed(2)}€
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {reservation.number_of_places} place{(reservation.number_of_places || 0) > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Event Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-semibold dark:text-white">
                          {reservation.event?.date 
                            ? format(new Date(reservation.event.date), 'EEEE d MMMM yyyy', { locale: fr })
                            : 'Date non définie'}
                        </p>
                      </div>
                    </div>
                    
                    {reservation.event?.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Lieu</p>
                          <p className="font-semibold dark:text-white">{reservation.event.location}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Tickets */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold flex items-center gap-2 dark:text-white">
                        <QrCode className="w-5 h-5 text-primary" />
                        Billets ({reservation.tickets?.length || 0})
                      </h4>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setExpandedReservation(
                            expandedReservation === reservation.id ? null : reservation.id
                          )}
                          variant="outline"
                          size="sm"
                        >
                          {expandedReservation === reservation.id ? 'Masquer' : 'Voir les QR Codes'}
                        </Button>
                        {reservation.tickets && reservation.tickets.length > 0 && (
                          <Button
                            onClick={() => downloadAllQRCodes(reservation)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Tout télécharger
                          </Button>
                        )}
                      </div>
                    </div>

                    {expandedReservation === reservation.id && reservation.tickets && (
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        {reservation.tickets.map((ticket) => (
                          <Card
                            key={ticket.id}
                            className="p-4 transition-colors duration-200 dark:bg-gray-700"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className="bg-white p-4 rounded-lg">
                                <QRCodeSVG
                                  id={`qr-${ticket.id}`}
                                  value={ticket.qr_code_data}
                                  size={180}
                                  level="H"
                                  includeMargin
                                />
                              </div>
                              <div className="text-center w-full">
                                <p className="font-semibold dark:text-white">
                                  {ticket.participant_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
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
                  <div className="text-sm text-muted-foreground">
                    <p>Réservation effectuée le {format(new Date(reservation.created_at!), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                    <p>ID: {reservation.id.substring(0, 8)}</p>
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
