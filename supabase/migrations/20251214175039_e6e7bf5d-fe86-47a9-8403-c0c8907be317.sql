-- Index pour améliorer les performances des requêtes fréquentes

-- Index sur physical_movies pour les requêtes par utilisateur (collection)
CREATE INDEX IF NOT EXISTS idx_physical_movies_user_id ON public.physical_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_physical_movies_user_tmdb ON public.physical_movies(user_id, tmdb_id);
CREATE INDEX IF NOT EXISTS idx_physical_movies_format ON public.physical_movies(format);
CREATE INDEX IF NOT EXISTS idx_physical_movies_created_at ON public.physical_movies(created_at DESC);

-- Index sur user_movies pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_user_movies_user_id ON public.user_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_movies_status ON public.user_movies(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_movies_tmdb_id ON public.user_movies(tmdb_id);

-- Index sur activities pour le feed
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);

-- Index sur follows pour les requêtes sociales
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- Index sur reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tmdb_id ON public.reviews(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Index sur user_badges pour le système de gamification
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);

-- Index sur lists et list_items
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON public.lists(user_id);
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON public.list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_tmdb_id ON public.list_items(tmdb_id);

-- Index sur user_top_movies
CREATE INDEX IF NOT EXISTS idx_user_top_movies_user_id ON public.user_top_movies(user_id);

-- Index sur profiles pour les recherches
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Index sur movies_metadata pour les recherches
CREATE INDEX IF NOT EXISTS idx_movies_metadata_tmdb_id ON public.movies_metadata(tmdb_id);