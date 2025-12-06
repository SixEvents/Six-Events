# 🔍 GUIA DE DIAGNÓSTICO - Emails Party Builder

## O problema: Emails não estão sendo enviados

### ✅ PASSO 1: Verificar se os emails estão sendo CRIADOS na fila

1. Acesse seu Supabase Dashboard
2. Vá em **Table Editor** → **email_queue**
3. Verifique se há registros com:
   - `type` = 'party_builder_request' (quando cliente cria demanda)
   - `type` = 'party_builder_status_update' (quando admin muda status)
   
**Se NÃO houver registros:**
- ❌ O código não está criando os emails
- Verifique o console do navegador por erros
- Teste criar uma nova demanda de Party Builder

**Se houver registros:**
- ✅ Os emails estão sendo criados
- Próximo passo: verificar o status deles

---

### ✅ PASSO 2: Verificar STATUS dos emails

Na tabela `email_queue`, veja a coluna `status`:

#### 📧 Status: **'pending'** (Pendente)
**Significa:** Email está esperando para ser enviado
**Solução:** O EMAIL SERVICE precisa estar RODANDO!

**Como iniciar o Email Service:**
```bash
# Opção 1: Usando o script bat (Windows)
cd email-service
START_EMAIL_SERVICE.bat

# Opção 2: Manualmente
cd email-service
npm start
```

O serviço deve ficar SEMPRE rodando (em background ou numa janela separada).
Ele processa a fila a cada 30 segundos.

---

#### ✅ Status: **'sent'** (Enviado)
**Significa:** Email foi enviado com sucesso!
**Verifique:** Caixa de entrada / spam do destinatário

---

#### ❌ Status: **'failed'** (Falhou)
**Significa:** O email service tentou enviar mas falhou
**Verifique:** Coluna `error_message` para ver o erro

**Erros comuns:**
1. **"Invalid login: 535"** → Senha incorreta do Gmail
2. **"No recipients defined"** → Email destinatário inválido
3. **"Timeout"** → Problemas de conexão

**Solução:**
Verifique o arquivo `email-service/.env`:
```env
EMAIL_FROM=6events.mjt@gmail.com
EMAIL_PASSWORD=sua-senha-de-aplicativo-do-gmail
EMAIL_FROM_NAME=Six Events
```

⚠️ **IMPORTANTE:** Use uma **Senha de Aplicativo** do Gmail, NÃO sua senha normal!

Como gerar senha de aplicativo:
1. Acesse: https://myaccount.google.com/apppasswords
2. Crie uma nova senha de aplicativo
3. Copie e cole no .env

---

### ✅ PASSO 3: Verificar configuração do Email Service

1. Vá para `email-service/.env`
2. Certifique-se que todas as variáveis estão configuradas:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ey...
EMAIL_FROM=6events.mjt@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Senha de aplicativo (16 dígitos)
EMAIL_FROM_NAME=Six Events
EMAIL_SERVICE_PORT=3001
```

---

### ✅ PASSO 4: Testar manualmente

Execute este comando para processar os emails pendentes manualmente:

```bash
cd email-service
npm run build
npm start
```

Você verá logs como:
```
🔍 Checking email queue...
📧 Processing 2 emails...
📤 Sending party builder email to...
✅ Email sent to cliente@email.com
```

---

## 🎯 CHECKLIST RÁPIDO

- [ ] Emails aparecem na tabela `email_queue`?
- [ ] Status dos emails é 'pending'?
- [ ] Email service está rodando?
- [ ] Arquivo `email-service/.env` existe e está configurado?
- [ ] Usando senha de aplicativo do Gmail (não senha normal)?
- [ ] O Gmail `6events.mjt@gmail.com` tem verificação em 2 etapas ativada?

---

## 🆘 TESTE RÁPIDO

Execute isto para ver o status atual:

```sql
-- No Supabase SQL Editor
SELECT 
  type,
  status,
  COUNT(*) as quantidade
FROM email_queue
WHERE type LIKE '%party_builder%'
GROUP BY type, status;
```

Isso mostra quantos emails de cada tipo e status você tem.

---

## 📞 SUPORTE

Se continuar com problemas:
1. Verifique os logs do email service (janela onde está rodando)
2. Copie qualquer mensagem de erro
3. Verifique a coluna `error_message` na tabela `email_queue`
