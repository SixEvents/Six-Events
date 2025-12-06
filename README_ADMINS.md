# 🎯 RÉCAPITULATIF - Création des 10 Comptes Admin

## ✅ Ce qui a été fait

**4 fichiers créés pour vous aider :**

1. **create-admin-accounts.sql** - Script SQL complet
   - Politiques RLS pour que seuls les admins créent des événements
   - Fonction de vérification du nombre d'admins
   - Instructions détaillées

2. **ADMIN_ACCOUNTS.md** - Documentation complète
   - Tableau des 10 comptes avec tous les détails
   - Méthodes de création expliquées
   - Tests de vérification
   - Dépannage

3. **create-admins.js** - Script automatisé
   - Créer tous les comptes en une commande
   - Nécessite la Service Role Key de Supabase

4. **GUIDE_CREATION_ADMINS.txt** - Guide visuel
   - Checklist à cocher pour chaque admin
   - Procédure étape par étape
   - Facile à suivre

## 📋 Les 10 Comptes Admin

| # | Email | Nom |
|---|-------|-----|
| 1 | admin1@sixevents.com | Sophie Martin |
| 2 | admin2@sixevents.com | Lucas Dubois |
| 3 | admin3@sixevents.com | Emma Bernard |
| 4 | admin4@sixevents.com | Thomas Petit |
| 5 | admin5@sixevents.com | Léa Richard |
| 6 | admin6@sixevents.com | Nathan Moreau |
| 7 | admin7@sixevents.com | Chloé Laurent |
| 8 | admin8@sixevents.com | Hugo Simon |
| 9 | admin9@sixevents.com | Manon Michel |
| 10 | admin10@sixevents.com | Arthur Garcia |

**Mot de passe pour tous :** `Admin123!SixEvents`

## 🚀 Comment créer les comptes (3 méthodes)

### Méthode 1 : Via l'interface web (Recommandé)
1. Aller sur http://localhost:8080/signup
2. Créer chaque compte avec les emails ci-dessus
3. Dans Supabase Dashboard → Authentication → Users
4. Pour chaque utilisateur, éditer le metadata et ajouter :
   ```json
   {"role": "admin", "full_name": "Sophie Martin"}
   ```

### Méthode 2 : Via Supabase Dashboard
1. Supabase Dashboard → Authentication → Users → Add user
2. Créer avec l'email et mot de passe
3. Ajouter le metadata admin immédiatement

### Méthode 3 : Script automatisé
1. Obtenir votre Service Role Key (Supabase → Settings → API)
2. Modifier `create-admins.js` ligne 16 avec votre key
3. Exécuter : `node create-admins.js`

## 🔒 Sécurité

Les politiques RLS dans `create-admin-accounts.sql` garantissent que :

✅ **SEULS les admins** peuvent créer des événements  
✅ **SEULS les admins** peuvent modifier des événements  
✅ **SEULS les admins** peuvent supprimer des événements  
✅ Les clients peuvent seulement voir et réserver  

## ⚡ Action rapide

**Pour commencer maintenant :**

1. Ouvrir `GUIDE_CREATION_ADMINS.txt`
2. Suivre la procédure pour le premier admin
3. Répéter 9 fois
4. Exécuter `create-admin-accounts.sql` dans Supabase SQL Editor

## 🎉 Une fois terminé

Vous aurez 10 administrateurs qui pourront :
- ✅ Accéder au dashboard admin
- ✅ Créer de nouveaux événements
- ✅ Modifier les événements existants
- ✅ Gérer les réservations
- ✅ Configurer le Party Builder

Les utilisateurs normaux ne pourront QUE :
- ✅ Voir les événements
- ✅ Faire des réservations
- ✅ Utiliser le Party Builder
- ❌ **PAS** créer d'événements

---

**Questions ? Consultez ADMIN_ACCOUNTS.md pour la documentation complète.**
