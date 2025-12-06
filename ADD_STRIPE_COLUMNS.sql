-- ===================================================================
-- ADICIONAR SUPORTE PARA STRIPE - SIX EVENTS PLATFORM
-- Execute este script no Supabase SQL Editor
-- ===================================================================

-- 1. Adicionar coluna stripe_payment_id na tabela reservations
-- ===================================================================
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- Criar índice para busca rápida por payment_id
CREATE INDEX IF NOT EXISTS idx_reservations_stripe_payment_id 
ON public.reservations(stripe_payment_id);

-- 2. Adicionar coluna stripe_payment_id na tabela party_builder_orders
-- ===================================================================
ALTER TABLE public.party_builder_orders
ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- Criar índice para busca rápida por payment_id
CREATE INDEX IF NOT EXISTS idx_party_orders_stripe_payment_id 
ON public.party_builder_orders(stripe_payment_id);

-- 3. Atualizar tipo de payment_method para incluir 'stripe'
-- ===================================================================
-- Nota: Se você usar constraints de CHECK, pode precisar ajustá-los
-- Exemplo de constraint (ajuste conforme sua implementação):

-- Para reservations (se existir constraint):
-- ALTER TABLE public.reservations 
-- DROP CONSTRAINT IF EXISTS reservations_payment_method_check;

-- ALTER TABLE public.reservations
-- ADD CONSTRAINT reservations_payment_method_check 
-- CHECK (payment_method IN ('card', 'cash', 'transfer', 'stripe'));

-- Para party_builder_orders (se existir constraint):
-- ALTER TABLE public.party_builder_orders 
-- DROP CONSTRAINT IF EXISTS party_builder_orders_payment_method_check;

-- ALTER TABLE public.party_builder_orders
-- ADD CONSTRAINT party_builder_orders_payment_method_check 
-- CHECK (payment_method IN ('card', 'cash', 'transfer', 'stripe'));

-- 4. Adicionar campos de rastreamento de emails
-- ===================================================================
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS confirmation_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;

ALTER TABLE public.party_builder_orders
ADD COLUMN IF NOT EXISTS confirmation_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;

-- 5. Verificar estrutura atualizada
-- ===================================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'reservations'
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'party_builder_orders'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===================================================================
-- SUCESSO! ✅
-- ===================================================================
-- As tabelas agora suportam pagamentos Stripe
-- Próximos passos:
-- 1. Configure as variáveis de ambiente (.env)
-- 2. Implemente as Edge Functions para webhooks
-- 3. Teste o fluxo de pagamento
-- ===================================================================
