# 🚨 SOLUÇÃO IMEDIATA - ERRO DE PERMISSÃO

## ⚡ EXECUTE AGORA NO SUPABASE

### Passo 1: Abrir Supabase
1. Acesse: https://supabase.com/dashboard
2. Faça login com sua conta
3. Selecione o projeto: **rzcdcwwdlnczojmslhax**

### Passo 2: Abrir SQL Editor
1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique em **+ New query**

### Passo 3: Copiar e Colar o SQL
Copie TODO o conteúdo abaixo e cole no editor:

```sql
-- ===================================================================
-- CORREÇÃO URGENTE DE PERMISSÕES RLS
-- ===================================================================

-- 1. PERMITIR USUÁRIOS CRIAREM RESERVATIONS
DROP POLICY IF EXISTS "Authenticated users can create reservations" ON public.reservations;

CREATE POLICY "Authenticated users can create reservations"
ON public.reservations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


-- 2. PERMITIR USUÁRIOS VEREM SUAS PRÓPRIAS RESERVATIONS
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;

CREATE POLICY "Users can view own reservations"
ON public.reservations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);


-- 3. PERMITIR USUÁRIOS ATUALIZAREM SUAS PRÓPRIAS RESERVATIONS
DROP POLICY IF EXISTS "Users can update own reservations" ON public.reservations;

CREATE POLICY "Users can update own reservations"
ON public.reservations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 4. PERMITIR USUÁRIOS CRIAREM TICKETS (ATRAVÉS DA RESERVA)
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


-- 5. PERMITIR ADMINS GERENCIAREM PARTY BUILDER OPTIONS
DROP POLICY IF EXISTS "Admins can view party builder options" ON public.party_builder_options;
DROP POLICY IF EXISTS "Admins can create party builder options" ON public.party_builder_options;
DROP POLICY IF EXISTS "Admins can update party builder options" ON public.party_builder_options;
DROP POLICY IF EXISTS "Admins can delete party builder options" ON public.party_builder_options;

CREATE POLICY "Admins can view party builder options"
ON public.party_builder_options FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin');

CREATE POLICY "Admins can create party builder options"
ON public.party_builder_options FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin');

CREATE POLICY "Admins can update party builder options"
ON public.party_builder_options FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin')
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin');

CREATE POLICY "Admins can delete party builder options"
ON public.party_builder_options FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin');


-- 6. PERMITIR SISTEMA ATUALIZAR AVAILABLE_PLACES
DROP POLICY IF EXISTS "System can update event places" ON public.events;

CREATE POLICY "System can update event places"
ON public.events FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);


-- 7. VERIFICAR ROLE ADMIN
-- Execute esta query SEPARADAMENTE para ver sua role:
-- SELECT auth.uid(), auth.jwt() -> 'user_metadata' ->> 'role' as role;

-- Se a role for NULL, execute este comando:
-- UPDATE auth.users 
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'ls8528950@gmail.com';
```

### Passo 4: Executar
1. Clique no botão **RUN** (ou pressione Ctrl+Enter)
2. Aguarde mensagem de sucesso
3. Deve aparecer: "Success. No rows returned"

### Passo 5: Configurar Admin (SE NECESSÁRIO)
Se você não conseguir editar Party Builder Options, execute:

```sql
-- Ver sua role atual
SELECT auth.uid(), auth.jwt() -> 'user_metadata' ->> 'role' as role;

-- Se retornar NULL na coluna 'role', execute:
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'ls8528950@gmail.com';
```

---

## ✅ VERIFICAR SE FUNCIONOU

Depois de executar o SQL:

1. **Teste de Reserva:**
   - Volte para http://localhost:8081/events
   - Escolha um evento
   - Clique em "Réserver"
   - Complete o checkout
   - **Deve funcionar sem erro!** ✅

2. **Teste Party Builder:**
   - Vá em http://localhost:8081/admin/party-builder
   - Tente editar uma opção existente
   - **Deve permitir edição!** ✅

---

## 🆘 SE AINDA DER ERRO

### Erro: "permission denied for table reservations"
**Solução:** Execute novamente o SQL acima

### Erro: "permission denied for table tickets"  
**Solução:** Execute novamente o SQL acima

### Erro: "Cannot read properties of null"
**Solução:** 
1. Verifique se está logado no sistema
2. Faça logout e login novamente
3. Tente novamente

### Party Builder não edita
**Solução:**
1. Execute o SQL de configurar admin (Passo 5)
2. Faça logout e login novamente
3. Sua role será atualizada

---

## 📱 CONTATO EMERGÊNCIA

Se o erro persistir mesmo após executar o SQL:

1. Tire um print do erro no console (F12)
2. Tire um print da tela
3. Me envie para análise

---

**Data:** 26 de novembro de 2025  
**Prioridade:** 🔴 URGENTE  
**Tempo estimado:** 2 minutos
