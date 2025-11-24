# 🚀 Quick Start Guide - Six Events Platform

## 🎯 Étapes de Configuration Rapide

### 1️⃣ Installation des Dépendances

```bash
cd six-events-platform-main
npm install
```

### 2️⃣ Configuration Supabase

1. **Exécuter le script SQL**
   - Ouvrir votre projet Supabase
   - Aller dans **SQL Editor**
   - Copier-coller le contenu de `supabase-setup.sql`
   - Cliquer sur **Run**

2. **Vérifier les variables d'environnement**
   Le fichier `.env` doit contenir :
   ```env
   VITE_SUPABASE_URL=https://rzcdcwwdlnczojmslhax.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 3️⃣ Démarrer l'Application

```bash
npm run dev
```

L'application sera accessible sur : **http://localhost:8080**

## 👤 Créer un Compte Admin

### Méthode 1 : Via l'Interface

1. Cliquer sur **Créer un compte**
2. Remplir le formulaire d'inscription
3. Se connecter avec les identifiants

### Méthode 2 : Promouvoir un utilisateur en Admin

1. Aller dans **Supabase Dashboard** → **Authentication** → **Users**
2. Cliquer sur votre utilisateur
3. Scroller jusqu'à **User Metadata**
4. Cliquer sur **Edit**
5. Ajouter ce JSON :
```json
{
  "role": "admin",
  "full_name": "Admin Name"
}
```
6. Sauvegarder et se reconnecter

## 📝 URLs Importantes

- **🏠 Accueil** : http://localhost:8080/
- **🎪 Événements** : http://localhost:8080/events
- **🎨 Party Builder** : http://localhost:8080/party-builder
- **👤 Profil** : http://localhost:8080/profile
- **👑 Admin Dashboard** : http://localhost:8080/admin
- **📧 Login** : http://localhost:8080/login

## ✅ Vérification de l'Installation

### Checklist :
- [ ] Dépendances installées (`npm install`)
- [ ] Base de données créée (script SQL exécuté)
- [ ] Variables d'environnement configurées (`.env`)
- [ ] Application démarrée (`npm run dev`)
- [ ] Compte créé et testé
- [ ] (Optionnel) Utilisateur promu en admin
- [ ] Dashboard admin accessible

## 🎨 Fonctionnalités à Tester

### En tant que Client :
1. ✅ Créer un compte
2. ✅ Parcourir les événements
3. ✅ Filtrer les événements
4. ✅ Voir les détails d'un événement
5. ✅ Utiliser le Party Builder
6. ✅ Voir mon profil
7. ✅ Consulter mes réservations

### En tant qu'Admin :
1. ✅ Accéder au dashboard admin
2. ✅ Voir les statistiques
3. ✅ Gérer les événements (à venir)
4. ✅ Gérer les réservations (à venir)
5. ✅ Configurer le Party Builder (à venir)

## 🐛 Troubleshooting

### Erreur : "Cannot connect to Supabase"
- Vérifier que les variables d'environnement sont correctes
- Redémarrer le serveur (`npm run dev`)

### Erreur : "Table does not exist"
- Vérifier que le script SQL a été exécuté complètement
- Vérifier dans Supabase → **Table Editor**

### Page blanche / Erreur 404
- Vérifier que le serveur de dev est lancé
- Clear cache du navigateur (Ctrl+Shift+R)

### Erreurs de compilation
- Supprimer `node_modules` et reinstaller : 
  ```bash
  rm -rf node_modules
  npm install
  ```

## 🆘 Support

Pour toute question ou problème :
- 📧 Email : support@sixevents.com
- 📚 Documentation complète : `DATABASE_SETUP.md`
- 🐛 Issues : GitHub Issues

## 🎉 Prêt à Commencer !

Votre plateforme Six Events est maintenant prête à être utilisée !

Explorez toutes les fonctionnalités et créez des moments magiques pour les enfants ! ✨

---

**Fait avec ❤️ pour Six Events**
