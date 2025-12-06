-- ===================================================================
-- CONFIGURAÇÃO DE STORAGE PARA UPLOAD DE IMAGENS
-- Six Events Platform - Supabase Storage Setup
-- ===================================================================

-- Criar bucket para imagens de eventos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete event images" ON storage.objects;

-- Política: Qualquer pessoa pode VER as imagens
CREATE POLICY "Public can view event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Política: Admins podem FAZER UPLOAD
CREATE POLICY "Admins can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images' AND
  (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin'
);

-- Política: Admins podem ATUALIZAR
CREATE POLICY "Admins can update event images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-images' AND
  (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin'
);

-- Política: Admins podem DELETAR
CREATE POLICY "Admins can delete event images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images' AND
  (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin'
);

-- Verificar buckets criados
SELECT id, name, public
FROM storage.buckets
WHERE id = 'event-images';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Storage configuré pour les images!';
  RAISE NOTICE '📁 Bucket: event-images';
  RAISE NOTICE '🔒 Politiques RLS appliquées';
  RAISE NOTICE '👁️ Public: Lecture seule';
  RAISE NOTICE '🔑 Admins: Upload, Update, Delete';
END $$;
