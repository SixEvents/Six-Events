-- Create admin_settings table for branding configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  logo_url text,
  show_name boolean DEFAULT true,
  site_name text DEFAULT 'Six Events',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read settings
CREATE POLICY "read_admin_settings" ON public.admin_settings
  FOR SELECT USING (true);

-- Policy: Only authenticated users (admins) can update
CREATE POLICY "update_admin_settings_admin_only" ON public.admin_settings
  FOR UPDATE USING (auth.jwt() IS NOT NULL)
  WITH CHECK (auth.jwt() IS NOT NULL);

-- Policy: Only service role can insert
CREATE POLICY "insert_admin_settings_service_role" ON public.admin_settings
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_admin_settings ON public.admin_settings;
CREATE TRIGGER set_updated_at_admin_settings
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Insert default settings
INSERT INTO public.admin_settings (setting_key, logo_url, show_name, site_name)
VALUES ('branding', '/six-events-logo.svg', true, 'Six Events')
ON CONFLICT (setting_key) DO NOTHING;
