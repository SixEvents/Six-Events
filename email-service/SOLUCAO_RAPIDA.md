# 🚨 SOLUÇÃO RÁPIDA - Emails não estão sendo enviados

## Problema
Os emails estão na fila com status `pending` mas não são enviados.

## Causa
O **Email Service não está rodando**. Ele deveria estar no Render, mas provavelmente:
- Não foi criado ainda
- Ou está suspenso (plano free dorme após inatividade)

---

## ✅ SOLUÇÃO RÁPIDA (5 minutos)

### 1. Configurar arquivo .env

Na pasta `email-service`, crie arquivo `.env`:

```env
VITE_SUPABASE_URL=https://rzcdcwwdlnczojmslhax.supabase.co
SUPABASE_SERVICE_ROLE_KEY=COLE_AQUI
GMAIL_USER=6events.mjt@gmail.com
GMAIL_APP_PASSWORD=COLE_AQUI
EMAIL_FROM=6events.mjt@gmail.com
EMAIL_FROM_NAME=Six Events
```

**Como pegar as chaves:**

**SUPABASE_SERVICE_ROLE_KEY:**
1. https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/settings/api
2. Procure "service_role" (secret)
3. Clique "Reveal" e copie

**GMAIL_APP_PASSWORD:**
- Se já tem a senha de app: cole diretamente
- Se não tem: https://myaccount.google.com/apppasswords
  - Login: 6events.mjt@gmail.com
  - Create: "Six Events Email Service"
  - Copie a senha de 16 dígitos (sem espaços)

### 2. Rodar localmente (temporário)

```bash
cd email-service
npm install
npm start
```

**Ou clique duas vezes em:** `START_EMAIL_SERVICE.bat`

### 3. Verificar se funcionou

Console deve mostrar:
```
📧 Email Service running on port 3001
🔍 Checking email queue...
📧 Processing 5 emails...
✅ Email sent to user@example.com
```

Aguarde até 30 segundos. Os emails pendentes serão processados!

---

## 🔧 Verificar problemas

### Teste 1: Verificar fila

```bash
cd email-service
node check-queue.mjs
```

Vai mostrar:
- Quantos emails estão pendentes
- Se RLS está bloqueando
- Detalhes de cada email

### Teste 2: Verificar no Supabase

Execute no SQL Editor:
```sql
SELECT 
  id,
  recipient_email,
  type,
  status,
  attempts,
  error_message,
  created_at
FROM email_queue 
WHERE status = 'pending'
ORDER BY created_at DESC;
```

---

## 📊 Deploy permanente no Render (depois)

Para não precisar manter seu PC ligado:

### Opção A: Verificar se já existe

1. Acesse: https://dashboard.render.com/
2. Procure serviço "six-events-email" ou similar
3. Se existir e estiver **suspended**: Clique "Resume"

### Opção B: Criar novo serviço

1. https://dashboard.render.com/
2. "New" → "Web Service"
3. Conecte GitHub: SixEvents/Six-Events
4. Configurações:
   - **Name**: six-events-email-service
   - **Root Directory**: email-service
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (vai dormir após 15min inativo)

5. Environment Variables:
   ```
   VITE_SUPABASE_URL = https://rzcdcwwdlnczojmslhax.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = sua_service_role_key
   GMAIL_USER = 6events.mjt@gmail.com
   GMAIL_APP_PASSWORD = sua_app_password
   EMAIL_FROM = 6events.mjt@gmail.com
   EMAIL_FROM_NAME = Six Events
   ```

6. Deploy!

**Nota:** Plano Free do Render dorme após 15 minutos sem uso. Quando alguém faz uma reserva, pode demorar 1-2 minutos para acordar + processar email.

---

## ⚡ Status atual

- ✅ Migration SQL executada (recipient_name opcional)
- ✅ RLS configurado
- ✅ Emails sendo inseridos na fila
- ❌ Email Service não está rodando
- 🎯 **Solução**: Rodar localmente agora + Deploy no Render depois

---

## 🆘 Troubleshooting

### "Authentication failed" (Gmail)
- Verificar App Password (não é a senha normal!)
- Sem espaços na senha
- Verificar 2FA ativado na conta

### "Invalid Supabase URL"
- Verificar URL começa com https://
- Verificar project ID: rzcdcwwdlnczojmslhax

### Emails ainda em "pending" depois de rodar
- Verificar console do Email Service
- Verificar erro em error_message da tabela
- Verificar se chegou a 3 tentativas (status vira 'failed')

### Como resetar um email failed
```sql
UPDATE email_queue 
SET status = 'pending', attempts = 0, error_message = NULL
WHERE id = 'COLE_ID_AQUI';
```
