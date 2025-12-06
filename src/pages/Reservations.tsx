import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Reservation } from '../types';
import { Calendar, MapPin, Users, Download, X } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';

export default function Reservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

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
          event:events(*)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-8">Mes Réservations 🎟️</h1>

          {reservations.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold mb-2">Aucune réservation</h3>
              <p className="text-gray-600 mb-6">Vous n'avez pas encore réservé d'événement</p>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
                Découvrir les événements
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {reservations.map((reservation) => (
                <Card key={reservation.id} className="p-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">{reservation.event?.title}</h3>
                          <Badge className={
                            reservation.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            reservation.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }>
                            {reservation.status === 'confirmed' ? 'Confirmé' :
                             reservation.status === 'cancelled' ? 'Annulé' : 'En attente'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold gradient-text">{reservation.total_price}€</div>
                          <div className="text-sm text-gray-500">Total</div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-center text-gray-700">
                          <Calendar className="w-4 h-4 mr-2 text-pink-500" />
                          {reservation.event?.date && format(new Date(reservation.event.date), 'EEEE d MMMM yyyy', { locale: fr })}
                        </div>
                        {reservation.event?.location && (
                          <div className="flex items-center text-gray-700">
                            <MapPin className="w-4 h-4 mr-2 text-pink-500" />
                            {reservation.event.location}
                          </div>
                        )}
                        <div className="flex items-center text-gray-700">
                          <Users className="w-4 h-4 mr-2 text-pink-500" />
                          {reservation.number_of_places} place{(reservation.number_of_places || 0) > 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Télécharger le ticket
                        </Button>
                        {reservation.status === 'confirmed' && (
                          <Button variant="outline" size="sm" className="text-red-600">
                            <X className="w-4 h-4 mr-2" />
                            Annuler
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center border-l border-gray-100 pl-6">
                      <p className="text-sm text-gray-600 mb-3">QR Code d'entrée</p>
                      {reservation.qr_code && (
                        <QRCodeSVG
                          value={reservation.qr_code}
                          size={150}
                          level="H"
                          includeMargin={true}
                        />
                      )}
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Présentez ce code à l'entrée
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
