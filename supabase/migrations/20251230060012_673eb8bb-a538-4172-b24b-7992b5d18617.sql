-- ===========================================
-- SYSTÈME DE GAMIFICATION COMPLET - CineVault
-- ===========================================

-- 1. TABLE DES QUÊTES PERMANENTES
-- Objectifs à long terme pour la découverte
CREATE TABLE IF NOT EXISTS public.quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Target',
  category TEXT NOT NULL DEFAULT 'discovery', -- discovery, collection, social, mastery
  quest_type TEXT NOT NULL, -- director_complete, genre_master, decade_explorer, format_collector
  target_config JSONB NOT NULL, -- {director_id: 123, count: 10} ou {genre_id: 27, count: 20}
  xp_reward INTEGER DEFAULT 500,
  badge_reward_id TEXT, -- Badge débloqué à la fin
  rarity TEXT DEFAULT 'epic',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROGRESSION DES QUÊTES PAR UTILISATEUR
CREATE TABLE IF NOT EXISTS public.user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  target_count INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quest_id)
);

-- 3. NOUVEAUX BADGES DE DÉCOUVERTE
-- Badges pour explorer différents genres
INSERT INTO public.badge_definitions (id, title, description, category, icon_name, criteria, base_rarity, xp_reward) VALUES
-- Exploration de genres
('genre_horror_fan', 'Amateur d''Horreur', '10 films d''horreur dans la collection', 'discovery', 'Ghost', '{"type": "genre_count", "genre_id": 27, "count": 10}', 'rare', 300),
('genre_horror_master', 'Maître de l''Horreur', '25 films d''horreur - Vous ne dormez jamais', 'discovery', 'Skull', '{"type": "genre_count", "genre_id": 27, "count": 25}', 'legendary', 800),
('genre_scifi_fan', 'Voyageur Spatial', '10 films de science-fiction', 'discovery', 'Rocket', '{"type": "genre_count", "genre_id": 878, "count": 10}', 'rare', 300),
('genre_scifi_master', 'Commandant Galactique', '25 films de SF - L''espace n''a plus de secrets', 'discovery', 'Satellite', '{"type": "genre_count", "genre_id": 878, "count": 25}', 'legendary', 800),
('genre_action_fan', 'Cascadeur', '10 films d''action', 'discovery', 'Flame', '{"type": "genre_count", "genre_id": 28, "count": 10}', 'rare', 300),
('genre_comedy_fan', 'Boute-en-Train', '10 comédies - Le rire c''est la vie', 'discovery', 'Laugh', '{"type": "genre_count", "genre_id": 35, "count": 10}', 'rare', 300),
('genre_drama_fan', 'Mélodramatique', '10 drames dans la collection', 'discovery', 'Drama', '{"type": "genre_count", "genre_id": 18, "count": 10}', 'rare', 300),
('genre_animation_fan', 'Enfant dans l''Âme', '10 films d''animation', 'discovery', 'Palette', '{"type": "genre_count", "genre_id": 16, "count": 10}', 'rare', 300),
('genre_thriller_fan', 'Frissonnant', '10 thrillers - Tension maximale', 'discovery', 'Siren', '{"type": "genre_count", "genre_id": 53, "count": 10}', 'rare', 300),

-- Exploration multi-genres
('genre_explorer_5', 'Explorateur', '5 genres différents représentés', 'discovery', 'Compass', '{"type": "genre_diversity", "count": 5}', 'rare', 400),
('genre_explorer_10', 'Globe-Trotter Cinéma', '10 genres différents - Éclectique !', 'discovery', 'Globe', '{"type": "genre_diversity", "count": 10}', 'epic', 800),

-- Fans de réalisateurs
('director_spielberg', 'Spielberg Fan', '5 films de Steven Spielberg', 'discovery', 'Clapperboard', '{"type": "director_count", "director_id": 488, "count": 5}', 'epic', 500),
('director_nolan', 'Inception Complète', '5 films de Christopher Nolan', 'discovery', 'Timer', '{"type": "director_count", "director_id": 525, "count": 5}', 'epic', 500),
('director_tarantino', 'Pulp Collector', '5 films de Quentin Tarantino', 'discovery', 'Sword', '{"type": "director_count", "director_id": 138, "count": 5}', 'epic', 500),
('director_kubrick', 'Kubrick Addict', '5 films de Stanley Kubrick', 'discovery', 'Eye', '{"type": "director_count", "director_id": 240, "count": 5}', 'legendary', 700),
('director_scorsese', 'Scorsese Scholar', '5 films de Martin Scorsese', 'discovery', 'Drama', '{"type": "director_count", "director_id": 1032, "count": 5}', 'epic', 500),

