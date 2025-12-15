import React from "react";
import { useNavigate } from "react-router-dom";
import { Library, Compass, Trophy, ListVideo, ArrowRight, Plus, Lock, Sparkles, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { getImageUrl, MovieDetails } from "@/services/tmdb";
import { PhysicalMovie } from "@/services/physicalMovies";
import { motion } from "framer-motion";

interface BentoCardProps {
  title: string;
  description?: string;
  cta: string;
  onClick: () => void;
  variant: "collection" | "discover" | "badges" | "lists";
  children?: React.ReactNode;
  className?: string;
  delay?: number;
}

const BentoCard: React.FC<BentoCardProps> = ({
  title,
  description,
  cta,
  onClick,
  variant,
  children,
  className,
  delay = 0,
}) => {
  const variants = {
    collection: {
      gradient: "from-amber-500/30 via-orange-500/20 to-transparent",
      border: "border-amber-500/30 hover:border-amber-400/60",
      glow: "group-hover:shadow-amber-500/40",
      ctaBg: "bg-amber-500 text-black font-semibold hover:bg-amber-400",
      overlayGradient: "from-black/90 via-black/60 to-transparent",
    },
    discover: {
      gradient: "from-blue-500/30 via-cyan-500/20 to-transparent",
      border: "border-blue-500/20 hover:border-blue-400/50",
      glow: "group-hover:shadow-blue-500/30",
      ctaBg: "bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30",
      overlayGradient: "from-black/90 via-black/60 to-transparent",
    },
    badges: {
      gradient: "from-purple-500/30 via-violet-500/20 to-transparent",
      border: "border-purple-500/20 hover:border-purple-400/50",
      glow: "group-hover:shadow-purple-500/30",
      ctaBg: "bg-purple-500/20 text-purple-400 border border-purple-500/40 hover:bg-purple-500/30",
      overlayGradient: "from-black/90 via-black/60 to-transparent",
    },
    lists: {
      gradient: "from-emerald-500/30 via-green-500/20 to-transparent",
      border: "border-emerald-500/20 hover:border-emerald-400/50",
      glow: "group-hover:shadow-emerald-500/30",
      ctaBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30",
      overlayGradient: "from-black/90 via-black/60 to-transparent",
    },
  };

  const style = variants[variant];

  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: delay * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl md:rounded-3xl transition-all duration-500",
        "border shadow-lg hover:shadow-2xl",
        "bg-card/50 backdrop-blur-sm",
        style.border,
        style.glow,
        "text-left",
        className
      )}
    >
      {/* Background Content */}
      <div className="absolute inset-0 z-0">
        {children}
      </div>

      {/* Gradient Overlay */}
      <div className={cn(
        "absolute inset-0 z-10 bg-gradient-to-t",
        style.overlayGradient
      )} />

      {/* Shimmer Effect on Hover */}
      <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Content */}
      <div className="relative z-30 h-full flex flex-col justify-end p-4 md:p-5">
        <h3 className="font-display font-bold text-base md:text-lg mb-1 text-foreground drop-shadow-lg">
          {title}
        </h3>
        {description && (
          <p className="text-xs md:text-sm text-muted-foreground/90 mb-3 line-clamp-1">
            {description}
          </p>
        )}
        <div className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm transition-all duration-300 w-fit",
          style.ctaBg
        )}>
          <span>{cta}</span>
          <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </motion.button>
  );
};

