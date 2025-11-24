-- ===================================================================
-- CONFIGURAÇÃO COMPLETA DO BANCO DE DADOS
-- Six Events Platform - Sistema de Reservas e QR Codes
-- ===================================================================

-- ===================================================================
-- 1. TABELA DE TICKETS (Ingressos Individuais)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  ticket_number INTEGER NOT NULL,
  qr_code_data TEXT NOT NULL UNIQUE,
  qr_code_image TEXT,
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'temporarily_valid', 'cancelled')),
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_reservation ON public.tickets(reservation_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON public.tickets(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);

-- ===================================================================
-- 2. TABELA DE VALIDAÇÕES DE QR CODE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.qr_code_validations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('entry', 'exit', 'reentry', 'validation_attempt')),
  validated_by TEXT NOT NULL,
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT false,
  verification_email TEXT,
  verification_phone TEXT,
  notes TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_validations_ticket ON public.qr_code_validations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_validations_date ON public.qr_code_validations(validated_at);
CREATE INDEX IF NOT EXISTS idx_validations_action ON public.qr_code_validations(action);

-- ===================================================================
-- 3. ATUALIZAR TABELA DE RESERVATIONS
-- ===================================================================
-- Adicionar campos para pagamento
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('card', 'cash')),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'confirmed' CHECK (payment_status IN ('confirmed', 'pending')),
ADD COLUMN IF NOT EXISTS buyer_name TEXT,
ADD COLUMN IF NOT EXISTS buyer_email TEXT,
ADD COLUMN IF NOT EXISTS buyer_phone TEXT;

-- Atualizar campos antigos (migração)
UPDATE public.reservations
SET buyer_name = user_name,
    buyer_email = user_email,
    buyer_phone = user_phone
WHERE buyer_name IS NULL AND user_name IS NOT NULL;

-- ===================================================================
-- 4. ATUALIZAR TABELA DE EVENTS
-- ===================================================================
-- Adicionar campos adicionais
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS time TEXT,
ADD COLUMN IF NOT EXISTS location_details TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ===================================================================
-- 5. TABELA DE CATEGORIAS PARTY BUILDER
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.party_builder_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir categorias padrão
INSERT INTO public.party_builder_categories (name, slug, icon, order_index)
VALUES
  ('Thèmes', 'themes', '🎭', 1),
  ('Animations', 'animations', '🎪', 2),
  ('Décorations', 'decorations', '🎈', 3),
  ('Gâteaux', 'cakes', '🎂', 4),
  ('Goodies', 'goodies', '🎁', 5)
ON CONFLICT (slug) DO NOTHING;

-- ===================================================================
-- 6. ATUALIZAR TABELA PARTY BUILDER OPTIONS
-- ===================================================================
-- Adicionar campos para customização visual
ALTER TABLE public.party_builder_options
ADD COLUMN IF NOT EXISTS emoji TEXT,
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#FF5733',
ADD COLUMN IF NOT EXISTS animation_type TEXT DEFAULT 'none' CHECK (animation_type IN ('none', 'gradient', 'particles', 'waves', 'glow')),
ADD COLUMN IF NOT EXISTS animation_config JSONB,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar índice para category
CREATE INDEX IF NOT EXISTS idx_party_builder_options_category ON public.party_builder_options(category);

-- ===================================================================
-- 7. ATUALIZAR TABELA PARTY BUILDER ORDERS
-- ===================================================================
ALTER TABLE public.party_builder_orders
ADD COLUMN IF NOT EXISTS buyer_name TEXT,
ADD COLUMN IF NOT EXISTS buyer_email TEXT,
ADD COLUMN IF NOT EXISTS buyer_phone TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('card', 'cash')),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'confirmed' CHECK (payment_status IN ('confirmed', 'pending')),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ===================================================================
-- 8. POLÍTICAS RLS PARA TICKETS
-- ===================================================================

-- Habilitar RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Public can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can delete tickets" ON public.tickets;

-- Usuários podem ver seus próprios tickets
CREATE POLICY "Public can view own tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (
  reservation_id IN (
    SELECT id FROM public.reservations WHERE user_id = auth.uid()
  )
);

-- Admins podem ver todos os tickets
CREATE POLICY "Admins can view all tickets"
ON public.tickets FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin');

-- Admins podem criar tickets
CREATE POLICY "Admins can create tickets"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin');

-- Admins podem atualizar tickets
CREATE POLICY "Admins can update tickets"
ON public.tickets FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin');

-- Admins podem deletar tickets
CREATE POLICY "Admins can delete tickets"
ON public.tickets FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin');

-- ===================================================================
-- 9. POLÍTICAS RLS PARA QR CODE VALIDATIONS
-- ===================================================================

ALTER TABLE public.qr_code_validations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all validations" ON public.qr_code_validations;
DROP POLICY IF EXISTS "Admins can create validations" ON public.qr_code_validations;

-- Admins podem ver todas as validações
CREATE POLICY "Admins can view all validations"
ON public.qr_code_validations FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin');

-- Admins podem criar validações
CREATE POLICY "Admins can create validations"
ON public.qr_code_validations FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin');

-- ===================================================================
-- 10. POLÍTICAS RLS PARA CATEGORIAS PARTY BUILDER
-- ===================================================================

ALTER TABLE public.party_builder_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active categories" ON public.party_builder_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.party_builder_categories;

-- Todos podem ver categorias ativas
CREATE POLICY "Public can view active categories"
ON public.party_builder_categories FOR SELECT
USING (is_active = true);

