-- Table for event gallery photos
CREATE TABLE IF NOT EXISTS gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_gallery_photos_display_order ON gallery_photos(display_order DESC, created_at DESC);

-- Enable RLS
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

-- Public read access for all users
CREATE POLICY "Allow public read access to gallery photos"
  ON gallery_photos
  FOR SELECT
  USING (true);

-- Admin write access (authenticated users only - you can restrict further if needed)
CREATE POLICY "Allow authenticated users to insert gallery photos"
  ON gallery_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update gallery photos"
  ON gallery_photos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete gallery photos"
  ON gallery_photos
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gallery_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_gallery_photos_updated_at
  BEFORE UPDATE ON gallery_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_photos_updated_at();
