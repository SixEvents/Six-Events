import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { decodeQRCodeData } from '../../lib/qrcode';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Camera, CheckCircle2, XCircle, LogIn, LogOut, RefreshCcw, User, Clock } from 'lucide-react';
import { toast } from 'sonner';

type ScanMode = 'entry' | 'exit' | 'reentry';

interface ScanResult {
  success: boolean;
  participant: string;
  event?: string;
  message: string;
  color: string;
}

export default function QRScannerNew() {
  const { user } = useAuth();
  const [mode, setMode] = useState<ScanMode>('entry');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [stats, setStats] = useState({ inside: 0, total: 0 });

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    return () => {
      // Limpar stream de câmera ao desmontar
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (scanner) {
        scanner.stop().catch(console.error);
        setScanner(null);
        setScanning(false);
      }
    };
  }, [scanner, cameraStream]);

  const loadStats = async () => {
    const { count: total } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true });
    
    const { count: inside } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'used');

    setStats({ inside: inside || 0, total: total || 0 });
  };

  const startScanning = async () => {
    try {
      // Verificar se está em HTTPS
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        toast.error("La caméra nécessite HTTPS. Utilisez https:// dans l'URL");
        return;
      }

      // Limpar resultado anterior e parar scanner se existir
      setResult(null);
      if (scanner) {
        await scanner.stop().catch(console.error);
        setScanner(null);
      }
      
      // Parar stream anterior se existir
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }

      // Verificar se navigator.mediaDevices existe
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Votre navigateur ne supporte pas l'accès à la caméra");
        return;
      }

      // IMPORTANTE: Definir scanning=true primeiro para renderizar o div
      setScanning(true);

      // Aguardar o próximo frame para garantir que o div foi renderizado
      await new Promise(resolve => setTimeout(resolve, 100));

      const html5QrCode = new Html5Qrcode("qr-reader");

      // Iniciar scanner diretamente (ele pede permissão automaticamente)
      await html5QrCode.start(
        { facingMode: "environment" },
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handleScan(decodedText);
          html5QrCode.stop().catch(console.error);
        },
        (errorMessage) => {
          // Ignorar erros de scan contínuo
        }
      );
      
      setScanner(html5QrCode);
      toast.success("Caméra activée");
    } catch (err: any) {
      console.error("Scanner start error:", err);
      setScanning(false);
      
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        toast.error("❌ Permission refusée. Cliquez sur l'icône 🔒 à gauche de l'URL et autorisez la caméra");
      } else if (err.name === 'NotFoundError') {
        toast.error("❌ Aucune caméra trouvée sur cet appareil");
      } else if (err.name === 'NotReadableError') {
        toast.error("❌ Caméra déjà utilisée par une autre application");
      } else {
        toast.error("❌ Erreur: " + (err.message || "Impossible d'accéder à la caméra"));
      }
    }
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.stop()
        .then(() => {
          setScanning(false);
          setScanner(null);
        })
        .catch((err) => {
          console.error("Erro ao parar scanner:", err);
          setScanning(false);
          setScanner(null);
        });
    }
    
    // Parar stream de câmera
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const handleScan = async (qrData: string) => {
    // Parar scanner IMEDIATAMENTE para evitar tela branca
    if (scanner) {
      await scanner.stop().catch(console.error);
      setScanner(null);
    }
    setScanning(false);
    
    try {
      const decoded = decodeQRCodeData(qrData);
      const { data: ticket } = await supabase
        .from('tickets')
        .select('*, reservation:reservations(*)')
        .eq('qr_code_data', qrData)
        .single();

      if (!ticket) {
        showResult({
          success: false,
          participant: 'Inconnu',
          message: 'QR Code invalide',
          color: 'red'
        });
        return;
      }

      // ENTRÉE
      if (mode === 'entry') {
        if (ticket.status === 'used') {
          showResult({
            success: false,
            participant: ticket.participant_name,
            message: `Déjà entré à ${new Date(ticket.validated_at).toLocaleTimeString()}`,
            color: 'red'
          });
          return;
        }

        await supabase
          .from('tickets')
          .update({ status: 'used', validated_at: new Date().toISOString(), validated_by: user?.id })
          .eq('id', ticket.id);

        showResult({
          success: true,
          participant: ticket.participant_name,
          event: ticket.reservation?.event_title || '',
          message: 'Entrée autorisée ✓',
          color: 'green'
        });
        loadStats();
        return;
      }

      // SORTIE
      if (mode === 'exit') {
        if (ticket.status !== 'used') {
          showResult({
            success: false,
            participant: ticket.participant_name,
            message: "Ticket pas encore entré",
            color: 'red'
          });
          return;
        }

        await supabase
          .from('tickets')
          .update({ status: 'temporarily_valid' })
          .eq('id', ticket.id);

        showResult({
          success: true,
          participant: ticket.participant_name,
          message: 'Sortie enregistrée ✓',
          color: 'orange'
        });
        loadStats();
        return;
      }

      // RÉENTRÉE
      if (mode === 'reentry') {
        if (ticket.status === 'used') {
          showResult({
            success: false,
            participant: ticket.participant_name,
            message: 'Déjà à l\'intérieur',
            color: 'red'
          });
          return;
        }

        if (ticket.status !== 'temporarily_valid') {
          showResult({
            success: false,
            participant: ticket.participant_name,
            message: 'Doit d\'abord sortir',
            color: 'red'
          });
          return;
        }

        await supabase
          .from('tickets')
          .update({ status: 'used' })
          .eq('id', ticket.id);

        showResult({
          success: true,
          participant: ticket.participant_name,
          message: 'Réentrée autorisée ✓',
          color: 'blue'
        });
        loadStats();
        return;
      }

    } catch (error) {
      console.error(error);
      showResult({
        success: false,
        participant: 'Erreur',
        message: 'Erreur de validation',
        color: 'red'
      });
    }
  };

  const showResult = (r: ScanResult) => {
    setResult(r);
    if (r.success) {
      toast.success(r.message);
    } else {
      toast.error(r.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header com stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Camera className="w-8 h-8 text-primary" />
              Scanner QR Code
            </CardTitle>
            <CardDescription>Validez les entrées et sorties avec le QR code</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inside}</p>
                  <p className="text-sm text-muted-foreground">À l'intérieur</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total billets</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sélection du mode */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as ScanMode)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="entry" className="flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Entrée
            </TabsTrigger>
            <TabsTrigger value="exit" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sortie
            </TabsTrigger>
            <TabsTrigger value="reentry" className="flex items-center gap-2">
              <RefreshCcw className="w-4 h-4" />
              Réentrée
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground mb-4">
                  Scanner le QR code du billet pour autoriser <strong>l'entrée</strong>
                </p>
                {!scanning && !result && (
                  <Button onClick={startScanning} size="lg" className="w-full">
                    <Camera className="w-5 h-5 mr-2" />
                    Commencer le scan
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exit" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground mb-4">
                  Scanner le QR code pour enregistrer une <strong>sortie temporaire</strong>
                </p>
                {!scanning && !result && (
                  <Button onClick={startScanning} size="lg" className="w-full" variant="outline">
                    <Camera className="w-5 h-5 mr-2" />
                    Commencer le scan
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reentry" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground mb-4">
                  Scanner le QR code pour autoriser une <strong>réentrée</strong> après sortie
                </p>
                {!scanning && !result && (
                  <Button onClick={startScanning} size="lg" className="w-full" variant="secondary">
                    <Camera className="w-5 h-5 mr-2" />
                    Commencer le scan
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Scanner */}
        {scanning && (
          <Card>
            <CardContent className="pt-6">
              <div id="qr-reader" className="w-full"></div>
              <Button onClick={stopScanning} variant="outline" className="w-full mt-4">
                Annuler
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Résultat */}
        {result && (
          <Card className={`border-2 ${
            result.color === 'green' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
            result.color === 'orange' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
            result.color === 'blue' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' :
            'border-red-500 bg-red-50 dark:bg-red-900/20'
          }`}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                {result.success ? (
                  <CheckCircle2 className={`w-20 h-20 ${
                    result.color === 'green' ? 'text-green-600' :
                    result.color === 'orange' ? 'text-orange-600' :
                    'text-blue-600'
                  }`} />
                ) : (
                  <XCircle className="w-20 h-20 text-red-600" />
                )}
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">{result.participant}</h3>
                  {result.event && <p className="text-sm text-muted-foreground mb-2">{result.event}</p>}
                  <Badge variant={result.success ? "default" : "destructive"} className="text-base px-4 py-1">
                    {result.message}
                  </Badge>
                </div>

                <Button onClick={startScanning} size="lg" className="w-full mt-4">
                  <Camera className="w-5 h-5 mr-2" />
                  Scanner suivant
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
