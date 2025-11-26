import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [checking, setChecking] = useState(true);
  const [reservationFound, setReservationFound] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (sessionId) {
      checkReservation();
    } else {
      setChecking(false);
    }
  }, [sessionId]);

  const checkReservation = async () => {
    try {
      setChecking(true);
      
      // Verificar se já existe uma reserva com este session_id
      const { data, error } = await supabase
        .from('reservations')
        .select('id, buyer_email, status')
        .eq('stripe_checkout_session_id', sessionId)
        .maybeSingle();

      if (error) {
        console.error('Error checking reservation:', error);
      }

      if (data) {
        setReservationFound(true);
        console.log('✅ Reservation found:', (data as any).id);
      } else {
        setReservationFound(false);
        console.log('⚠️ Reservation not found for session:', sessionId);
        
        // Avisar após 3 segundos se não encontrar
        setTimeout(() => {
          if (!reservationFound) {
            toast.warning('Réservation en cours de traitement...', {
              description: 'Cela peut prendre quelques secondes.'
            });
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setChecking(false);
    }
  };

  const retryWebhook = async () => {
    setRetrying(true);
    try {
      // Tentar reprocessar manualmente
      toast.info('Vérification en cours...');
      
      // Esperar 5 segundos para dar tempo ao webhook processar
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await checkReservation();
      
      if (reservationFound) {
        toast.success('Réservation trouvée !');
      } else {
        toast.error('Réservation non trouvée. Contactez le support avec votre ID de session.');
      }
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="border-2 border-green-200 shadow-2xl">
          <CardContent className="p-12 text-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"
            >
              <CheckCircle2 className="w-16 h-16 text-green-600" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              Paiement réussi ! 🎉
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-600 mb-8"
            >
              Votre réservation a été confirmée avec succès
            </motion.p>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`border rounded-xl p-6 mb-8 ${
                checking ? 'bg-gray-50 border-gray-200' :
                reservationFound ? 'bg-blue-50 border-blue-200' : 
                'bg-orange-50 border-orange-200'
              }`}
            >
              {checking ? (
                <div className="flex items-center justify-center space-x-3">
                  <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
                  <p className="text-gray-600">Vérification de votre réservation...</p>
                </div>
              ) : reservationFound ? (
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="text-left">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      📧 Email de confirmation envoyé
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>✓ Vérifiez votre boîte de réception</li>
                      <li>✓ Vous y trouverez tous les détails de votre réservation</li>
                      <li>✓ Vos QR codes sont inclus dans l'email</li>
                      <li>✓ Conservez cet email jusqu'au jour de l'événement</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div className="text-left w-full">
                    <h3 className="font-semibold text-orange-900 mb-2">
                      ⏳ Réservation en cours de traitement
                    </h3>
                    <p className="text-sm text-orange-800 mb-4">
                      Votre paiement a été accepté mais la réservation n'apparaît pas encore. 
                      Cela peut prendre quelques secondes.
                    </p>
                    <Button
                      onClick={retryWebhook}
                      disabled={retrying}
                      size="sm"
                      variant="outline"
                      className="border-orange-600 text-orange-600 hover:bg-orange-100"
                    >
                      {retrying ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Vérification...
                        </>
                      ) : (
                        'Vérifier à nouveau'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Session ID (for debugging) */}
            {sessionId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-6"
              >
                <p className="text-xs text-gray-400 font-mono mb-2">
                  Session: {sessionId.substring(0, 30)}...
                </p>
                {!reservationFound && !checking && (
                  <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    💡 Si la réservation n'apparaît pas après plusieurs tentatives, 
                    copiez cet ID de session et contactez le support.
                  </p>
                )}
              </motion.div>
            )}

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                onClick={() => navigate('/profile/reservations')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                Voir mes réservations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/events')}
              >
                Parcourir d'autres événements
              </Button>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 pt-8 border-t border-gray-200"
            >
              <p className="text-sm text-gray-500">
                Vous ne trouvez pas l'email ? Vérifiez vos spams ou contactez-nous à{' '}
                <a href="mailto:support@sixevents.com" className="text-pink-600 hover:underline">
                  support@sixevents.com
                </a>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
