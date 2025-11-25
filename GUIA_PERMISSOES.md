# 🔐 GUIA RÁPIDO - CONFIGURAR PERMISSÕES

## ⚡ PASSOS PARA RESOLVER O ERRO "row-level security policy"

### 1️⃣ **APLICAR SCRIPT SQL NO SUPABASE** (5 minutos)

**Ir para:** https://supabase.com/dashboard/project/rzcdcwwdlnczojmslhax/editor

**Executar o script:** `supabase/migrations/FIX_RLS_PERMISSIONS.sql`

1. Click em "New Query" (ou pressione `Ctrl+K`)
2. Copiar TODO o conteúdo do arquivo `FIX_RLS_PERMISSIONS.sql`
3. Colar no editor
4. Click em "Run" (ou pressione `Ctrl+Enter`)

**O que este script faz:**
- ✅ Cria tabela `user_roles` para gerenciar permissões
- ✅ Adiciona você (ls8528950@gmail.com) como ADMIN
- ✅ Adiciona seu ajudante (6events.mjt@gmail.com) como ADMIN
- ✅ Remove políticas antigas que bloqueavam criação de eventos
- ✅ Cria novas políticas RLS corretas para:
  - `events` (criar/editar/deletar)
  - `reservations` (criar/visualizar)
  - `tickets` (criar/visualizar)

---

### 2️⃣ **VERIFICAR SE DEU CERTO** (1 minuto)

Ainda no SQL Editor do Supabase, executar:

```sql
-- Ver quem tem permissões
SELECT email, role, created_at 
FROM public.user_roles 
ORDER BY created_at DESC;
```

**Deve aparecer:**
```
ls8528950@gmail.com    | admin | 2025-11-26...
6events.mjt@gmail.com  | admin | 2025-11-26...
```

---

### 3️⃣ **TESTAR NO SITE** (2 minutos)

1. **Fazer logout e login novamente** (para atualizar permissões)
2. Ir em: **Dashboard Admin** → Criar novo evento
3. Preencher formulário e clicar em **"Créer l'événement"**
4. ✅ **Deve funcionar sem erro!**

---

### 4️⃣ **ACESSAR GESTÃO DE PERMISSÕES** (opcional)

**URL:** https://localhost:8080/admin/users

**O que você pode fazer:**
- Ver todos os usuários com permissões
- Adicionar novos admins/managers
- Remover permissões
- Alterar nível de acesso

**Níveis disponíveis:**
- 🔴 **Admin**: Acesso total (criar/editar/deletar tudo)
- 🔵 **Manager**: Criar e editar eventos
- 🟡 **Staff**: Ver relatórios
- ⚪ **User**: Apenas fazer reservas

---

## 🐛 RESOLVER PROBLEMAS

### Erro: "Missing authorization header"
**Solução:** Fazer logout e login novamente

### Erro: "Invalid JWT"
**Solução:** Limpar cache do navegador e fazer login novamente

### Erro: "permission denied for table user_roles"
**Solução:** O script SQL não foi executado corretamente. Executar novamente.

### Seu ajudante ainda não consegue criar eventos
**Solução:** 
1. Verificar se o email dele está correto no script SQL
2. Ele precisa ter conta criada no Supabase Auth (fazer signup primeiro)
3. Depois executar o script SQL
4. Ele precisa fazer logout/login

---

## 📋 EMAILS DOS ADMINISTRADORES

**IMPORTANTE:** Certificar que estes emails estão no script SQL:

```sql
-- Você (owner)
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'ls8528950@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Seu ajudante
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = '6events.mjt@gmail.com'  -- ✅ CONFIRMAR ESTE EMAIL
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

Se o email do seu ajudante for diferente, **EDITAR NO SCRIPT** antes de executar!

---

## ✅ CHECKLIST FINAL

- [ ] Script SQL executado no Supabase
- [ ] Query de verificação mostra 2 admins
- [ ] Você consegue criar eventos sem erro
- [ ] Seu ajudante consegue criar eventos sem erro
- [ ] Página /admin/users acessível
- [ ] Botão "Gestão de Permissões" aparece no Dashboard

---

## 🎉 PRONTO!

Agora vocês dois têm **acesso total** para:
- ✅ Criar eventos
- ✅ Editar eventos
- ✅ Deletar eventos
- ✅ Ver todas as reservas
- ✅ Gerenciar permissões de outros usuários

**Tempo total:** ~10 minutos
