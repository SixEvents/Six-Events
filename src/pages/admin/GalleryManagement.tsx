import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { 
  Image as ImageIcon, 
  Upload, 
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

interface GalleryPhoto {
  id: string;
  image_url: string;
  description?: string;
  display_order: number;
  created_at: string;
}

export default function GalleryManagement() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form pour nouvelle photo
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .order('display_order', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error loading photos:', error);
      toast.error('Erreur lors du chargement des photos');
    } finally {
      setLoading(false);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG, GIF ou WebP');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image trop grande. Maximum 10MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const maxDimension = 1920;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              }
            },
            'image/jpeg',
            0.85
          );
        };
      };
    });
  };


  const handleAddPhoto = async () => {
    if (!selectedFile) {
      toast.error('Sélectionnez une image');
      return;
    }

    setUploading(true);
          const compressedFile = await compressImage(selectedFile);
      
          const fileExt = selectedFile.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
          const filePath = `gallery/${fileName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(filePath, compressedFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);

    try {
      const maxOrder = photos.length > 0 ? Math.max(...photos.map(p => p.display_order)) : 0;
      
      const { error } = await supabase
        .from('gallery_photos')
        .insert({
          image_url: publicUrl,
          description: newDescription.trim() || null,
          display_order: maxOrder + 1
        });

      if (error) throw error;

      toast.success('Photo ajoutée avec succès');
      setSelectedFile(null);
      setPreviewUrl(null);
      setNewDescription('');
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
      await loadPhotos();
    } catch (error) {
      console.error('Error adding photo:', error);
      toast.error('Erreur lors de l\'ajout de la photo');
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

      toast.success('Description mise à jour');
      setEditingId(null);
      await loadPhotos();
    } catch (error) {
      console.error('Error updating description:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) return;

    try {
      const { error } = await supabase
        .from('gallery_photos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Photo supprimée');
      await loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = photos.findIndex(p => p.id === id);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    try {
      const currentPhoto = photos[currentIndex];
      const targetPhoto = photos[targetIndex];

      // Échanger les display_order
      await supabase
        .from('gallery_photos')
        .update({ display_order: targetPhoto.display_order })
        .eq('id', currentPhoto.id);

      await supabase
        .from('gallery_photos')
        .update({ display_order: currentPhoto.display_order })
        .eq('id', targetPhoto.id);

      await loadPhotos();
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Erreur lors du réordonnancement');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <ImageIcon className="w-12 h-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gestion de la Galerie
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Ajoutez et gérez les photos de vos événements
          </p>
        </motion.div>

        {/* Add Photo Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Ajouter une Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium mb-2">
                  Sélectionner une image *
                </Label>
                
                {previewUrl ? (
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative w-full h-64 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploading}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <Upload className="w-12 h-12 mb-4" />
                      <p className="text-lg font-medium">Cliquez pour sélectionner une image</p>
                      <p className="text-sm mt-2">JPG, PNG, GIF ou WebP (max 10MB)</p>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-2">
                  L'image sera automatiquement compressée et optimisée
                </p>
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">
                  Description (optionnelle)
                </Label>
                <Textarea
                  placeholder="Décrivez la photo..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  disabled={uploading}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleAddPhoto}
                disabled={uploading || !selectedFile}
                className="w-full"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  'Ajouter la Photo'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Photos Grid */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Photos ({photos.length})</h2>
        </div>

        {photos.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Aucune photo</h3>
              <p className="text-muted-foreground">
                Commencez par ajouter des photos à votre galerie
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
                        alt={photo.description || 'Photo de galerie'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
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
                              Enregistrer
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
                            {photo.description || 'Aucune description'}
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
                              Modifier
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
                        {new Date(photo.created_at).toLocaleDateString('fr-FR')}
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
