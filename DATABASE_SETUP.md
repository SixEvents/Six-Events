# 🎉 Six Events - Plateforme de Gestion d'Événements pour Enfants

Une plateforme moderne et complète pour la réservation d'événements et la personnalisation de fêtes d'anniversaire pour enfants.

## ✨ Fonctionnalités Principales

### 👨‍👩‍👧‍👦 Espace Client
- 🎪 **Galerie d'événements** avec filtres avancés (date, lieu, âge, prix)
- 🎟️ **Système de réservation** en ligne avec QR codes
- 🎨 **Party Builder** - Configurateur interactif pour personnaliser les fêtes
- 👤 **Profil utilisateur** avec historique des réservations
- ⭐ **Système d'avis** et de notation
- 📱 **Interface responsive** et mobile-first

### 👑 Espace Administrateur
- 📊 **Dashboard** avec statistiques en temps réel
- 📅 **Gestion des événements** (CRUD complet)
- 🎫 **Gestion des réservations** avec scanner QR codes
- 🎨 **Gestion Party Builder** - Options personnalisables
- 💰 **Suivi des revenus** et rapports
- 👥 **Gestion des utilisateurs**

## 🛠️ Stack Technique

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Router**: React Router v6
- **State Management**: React Context API
- **Icons**: Lucide React
- **Charts**: Recharts
- **QR Codes**: qrcode.react

## 📦 Installation

1. **Cloner le repository**
```bash
git clone <your-repo-url>
cd six-events-platform-main
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration des variables d'environnement**

Créer un fichier `.env` à la racine :
```env
VITE_SUPABASE_URL=https://rzcdcwwdlnczojmslhax.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Y2Rjd3dkbG5jem9qbXNsaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzAxMzIsImV4cCI6MjA3OTUwNjEzMn0.zaVbXaMDNIMwh_x5D28F858jw0wPZ76fEfbWoMH6OyQ
```

## 🗄️ Configuration Supabase

### 1. Créer les tables

Exécutez le script SQL suivant dans votre console Supabase SQL Editor :

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  location TEXT,
  price DECIMAL(10, 2),
  max_places INTEGER,
  available_places INTEGER,
  images TEXT[],
  is_visible BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  age_range TEXT,
  category TEXT
);

-- Table: reservations
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  number_of_places INTEGER NOT NULL,
  total_price DECIMAL(10, 2),
  status TEXT CHECK (status IN ('confirmed', 'cancelled', 'pending')) DEFAULT 'pending',
  qr_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT
);

-- Table: party_builder_options
CREATE TABLE IF NOT EXISTS party_builder_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT CHECK (category IN ('theme', 'animation', 'decoration', 'cake', 'goodies')),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  max_quantity INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT
);

-- Table: party_builder_orders
CREATE TABLE IF NOT EXISTS party_builder_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_options JSONB,
  total_price DECIMAL(10, 2),
  event_date TIMESTAMP,
  status TEXT CHECK (status IN ('draft', 'confirmed', 'cancelled')) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  child_name TEXT,
  child_age INTEGER,
  location TEXT,
  guest_count INTEGER
);

-- Table: reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  user_name TEXT
);

-- Table: animators (optionnel)
CREATE TABLE IF NOT EXISTS animators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specialty TEXT,
  availability JSONB,
  photo_url TEXT,
  email TEXT,
  phone TEXT
);

-- Indexes pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_visible ON events(is_visible);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_event ON reservations(event_id);
CREATE INDEX IF NOT EXISTS idx_reviews_event ON reviews(event_id);
```

### 2. Configurer Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_builder_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_builder_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Events: Public read, admin write
CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Admins can insert events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update events" ON events
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Reservations: Users see their own, admins see all
CREATE POLICY "Users can view their own reservations" ON reservations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reservations" ON reservations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Users can create reservations" ON reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Party Builder Options: Public read, admin write
CREATE POLICY "Options are viewable by everyone" ON party_builder_options
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage options" ON party_builder_options
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Party Builder Orders: Users see their own
CREATE POLICY "Users can view their own orders" ON party_builder_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON party_builder_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reviews: Everyone can read, authenticated users can write
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 3. Données de test (optionnel)

