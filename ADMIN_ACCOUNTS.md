    # 👑 Comptes Administrateurs - Six Events

## 📋 Liste des 10 Comptes Admin

| # | Email | Mot de Passe | Nom Complet | Statut |
|---|-------|--------------|-------------|---------|
| 1 | admin1@sixevents.com | `Admin123!SixEvents` | Sophie Martin | ⏳ À créer |
| 2 | admin2@sixevents.com | `Admin123!SixEvents` | Lucas Dubois | ⏳ À créer |
| 3 | admin3@sixevents.com | `Admin123!SixEvents` | Emma Bernard | ⏳ À créer |
| 4 | admin4@sixevents.com | `Admin123!SixEvents` | Thomas Petit | ⏳ À créer |
| 5 | admin5@sixevents.com | `Admin123!SixEvents` | Léa Richard | ⏳ À créer |
| 6 | admin6@sixevents.com | `Admin123!SixEvents` | Nathan Moreau | ⏳ À créer |
| 7 | admin7@sixevents.com | `Admin123!SixEvents` | Chloé Laurent | ⏳ À créer |
| 8 | admin8@sixevents.com | `Admin123!SixEvents` | Hugo Simon | ⏳ À créer |
| 9 | admin9@sixevents.com | `Admin123!SixEvents` | Manon Michel | ⏳ À créer |
| 10 | admin10@sixevents.com | `Admin123!SixEvents` | Arthur Garcia | ⏳ À créer |

## 🚀 Méthode 1 : Création via l'Interface Web (Recommandé)

### Étape 1 : Créer les comptes sur l'application

1. Ouvrir http://localhost:8080/signup
2. Pour chaque admin, remplir le formulaire :
   - **Email** : admin1@sixevents.com (puis admin2, admin3, etc.)
   - **Mot de passe** : Admin123!SixEvents
   - **Confirmer le mot de passe** : Admin123!SixEvents
3. Cliquer sur "Créer un compte"
4. Répéter pour les 10 comptes

### Étape 2 : Promouvoir en Admin dans Supabase

1. Aller sur votre **Supabase Dashboard** : https://app.supabase.com
2. Sélectionner votre projet
3. Aller dans **Authentication** → **Users**
4. Pour chaque utilisateur créé :
   - Cliquer sur l'utilisateur
   - Scroller jusqu'à **Raw User Meta Data**
   - Cliquer sur le bouton **Edit** (crayon)
   - Remplacer le contenu par :
   ```json
   {
     "role": "admin",
     "full_name": "Sophie Martin"
   }
   ```
   (Adapter le nom selon l'admin)
   - Cliquer sur **Save**

## 🔧 Méthode 2 : Création via Supabase Dashboard

### Option Directe

1. Aller sur **Supabase Dashboard** → **Authentication** → **Users**
2. Cliquer sur **Add user** → **Create new user**
3. Remplir :
   - **Email** : admin1@sixevents.com
   - **Password** : Admin123!SixEvents
   - **Auto Confirm User** : ✅ (coché)
4. Après création, éditer l'utilisateur
5. Dans **Raw User Meta Data**, ajouter :
   ```json
   {
     "role": "admin",
     "full_name": "Sophie Martin"
   }
   ```
6. Répéter pour les 10 comptes

## 🔒 Sécurité : Politiques RLS

Les politiques suivantes garantissent que **SEULS LES ADMINS** peuvent créer des événements :

```sql
-- ✅ Exécuté automatiquement dans create-admin-accounts.sql

-- Seuls les admins peuvent CRÉER des événements
CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Seuls les admins peuvent MODIFIER des événements
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Seuls les admins peuvent SUPPRIMER des événements
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );
```

## ✅ Vérification

### 1. Exécuter le script SQL de configuration

Dans **Supabase Dashboard** → **SQL Editor** :

```sql
-- Copier-coller le contenu de create-admin-accounts.sql
-- Puis exécuter
```

### 2. Vérifier le nombre d'admins

```sql
SELECT * FROM count_admin_users();
```

Résultat attendu :
```
total_users | admin_users
------------|------------
     10     |     10
```

### 3. Tester les permissions

#### Test Admin (doit réussir) ✅
1. Se connecter avec `admin1@sixevents.com`
2. Aller sur http://localhost:8080/admin
3. Créer un nouvel événement
4. ✅ L'événement est créé avec succès

#### Test Client (doit échouer) ❌
1. Créer un compte client normal
2. Essayer de créer un événement via l'API
3. ❌ Erreur : "You don't have permission to create events"

## 🎯 Droits des Admins vs Clients

| Action | Admin | Client |
|--------|-------|--------|
| Voir les événements | ✅ Tous | ✅ Visibles seulement |
| Créer un événement | ✅ Oui | ❌ Non |
| Modifier un événement | ✅ Oui | ❌ Non |
| Supprimer un événement | ✅ Oui | ❌ Non |
| Faire une réservation | ✅ Oui | ✅ Oui |
| Voir toutes les réservations | ✅ Oui | ❌ Non (seulement les siennes) |
| Accéder au dashboard admin | ✅ Oui | ❌ Non |

## 🔐 Bonnes Pratiques de Sécurité

1. **Changer les mots de passe** après la première connexion
2. **Activer 2FA** (Two-Factor Authentication) dans Supabase
3. **Limiter les invitations** : Ne pas partager les identifiants admin
4. **Rotation des mots de passe** : Changer tous les 3 mois
5. **Surveiller les logs** : Vérifier les activités suspectes dans Supabase

## 🆘 Dépannage

### Problème : "Permission denied" lors de la création d'événement

**Solution** :
1. Vérifier que le user metadata contient bien `"role": "admin"`
2. Se déconnecter et se reconnecter
3. Vérifier les politiques RLS dans Supabase

### Problème : Le compte admin ne voit pas le dashboard

**Solution** :
1. Dans `AuthContext`, vérifier que `isAdmin` est calculé correctement
2. Le metadata doit être **exactement** : `{"role": "admin"}`
3. Rafraîchir le navigateur (Ctrl+Shift+R)

### Problème : Impossible de créer des utilisateurs

**Solution** :
1. Vérifier que l'authentification email est activée dans Supabase
2. Désactiver la confirmation email pour les tests :
   - Supabase Dashboard → Authentication → Settings
   - **Enable email confirmations** : Désactivé

## 📊 Monitoring

### Voir tous les admins actuels

```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as name,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin'
ORDER BY created_at DESC;
```

### Voir les événements créés par admin

```sql
SELECT 
  e.id,
  e.title,
  e.date,
  u.email as created_by_email,
  u.raw_user_meta_data->>'full_name' as admin_name
FROM events e
LEFT JOIN auth.users u ON e.created_by = u.id
ORDER BY e.created_at DESC;
```

## 🎉 Prêt !

Une fois les 10 comptes créés et configurés, votre plateforme Six Events aura une équipe complète d'administrateurs prêts à gérer les événements !

---

**Créé le** : 24 novembre 2025  
**Plateforme** : Six Events  
**Sécurité** : RLS Policies actives ✅
