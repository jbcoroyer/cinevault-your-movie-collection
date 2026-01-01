/**
 * CineVault — Landing Hero Component
 *
 * Structure:
 * 1. Hero → 3 value props visuelles + CTA principal
 * 2. "Comment ça marche" → 3 étapes illustrées
 * 3. Preview étagère → Collection démo interactive avec valorisation
 * 4. Stats communautaires → Compteurs animés
 * 5. Features détaillées → 6 cartes
 * 6. CTA Final → "Créer mon compte gratuit"
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Disc3,
  TrendingUp,
  Trophy,
  ScanBarcode,
  Library,
  Gamepad2,
  Heart,
  ListVideo,
  Users,
  Star,
  ArrowRight,
  Play,
  Sparkles,
  Euro,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Movie, getImageUrl, getTopRatedMovies } from "@/services/tmdb";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================
interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, suffix = "", prefix = "", duration = 2 }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (current) => `${prefix}${Math.floor(current).toLocaleString("fr-FR")}${suffix}`);

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  return <motion.span ref={ref}>{isInView ? <motion.span>{display}</motion.span> : `${prefix}0${suffix}`}</motion.span>;
};

// ============================================
// VALUE PROP CARD
// ============================================
interface ValuePropProps {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}

const ValuePropCard: React.FC<ValuePropProps> = ({ icon: Icon, title, description, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.15, duration: 0.6, ease: "easeOut" }}
    className={cn(
      "relative group p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl overflow-hidden",
      "bg-white/5 backdrop-blur-sm border border-white/10",
      "hover:border-white/20 transition-all duration-500",
    )}
  >
    {/* Gradient background on hover */}
    <div
      className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500", gradient)}
    />

    <div className="relative z-10">
      <div
        className={cn(
          "w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-5",
          "bg-white/10 group-hover:bg-white/20 transition-colors duration-300",
        )}
      >
        <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
      </div>

      <h3 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">{title}</h3>
      <p className="text-white/60 text-xs sm:text-sm md:text-base leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

// ============================================
// STEP CARD (Comment ça marche)
// ============================================
interface StepCardProps {
  number: number;
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}

const StepCard: React.FC<StepCardProps> = ({ number, icon: Icon, title, description, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay: delay * 0.2, duration: 0.6 }}
      className="relative flex items-start gap-4 sm:gap-6"
    >
      {/* Step number */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            "w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center",
            "bg-gradient-to-br from-amber-500 to-orange-600",
            "shadow-lg shadow-amber-500/25",
          )}
        >
          <span className="font-display text-xl sm:text-2xl font-bold text-white">{number}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pt-0 sm:pt-1">
        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          <h3 className="font-display text-base sm:text-lg md:text-xl font-semibold text-white">{title}</h3>
        </div>
        <p className="text-white/50 text-xs sm:text-sm md:text-base leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

// ============================================
// SHELF PREVIEW (Collection Demo)
// ============================================
interface ShelfPreviewProps {
  movies: Movie[];
}

