-- ============================================
-- CORREÇÃO COMPLETA E DEFINITIVA
-- Six Events Platform - SOLUÇÃO TOTAL
-- ============================================

-- PASSO 1: Remover TODAS as políticas antigas
DROP POLICY IF EXISTS "Public can view visible events" ON events;
DROP POLICY IF EXISTS "Anyone can view visible events" ON events;
DROP POLICY IF EXISTS "Admins can insert events" ON events;
DROP POLICY IF EXISTS "Admins can update events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;
DROP POLICY IF EXISTS "Admins can view all events" ON events;

-- PASSO 2: Remover função antiga se existir
DROP FUNCTION IF EXISTS is_admin();

-- PASSO 3: Criar função helper para verificar se é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin',
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 4: Criar políticas SIMPLIFICADAS que FUNCIONAM
CREATE POLICY "Anyone can view visible events"
  ON events FOR SELECT
  USING (is_visible = true OR is_admin());

CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (is_admin());

-- PASSO 5: Garantir que seu usuário é admin
-- ALTERE O EMAIL ABAIXO PARA O SEU EMAIL!
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'ls8528950@gmail.com';

-- PASSO 6: Verificar se funcionou
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  CASE 
    WHEN raw_user_meta_data->>'role' = 'admin' THEN '✅ É ADMIN'
    ELSE '❌ NÃO É ADMIN'
  END as status
FROM auth.users
WHERE email = 'ls8528950@gmail.com';

-- PASSO 7: Verificar políticas criadas
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname ILIKE '%admin%' THEN '🔒 Só admins'
    ELSE '👁️ Público'
  END as tipo
FROM pg_policies
WHERE tablename = 'events'
ORDER BY cmd;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════╗';
  RAISE NOTICE '║   ✅ CORREÇÃO COMPLETA APLICADA!         ║';
  RAISE NOTICE '╚════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 O QUE FOI CORRIGIDO:';
  RAISE NOTICE '   ✓ Função is_admin() criada';
  RAISE NOTICE '   ✓ Políticas RLS simplificadas';
  RAISE NOTICE '   ✓ Seu usuário promovido a admin';
  RAISE NOTICE '   ✓ Verificação de role funcionando';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
  RAISE NOTICE '   1. Fazer LOGOUT da aplicação';
  RAISE NOTICE '   2. Fazer LOGIN novamente';
  RAISE NOTICE '   3. Ir para /admin/events';
  RAISE NOTICE '   4. Tentar criar um evento';
  RAISE NOTICE '   5. DEVE FUNCIONAR! ✅';
  RAISE NOTICE '';
END $$;
