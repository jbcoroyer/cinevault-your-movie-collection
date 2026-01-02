-- ==========================================
-- SYSTÈME DE FONCTIONNALITÉS DÉBLOQUABLES
-- ==========================================

-- Nouvelle table pour les fonctionnalités débloquables par niveau
CREATE TABLE IF NOT EXISTS public.unlockable_features (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Gift',
  unlock_type TEXT NOT NULL, -- 'level', 'xp', 'badge_count', 'movie_count', 'streak'
  unlock_value INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'feature', -- 'feature', 'cosmetic', 'social', 'stats'
  rarity TEXT NOT NULL DEFAULT 'common',
  preview_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS pour unlockable_features (lecture publique)
ALTER TABLE public.unlockable_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view unlockable features" 
  ON public.unlockable_features FOR SELECT USING (true);

-- Table pour suivre les fonctionnalités débloquées par utilisateur
CREATE TABLE IF NOT EXISTS public.user_unlocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES public.unlockable_features(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, feature_id)
);

-- RLS pour user_unlocks
ALTER TABLE public.user_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their unlocks" 
  ON public.user_unlocks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert unlocks" 
  ON public.user_unlocks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- FONCTIONNALITÉS PAR NIVEAU (progression satisfaisante)
-- ==========================================

INSERT INTO public.unlockable_features (id, name, description, icon_name, unlock_type, unlock_value, category, rarity, preview_data) VALUES

-- NIVEAU 2 - Premières récompenses (très accessible)
('stats_basic', 'Statistiques de Base', 'Accédez aux stats de votre collection: genres préférés, décennies, formats', 'BarChart3', 'level', 2, 'stats', 'common', '{"feature": "collection_stats"}'),

-- NIVEAU 3
('profile_bio', 'Biographie Personnalisée', 'Ajoutez une description personnelle à votre profil', 'FileText', 'level', 3, 'social', 'common', '{"feature": "custom_bio"}'),

-- NIVEAU 4
('wishlist', 'Liste de Souhaits', 'Créez une wishlist de films à acquérir', 'Heart', 'level', 4, 'feature', 'common', '{"feature": "wishlist"}'),

-- NIVEAU 5 - Premier palier "rare"
('custom_lists', 'Listes Personnalisées', 'Créez des listes thématiques illimitées', 'ListVideo', 'level', 5, 'feature', 'rare', '{"feature": "custom_lists"}'),
('export_collection', 'Export Collection', 'Exportez votre collection en CSV/PDF', 'Download', 'level', 5, 'feature', 'rare', '{"feature": "export"}'),

-- NIVEAU 7
('price_tracking', 'Suivi des Prix', 'Suivez la valeur de votre collection avec les prix eBay', 'TrendingUp', 'level', 7, 'stats', 'rare', '{"feature": "price_tracking"}'),

-- NIVEAU 10 - Palier significatif
('share_collection', 'Partage Public', 'Générez un lien public vers votre collection', 'Share2', 'level', 10, 'social', 'epic', '{"feature": "public_share"}'),
('advanced_stats', 'Statistiques Avancées', 'Graphiques détaillés, timeline, répartition par studio', 'PieChart', 'level', 10, 'stats', 'epic', '{"feature": "advanced_stats"}'),

-- NIVEAU 12
('poster_wall', 'Mur de Posters', 'Vue poster wall immersive de votre collection', 'LayoutGrid', 'level', 12, 'feature', 'epic', '{"feature": "poster_wall"}'),

-- NIVEAU 15 - Palier premium
('price_alerts', 'Alertes Prix', 'Recevez des notifications quand les prix changent', 'Bell', 'level', 15, 'feature', 'legendary', '{"feature": "price_alerts"}'),
('member_card', 'Carte de Membre Premium', 'Carte de membre personnalisable avec votre progression', 'CreditCard', 'level', 15, 'cosmetic', 'legendary', '{"feature": "member_card"}'),

