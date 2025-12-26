-- =====================================================
-- CINEVAULT: Entity Following & Release Notifications
-- =====================================================

-- 1. Table pour suivre acteurs, réalisateurs, studios
CREATE TABLE IF NOT EXISTS public.entity_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('person', 'company')),
  entity_id INTEGER NOT NULL,
  entity_name TEXT NOT NULL,
  entity_image_path TEXT,
  entity_role TEXT, -- 'actor', 'director', 'studio', 'production_company'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_type, entity_id)
);

-- 2. Table pour les notifications de sorties de films
CREATE TABLE IF NOT EXISTS public.release_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster_path TEXT,
  release_date DATE,
  entity_type TEXT NOT NULL, -- 'person' ou 'company'
  entity_id INTEGER NOT NULL,
  entity_name TEXT NOT NULL,
  entity_role TEXT, -- 'actor', 'director', 'studio'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Table cache pour les métadonnées des studios (évite les appels API répétés)
CREATE TABLE IF NOT EXISTS public.companies_metadata (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  headquarters TEXT,
  homepage TEXT,
  logo_path TEXT,
  origin_country TEXT,
  parent_company_id INTEGER,
  parent_company_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Table pour les badges liés aux studios
INSERT INTO public.badge_definitions (id, name, description, category, rarity, icon_name, unlock_criteria, xp_reward)
VALUES 
  -- Studios majeurs
  ('studio_warner', 'Warner Bros Fan', 'Possédez 10 films Warner Bros', 'studio', 'rare', 'Building2', '{"type": "studio_collection", "company_id": 174, "count": 10}', 150),
  ('studio_universal', 'Universal Fan', 'Possédez 10 films Universal', 'studio', 'rare', 'Building2', '{"type": "studio_collection", "company_id": 33, "count": 10}', 150),
  ('studio_paramount', 'Paramount Fan', 'Possédez 10 films Paramount', 'studio', 'rare', 'Building2', '{"type": "studio_collection", "company_id": 4, "count": 10}', 150),
  ('studio_disney', 'Disney Fan', 'Possédez 10 films Disney', 'studio', 'rare', 'Building2', '{"type": "studio_collection", "company_id": 2, "count": 10}', 150),
  ('studio_sony', 'Sony Fan', 'Possédez 10 films Sony/Columbia', 'studio', 'rare', 'Building2', '{"type": "studio_collection", "company_id": 5, "count": 10}', 150),
  ('studio_fox', '20th Century Fan', 'Possédez 10 films 20th Century', 'studio', 'rare', 'Building2', '{"type": "studio_collection", "company_id": 25, "count": 10}', 150),
  -- Studios indépendants cultes
  ('studio_a24', 'A24 Aficionado', 'Possédez 5 films A24', 'studio', 'epic', 'Sparkles', '{"type": "studio_collection", "company_id": 41077, "count": 5}', 200),
  ('studio_blumhouse', 'Blumhouse Horror', 'Possédez 5 films Blumhouse', 'studio', 'epic', 'Ghost', '{"type": "studio_collection", "company_id": 3172, "count": 5}', 200),
  ('studio_ghibli', 'Ghibli Dreamer', 'Possédez 5 films Studio Ghibli', 'studio', 'legendary', 'Cloud', '{"type": "studio_collection", "company_id": 10342, "count": 5}', 300),
  ('studio_pixar', 'Pixar Collector', 'Possédez 5 films Pixar', 'studio', 'epic', 'Clapperboard', '{"type": "studio_collection", "company_id": 3, "count": 5}', 200),
  ('studio_marvel', 'Marvel Universe', 'Possédez 10 films Marvel Studios', 'studio', 'epic', 'Zap', '{"type": "studio_collection", "company_id": 420, "count": 10}', 250),
  ('studio_dc', 'DC Universe', 'Possédez 10 films DC', 'studio', 'epic', 'Shield', '{"type": "studio_collection", "company_id": 128064, "count": 10}', 250),
  -- Distributeurs français
  ('studio_gaumont', 'Gaumont Fan', 'Possédez 5 films Gaumont', 'studio', 'rare', 'Film', '{"type": "studio_collection", "company_id": 9, "count": 5}', 150),
  ('studio_pathe', 'Pathé Fan', 'Possédez 5 films Pathé', 'studio', 'rare', 'Film', '{"type": "studio_collection", "company_id": 2622, "count": 5}', 150),
  -- Badges de niveau avancé
  ('studio_master_5', 'Studio Explorer', 'Suivez 5 studios différents', 'studio', 'rare', 'Compass', '{"type": "studios_followed", "count": 5}', 100),
  ('studio_master_10', 'Studio Connoisseur', 'Suivez 10 studios différents', 'studio', 'epic', 'Award', '{"type": "studios_followed", "count": 10}', 200)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.entity_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entity_follows
CREATE POLICY "Users can view own follows" ON public.entity_follows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view all follows for stats" ON public.entity_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow entities" ON public.entity_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow entities" ON public.entity_follows
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for release_notifications
CREATE POLICY "Users can view own notifications" ON public.release_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.release_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.release_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.release_notifications
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for companies_metadata (public read)
CREATE POLICY "Anyone can read company metadata" ON public.companies_metadata
  FOR SELECT USING (true);

CREATE POLICY "System can insert company metadata" ON public.companies_metadata
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update company metadata" ON public.companies_metadata
  FOR UPDATE USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entity_follows_user ON public.entity_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_follows_entity ON public.entity_follows(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_release_notifications_user ON public.release_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_release_notifications_unread ON public.release_notifications(user_id, is_read) WHERE is_read = false;

-- Function to get followed entities for a user
CREATE OR REPLACE FUNCTION get_user_followed_entities(p_user_id UUID)
RETURNS TABLE (
  entity_type TEXT,
  entity_id INTEGER,
  entity_name TEXT,
  entity_image_path TEXT,
  entity_role TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ef.entity_type,
    ef.entity_id,
    ef.entity_name,
    ef.entity_image_path,
    ef.entity_role,
    ef.created_at
  FROM entity_follows ef
  WHERE ef.user_id = p_user_id
  ORDER BY ef.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count followers for an entity
CREATE OR REPLACE FUNCTION get_entity_followers_count(p_entity_type TEXT, p_entity_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM entity_follows
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
