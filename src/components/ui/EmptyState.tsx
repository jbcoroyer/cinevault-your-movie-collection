/**
 * CineVault - EmptyState Component AMÉLIORÉ
 * 
 * Composant réutilisable pour les états vides
 * Avec animations et call-to-action clair
 */

import { motion } from "framer-motion";
import { LucideIcon, Plus, Search, Film, Library, Heart, List } from "lucide-react";
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
  variant?: "default" | "minimal" | "centered";
  className?: string;
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
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "minimal" && "py-8",
        variant === "default" && "py-12 px-4",
        variant === "centered" && "min-h-[50vh] py-12 px-4",
        className
      )}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className={cn(
          "relative mb-6",
          variant === "minimal" && "mb-4"
        )}
      >
        {/* Background glow */}
        <div className="absolute inset-0 blur-2xl opacity-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full" />
        
        {/* Icon container */}
        <div className={cn(
          "relative rounded-2xl flex items-center justify-center",
          "bg-gradient-to-br from-muted to-muted/50",
          "border border-border/50",
          variant === "minimal" ? "w-16 h-16" : "w-20 h-20"
        )}>
          <Icon className={cn(
            "text-muted-foreground/50",
            variant === "minimal" ? "w-8 h-8" : "w-10 h-10"
          )} />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "font-display font-bold",
          variant === "minimal" ? "text-lg" : "text-xl"
        )}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "text-muted-foreground mt-2",
            variant === "minimal" ? "text-sm max-w-xs" : "max-w-md"
          )}
        >
          {description}
        </motion.p>
      )}

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-3 mt-6 justify-center"
        >
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              {actionLabel}
            </Button>
          )}
          
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

/**
 * Pre-configured empty states
 */

export const EmptyCollection = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    icon={Library}
    title="Votre collection est vide"
    description="Commencez à ajouter vos films DVD, Blu-ray et éditions collector pour voir votre collection prendre vie."
    actionLabel="Ajouter un film"
    onAction={onAdd}
    variant="centered"
  />
);

export const EmptyWatchlist = ({ onBrowse }: { onBrowse?: () => void }) => (
  <EmptyState
    icon={List}
    title="Votre watchlist est vide"
    description="Explorez notre catalogue et ajoutez les films que vous souhaitez voir."
    actionLabel="Découvrir des films"
    onAction={onBrowse}
    variant="default"
  />
);

export const EmptyFavorites = ({ onBrowse }: { onBrowse?: () => void }) => (
  <EmptyState
    icon={Heart}
    title="Pas encore de favoris"
    description="Ajoutez vos films préférés pour les retrouver facilement."
    actionLabel="Parcourir les films"
    onAction={onBrowse}
    variant="default"
  />
);

export const EmptySearchResults = ({ 
  query,
  onClear 
}: { 
  query: string;
  onClear?: () => void;
}) => (
  <EmptyState
    icon={Search}
    title="Aucun résultat"
    description={`Aucun film trouvé pour "${query}". Essayez d'autres termes de recherche.`}
    actionLabel="Effacer la recherche"
    onAction={onClear}
    variant="default"
  />
);

export const EmptyLists = ({ onCreate }: { onCreate?: () => void }) => (
  <EmptyState
    icon={List}
    title="Pas encore de listes"
    description="Créez des listes personnalisées pour organiser vos films par thème, genre ou occasion."
    actionLabel="Créer une liste"
    onAction={onCreate}
    variant="centered"
  />
);

export default EmptyState;
