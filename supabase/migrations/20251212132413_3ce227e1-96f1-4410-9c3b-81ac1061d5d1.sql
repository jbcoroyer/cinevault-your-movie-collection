-- RESET COMPLET XP ET MISE À JOUR DES BADGES VIDÉO CLUB NÉO-RÉTRO

-- 1. Reset XP de tous les utilisateurs
UPDATE public.profiles SET total_xp = 0, current_title = 'Visiteur Curieux';

-- 2. Supprimer les anciens badges utilisateurs (reset complet)
DELETE FROM public.user_badges;

-- 3. Supprimer les anciennes définitions de badges
DELETE FROM public.badge_definitions;

-- 4. Insérer les nouvelles définitions de badges Vidéo Club
INSERT INTO public.badge_definitions (id, title, description, category, icon_name, xp_reward, base_rarity, criteria) VALUES
-- Collection
('premier_clap', 'Premier Clap', 'Ajoutez votre premier film à l''inventaire', 'collection', 'Clapperboard', 50, 'common', '{"type": "movie_count", "count": 1}'),
('collectionneur_10', 'Collectionneur Débutant', '10 films dans votre inventaire', 'collection', 'Film', 100, 'common', '{"type": "movie_count", "count": 10}'),
('collectionneur_50', 'Collectionneur Confirmé', '50 films dans votre inventaire', 'collection', 'Archive', 200, 'rare', '{"type": "movie_count", "count": 50}'),
('mur_de_briques', 'Mur de Briques', '100 films dans votre inventaire', 'collection', 'Archive', 500, 'rare', '{"type": "movie_count", "count": 100}'),
('videoteque', 'Vidéothèque', '500 films - Vous êtes un vrai vidéo club !', 'collection', 'Crown', 1000, 'epic', '{"type": "movie_count", "count": 500}'),
('le_musee', 'Le Musée', '5000 films - Une vraie vidéothèque !', 'collection', 'Crown', 5000, 'grail', '{"type": "movie_count", "count": 5000}'),

-- Format
('dvd_collector', 'DVD Collector', 'Possédez 25 DVDs', 'format', 'Disc', 150, 'common', '{"type": "format_count", "value": "dvd", "count": 25}'),
('bluray_master', 'Blu-ray Master', 'Possédez 25 Blu-rays', 'format', 'Disc', 200, 'rare', '{"type": "format_count", "value": "bluray", "count": 25}'),
('4k_pioneer', '4K Pioneer', 'Possédez 10 films en 4K UHD', 'format', 'Gem', 300, 'rare', '{"type": "format_count", "value": "4k", "count": 10}'),
('analogique_forever', 'Analogique Forever', 'Possédez 10 VHS', 'format', 'Tv', 400, 'epic', '{"type": "format_count", "value": "vhs", "count": 10}'),
('disc_jockey', 'Disc Jockey', 'Possédez 5 Laserdiscs', 'format', 'Disc', 500, 'legendary', '{"type": "format_count", "value": "laserdisc", "count": 5}'),

-- Reviews (Notes du Staff)
('critique_en_herbe', 'Critique en Herbe', 'Rédigez votre première Note du Staff', 'collection', 'Film', 100, 'common', '{"type": "review_count", "count": 1}'),
('critique_assidu', 'Critique Assidu', '10 Notes du Staff rédigées', 'collection', 'Star', 200, 'rare', '{"type": "review_count", "count": 10}'),
('plume_doree', 'Plume Dorée', '50 Notes du Staff rédigées', 'collection', 'Trophy', 1000, 'legendary', '{"type": "review_count", "count": 50}'),

-- Secret
('be_kind_rewind', 'Be Kind Rewind', 'Vous avez trouvé l''easter egg !', 'secret', 'Sparkles', 500, 'legendary', '{"type": "secret", "count": 1}');

-- 5. Créer une fonction pour calculer l'XP basée sur le format
CREATE OR REPLACE FUNCTION public.get_xp_for_format(format_name text)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN CASE 
    WHEN LOWER(format_name) LIKE '%vhs%' THEN 150
    WHEN LOWER(format_name) LIKE '%laserdisc%' THEN 150
    WHEN LOWER(format_name) LIKE '%4k%' OR LOWER(format_name) LIKE '%uhd%' THEN 100
    WHEN LOWER(format_name) LIKE '%blu%' THEN 75
    ELSE 50 -- DVD par défaut
  END;
END;
$$;

-- 6. Créer trigger pour ajouter XP lors de l'ajout d'un film physique
CREATE OR REPLACE FUNCTION public.add_xp_on_physical_movie()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  xp_to_add integer;
BEGIN
  -- Calculer l'XP basée sur le format
  xp_to_add := public.get_xp_for_format(NEW.format);
  
  -- Ajouter l'XP au profil
  UPDATE public.profiles 
  SET total_xp = COALESCE(total_xp, 0) + xp_to_add
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_add_xp_on_physical_movie ON public.physical_movies;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_add_xp_on_physical_movie
AFTER INSERT ON public.physical_movies
FOR EACH ROW
EXECUTE FUNCTION public.add_xp_on_physical_movie();

-- 7. Créer trigger pour ajouter XP lors d'une review
CREATE OR REPLACE FUNCTION public.add_xp_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ajouter 100 XP pour chaque review
  UPDATE public.profiles 
  SET total_xp = COALESCE(total_xp, 0) + 100
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_add_xp_on_review ON public.reviews;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_add_xp_on_review
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.add_xp_on_review();

-- 8. Fonction pour mettre à jour le titre selon le niveau
CREATE OR REPLACE FUNCTION public.update_user_title()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_title text;
  xp_val integer;
BEGIN
  xp_val := NEW.total_xp;
  
  new_title := CASE
    WHEN xp_val >= 5000000 THEN 'Légende du Format'
    WHEN xp_val >= 500000 THEN 'Gérant du Club'
    WHEN xp_val >= 150000 THEN 'Responsable Rayon'
    WHEN xp_val >= 55000 THEN 'Clerk (Employé)'
    WHEN xp_val >= 12000 THEN 'Chasseur de VHS'
    WHEN xp_val >= 3300 THEN 'Client Régulier'
    WHEN xp_val >= 500 THEN 'Nouvel Adhérent'
    ELSE 'Visiteur Curieux'
  END;
  
  NEW.current_title := new_title;
  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_update_user_title ON public.profiles;

-- Créer le trigger pour mise à jour automatique du titre
CREATE TRIGGER trigger_update_user_title
BEFORE UPDATE OF total_xp ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_user_title();