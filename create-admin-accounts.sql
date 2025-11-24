-- ============================================
-- Création de 10 Comptes Administrateurs
-- Six Events Platform
-- ============================================

-- IMPORTANT: Exécutez ce script dans Supabase Dashboard > SQL Editor
-- Ces comptes auront les droits de créer et gérer des événements

-- ============================================
-- FONCTION POUR CRÉER UN UTILISATEUR ADMIN
-- ============================================

-- Note: Supabase Auth ne permet pas de créer des utilisateurs directement via SQL
-- Vous devez utiliser l'une des méthodes suivantes:

-- MÉTHODE 1: Via Supabase Dashboard (RECOMMANDÉ)
-- 1. Aller dans Authentication > Users
-- 2. Cliquer sur "Add user" > "Create new user"
-- 3. Remplir les informations ci-dessous
-- 4. Après création, cliquer sur l'utilisateur
-- 5. Scroller jusqu'à "User Metadata" > Edit
-- 6. Ajouter: {"role": "admin", "full_name": "Nom complet"}

-- ============================================
-- LISTE DES 10 COMPTES ADMIN À CRÉER
-- ============================================

/*
ADMIN 1:
Email: admin1@sixevents.com
Password: Admin123!SixEvents
Metadata: {"role": "admin", "full_name": "Sophie Martin"}

ADMIN 2:
Email: admin2@sixevents.com
Password: Admin123!SixEvents
Metadata: {"role": "admin", "full_name": "Lucas Dubois"}

ADMIN 3:
Email: admin3@sixevents.com
Password: Admin123!SixEvents
Metadata: {"role": "admin", "full_name": "Emma Bernard"}

ADMIN 4:
Email: admin4@sixevents.com
Password: Admin123!SixEvents
Metadata: {"role": "admin", "full_name": "Thomas Petit"}

ADMIN 5:
Email: admin5@sixevents.com
Password: Admin123!SixEvents
Metadata: {"role": "admin", "full_name": "Léa Richard"}

ADMIN 6:
Email: admin6@sixevents.com
Password: Admin123!SixEvents
Metadata: {"role": "admin", "full_name": "Nathan Moreau"}

ADMIN 7:
Email: admin7@sixevents.com
Password: Admin123!SixEvents
Metadata: {"role": "admin", "full_name": "Chloé Laurent"}

ADMIN 8:
Email: admin8@sixevents.com
Password: Admin123!SixEvents
Metadata: {"role": "admin", "full_name": "Hugo Simon"}

ADMIN 9:
Email: admin9@sixevents.com
Password: Admin123!SixEvents
Metadata: {"role": "admin", "full_name": "Manon Michel"}

ADMIN 10:
Email: admin10@sixevents.com
Password: Admin123!SixEvents
Metadata: {"role": "admin", "full_name": "Arthur Garcia"}
*/

-- ============================================
-- MÉTHODE 2: Via Supabase CLI (Alternatif)
-- ============================================

-- Si vous utilisez Supabase CLI, exécutez ces commandes dans votre terminal:

/*
supabase auth create admin1@sixevents.com --password "Admin123!SixEvents" --metadata '{"role":"admin","full_name":"Sophie Martin"}'
supabase auth create admin2@sixevents.com --password "Admin123!SixEvents" --metadata '{"role":"admin","full_name":"Lucas Dubois"}'
supabase auth create admin3@sixevents.com --password "Admin123!SixEvents" --metadata '{"role":"admin","full_name":"Emma Bernard"}'
supabase auth create admin4@sixevents.com --password "Admin123!SixEvents" --metadata '{"role":"admin","full_name":"Thomas Petit"}'
supabase auth create admin5@sixevents.com --password "Admin123!SixEvents" --metadata '{"role":"admin","full_name":"Léa Richard"}'
supabase auth create admin6@sixevents.com --password "Admin123!SixEvents" --metadata '{"role":"admin","full_name":"Nathan Moreau"}'
supabase auth create admin7@sixevents.com --password "Admin123!SixEvents" --metadata '{"role":"admin","full_name":"Chloé Laurent"}'
supabase auth create admin8@sixevents.com --password "Admin123!SixEvents" --metadata '{"role":"admin","full_name":"Hugo Simon"}'
supabase auth create admin9@sixevents.com --password "Admin123!SixEvents" --metadata '{"role":"admin","full_name":"Manon Michel"}'
supabase auth create admin10@sixevents.com --password "Admin123!SixEvents" --metadata '{"role":"admin","full_name":"Arthur Garcia"}'
*/

-- ============================================
-- VÉRIFICATION DES POLITIQUES RLS
-- ============================================

-- Assurons-nous que seuls les admins peuvent créer des événements
-- Ces politiques sont déjà dans supabase-setup.sql mais on les vérifie ici

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Public can view visible events" ON events;
DROP POLICY IF EXISTS "Admins can insert events" ON events;
DROP POLICY IF EXISTS "Admins can update events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;

-- POLITIQUE 1: Voir les événements visibles (tout le monde)
CREATE POLICY "Public can view visible events"
  ON events FOR SELECT
  USING (
    is_visible = true OR 
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- POLITIQUE 2: SEULS LES ADMINS peuvent créer des événements
CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- POLITIQUE 3: SEULS LES ADMINS peuvent modifier des événements
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- POLITIQUE 4: SEULS LES ADMINS peuvent supprimer des événements
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================
-- FONCTION DE VÉRIFICATION
-- ============================================

-- Cette fonction permet de vérifier combien d'admins sont créés
CREATE OR REPLACE FUNCTION count_admin_users()
RETURNS TABLE (
  total_users BIGINT,
  admin_users BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin') as admin_users;
END;
$$;

-- Exécutez cette requête pour voir le nombre d'admins
-- SELECT * FROM count_admin_users();

-- ============================================
-- INSTRUCTIONS FINALES
-- ============================================

/*
ÉTAPES À SUIVRE:

1. CRÉER LES COMPTES (choisir une méthode):
   
   A) Via Supabase Dashboard:
      - Aller dans Authentication > Users
      - Créer manuellement chaque utilisateur avec les informations ci-dessus
      - Ne pas oublier d'ajouter le metadata {"role": "admin"}
   
   B) Via l'interface de l'application:
      - Aller sur http://localhost:8080/signup
      - Créer chaque compte avec les emails ci-dessus
      - Ensuite dans Supabase Dashboard, modifier le metadata de chaque utilisateur

2. VÉRIFIER LA CONFIGURATION:
   - Exécuter ce script SQL pour appliquer les politiques RLS
   - Exécuter: SELECT * FROM count_admin_users();
   - Vous devriez voir 10 utilisateurs admin

3. TESTER:
   - Se connecter avec admin1@sixevents.com
   - Aller dans le dashboard admin
   - Essayer de créer un événement
   - Vérifier que les utilisateurs normaux ne peuvent PAS créer d'événements

SÉCURITÉ:
- Changez les mots de passe par défaut après la première connexion
- Les politiques RLS garantissent que seuls les admins peuvent créer des événements
- Les clients peuvent seulement VOIR les événements et faire des réservations
*/

-- ============================================
-- MESSAGE DE CONFIRMATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Script de configuration des comptes admin prêt!';
  RAISE NOTICE '📧 10 comptes admin à créer manuellement';
  RAISE NOTICE '🔒 Politiques RLS appliquées - Seuls les admins peuvent créer des événements';
  RAISE NOTICE '📖 Consultez les instructions ci-dessus pour créer les comptes';
END $$;
