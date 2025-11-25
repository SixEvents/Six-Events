# 🚀 GUIA RÁPIDO DE DEPLOY - Render.com

## Passo 1: Acessar Render Dashboard
https://dashboard.render.com/

## Passo 2: New Web Service
1. Click em "New +" no topo
2. Selecione "Web Service"

## Passo 3: Conectar GitHub
1. Selecione repository: **SixEvents/Six-Events**
2. Se não aparecer, click "Configure GitHub" e autorize

## Passo 4: Configurar Serviço
```
Name: six-events-email-service
Region: Frankfurt (mais próximo da Europa)
Branch: main
Root Directory: email-service
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

**IMPORTANTE**: O Render vai automaticamente rodar `npm run postinstall` que compila o TypeScript.

## Passo 5: Adicionar Environment Variables
Click em "Advanced" e adicione:

```
VITE_SUPABASE_URL
https://rzcdcwwdlnczojmslhax.supabase.co

SUPABASE_SERVICE_ROLE_KEY
[PEGAR NO SUPABASE DASHBOARD]

GMAIL_USER
6events.mjt@gmail.com

GMAIL_APP_PASSWORD
[CONFIGURAR GOOGLE APP PASSWORD PRIMEIRO]

EMAIL_FROM
6events.mjt@gmail.com

EMAIL_FROM_NAME
Six Events

EMAIL_SERVICE_PORT
3001

NODE_ENV
production
```

## Passo 6: Create Web Service
Click "Create Web Service" e aguarde deploy (~5 min)

## ✅ Pronto!
Você receberá uma URL tipo: https://six-events-email-service.onrender.com

## 🧪 Testar
```bash
curl https://six-events-email-service.onrender.com/health
```

Deve retornar: `{"status":"ok","timestamp":"..."}`

---

## 📋 PRÓXIMOS PASSOS (em ordem):

### 1. Configurar Google App Password (URGENTE)
https://myaccount.google.com/apppasswords
- Login: 6events.mjt@gmail.com
- Criar senha para "Mail"
- Copiar senha de 16 caracteres
- Adicionar no Render em GMAIL_APP_PASSWORD

### 2. Pegar Service Role Key do Supabase
https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/settings/api
- Copiar "service_role" key
- Adicionar no Render em SUPABASE_SERVICE_ROLE_KEY

### 3. Aplicar Migration SQL
https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/sql/new
- Copiar conteúdo de: supabase/migrations/CREATE_EMAIL_QUEUE.sql
- Colar e executar

### 4. Configurar Webhook Stripe
https://dashboard.stripe.com/webhooks
- Criar webhook LIVE mode
- URL: https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/stripe-webhook
- Events: checkout.session.completed, payment_intent.succeeded
- Copiar signing secret

### 5. Deploy Edge Functions
```bash
supabase login
supabase link --project-ref rzcdcwwdlnczojmslhax
supabase secrets set STRIPE_SECRET_KEY=sua_key_live
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase functions deploy stripe-webhook-v2 --name stripe-webhook
```

---

**TEMPO TOTAL ESTIMADO: 30-45 minutos** ⏱️
