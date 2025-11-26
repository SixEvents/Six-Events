import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getStripe } from '../lib/stripe';
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
import { generateQRCodeData, generateUniqueCode, generateQRCodeDataURL } from '../lib/qrcode';

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
    paymentMethod: 'stripe',
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
    // Transferência bancária não precisa de validação extra
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
      // Se o método for Stripe, processar checkout Stripe
      if (formData.paymentMethod === 'stripe') {
        await handleStripeCheckout();
        return;
      }

      // Se for Cash, criar reserva pendente diretamente
      // 🔒 VERIFICAÇÃO DE SEGURANÇA: Verificar disponibilidade antes de criar reserva
      const { data: currentEvent, error: eventError } = await supabase
        .from('events')
        .select('available_places')
        .eq('id', event.id)
        .single();

      if (eventError) {
        throw new Error('Impossible de vérifier la disponibilité');
      }

      if (!currentEvent || (currentEvent.available_places || 0) < quantity) {
        toast.error(
          `Désolé, seulement ${currentEvent?.available_places || 0} place(s) disponible(s). ` +
          `Veuillez réduire votre réservation.`
        );
        setLoading(false);
        return;
      }

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
          payment_status: 'pending', // Cash payment pending until validated at entrance
          status: 'confirmed' // Reservation confirmed, but payment pending
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      // 2. Criar tickets individuais com QR codes
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

      // 4. Enfileirar email de confirmação (mesmo para cash)
      // Gerar QR Codes como imagens
      const qrCodes = [];
      for (const ticket of tickets) {
        const dataUrl = await generateQRCodeDataURL(ticket.qr_code_data);
        qrCodes.push({
          name: ticket.participant_name,
          dataUrl,
        });
      }

      await supabase
        .from('email_queue')
        .insert({
          type: 'reservation_confirmation',
          recipient_email: formData.buyerEmail,
          data: JSON.stringify({
            eventName: event.title,
            eventDate: event.date,
            eventLocation: event.location,
            ticketCount: quantity,
            participants: allParticipants,
            totalAmount: totalPrice,
            qrCodes,
          }),
          status: 'pending',
        });

      setSuccess(true);
      toast.success('Réservation enregistrée!');
      
      // Redirecionar para reservas
      setTimeout(() => {
        navigate('/profile/reservations');
      }, 2000);
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      toast.error('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    try {
      // 🔒 VERIFICAÇÃO DE SEGURANÇA: Verificar disponibilidade ANTES de criar sessão Stripe
      const { data: currentEvent, error: eventError } = await supabase
        .from('events')
        .select('available_places')
        .eq('id', event.id)
        .single();

      if (eventError) {
        throw new Error('Impossible de vérifier la disponibilité');
      }

      if (!currentEvent || (currentEvent.available_places || 0) < quantity) {
        toast.error(
          `Désolé, seulement ${currentEvent?.available_places || 0} place(s) disponible(s). ` +
          `Veuillez réduire votre réservation.`
        );
        setLoading(false);
        return;
      }

      const stripe = await getStripe();
      
      if (!stripe) {
        throw new Error('Stripe n\'est pas configuré correctement');
      }

      // Preparar participantes
      const allParticipants = [formData.buyerName, ...formData.participants];

      // Criar sessão de checkout via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          eventLocation: event.location,
          quantity,
          totalPrice,
          buyerName: formData.buyerName,
          buyerEmail: formData.buyerEmail,
          buyerPhone: formData.buyerPhone,
          participants: allParticipants,
          userId: user?.id
        }
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        throw new Error('Impossible de créer la session de paiement');
      }

      if (!data?.sessionId) {
        throw new Error('Session de paiement invalide');
      }

      // Redirecionar para Stripe Checkout
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      });

      if (stripeError) {
        console.error('Stripe redirect error:', stripeError);
        throw new Error(stripeError.message);
      }
    } catch (error: any) {
      console.error('Stripe checkout error:', error);
      toast.error(error.message || 'Erreur lors du processus de paiement');
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
          <h2 className="text-3xl font-bold mb-4 dark:text-white">Réservation Enregistrée!</h2>
          <p className="text-muted-foreground mb-4">
            Votre réservation pour <strong>{event.title}</strong> a été enregistrée.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-bold text-yellow-900 dark:text-yellow-100 mb-2">
              ⏳ En attente de validation de paiement
            </p>
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              Votre réservation sera confirmée dès réception du virement bancaire (24-48h ouvrées)
            </p>
          </div>

          <Badge variant="secondary" className="mb-6 text-base px-4 py-2">
            💳 Virement bancaire: {totalPrice.toFixed(2)}€
          </Badge>

          <p className="text-sm text-muted-foreground mb-8">
            Vous recevrez vos {quantity} QR code{quantity > 1 ? 's' : ''} par email (<strong>{formData.buyerEmail}</strong>) après confirmation du paiement.
          </p>

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
                      <h3 className="text-xl font-bold">Choisir le mode de paiement</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Stripe (Cartão) */}
                        <button
                          type="button"
                          onClick={() => handleInputChange('paymentMethod', 'stripe')}
                          className={`p-6 border-2 rounded-lg text-left transition-all ${
                            formData.paymentMethod === 'stripe'
                              ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <CreditCard className="w-8 h-8 text-pink-600" />
                            <h4 className="font-bold text-lg">💳 Carte Bancaire (Stripe)</h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Paiement en ligne sécurisé instantané
                          </p>
                          <div className="mt-2 flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">Visa</Badge>
                            <Badge variant="outline" className="text-xs">Mastercard</Badge>
                            <Badge variant="outline" className="text-xs">Amex</Badge>
                          </div>
                        </button>

                        {/* Dinheiro */}
                        <button
                          type="button"
                          onClick={() => handleInputChange('paymentMethod', 'cash')}
                          className={`p-6 border-2 rounded-lg text-left transition-all ${
                            formData.paymentMethod === 'cash'
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Banknote className="w-8 h-8 text-green-600" />
                            <h4 className="font-bold text-lg">Espèces</h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Payez en espèces sur place le jour de l'événement
                          </p>
                        </button>
                      </div>

                      {/* Informações do Stripe */}
                      {formData.paymentMethod === 'stripe' && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
                          <div className="flex items-start gap-3 mb-4">
                            <CreditCard className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                              <h4 className="font-bold text-lg text-blue-900 dark:text-blue-100 mb-2">
                                🔒 Paiement Sécurisé par Stripe
                              </h4>
                              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                                Vous serez redirigé vers la page de paiement sécurisée Stripe
                              </p>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3 border border-blue-200 dark:border-blue-700">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <p className="text-sm text-gray-700 dark:text-gray-300">Paiement instantané et sécurisé</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <p className="text-sm text-gray-700 dark:text-gray-300">Confirmation immédiate par email</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <p className="text-sm text-gray-700 dark:text-gray-300">QR codes envoyés automatiquement</p>
                            </div>
                            
                            <Separator />

                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Montant total</p>
                              <p className="font-bold text-2xl text-blue-600">{totalPrice.toFixed(2)}€</p>
                            </div>
                          </div>

                          <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-300 dark:border-indigo-700 rounded-lg p-4">
                            <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-5 h-5" />
                              🔄 Prochaine étape
                            </p>
                            <p className="text-xs text-indigo-800 dark:text-indigo-200">
                              En cliquant sur "Procéder au paiement", vous serez redirigé vers la page de paiement sécurisée <strong>Stripe</strong> pour finaliser votre commande avec votre carte bancaire.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Detalhes do dinheiro */}
                      {formData.paymentMethod === 'cash' && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-6">
                          <p className="text-sm font-bold text-yellow-900 dark:text-yellow-100 mb-3">
                            💵 Paiement en Espèces sur Place
                          </p>
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                            Vous devrez payer <strong className="text-lg">{totalPrice.toFixed(2)}€</strong> en espèces le jour de l'événement à l'entrée.
                          </p>
                          <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1 ml-4">
                            <li>• Votre réservation sera enregistrée mais <strong>non confirmée</strong></li>
                            <li>• Amenez le montant exact si possible</li>
                            <li>• Présentez votre QR code à l'entrée</li>
                          </ul>
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
                              {formData.paymentMethod === 'stripe' ? 'Redirection vers Stripe...' : 'Traitement...'}
                            </>
                          ) : (
                            <>
                              {formData.paymentMethod === 'stripe' ? (
                                <>
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Procéder au paiement Stripe
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Confirmer la réservation
                                </>
                              )}
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
