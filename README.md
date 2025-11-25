# 🎉 Six Events Platform

Plateforme complète de gestion d'événements avec réservation en ligne, paiement Stripe et génération de billets QR Code.

## 🚀 Fonctionnalités

- ✅ **Réservation d'événements** avec paiement en ligne (Stripe)
- 🎫 **Génération automatique de billets QR Code**
- 📧 **Envoi d'emails de confirmation** avec Gmail SMTP
- 🎂 **Party Builder** - Configurateur de fêtes d'anniversaire
- 📊 **Gestion automatique des places disponibles**
- ⚠️ **Indicateurs visuels de disponibilité** (normal, orange, rouge, COMPLET)
- 🔒 **Protection contre les sur-réservations**
- 💳 **Paiement sécurisé via Stripe** (LIVE mode)

## 📦 Technologies

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions Deno)
- **Email Service**: Node.js + Express + nodemailer + Gmail SMTP
- **Paiement**: Stripe API (LIVE production keys)
- **QR Codes**: qrcode library

## 🛠️ Installation

### 1. Frontend (Application principale)

```bash
# Cloner le repository
git clone <YOUR_GIT_URL>
cd six-events-platform-main

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés

# Lancer en développement
npm run dev
```

### 2. Email Service (Service Node.js séparé)

Le service d'emails tourne séparément car Supabase Edge Functions (Deno) ne supportent pas nodemailer.

```bash
# Aller dans le dossier du service
cd email-service

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés

# Lancer le service
npm run dev
```

**Voir [email-service/README.md](./email-service/README.md) pour plus de détails sur le deployment.**

### 3. Base de données Supabase

```bash
# Appliquer les migrations SQL
# Aller dans Supabase Dashboard > SQL Editor
# Exécuter dans l'ordre:
# 1. supabase/migrations/ADD_STRIPE_COLUMNS.sql
# 2. supabase/migrations/ADD_EMAIL_QUEUE_TABLE.sql
```

### 4. Edge Functions Supabase

```bash
# Installer Supabase CLI
npm install -g supabase

# Login
supabase login

# Link au projet
supabase link --project-ref rzcdcwwdlnczojmslhax

# Deploy functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook-v2 --name stripe-webhook
```

## 🔑 Configuration des variables d'environnement

### Frontend (.env)

```env
# Supabase
VITE_SUPABASE_URL=https://rzcdcwwdlnczojmslhax.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key_ici

# Stripe (LIVE mode - production)
VITE_STRIPE_PUBLISHABLE_KEY=sua_stripe_publishable_key_aqui
STRIPE_SECRET_KEY=sua_stripe_secret_key_aqui

# Gmail SMTP
GMAIL_USER=6events.mjt@gmail.com
GMAIL_APP_PASSWORD=SENHA_APP_GOOGLE_AQUI
EMAIL_FROM=6events.mjt@gmail.com
EMAIL_FROM_NAME=Six Events
```

### Email Service (email-service/.env)

```env
# Supabase
VITE_SUPABASE_URL=https://rzcdcwwdlnczojmslhax.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Gmail SMTP
GMAIL_USER=6events.mjt@gmail.com
GMAIL_APP_PASSWORD=SENHA_APP_GOOGLE_AQUI
EMAIL_FROM=6events.mjt@gmail.com
EMAIL_FROM_NAME=Six Events

# Service
EMAIL_SERVICE_PORT=3001
```

### Supabase Edge Functions Secrets

