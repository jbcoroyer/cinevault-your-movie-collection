-- ==========================================
-- SYSTÈME DE GAMIFICATION COMPLET VIDÉO CLUB
-- ==========================================

-- Table des streaks de connexion
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE,
  streak_frozen_until DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Table des bonus quotidiens
CREATE TABLE public.daily_bonuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  claimed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  bonus_type TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, claimed_date)
);

-- Table des défis hebdomadaires (templates)
CREATE TABLE public.weekly_challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  challenge_type TEXT NOT NULL, -- 'add_movies', 'write_reviews', 'format_specific', 'genre_specific'
  target_count INTEGER NOT NULL DEFAULT 1,
  target_value TEXT, -- format ou genre spécifique
  xp_reward INTEGER NOT NULL DEFAULT 100,
  popcorn_reward INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table de progression des défis utilisateurs
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES public.weekly_challenges(id),
  week_start DATE NOT NULL,
  current_progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, challenge_id, week_start)
);

-- Table des événements saisonniers
CREATE TABLE public.seasonal_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  theme_color TEXT NOT NULL DEFAULT '#ff6b00',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  event_type TEXT NOT NULL, -- 'halloween', 'christmas', 'summer', 'festival'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des badges d'événements
CREATE TABLE public.event_badges (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.seasonal_events(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  criteria JSONB NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 200,
  rarity TEXT NOT NULL DEFAULT 'epic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des récompenses utilisateurs (titres, cadres, thèmes)
CREATE TABLE public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL, -- 'title', 'frame', 'theme'
  reward_id TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  reward_data JSONB DEFAULT '{}',
  is_equipped BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, reward_type, reward_id)
);

