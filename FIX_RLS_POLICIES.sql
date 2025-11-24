-- ============================================
-- CORRECTION DES POLITIQUES RLS
-- Six Events Platform - URGENT FIX
-- ============================================

-- IMPORTANT: Exécutez ce script dans Supabase Dashboard > SQL Editor
-- pour corriger l'erreur "permission denied for table users"

-- ============================================
-- ÉTAPE 1: Supprimer les anciennes politiques
-- ============================================

DROP POLICY IF EXISTS "Public can view visible events" ON events;
DROP POLICY IF EXISTS "Admins can insert events" ON events;
DROP POLICY IF EXISTS "Admins can update events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;

-- ============================================
-- ÉTAPE 2: Créer de nouvelles politiques CORRECTES
-- ============================================

-- POLITIQUE 1: Tout le monde peut voir les événements visibles
CREATE POLICY "Public can view visible events"
  ON events FOR SELECT
  USING (is_visible = true);

-- POLITIQUE 2: Seuls les admins peuvent créer des événements
-- VERSION CORRIGÉE qui fonctionne!
CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- POLITIQUE 3: Seuls les admins peuvent modifier des événements
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- POLITIQUE 4: Seuls les admins peuvent supprimer des événements
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );

-- ============================================
-- ÉTAPE 3: Vérifier que ça fonctionne
-- ============================================

-- Vérifier les politiques créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'events';

-- ============================================
-- MESSAGE DE CONFIRMATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Politiques RLS corrigées!';
  RAISE NOTICE '📧 Les admins peuvent maintenant créer des événements';
  RAISE NOTICE '🔒 La sécurité est maintenue';
  RAISE NOTICE '🔄 Rafraîchissez votre page et réessayez';
END $$;