-- Diversité de réalisateurs
('director_diversity_5', 'Découvreur', '5 réalisateurs différents', 'discovery', 'Users', '{"type": "director_diversity", "count": 5}', 'common', 200),
('director_diversity_15', 'Connaisseur', '15 réalisateurs différents', 'discovery', 'Crown', '{"type": "director_diversity", "count": 15}', 'rare', 500),
('director_diversity_30', 'Expert en Auteurs', '30 réalisateurs - Vrai cinéphile', 'discovery', 'Award', '{"type": "director_diversity", "count": 30}', 'legendary', 1000)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  criteria = EXCLUDED.criteria,
  xp_reward = EXCLUDED.xp_reward;

-- 4. QUÊTES PERMANENTES DE DÉCOUVERTE
INSERT INTO public.quests (id, title, description, icon_name, category, quest_type, target_config, xp_reward, rarity) VALUES
-- Quêtes par réalisateur
('quest_spielberg_complete', 'Collection Spielberg', 'Collectionnez 10 films de Steven Spielberg', 'Film', 'discovery', 'director_complete', '{"director_id": 488, "director_name": "Steven Spielberg", "count": 10}', 1500, 'legendary'),
('quest_nolan_complete', 'Rêves de Nolan', 'Collectionnez 8 films de Christopher Nolan', 'Timer', 'discovery', 'director_complete', '{"director_id": 525, "director_name": "Christopher Nolan", "count": 8}', 1200, 'epic'),
('quest_tarantino_complete', 'L''Univers Tarantino', 'Collectionnez tous les Tarantino (8 films)', 'Sword', 'discovery', 'director_complete', '{"director_id": 138, "director_name": "Quentin Tarantino", "count": 8}', 1500, 'legendary'),
('quest_kubrick_complete', 'L''Odyssée Kubrick', 'Les œuvres complètes de Kubrick (10 films)', 'Eye', 'discovery', 'director_complete', '{"director_id": 240, "director_name": "Stanley Kubrick", "count": 10}', 2000, 'grail'),

-- Quêtes par genre
('quest_horror_master', 'Maître de l''Épouvante', 'Collectionnez 50 films d''horreur', 'Ghost', 'discovery', 'genre_master', '{"genre_id": 27, "genre_name": "Horreur", "count": 50}', 2000, 'legendary'),
('quest_scifi_master', 'Explorateur Galactique', 'Collectionnez 50 films de SF', 'Rocket', 'discovery', 'genre_master', '{"genre_id": 878, "genre_name": "Science-Fiction", "count": 50}', 2000, 'legendary'),
('quest_action_master', 'Expert en Action', 'Collectionnez 50 films d''action', 'Flame', 'discovery', 'genre_master', '{"genre_id": 28, "genre_name": "Action", "count": 50}', 2000, 'legendary'),

-- Quêtes par décennie
('quest_80s_complete', 'Enfant des 80s', 'Collectionnez 30 films des années 80', 'Gamepad2', 'discovery', 'decade_explorer', '{"decade": 1980, "count": 30}', 1500, 'epic'),
('quest_90s_complete', 'Nostalgie 90s', 'Collectionnez 30 films des années 90', 'Disc', 'discovery', 'decade_explorer', '{"decade": 1990, "count": 30}', 1500, 'epic'),
('quest_golden_age', 'L''Âge d''Or', 'Collectionnez 10 films d''avant 1970', 'Star', 'discovery', 'decade_explorer', '{"before_year": 1970, "count": 10}', 2000, 'legendary'),

-- Quêtes par format
('quest_vhs_hunter', 'Chasseur de VHS', 'Trouvez 20 VHS rares', 'Tv2', 'collection', 'format_collector', '{"format": "vhs", "count": 20}', 1500, 'legendary'),
('quest_4k_elite', 'Élite 4K', 'Collection de 25 films en 4K UHD', 'MonitorPlay', 'collection', 'format_collector', '{"format": "4k", "count": 25}', 1000, 'epic'),
('quest_bluray_library', 'Bibliothèque Blu-ray', 'Atteignez 100 Blu-rays', 'Disc', 'collection', 'format_collector', '{"format": "bluray", "count": 100}', 2000, 'legendary')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  target_config = EXCLUDED.target_config,
  xp_reward = EXCLUDED.xp_reward;

