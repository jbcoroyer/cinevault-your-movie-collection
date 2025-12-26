import { supabase } from "@/integrations/supabase/client";

// =====================================================
// TYPES
// =====================================================

export type EntityType = "person" | "company";
export type EntityRole = "actor" | "director" | "studio" | "production_company";

export interface FollowedEntity {
  id: string;
  user_id: string;
  entity_type: EntityType;
  entity_id: number;
  entity_name: string;
  entity_image_path: string | null;
  entity_role: EntityRole;
  created_at: string;
}

export interface EntityFollowStats {
  followersCount: number;
  isFollowing: boolean;
}

// =====================================================
// FOLLOW FUNCTIONS
// =====================================================

/**
 * Vérifie si l'utilisateur suit une entité
 */
export const isFollowingEntity = async (
  userId: string,
  entityType: EntityType,
  entityId: number
): Promise<boolean> => {
  const { data, error } = await supabase
    .from("entity_follows")
    .select("id")
    .eq("user_id", userId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();

  if (error) {
    console.error("Error checking follow status:", error);
    return false;
  }

  return !!data;
};

/**
 * Suivre une entité (acteur, réalisateur, studio)
 */
export const followEntity = async (
  userId: string,
  entityType: EntityType,
  entityId: number,
  entityName: string,
  entityImagePath: string | null,
  entityRole: EntityRole
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase.from("entity_follows").insert({
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    entity_image_path: entityImagePath,
    entity_role: entityRole,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Vous suivez déjà cette entité" };
    }
    console.error("Error following entity:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Ne plus suivre une entité
 */
export const unfollowEntity = async (
  userId: string,
  entityType: EntityType,
  entityId: number
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from("entity_follows")
    .delete()
    .eq("user_id", userId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);

  if (error) {
    console.error("Error unfollowing entity:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Toggle follow/unfollow
 */
export const toggleFollowEntity = async (
  userId: string,
  entityType: EntityType,
  entityId: number,
  entityName: string,
  entityImagePath: string | null,
  entityRole: EntityRole
): Promise<{ success: boolean; isFollowing: boolean; error?: string }> => {
  const isCurrentlyFollowing = await isFollowingEntity(userId, entityType, entityId);

  if (isCurrentlyFollowing) {
    const result = await unfollowEntity(userId, entityType, entityId);
    return { ...result, isFollowing: false };
  } else {
    const result = await followEntity(
      userId,
      entityType,
      entityId,
      entityName,
      entityImagePath,
      entityRole
    );
    return { ...result, isFollowing: result.success };
  }
};

/**
 * Récupère toutes les entités suivies par un utilisateur
 */
export const getFollowedEntities = async (
  userId: string,
  entityType?: EntityType
): Promise<FollowedEntity[]> => {
  let query = supabase
    .from("entity_follows")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (entityType) {
    query = query.eq("entity_type", entityType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching followed entities:", error);
    return [];
  }

  return data as FollowedEntity[];
};

/**
 * Récupère les acteurs suivis
 */
export const getFollowedActors = async (userId: string): Promise<FollowedEntity[]> => {
  const { data, error } = await supabase
    .from("entity_follows")
    .select("*")
    .eq("user_id", userId)
    .eq("entity_type", "person")
    .eq("entity_role", "actor")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching followed actors:", error);
    return [];
  }

  return data as FollowedEntity[];
};

/**
 * Récupère les réalisateurs suivis
 */
export const getFollowedDirectors = async (userId: string): Promise<FollowedEntity[]> => {
  const { data, error } = await supabase
    .from("entity_follows")
    .select("*")
    .eq("user_id", userId)
    .eq("entity_type", "person")
    .eq("entity_role", "director")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching followed directors:", error);
    return [];
  }

  return data as FollowedEntity[];
};

/**
 * Récupère les studios suivis
 */
export const getFollowedStudios = async (userId: string): Promise<FollowedEntity[]> => {
  const { data, error } = await supabase
    .from("entity_follows")
    .select("*")
    .eq("user_id", userId)
    .eq("entity_type", "company")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching followed studios:", error);
    return [];
  }

  return data as FollowedEntity[];
};

/**
 * Compte le nombre de followers d'une entité
 */
export const getEntityFollowersCount = async (
  entityType: EntityType,
  entityId: number
): Promise<number> => {
  const { count, error } = await supabase
    .from("entity_follows")
    .select("*", { count: "exact", head: true })
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);

  if (error) {
    console.error("Error counting entity followers:", error);
    return 0;
  }

  return count || 0;
};

/**
 * Récupère les stats de suivi d'une entité
 */
export const getEntityFollowStats = async (
  userId: string | null,
  entityType: EntityType,
  entityId: number
): Promise<EntityFollowStats> => {
  const followersCount = await getEntityFollowersCount(entityType, entityId);
  
  let isFollowing = false;
  if (userId) {
    isFollowing = await isFollowingEntity(userId, entityType, entityId);
  }

  return {
    followersCount,
    isFollowing,
  };
};

// =====================================================
// NOTIFICATION FUNCTIONS
// =====================================================

/**
 * Récupère les notifications de sorties non lues
 */
export const getUnreadReleaseNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from("release_notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching release notifications:", error);
    return [];
  }

  return data;
};

/**
 * Marque une notification comme lue
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("release_notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }

  return true;
};

/**
 * Marque toutes les notifications comme lues
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("release_notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }

  return true;
};
