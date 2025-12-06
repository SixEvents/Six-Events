import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function PaymentCancelled() {
  const navigate = useNavigate();

  useEffect(() => {
    // Limpar qualquer estado de checkout temporário
    // sessionStorage.removeItem('checkout_session');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="border-2 border-orange-200 shadow-2xl">
          <CardContent className="p-12 text-center">
            {/* Cancel Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-8"
            >
              <XCircle className="w-16 h-16 text-orange-600" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              Paiement annulé
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-600 mb-8"
            >
              Votre paiement a été annulé. Aucune somme n'a été débitée.
            </motion.p>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8"
            >
              <div className="flex items-start space-x-3">
                <HelpCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Que s'est-il passé ?
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Vous avez annulé le processus de paiement</li>
                    <li>• Aucune réservation n'a été créée</li>
                    <li>• Vous pouvez réessayer à tout moment</li>
                    <li>• Ou choisir le paiement en espèces si disponible</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Help Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8"
            >
              <div className="flex items-start space-x-3">
                <HelpCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <h3 className="font-semibold text-yellow-900 mb-2">
                    Problème avec le paiement ?
                  </h3>
                  <p className="text-sm text-yellow-800">
                    Si vous rencontrez des difficultés, contactez-nous à{' '}
                    <a href="mailto:support@sixevents.com" className="underline font-semibold">
                      support@sixevents.com
                    </a>{' '}
                    ou essayez ces solutions :
                  </p>
                  <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                    <li>• Vérifiez les fonds disponibles sur votre carte</li>
                    <li>• Assurez-vous que votre carte est activée pour les paiements en ligne</li>
                    <li>• Essayez avec une autre carte bancaire</li>
                    <li>• Optez pour le paiement en espèces sur place</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                onClick={() => navigate(-1)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Réessayer le paiement
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/events')}
              >
                Retour aux événements
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
                Votre panier a été conservé. Vous pouvez continuer votre réservation à tout moment.
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
