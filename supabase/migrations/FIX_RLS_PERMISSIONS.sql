-- ============================================
-- FIX RLS PERMISSIONS - Six Events Platform
-- ============================================
-- Este script resolve o erro: "new row violates row-level security policy"
-- Permite que administradores criem e gerenciem eventos

-- 1. CRIAR TABELA DE ROLES/PERMISSÕES
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles (apenas admins podem modificar)
CREATE POLICY "Admins podem ver todas as roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins podem inserir roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins podem atualizar roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins podem deletar roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 2. INSERIR ADMINISTRADORES
-- ============================================
-- IMPORTANTE: Substituir estes emails pelos seus emails reais do Supabase Auth

-- Você (owner principal)
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'ls8528950@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- Seu ajudante
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'natan.bilt8860@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- 3. REMOVER POLÍTICAS ANTIGAS DA TABELA EVENTS
-- ============================================

DROP POLICY IF EXISTS "Usuários autenticados podem ver eventos" ON public.events;
DROP POLICY IF EXISTS "Apenas usuários autenticados podem criar eventos" ON public.events;
DROP POLICY IF EXISTS "Apenas criadores podem atualizar eventos" ON public.events;
DROP POLICY IF EXISTS "Apenas criadores podem deletar eventos" ON public.events;

-- 4. CRIAR NOVAS POLÍTICAS PARA EVENTS
-- ============================================

-- Qualquer pessoa pode VER eventos publicados (public)
CREATE POLICY "Todos podem ver eventos publicados"
  ON public.events FOR SELECT
  TO public
  USING (status = 'published');

-- Usuários autenticados podem ver TODOS os eventos
CREATE POLICY "Autenticados podem ver todos os eventos"
  ON public.events FOR SELECT
  TO authenticated
  USING (true);

-- Admins e Managers podem CRIAR eventos
CREATE POLICY "Admins e Managers podem criar eventos"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Admins e Managers podem ATUALIZAR eventos
CREATE POLICY "Admins e Managers podem atualizar eventos"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Apenas Admins podem DELETAR eventos
CREATE POLICY "Apenas Admins podem deletar eventos"
  ON public.events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 5. ATUALIZAR POLÍTICAS DE RESERVATIONS
-- ============================================

DROP POLICY IF EXISTS "Usuários podem ver suas próprias reservas" ON public.reservations;
DROP POLICY IF EXISTS "Usuários autenticados podem criar reservas" ON public.reservations;

-- Todos podem criar reservas (para checkout público)
CREATE POLICY "Todos podem criar reservas"
  ON public.reservations FOR INSERT
  TO public
  WITH CHECK (true);

-- Usuários podem ver suas próprias reservas
CREATE POLICY "Usuários podem ver suas reservas"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins podem ver todas as reservas
CREATE POLICY "Admins podem ver todas as reservas"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Admins podem atualizar reservas
CREATE POLICY "Admins podem atualizar reservas"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 6. ATUALIZAR POLÍTICAS DE TICKETS
-- ============================================

DROP POLICY IF EXISTS "Usuários podem ver seus próprios tickets" ON public.tickets;

-- Service role pode criar tickets (webhook)
CREATE POLICY "Service role pode criar tickets"
  ON public.tickets FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Público pode criar tickets (para webhook sem auth)
CREATE POLICY "Público pode criar tickets"
  ON public.tickets FOR INSERT
  TO public
  WITH CHECK (true);

-- Usuários podem ver tickets de suas reservas
CREATE POLICY "Usuários podem ver seus tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations
      WHERE reservations.id = tickets.reservation_id
      AND reservations.user_id = auth.uid()
    )
  );

-- Admins podem ver todos os tickets
CREATE POLICY "Admins podem ver todos os tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 7. CRIAR FUNÇÃO HELPER PARA VERIFICAR ROLES
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.user_roles
    WHERE user_id = user_uuid
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. TRIGGER PARA AUTO-UPDATE DE updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. VERIFICAR RESULTADO
-- ============================================

-- Ver todos os admins cadastrados
SELECT 
  ur.email,
  ur.role,
  ur.created_at,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM public.user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
WHERE ur.role = 'admin';

-- ============================================
-- CONCLUÍDO! 
-- ============================================
-- Agora você e seu ajudante podem:
-- ✅ Criar eventos
-- ✅ Editar eventos
-- ✅ Deletar eventos
-- ✅ Ver todas as reservas
-- ✅ Gerenciar permissões de outros usuários
