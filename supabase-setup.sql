-- ============================================
-- Six Events Platform - Database Setup Script
-- ============================================
-- Execute this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP TABLES (if you want to start fresh)
-- ============================================
-- Uncomment the following lines if you want to reset the database
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS party_builder_orders CASCADE;
-- DROP TABLE IF EXISTS party_builder_options CASCADE;
-- DROP TABLE IF EXISTS reservations CASCADE;
-- DROP TABLE IF EXISTS events CASCADE;
-- DROP TABLE IF EXISTS animators CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

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
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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

-- Table: animators (optional)
CREATE TABLE IF NOT EXISTS animators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specialty TEXT,
  availability JSONB,
  photo_url TEXT,
  email TEXT,
  phone TEXT
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_visible ON events(is_visible);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_event ON reservations(event_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reviews_event ON reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_party_orders_user ON party_builder_orders(user_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_builder_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_builder_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- Events Policies
CREATE POLICY "Public can view visible events"
  ON events FOR SELECT
  USING (is_visible = true OR auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Reservations Policies
CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations"
  ON reservations FOR UPDATE
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Party Builder Options Policies
CREATE POLICY "Public can view active options"
  ON party_builder_options FOR SELECT
  USING (
    is_active = true OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage options"
  ON party_builder_options FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Party Builder Orders Policies
CREATE POLICY "Users can view own orders"
  ON party_builder_orders FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create orders"
  ON party_builder_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON party_builder_orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Reviews Policies
CREATE POLICY "Public can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Sample Events
INSERT INTO events (title, description, date, location, price, max_places, available_places, category, age_range, is_visible) VALUES
('Anniversaire Princesse Magique 👑', 'Une fête féerique pour les petites princesses avec couronne et baguette magique incluses', '2024-12-15 14:00:00', 'Paris 16ème', 45.00, 20, 18, 'fete', '3-5', true),
('Super-Héros Academy 🦸', 'Devenez des super-héros le temps d''une journée ! Capes et masques fournis', '2024-12-22 15:00:00', 'Neuilly-sur-Seine', 50.00, 15, 15, 'atelier', '6-8', true),
('Monde des Licornes 🦄', 'Plongez dans l''univers magique des licornes avec décorations et activités arc-en-ciel', '2024-12-28 14:30:00', 'Versailles', 48.00, 25, 23, 'fete', '3-5', true),
('Atelier Pâtisserie 🧁', 'Les enfants créent leurs propres cupcakes et les décorent', '2025-01-05 10:00:00', 'Paris 15ème', 35.00, 12, 12, 'atelier', '6-8', true),
('Pirate Adventure 🏴‍☠️', 'À l''abordage ! Chasse au trésor et jeux de pirates', '2025-01-12 14:00:00', 'Boulogne-Billancourt', 42.00, 20, 20, 'fete', '5-8', true),
('Magie et Illusions ✨', 'Spectacle de magie interactif avec le Magicien Merveilleux', '2025-01-19 16:00:00', 'Paris 11ème', 38.00, 30, 28, 'spectacle', '4-10', true);

-- Sample Party Builder Options
INSERT INTO party_builder_options (category, name, description, price, max_quantity, is_active) VALUES
-- Themes
('theme', 'Thème Princesse 👑', 'Décoration complète princesse avec couronnes, baguettes magiques et nappes roses', 150.00, 1, true),
('theme', 'Thème Super-Héros 🦸', 'Décoration super-héros avec capes personnalisées et city backdrop', 150.00, 1, true),
('theme', 'Thème Licorne 🦄', 'Décoration arc-en-ciel avec licornes gonflables et ballons pastels', 140.00, 1, true),
('theme', 'Thème Pirate 🏴‍☠️', 'Décoration pirate avec coffre au trésor et drapeau personnalisé', 130.00, 1, true),
('theme', 'Thème Dinosaures 🦕', 'Décoration jungle avec dinosaures et feuillages tropicaux', 140.00, 1, true),

-- Animations
('animation', 'Magicien Professionnel ✨', 'Spectacle de magie interactif de 45 minutes avec participation des enfants', 200.00, 1, true),
('animation', 'Clown Animateur 🤡', 'Animation complète avec jeux, ballons sculptés et maquillage', 180.00, 1, true),
('animation', 'Sculpteur de Ballons 🎈', 'Création de sculptures de ballons personnalisées pour chaque enfant', 120.00, 1, true),
('animation', 'DJ Kids 🎵', 'Ambiance musicale avec jeux dansants et karaoké', 150.00, 1, true),
('animation', 'Atelier Maquillage 🎨', 'Maquilleuse professionnelle pour des transformations magiques', 140.00, 1, true),

-- Decorations
('decoration', 'Arche de Ballons XXL 🎈', 'Magnifique arche de ballons personnalisée aux couleurs du thème (4m)', 80.00, 1, true),
('decoration', 'Bouquets de Ballons 🎈', 'Set de 5 bouquets de ballons assortis au thème', 40.00, 3, true),
('decoration', 'Toile de Fond Photo 📸', 'Backdrop personnalisé pour des photos inoubliables (2x2m)', 60.00, 1, true),
('decoration', 'Guirlandes & Fanions 🎊', 'Décoration murale complète avec guirlandes lumineuses', 35.00, 2, true),

-- Cakes
('cake', 'Gâteau Personnalisé 2 étages 🎂', 'Gâteau sur mesure selon le thème, 2 étages (20-25 parts)', 120.00, 1, true),
('cake', 'Gâteau Thématique Simple 🧁', 'Gâteau décoré selon le thème (15-20 parts)', 80.00, 1, true),
('cake', 'Cupcakes Assortis 🧁', 'Set de 24 cupcakes décorés selon le thème', 50.00, 2, true),
('cake', 'Candy Bar 🍬', 'Table de bonbons et friandises variées (5kg)', 90.00, 1, true),

-- Goodies
('goodies', 'Sacs Surprises Premium 🎁', 'Sacs cadeaux premium avec 5 jouets et bonbons par enfant', 12.00, 30, true),
('goodies', 'Sacs Surprises Standard 🎁', 'Sacs cadeaux avec 3 jouets et bonbons par enfant', 8.00, 30, true),
('goodies', 'Boîte Photobooth 📷', 'Kit complet avec accessoires pour des photos fun', 70.00, 1, true),
('goodies', 'Livre d''Or Personnalisé 📖', 'Livre d''or décoré pour les messages des invités', 25.00, 1, true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- Your database is now ready to use!
-- Don't forget to:
-- 1. Create a user account through the app
-- 2. Set user role to 'admin' in Authentication > Users > User Metadata
-- 3. Test the application!
