import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Event, CheckoutFormData } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, CreditCard, Banknote, CheckCircle2, Loader2, Calendar, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateQRCodeData, generateUniqueCode } from '../lib/qrcode';

export default function CheckoutEvent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { event, quantity, totalPrice } = location.state as {
    event: Event;
    quantity: number;
    totalPrice: number;
  };

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CheckoutFormData>({
    buyerName: '',
    buyerEmail: user?.email || '',
    buyerPhone: '',
    participants: Array(Math.max(0, quantity - 1)).fill(''),
    paymentMethod: 'card',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    cardName: ''
  });

  useEffect(() => {
    if (!event || !quantity) {
      navigate('/events');
    }
  }, [event, quantity, navigate]);

  const handleInputChange = (field: keyof CheckoutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleParticipantChange = (index: number, value: string) => {
    const newParticipants = [...formData.participants];
    newParticipants[index] = value;
    setFormData(prev => ({ ...prev, participants: newParticipants }));
  };

  const validateStep1 = () => {
    if (!formData.buyerName.trim()) {
      toast.error('Veuillez entrer votre nom');
      return false;
    }
    if (!formData.buyerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.buyerEmail)) {
      toast.error('Email invalide');
      return false;
    }
    if (!formData.buyerPhone.trim() || !/^\+?[\d\s-()]{8,}$/.test(formData.buyerPhone)) {
      toast.error('Numéro de téléphone invalide');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    // Se tiver apenas 1 ingresso, não há outros participantes
    if (formData.participants.length === 0) return true;
    
    const emptyParticipants = formData.participants.filter(p => !p.trim());
    if (emptyParticipants.length > 0) {
      toast.error('Veuillez remplir tous les noms des participants');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.paymentMethod === 'card') {
      if (!formData.cardNumber || formData.cardNumber.length < 16) {
        toast.error('Numéro de carte invalide');
        return false;
      }
      if (!formData.cardExpiry || !/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) {
        toast.error('Date d\'expiration invalide (MM/AA)');
        return false;
      }
      if (!formData.cardCVC || formData.cardCVC.length < 3) {
        toast.error('Code CVC invalide');
        return false;
      }
      if (!formData.cardName || formData.cardName.trim().length < 3) {
        toast.error('Nom sur la carte invalide');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      // Se tiver apenas 1 ingresso, pular direto para pagamento
      if (quantity === 1) {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep3()) return;
    
    setLoading(true);

    try {
      // 1. Criar reserva
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          event_id: event.id,
          user_id: user?.id,
          buyer_name: formData.buyerName,
          buyer_email: formData.buyerEmail,
          buyer_phone: formData.buyerPhone,
          number_of_places: quantity,
          total_price: totalPrice,
          payment_method: formData.paymentMethod,
          payment_status: formData.paymentMethod === 'card' ? 'confirmed' : 'pending',
          status: 'confirmed'
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      // 2. Criar tickets individuais com QR codes
      // Comprador é sempre o primeiro participante
      const allParticipants = [formData.buyerName, ...formData.participants];
      
      const tickets = allParticipants.map((participantName, index) => {
        const qrCodeData = generateQRCodeData({
          ticketId: generateUniqueCode(),
          reservationId: reservation.id,
          eventId: event.id,
          participantName,
          ticketNumber: index + 1,
          eventDate: event.date,
          timestamp: Date.now()
        });

        return {
          reservation_id: reservation.id,
          participant_name: participantName,
          ticket_number: index + 1,
          qr_code_data: qrCodeData,
          status: 'valid'
        };
      });

      const { error: ticketsError } = await supabase
        .from('tickets')
        .insert(tickets);

      if (ticketsError) throw ticketsError;

      // 3. Atualizar lugares disponíveis do evento
      const newAvailablePlaces = (event.available_places || 0) - quantity;
      await supabase
        .from('events')
        .update({ available_places: newAvailablePlaces })
        .eq('id', event.id);

      setSuccess(true);
      toast.success('Réservation confirmée! Email envoyé avec vos QR codes.');
      
      setTimeout(() => {
        navigate('/profile/reservations');
      }, 3000);
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      toast.error('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 transition-colors duration-200">
        <Card className="max-w-2xl w-full text-center p-8 transition-colors duration-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4 dark:text-white">Réservation Confirmée!</h2>
          <p className="text-muted-foreground mb-4">
            Votre réservation pour <strong>{event.title}</strong> a été confirmée.
          </p>
          <p className="text-muted-foreground mb-8">
            Un email avec {quantity} QR code{quantity > 1 ? 's' : ''} a été envoyé à <strong>{formData.buyerEmail}</strong>
          </p>
          
          {formData.paymentMethod === 'cash' && (
            <Badge variant="secondary" className="mb-6">
              💵 Paiement à effectuer sur place: {totalPrice.toFixed(2)}€
            </Badge>
          )}

          <div className="space-y-3">
            <Button onClick={() => navigate('/profile/reservations')} variant="hero" size="lg" className="w-full">
              Voir mes réservations
            </Button>
            <Button onClick={() => navigate('/events')} variant="outline" size="lg" className="w-full">
              Retour aux événements
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 transition-colors duration-200">
      <div className="container mx-auto max-w-6xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <h1 className="text-4xl font-bold mb-2 dark:text-white">Réservation</h1>
        <p className="text-muted-foreground mb-8">Complétez votre réservation en 3 étapes</p>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12 gap-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  currentStep >= step
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 mx-2 transition-colors ${
                    currentStep > step ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <Card className="transition-colors duration-200 dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>
                    {currentStep === 1 && '1. Vos informations'}
                    {currentStep === 2 && '2. Participants'}
                    {currentStep === 3 && '3. Paiement'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Step 1: Buyer Info */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="buyerName">Nom complet *</Label>
                        <Input
                          id="buyerName"
                          value={formData.buyerName}
                          onChange={(e) => handleInputChange('buyerName', e.target.value)}
                          placeholder="Jean Dupont"
                          required
                          className="transition-colors dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="buyerEmail">Email *</Label>
                        <Input
                          id="buyerEmail"
                          type="email"
                          value={formData.buyerEmail}
                          onChange={(e) => handleInputChange('buyerEmail', e.target.value)}
                          placeholder="jean.dupont@email.com"
                          required
                          className="transition-colors dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="buyerPhone">Téléphone *</Label>
                        <Input
                          id="buyerPhone"
                          type="tel"
                          value={formData.buyerPhone}
                          onChange={(e) => handleInputChange('buyerPhone', e.target.value)}
                          placeholder="+33 6 12 34 56 78"
                          required
                          className="transition-colors dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>

                      <Button type="button" onClick={handleNextStep} className="w-full" variant="hero">
                        Continuer
                      </Button>
                    </div>
                  )}

                  {/* Step 2: Participants */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {quantity > 1 
                          ? `Vous avez réservé ${quantity} places. Vous êtes le participant 1. ${quantity > 1 ? `Entrez le nom des ${quantity - 1} autre${quantity > 2 ? 's' : ''} participant${quantity > 2 ? 's' : ''}.` : ''}`
                          : 'Vous avez réservé 1 place pour vous-même.'}
                      </p>
                      
                      {formData.participants.length > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                            👤 Participant 1: {formData.buyerName} (Vous)
                          </p>
                        </div>
                      )}
                      
                      {formData.participants.map((participant, index) => (
                        <div key={index}>
                          <Label htmlFor={`participant-${index}`}>
                            Participant {index + 2} *
                          </Label>
                          <Input
                            id={`participant-${index}`}
                            value={participant}
                            onChange={(e) => handleParticipantChange(index, e.target.value)}
                            placeholder="Nom complet"
                            required
                            className="transition-colors dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                      ))}

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          variant="outline"
                          className="flex-1"
                        >
                          Retour
                        </Button>
                        <Button
                          type="button"
                          onClick={handleNextStep}
                          variant="hero"
                          className="flex-1"
                        >
                          Continuer
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Payment */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="mb-3 block">Méthode de paiement *</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => handleInputChange('paymentMethod', 'card')}
                            className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                              formData.paymentMethod === 'card'
                                ? 'border-primary bg-primary/10'
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                            }`}
                          >
                            <CreditCard className="w-8 h-8" />
                            <span className="font-semibold">Carte</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleInputChange('paymentMethod', 'cash')}
                            className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                              formData.paymentMethod === 'cash'
                                ? 'border-primary bg-primary/10'
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                            }`}
                          >
                            <Banknote className="w-8 h-8" />
                            <span className="font-semibold">Espèces</span>
                          </button>
                        </div>
                      </div>

                      {formData.paymentMethod === 'card' ? (
                        <div className="space-y-4">
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                              💳 Cartes acceptées: Visa, Mastercard, American Express
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              Vous pouvez aussi payer avec PayPal ou Stripe si configuré
                            </p>
                          </div>
                          
                          <div>
                            <Label htmlFor="cardNumber">Numéro de carte *</Label>
                            <Input
                              id="cardNumber"
                              value={formData.cardNumber}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\s/g, '');
                                if (/^\d*$/.test(value) && value.length <= 16) {
                                  handleInputChange('cardNumber', value);
                                }
                              }}
                              placeholder="1234 5678 9012 3456"
                              maxLength={16}
                              required
                              className="transition-colors dark:bg-gray-700 dark:border-gray-600"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="cardExpiry">Expiration *</Label>
                              <Input
                                id="cardExpiry"
                                value={formData.cardExpiry}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/\D/g, '');
                                  if (value.length >= 2) {
                                    value = value.slice(0, 2) + '/' + value.slice(2, 4);
                                  }
                                  if (value.length <= 5) {
                                    handleInputChange('cardExpiry', value);
                                  }
                                }}
                                placeholder="MM/AA"
                                maxLength={5}
                                required
                                className="transition-colors dark:bg-gray-700 dark:border-gray-600"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="cardCVC">CVC *</Label>
                              <Input
                                id="cardCVC"
                                value={formData.cardCVC}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  if (value.length <= 4) {
                                    handleInputChange('cardCVC', value);
                                  }
                                }}
                                placeholder="123"
                                maxLength={4}
                                required
                                className="transition-colors dark:bg-gray-700 dark:border-gray-600"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="cardName">Nom sur la carte *</Label>
                            <Input
                              id="cardName"
                              value={formData.cardName}
                              onChange={(e) => handleInputChange('cardName', e.target.value)}
                              placeholder="JEAN DUPONT"
                              required
                              className="transition-colors dark:bg-gray-700 dark:border-gray-600"
                            />
                          </div>

                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="text-green-600">🔒</span>
                            Paiement 100% sécurisé • Chiffrement SSL • Données protégées
                          </p>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>💵 Paiement en espèces sur place</strong>
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                            Vous devrez payer <strong>{totalPrice.toFixed(2)}€</strong> en espèces à l'entrée de l'événement. Votre réservation sera confirmée mais le paiement restera en attente.
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          onClick={() => setCurrentStep(quantity === 1 ? 1 : 2)}
                          variant="outline"
                          className="flex-1"
                        >
                          Retour
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          variant="hero"
                          className="flex-1"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Traitement...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Confirmer la réservation
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 transition-colors duration-200 dark:bg-gray-800 dark:border-gray-700 border-2 border-primary">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-2 dark:text-white">{event.title}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 text-primary" />
                      {format(new Date(event.date), 'EEEE d MMMM yyyy', { locale: fr })}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4 text-primary" />
                      {quantity} place{quantity > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Prix unitaire</span>
                    <span className="font-semibold dark:text-white">{event.price?.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantité</span>
                    <span className="font-semibold dark:text-white">x{quantity}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold dark:text-white">Total</span>
                  <span className="text-3xl font-bold text-primary">
                    {totalPrice.toFixed(2)}€
                  </span>
                </div>

                <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                  <p>✓ Confirmation immédiate</p>
                  <p>✓ {quantity} QR code{quantity > 1 ? 's' : ''} par email</p>
                  <p>✓ Paiement sécurisé</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
