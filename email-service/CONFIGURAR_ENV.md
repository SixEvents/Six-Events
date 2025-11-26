# 📧 Configurar Email Service

## Passo 1: Criar arquivo .env

Na pasta `email-service`, crie um arquivo chamado `.env` com este conteúdo:

```env
VITE_SUPABASE_URL=https://rzcdcwwdlnczojmslhax.supabase.co
SUPABASE_SERVICE_ROLE_KEY=COLE_SUA_SERVICE_ROLE_KEY_AQUI
GMAIL_USER=6events.mjt@gmail.com
GMAIL_APP_PASSWORD=COLE_SENHA_APP_GOOGLE_AQUI
EMAIL_FROM=6events.mjt@gmail.com
EMAIL_FROM_NAME=Six Events
EMAIL_SERVICE_PORT=3001
```

## Passo 2: Obter SUPABASE_SERVICE_ROLE_KEY

1. Acesse: https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/settings/api
2. Na seção **"Project API keys"**
3. Procure por **"service_role"** (secret)
4. Clique em "Reveal" e copie a chave
5. Cole no arquivo `.env` no lugar de `COLE_SUA_SERVICE_ROLE_KEY_AQUI`

⚠️ **ATENÇÃO**: Esta chave é SECRETA! Nunca compartilhe!

## Passo 3: Obter GMAIL_APP_PASSWORD

Esta é a senha que o Gmail criou para aplicativos. Se você já tem:
- Cole no `.env` no lugar de `COLE_SENHA_APP_GOOGLE_AQUI`

Se não tem ou não sabe qual é:

### Criar nova App Password do Gmail:

1. Acesse: https://myaccount.google.com/apppasswords
2. Faça login com: **6events.mjt@gmail.com**
3. Em "Select app": escolha **"Mail"**
4. Em "Select device": escolha **"Other (Custom name)"**
5. Digite: **"Six Events Email Service"**
6. Clique em **"Generate"**
7. O Google vai mostrar uma senha de 16 caracteres tipo: `abcd efgh ijkl mnop`
8. Copie esta senha (SEM ESPAÇOS): `abcdefghijklmnop`
9. Cole no `.env` no lugar de `COLE_SENHA_APP_GOOGLE_AQUI`

⚠️ **Requisitos**:
- A conta Gmail deve ter **verificação em 2 etapas ativada**
- Se não tiver, ative em: https://myaccount.google.com/security

## Passo 4: Rodar o serviço

Depois de configurar o `.env`:

### Windows:
```bash
# Clique duas vezes em:
START_EMAIL_SERVICE.bat
```

### Ou manualmente:
```bash
cd email-service
npm install
npm start
```

## Verificar se está funcionando

O console deve mostrar:
```
📧 Email Service running on port 3001
🔄 Processing queue every 30 seconds
🔍 Checking email queue...
```

Se aparecer emails sendo processados:
```
📧 Processing 5 emails...
✅ Email sent to user@example.com
```

## Troubleshooting

### Erro: "Authentication failed"
- Verificar se GMAIL_APP_PASSWORD está correto (sem espaços)
- Verificar se usou App Password e não a senha normal

### Erro: "Invalid project URL"
- Verificar VITE_SUPABASE_URL
- Certificar que começa com https://

### Erro: "Row Level Security"
- Executar a migration SQL no Supabase
- Ver arquivo: `supabase/migrations/fix_email_queue_recipient_name.sql`

### Emails não estão sendo enviados
- Verificar se o serviço está rodando (janela aberta)
- Verificar tabela email_queue no Supabase:
  ```sql
  SELECT * FROM email_queue WHERE status = 'pending';
  ```
