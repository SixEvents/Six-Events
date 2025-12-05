-- Create gallery_photos table
CREATE TABLE gallery_photos (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  photo_url TEXT NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read gallery photos
CREATE POLICY "Allow public read access" ON gallery_photos
  FOR SELECT USING (is_active = TRUE);

-- Allow authenticated users to manage gallery photos
CREATE POLICY "Allow authenticated users full access" ON gallery_photos
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'admin@sixevents.com'
  );

-- Create index for ordering
CREATE INDEX idx_gallery_photos_order ON gallery_photos(display_order);
