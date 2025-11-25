-- ===================================================================
-- CORREÇÃO DE PERMISSÕES RLS - VERSÃO FINAL
-- Execute este script no Supabase SQL Editor
-- ===================================================================

-- CRIAR TABELA DE PROFILES COM ROLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permitir todos lerem profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Permitir insert na criação do usuário
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- INSERIR SEU PERFIL COMO ADMIN
-- NÃO usa auth.users porque pode dar erro de permissão
-- Você vai inserir manualmente depois do SQL


-- 1. PERMITIR USUÁRIOS AUTENTICADOS CRIAREM RESERVATIONS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can create reservations" ON public.reservations;

CREATE POLICY "Authenticated users can create reservations"
ON public.reservations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir usuários verem suas próprias reservas
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;

CREATE POLICY "Users can view own reservations"
ON public.reservations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Permitir usuários atualizarem suas próprias reservas (cancelamento)
DROP POLICY IF EXISTS "Users can update own reservations" ON public.reservations;

CREATE POLICY "Users can update own reservations"
ON public.reservations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 2. PERMITIR USUÁRIOS AUTENTICADOS CRIAREM TICKETS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can create tickets" ON public.tickets;

CREATE POLICY "Authenticated users can create tickets"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reservations
    WHERE reservations.id = tickets.reservation_id
    AND reservations.user_id = auth.uid()
  )
);


-- 3. PERMITIR ADMINS ATUALIZAREM PARTY BUILDER OPTIONS
-- ===================================================================

-- Permitir TODOS verem options ativas (incluindo usuários não-autenticados!)
DROP POLICY IF EXISTS "Public can view active party builder options" ON public.party_builder_options;

CREATE POLICY "Public can view active party builder options"
ON public.party_builder_options FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Permitir admins visualizarem TODAS as options
DROP POLICY IF EXISTS "Admins can view party builder options" ON public.party_builder_options;

CREATE POLICY "Admins can view party builder options"
ON public.party_builder_options FOR SELECT
TO authenticated
USING (
  is_active = true OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Permitir admins criarem options
DROP POLICY IF EXISTS "Admins can create party builder options" ON public.party_builder_options;

CREATE POLICY "Admins can create party builder options"
ON public.party_builder_options FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Permitir admins atualizarem options
DROP POLICY IF EXISTS "Admins can update party builder options" ON public.party_builder_options;

CREATE POLICY "Admins can update party builder options"
ON public.party_builder_options FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Permitir admins deletarem options
DROP POLICY IF EXISTS "Admins can delete party builder options" ON public.party_builder_options;

CREATE POLICY "Admins can delete party builder options"
ON public.party_builder_options FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);


-- 4. VERIFICAR PERMISSÕES DE ATUALIZAÇÃO DE EVENTS
-- ===================================================================

DROP POLICY IF EXISTS "Admins can update events" ON public.events;

CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Permitir sistema atualizar available_places
DROP POLICY IF EXISTS "System can update event places" ON public.events;

CREATE POLICY "System can update event places"
ON public.events FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);


-- 5. INSERIR SEU PERFIL COMO ADMIN MANUALMENTE
-- ===================================================================

-- COPIE SEU USER ID executando esta query primeiro:
-- SELECT id FROM auth.users WHERE email = 'ls8528950@gmail.com';

-- DEPOIS, insira automaticamente VOCÊS 2 COMO ADMINS:

-- Você (owner principal)
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'ls8528950@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', email = 'ls8528950@gmail.com';

-- Seu ajudante
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'natan.bilt8860@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', email = 'natan.bilt8860@gmail.com';

