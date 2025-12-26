import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  EntityType,
  EntityRole,
  isFollowingEntity,
  toggleFollowEntity,
  getEntityFollowersCount,
} from "@/services/entityFollowService";

interface UseEntityFollowOptions {
  entityType: EntityType;
  entityId: number;
  entityName: string;
  entityImagePath?: string | null;
  entityRole: EntityRole;
}

interface UseEntityFollowReturn {
  isFollowing: boolean;
  followersCount: number;
  loading: boolean;
  toggleFollow: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useEntityFollow({
  entityType,
  entityId,
  entityName,
  entityImagePath = null,
  entityRole,
}: UseEntityFollowOptions): UseEntityFollowReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!entityId) return;

    try {
      // Récupérer le nombre de followers
      const count = await getEntityFollowersCount(entityType, entityId);
      setFollowersCount(count);

      // Vérifier si l'utilisateur suit
      if (user) {
        const following = await isFollowingEntity(user.id, entityType, entityId);
        setIsFollowing(following);
      }
    } catch (error) {
      console.error("Error fetching entity follow data:", error);
    }
  }, [entityType, entityId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleFollow = useCallback(async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour suivre des personnes et studios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await toggleFollowEntity(
        user.id,
        entityType,
        entityId,
        entityName,
        entityImagePath,
        entityRole
      );

      if (result.success) {
        setIsFollowing(result.isFollowing);
        setFollowersCount((prev) => prev + (result.isFollowing ? 1 : -1));

        toast({
          title: result.isFollowing ? "Suivi !" : "Non suivi",
          description: result.isFollowing
            ? `Vous suivez maintenant ${entityName}`
            : `Vous ne suivez plus ${entityName}`,
        });
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Une erreur est survenue",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le suivi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, entityType, entityId, entityName, entityImagePath, entityRole, toast]);

  return {
    isFollowing,
    followersCount,
    loading,
    toggleFollow,
    refresh: fetchData,
  };
}
