import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { ScanActionSelect, ScanAction } from '../../components/ui/scan-action-select';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  Camera, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  Zap,
  User,
  Mail,
  Phone,
  Hash,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface ScanResult {
  success: boolean;
  message: string;
  ticket?: any;
  reservation?: any;
}

export default function ModernQRScanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerInitialized = useRef(false);
  const [scanAction, setScanAction] = useState<ScanAction>('entry');

  useEffect(() => {
    // Récupérer l'événement sélectionné
    const eventId = localStorage.getItem('selectedEventForScan');
    if (!eventId) {
      navigate('/admin/select-event-scan');
      return;
    }
    setSelectedEventId(eventId);
    loadEventName(eventId);
  }, [navigate]);

  const loadEventName = async (eventId: string) => {
    const { data } = await supabase
      .from('events')
      .select('title, name')
      .eq('id', eventId)
      .single();
    
    if (data) setEventName(data.title || data.name);
  };

  const playSound = (type: 'success' | 'error' | 'warning') => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'success') {
      // Son de succès: 2 bips montants
      oscillator.frequency.value = 800;
      oscillator.start();
      setTimeout(() => {
        oscillator.frequency.value = 1000;
      }, 100);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
    } else if (type === 'error') {
      // Son d'erreur: bip descendant
      oscillator.frequency.value = 400;
      oscillator.start();
      setTimeout(() => {
        oscillator.frequency.value = 200;
      }, 150);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.4);
    } else {
      // Son d'avertissement: bip moyen
      oscillator.frequency.value = 600;
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.2);
    }
  };

  const startScanning = async () => {
    try {
      setScanning(true);
      setResult(null);

      // Verificar suporte do navegador
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('❌ Seu navegador não suporta acesso à câmera!\n\nUse Chrome, Firefox, Safari ou Edge atualizado.');
        setScanning(false);
        return;
      }

      console.log('Iniciando scanner...');
      console.log('Navigator.mediaDevices:', navigator.mediaDevices);

      // PASSO 1: Primeiro pedir permissão explicitamente
      let stream: MediaStream;
      try {
        // Tentar câmera traseira primeiro
        console.log('Tentando câmera traseira...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (err) {
        console.log('Câmera traseira falhou, tentando frontal...', err);
        // Se falhar, tentar câmera frontal
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      }

      console.log('Permissão obtida! Stream:', stream);
      
      // Parar o stream temporário
      stream.getTracks().forEach(track => track.stop());
      
      // PASSO 2: Agora iniciar o html5-qrcode (já tem permissão)
      if (!scannerRef.current && !scannerInitialized.current) {
        scannerInitialized.current = true;
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      // Listar câmeras disponíveis
      const devices = await Html5Qrcode.getCameras();
      console.log('Câmeras disponíveis:', devices);

      if (devices && devices.length > 0) {
        // Priorizar câmera traseira
        let cameraId = devices[0].id;
        for (const device of devices) {
          if (device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('traseira') || device.label.toLowerCase().includes('arrière')) {
            cameraId = device.id;
            break;
          }
        }
        console.log('Usando câmera:', cameraId);
        await scannerRef.current?.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          async (decodedText) => {
            console.log('QR Code detectado:', decodedText);
            await stopScanning();
            await validateQRCode(decodedText);
          },
          (errorMessage) => {
            // Ignorar erros de scan
          }
        );
        console.log('Scanner iniciado com sucesso!');
      } else {
        throw new Error('Nenhuma câmera disponível');
      }

    } catch (error: any) {
      console.error('Erro completo:', error);
      console.error('Stack:', error?.stack);
      
      let errorMsg = '❌ Erro ao acessar câmera\n\n';
      
      if (error?.name === 'NotAllowedError' || error?.message?.includes('Permission')) {
        errorMsg += '🔒 Permissão negada!\n\n';
        errorMsg += 'Clique no ícone 🔒 na barra de endereço e permita o acesso à câmera.';
      } else if (error?.name === 'NotFoundError' || error?.message?.includes('camera')) {
        errorMsg += '📷 Câmera não encontrada!\n\n';
        errorMsg += 'Verifique se seu dispositivo tem câmera e se está funcionando.';
      } else if (error?.name === 'NotReadableError' || error?.message?.includes('use')) {
        errorMsg += '⚠️ Câmera em uso!\n\n';
        errorMsg += 'Feche outros apps que usam a câmera e tente novamente.';
      } else {
        errorMsg += `Tipo: ${error?.name || 'Desconhecido'}\n`;
        errorMsg += `Info: ${error?.message || 'Sem detalhes'}\n\n`;
        errorMsg += '💡 Tente:\n';
        errorMsg += '• Recarregar a página\n';
        errorMsg += '• Usar Chrome ou Safari\n';
        errorMsg += '• Verificar se câmera funciona em outros apps';
      }
      
      alert(errorMsg);
      setScanning(false);
      scannerInitialized.current = false;
      scannerRef.current = null;
    }
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current && scanning) {
        await scannerRef.current.stop();
      }
      setScanning(false);
    } catch (error) {
      console.error('Erreur arrêt scanner:', error);
      setScanning(false);
    }
  };

  const validateQRCode = async (qrData: string) => {
    try {
      // Vérifier le ticket dans la base de données
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          reservation:reservations(*)
        `)
        .eq('qr_code_data', qrData)
        .single();

      const ticket: any = data;

      if (error || !ticket) {
        playSound('error');
        setResult({
          success: false,
          message: '❌ Billet non trouvé'
        });
        return;
      }

      // Vérifier si le billet appartient à l'événement sélectionné
      if (ticket.reservation.event_id !== selectedEventId) {
        playSound('error');
        setResult({
          success: false,
          message: '❌ Ce billet n\'est pas pour cet événement',
          ticket
        });
        return;
      }

      // Vérifier le statut
      if (ticket.status === 'cancelled') {
        playSound('error');
        setResult({
          success: false,
          message: '❌ Billet annulé',
          ticket
        });
        return;
      }
      
      // PERMITIR scan para exit e reentry mesmo se já foi escaneado
      // Apenas para 'entry', bloquear se já estava marcado como used
      if (scanAction === 'entry' && ticket.status === 'used') {
        playSound('warning');
        const validatedDate = new Date(ticket.validated_at).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        // Permitir o scan de exit/reentry mesmo se já foi entrada
        console.log('Ação permitida: já foi escaneado como entrada em', validatedDate);
      }

      // Marquer como usado na entrada (para rastrear que entrou)
      if (scanAction === 'entry' && ticket.status !== 'used') {
        const { error: updateError } = await supabase
          .from('tickets')
          .update({
            status: 'used',
            validated_at: new Date().toISOString(),
            validated_by: user?.id
          })
          .eq('id', ticket.id);

        if (updateError) {
          throw updateError;
        }
      }
      
      // Para exit e reentry, NÃO mudar o status (apenas registrar no qr_code_validations)
      // Isso permite múltiplos scans


      // Enregistrer la validation
      await supabase.from('qr_code_validations').insert({
        ticket_id: ticket.id,
        action: scanAction,
        validated_by: user?.id || 'unknown',
        success: true
      });

      playSound('success');

      let msg = '✅ ENTRÉE VALIDÉE';
      if (scanAction === 'exit') msg = '✅ SORTIE VALIDÉE';
      if (scanAction === 'reentry') msg = '✅ RE-ENTRÉE VALIDÉE';
      setResult({
        success: true,
        message: msg,
        ticket,
        reservation: ticket.reservation
      });

    } catch (error) {
      console.error('Erreur de validation:', error);
      playSound('error');
      setResult({
        success: false,
        message: '❌ Erreur de validation'
      });
    }
  };

  const resetScanner = () => {
    setResult(null);
    startScanning();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b-4 border-purple-500">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/admin/select-event-scan')}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                Scanner QR Code
              </h1>
              {eventName && (
                <p className="text-sm text-muted-foreground mt-1">
                  {eventName}
                </p>
              )}
            </div>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <AnimatePresence mode="wait">
          {!scanning && !result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="overflow-hidden border-4 border-purple-200 dark:border-purple-800">
                <CardContent className="p-12 text-center">
                  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Camera className="w-16 h-16 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">
                    Prêt à scanner
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Sélectionnez l'action puis appuyez sur le bouton pour activer la caméra et scanner les billets
                  </p>
                  <ScanActionSelect value={scanAction} onChange={setScanAction} />
                  <Button
                    onClick={startScanning}
                    size="lg"
                    className="w-full h-16 text-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Zap className="w-6 h-6 mr-3" />
                    Activer le Scanner
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {scanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="overflow-hidden border-4 border-green-400 shadow-2xl">
                <CardContent className="p-0">
                  <div className="relative">
                    {/* Zone de scan */}
                    <div 
                      id="qr-reader" 
                      className="w-full"
                      style={{ minHeight: '400px' }}
                    />
                    
                    {/* Indicateur de scan */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-green-500 text-white px-6 py-2 text-lg animate-pulse">
                        <Camera className="w-5 h-5 mr-2" />
                        Scan en cours...
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <p className="text-center text-lg font-semibold mb-4">
                      📱 Présentez le QR code devant la caméra
                    </p>
                    <Button
                      onClick={stopScanning}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Card className={`overflow-hidden border-4 ${
                result.success 
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                  : 'border-red-500 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20'
              }`}>
                <CardContent className="p-8">
                  {/* Icône et message principal */}
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center ${
                        result.success ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle2 className="w-16 h-16 text-white" />
                      ) : (
                        <XCircle className="w-16 h-16 text-white" />
                      )}
                    </motion.div>
                    
                    <h2 className={`text-4xl font-bold mb-4 ${
                      result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      {result.message.split('\n')[0]}
                    </h2>
                    
                    {result.message.split('\n')[1] && (
                      <p className="text-lg text-muted-foreground">
                        {result.message.split('\n')[1]}
                      </p>
                    )}
                  </div>

                  {/* Détails du billet */}
                  {result.ticket && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4 mb-6">
                      <div className="flex items-center gap-3 text-lg">
                        <User className="w-5 h-5 text-purple-600" />
                        <span className="font-bold">{result.ticket.participant_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Hash className="w-5 h-5 text-purple-600" />
                        <span>Billet #{result.ticket.ticket_number}</span>
                      </div>
                      {result.reservation && (
                        <>
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-purple-600" />
                            <span>{result.reservation.buyer_email}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-purple-600" />
                            <span>{result.reservation.buyer_phone}</span>
                          </div>
                        </>
                      )}
                      {result.ticket.validated_at && (
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-purple-600" />
                          <span>
                            Scanné le {new Date(result.ticket.validated_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bouton suivant */}
                  <Button
                    onClick={resetScanner}
                    size="lg"
                    className="w-full h-16 text-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Camera className="w-6 h-6 mr-3" />
                    Scanner le billet suivant
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
