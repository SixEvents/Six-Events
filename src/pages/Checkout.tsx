import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { CreditCard, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: user?.email || '',
    phone: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
  });

  if (items.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-2">Panier vide</h2>
          <p className="text-muted-foreground mb-6">
            Ajoutez des événements ou configurez une fête pour continuer
          </p>
          <Button onClick={() => navigate('/events')} variant="hero">
            Découvrir les événements
          </Button>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Créer les réservations dans Supabase
      for (const item of items) {
        if (item.type === 'event') {
          const { error } = await supabase.from('reservations').insert({
            event_id: item.id,
            user_id: user?.id,
            number_of_places: item.quantity,
            total_price: item.price * item.quantity,
            status: 'confirmed',
            user_name: formData.fullName,
            user_email: formData.email,
            user_phone: formData.phone,
          });

          if (error) throw error;
        } else if (item.type === 'party_builder') {
          const { error } = await supabase.from('party_builder_orders').insert({
            user_id: user?.id,
            selected_options: item.details,
            total_price: item.price,
            status: 'confirmed',
          });

          if (error) throw error;
        }
      }

      setSuccess(true);
      clearCart();
      toast.success('Réservation confirmée!');
      
      setTimeout(() => {
        navigate('/profile/reservations');
      }, 3000);
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      toast.error('Erreur lors de la réservation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Réservation confirmée!</h2>
          <p className="text-muted-foreground mb-6">
            Vous allez recevoir un email de confirmation avec votre QR code
          </p>
          <Button onClick={() => navigate('/profile/reservations')} variant="hero">
            Voir mes réservations
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 transition-colors duration-200">
      <div className="container mx-auto max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-center px-4">Finaliser la commande</h1>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <Card className="transition-colors duration-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
                <div>
                  <Label htmlFor="fullName">Nom complet *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="transition-colors duration-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <CreditCard className="w-5 h-5" />
                  Paiement sécurisé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
                <div>
                  <Label htmlFor="cardNumber">Numéro de carte</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cardExpiry">Expiration</Label>
                    <Input
                      id="cardExpiry"
                      placeholder="MM/AA"
                      value={formData.cardExpiry}
                      onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardCVC">CVC</Label>
                    <Input
                      id="cardCVC"
                      placeholder="123"
                      value={formData.cardCVC}
                      onChange={(e) => setFormData({ ...formData, cardCVC: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  🔒 Paiement 100% sécurisé avec chiffrement SSL
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Récapitulatif */}
          <div>
            <Card className="lg:sticky lg:top-24 transition-colors duration-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {item.type === 'event' ? 'Événement' : 'Party Builder'}
                      </Badge>
                      <p className="text-muted-foreground">Qté: {item.quantity}</p>
                    </div>
                    <span className="font-semibold">
                      {(item.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{totalPrice.toFixed(2)}€</span>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirmer et payer
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  En confirmant, vous acceptez nos conditions générales
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