const ShelfPreview: React.FC<ShelfPreviewProps> = ({ movies }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Formats aléatoires pour la démo
  const formats = ["DVD", "Blu-ray", "4K UHD", "Steelbook"];
  const prices = [8, 12, 18, 25, 35, 45, 55];

  return (
    <div className="relative">
      {/* Shelf wood effect */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-b from-amber-900/50 to-amber-950/80 rounded-b-xl" />

      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto pb-6 pt-2 px-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {movies.map((movie, index) => {
          const format = formats[index % formats.length];
          const price = prices[index % prices.length];
          const isHovered = hoveredIndex === index;

          return (
            <motion.div
              key={movie.id}
              className="relative flex-shrink-0 cursor-pointer"
              style={{
                width: isHovered ? "100px" : "24px",
                perspective: "1000px",
              }}
              animate={{
                width: isHovered ? 100 : 24,
                zIndex: isHovered ? 50 : 1,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Spine view */}
              <div
                className={cn(
                  "absolute inset-0 rounded-sm overflow-hidden transition-opacity duration-300",
                  isHovered ? "opacity-0" : "opacity-100",
                )}
                style={{
                  background: `linear-gradient(135deg, 
                    ${
                      format === "4K UHD"
                        ? "#1a1a2e"
                        : format === "Steelbook"
                          ? "#2d3436"
                          : format === "Blu-ray"
                            ? "#0a1628"
                            : "#1a1a1a"
                    } 0%, 
                    ${
                      format === "4K UHD"
                        ? "#16213e"
                        : format === "Steelbook"
                          ? "#636e72"
                          : format === "Blu-ray"
                            ? "#1e3a5f"
                            : "#2d2d2d"
                    } 100%)`,
                  boxShadow: "inset -2px 0 4px rgba(0,0,0,0.5), inset 2px 0 4px rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                >
                  <span className="text-[8px] font-medium text-white/70 truncate px-1">{movie.title}</span>
                </div>

                {/* Format indicator */}
                <div
                  className={cn(
                    "absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full",
                    format === "4K UHD" && "bg-gradient-to-br from-amber-400 to-orange-600",
                    format === "Steelbook" && "bg-gradient-to-br from-slate-300 to-slate-500",
                    format === "Blu-ray" && "bg-gradient-to-br from-blue-400 to-blue-600",
                    format === "DVD" && "bg-gradient-to-br from-gray-400 to-gray-600",
                  )}
                />
              </div>

              {/* Expanded poster view */}
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-lg overflow-hidden shadow-2xl",
                  "transition-opacity duration-300",
                  isHovered ? "opacity-100" : "opacity-0",
                )}
                style={{
                  transformStyle: "preserve-3d",
                  transform: isHovered ? "rotateY(-5deg)" : "rotateY(0deg)",
                }}
              >
                {movie.poster_path && (
                  <img
                    src={getImageUrl(movie.poster_path, "w185")}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Price overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/70">{format}</span>
                    <span className="text-xs font-bold text-green-400">{price}€</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Shelf shadow */}
      <div className="absolute -bottom-2 left-4 right-4 h-4 bg-black/30 blur-md rounded-full" />
    </div>
  );
};

// ============================================
// FEATURE CARD
// ============================================
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  accentColor: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, accentColor, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: delay * 0.1, duration: 0.5 }}
      className={cn(
        "group relative p-6 rounded-2xl",
        "bg-white/5 backdrop-blur-sm border border-white/10",
        "hover:border-amber-500/30 hover:bg-white/10",
        "transition-all duration-500",
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
          "transition-transform duration-300 group-hover:scale-110",
          accentColor,
        )}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-display text-lg font-semibold mb-2 text-white">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{description}</p>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const features = [
  {
    icon: Library,
    title: "Collection Physique",
    description: "Cataloguez vos DVD, Blu-ray, 4K UHD et éditions collector. Suivez chaque format et édition spéciale.",
    accentColor: "bg-amber-500/20 text-amber-500",
  },
  {
    icon: Heart,
    title: "Favoris & Wishlist",
    description: "Marquez vos films préférés et créez votre liste de souhaits pour ne jamais manquer une sortie.",
    accentColor: "bg-rose-500/20 text-rose-500",
  },
  {
    icon: ListVideo,
    title: "Listes Personnalisées",
    description: "Organisez vos films par genre, réalisateur, saga ou créez vos propres thématiques.",
    accentColor: "bg-blue-500/20 text-blue-500",
  },
  {
    icon: Users,
    title: "Communauté",
    description: "Suivez d'autres collectionneurs, découvrez leurs trouvailles et partagez vos acquisitions.",
    accentColor: "bg-emerald-500/20 text-emerald-500",
  },
  {
    icon: Trophy,
    title: "Badges & Niveaux",
    description: "Gagnez de l'XP, débloquez des badges et montez en niveau. Devenez un collectionneur légendaire !",
    accentColor: "bg-purple-500/20 text-purple-500",
  },
  {
    icon: TrendingUp,
    title: "Statistiques",
    description: "Visualisez votre collection avec des stats détaillées : genres, années, réalisateurs favoris.",
    accentColor: "bg-cyan-500/20 text-cyan-500",
  },
];

export const LandingHero: React.FC = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalUsers: 0,
    totalValue: 0,
  });
  const [loadingMovies, setLoadingMovies] = useState(true);

  // Fetch top rated movies for shelf preview
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const topRated = await getTopRatedMovies();
        setMovies(topRated.slice(0, 50));
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoadingMovies(false);
      }
    };
    fetchMovies();
  }, []);

  // Fetch community stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Total physical movies
        const { count: moviesCount } = await supabase
          .from("physical_movies")
          .select("*", { count: "exact", head: true });

        // Total users with collections
        const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });

        // Estimate total value (mock for now, could be real)
        const estimatedValue = (moviesCount || 0) * 15; // ~15€ average

        setStats({
          totalMovies: moviesCount || 2847,
          totalUsers: usersCount || 342,
          totalValue: estimatedValue || 42705,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Fallback values
        setStats({
          totalMovies: 2847,
          totalUsers: 342,
          totalValue: 42705,
        });
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="relative overflow-hidden max-w-full">
      {/* Background Effects - hidden on mobile to prevent overflow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-amber-500/10 rounded-full blur-[80px] sm:blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-orange-600/5 rounded-full blur-[60px] sm:blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-gradient-radial from-amber-500/5 to-transparent rounded-full" />
      </div>

      {/* ============================================
          SECTION 1: HERO - 3 Value Props
          ============================================ */}
      <section className="relative pt-6 pb-12 sm:pt-8 md:pt-16 sm:pb-16 md:pb-24 overflow-hidden">
        <div className="mx-auto px-4 sm:px-6 max-w-full">
          <div className="max-w-5xl mx-auto text-center mb-8 sm:mb-12 md:mb-16">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4 sm:mb-6"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              <span className="text-xs sm:text-sm font-medium text-amber-500">Le Discogs du cinéma physique</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 tracking-tight leading-tight"
            >
              Votre collection de films,{" "}
              <span className="relative inline-block">
                <span className="text-amber-500">sublimée</span>
                <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path
                    d="M2 6C50 2 150 2 198 6"
                    stroke="rgb(245 158 11)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="animate-draw"
                  />
                </svg>
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm sm:text-lg md:text-xl text-white/50 mb-6 sm:mb-10 max-w-2xl mx-auto px-2"
            >
              Cataloguez vos DVD, Blu-ray et 4K. Suivez la valeur de votre collection en temps réel. Rejoignez la
              communauté des collectionneurs passionnés.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
            >
              <Button
                size="lg"
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 sm:px-8 py-5 sm:py-6 rounded-full shadow-lg shadow-amber-500/25 text-sm sm:text-base"
              >
                Créer mon compte gratuit
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/search")}
                className="border-white/20 text-white hover:bg-white/10 px-6 sm:px-8 py-5 sm:py-6 rounded-full text-sm sm:text-base"
              >
                Explorer les films
              </Button>
            </motion.div>
          </div>

          {/* 3 Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <ValuePropCard
              icon={Disc3}
              title="Cataloguez"
              description="Scannez le code-barres ou recherchez vos films. DVD, Blu-ray, 4K UHD, Steelbook — tous les formats."
              gradient="bg-gradient-to-br from-amber-500/10 to-orange-600/10"
              delay={0}
            />
            <ValuePropCard
              icon={Euro}
              title="Valorisez"
              description="Prix eBay en temps réel. Suivez l'évolution de la valeur de votre collection jour après jour."
              gradient="bg-gradient-to-br from-emerald-500/10 to-green-600/10"
              delay={1}
            />
            <ValuePropCard
              icon={Trophy}
              title="Progressez"
              description="Gagnez de l'XP, débloquez des badges exclusifs et montez en niveau. Devenez légendaire."
              gradient="bg-gradient-to-br from-purple-500/10 to-violet-600/10"
              delay={2}
            />
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 2: COMMENT ÇA MARCHE - 3 Étapes
          ============================================ */}
      <section className="py-10 sm:py-16 md:py-24 bg-white/[0.02] overflow-hidden">
        <div className="mx-auto px-4 sm:px-6 max-w-full">
          <div className="max-w-4xl mx-auto">
            {/* Section Title */}
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="font-display text-xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4"
              >
                Comment ça marche ?
              </motion.h2>
              <p className="text-white/50 text-sm sm:text-base max-w-xl mx-auto">Trois étapes simples pour démarrer votre collection</p>
            </div>

            {/* Steps */}
            <div className="space-y-6 sm:space-y-8 md:space-y-12">
              <StepCard
                number={1}
                icon={ScanBarcode}
                title="Scannez ou recherchez"
                description="Utilisez votre caméra pour scanner le code-barres de vos DVD et Blu-ray, ou recherchez directement par titre. Reconnaissance automatique via TMDB."
                delay={0}
              />
              <StepCard
                number={2}
                icon={Library}
                title="Organisez votre collection"
                description="Ajoutez le format (DVD, Blu-ray, 4K, Steelbook), l'état et le prix d'achat. Visualisez votre collection en vue étagère premium."
                delay={1}
              />
              <StepCard
                number={3}
                icon={Gamepad2}
                title="Progressez et partagez"
                description="Gagnez des badges, montez en niveau et partagez votre collection avec la communauté. Suivez d'autres collectionneurs passionnés."
                delay={2}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 3: SHELF PREVIEW - Collection Demo
          ============================================ */}
      <section className="py-10 sm:py-16 md:py-24 overflow-hidden">
        <div className="mx-auto px-4 sm:px-6 max-w-full">
          <div className="max-w-6xl mx-auto">
            {/* Section Title */}
            <div className="text-center mb-6 sm:mb-8 md:mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 mb-3 sm:mb-4"
              >
                <Library className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                <span className="text-xs sm:text-sm text-white/70">Vue Étagère Premium</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="font-display text-xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4"
              >
                Votre bibliothèque, en un coup d'œil
              </motion.h2>
              <p className="text-white/50 text-sm sm:text-base max-w-xl mx-auto">
                Survolez les tranches pour révéler les affiches et les prix estimés
              </p>
            </div>

            {/* Shelf Container */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className={cn(
                "relative p-4 md:p-6 rounded-3xl",
                "bg-gradient-to-b from-amber-950/30 to-amber-950/50",
                "border border-amber-900/30",
              )}
            >
              {/* Wood texture overlay */}
              <div className="absolute inset-0 opacity-20 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('/wood-texture.png')] bg-cover bg-center" />
              </div>

              <div className="relative">
                {loadingMovies ? (
                  <div className="h-40 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <ShelfPreview movies={movies} />
                )}
              </div>

              {/* Valuation badge */}
              <div className="absolute -top-3 -right-3 md:top-4 md:right-4">
                <div
                  className={cn(
                    "px-4 py-2 rounded-full",
                    "bg-gradient-to-r from-green-500 to-emerald-600",
                    "shadow-lg shadow-green-500/25",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-white" />
                    <span className="text-sm font-bold text-white">~{movies.length * 15}€ estimés</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA under shelf */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center mt-8"
            >
              <Button
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full px-6"
              >
                Créer ma collection
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 4: STATS COMMUNAUTAIRES
          ============================================ */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent overflow-hidden">
        <div className="mx-auto px-4 sm:px-6 max-w-full">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {/* Total Films */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                  <Disc3 className="w-8 h-8 text-amber-500" />
                </div>
                <div className="font-display text-4xl md:text-5xl font-bold text-white mb-2">
                  <AnimatedCounter value={stats.totalMovies} suffix="+" />
                </div>
                <p className="text-white/50">Films catalogués</p>
              </motion.div>

              {/* Total Users */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="p-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
                <div className="font-display text-4xl md:text-5xl font-bold text-white mb-2">
                  <AnimatedCounter value={stats.totalUsers} suffix="+" />
                </div>
                <p className="text-white/50">Collectionneurs actifs</p>
              </motion.div>

              {/* Total Value */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="p-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <Euro className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="font-display text-4xl md:text-5xl font-bold text-white mb-2">
                  <AnimatedCounter value={stats.totalValue} suffix="€" />
                </div>
                <p className="text-white/50">Valeur totale estimée</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 5: FEATURES DÉTAILLÉES
          ============================================ */}
      <section className="py-16 md:py-24 overflow-hidden">
        <div className="mx-auto px-4 sm:px-6 max-w-full">
          <div className="max-w-5xl mx-auto">
            {/* Section Title */}
            <div className="text-center mb-12">
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="font-display text-3xl md:text-4xl font-bold mb-4"
              >
                Tout pour votre passion du cinéma
              </motion.h2>
              <p className="text-white/50 max-w-xl mx-auto">Des outils pensés pour les vrais collectionneurs</p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} {...feature} delay={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 6: CTA FINAL
          ============================================ */}
      <section className="py-16 md:py-24 overflow-hidden">
        <div className="mx-auto px-4 sm:px-6 max-w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative max-w-4xl mx-auto"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 rounded-3xl blur-xl" />

            {/* Card */}
            <div
              className={cn(
                "relative p-8 md:p-12 rounded-3xl text-center",
                "bg-gradient-to-br from-white/10 to-white/5",
                "border border-white/10 backdrop-blur-sm",
              )}
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <Play className="w-8 h-8 text-amber-500 fill-amber-500" />
              </div>

              <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">Prêt à démarrer l'aventure ?</h2>
              <p className="text-white/50 mb-8 max-w-xl mx-auto">
                Rejoignez gratuitement CineVault et commencez à cataloguer votre collection dès maintenant.
              </p>

              <Button
                size="lg"
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-amber-500 hover:bg-amber-600 text-black text-base font-semibold px-10 py-6 rounded-full shadow-lg shadow-amber-500/25"
              >
                Créer mon compte gratuit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingHero;