// Mini poster grid for collection
const CollectionPreview: React.FC<{ movies: PhysicalMovie[]; movieDetailsMap: Record<number, MovieDetails> }> = ({ 
  movies, 
  movieDetailsMap 
}) => {
  const displayMovies = movies.slice(0, 4);
  
  return (
    <div className="absolute inset-0 grid grid-cols-2 gap-1 p-1">
      {displayMovies.map((movie, i) => {
        const details = movieDetailsMap[movie.tmdb_id];
        return (
          <div
            key={movie.id}
            className="relative overflow-hidden rounded-lg"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {details?.poster_path ? (
              <img
                src={getImageUrl(details.poster_path, "w342")}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                <Film className="w-6 h-6 text-muted-foreground/30" />
              </div>
            )}
          </div>
        );
      })}
      {displayMovies.length === 0 && (
        <div className="col-span-2 flex items-center justify-center">
          <div className="text-center">
            <Plus className="w-8 h-8 text-amber-500/50 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Ajoutez vos films</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Poster stack for lists
const ListsPreview: React.FC<{ posters: string[] }> = ({ posters }) => {
  const displayPosters = posters.slice(0, 4);
  
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full">
        {displayPosters.length > 0 ? (
          displayPosters.map((poster, i) => (
            <motion.div
              key={i}
              initial={{ rotate: (i - 1.5) * 12, x: (i - 1.5) * 20, scale: 0.8 }}
              animate={{ rotate: (i - 1.5) * 8, x: (i - 1.5) * 15, scale: 0.85 + i * 0.02 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-24 md:w-20 md:h-28 rounded-lg shadow-2xl overflow-hidden border border-white/10"
              style={{ zIndex: i }}
            >
              <img
                src={getImageUrl(poster, "w185")}
                alt=""
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <ListVideo className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Créez vos listes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Trending movies preview
const DiscoverPreview: React.FC<{ movies: { poster_path: string }[] }> = ({ movies }) => {
  const displayMovies = movies.slice(0, 6);
  
  return (
    <div className="absolute inset-0 grid grid-cols-3 gap-0.5 p-0.5">
      {displayMovies.map((movie, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="relative overflow-hidden"
        >
          <img
            src={getImageUrl(movie.poster_path, "w185")}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      ))}
    </div>
  );
};

// Badges preview with glow effect
const BadgesPreview: React.FC<{ badges: { icon: string; rarity: string; unlocked: boolean }[] }> = ({ badges }) => {
  const rarityColors: Record<string, string> = {
    common: "from-gray-400 to-gray-600",
    rare: "from-blue-400 to-blue-600",
    epic: "from-purple-400 to-purple-600",
    legendary: "from-amber-400 to-orange-600",
  };

  const displayBadges = badges.slice(0, 6);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-3">
      <div className="grid grid-cols-3 gap-2 w-full">
        {displayBadges.map((badge, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: i * 0.1,
              type: "spring",
              stiffness: 200
            }}
            className={cn(
              "relative aspect-square rounded-xl flex items-center justify-center",
              badge.unlocked 
                ? `bg-gradient-to-br ${rarityColors[badge.rarity] || rarityColors.common}` 
                : "bg-muted/30"
            )}
          >
            {badge.unlocked ? (
              <>
                <span className="text-xl md:text-2xl filter drop-shadow-lg">{badge.icon}</span>
                <div className="absolute inset-0 rounded-xl animate-pulse-glow opacity-50" />
              </>
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground/50" />
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

  // Default badges if none provided
  const displayBadges = badges.length > 0 ? badges : [
    { icon: "🎬", rarity: "common", unlocked: true },
    { icon: "⭐", rarity: "rare", unlocked: true },
    { icon: "🏆", rarity: "epic", unlocked: false },
    { icon: "💎", rarity: "legendary", unlocked: false },
    { icon: "🎭", rarity: "rare", unlocked: false },
    { icon: "🌟", rarity: "common", unlocked: false },
  ];

  return (
    <section className={cn("relative pt-4 md:pt-6", className)}>
      {/* Background ambiance */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl pointer-events-none">
        <motion.div 
          animate={{ 
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            x: [0, -20, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            x: [0, 15, 0],
            y: [0, 15, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" 
        />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-5 md:mb-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-2 md:mb-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-amber-500">En ligne</span>
          <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
        </div>
        <h1 className="font-display text-xl md:text-2xl lg:text-3xl font-bold mb-1 md:mb-2">
          {username ? `Salut ${username} !` : "Bienvenue sur CineVault"}
          <motion.span 
            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-block ml-2"
          >
            👋
          </motion.span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Que souhaitez-vous faire aujourd'hui ?
        </p>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Ma Collection - Large card */}
        <BentoCard
          title="Ma Collection"
          description={collection.length > 0 ? `${collection.length} films` : "Gérez vos films"}
          cta="Ouvrir"
          onClick={() => navigate("/collection")}
          variant="collection"
          className="col-span-2 row-span-2 min-h-[200px] md:min-h-[280px]"
          delay={0}
        >
          <CollectionPreview movies={collection} movieDetailsMap={movieDetailsMap} />
        </BentoCard>

        {/* Découvrir */}
        <BentoCard
          title="Découvrir"
          description="Films tendance"
          cta="Explorer"
          onClick={() => navigate("/search")}
          variant="discover"
          className="col-span-1 min-h-[140px] md:min-h-[180px]"
          delay={1}
        >
          <DiscoverPreview movies={trendingMovies} />
        </BentoCard>

        {/* Mes Badges */}
        <BentoCard
          title="Mes Badges"
          description="Débloquez-les !"
          cta="Voir"
          onClick={() => navigate("/badges")}
          variant="badges"
          className="col-span-1 min-h-[140px] md:min-h-[180px]"
          delay={2}
        >
          <BadgesPreview badges={displayBadges} />
        </BentoCard>

        {/* Mes Listes - Full width on mobile bottom */}
        <BentoCard
          title="Mes Listes"
          description="Organisez vos films"
          cta="Gérer"
          onClick={() => navigate("/lists")}
          variant="lists"
          className="col-span-2 min-h-[120px] md:min-h-[90px]"
          delay={3}
        >
          <ListsPreview posters={listPosters} />
        </BentoCard>
      </div>
    </section>
  );
};

export default WelcomeSection;
