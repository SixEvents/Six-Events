import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Event, Review } from '../types';
import { 
  Calendar, 
  MapPin, 
  Users, 
  ArrowLeft, 
  Star, 
  Heart,
  Share2,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      fetchEvent();
      fetchReviews();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleReserve = () => {
    if (!user) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    // Navigate to new checkout page with event data
    navigate('/checkout/event', { 
      state: { 
        event, 
        quantity,
        totalPrice: (event.price || 0) * quantity
      } 
    });
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, review) => acc + (review.rating || 0), 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Événement introuvable</h2>
          <Button onClick={() => navigate('/events')}>Retour aux événements</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Hero Image */}
      <div className="relative h-64 md:h-96 bg-gradient-to-br from-pink-400 to-purple-600">
        {event.images && event.images[0] ? (
          <img
            src={event.images[0]}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-9xl">
            🎉
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        
        {/* Back Button */}
        <Button
          variant="ghost"
          className="absolute top-4 left-4 text-white hover:bg-white/20"
          onClick={() => navigate('/events')}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </Button>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <Button variant="ghost" className="text-white hover:bg-white/20">
            <Heart className="w-5 h-5" />
          </Button>
          <Button variant="ghost" className="text-white hover:bg-white/20">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-16 md:-mt-20 pb-12 md:pb-20 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="p-8 mb-8 relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold mb-3">{event.title}</h1>
                  {event.category && (
                    <Badge className="bg-pink-100 text-pink-700">{event.category}</Badge>
                  )}
                </div>
                {reviews.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                    <span className="text-gray-500">({reviews.length} avis)</span>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center space-x-3 p-4 bg-pink-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-pink-600" />
                  <div>
                    <div className="text-sm text-gray-600">Date</div>
                    <div className="font-semibold">
                      {format(new Date(event.date), 'EEEE d MMMM yyyy', { locale: fr })}
                    </div>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                    <MapPin className="w-6 h-6 text-purple-600" />
                    <div>
                      <div className="text-sm text-gray-600">Lieu</div>
                      <div className="font-semibold">{event.location}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-600">Places disponibles</div>
                    <div className="font-semibold">{event.available_places || 0} places</div>
                  </div>
                </div>

                {event.age_range && (
                  <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl">👶</div>
                    <div>
                      <div className="text-sm text-gray-600">Tranche d'âge</div>
                      <div className="font-semibold">{event.age_range}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{event.description}</p>
              </div>
            </Card>

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">Avis des parents</h2>
                <div className="space-y-6">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{review.user_name || 'Anonyme'}</div>
                        <div className="flex items-center">
                          {Array.from({ length: review.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar - Booking */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-20">
              <div className="text-center mb-6 pb-6 border-b border-gray-100">
                <div className="text-4xl font-bold gradient-text mb-2">
                  {event.price ? `${event.price}€` : 'Gratuit'}
                </div>
                <div className="text-gray-600">par personne</div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre de places</label>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-center"
                      min={1}
                      max={event.available_places || 1}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min((event.available_places || 1), quantity + 1))}
                      disabled={quantity >= (event.available_places || 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Prix unitaire</span>
                    <span className="font-semibold">{event.price || 0}€</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Quantité</span>
                    <span className="font-semibold">× {quantity}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-xl gradient-text">
                        {(event.price || 0) * quantity}€
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-6 text-lg"
                onClick={handleReserve}
                disabled={(event.available_places || 0) === 0}
              >
                {(event.available_places || 0) === 0 ? 'Complet' : 'Réserver maintenant'}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                🔒 Paiement sécurisé • Confirmation instantanée
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