```bash
# Configurar secrets para as Edge Functions
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

## 🔐 Setup Gmail App Password

1. Ir em: https://myaccount.google.com/apppasswords
2. Login com `6events.mjt@gmail.com`
3. Criar senha para "Mail"
4. Copiar a senha de 16 caracteres
5. Adicionar em `GMAIL_APP_PASSWORD` (ambos .env)

## 💳 Configurar Stripe Webhook

1. Ir em: https://dashboard.stripe.com/webhooks
2. Criar webhook para **LIVE mode**
3. URL: `https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/stripe-webhook`
4. Eventos: `checkout.session.completed`, `payment_intent.succeeded`
5. Copiar signing secret (`whsec_...`)
6. Adicionar em `STRIPE_WEBHOOK_SECRET`

## 📊 Fluxo de funcionamento

### Reserva de evento

1. **Cliente** seleciona evento e quantidade de billets
2. **Frontend** verifica disponibilidade (`available_places`)
3. **create-checkout-session** cria sessão Stripe
4. **Cliente** paga via Stripe Checkout
5. **Stripe** envia webhook para `stripe-webhook-v2`
6. **Edge Function**:
   - Verifica disponibilidade novamente (proteção contre double-booking)
   - Cria reserva no banco
   - **Atualiza automaticamente** `available_places` (décrémente)
   - Génère QR codes
   - Adiciona email na tabela `email_queue`
7. **Email Service** (polling a cada 30s):
   - Busca emails pendentes
   - Génère HTML com templates
   - Envia via Gmail SMTP
   - Marca como enviado

### Party Builder (Quote Request)

1. **Cliente** configure sa fête d'anniversaire
2. Clique sur "Envoyer ma demande" (PAS de paiement)
3. **Frontend** adiciona na `email_queue` type `party_builder_quote`
4. **Email Service** envia 2 emails:
   - Para empresa (`6events.mjt@gmail.com`) com devis complet
   - Para cliente com confirmation

## 📈 Indicateurs de disponibilité

Le système affiche des badges de disponibilité:

- **Plus de 10 places**: Badge normal "X places disponibles"
- **Entre 5 et 10 places**: Badge ORANGE "Plus que X places !"
- **Moins de 5 places**: Badge ROUGE "⚠️ Presque complet ! Plus que X places"
- **0 places**: Badge GRIS "COMPLET" + bouton réservation désactivé

## 🛡️ Protection contre sur-réservations

- **Vérification pré-paiement**: Avant de créer session Stripe
- **Vérification post-paiement**: Dans le webhook (double-check)
- **Transaction atomique**: Update `available_places` immédiatement après réservation
- **Refund automatique**: Si places insuffisantes après paiement

## 🚀 Deployment

### Frontend (Lovable/Vercel/Netlify)

**Via Lovable:**
1. Aller sur https://lovable.dev/projects/4b627524-9f70-4ebe-933c-a30f824c3674
2. Cliquer Share → Publish

**Via Vercel:**
```bash
vercel --prod
```

### Email Service (Railway/Render/Docker)

**Railway (Recommandé):**
```bash
cd email-service
railway login
railway init
railway up
```

**Render:**
1. Connecter GitHub
2. Create Web Service
3. Build: `npm install`
4. Start: `npm start`
5. Ajouter variables d'environnement

**Docker:**
```bash
cd email-service
docker build -t six-events-email-service .
docker run -p 3001:3001 --env-file .env six-events-email-service
```

### Edge Functions (Supabase)

```bash
supabase functions deploy
```

## 📝 Monitoring

### Vérifier fila de emails

```sql
-- Emails pendentes
SELECT * FROM email_queue WHERE status = 'pending';

-- Emails enviados
SELECT * FROM email_queue WHERE status = 'sent';

-- Emails falhados
SELECT * FROM email_queue WHERE status = 'failed';
```

### Health check do Email Service

```bash
curl http://localhost:3001/health
```

### Processar fila manualmente

```bash
curl -X POST http://localhost:3001/process-queue
```

## 🐛 Troubleshooting

### Emails não são enviados

1. Verificar se Email Service está rodando
2. Verificar Gmail App Password
3. Verificar tabela `email_queue` no Supabase
4. Ver logs do Email Service

### Stripe webhook não funciona

1. Verificar URL do webhook no dashboard Stripe
2. Verificar `STRIPE_WEBHOOK_SECRET`
3. Ver logs da Edge Function no Supabase

### Over-booking acontece

1. Verificar se transaction atomique está funcionando
2. Ver logs do webhook
3. Verificar se `available_places` está sendo atualizado

## 📚 Estrutura do projeto

```
six-events-platform-main/
├── src/                          # Frontend React
│   ├── components/              # Componentes UI
│   ├── pages/                   # Pages (Events, PartyBuilder, etc.)
│   ├── lib/                     # Utilitários (stripe.ts, gmail.ts)
│   └── hooks/                   # Custom hooks
├── supabase/
│   ├── functions/               # Edge Functions (Deno)
│   │   ├── create-checkout-session/
│   │   └── stripe-webhook-v2/
│   └── migrations/              # SQL migrations
├── email-service/               # Service Node.js séparé
│   ├── index.ts                 # Express server
│   ├── lib/gmail.ts             # Templates email
│   └── Dockerfile               # Docker config
└── public/                      # Assets statiques
```

## 📄 License

MIT

## 🤝 Support

Email: 6events.mjt@gmail.com

---

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/4b627524-9f70-4ebe-933c-a30f824c3674) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
