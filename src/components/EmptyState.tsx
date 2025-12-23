/**
 * CineVault - EmptyState Component
 * 
 * Composant réutilisable pour les états vides avec animations
 * Utilisé quand une liste/section est vide
 */

import { motion } from "framer-motion";
import { LucideIcon, Film, Search, Library, Heart, ListVideo, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: "default" | "minimal" | "card";
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState = ({
  icon: Icon = Film,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = "default",
  className,
  children,
}: EmptyStateProps) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  if (variant === "minimal") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className={cn(
          "flex flex-col items-center justify-center py-8 text-center",
          className
        )}
      >
        <Icon className="w-10 h-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">{title}</p>
        {actionLabel && onAction && (
          <Button
            variant="link"
            size="sm"
            onClick={onAction}
            className="mt-2 text-primary"
          >
            {actionLabel}
          </Button>
        )}
      </motion.div>
    );
  }

  if (variant === "card") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className={cn(
          "flex flex-col items-center justify-center p-8",
          "bg-card rounded-2xl border border-border/50",
          "text-center",
          className
        )}
      >
        <motion.div
          variants={itemVariants}
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
            "bg-muted"
          )}
        >
          <Icon className="w-8 h-8 text-muted-foreground" />
        </motion.div>

        <motion.h3
          variants={itemVariants}
          className="text-lg font-semibold mb-1"
        >
          {title}
        </motion.h3>

        {description && (
          <motion.p
            variants={itemVariants}
            className="text-sm text-muted-foreground max-w-sm"
          >
            {description}
          </motion.p>
        )}

        {(actionLabel || children) && (
          <motion.div variants={itemVariants} className="mt-4 flex gap-2">
            {actionLabel && onAction && (
              <Button onClick={onAction} size="sm">
                {actionLabel}
              </Button>
            )}
            {children}
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Default variant - full page style
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      {/* Animated Icon Container */}
      <motion.div
        variants={itemVariants}
        className="relative mb-6"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center",
            "bg-gradient-to-br from-amber-500/20 to-orange-500/20",
            "border border-amber-500/20"
          )}
        >
          <Icon className="w-10 h-10 text-amber-500" />
        </motion.div>

        {/* Decorative circles */}
        <div className="absolute -inset-4 -z-10">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-amber-500/10"
          />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        className="text-xl font-display font-bold mb-2"
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          variants={itemVariants}
          className="text-muted-foreground mb-6 max-w-sm"
        >
          {description}
        </motion.p>
      )}

      {/* Actions */}
      {(actionLabel || secondaryActionLabel || children) && (
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {children}
        </motion.div>
      )}
    </motion.div>
  );
};

// Pre-configured empty states for common use cases
export const EmptyCollection = ({ onAdd }: { onAdd: () => void }) => (
  <EmptyState
    icon={Library}
    title="Votre collection est vide"
    description="Commencez à ajouter vos DVD, Blu-ray et éditions collector pour voir votre collection prendre vie."
    actionLabel="Ajouter un film"
    onAction={onAdd}
  />
);

export const EmptySearch = ({ query }: { query?: string }) => (
  <EmptyState
    icon={Search}
    title={query ? `Aucun résultat pour "${query}"` : "Aucun résultat"}
    description="Essayez de modifier vos termes de recherche ou vos filtres."
    variant="card"
  />
);

export const EmptyWatchlist = ({ onBrowse }: { onBrowse: () => void }) => (
  <EmptyState
    icon={Heart}
    title="Watchlist vide"
    description="Ajoutez des films que vous souhaitez voir plus tard."
    actionLabel="Parcourir les films"
    onAction={onBrowse}
  />
);

export const EmptyLists = ({ onCreate }: { onCreate: () => void }) => (
  <EmptyState
    icon={ListVideo}
    title="Pas encore de listes"
    description="Créez des listes pour organiser vos films par thème, humeur ou occasion."
    actionLabel="Créer une liste"
    onAction={onCreate}
  />
);

export const EmptyBadges = () => (
  <EmptyState
    icon={Trophy}
    title="Pas encore de badges"
    description="Continuez à utiliser CineVault pour débloquer des badges et récompenses."
    variant="card"
  />
);

export const EmptyFollowers = ({ isOwnProfile }: { isOwnProfile: boolean }) => (
  <EmptyState
    icon={Users}
    title={isOwnProfile ? "Pas encore d'abonnés" : "Pas d'abonnés"}
    description={isOwnProfile 
      ? "Partagez votre profil pour que d'autres cinéphiles puissent vous suivre."
      : "Cet utilisateur n'a pas encore d'abonnés."
    }
    variant="minimal"
  />
);

export default EmptyState;
