import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, Search, Mail, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function RecoverReservation() {
  const [sessionId, setSessionId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stripePayments, setStripePayments] = useState<any[]>([]);

  const searchByEmail = async () => {
    if (!email.trim()) {
      toast.error('Veuillez entrer un email');
      return;
    }

    setLoading(true);
    setStripePayments([]);
    setResult(null);

    try {
      // Buscar pagamentos Stripe por email
      const { data, error } = await supabase.functions.invoke('search-stripe-payments', {
        body: { email: email.trim() }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      if (!data.payments || data.payments.length === 0) {
        toast.warning('Aucun paiement trouvé pour cet email');
        setStripePayments([]);
        return;
      }

      setStripePayments(data.payments);
      toast.success(`${data.payments.length} paiement(s) trouvé(s)`);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const recoverBySessionId = async () => {
    if (!sessionId.trim()) {
      toast.error('Veuillez entrer un Session ID');
      return;
    }

    await recoverPayment(sessionId.trim());
  };

  const recoverPayment = async (sid: string) => {
    setLoading(true);
    setResult(null);

    try {
      // Verificar se já existe reserva
      const { data: existingReservation } = await supabase
        .from('reservations')
        .select('*')
        .eq('stripe_checkout_session_id', sid)
        .maybeSingle();

      if (existingReservation) {
        setResult({
          success: true,
          message: 'Réservation déjà existante',
          reservation: existingReservation,
        });
        toast.success('Réservation trouvée !');
        return;
      }

      // Chamar função de recuperação
      const { data, error } = await supabase.functions.invoke('recover-stripe-payment', {
        body: { sessionId: sid }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setResult({
        success: true,
        message: 'Réservation créée avec succès',
        reservation: data.reservation,
      });
      toast.success('Réservation récupérée !');
      
      // Recarregar lista se buscou por email
      if (email) {
        setTimeout(() => searchByEmail(), 1000);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setResult({
        success: false,
        message: error.message || 'Erreur',
      });
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Search className="w-6 h-6 text-primary" />
              Récupérer une Réservation Stripe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Instructions</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Si votre paiement Stripe a été accepté mais la réservation n'apparaît pas</li>
                <li>• Cherchez par email OU par Session ID</li>
                <li>• Cliquez sur "Récupérer" pour créer la réservation manquante</li>
              </ul>
            </div>

            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">
                  <Mail className="w-4 h-4 mr-2" />
                  Par Email
                </TabsTrigger>
                <TabsTrigger value="session">
                  <Search className="w-4 h-4 mr-2" />
                  Par Session ID
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="email">Email du client</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="client@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button
                  onClick={searchByEmail}
                  disabled={loading || !email.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recherche en cours...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Rechercher les paiements
                    </>
                  )}
                </Button>

                {stripePayments.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h4 className="font-semibold">Paiements trouvés ({stripePayments.length})</h4>
                    {stripePayments.map((payment: any, index: number) => (
                      <Card key={index} className="bg-gray-50">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">
                                  {payment.created ? format(new Date(payment.created * 1000), 'dd/MM/yyyy HH:mm') : 'Date inconnue'}
                                </span>
                              </div>
                              {payment.metadata?.event_title && (
                                <p className="font-medium">{payment.metadata.event_title}</p>
                              )}
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-green-600">
                                  {payment.metadata?.total_price || payment.amount_total / 100}€
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant={payment.payment_status === 'paid' ? 'default' : 'secondary'}>
                                  {payment.payment_status}
                                </Badge>
                                {payment.hasReservation ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    ✓ Réservation existante
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                    ⚠ Réservation manquante
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 font-mono">
                                {payment.id.substring(0, 30)}...
                              </p>
                            </div>
                            
                            {!payment.hasReservation && (
                              <Button
                                onClick={() => recoverPayment(payment.id)}
                                disabled={loading}
                                size="sm"
                                variant="outline"
                                className="border-primary text-primary hover:bg-primary hover:text-white"
                              >
                                {loading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  'Récupérer'
                                )}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="session" className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="sessionId">Session ID Stripe</Label>
                  <Input
                    id="sessionId"
                    placeholder="cs_live_a1dktDnftZZvHUnFjTS9MRPs..."
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Trouvez-le dans l'URL après le paiement ou dans les logs
                  </p>
                </div>

                <Button
                  onClick={recoverBySessionId}
                  disabled={loading || !sessionId.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Récupération en cours...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Récupérer la Réservation
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            {result && (
              <Card className={`${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-2 ${
                        result.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {result.message}
                      </h4>
                      {result.reservation && (
                        <div className="text-sm space-y-1">
                          <p>ID: {result.reservation.id}</p>
                          <p>Email: {result.reservation.buyer_email}</p>
                          <p>Places: {result.reservation.number_of_places}</p>
                          <p>Prix: {result.reservation.total_price}€</p>
                          <Button
                            onClick={() => window.location.href = '/admin/reservations'}
                            variant="outline"
                            size="sm"
                            className="mt-4"
                          >
                            Voir les réservations
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
