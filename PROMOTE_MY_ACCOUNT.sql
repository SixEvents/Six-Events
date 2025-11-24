-- ============================================
-- PROMOTION DE VOTRE COMPTE EN ADMIN
-- ============================================
-- Copiez-collez cette commande dans Supabase SQL Editor et cliquez sur RUN

-- Mettre à jour le compte ls8528950@gmail.com en admin
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin", "full_name": "Administrateur Principal"}'::jsonb
WHERE email = 'ls8528950@gmail.com';

-- Vérifier que ça a fonctionné
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'full_name' as nom,
  created_at
FROM auth.users
WHERE email = 'ls8528950@gmail.com';

-- ============================================
-- RÉSULTAT ATTENDU:
-- ============================================
-- Vous devriez voir:
-- email: ls8528950@gmail.com
-- role: admin
-- nom: Administrateur Principal
-- created_at: (date de création)
-- ============================================
