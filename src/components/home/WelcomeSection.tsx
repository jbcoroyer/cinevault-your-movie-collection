import React from "react";
import { useNavigate } from "react-router-dom";
import { Library, Compass, Trophy, ListVideo, Plus, Sparkles, Users, Film, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * WelcomeSection — Section d'accueil engageante
 *
 * Layout mobile optimisé : carte principale pleine largeur en haut,
 * puis grille 2x3 équilibrée pour les autres actions
 */

interface QuickActionCardProps {
  icon: React.ElementType;
  iconSecondary?: React.ElementType;
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
  variant: "primary" | "discover" | "badges" | "lists";
  delay?: number;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon: Icon,
  iconSecondary: IconSecondary,
  title,
  description,
  cta,
  onClick,
  variant,
  delay = 0,
}) => {
  const variants = {
    primary: {
      gradient: "from-amber-500/20 via-amber-500/10 to-orange-500/5",
      border: "border-amber-500/30 hover:border-amber-400/60",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
      iconColor: "text-white",
      glow: "group-hover:shadow-amber-500/30",
      ring: "ring-amber-500/20",
      ctaBg: "bg-amber-500 hover:bg-amber-400 text-black font-semibold",
      pulse: true,
    },
    discover: {
      gradient: "from-blue-500/15 via-cyan-500/10 to-teal-500/5",
      border: "border-blue-500/20 hover:border-blue-400/50",
      iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
      iconColor: "text-white",
      glow: "group-hover:shadow-blue-500/20",
      ring: "ring-blue-500/20",
      ctaBg: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30",
      pulse: false,
    },
    badges: {
      gradient: "from-purple-500/15 via-violet-500/10 to-fuchsia-500/5",
      border: "border-purple-500/20 hover:border-purple-400/50",
      iconBg: "bg-gradient-to-br from-purple-500 to-violet-500",
      iconColor: "text-white",
      glow: "group-hover:shadow-purple-500/20",
      ring: "ring-purple-500/20",
      ctaBg: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30",
      pulse: false,
    },
    lists: {
      gradient: "from-emerald-500/15 via-green-500/10 to-teal-500/5",
      border: "border-emerald-500/20 hover:border-emerald-400/50",
      iconBg: "bg-gradient-to-br from-emerald-500 to-green-500",
      iconColor: "text-white",
      glow: "group-hover:shadow-emerald-500/20",
      ring: "ring-emerald-500/20",
      ctaBg: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      pulse: false,
    },
  };

  const style = variants[variant];
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl md:rounded-3xl transition-all duration-500",
        "bg-gradient-to-br backdrop-blur-xl",
        "border shadow-lg hover:shadow-2xl",
        style.gradient,
        style.border,
        style.glow,
        // Layout mobile vs desktop
        isPrimary
          ? "col-span-2 p-4 md:p-6" // Pleine largeur sur mobile
          : "col-span-1 p-3 md:p-5",
        "animate-fade-in text-left",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glow effect */}
      <div
        className={cn(
          "absolute -inset-px rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
          isPrimary ? "bg-amber-500/20" : "bg-current/10",
        )}
      />

      {/* Content wrapper - horizontal on mobile for primary, vertical for others */}
      <div
        className={cn(
          "relative z-10",
          isPrimary ? "flex flex-row items-center gap-4 md:flex-col md:items-start" : "flex flex-col h-full",
        )}
      >
        {/* Icon & Title section for primary on mobile */}
        {isPrimary ? (
          <>
            {/* Left: Icon + Info */}
            <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-4 flex-1">
              {/* Icon */}
              <div
                className={cn(
                  "relative flex items-center justify-center rounded-xl md:rounded-2xl transition-transform group-hover:scale-110 flex-shrink-0",
                  style.iconBg,
                  "w-12 h-12 md:w-14 md:h-14",
                  style.pulse && "animate-pulse-slow",
                )}
              >
                <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                {style.pulse && (
                  <div className="absolute inset-0 rounded-xl md:rounded-2xl ring-4 ring-amber-500/20 animate-ping-slow" />
                )}
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-lg md:text-xl lg:text-2xl mb-0.5 md:mb-1">{title}</h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed line-clamp-2 md:line-clamp-none">
                  {description}
                </p>
              </div>
            </div>

            {/* Right: CTA Button (mobile) / Full width (desktop) */}
            <div className="flex-shrink-0 md:w-full md:mt-4">
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base transition-all duration-300",
                  style.ctaBg,
                )}
              >
                <span className="hidden sm:inline">{cta}</span>
                <span className="sm:hidden">Ouvrir</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>

            {/* DVD Illustration - Hidden on mobile, visible on md+ */}
            <div className="hidden md:flex items-center gap-3 mt-4 py-3 px-4 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-12 rounded bg-gradient-to-b from-gray-700 to-gray-800 border border-gray-600 shadow-lg transform transition-transform hover:scale-110 hover:-translate-y-1"
                    style={{
                      animationDelay: `${i * 100}ms`,
                      transform: `rotate(${(i - 2) * 5}deg)`,
                    }}
                  />
                ))}
              </div>
              <div className="flex-1">
                <p className="text-xs text-amber-400/80 font-medium">Nouveau DVD ?</p>
                <p className="text-xs text-muted-foreground">Ajoutez-le en quelques clics</p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
          </>
        ) : (
          /* Non-primary cards - compact layout */
          <>
            {/* Header row */}
            <div className="flex items-start gap-2.5 md:gap-3 mb-2 md:mb-3">
              <div
                className={cn(
                  "flex items-center justify-center rounded-lg md:rounded-xl transition-transform group-hover:scale-110 flex-shrink-0",
                  style.iconBg,
                  "w-9 h-9 md:w-11 md:h-11",
                )}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-sm md:text-base line-clamp-1">{title}</h3>
                <p className="text-muted-foreground text-[10px] md:text-xs leading-snug line-clamp-2 mt-0.5">
                  {description}
                </p>
              </div>
            </div>

            {/* CTA - pushed to bottom */}
            <div className="mt-auto pt-2">
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-xs transition-all duration-300",
                  style.ctaBg,
                )}
              >
                <span>{cta}</span>
                <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </div>
            </div>

            {/* Background icon */}
            {IconSecondary && (
              <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <IconSecondary className="w-10 h-10 md:w-16 md:h-16" />
              </div>
            )}
          </>
        )}
      </div>
    </button>
  );
};

