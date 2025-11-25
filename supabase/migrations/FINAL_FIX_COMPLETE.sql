-- ============================================
-- SCRIPT FINAL COMPLETO - Six Events Platform
-- ============================================
-- Execute este script UMA VEZ no Supabase SQL Editor
-- Resolve TODOS os problemas de permissões

-- PASSO 1: LIMPAR TUDO (começar do zero)
-- ============================================

-- Dropar tabelas antigas se existirem
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Dropar funções antigas
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.get_user_role(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- PASSO 2: CRIAR TABELA user_roles (definitiva)
-- ============================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- PASSO 3: INSERIR ADMINISTRADORES PRIMEIRO (antes das policies!)
-- ============================================

INSERT INTO public.user_roles (user_id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email IN ('ls8528950@gmail.com', 'natan.bilt8860@gmail.com')
ON CONFLICT (user_id) DO UPDATE 
SET role = 'admin', updated_at = NOW();

-- PASSO 4: CRIAR POLICIES PARA user_roles
-- ============================================

-- Todos autenticados podem ver roles
CREATE POLICY "Autenticados podem ver roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

-- Admins podem inserir roles
CREATE POLICY "Admins podem inserir roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins podem atualizar roles
CREATE POLICY "Admins podem atualizar roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins podem deletar roles
CREATE POLICY "Admins podem deletar roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- PASSO 5: CORRIGIR POLÍTICAS DE EVENTS
-- ============================================

-- Dropar todas as policies antigas
DROP POLICY IF EXISTS "Todos podem ver eventos publicados" ON public.events;
DROP POLICY IF EXISTS "Autenticados podem ver todos os eventos" ON public.events;
DROP POLICY IF EXISTS "Admins e Managers podem criar eventos" ON public.events;
DROP POLICY IF EXISTS "Admins e Managers podem atualizar eventos" ON public.events;
DROP POLICY IF EXISTS "Apenas Admins podem deletar eventos" ON public.events;
DROP POLICY IF EXISTS "Usuários autenticados podem ver eventos" ON public.events;
DROP POLICY IF EXISTS "Apenas usuários autenticados podem criar eventos" ON public.events;
DROP POLICY IF EXISTS "Apenas criadores podem atualizar eventos" ON public.events;
DROP POLICY IF EXISTS "Apenas criadores podem deletar eventos" ON public.events;
DROP POLICY IF EXISTS "System can update event places" ON public.events;

-- Público pode ver eventos (sem coluna status!)
CREATE POLICY "Público pode ver eventos"
  ON public.events FOR SELECT
  TO public
  USING (true);

-- Autenticados podem ver todos
CREATE POLICY "Autenticados veem todos eventos"
  ON public.events FOR SELECT
  TO authenticated
  USING (true);

-- Admins e Managers podem CRIAR
CREATE POLICY "Admins criam eventos"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Admins e Managers podem ATUALIZAR
CREATE POLICY "Admins atualizam eventos"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Admins podem DELETAR
CREATE POLICY "Admins deletam eventos"
  ON public.events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- PASSO 6: CORRIGIR POLÍTICAS DE RESERVATIONS
-- ============================================

DROP POLICY IF EXISTS "Todos podem criar reservas" ON public.reservations;
DROP POLICY IF EXISTS "Usuários podem ver suas reservas" ON public.reservations;
DROP POLICY IF EXISTS "Admins podem ver todas as reservas" ON public.reservations;
DROP POLICY IF EXISTS "Admins podem atualizar reservas" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON public.reservations;

-- Público pode criar reservas (checkout)
CREATE POLICY "Público cria reservas"
  ON public.reservations FOR INSERT
  TO public
  WITH CHECK (true);

-- Usuários veem suas reservas
CREATE POLICY "Ver próprias reservas"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Admins veem todas
CREATE POLICY "Admins veem reservas"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Admins atualizam reservas
CREATE POLICY "Admins atualizam reservas"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- PASSO 7: CORRIGIR POLÍTICAS DE TICKETS
-- ============================================

DROP POLICY IF EXISTS "Service role pode criar tickets" ON public.tickets;
DROP POLICY IF EXISTS "Público pode criar tickets" ON public.tickets;
DROP POLICY IF EXISTS "Usuários podem ver seus tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins podem ver todos os tickets" ON public.tickets;
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON public.tickets;

-- Público e service role podem criar
CREATE POLICY "Criar tickets"
  ON public.tickets FOR INSERT
  TO public, service_role
  WITH CHECK (true);

-- Ver tickets de suas reservas
CREATE POLICY "Ver próprios tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations
      WHERE reservations.id = tickets.reservation_id
      AND (reservations.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- Admins veem todos
CREATE POLICY "Admins veem tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- PASSO 8: CORRIGIR PARTY BUILDER OPTIONS
-- ============================================

DROP POLICY IF EXISTS "Public can view active party builder options" ON public.party_builder_options;
DROP POLICY IF EXISTS "Admins can view party builder options" ON public.party_builder_options;
DROP POLICY IF EXISTS "Admins can create party builder options" ON public.party_builder_options;
DROP POLICY IF EXISTS "Admins can update party builder options" ON public.party_builder_options;
DROP POLICY IF EXISTS "Admins can delete party builder options" ON public.party_builder_options;

-- Público vê options ativas
CREATE POLICY "Ver options ativas"
  ON public.party_builder_options FOR SELECT
  TO public
  USING (is_active = true);

-- Admins veem todas
CREATE POLICY "Admins veem options"
  ON public.party_builder_options FOR SELECT
  TO authenticated
  USING (
    is_active = true OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins criam options
CREATE POLICY "Admins criam options"
  ON public.party_builder_options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins atualizam options
CREATE POLICY "Admins atualizam options"
  ON public.party_builder_options FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins deletam options
CREATE POLICY "Admins deletam options"
  ON public.party_builder_options FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- PASSO 9: CRIAR FUNÇÕES HELPER
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role FROM public.user_roles
    WHERE user_id = user_uuid
    LIMIT 1
  );
END;
$$;

-- PASSO 10: TRIGGER AUTO-UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- PASSO 11: VERIFICAR RESULTADO
-- ============================================

SELECT 
  'Admins cadastrados:' as info,
  email,
  role,
  created_at
FROM public.user_roles
WHERE role = 'admin';

-- ============================================
-- ✅ CONCLUÍDO!
-- ============================================
-- Agora execute no seu app:
-- 1. Fazer LOGOUT
-- 2. Fazer LOGIN novamente
-- 3. Testar criar evento
-- 4. Testar gestão de usuários em /admin/users
