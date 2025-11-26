import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Stripe from 'stripe';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { AlertCircle, CheckCircle2, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function RecoverReservation() {
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const recoverReservation = async () => {
    if (!sessionId.trim()) {
      toast.error('Veuillez entrer un Session ID');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Verificar se já existe reserva
      const { data: existingReservation } = await supabase
        .from('reservations')
        .select('*')
        .eq('stripe_checkout_session_id', sessionId)
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

      // Chamar Edge Function para recuperar do Stripe e criar reserva
      const { data, error } = await supabase.functions.invoke('recover-stripe-payment', {
        body: { sessionId }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult({
        success: true,
        message: 'Réservation récupérée avec succès',
        reservation: data.reservation,
      });
      toast.success('Réservation créée avec succès !');
    } catch (error: any) {
      console.error('Error:', error);
      setResult({
        success: false,
        message: error.message || 'Erreur lors de la récupération',
      });
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
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
                <li>• Si votre paiement a été accepté mais la réservation n'apparaît pas</li>
                <li>• Collez le Session ID (cs_live_...) ci-dessous</li>
                <li>• Cliquez sur "Récupérer" pour créer la réservation</li>
              </ul>
            </div>

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
                Vous pouvez trouver le Session ID dans l'URL après le paiement ou dans votre email Stripe
              </p>
            </div>

            <Button
              onClick={recoverReservation}
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
                    <div>
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
                            onClick={() => window.location.href = '/profile/reservations'}
                            variant="outline"
                            size="sm"
                            className="mt-4"
                          >
                            Voir mes réservations
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
