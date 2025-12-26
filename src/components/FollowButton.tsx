import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, UserPlus, UserMinus, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntityFollow } from "@/hooks/useEntityFollow";
import { EntityType, EntityRole } from "@/services/entityFollowService";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  entityType: EntityType;
  entityId: number;
  entityName: string;
  entityImagePath?: string | null;
  entityRole: EntityRole;
  variant?: "default" | "compact" | "icon";
  className?: string;
  showFollowersCount?: boolean;
}

export function FollowButton({
  entityType,
  entityId,
  entityName,
  entityImagePath,
  entityRole,
  variant = "default",
  className,
  showFollowersCount = false,
}: FollowButtonProps) {
  const { isFollowing, followersCount, loading, toggleFollow } = useEntityFollow({
    entityType,
    entityId,
    entityName,
    entityImagePath,
    entityRole,
  });

  const getIcon = () => {
    if (loading) return <Loader2 className="w-4 h-4 animate-spin" />;
    
    if (entityType === "company") {
      return isFollowing ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />;
    }
    
    return isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />;
  };

  const getText = () => {
    if (entityType === "company") {
      return isFollowing ? "Ne plus suivre" : "Suivre le studio";
    }
    return isFollowing ? "Ne plus suivre" : "Suivre";
  };

  if (variant === "icon") {
    return (
      <Button
        variant={isFollowing ? "secondary" : "default"}
        size="icon"
        onClick={toggleFollow}
        disabled={loading}
        className={cn(
          "rounded-full transition-all duration-300",
          isFollowing && "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400",
          className
        )}
      >
        {getIcon()}
      </Button>
    );
  }

  if (variant === "compact") {
    return (
      <Button
        variant={isFollowing ? "secondary" : "default"}
        size="sm"
        onClick={toggleFollow}
        disabled={loading}
        className={cn(
          "gap-2 transition-all duration-300",
          isFollowing && "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30",
          className
        )}
      >
        {getIcon()}
        <span>{isFollowing ? "Suivi" : "Suivre"}</span>
      </Button>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        variant={isFollowing ? "secondary" : "default"}
        onClick={toggleFollow}
        disabled={loading}
        className={cn(
          "gap-2 transition-all duration-300",
          isFollowing && "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30"
        )}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={isFollowing ? "following" : "follow"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            {getIcon()}
            {getText()}
          </motion.span>
        </AnimatePresence>
      </Button>

      {showFollowersCount && followersCount > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-white/50 text-center"
        >
          {followersCount.toLocaleString("fr-FR")} {followersCount === 1 ? "abonné" : "abonnés"}
        </motion.p>
      )}
    </div>
  );
}
