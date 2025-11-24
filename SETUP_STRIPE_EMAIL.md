# 🚀 GUIA COMPLETO DE CONFIGURAÇÃO - SIX EVENTS PLATFORM

## 📋 RESUMO DO QUE FOI IMPLEMENTADO

### ✅ Sistema de Pagamento Stripe
- **Substituição:** Virement Bancaire → **Stripe Checkout** (Pagamento com cartão)
- **Mantido:** Opção de pagamento em **Espèces** (Cash)
- **Funcionamento:**
  - Usuário seleciona "💳 Carte Bancaire (Stripe)"
  - Clica em "Procéder au paiement Stripe"
  - É redirecionado para Stripe Checkout (página segura)
  - Após pagamento bem-sucedido → Email automático com QR codes
  - Após cancelamento → Página de cancelamento

### ✅ Sistema de Emails Automáticos
- **Serviço:** Resend (100 emails/dia grátis)
- **Emails enviados:**
  1. **Recuperação de senha** (Forgot Password)
  2. **Confirmação de reserva** (com QR codes anexados)
- **Templates:** HTML responsivos com design profissional

### 🆕 Novos Arquivos Criados

#### Frontend:
- `src/lib/stripe.ts` - Inicialização Stripe
- `src/lib/email.ts` - Templates de emails (apenas documentação)
- `src/pages/PaymentSuccess.tsx` - Página de sucesso
- `src/pages/PaymentCancelled.tsx` - Página de cancelamento

#### Backend (Supabase Edge Functions):
- `supabase/functions/create-checkout-session/index.ts` - Criar sessão Stripe
- `supabase/functions/stripe-webhook/index.ts` - Processar webhooks Stripe

#### Configuração:
- `.env.example` - Template de variáveis de ambiente
- `ADD_STRIPE_COLUMNS.sql` - Migração banco de dados

#### Arquivos Modificados:
- `src/pages/CheckoutEvent.tsx` - Integração Stripe
- `src/types/index.ts` - Tipo `paymentMethod` atualizado
- `src/App.tsx` - Rotas de pagamento adicionadas
- `package.json` - Dependências Stripe + Resend

---

## 🔧 PASSO A PASSO DE CONFIGURAÇÃO

### 1️⃣ CONFIGURAR STRIPE

#### A. Criar conta Stripe (se ainda não tem)
1. Acesse: https://dashboard.stripe.com/register
2. Complete o cadastro
3. Ative o modo de teste primeiro

#### B. Obter chaves da API
1. Vá para: https://dashboard.stripe.com/test/apikeys
2. Copie as seguintes chaves:

```
Publishable key: pk_test_51...  (para frontend)
Secret key:      sk_test_51...  (para backend - NUNCA expor!)
```

#### C. Configurar Webhook
1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique em "Add endpoint"
3. **URL do endpoint:** `https://[SEU_PROJETO_SUPABASE].supabase.co/functions/v1/stripe-webhook`
   - Substitua `[SEU_PROJETO_SUPABASE]` pelo ID do seu projeto
   - Exemplo: `https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/stripe-webhook`
4. **Eventos para ouvir:**
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
5. Clique em "Add endpoint"
6. **Copie o Signing Secret:** `whsec_...`

---

### 2️⃣ CONFIGURAR RESEND (para emails)

#### A. Criar conta Resend
1. Acesse: https://resend.com/signup
2. Complete o cadastro (100 emails/dia grátis)

#### B. Obter API Key
1. Vá para: https://resend.com/api-keys
2. Clique em "Create API Key"
3. Dê um nome (ex: "Six Events Production")
4. **Copie a chave:** `re_...`

#### C. Configurar domínio de envio
**Para testes (recomendado começar assim):**
- Use: `onboarding@resend.dev` (já verificado)

**Para produção:**
1. Vá em: https://resend.com/domains
2. Adicione seu domínio (ex: sixevents.com)
3. Configure registros DNS (MX, TXT, CNAME)
4. Aguarde verificação
5. Use: `noreply@sixevents.com`

---

### 3️⃣ CONFIGURAR VARIÁVEIS DE AMBIENTE

#### A. No projeto local (arquivo `.env`)

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite `.env` e preencha:

```env
# Supabase (já configurado)
VITE_SUPABASE_URL=https://rzcdcwwdlnczojmslhax.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Stripe (PREENCHER)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_CURRENCY=EUR

# Resend (PREENCHER)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_FROM_NAME=Six Events

# Site
VITE_SITE_URL=http://localhost:8080
VITE_SITE_NAME=Six Events
```

#### B. No Supabase (Edge Functions)

1. Acesse: https://supabase.com/dashboard/project/[seu-projeto]/settings/secrets
2. Adicione as seguintes variáveis:

