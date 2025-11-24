-- ===================================================================
-- DESABILITAR RLS TEMPORARIAMENTE
-- Execute isto para criar options sem erro de permissão
-- ===================================================================

-- DESABILITAR RLS na tabela party_builder_options
ALTER TABLE public.party_builder_options DISABLE ROW LEVEL SECURITY;

-- Agora você pode criar options sem erro!
-- Depois de criar todas as options, execute o arquivo REABILITAR_RLS.sql
