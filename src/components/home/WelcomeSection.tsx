import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getImageUrl, MovieDetails } from "@/services/tmdb";
import { PhysicalMovie } from "@/services/physicalMovies";
import { motion } from "framer-motion";

interface BentoCardProps {
  title: string;
  cta: string;
  onClick: () => void;
  variant: "collection" | "discover" | "badges" | "lists";
  children?: React.ReactNode;
  className?: string;
  delay?: number;
}

const BentoCard: React.FC<BentoCardProps> = ({
  title,
  cta,
  onClick,
  variant,
  children,
  className,
  delay = 0,
}) => {
  const variants = {
    collection: {
      accent: "amber",
      borderColor: "border-amber-500/20",
      hoverBorder: "hover:border-amber-500/50",
      ctaBg: "bg-amber-500 text-black",
      glowColor: "amber",
    },
    discover: {
      accent: "blue",
      borderColor: "border-blue-500/20",
      hoverBorder: "hover:border-blue-500/50",
      ctaBg: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      glowColor: "blue",
    },
    badges: {
      accent: "purple",
      borderColor: "border-purple-500/20",
      hoverBorder: "hover:border-purple-500/50",
      ctaBg: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
      glowColor: "purple",
    },
    lists: {
      accent: "emerald",
      borderColor: "border-emerald-500/20",
      hoverBorder: "hover:border-emerald-500/50",
      ctaBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      glowColor: "emerald",
    },
  };

  const style = variants[variant];

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl transition-all duration-500",
        "border bg-card/30 backdrop-blur-md",
        style.borderColor,
        style.hoverBorder,
        "text-left",
        className
      )}
    >
      {/* Background Content */}
      <div className="absolute inset-0 z-0">
        {children}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

      {/* Animated glow on hover */}
      <div className={cn(
        "absolute -inset-1 z-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
        style.glowColor === "amber" && "bg-amber-500/20",
        style.glowColor === "blue" && "bg-blue-500/20",
        style.glowColor === "purple" && "bg-purple-500/20",
        style.glowColor === "emerald" && "bg-emerald-500/20",
      )} />

      {/* Content */}
      <div className="relative z-30 h-full flex flex-col justify-end p-4">
        <h3 className="font-display font-bold text-lg mb-2 text-foreground">
          {title}
        </h3>
        <div className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 w-fit",
          style.ctaBg
        )}>
          <span>{cta}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </motion.button>
  );
};