interface WelcomeSectionProps {
  username?: string;
  className?: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ username, className }) => {
  const navigate = useNavigate();

  return (
    <section className={cn("relative pt-4 md:pt-6", className)}>
      {/* Background ambiance */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Header */}
      <div className="mb-5 md:mb-6 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-2 md:mb-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-amber-500">En ligne</span>
        </div>
        <h1 className="font-display text-xl md:text-2xl lg:text-3xl font-bold mb-1 md:mb-2">
          {username ? `Salut ${username} !` : "Bienvenue sur CineVault"}
          <span className="inline-block ml-2 animate-wave">👋</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">Que souhaitez-vous faire aujourd'hui ?</p>
      </div>

      {/* Grille Bento des actions - Layout optimisé mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4 auto-rows-fr">
        {/* Ma Collection - CTA Principal (pleine largeur sur mobile) */}
        <QuickActionCard
          icon={Library}
          iconSecondary={Film}
          title="Ma Collection"
          description="Gérez vos DVD, Blu-ray et 4K"
          cta="Ouvrir ma collection"
          onClick={() => navigate("/collection")}
          variant="primary"
          delay={0}
        />

        {/* Découvrir */}
        <QuickActionCard
          icon={Compass}
          iconSecondary={Users}
          title="Découvrir"
          description="Films tendance"
          cta="Explorer"
          onClick={() => navigate("/search")}
          variant="discover"
          delay={100}
        />

        {/* Badges */}
        <QuickActionCard
          icon={Trophy}
          title="Mes Badges"
          description="Progression"
          cta="Voir"
          onClick={() => navigate("/badges")}
          variant="badges"
          delay={150}
        />

        {/* Listes */}
        <QuickActionCard
          icon={ListVideo}
          title="Mes Listes"
          description="Organisez vos films"
          cta="Gérer"
          onClick={() => navigate("/lists")}
          variant="lists"
          delay={200}
        />
      </div>
    </section>
  );
};

export default WelcomeSection;
