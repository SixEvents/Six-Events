import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, X } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

interface GalleryPhoto {
  id: string;
  image_url: string;
  description?: string;
  display_order: number;
  created_at: string;
}

export default function Gallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 md:py-12 lg:py-20 px-3 md:px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <div className="flex items-center justify-center mb-4 flex-col md:flex-row">
            <ImageIcon className="w-8 md:w-10 lg:w-12 h-8 md:h-10 lg:h-12 text-primary md:mr-3 mb-2 md:mb-0" />
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Galerie
            </h1>
          </div>
          <p className="text-sm md:text-base lg:text-xl text-muted-foreground">
            Découvrez les moments inoubliables de nos événements
          </p>
        </motion.div>

        {photos.length === 0 ? (
          <Card className="text-center py-8 md:py-12">
            <CardContent>
              <ImageIcon className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">Aucune photo disponible</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Revenez bientôt pour découvrir nos photos d'événements
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <Card 
                  className="overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                    <img
                      src={photo.image_url}
                      alt={photo.description || 'Photo de galerie'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Image+non+disponible';
                      }}
                    />
                    {photo.description && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 md:p-4">
                        <p className="text-white text-xs md:text-sm line-clamp-3">
                          {photo.description}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 md:p-4"
              onClick={() => setSelectedPhoto(null)}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="relative max-w-6xl max-h-[90vh] w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute -top-10 md:-top-12 right-0 text-white hover:text-gray-300 transition-colors"
                >
                  <X className="w-6 md:w-8 h-6 md:h-8" />
                </button>
                
                <img
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.description || 'Photo de galerie'}
                  className="w-full h-full object-contain rounded-lg"
                />
                
                {selectedPhoto.description && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white p-3 md:p-6 rounded-b-lg">
                    <p className="text-base md:text-lg">{selectedPhoto.description}</p>
                    <p className="text-xs md:text-sm text-gray-300 mt-2">
                      {new Date(selectedPhoto.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
