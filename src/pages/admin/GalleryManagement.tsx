import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { 
  Image as ImageIcon, 
  Trash2, 
  Edit, 
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import ImageUpload from '../../components/ImageUpload';

interface GalleryPhoto {
  id: string;
  image_url: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export default function GalleryManagement() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error loading photos:', error);
      toast.error('Erro ao carregar fotos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!uploadedUrl) {
      toast.error('Selecione e envie uma imagem primeiro');
      return;
    }

    try {
      setUploading(true);

      const { error } = await supabase
        .from('gallery_photos')
        .insert({
          image_url: uploadedUrl,
          description: newDescription.trim() || null,
        });

      if (error) throw error;

      toast.success('Foto adicionada com sucesso');
      setNewDescription('');
      setUploadedUrl(null);
      await loadPhotos();
    } catch (error) {
      console.error('Error adding photo:', error);
      toast.error('Erro ao adicionar foto');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateDescription = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gallery_photos')
        .update({ description: editDescription.trim() || null })
        .eq('id', id);

      if (error) throw error;

      toast.success('Descrição atualizada');
      setEditingId(null);
      await loadPhotos();
    } catch (error) {
      console.error('Error updating description:', error);
      toast.error('Erro ao atualizar descrição');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta foto?')) return;

    try {
      const { error } = await supabase
        .from('gallery_photos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Foto deletada');
      await loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Erro ao deletar foto');
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const index = photos.findIndex(p => p.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === photos.length - 1)) {
      return;
    }

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const newPhotos = [...photos];
    [newPhotos[index], newPhotos[swapIndex]] = [newPhotos[swapIndex], newPhotos[index]];

    try {
      const updates = [
        { id: newPhotos[index].id, display_order: index },
        { id: newPhotos[swapIndex].id, display_order: swapIndex },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('gallery_photos')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      setPhotos(newPhotos);
    } catch (error) {
      console.error('Error reordering photos:', error);
      toast.error('Erro ao reordenar fotos');
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">Gerenciar Galeria</h1>
          <p className="text-gray-600">Adicione e organize fotos da sua galeria</p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nova Foto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Upload Component */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Selecione a Imagem</label>
                <ImageUpload
                  onUploadComplete={(url) => setUploadedUrl(url)}
                  bucket="event-images"
                  folder="gallery"
                />
              </div>

              {/* Preview */}
              {uploadedUrl && (
                <div className="border-2 border-pink-200 rounded-lg p-4">
                  <img
                    src={uploadedUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                  <p className="text-sm text-green-600 font-medium">✓ Imagem carregada</p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Descrição (opcional)</label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  disabled={uploading}
                  rows={3}
                  placeholder="Descreva a foto..."
                />
              </div>

              <Button
                onClick={handleAddPhoto}
                disabled={uploading || !uploadedUrl}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  'Adicionar Foto'
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Photos Grid */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Fotos ({photos.length})</h2>
        </div>

        {photos.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma foto</h3>
              <p className="text-muted-foreground">
                Comece adicionando fotos à sua galeria
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden h-full flex flex-col">
                    <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                      <img
                        src={photo.image_url}
                        alt={photo.description || 'Foto da galeria'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Imagem+indisponível';
                        }}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleReorder(photo.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleReorder(photo.id, 'down')}
                          disabled={index === photos.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <CardContent className="flex-1 p-4 flex flex-col">
                      {editingId === photo.id ? (
                        <div className="space-y-2 flex-1 flex flex-col">
                          <Textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={3}
                            className="flex-1"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateDescription(photo.id)}
                              className="flex-1"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground flex-1 mb-3">
                            {photo.description || 'Sem descrição'}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(photo.id);
                                setEditDescription(photo.description || '');
                              }}
                              className="flex-1"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(photo.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}

                      <div className="mt-2 text-xs text-muted-foreground">
                        {new Date(photo.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
