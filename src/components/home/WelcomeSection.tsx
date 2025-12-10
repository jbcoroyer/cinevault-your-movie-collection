import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Library, 
  Compass, 
  Trophy, 
  ListVideo, 
  Plus,
  Sparkles,
  Users,
  Film
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * WelcomeSection — Section d'accueil engageante
 * 
 * 4 actions rapides avec le CTA principal "Ma Collection" au centre
 * Animations CSS fluides et design premium cinéma
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
  delay = 0
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
      pulse: true
    },
    discover: {
      gradient: "from-blue-500/15 via-cyan-500/10 to-teal-500/5",
      border: "border-blue-500/20 hover:border-blue-400/50",
      iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
      iconColor: "text-white",
      glow: "group-hover:shadow-blue-500/20",
      ring: "ring-blue-500/20",
      ctaBg: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30",
      pulse: false
    },
    badges: {
      gradient: "from-purple-500/15 via-violet-500/10 to-fuchsia-500/5",
      border: "border-purple-500/20 hover:border-purple-400/50",
      iconBg: "bg-gradient-to-br from-purple-500 to-fuchsia-500",
      iconColor: "text-white",
      glow: "group-hover:shadow-purple-500/20",
      ring: "ring-purple-500/20",
      ctaBg: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30",
      pulse: false
    },
    lists: {
      gradient: "from-rose-500/15 via-pink-500/10 to-red-500/5",
      border: "border-rose-500/20 hover:border-rose-400/50",
      iconBg: "bg-gradient-to-br from-rose-500 to-pink-500",
      iconColor: "text-white",
      glow: "group-hover:shadow-rose-500/20",
      ring: "ring-rose-500/20",
      ctaBg: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30",
      pulse: false
    }
  };

  const style = variants[variant];
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full text-left overflow-hidden rounded-2xl",
        "bg-gradient-to-br",
        style.gradient,
        "border",
        style.border,
        "transition-all duration-500 ease-out",
        "hover:scale-[1.02] hover:-translate-y-1",
        "hover:shadow-xl",
        style.glow,
        "animate-fade-in",
        isPrimary && "md:col-span-2 md:row-span-2"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Fond animé */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl",
          variant === "primary" && "bg-amber-500/20",
          variant === "discover" && "bg-blue-500/20",
          variant === "badges" && "bg-purple-500/20",
          variant === "lists" && "bg-rose-500/20"
        )} />
      </div>

      {/* Pulse ring pour le CTA principal */}
      {style.pulse && (
        <div className="absolute inset-0 rounded-2xl animate-pulse-ring opacity-50" />
      )}

      <div className={cn(
        "relative p-5",
        isPrimary && "md:p-8"
      )}>
        {/* En-tête avec icône */}
        <div className="flex items-start gap-4 mb-4">
          <div className={cn(
            "relative flex-shrink-0 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
            style.iconBg,
            isPrimary ? "w-14 h-14" : "w-11 h-11"
          )}>
            <Icon className={cn(
              style.iconColor,
              isPrimary ? "w-7 h-7" : "w-5 h-5"
            )} />
            
            {/* Badge "+" pour collection */}
            {isPrimary && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-subtle">
                <Plus className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-display font-bold text-foreground mb-1 transition-colors",
              isPrimary ? "text-xl md:text-2xl" : "text-base"
            )}>
              {title}
            </h3>
            <p className={cn(
              "text-muted-foreground leading-relaxed",
              isPrimary ? "text-sm md:text-base" : "text-xs line-clamp-2"
            )}>
              {description}
            </p>
          </div>
        </div>

        {/* Illustration pour le CTA principal */}
        {isPrimary && (
          <div className="flex items-center gap-3 mb-5 py-3 px-4 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-12 rounded bg-gradient-to-b from-gray-700 to-gray-800 border border-gray-600 shadow-lg transform transition-transform hover:scale-110 hover:-translate-y-1"
                  style={{ 
                    animationDelay: `${i * 100}ms`,
                    transform: `rotate(${(i - 2) * 5}deg)`
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
        )}

        {/* CTA Button */}
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-300",
          style.ctaBg,
          isPrimary && "px-6 py-3 text-base"
        )}>
          <span>{cta}</span>
          <svg 
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* Icône secondaire flottante */}
        {IconSecondary && (
          <div className="absolute bottom-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <IconSecondary className="w-16 h-16" />
          </div>
        )}
      </div>
    </button>
  );
};

interface WelcomeSectionProps {
  username?: string;
  className?: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ 
  username,
  className 
}) => {
  const navigate = useNavigate();

  return (
    <section className={cn("relative", className)}>
      {/* Background ambiance */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-amber-500">En ligne</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
          {username ? `Salut ${username} !` : "Bienvenue sur CineVault"} 
          <span className="inline-block ml-2 animate-wave">👋</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Que souhaitez-vous faire aujourd'hui ?
        </p>
      </div>

      {/* Grille Bento des actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Ma Collection - CTA Principal */}
        <QuickActionCard
          icon={Library}
          iconSecondary={Film}
          title="Ma Collection"
          description="Ajoutez vos dernières acquisitions DVD, Blu-ray ou 4K et gardez votre collection à jour."
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
          description="Films tendance et collectionneurs à suivre"
          cta="Explorer"
          onClick={() => navigate("/search")}
          variant="discover"
          delay={100}
        />

        {/* Badges */}
        <QuickActionCard
          icon={Trophy}
          title="Mes Badges"
          description="Progression et récompenses débloquées"
          cta="Voir mes badges"
          onClick={() => navigate("/badges")}
          variant="badges"
          delay={200}
        />

        {/* Listes */}
        <QuickActionCard
          icon={ListVideo}
          title="Mes Listes"
          description="Organisez par thème ou créez une watchlist"
          cta="Gérer mes listes"
          onClick={() => navigate("/lists")}
          variant="lists"
          delay={300}
        />
      </div>

      {/* Styles CSS additionnels */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.05);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-15px) scale(1.03);
          }
        }

        @keyframes wave {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(20deg);
          }
          75% {
            transform: rotate(-10deg);
          }
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(245, 158, 11, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 1s;
        }

        .animate-wave {
          display: inline-block;
          animation: wave 1.5s ease-in-out infinite;
          transform-origin: 70% 70%;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }

        .animate-pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </section>
  );
};

export default WelcomeSection;