```sql
-- Insérer des événements de test
INSERT INTO events (title, description, date, location, price, max_places, available_places, category, age_range, is_visible) VALUES
('Anniversaire Princesse Magique', 'Une fête féerique pour les petites princesses', '2024-12-15 14:00:00', 'Paris 16ème', 45, 20, 18, 'fete', '3-5', true),
('Super-Héros Academy', 'Devenez des super-héros le temps d''une journée', '2024-12-22 15:00:00', 'Neuilly-sur-Seine', 50, 15, 15, 'atelier', '6-8', true),
('Monde des Licornes', 'Plongez dans l''univers magique des licornes', '2024-12-28 14:30:00', 'Versailles', 48, 25, 23, 'fete', '3-5', true);

-- Insérer des options Party Builder
INSERT INTO party_builder_options (category, name, description, price, max_quantity, is_active) VALUES
('theme', 'Thème Princesse', 'Décoration complète princesse avec couronne', 150, 1, true),
('theme', 'Thème Super-Héros', 'Décoration super-héros avec capes', 150, 1, true),
('animation', 'Magicien Professionnel', 'Spectacle de magie de 45 minutes', 200, 1, true),
('animation', 'Clown Animateur', 'Animation jeux et ballons sculptés', 180, 1, true),
('decoration', 'Arche de Ballons', 'Magnifique arche de ballons personnalisée', 80, 1, true),
('cake', 'Gâteau Personnalisé', 'Gâteau sur mesure selon le thème', 120, 1, true),
('goodies', 'Sacs Surprises', 'Petits cadeaux pour chaque invité', 8, 20, true);
```

## 🚀 Démarrage

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

## 👤 Créer un compte Admin

1. Créer un compte via l'interface `/signup`
2. Dans Supabase Dashboard, aller dans Authentication > Users
3. Cliquer sur l'utilisateur
4. Dans "User Metadata", ajouter :
```json
{
  "role": "admin",
  "full_name": "Admin Name"
}
```

## 📱 Structure du Projet

```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants UI (shadcn)
│   ├── Navbar.tsx      # Navigation
│   └── ProtectedRoute.tsx
├── contexts/           # React Context (Auth)
├── hooks/              # Custom hooks
├── lib/                # Configuration (Supabase)
├── pages/              # Pages de l'application
│   ├── admin/          # Pages administrateur
│   ├── Home.tsx
│   ├── Events.tsx
│   ├── EventDetail.tsx
│   ├── PartyBuilder.tsx
│   ├── Profile.tsx
│   └── ...
├── types/              # Types TypeScript
└── App.tsx             # Point d'entrée
```

## 🎨 Design System

### Couleurs Principales
- **Rose Primary**: `#e5498d` - Actions principales
- **Violet Accent**: `hsl(280, 75%, 65%)` - Accents
- **Noir**: Textes
- **Blanc**: Arrière-plans

### Animations
- Framer Motion pour les transitions
- Hover effects sur les cards
- Loading states personnalisés

## 🔐 Sécurité

- ✅ Row Level Security (RLS) activé sur toutes les tables
- ✅ Authentification JWT avec Supabase Auth
- ✅ Variables d'environnement pour les clés sensibles
- ✅ Validation côté serveur via RLS policies
- ✅ Protection des routes admin

## 📝 TODO / Améliorations Futures

- [ ] Intégration paiement Stripe/PayPal
- [ ] Envoi d'emails automatiques (confirmations, rappels)
- [ ] Export PDF/Excel des réservations
- [ ] Scanner QR Code pour check-in
- [ ] Notifications push en temps réel
- [ ] PWA pour installation mobile
- [ ] Multi-langue (FR/EN)
- [ ] Mode sombre
- [ ] Programme de fidélité
- [ ] Système de wishlist
- [ ] Calendrier visuel des événements

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT License

## 👨‍💻 Support

Pour toute question ou problème, contactez : support@sixevents.com

---

**Fait avec ❤️ pour Six Events**
