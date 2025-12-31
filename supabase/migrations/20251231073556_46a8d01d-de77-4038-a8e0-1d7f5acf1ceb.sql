-- Supprimer les badges VHS et LaserDisc
DELETE FROM badge_definitions WHERE id IN (
  'analogique_forever',
  'disc_jockey', 
  'chasseur_vhs',
  'gardien_magnetique',
  'be_kind_rewind'
);

-- Supprimer les quêtes VHS
DELETE FROM quests WHERE id = 'quest_vhs_hunter';

-- Supprimer les user_badges associés
DELETE FROM user_badges WHERE badge_id IN (
  'analogique_forever',
  'disc_jockey',
  'chasseur_vhs',
  'gardien_magnetique',
  'be_kind_rewind'
);

-- Supprimer les user_quests associés
DELETE FROM user_quests WHERE quest_id = 'quest_vhs_hunter';

-- Mettre à jour la fonction XP pour enlever VHS
CREATE OR REPLACE FUNCTION public.get_xp_for_format(format_name text)
RETURNS integer
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE 
    WHEN LOWER(format_name) LIKE '%collector%' OR LOWER(format_name) LIKE '%steelbook%' THEN 100
    WHEN LOWER(format_name) LIKE '%4k%' OR LOWER(format_name) LIKE '%uhd%' THEN 100
    WHEN LOWER(format_name) LIKE '%blu%' THEN 75
    ELSE 50 -- DVD par défaut
  END;
END;
$function$;

-- Supprimer les cosmétiques VHS des reward_definitions
DELETE FROM reward_definitions WHERE id = 'frame_vhs';

-- Supprimer de user_rewards
DELETE FROM user_rewards WHERE reward_id = 'frame_vhs';

-- Mettre à jour les profils qui avaient frame_vhs équipé
UPDATE profiles SET equipped_frame = NULL WHERE equipped_frame = 'frame_vhs';