```
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_FROM_NAME=Six Events
SUPABASE_URL=https://rzcdcwwdlnczojmslhax.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[sua_service_role_key]
```

**Como obter SUPABASE_SERVICE_ROLE_KEY:**
1. Vá em: https://supabase.com/dashboard/project/[seu-projeto]/settings/api
2. Na seção "Project API keys"
3. Copie a chave "service_role" (⚠️ **NUNCA exponha esta chave!**)

---

### 4️⃣ EXECUTAR MIGRAÇÃO DO BANCO DE DADOS

1. Acesse: https://supabase.com/dashboard/project/[seu-projeto]/sql/new
2. Copie o conteúdo do arquivo `ADD_STRIPE_COLUMNS.sql`
3. Cole no editor SQL
4. Clique em "Run"
5. Verifique se executou sem erros

**O que esta migração faz:**
- Adiciona coluna `stripe_payment_id` nas tabelas `reservations` e `party_builder_orders`
- Adiciona coluna `stripe_checkout_session_id`
- Adiciona colunas `confirmation_email_sent` e `confirmation_email_sent_at`
- Cria índices para busca rápida

---

### 5️⃣ FAZER DEPLOY DAS EDGE FUNCTIONS

#### A. Instalar Supabase CLI (se ainda não tem)

**Windows:**
```powershell
scoop install supabase
```

Ou baixe de: https://github.com/supabase/cli/releases

#### B. Fazer login no Supabase
```bash
supabase login
```

#### C. Link com seu projeto
```bash
supabase link --project-ref rzcdcwwdlnczojmslhax
```

#### D. Deploy das functions
```bash
cd supabase/functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

**Verificar deploy:**
1. Acesse: https://supabase.com/dashboard/project/[seu-projeto]/functions
2. Você deve ver as 2 funções listadas

---

### 6️⃣ TESTAR A INTEGRAÇÃO

#### A. Testar pagamento Stripe (modo teste)

1. **Inicie o servidor local:**
```bash
npm run dev
```

2. **Acesse:** http://localhost:8080/events

3. **Selecione um evento e reserve ingressos**

4. **Na página de checkout:**
   - Selecione "💳 Carte Bancaire (Stripe)"
   - Clique em "Procéder au paiement Stripe"

5. **Você será redirecionado para Stripe Checkout**
   - Use cartão de teste: `4242 4242 4242 4242`
   - Data: qualquer data futura (ex: 12/25)
   - CVC: qualquer 3 dígitos (ex: 123)
   - Nome: qualquer nome

6. **Após pagamento bem-sucedido:**
   - Você será redirecionado para `/payment-success`
   - ✅ Um email será enviado automaticamente com QR codes
   - ✅ A reserva será criada no banco com status "paid"
   - ✅ Os tickets serão gerados

#### B. Verificar webhook funcionando

1. **Acesse o dashboard Stripe:**
   https://dashboard.stripe.com/test/webhooks/[seu-webhook-id]

2. **Vá na aba "Events"**
   - Você deve ver o evento `checkout.session.completed` listado
   - Status deve ser "Succeeded"

3. **Se houver erro:**
   - Clique no evento para ver detalhes
   - Verifique logs da Edge Function no Supabase

#### C. Verificar email recebido

1. **Abra seu email** (o usado na reserva)
2. **Procure por:**
   - Assunto: "✅ Confirmation de réservation - [Nome do Evento]"
   - Remetente: Six Events
3. **O email deve conter:**
   - Detalhes do evento
   - Lista de participantes
   - Status de pagamento (✅ Payé)
   - QR codes (1 por pessoa)

#### D. Testar cancelamento de pagamento

1. Reserve um evento novamente
2. Na página Stripe Checkout, clique em "← Back" ou feche a aba
3. Você deve ser redirecionado para `/payment-cancelled`
4. **IMPORTANTE:** Nenhuma reserva é criada quando cancelado

---

### 7️⃣ TESTAR RECUPERAÇÃO DE SENHA

1. **Vá para:** http://localhost:8080/forgot-password

2. **Digite seu email e envie**

3. **Verifique seu email:**
   - Assunto: "🔐 Réinitialiser votre mot de passe - Six Events"
   - Deve ter um botão "Réinitialiser mon mot de passe"

4. **Clique no link** → você será levado para `/reset-password`

5. **Digite nova senha** e confirme

---

## 🔍 TROUBLESHOOTING (Resolver Problemas)

### ❌ Erro: "Stripe n'est pas configuré correctement"

**Causa:** `VITE_STRIPE_PUBLISHABLE_KEY` não está no `.env`

**Solução:**
1. Abra `.env`
2. Adicione: `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...`
3. Reinicie o servidor: `npm run dev`

---

### ❌ Erro: "Impossible de créer la session de paiement"

**Causa:** Edge Function `create-checkout-session` não está deployada ou com erro

**Solução:**
1. Verifique no dashboard Supabase se a função existe
2. Veja os logs da função: Supabase Dashboard → Functions → Logs
3. Re-deploy: `supabase functions deploy create-checkout-session`

---

### ❌ Email de confirmação não chega

**Causas possíveis:**
1. **RESEND_API_KEY inválida**
   - Verifique se a chave está correta no Supabase Secrets

2. **Webhook não está funcionando**
   - Vá no Stripe Dashboard → Webhooks
   - Veja se o evento foi enviado e se houve erro
   - Verifique logs da função `stripe-webhook` no Supabase

3. **Email foi para spam**
   - Verifique pasta de spam/lixeira

**Solução:**
1. Teste manualmente o envio de email:
   - Vá no Supabase Dashboard → Functions
   - Clique em "stripe-webhook" → Test
   - Envie um payload de teste

---

### ❌ Reserva não é criada após pagamento

**Causa:** Webhook não está processando corretamente

**Solução:**
1. **Verifique se o webhook está configurado no Stripe:**
   - URL correta: `https://[seu-projeto].supabase.co/functions/v1/stripe-webhook`
   - Evento selecionado: `checkout.session.completed`

