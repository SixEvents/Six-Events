# Email Service

Serviço Node.js separado para processar a fila de emails do Six Events.

## Por quê um serviço separado?

Supabase Edge Functions rodam em Deno, que não suporta nodemailer (biblioteca Node.js). Este serviço roda em Node.js e processa emails da fila usando Gmail SMTP.

## Setup

1. **Copiar variáveis de ambiente:**
```bash
cd email-service
cp .env.example .env
```

2. **Configurar .env:**
```env
VITE_SUPABASE_URL=https://rzcdcwwdlnczojmslhax.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
GMAIL_USER=6events.mjt@gmail.com
GMAIL_APP_PASSWORD=sua_senha_app_google
EMAIL_FROM=6events.mjt@gmail.com
EMAIL_FROM_NAME=Six Events
EMAIL_SERVICE_PORT=3001
```

3. **Instalar dependências:**
```bash
npm install
```

4. **Rodar em desenvolvimento:**
```bash
npm run dev
```

5. **Rodar em produção:**
```bash
npm start
```

## Como funciona

1. **Webhook do Stripe** cria reserva e adiciona email na tabela `email_queue` com status `pending`
2. **Email Service** verifica a cada 30 segundos se há emails pendentes
3. Para cada email:
   - Gera HTML com template apropriado (reservation_confirmation ou party_builder_quote)
   - Envia via Gmail SMTP usando nodemailer
   - Atualiza status para `sent` ou `failed`
   - Marca `confirmation_email_sent = true` na tabela `reservations`

## Deploy

### Opção 1: Railway.app (Recomendado)
```bash
railway login
railway init
railway up
```

### Opção 2: Render.com
1. Conectar repositório GitHub
2. Criar Web Service
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Adicionar variáveis de ambiente

### Opção 3: Docker
```bash
docker build -t six-events-email-service .
docker run -p 3001:3001 --env-file .env six-events-email-service
```

## Endpoints

- `GET /health` - Health check
- `POST /process-queue` - Processar fila manualmente

## Logs

O serviço imprime logs detalhados:
- `🔍 Checking email queue...` - Verificando fila
- `📧 Processing X emails...` - Processando emails
- `✅ Email sent to ...` - Email enviado com sucesso
- `⚠️ Email failed, will retry` - Falhou, vai tentar novamente
- `❌ Email failed after 3 attempts` - Falhou definitivamente

## Monitoramento

Verificar emails pendentes no Supabase:
```sql
SELECT * FROM email_queue WHERE status = 'pending';
```

Verificar emails falhados:
```sql
SELECT * FROM email_queue WHERE status = 'failed';
```

## Troubleshooting

### Email não está sendo enviado
1. Verificar se service está rodando: `curl http://localhost:3001/health`
2. Verificar logs do console
3. Verificar se Gmail App Password está correto
4. Verificar tabela `email_queue` no Supabase

### Gmail bloqueando envios
1. Certificar que está usando **App Password** (não senha normal)
2. Ativar "Acesso de apps menos seguros" se necessário
3. Verificar se conta Gmail não está bloqueada

### Service crashando
1. Verificar se todas as variáveis de ambiente estão configuradas
2. Verificar se `SUPABASE_SERVICE_ROLE_KEY` está correto
3. Verificar logs de erro no console
