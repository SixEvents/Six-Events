import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  currentImage?: string;
  onImageUploaded?: (url: string) => void;
  onUploadComplete?: (url: string) => void;
  onImageRemoved?: () => void;
  bucket?: string;
  folder?: string;
}

export default function ImageUpload({ 
  currentImage, 
  onImageUploaded, 
  onUploadComplete,
  onImageRemoved,
  bucket = 'event-images',
  folder = 'events'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Redimensionar se muito grande
          const maxDimension = 1200;
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
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            0.8 // Qualidade 80%
          );
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG, GIF ou WebP');
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop grande. Maximum 5MB');
      return;
    }

    setUploading(true);

    try {
      // Preview imediato
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Comprimir imagem
      const compressedBlob = await compressImage(file);
      
      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressedBlob, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Chamar o callback apropriado
      if (onImageUploaded) {
        onImageUploaded(urlData.publicUrl);
      } else if (onUploadComplete) {
        onUploadComplete(urlData.publicUrl);
      }
      toast.success('Image uploadée com sucesso!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Erreur upload: ' + error.message);
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemoved?.();
    toast.success('Image retirée');
  };

  return (
    <div className="space-y-4">
      <Label>Image de l'événement</Label>
      
      {preview ? (
        <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 transition-colors duration-200">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div 
          className="w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors duration-200"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Cliquez pour télécharger une image
          </p>
          <p className="text-xs text-gray-500">
            JPG, PNG, GIF ou WebP (max 5MB)
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground">
        💡 Les images seront automatiquement compressées et optimisées
      </p>
    </div>
  );
}