// Poster Stack - Used for all cards with movie posters
const PosterStack: React.FC<{ 
  posters: string[];
  emptyIcon?: React.ReactNode;
  emptyText?: string;
}> = ({ posters, emptyIcon, emptyText }) => {
  const displayPosters = posters.slice(0, 5);
  
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {displayPosters.length > 0 ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {displayPosters.map((poster, i) => {
            const rotation = (i - Math.floor(displayPosters.length / 2)) * 8;
            const translateX = (i - Math.floor(displayPosters.length / 2)) * 18;
            const scale = 1 - (Math.abs(i - Math.floor(displayPosters.length / 2)) * 0.05);
            
            return (
              <motion.div
                key={i}
                initial={{ 
                  rotate: rotation * 2, 
                  x: translateX * 2, 
                  scale: 0.5,
                  opacity: 0 
                }}
                animate={{ 
                  rotate: rotation, 
                  x: translateX, 
                  scale: scale,
                  opacity: 1 
                }}
                whileHover={{ 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                transition={{ 
                  duration: 0.6, 
                  delay: i * 0.08,
                  type: "spring",
                  stiffness: 100
                }}
                className="absolute w-16 h-24 md:w-20 md:h-28 rounded-lg shadow-2xl overflow-hidden border-2 border-white/10"
                style={{ zIndex: displayPosters.length - Math.abs(i - Math.floor(displayPosters.length / 2)) }}
              >
                <img
                  src={getImageUrl(poster, "w185")}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-muted-foreground/50">
          {emptyIcon}
          <p className="text-xs mt-2">{emptyText}</p>
        </div>
      )}
    </div>
  );
};

// Badges preview with floating animation
const BadgesPreview: React.FC<{ badges: { icon: string; rarity: string; unlocked: boolean }[] }> = ({ badges }) => {
  const rarityColors: Record<string, string> = {
    common: "from-zinc-400 to-zinc-600",
    rare: "from-blue-400 to-blue-600",
    epic: "from-purple-400 to-purple-600",
    legendary: "from-amber-400 to-orange-500",
  };

  const displayBadges = badges.slice(0, 4);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="flex gap-2">
        {displayBadges.map((badge, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, y: 20 }}
            animate={{ 
              scale: 1, 
              y: [0, -5, 0],
            }}
            transition={{ 
              scale: { duration: 0.4, delay: i * 0.1 },
              y: { 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: i * 0.3 
              }
            }}
            className={cn(
              "relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg",
              badge.unlocked 
                ? `bg-gradient-to-br ${rarityColors[badge.rarity] || rarityColors.common}` 
                : "bg-muted/50 border border-border/50"
            )}
          >
            {badge.unlocked ? (
              <>
                <span className="text-lg md:text-xl filter drop-shadow-lg">{badge.icon}</span>
                <motion.div 
                  className="absolute inset-0 rounded-xl bg-white/20"
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </>
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground/40" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export interface WelcomeSectionProps {
  username?: string;
  className?: string;
  collection?: PhysicalMovie[];
  movieDetailsMap?: Record<number, MovieDetails>;
  trendingMovies?: { poster_path: string }[];
  listPosters?: string[];
  badges?: { icon: string; rarity: string; unlocked: boolean }[];
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ 
  username, 
  className,
  collection = [],
  movieDetailsMap = {},
  trendingMovies = [],
  listPosters = [],
  badges = []
}) => {
  const navigate = useNavigate();

  // Get collection posters
  const collectionPosters = collection
    .map(movie => movieDetailsMap[movie.tmdb_id]?.poster_path)
    .filter(Boolean) as string[];

  // Get trending posters
  const trendingPosters = trendingMovies
    .map(m => m.poster_path)
    .filter(Boolean);

  // Default badges if none provided
  const displayBadges = badges.length > 0 ? badges : [
    { icon: "🎬", rarity: "common", unlocked: true },
    { icon: "⭐", rarity: "rare", unlocked: true },
    { icon: "🏆", rarity: "epic", unlocked: false },
    { icon: "💎", rarity: "legendary", unlocked: false },
  ];

  return (
    <section className={cn("relative pt-4 md:pt-6", className)}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-5"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-amber-500">En ligne</span>
          <Sparkles className="w-3 h-3 text-amber-500" />
        </div>
        <h1 className="font-display text-xl md:text-2xl font-bold">
          {username ? `Salut ${username} !` : "Bienvenue"}
          <motion.span 
            animate={{ rotate: [0, 14, -8, 14, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
            className="inline-block ml-2"
          >
            👋
          </motion.span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Que souhaitez-vous faire aujourd'hui ?
        </p>
      </motion.div>

      {/* Bento Grid - Clean 2x2 layout */}
      <div className="grid grid-cols-2 gap-3">
        {/* Ma Collection */}
        <BentoCard
          title="Ma Collection"
          cta={collection.length > 0 ? `${collection.length} films` : "Ajouter"}
          onClick={() => navigate("/collection")}
          variant="collection"
          className="aspect-[4/3]"
          delay={0}
        >
          <PosterStack 
            posters={collectionPosters}
            emptyIcon={<Plus className="w-8 h-8" />}
            emptyText="Ajoutez vos films"
          />
        </BentoCard>

        {/* Découvrir */}
        <BentoCard
          title="Découvrir"
          cta="Explorer"
          onClick={() => navigate("/search")}
          variant="discover"
          className="aspect-[4/3]"
          delay={1}
        >
          <PosterStack 
            posters={trendingPosters}
            emptyIcon={<Sparkles className="w-8 h-8" />}
            emptyText="Films tendance"
          />
        </BentoCard>

        {/* Mes Badges */}
        <BentoCard
          title="Mes Badges"
          cta="Débloquer"
          onClick={() => navigate("/badges")}
          variant="badges"
          className="aspect-[4/3]"
          delay={2}
        >
          <BadgesPreview badges={displayBadges} />
        </BentoCard>

        {/* Mes Listes */}
        <BentoCard
          title="Mes Listes"
          cta="Gérer"
          onClick={() => navigate("/lists")}
          variant="lists"
          className="aspect-[4/3]"
          delay={3}
        >
          <PosterStack 
            posters={listPosters}
            emptyIcon={<Plus className="w-8 h-8" />}
            emptyText="Créez vos listes"
          />
        </BentoCard>
      </div>
    </section>
  );
};

export default WelcomeSection;
