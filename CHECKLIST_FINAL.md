# ✅ CHECKLIST FINAL - Six Events Platform

## 🎉 JÁ CONCLUÍDO:

- [x] Sistema completo de Email Service (Node.js + Gmail SMTP)
- [x] Deploy do Email Service no Render (LIVE)
- [x] Tabela email_queue criada no Supabase
- [x] Webhook Stripe v2 com gestão automática de places
- [x] Indicadores visuais de disponibilidade
- [x] Verificação pré-checkout implementada
- [x] Código no GitHub atualizado

---

## ⏳ FALTA FAZER (ordem de prioridade):

### 1. **CONFIGURAR GOOGLE APP PASSWORD** ⚠️ URGENTE
**Sem isso, emails NÃO serão enviados!**

**Passo 1 - Ativar verificação em 2 etapas:**
```
https://myaccount.google.com/signinoptions/two-step-verification
Login: 6events.mjt@gmail.com
→ Seguir instruções (adicionar telefone, confirmar SMS)
```

**Passo 2 - Criar App Password:**
```
https://myaccount.google.com/apppasswords
Login: 6events.mjt@gmail.com
Nome: "Six Events Email Service"
→ Copiar senha de 16 caracteres
```

**Passo 3 - Atualizar no Render:**
```
https://dashboard.render.com/
→ Seu serviço: six-events-email-service
→ Environment
→ Editar GMAIL_APP_PASSWORD
→ Colar a senha
→ Save Changes (vai fazer redeploy)
```

---

### 2. **CONFIGURAR WEBHOOK STRIPE** 🔴 IMPORTANTE

**URL:** https://dashboard.stripe.com/webhooks

**Configuração:**
1. Mudar para **LIVE mode** (toggle canto superior direito)
2. Click "Add endpoint"
3. Endpoint URL: `https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/stripe-webhook`
4. Events to send:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
5. Click "Add endpoint"
6. **COPIAR** o Signing Secret (whsec_...)

**Adicionar Secret no Supabase:**
(Via Dashboard ou CLI - instruções abaixo)


whsec_ZPJgDh1C3AXEA25QjA76BWkUmnIZ4Nzk

---

### 3. **DEPLOY EDGE FUNCTIONS SUPABASE** 🟡 NECESSÁRIO

**Opção A - Via Dashboard (mais fácil):**

**Function 1: create-checkout-session**
```
1. https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/functions
2. Click "Create function"
3. Nome: create-checkout-session
4. Copiar código de: supabase/functions/create-checkout-session/index.ts
5. Deploy
```

**Function 2: stripe-webhook**
```
1. Click "Create function"  
2. Nome: stripe-webhook
3. Copiar código de: supabase/functions/stripe-webhook-v2/index.ts
4. Deploy
```

**Adicionar Secrets:**
```
Project Settings → Edge Functions → Secrets
Add new secret:

STRIPE_SECRET_KEY = sua_stripe_live_key
STRIPE_WEBHOOK_SECRET = whsec_... (do passo 2)
SUPABASE_SERVICE_ROLE_KEY = (já existe)
```

---

**Opção B - Via CLI (mais rápido se funcionar):**

Instalar Supabase CLI:
```bash
# Via Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# OU baixar binário direto:
# https://github.com/supabase/cli/releases
```

Deploy:
```bash
supabase login
supabase link --project-ref rzcdcwwdlnczojmslhax

# Configurar secrets
supabase secrets set STRIPE_SECRET_KEY=sua_key_live
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Deploy functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook-v2 --name stripe-webhook
```

---

### 4. **TESTAR FLUXO COMPLETO** ✅

Quando tudo estiver configurado:

**Teste 1 - Health Check:**
```bash
curl https://six-events-email-service.onrender.com/health
# Deve retornar: {"status":"ok","timestamp":"..."}
```

**Teste 2 - Reserva de Evento:**
1. Ir no site: selecionar evento
2. Fazer reserva com cartão teste Stripe:
   - Número: 4242 4242 4242 4242
   - Data: qualquer futura
   - CVC: qualquer 3 dígitos
3. Verificar:
   - ✅ Pagamento aprovado
   - ✅ Reserva criada no Supabase
   - ✅ available_places decrementado
   - ✅ Email na fila (email_queue)
   - ✅ Email Service processa e envia
   - ✅ Email recebido com QR codes

**Teste 3 - Over-booking:**
1. Criar evento com 2 places
2. Tentar reservar 3 places
3. Deve bloquear antes do checkout

---

## 📊 RESUMO DO SISTEMA:

```
┌─────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO                        │
└─────────────────────────────────────────────────────────┘

1. Cliente escolhe evento
   ↓
2. Frontend verifica available_places ✅
   ↓
3. create-checkout-session cria Stripe session
   ↓
4. Cliente paga
   ↓
5. Stripe webhook → stripe-webhook-v2
   ↓
6. Webhook:
   - Verifica disponibilidade (segurança) ✅
   - Cria reserva
   - Decrementa available_places ✅
   - Gera QR codes
   - Adiciona email na fila
   ↓
7. Email Service (Render):
   - A cada 30s busca pending
   - Gera HTML
   - Envia via Gmail ✅
   - Marca como sent
   ↓
8. Cliente recebe email 🎉
```

---

## 🎯 STATUS ATUAL:

✅ Backend: 100% completo e funcional  
✅ Frontend: Verificações implementadas  
✅ Email Service: LIVE no Render  
⏳ Google App Password: AGUARDANDO configuração  
⏳ Webhook Stripe: AGUARDANDO configuração  
⏳ Edge Functions: AGUARDANDO deploy  

**Tempo estimado restante: 30-45 minutos** ⏱️

---

## 📞 SUPORTE:

Se tiver dúvidas:
1. Verifique logs no Render Dashboard
2. Verifique tabela email_queue no Supabase
3. Verifique logs das Edge Functions no Supabase

Email: 6events.mjt@gmail.com