-- NIVEAU 20 - Palier élite
('shelf_3d', 'Vue Étagère 3D', 'Visualisez votre collection comme une étagère réaliste', 'Box', 'level', 20, 'feature', 'legendary', '{"feature": "shelf_3d"}'),
('portfolio_chart', 'Portefeuille Investisseur', 'Analyse complète de la valeur avec évolution temporelle', 'LineChart', 'level', 20, 'stats', 'legendary', '{"feature": "portfolio"}'),

-- NIVEAU 25 - Maître
('timeline_view', 'Timeline Cinéma', 'Visualisez votre collection sur une frise chronologique', 'History', 'level', 25, 'feature', 'grail', '{"feature": "timeline"}'),

-- NIVEAU 30 - Légende
('api_access', 'Accès API Personnel', 'Accédez à votre collection via API pour intégrations', 'Code', 'level', 30, 'feature', 'grail', '{"feature": "api_access"}'),

-- ==========================================
-- FONCTIONNALITÉS PAR BADGES (récompense la diversité)
-- ==========================================

('badge_showcase', 'Vitrine à Badges', 'Mettez en avant 3 badges sur votre profil public', 'Award', 'badge_count', 5, 'cosmetic', 'rare', '{"feature": "badge_showcase", "slots": 3}'),
('animated_avatar', 'Avatar Animé', 'Ajoutez des effets animés à votre avatar', 'Sparkles', 'badge_count', 10, 'cosmetic', 'epic', '{"feature": "animated_avatar"}'),
('custom_frame', 'Cadres Personnalisés', 'Débloquez l''accès aux cadres de profil', 'Frame', 'badge_count', 15, 'cosmetic', 'legendary', '{"feature": "custom_frames"}'),

-- ==========================================
-- FONCTIONNALITÉS PAR XP (récompense l'engagement total)
-- ==========================================

('xp_multiplier_5', 'Bonus XP +5%', 'Gagnez 5% d''XP supplémentaire sur toutes les actions', 'Zap', 'xp', 5000, 'feature', 'rare', '{"bonus": 1.05}'),
('xp_multiplier_10', 'Bonus XP +10%', 'Gagnez 10% d''XP supplémentaire', 'Zap', 'xp', 15000, 'feature', 'epic', '{"bonus": 1.10}'),
('xp_multiplier_15', 'Bonus XP +15%', 'Gagnez 15% d''XP supplémentaire', 'Zap', 'xp', 30000, 'feature', 'legendary', '{"bonus": 1.15}'),

-- ==========================================
-- FONCTIONNALITÉS PAR COLLECTION (récompense la taille)
-- ==========================================

('collection_badge', 'Badge Collection', 'Badge spécial affiché sur votre profil', 'Shield', 'movie_count', 25, 'cosmetic', 'rare', '{"badge": "collector_25"}'),
('collection_badge_gold', 'Badge Collection Or', 'Badge doré pour les grandes collections', 'Shield', 'movie_count', 100, 'cosmetic', 'legendary', '{"badge": "collector_100"}'),
('collection_badge_diamond', 'Badge Collection Diamant', 'Badge diamant pour les collections légendaires', 'Gem', 'movie_count', 500, 'cosmetic', 'grail', '{"badge": "collector_500"}'),

-- ==========================================
-- FONCTIONNALITÉS PAR STREAK (récompense la régularité)
-- ==========================================

('streak_freeze', 'Gel de Streak', 'Possibilité de geler votre streak 1x par mois', 'Snowflake', 'streak', 7, 'feature', 'rare', '{"uses_per_month": 1}'),
('streak_freeze_2', 'Gel de Streak x2', 'Gelez votre streak 2x par mois', 'Snowflake', 'streak', 30, 'feature', 'epic', '{"uses_per_month": 2}'),
('streak_shield', 'Bouclier de Streak', 'Protection automatique contre la perte de streak', 'ShieldCheck', 'streak', 100, 'feature', 'legendary', '{"auto_protect": true}')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  unlock_type = EXCLUDED.unlock_type,
  unlock_value = EXCLUDED.unlock_value,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  preview_data = EXCLUDED.preview_data;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_unlocks_user_id ON public.user_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_unlockable_features_unlock ON public.unlockable_features(unlock_type, unlock_value);