-- Table des définitions de récompenses
CREATE TABLE public.reward_definitions (
  id TEXT PRIMARY KEY,
  reward_type TEXT NOT NULL, -- 'title', 'frame', 'theme'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  preview_data JSONB NOT NULL DEFAULT '{}',
  unlock_criteria JSONB NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'rare',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_definitions ENABLE ROW LEVEL SECURITY;

-- Policies user_streaks
CREATE POLICY "Users can view own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies daily_bonuses
CREATE POLICY "Users can view own bonuses" ON public.daily_bonuses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bonuses" ON public.daily_bonuses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies weekly_challenges (public read)
CREATE POLICY "Anyone can view challenges" ON public.weekly_challenges FOR SELECT USING (true);

-- Policies user_challenges
CREATE POLICY "Users can view own challenges" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenges" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies seasonal_events (public read)
CREATE POLICY "Anyone can view events" ON public.seasonal_events FOR SELECT USING (true);

-- Policies event_badges (public read)
CREATE POLICY "Anyone can view event badges" ON public.event_badges FOR SELECT USING (true);

-- Policies user_rewards
CREATE POLICY "Users can view own rewards" ON public.user_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own rewards" ON public.user_rewards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rewards" ON public.user_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies reward_definitions (public read)
CREATE POLICY "Anyone can view reward definitions" ON public.reward_definitions FOR SELECT USING (true);

-- Ajouter equipped_frame et equipped_theme à profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_frame TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_theme TEXT DEFAULT NULL;

-- ==========================================
-- INSERTION DES BADGES ÉTENDUS
-- ==========================================

-- Supprimer les anciens badges pour les remplacer
DELETE FROM public.user_badges;
DELETE FROM public.badge_definitions;

-- BADGES COLLECTION (existants améliorés)
INSERT INTO public.badge_definitions (id, title, description, category, icon_name, criteria, xp_reward, base_rarity) VALUES
('premier_clap', 'Premier Clap', 'Ajouter votre premier film à la collection', 'collection', 'Clapperboard', '{"type": "movie_count", "count": 1}', 50, 'common'),
('mur_de_briques', 'Mur de Briques', 'Atteindre 10 films dans votre vidéothèque', 'collection', 'Brick', '{"type": "movie_count", "count": 10}', 150, 'common'),
('petit_videoclub', 'Petit Vidéo-Club', '25 films - Vous pourriez ouvrir un petit commerce', 'collection', 'Store', '{"type": "movie_count", "count": 25}', 300, 'rare'),
('rayonnage_pro', 'Rayonnage Pro', '50 films - Collection respectable', 'collection', 'Library', '{"type": "movie_count", "count": 50}', 500, 'rare'),
('videotheque_complete', 'Vidéothèque Complète', '100 films - Impressionnant !', 'collection', 'Archive', '{"type": "movie_count", "count": 100}', 1000, 'epic'),
('temple_cinema', 'Temple du Cinéma', '250 films - Un véritable sanctuaire', 'collection', 'Castle', '{"type": "movie_count", "count": 250}', 2500, 'legendary'),
('legende_vivante', 'Légende Vivante', '500 films - Vous êtes une légende', 'collection', 'Crown', '{"type": "movie_count", "count": 500}', 5000, 'grail'),

-- BADGES FORMAT
('analogique_forever', 'Analogique Forever', 'Posséder 5 VHS', 'format', 'Tv2', '{"type": "format_count", "value": "vhs", "count": 5}', 200, 'rare'),
('chasseur_vhs', 'Chasseur de VHS', '15 VHS dans la collection', 'format', 'Tv', '{"type": "format_count", "value": "vhs", "count": 15}', 500, 'epic'),
('gardien_magnetique', 'Gardien Magnétique', '30 VHS - Vous préservez l''histoire', 'format', 'Shield', '{"type": "format_count", "value": "vhs", "count": 30}', 1000, 'legendary'),
('be_kind_rewind', 'Be Kind, Rewind', '50 VHS - Un trésor analogique', 'format', 'Rewind', '{"type": "format_count", "value": "vhs", "count": 50}', 2000, 'grail'),
('disc_jockey', 'Disc Jockey', '10 DVD dans la collection', 'format', 'Disc', '{"type": "format_count", "value": "dvd", "count": 10}', 150, 'common'),
('dvd_master', 'DVD Master', '50 DVD - Collection solide', 'format', 'Disc2', '{"type": "format_count", "value": "dvd", "count": 50}', 400, 'rare'),
('haute_definition', 'Haute Définition', '10 Blu-ray', 'format', 'MonitorPlay', '{"type": "format_count", "value": "bluray", "count": 10}', 200, 'common'),
('bluray_addict', 'Blu-ray Addict', '30 Blu-ray', 'format', 'Sparkles', '{"type": "format_count", "value": "bluray", "count": 30}', 500, 'rare'),
('ultra_hd', 'Ultra HD', '5 films en 4K UHD', 'format', 'MonitorDot', '{"type": "format_count", "value": "4k", "count": 5}', 300, 'rare'),
('maitre_4k', 'Maître 4K', '20 films en 4K', 'format', 'MonitorUp', '{"type": "format_count", "value": "4k", "count": 20}', 750, 'epic'),
('laser_pioneer', 'Laser Pioneer', 'Posséder un LaserDisc', 'format', 'Circle', '{"type": "format_count", "value": "laserdisc", "count": 1}', 500, 'epic'),
('laser_collector', 'Laser Collector', '5 LaserDiscs', 'format', 'Target', '{"type": "format_count", "value": "laserdisc", "count": 5}', 1500, 'legendary'),

-- BADGES GENRES
('amateur_horreur', 'Amateur d''Horreur', '10 films d''horreur vus', 'genre', 'Skull', '{"type": "genre", "value": "27", "count": 10}', 200, 'common'),
('maitre_epouvante', 'Maître de l''Épouvante', '30 films d''horreur', 'genre', 'Ghost', '{"type": "genre", "value": "27", "count": 30}', 600, 'epic'),
('explorateur_sf', 'Explorateur SF', '10 films de science-fiction', 'genre', 'Rocket', '{"type": "genre", "value": "878", "count": 10}', 200, 'common'),
('voyageur_etoiles', 'Voyageur des Étoiles', '30 films SF', 'genre', 'Stars', '{"type": "genre", "value": "878", "count": 30}', 600, 'epic'),
('sourire_garanti', 'Sourire Garanti', '10 comédies vues', 'genre', 'Laugh', '{"type": "genre", "value": "35", "count": 10}', 200, 'common'),
('roi_comedie', 'Roi de la Comédie', '30 comédies', 'genre', 'PartyPopper', '{"type": "genre", "value": "35", "count": 30}', 600, 'epic'),
('coeur_tendre', 'Cœur Tendre', '10 films romantiques', 'genre', 'Heart', '{"type": "genre", "value": "10749", "count": 10}', 200, 'common'),
('romantique_eternel', 'Romantique Éternel', '30 films romantiques', 'genre', 'HeartHandshake', '{"type": "genre", "value": "10749", "count": 30}', 600, 'epic'),
('amateur_action', 'Amateur d''Action', '10 films d''action', 'genre', 'Swords', '{"type": "genre", "value": "28", "count": 10}', 200, 'common'),
('heros_action', 'Héros d''Action', '30 films d''action', 'genre', 'Flame', '{"type": "genre", "value": "28", "count": 30}', 600, 'epic'),
('detective_prive', 'Détective Privé', '10 thrillers vus', 'genre', 'Search', '{"type": "genre", "value": "53", "count": 10}', 200, 'common'),
('maitre_suspense', 'Maître du Suspense', '30 thrillers', 'genre', 'Eye', '{"type": "genre", "value": "53", "count": 30}', 600, 'epic'),
('animateur', 'Animateur', '10 films d''animation', 'genre', 'Palette', '{"type": "genre", "value": "16", "count": 10}', 200, 'common'),
('otaku', 'Otaku', '30 films d''animation', 'genre', 'Cat', '{"type": "genre", "value": "16", "count": 30}', 600, 'epic'),

-- BADGES DÉCENNIES
('retro_50s', 'Rétro 50s', '5 films des années 50', 'decade', 'Radio', '{"type": "decade", "value": "1950", "count": 5}', 300, 'rare'),
('swinging_60s', 'Swinging 60s', '5 films des années 60', 'decade', 'Flower2', '{"type": "decade", "value": "1960", "count": 5}', 300, 'rare'),
('groovy_70s', 'Groovy 70s', '5 films des années 70', 'decade', 'Music', '{"type": "decade", "value": "1970", "count": 5}', 300, 'rare'),
('enfant_80s', 'Enfant des 80s', '10 films des années 80', 'decade', 'Gamepad2', '{"type": "decade", "value": "1980", "count": 10}', 400, 'epic'),
('maitre_80s', 'Maître des 80s', '25 films des années 80', 'decade', 'Joystick', '{"type": "decade", "value": "1980", "count": 25}', 800, 'legendary'),
('nostalgie_90s', 'Nostalgie 90s', '10 films des années 90', 'decade', 'Disc3', '{"type": "decade", "value": "1990", "count": 10}', 400, 'epic'),
('enfant_90s', 'Enfant des 90s', '25 films des années 90', 'decade', 'Clapperboard', '{"type": "decade", "value": "1990", "count": 25}', 800, 'legendary'),
('millenium', 'Millénium', '10 films des années 2000', 'decade', 'Laptop', '{"type": "decade", "value": "2000", "count": 10}', 300, 'rare'),
('contemporain', 'Contemporain', '10 films des années 2010+', 'decade', 'Smartphone', '{"type": "decade", "value": "2010", "count": 10}', 250, 'common'),

-- BADGES RÉALISATEURS CULTES
('fan_kubrick', 'Fan de Kubrick', '3 films de Stanley Kubrick', 'director', 'Eye', '{"type": "director", "value": "240", "count": 3}', 400, 'epic'),
('disciple_spielberg', 'Disciple de Spielberg', '5 films de Steven Spielberg', 'director', 'Film', '{"type": "director", "value": "488", "count": 5}', 400, 'epic'),
('tarantinophile', 'Tarantinophile', '4 films de Quentin Tarantino', 'director', 'Sword', '{"type": "director", "value": "138", "count": 4}', 400, 'epic'),
('nolanverse', 'Nolanverse', '4 films de Christopher Nolan', 'director', 'Clock', '{"type": "director", "value": "525", "count": 4}', 400, 'epic'),
('scorsese_fan', 'Scorsese Fan', '5 films de Martin Scorsese', 'director', 'Clapperboard', '{"type": "director", "value": "1032", "count": 5}', 400, 'epic'),
('univers_lynch', 'Univers Lynch', '3 films de David Lynch', 'director', 'Brain', '{"type": "director", "value": "5602", "count": 3}', 500, 'legendary'),
('wes_world', 'Wes World', '4 films de Wes Anderson', 'director', 'Palette', '{"type": "director", "value": "5655", "count": 4}', 400, 'epic'),
('fincher_dark', 'Fincher Dark', '4 films de David Fincher', 'director', 'Skull', '{"type": "director", "value": "7467", "count": 4}', 400, 'epic'),

-- BADGES CINÉMA DU MONDE
('cinema_japonais', 'Cinéma Japonais', '5 films japonais', 'world', 'Cherry', '{"type": "country", "value": "JP", "count": 5}', 300, 'rare'),
('otaku_nippon', 'Otaku Nippon', '15 films japonais', 'world', 'Swords', '{"type": "country", "value": "JP", "count": 15}', 700, 'epic'),
('cinema_francais', 'Cinéma Français', '5 films français', 'world', 'Croissant', '{"type": "country", "value": "FR", "count": 5}', 300, 'rare'),
('francophile', 'Francophile', '15 films français', 'world', 'Wine', '{"type": "country", "value": "FR", "count": 15}', 700, 'epic'),
('hallyu_wave', 'Hallyu Wave', '5 films coréens', 'world', 'Music2', '{"type": "country", "value": "KR", "count": 5}', 300, 'rare'),
('k_cinema', 'K-Cinema Master', '15 films coréens', 'world', 'Trophy', '{"type": "country", "value": "KR", "count": 15}', 700, 'epic'),
('bollywood_fan', 'Bollywood Fan', '5 films indiens', 'world', 'Star', '{"type": "country", "value": "IN", "count": 5}', 300, 'rare'),
('british_cinema', 'British Cinema', '5 films britanniques', 'world', 'Crown', '{"type": "country", "value": "GB", "count": 5}', 300, 'rare'),
('cinema_italien', 'Cinema Italiano', '5 films italiens', 'world', 'Pizza', '{"type": "country", "value": "IT", "count": 5}', 300, 'rare'),

-- BADGES COMMUNAUTÉ
('critique_debutant', 'Critique Débutant', 'Écrire votre première critique', 'community', 'PenTool', '{"type": "review_count", "count": 1}', 100, 'common'),
('critique_assidu', 'Critique Assidu', '10 critiques écrites', 'community', 'FileText', '{"type": "review_count", "count": 10}', 300, 'rare'),
('plume_or', 'Plume d''Or', '25 critiques', 'community', 'Feather', '{"type": "review_count", "count": 25}', 600, 'epic'),
('roger_ebert', 'Roger Ebert', '50 critiques - Un vrai critique !', 'community', 'Award', '{"type": "review_count", "count": 50}', 1200, 'legendary'),
('influenceur', 'Influenceur', '10 followers', 'community', 'Users', '{"type": "followers", "count": 10}', 200, 'rare'),
('star_videoclub', 'Star du Vidéo Club', '50 followers', 'community', 'Star', '{"type": "followers", "count": 50}', 800, 'legendary'),

-- BADGES STREAKS
('premiere_semaine', 'Première Semaine', '7 jours de connexion consécutifs', 'streak', 'Calendar', '{"type": "streak", "count": 7}', 200, 'common'),
('assidu', 'Assidu', '14 jours consécutifs', 'streak', 'CalendarCheck', '{"type": "streak", "count": 14}', 400, 'rare'),
('marathonien', 'Marathonien', '30 jours consécutifs', 'streak', 'Flame', '{"type": "streak", "count": 30}', 800, 'epic'),
('incassable', 'Incassable', '100 jours consécutifs', 'streak', 'Shield', '{"type": "streak", "count": 100}', 2000, 'legendary'),
('immortel', 'Immortel', '365 jours consécutifs', 'streak', 'Crown', '{"type": "streak", "count": 365}', 10000, 'grail');

-- ==========================================
-- INSERTION DES DÉFIS HEBDOMADAIRES
-- ==========================================

INSERT INTO public.weekly_challenges (id, title, description, icon_name, challenge_type, target_count, target_value, xp_reward, popcorn_reward) VALUES
('add_3_movies', 'Nouveau Stock', 'Ajouter 3 films à votre collection', 'Plus', 'add_movies', 3, NULL, 150, 15),
('add_5_movies', 'Grande Livraison', 'Ajouter 5 films cette semaine', 'Package', 'add_movies', 5, NULL, 300, 30),
('write_2_reviews', 'Critique du Dimanche', 'Écrire 2 critiques', 'PenTool', 'write_reviews', 2, NULL, 200, 20),
('add_vhs', 'Chasse au Trésor', 'Ajouter une VHS à la collection', 'Tv2', 'format_specific', 1, 'vhs', 250, 25),
('add_bluray', 'Haute Définition', 'Ajouter un Blu-ray', 'Disc', 'format_specific', 1, 'bluray', 100, 10),
('horror_week', 'Semaine Horreur', 'Ajouter 2 films d''horreur', 'Ghost', 'genre_specific', 2, '27', 200, 20),
('scifi_week', 'Semaine SF', 'Ajouter 2 films de science-fiction', 'Rocket', 'genre_specific', 2, '878', 200, 20),
('classic_week', 'Semaine Classique', 'Ajouter un film d''avant 1990', 'Clapperboard', 'decade_specific', 1, '1990', 250, 25);

-- ==========================================
-- INSERTION DES ÉVÉNEMENTS SAISONNIERS
-- ==========================================

INSERT INTO public.seasonal_events (id, title, description, icon_name, theme_color, start_date, end_date, event_type) VALUES
('halloween_2024', 'Halloween Spooktacular', 'Le mois de l''horreur ! Collectionnez des films d''épouvante', 'Ghost', '#ff6b00', '2024-10-01', '2024-10-31', 'halloween'),
('christmas_2024', 'Christmas Movie Marathon', 'Célébrez les fêtes avec vos films préférés', 'Gift', '#c41e3a', '2024-12-01', '2024-12-31', 'christmas'),
('summer_2025', 'Summer Blockbusters', 'L''été des blockbusters !', 'Sun', '#ffd700', '2025-06-01', '2025-08-31', 'summer'),
('festival_2025', 'Festival Season', 'Célébrez le cinéma mondial', 'Trophy', '#9b59b6', '2025-05-01', '2025-05-31', 'festival');

-- Badges d'événements
INSERT INTO public.event_badges (id, event_id, title, description, icon_name, criteria, xp_reward, rarity) VALUES
('halloween_5', 'halloween_2024', 'Chasseur de Frissons', 'Ajouter 5 films d''horreur pendant Halloween', 'Skull', '{"type": "genre", "value": "27", "count": 5}', 500, 'epic'),
('halloween_collector', 'halloween_2024', 'Halloween Collector', 'Ajouter 10 films pendant Halloween', 'Ghost', '{"type": "movie_count", "count": 10}', 750, 'legendary'),
('christmas_classic', 'christmas_2024', 'Classique de Noël', 'Ajouter 3 films de Noël', 'Gift', '{"type": "christmas_movies", "count": 3}', 400, 'epic'),
('christmas_marathon', 'christmas_2024', 'Marathon de Noël', 'Ajouter 7 films pendant les fêtes', 'TreePine', '{"type": "movie_count", "count": 7}', 600, 'legendary');

-- ==========================================
-- INSERTION DES RÉCOMPENSES
-- ==========================================

INSERT INTO public.reward_definitions (id, reward_type, name, description, preview_data, unlock_criteria, rarity) VALUES
-- Titres exclusifs
('title_cinephile', 'title', 'Cinéphile Certifié', 'Titre pour les vrais passionnés', '{"text": "Cinéphile Certifié", "color": "#ffd700"}', '{"type": "badge_count", "count": 10}', 'rare'),
('title_collector', 'title', 'Grand Collectionneur', 'Pour ceux qui ont tout', '{"text": "Grand Collectionneur", "color": "#e74c3c"}', '{"type": "movie_count", "count": 100}', 'epic'),
('title_veteran', 'title', 'Vétéran du Vidéo Club', 'Vous êtes là depuis le début', '{"text": "Vétéran", "color": "#9b59b6"}', '{"type": "streak", "count": 100}', 'legendary'),
('title_legend', 'title', 'Légende du Format', 'Le titre ultime', '{"text": "Légende du Format", "color": "#ff6b00"}', '{"type": "xp", "count": 50000}', 'grail'),

-- Cadres d'avatar
('frame_gold', 'frame', 'Cadre Doré', 'Un cadre élégant en or', '{"border_color": "#ffd700", "border_width": 3, "glow": true}', '{"type": "xp", "count": 5000}', 'rare'),
('frame_neon', 'frame', 'Cadre Néon', 'Style rétro néon', '{"border_color": "#ff00ff", "border_width": 2, "animation": "pulse"}', '{"type": "badge_count", "count": 15}', 'epic'),
('frame_vhs', 'frame', 'Cadre VHS', 'L''esthétique VHS', '{"border_color": "#00ffff", "border_width": 4, "effect": "scanlines"}', '{"type": "format_count", "value": "vhs", "count": 10}', 'legendary'),
('frame_film', 'frame', 'Cadre Pellicule', 'Bandes de film classique', '{"border_color": "#333", "border_width": 5, "effect": "film_strip"}', '{"type": "movie_count", "count": 200}', 'grail'),

-- Thèmes de couleur
('theme_midnight', 'theme', 'Minuit Cinéma', 'Thème sombre élégant', '{"primary": "#1a1a2e", "accent": "#e94560", "text": "#eaeaea"}', '{"type": "badge_count", "count": 5}', 'common'),
('theme_retro', 'theme', 'Rétro VHS', 'Nostalgie des années 80', '{"primary": "#2d132c", "accent": "#ee4c7c", "text": "#f5f5f5"}', '{"type": "format_count", "value": "vhs", "count": 5}', 'rare'),
('theme_neon', 'theme', 'Neon Dreams', 'Cyberpunk cinématique', '{"primary": "#0d0d0d", "accent": "#00ffff", "text": "#ff00ff"}', '{"type": "xp", "count": 10000}', 'epic'),
('theme_golden', 'theme', 'Golden Age', 'L''âge d''or du cinéma', '{"primary": "#1c1c1c", "accent": "#ffd700", "text": "#ffffff"}', '{"type": "movie_count", "count": 250}', 'legendary');

-- Trigger pour mettre à jour updated_at sur user_streaks
CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();