-- 5. NOUVEAUX DÉFIS HEBDOMADAIRES
INSERT INTO public.weekly_challenges (id, title, description, icon_name, challenge_type, target_count, target_value, xp_reward, popcorn_reward) VALUES
('watch_3_movies', 'Marathonien', 'Marquer 3 films comme vus cette semaine', 'Eye', 'watch_movies', 3, NULL, 200, 20),
('explore_new_genre', 'Sortir de sa Zone', 'Ajouter un film d''un genre que vous n''avez pas encore', 'Compass', 'new_genre', 1, NULL, 250, 25),
('discover_classic', 'Retour aux Sources', 'Ajouter un film d''avant 1980', 'Clock', 'decade_specific', 1, '1980', 300, 30),
('rate_5_movies', 'Critique Express', 'Noter 5 films cette semaine', 'Star', 'rate_movies', 5, NULL, 150, 15),
('complete_director', 'Fan Ultime', 'Ajouter 2 films du même réalisateur', 'Clapperboard', 'same_director', 2, NULL, 350, 35)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  xp_reward = EXCLUDED.xp_reward;

-- 6. INDEX POUR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON public.user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_quest_id ON public.user_quests(quest_id);
CREATE INDEX IF NOT EXISTS idx_quests_category ON public.quests(category);
CREATE INDEX IF NOT EXISTS idx_quests_quest_type ON public.quests(quest_type);

-- 7. RLS POLICIES
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;

-- Quests sont visibles par tous
CREATE POLICY "Quests are viewable by everyone"
ON public.quests FOR SELECT
USING (true);

-- User quests policies
CREATE POLICY "Users can view their own quest progress"
ON public.user_quests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quest progress"
ON public.user_quests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quest progress"
ON public.user_quests FOR UPDATE
USING (auth.uid() = user_id);

-- 8. NOUVELLES RÉCOMPENSES COSMÉTIQUES
INSERT INTO public.reward_definitions (id, name, description, reward_type, rarity, preview_data, unlock_criteria) VALUES
-- Nouveaux cadres
('frame_horror', 'Cadre Épouvante', 'Effet sanglant pour les fans d''horreur', 'frame', 'epic', '{"border_color": "#8b0000", "effect": "blood_drip", "animation": "pulse"}', '{"type": "genre_count", "genre_id": 27, "count": 25}'),
('frame_scifi', 'Cadre Holographique', 'Effet futuriste holographique', 'frame', 'epic', '{"border_color": "#00ffff", "effect": "hologram", "animation": "flicker"}', '{"type": "genre_count", "genre_id": 878, "count": 25}'),
('frame_golden', 'Cadre Âge d''Or', 'Style classique hollywoodien', 'frame', 'legendary', '{"border_color": "#daa520", "effect": "film_grain", "border_width": 4}', '{"type": "decade", "before": 1970, "count": 10}'),

-- Nouveaux thèmes
('theme_horror', 'Minuit Sanglant', 'Thème sombre pour les noctambules', 'theme', 'epic', '{"primary": "#1a0000", "accent": "#8b0000", "text": "#ffffff"}', '{"type": "badge_count", "count": 20}'),
('theme_scifi', 'Cyber Futur', 'Néons et circuits', 'theme', 'epic', '{"primary": "#0a0a1a", "accent": "#00ff88", "text": "#e0e0e0"}', '{"type": "quest_complete", "count": 3}'),

-- Nouveaux titres
('title_horror_king', 'Roi de l''Horreur', 'Pour les maîtres de l''épouvante', 'title', 'legendary', '{"text": "Roi de l''Horreur", "color": "#8b0000"}', '{"type": "genre_count", "genre_id": 27, "count": 50}'),
('title_explorer', 'Explorateur Cinéma', 'Curieux de tout', 'title', 'rare', '{"text": "Explorateur", "color": "#00bcd4"}', '{"type": "genre_diversity", "count": 10}'),
('title_quest_master', 'Maître des Quêtes', 'A complété 5 quêtes permanentes', 'title', 'grail', '{"text": "Maître des Quêtes", "color": "#ff6b00"}', '{"type": "quest_complete", "count": 5}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  preview_data = EXCLUDED.preview_data,
  unlock_criteria = EXCLUDED.unlock_criteria;