-- Admins podem gerenciar categorias
CREATE POLICY "Admins can manage categories"
ON public.party_builder_categories FOR ALL
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin')
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin');

-- ===================================================================
-- 11. FUNÇÕES ÚTEIS
-- ===================================================================

-- Função para gerar código QR único
CREATE OR REPLACE FUNCTION generate_unique_qr_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..16 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para validar QR code
CREATE OR REPLACE FUNCTION validate_qr_code(
  qr_data TEXT,
  validator_id TEXT,
  action_type TEXT DEFAULT 'entry',
  verify_email TEXT DEFAULT NULL,
  verify_phone TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  ticket_record public.tickets%ROWTYPE;
  reservation_record public.reservations%ROWTYPE;
  validation_success BOOLEAN := false;
  result_message TEXT;
BEGIN
  -- Buscar ticket pelo QR code
  SELECT * INTO ticket_record
  FROM public.tickets
  WHERE qr_code_data = qr_data;

  -- Verificar se ticket existe
  IF NOT FOUND THEN
    INSERT INTO public.qr_code_validations (ticket_id, action, validated_by, success, notes)
    VALUES (NULL, action_type, validator_id, false, 'QR Code not found');
    
    RETURN jsonb_build_object(
      'success', false,
      'message', 'QR Code inválido',
      'action', 'deny_entry'
    );
  END IF;

  -- Buscar reserva
  SELECT * INTO reservation_record
  FROM public.reservations
  WHERE id = ticket_record.reservation_id;

  -- Verificar status do ticket
  IF ticket_record.status = 'cancelled' THEN
    INSERT INTO public.qr_code_validations (ticket_id, action, validated_by, success, notes)
    VALUES (ticket_record.id, action_type, validator_id, false, 'Ticket cancelled');
    
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Ingresso cancelado',
      'action', 'deny_entry'
    );
  END IF;

  -- Lógica de entrada
  IF action_type = 'entry' THEN
    IF ticket_record.status = 'used' THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'QR Code já utilizado às ' || to_char(ticket_record.validated_at, 'DD/MM/YYYY HH24:MI'),
        'action', 'already_used'
      );
    END IF;

    -- Marcar como usado
    UPDATE public.tickets
    SET status = 'used', validated_at = NOW(), validated_by = validator_id
    WHERE id = ticket_record.id;
    
    validation_success := true;
    result_message := 'Entrada confirmada';
  
  -- Lógica de saída
  ELSIF action_type = 'exit' THEN
    IF ticket_record.status != 'used' THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Ingresso não foi validado na entrada',
        'action', 'deny_entry'
      );
    END IF;

    UPDATE public.tickets
    SET status = 'temporarily_valid'
    WHERE id = ticket_record.id;
    
    validation_success := true;
    result_message := 'Saída registrada';
  
  -- Lógica de reentrada
  ELSIF action_type = 'reentry' THEN
    IF ticket_record.status != 'temporarily_valid' THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Ingresso não está autorizado para reentrada',
        'action', 'deny_entry'
      );
    END IF;

    -- Verificar email ou telefone
    IF verify_email IS NOT NULL OR verify_phone IS NOT NULL THEN
      IF (verify_email IS NULL OR reservation_record.buyer_email != verify_email) AND
         (verify_phone IS NULL OR reservation_record.buyer_phone != verify_phone) THEN
        INSERT INTO public.qr_code_validations (ticket_id, action, validated_by, success, verification_email, verification_phone, notes)
        VALUES (ticket_record.id, action_type, validator_id, false, verify_email, verify_phone, 'Identity verification failed');
        
        RETURN jsonb_build_object(
          'success', false,
          'message', 'Dados não correspondem à reserva',
          'action', 'deny_entry'
        );
      END IF;
    END IF;

    UPDATE public.tickets
    SET status = 'used'
    WHERE id = ticket_record.id;
    
    validation_success := true;
    result_message := 'Reentrada autorizada';
  END IF;

  -- Registrar validação
  INSERT INTO public.qr_code_validations (ticket_id, action, validated_by, success, verification_email, verification_phone)
  VALUES (ticket_record.id, action_type, validator_id, validation_success, verify_email, verify_phone);

  RETURN jsonb_build_object(
    'success', validation_success,
    'message', result_message,
    'action', 'allow_entry',
    'ticket', jsonb_build_object(
      'id', ticket_record.id,
      'participant_name', ticket_record.participant_name,
      'ticket_number', ticket_record.ticket_number
    ),
    'reservation', jsonb_build_object(
      'id', reservation_record.id,
      'buyer_name', reservation_record.buyer_name,
      'buyer_email', reservation_record.buyer_email
    )
  );
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- MENSAGENS DE SUCESSO
-- ===================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete!';
  RAISE NOTICE '📋 Tables created:';
  RAISE NOTICE '   - tickets';
  RAISE NOTICE '   - qr_code_validations';
  RAISE NOTICE '   - party_builder_categories';
  RAISE NOTICE '🔒 RLS policies applied';
  RAISE NOTICE '⚡ Functions created:';
  RAISE NOTICE '   - generate_unique_qr_code()';
  RAISE NOTICE '   - validate_qr_code()';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '   1. Run FIX_COMPLETE.sql if not done yet';
  RAISE NOTICE '   2. Run SETUP_STORAGE.sql if not done yet';
  RAISE NOTICE '   3. Test the application!';
END $$;