2. **Verifique logs da função:**
   - Supabase Dashboard → Functions → stripe-webhook → Logs
   - Procure por erros

3. **Teste o webhook manualmente:**
   - Stripe Dashboard → Webhooks → [seu webhook] → Send test webhook

---

### ❌ Erro: "Missing Supabase environment variables"

**Causa:** Variáveis não configuradas nas Edge Functions

**Solução:**
1. Vá em: Supabase Dashboard → Settings → Edge Functions → Secrets
2. Adicione todas as variáveis listadas na seção 3️⃣B

---

## 📊 CHECKLIST FINAL

Antes de colocar em produção, verifique:

### Frontend:
- [ ] `.env` preenchido com todas as chaves
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` começa com `pk_test_` (teste) ou `pk_live_` (produção)
- [ ] Site carrega sem erros no console
- [ ] Página de eventos abre corretamente
- [ ] Checkout abre e mostra opções Stripe + Cash

### Stripe:
- [ ] Conta Stripe criada e verificada
- [ ] Webhook configurado com URL correta
- [ ] Webhook escutando `checkout.session.completed`
- [ ] Signing secret copiado e adicionado no Supabase

### Resend:
- [ ] Conta criada
- [ ] API Key gerada
- [ ] Email de envio verificado (ou usando `onboarding@resend.dev`)

### Supabase:
- [ ] Migração SQL executada sem erros
- [ ] Colunas `stripe_payment_id` existem
- [ ] Service Role Key obtida
- [ ] Todas as variáveis de ambiente adicionadas nos Secrets
- [ ] Edge Functions deployadas (ambas)

### Testes:
- [ ] Pagamento teste com cartão 4242 funcionou
- [ ] Email de confirmação chegou
- [ ] QR codes visíveis no email
- [ ] Reserva criada no banco com status "paid"
- [ ] Cancelamento de pagamento funciona
- [ ] Email de recuperação de senha chega

---

## 🚀 DEPLOY EM PRODUÇÃO

### Quando estiver tudo testando localmente:

1. **Mude para chaves de produção do Stripe:**
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51...
   STRIPE_SECRET_KEY=sk_live_51...
   ```

2. **Configure webhook de produção:**
   - Use URL de produção: `https://[seu-site].com`
   - Crie novo webhook no Stripe Dashboard (modo produção)

3. **Configure domínio de email no Resend:**
   - Adicione seu domínio
   - Configure DNS
   - Use `noreply@seudominio.com`

4. **Atualize variáveis no Vercel/Netlify:**
   - Adicione todas as variáveis `VITE_*` no painel de deploy

5. **Re-deploy das Edge Functions** (se alterou algo):
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   ```

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Verifique os logs:**
   - Console do navegador (F12)
   - Supabase Dashboard → Functions → Logs
   - Stripe Dashboard → Webhooks → Events

2. **Teste cada parte separadamente:**
   - Frontend: Página carrega?
   - Stripe: Checkout abre?
   - Webhook: Evento chega no Stripe?
   - Email: Resend API funciona?

3. **Entre em contato:**
   - Email: support@sixevents.com
   - GitHub Issues: [link do repositório]

---

## 🎉 PRONTO!

Sua plataforma agora tem:
- ✅ Pagamento online com Stripe
- ✅ Pagamento em dinheiro (opção)
- ✅ Emails automáticos de confirmação
- ✅ QR codes gerados e enviados
- ✅ Sistema de recuperação de senha

**Boa sorte com seu projeto! 🚀**
