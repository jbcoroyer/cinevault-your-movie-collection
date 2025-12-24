/**
 * CineVault - Collection CTA Component
 * 
 * CTA engageant en haut de la page Collection pour encourager l'ajout de films
 */

import { motion } from "framer-motion";
import { Plus, Scan, Sparkles, Film, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CollectionCTAProps {
  onAddToCollection: () => void;
  onScanBarcode: () => void;
  totalMovies: number;
}

export const CollectionCTA = ({
  onAddToCollection,
  onScanBarcode,
  totalMovies,
}: CollectionCTAProps) => {
  // Message dynamique selon la taille de la collection
  const getMessage = () => {
    if (totalMovies === 0) {
      return {
        title: "Commencez votre collection",
        subtitle: "Ajoutez votre premier film et regardez votre bibliothèque prendre vie",
        emoji: "🎬",
      };
    } else if (totalMovies < 10) {
      return {
        title: "Continuez à enrichir",
        subtitle: `${totalMovies} films dans votre collection. Ajoutez-en plus !`,
        emoji: "📀",
      };
    } else if (totalMovies < 50) {
      return {
        title: "Belle collection !",
        subtitle: `${totalMovies} films. Vous êtes un vrai collectionneur !`,
        emoji: "🎯",
      };
    } else if (totalMovies < 100) {
      return {
        title: "Collection impressionnante",
        subtitle: `${totalMovies} films. Continuez sur cette lancée !`,
        emoji: "🏆",
      };
    } else {
      return {
        title: "Vidéothèque de légende",
        subtitle: `${totalMovies} films ! Vous êtes un maître collectionneur.`,
        emoji: "👑",
      };
    }
  };

  const message = getMessage();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10",
        "border border-amber-500/20"
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-gradient-to-tr from-orange-500/20 to-red-500/20 rounded-full blur-2xl" />
      
      {/* Floating icons */}
      <motion.div
        className="absolute top-4 right-4 text-4xl"
        animate={{ 
          y: [0, -5, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {message.emoji}
      </motion.div>

      <div className="relative z-10">
        {/* Title */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-display font-bold text-foreground">
            {message.title}
          </h2>
        </div>

        {/* Subtitle */}
        <p className="text-muted-foreground mb-6 max-w-md">
          {message.subtitle}
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Primary CTA - Add to collection */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onAddToCollection}
              size="lg"
              className={cn(
                "gap-2 font-semibold",
                "bg-gradient-to-r from-amber-500 to-orange-500",
                "hover:from-amber-600 hover:to-orange-600",
                "text-white shadow-lg shadow-amber-500/25",
                "transition-all duration-300"
              )}
            >
              <Plus className="w-5 h-5" />
              Ajouter un film
            </Button>
          </motion.div>

          {/* Secondary CTA - Scan barcode */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onScanBarcode}
              size="lg"
              variant="outline"
              className={cn(
                "gap-2 font-semibold",
                "border-amber-500/30 hover:border-amber-500/50",
                "hover:bg-amber-500/10",
                "transition-all duration-300"
              )}
            >
              <Scan className="w-5 h-5" />
              Scanner
            </Button>
          </motion.div>
        </div>

        {/* Quick stats */}
        {totalMovies > 0 && (
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-amber-500/10">
            <div className="flex items-center gap-2 text-sm">
              <Film className="w-4 h-4 text-amber-500" />
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{totalMovies}</span> films
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-muted-foreground">
                Collection en <span className="font-semibold text-green-500">croissance</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CollectionCTA;
