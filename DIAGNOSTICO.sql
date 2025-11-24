-- ============================================
-- SCRIPT DE DIAGNÓSTICO COMPLETO
-- Execute este script primeiro para ver o problema
-- ============================================

-- 1. Verificar seu usuário e role
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'role' as role_direto,
  created_at
FROM auth.users
WHERE email = 'ls8528950@gmail.com';

-- 2. Verificar políticas atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'events';

-- 3. Verificar estrutura da tabela events
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- 4. Verificar se RLS está ativado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'events';

-- 5. Testar função de verificação admin
SELECT 
  current_user as usuario_atual,
  auth.uid() as user_id,
  auth.jwt() as token_completo;

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '📊 DIAGNÓSTICO EXECUTADO';
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Verifique os resultados acima para identificar:';
  RAISE NOTICE '1. Se seu email tem role = admin';
  RAISE NOTICE '2. Quais políticas RLS existem';
  RAISE NOTICE '3. Se RLS está ativado na tabela';
  RAISE NOTICE '';
END $$;
