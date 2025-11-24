-- ===================================================================
-- SCRIPT EM 2 PASSOS PARA CRIAR ADMIN
-- Execute linha por linha no Supabase SQL Editor
-- ===================================================================

-- PASSO 1: Executar esta query e COPIAR o resultado (seu user ID)
-- ===================================================================
SELECT id, email FROM auth.users WHERE email = 'ls8528950@gmail.com';

-- Você vai ver algo como:
-- id: 1a875icd-85e8-4366-9b9e-b5eaf85c7318
-- email: ls8528950@gmail.com

-- ===================================================================
-- PASSO 2: COLE SEU ID na query abaixo e execute
-- ===================================================================
-- SUBSTITUA 'SEU_ID_AQUI' pelo ID que você copiou no passo 1

INSERT INTO public.profiles (id, email, role)
VALUES ('SEU_ID_AQUI', 'ls8528950@gmail.com', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Exemplo (USE SEU ID REAL!):
-- INSERT INTO public.profiles (id, email, role)
-- VALUES ('1a875icd-85e8-4366-9b9e-b5eaf85c7318', 'ls8528950@gmail.com', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ===================================================================
-- PASSO 3: Verificar se funcionou
-- ===================================================================
SELECT * FROM public.profiles WHERE email = 'ls8528950@gmail.com';

-- Deve mostrar: role = 'admin'
