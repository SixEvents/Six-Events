import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../components/ui/use-toast';
import { Loader2, Upload, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface BrandingSettings {
  id: string;
  logo_url: string;
  show_name: boolean;
  site_name: string;
}

export default function BrandingSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    logo_url: '',
    show_name: true,
    site_name: 'Six Events',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('setting_key', 'branding')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data);
        setFormData({
          logo_url: data.logo_url,
          show_name: data.show_name,
          site_name: data.site_name,
        });
        setPreviewUrl(data.logo_url);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Apenas PNG, JPG, GIF, WebP e SVG são aceitos',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'Logo deve ter no máximo 5MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);

      // Delete old logo if exists
      if (formData.logo_url && formData.logo_url.includes('supabase')) {
        const oldPath = formData.logo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('event-images').remove([`branding/${oldPath}`]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('event-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: publicData.publicUrl }));
      setPreviewUrl(publicData.publicUrl);

      toast({
        title: 'Sucesso',
        description: 'Logo carregada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao fazer upload da logo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!settings) {
        // Insert new settings
        const { error } = await supabase
          .from('admin_settings')
          .insert([
            {
              setting_key: 'branding',
              ...formData,
            },
          ]);

        if (error) throw error;
      } else {
        // Update existing settings
        const { error } = await supabase
          .from('admin_settings')
          .update(formData)
          .eq('id', settings.id);

        if (error) throw error;
      }

      // Refresh settings
      await fetchSettings();

      toast({
        title: 'Salvo!',
        description: 'Configurações de branding atualizadas com sucesso',
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configurações',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">Configurações de Branding</h1>
          <p className="text-gray-600">Personalize a aparência da sua plataforma</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prévia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/80 backdrop-blur-md rounded-lg p-4 border border-gray-100 flex items-center gap-3">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Logo preview"
                      className="h-10 w-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=Logo';
                      }}
                    />
                  )}
                  {formData.show_name && (
                    <span className="text-xl font-bold text-pink-600">{formData.site_name}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center">Como aparecerá no navbar</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Settings */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="md:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label htmlFor="logo" className="text-base font-semibold">
                    Logo
                  </Label>
                  <div className="relative">
                    <input
                      id="logo"
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <label
                      htmlFor="logo"
                      className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-pink-200 rounded-lg cursor-pointer hover:border-pink-400 transition-colors bg-pink-50/50"
                    >
                      <Upload className="w-8 h-8 text-pink-600 mb-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {uploading ? 'Enviando...' : 'Clique ou arraste para enviar'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF, WebP ou SVG (máx 5MB)
                      </span>
                    </label>
                  </div>
                  {previewUrl && (
                    <p className="text-xs text-green-600 font-medium">✓ Logo carregada</p>
                  )}
                </div>

                {/* Show Name Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    {formData.show_name ? (
                      <Eye className="w-4 h-4 text-pink-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="font-medium">Mostrar nome do site</span>
                  </Label>
                  <Switch
                    checked={formData.show_name}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, show_name: checked }))
                    }
                  />
                </div>

                {/* Site Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="siteName" className="font-semibold">
                    Nome do Site
                  </Label>
                  <Input
                    id="siteName"
                    type="text"
                    value={formData.site_name}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, site_name: e.target.value }))
                    }
                    placeholder="Six Events"
                    maxLength={50}
                    disabled={!formData.show_name}
                    className={formData.show_name ? '' : 'opacity-50 cursor-not-allowed'}
                  />
                  <p className="text-xs text-gray-500">
                    {formData.site_name.length}/50 caracteres
                  </p>
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-2 h-auto"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Configurações'
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Dica:</span> A logo aparecerá automaticamente no navbar do site após salvar. 
                Use formatos quadrados (1:1) para melhor apresentação.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
