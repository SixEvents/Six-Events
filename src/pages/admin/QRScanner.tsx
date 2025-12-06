import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { decodeQRCodeData } from '../../lib/qrcode';
import { Ticket, Reservation, ValidationResult } from '../../types';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  LogOut, 
  LogIn, 
  RefreshCw,
  AlertCircle,
  User,
  Mail,
  Phone,
  Calendar,
  Hash,
  Scan
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type ValidationAction = 'entry' | 'exit' | 'reentry';

export default function QRScanner() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [action, setAction] = useState<ValidationAction>('entry');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationPhone, setVerificationPhone] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [pendingQRData, setPendingQRData] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [stats, setStats] = useState({ total: 0, validated: 0, inside: 0 });

  useEffect(() => {
    if (scanning && !scannerReady) {
      initScanner();
    }
    loadStats();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [scanning]);

  const loadStats = async () => {
    try {
      const { count: total } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true });
      
      const { count: validated } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'validated');
      
      const { count: inside } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'temporarily_valid');

      setStats({ 
        total: total || 0, 
        validated: validated || 0, 
        inside: inside || 0 
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const initScanner = () => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    scanner.render(
      (decodedText) => {
        handleScan(decodedText);
        playSound(true);
      },
      (error) => {
        // Ignorar erros de scan contínuo
      }
    );

    scannerRef.current = scanner;
    setScannerReady(true);
  };

  const playSound = (success: boolean) => {
    const audio = new Audio(success 
      ? 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuC0fPTgjMGGGS57OihUQ=='
      : 'data:audio/wav;base64,UklGRhIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRh7gAAAAAAAAAAAAAAAAA=');
    audio.play().catch(() => {});
  };

  const handleScan = async (qrData: string) => {
    if (action === 'reentry') {
      setPendingQRData(qrData);
      setShowVerification(true);
      setScanning(false);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        setScannerReady(false);
      }
      return;
    }

    await validateQRCode(qrData);
  };

  const validateQRCode = async (qrData: string, email?: string, phone?: string) => {
    try {
      // Decodificar QR Code
      const decoded = decodeQRCodeData(qrData);
      if (!decoded) {
        playSound(false);
        setValidationResult({
          success: false,
          message: 'QR Code invalide ou corrompu',
          action: 'deny_entry'
        });
        return;
      }

      // Buscar ticket no banco
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*, reservation:reservations(*)')
        .eq('qr_code_data', qrData)
        .single();

      if (ticketError || !ticket) {
        playSound(false);
        setValidationResult({
          success: false,
          message: 'Ticket non trouvé',
          action: 'deny_entry'
        });
        
        // Registrar tentativa falhada
        await supabase.from('qr_code_validations').insert({
          ticket_id: null,
          action,
          validated_by: user?.id || 'unknown',
          success: false,
          notes: 'Ticket not found'
        });
        return;
      }

      // Verificar status
      if (ticket.status === 'cancelled') {
        playSound(false);
        setValidationResult({
          success: false,
          message: 'Ticket annulé',
          action: 'deny_entry',
          ticket
        });
        return;
      }

      // Validar baseado na ação
      if (action === 'entry') {
        if (ticket.status === 'used') {
          playSound(false);
          setValidationResult({
            success: false,
            message: `Ticket déjà utilisé le ${new Date(ticket.validated_at).toLocaleString('fr-FR')}`,
            action: 'already_used',
            ticket
          });
          return;
        }

        // Marcar como usado
        await supabase
          .from('tickets')
          .update({ 
            status: 'used', 
            validated_at: new Date().toISOString(),
            validated_by: user?.id
          })
          .eq('id', ticket.id);

        playSound(true);
        setValidationResult({
          success: true,
          message: 'Entrée confirmée!',
          action: 'allow_entry',
          ticket,
          reservation: ticket.reservation
        });
      } else if (action === 'exit') {
        if (ticket.status !== 'used') {
          playSound(false);
          setValidationResult({
            success: false,
            message: 'Ticket non validé à l\'entrée',
            action: 'deny_entry',
            ticket
          });
          return;
        }

        // Marcar como temporariamente válido
        await supabase
          .from('tickets')
          .update({ status: 'temporarily_valid' })
          .eq('id', ticket.id);

        playSound(true);
        setValidationResult({
          success: true,
          message: 'Sortie enregistrée',
          action: 'allow_entry',
          ticket
        });
      } else if (action === 'reentry') {
        if (ticket.status !== 'temporarily_valid') {
          playSound(false);
          setValidationResult({
            success: false,
            message: 'Ticket non autorisé pour réentrée',
            action: 'deny_entry',
            ticket
          });
          return;
        }

        // Verificar identidade
        const reservation = ticket.reservation as Reservation;
        if (email && email !== reservation.buyer_email) {
          playSound(false);
          setValidationResult({
            success: false,
            message: 'Email ne correspond pas',
            action: 'deny_entry',
            ticket
          });
          return;
        }
        if (phone && phone !== reservation.buyer_phone) {
          playSound(false);
          setValidationResult({
            success: false,
            message: 'Téléphone ne correspond pas',
            action: 'deny_entry',
            ticket
          });
          return;
        }

        // Marcar como usado novamente
        await supabase
          .from('tickets')
          .update({ status: 'used' })
          .eq('id', ticket.id);

        playSound(true);
        setValidationResult({
          success: true,
          message: 'Réentrée autorisée!',
          action: 'allow_entry',
          ticket
        });
      }

      // Registrar validação
      await supabase.from('qr_code_validations').insert({
        ticket_id: ticket.id,
        action,
        validated_by: user?.id || 'unknown',
        success: true,
        verification_email: email,
        verification_phone: phone
      });

    } catch (error) {
      console.error('Validation error:', error);
      playSound(false);
      setValidationResult({
        success: false,
        message: 'Erreur de validation',
        action: 'deny_entry'
      });
    } finally {
      setScanning(false);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        setScannerReady(false);
      }
    }
  };

  const handleVerificationSubmit = () => {
    if (!verificationEmail && !verificationPhone) {
      toast.error('Veuillez entrer l\'email ou le téléphone');
      return;
    }
    
    if (pendingQRData) {
      validateQRCode(pendingQRData, verificationEmail, verificationPhone);
      setShowVerification(false);
      setPendingQRData(null);
      setVerificationEmail('');
      setVerificationPhone('');
    }
  };

  const resetScanner = () => {
    setValidationResult(null);
    setScanning(true);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 transition-colors duration-200">
      <div className="container mx-auto max-w-4xl">
        <Card className="transition-colors duration-200 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Camera className="w-6 h-6 text-primary" />
              Scanner QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Action Selector */}
            <div>
              <Label className="mb-3 block">Type de validation</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAction('entry')}
                  disabled={scanning}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    action === 'entry'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-500/50'
                  }`}
                >
                  <LogIn className="w-6 h-6" />
                  <span className="font-semibold text-sm">Entrée</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setAction('exit')}
                  disabled={scanning}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    action === 'exit'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-orange-500/50'
                  }`}
                >
                  <LogOut className="w-6 h-6" />
                  <span className="font-semibold text-sm">Sortie</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setAction('reentry')}
                  disabled={scanning}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    action === 'reentry'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-500/50'
                  }`}
                >
                  <RefreshCw className="w-6 h-6" />
                  <span className="font-semibold text-sm">Réentrée</span>
                </button>
              </div>
            </div>

            {/* Scanner */}
            {!scanning && !validationResult && !showVerification && (
              <Button
                onClick={() => setScanning(true)}
                variant="hero"
                size="lg"
                className="w-full"
              >
                <Camera className="w-5 h-5 mr-2" />
                Commencer le scan
              </Button>
            )}

            {scanning && (
              <div className="space-y-4">
                <div id="qr-reader" className="rounded-lg overflow-hidden" />
                <Button
                  onClick={() => {
                    setScanning(false);
                    if (scannerRef.current) {
                      scannerRef.current.clear().catch(console.error);
                      setScannerReady(false);
                    }
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Annuler
                </Button>
              </div>
            )}

            {/* Verification Form (for reentry) */}
            <AnimatePresence>
              {showVerification && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-blue-600" />
                    <h3 className="font-bold text-lg">Vérification d'identité</h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Pour la réentrée, veuillez confirmer l'email OU le téléphone du participant:
                  </p>

                  <div>
                    <Label htmlFor="verif-email">Email</Label>
                    <Input
                      id="verif-email"
                      type="email"
                      value={verificationEmail}
                      onChange={(e) => setVerificationEmail(e.target.value)}
                      placeholder="exemple@email.com"
                      className="transition-colors dark:bg-gray-700"
                    />
                  </div>

                  <div className="text-center text-sm text-muted-foreground">OU</div>

                  <div>
                    <Label htmlFor="verif-phone">Téléphone</Label>
                    <Input
                      id="verif-phone"
                      type="tel"
                      value={verificationPhone}
                      onChange={(e) => setVerificationPhone(e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      className="transition-colors dark:bg-gray-700"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setShowVerification(false);
                        setPendingQRData(null);
                        setVerificationEmail('');
                        setVerificationPhone('');
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleVerificationSubmit}
                      variant="hero"
                      className="flex-1"
                    >
                      Vérifier
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Validation Result */}
            <AnimatePresence>
              {validationResult && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={`p-8 rounded-lg border-2 text-center space-y-4 ${
                    validationResult.success
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                  }`}
                >
                  {validationResult.success ? (
                    <>
                      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-12 h-12 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-green-700 dark:text-green-300">
                        {validationResult.message}
                      </h2>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                        <XCircle className="w-12 h-12 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-red-700 dark:text-red-300">
                        {validationResult.message}
                      </h2>
                    </>
                  )}

                  {validationResult.ticket && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2 text-left">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{validationResult.ticket.participant_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Hash className="w-4 h-4" />
                        Billet #{validationResult.ticket.ticket_number}
                      </div>
                      {validationResult.reservation && (
                        <>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            {validationResult.reservation.buyer_email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            {validationResult.reservation.buyer_phone}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={resetScanner}
                    variant="hero"
                    size="lg"
                    className="w-full"
                  >
                    Scanner un autre QR Code
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
