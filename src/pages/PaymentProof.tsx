import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Upload, CheckCircle2, AlertCircle, Loader2, Camera, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';

export default function PaymentProof() {
  const location = useLocation();
  const navigate = useNavigate();
  const { reservationId, totalPrice, eventTitle } = location.state || {};

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    priceMatch: boolean;
    dateValid: boolean;
    confidence: number;
  } | null>(null);

  if (!reservationId) {
    navigate('/events');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar tipo de arquivo
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Validar tamanho (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Image trop grande (max 10MB)');
      return;
    }

    setFile(selectedFile);
    
    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const analyzeImage = async (imageUrl: string): Promise<boolean> => {
    setAnalyzing(true);
    
    try {
      // Usar Tesseract.js para OCR
      const result = await Tesseract.recognize(imageUrl, 'fra', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      const text = result.data.text.toLowerCase();
      console.log('OCR Text:', text);

      // Verificar se contém o preço
      const priceStr = totalPrice.toFixed(2).replace('.', ','); // Formato europeu
      const priceStrAlt = totalPrice.toFixed(2); // Formato com ponto
      const priceMatch = text.includes(priceStr) || text.includes(priceStrAlt) || 
                        text.includes(`${totalPrice}`) || text.includes(`${totalPrice},00`);

      // Verificar data recente (últimos 7 dias)
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Procurar por padrões de data: DD/MM/YYYY, DD-MM-YYYY, etc
      const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g;
      const dates = [...text.matchAll(dateRegex)];
      
      let dateValid = false;
      for (const match of dates) {
        try {
          const day = parseInt(match[1]);
          const month = parseInt(match[2]);
          let year = parseInt(match[3]);
          
          if (year < 100) year += 2000; // Converter ano de 2 dígitos
          
          const foundDate = new Date(year, month - 1, day);
          if (foundDate >= sevenDaysAgo && foundDate <= today) {
            dateValid = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Calcular confiança
      let confidence = 0;
      if (priceMatch) confidence += 50;
      if (dateValid) confidence += 50;
      
      // Verificar palavras-chave bancárias
      const keywords = ['virement', 'transfer', 'banque', 'bank', 'paiement', 'payment'];
      if (keywords.some(kw => text.includes(kw))) confidence += 10;

      setVerificationResult({
        priceMatch,
        dateValid,
        confidence: Math.min(confidence, 100)
      });

      setAnalyzing(false);
      
      // Retornar true se passou nas verificações básicas
      return priceMatch && dateValid;
      
    } catch (error) {
      console.error('OCR Error:', error);
      setAnalyzing(false);
      toast.error('Erreur lors de l\'analyse de l\'image');
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setUploading(true);

    try {
      // 1. Analisar a imagem com OCR
      const isValid = await analyzeImage(preview);

      if (!isValid) {
        toast.error('❌ Reçu invalide: montant ou date incorrects');
        setUploading(false);
        return;
      }

      // 2. Upload da imagem para o Supabase Storage
      const fileName = `${reservationId}_${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file);

      if (uploadError) {
        // Se o bucket não existir, criar
        if (uploadError.message.includes('not found')) {
          await supabase.storage.createBucket('payment-proofs', {
            public: false,
            fileSizeLimit: 10485760 // 10MB
          });
          // Tentar upload novamente
          await supabase.storage.from('payment-proofs').upload(fileName, file);
        } else {
          throw uploadError;
        }
      }

      // 3. Obter URL pública
      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      // 4. Atualizar reserva com URL do comprovante
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          payment_proof_url: urlData.publicUrl,
          payment_status: 'pending', // Mudar para 'pending' até admin validar
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId);

      if (updateError) throw updateError;

      setSuccess(true);
      toast.success('✅ Reçu téléchargé avec succès!');
      
      setTimeout(() => {
        navigate('/profile/reservations');
      }, 3000);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du téléchargement: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Reçu Téléchargé ! ✅</h2>
          <p className="text-muted-foreground mb-6">
            Votre reçu de paiement a été soumis avec succès. Notre équipe va le vérifier et valider votre réservation dans les <strong>24-48h</strong>.
          </p>
          {verificationResult && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">
                Vérification automatique:
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Montant: {verificationResult.priceMatch ? '✅ Correct' : '❌ Non détecté'}</li>
                <li>• Date: {verificationResult.dateValid ? '✅ Valide' : '❌ Non détectée'}</li>
                <li>• Confiance: {verificationResult.confidence}%</li>
              </ul>
            </div>
          )}
          <Button onClick={() => navigate('/profile/reservations')} className="w-full">
            Voir mes réservations
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Upload className="w-6 h-6 text-pink-600" />
              Télécharger le Reçu de Paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
                📋 Informations de réservation
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Événement: <strong>{eventTitle}</strong></li>
                <li>• Montant payé: <strong>{totalPrice.toFixed(2)}€</strong></li>
                <li>• ID: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{reservationId.substring(0, 8)}</code></li>
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 rounded-lg p-4">
              <p className="text-sm font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                📸 Que télécharger ?
              </p>
              <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                <li>• Photo ou capture d'écran de l'email/SMS de confirmation de votre banque</li>
                <li>• Le reçu doit montrer clairement le <strong>montant ({totalPrice.toFixed(2)}€)</strong> et la <strong>date</strong></li>
                <li>• Formats acceptés: JPG, PNG (max 10MB)</li>
              </ul>
            </div>

            {/* Zone de Upload */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
              {!preview ? (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                      <FileImage className="w-8 h-8 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg mb-1">Cliquez pour sélectionner</p>
                      <p className="text-sm text-muted-foreground">ou glissez votre image ici</p>
                    </div>
                    <Button type="button" variant="outline">
                      <Camera className="w-4 h-4 mr-2" />
                      Choisir une image
                    </Button>
                  </div>
                </label>
              ) : (
                <div className="space-y-4">
                  <img src={preview} alt="Preview" className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg" />
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFile(null);
                        setPreview('');
                        setVerificationResult(null);
                      }}
                    >
                      Changer l'image
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {analyzing && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Analyse en cours...
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Vérification du montant et de la date
                  </p>
                </div>
              </div>
            )}

            {verificationResult && !analyzing && (
              <div className={`border rounded-lg p-4 ${
                verificationResult.priceMatch && verificationResult.dateValid
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-300'
              }`}>
                <div className="flex items-start gap-3">
                  {verificationResult.priceMatch && verificationResult.dateValid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-2">
                      {verificationResult.priceMatch && verificationResult.dateValid
                        ? '✅ Reçu validé automatiquement'
                        : '⚠️ Vérification requise'}
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Montant: {verificationResult.priceMatch ? '✅' : '❌'} {verificationResult.priceMatch ? 'Correct' : 'Non détecté'}</li>
                      <li>• Date: {verificationResult.dateValid ? '✅' : '❌'} {verificationResult.dateValid ? 'Valide (7 derniers jours)' : 'Non détectée'}</li>
                      <li>• Confiance: {verificationResult.confidence}%</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/profile/reservations')}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!file || uploading || analyzing}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Valider le paiement
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
