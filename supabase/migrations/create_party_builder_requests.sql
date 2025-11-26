-- Créer table party_builder_requests pour stocker les demandes
CREATE TABLE IF NOT EXISTS public.party_builder_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_message TEXT,
  custom_theme TEXT NOT NULL,
  selected_options JSONB DEFAULT '[]'::jsonb,
  estimated_price NUMERIC(10, 2) DEFAULT 0,
  final_price NUMERIC(10, 2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'quoted', 'accepted', 'rejected', 'completed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_party_builder_requests_status ON public.party_builder_requests(status);
CREATE INDEX IF NOT EXISTS idx_party_builder_requests_created_at ON public.party_builder_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_party_builder_requests_email ON public.party_builder_requests(client_email);

-- Activer RLS
ALTER TABLE public.party_builder_requests ENABLE ROW LEVEL SECURITY;

-- Admins voient toutes les demandes
CREATE POLICY "Admins can view all party builder requests"
ON public.party_builder_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Admins peuvent mettre à jour les demandes (status, notes, prix final)
CREATE POLICY "Admins can update party builder requests"
ON public.party_builder_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Admins peuvent supprimer des demandes
CREATE POLICY "Admins can delete party builder requests"
ON public.party_builder_requests
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Permettre INSERT pour authenticated (clients créant demandes)
CREATE POLICY "Authenticated users can create party builder requests"
ON public.party_builder_requests
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permettre INSERT pour anon (clients non connectés)
CREATE POLICY "Anonymous users can create party builder requests"
ON public.party_builder_requests
FOR INSERT
TO anon
WITH CHECK (true);

-- Fonction pour update updated_at automatiquement
CREATE OR REPLACE FUNCTION update_party_builder_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_party_builder_requests_updated_at ON public.party_builder_requests;
CREATE TRIGGER trigger_update_party_builder_requests_updated_at
  BEFORE UPDATE ON public.party_builder_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_party_builder_requests_updated_at();

COMMENT ON TABLE public.party_builder_requests IS 'Demandes de fêtes personnalisées via Party Builder';
COMMENT ON COLUMN public.party_builder_requests.custom_theme IS 'Description personnalisée de la décoration souhaitée';
COMMENT ON COLUMN public.party_builder_requests.selected_options IS 'Array JSON des options sélectionnées (animations, décorations, etc)';
COMMENT ON COLUMN public.party_builder_requests.estimated_price IS 'Prix estimé des options (hors décoration personnalisée)';
COMMENT ON COLUMN public.party_builder_requests.final_price IS 'Prix final après étude de la demande par le staff';
