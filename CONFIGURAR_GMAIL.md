# 🔐 CONFIGURAR SENHA DO GMAIL - PASSO A PASSO

## ⚠️ AÇÃO NECESSÁRIA: Configure a senha de aplicativo do Gmail

O arquivo `email-service/.env` foi criado, mas você precisa adicionar a **SENHA DE APLICATIVO** do Gmail.

## 📝 PASSO A PASSO:

### 1. Acesse sua conta Gmail (6events.mjt@gmail.com)

### 2. Ative a verificação em 2 etapas (se ainda não estiver ativa)
   - Acesse: https://myaccount.google.com/security
   - Clique em "Verificação em duas etapas"
   - Siga as instruções para ativar

### 3. Gere uma Senha de Aplicativo
   - Acesse: https://myaccount.google.com/apppasswords
   - Clique em "Criar senha de aplicativo"
   - Nome: "Six Events Email Service"
   - Copie a senha gerada (formato: xxxx xxxx xxxx xxxx)

### 4. Cole a senha no arquivo `.env`
   Abra: `email-service/.env`
   
   Encontre a linha:
   ```
   GMAIL_APP_PASSWORD=COLOQUE_SENHA_APP_AQUI
   ```
   
   Substitua por:
   ```
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```
   (cole a senha que você copiou - pode ser com ou sem espaços)

### 5. Salve o arquivo

### 6. Inicie o email service:
   ```bash
   cd email-service
   npm start
   ```

### 7. Verifique os logs
   Você deve ver:
   ```
   🚀 Email service started on port 3001
   🔍 Checking email queue...
   📧 Processing X emails...
   ✅ Email sent to...
   ```

---

## ⚡ TESTE RÁPIDO

Depois de configurar, faça este teste:

1. Mantenha o email service rodando
2. No site, crie uma nova demanda de Party Builder
3. No dashboard admin, mude o status de uma demanda
4. Verifique os emails nas caixas de entrada

---

## 🆘 SE DER ERRO

Erros comuns:
- **"Invalid login"** → Senha incorreta, gere uma nova
- **"Username and Password not accepted"** → Verificação em 2 etapas não está ativa
- **"Less secure apps"** → Use senha de aplicativo, não senha normal

---

## 📧 EMAILS QUE SERÃO ENVIADOS:

### Quando cliente cria demanda:
- ✉️ Para **6events.mjt@gmail.com**: "🎉 Nouvelle demande Party Builder"
- ✉️ Para **cliente**: "✨ Votre demande a été envoyée"

### Quando admin muda status:
- ✉️ Para **cliente**: Notificação com novo status

Todos os emails estão configurados e prontos! Só falta a senha do Gmail.
