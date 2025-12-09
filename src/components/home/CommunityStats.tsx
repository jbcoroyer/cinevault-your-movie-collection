import React, { useEffect, useRef, useState } from "react";
import { useCommunityStats } from "@/hooks/useCommunityStats";
import { cn } from "@/lib/utils";
import { Disc, Users, TrendingUp, MessageSquare, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

/**
 * CommunityStats — Compteurs communautaires animés
 * 
 * Affiche les statistiques globales avec animation de comptage
 * style Stripe/Linear
 */

interface CommunityStatsProps {
  className?: string;
}

export const CommunityStats: React.FC<CommunityStatsProps> = ({ className }) => {
  const { stats, loading } = useCommunityStats();

  const statsConfig = [
    {
      key: "totalPhysicalMovies",
      value: stats.totalPhysicalMovies,
      label: "DVD & Blu-ray",
      sublabel: "dans les collections",
      icon: Disc,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      gradient: "from-purple-500/20 to-purple-600/5",
    },
    {
      key: "totalCollectors",
      value: stats.totalCollectors,
      label: "Collectionneurs",
      sublabel: "actifs",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      gradient: "from-blue-500/20 to-blue-600/5",
    },
    {
      key: "moviesAddedThisWeek",
      value: stats.moviesAddedThisWeek,
      label: "Films ajoutés",
      sublabel: "cette semaine",
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      gradient: "from-emerald-500/20 to-emerald-600/5",
    },
    {
      key: "totalReviews",
      value: stats.totalReviews,
      label: "Reviews",
      sublabel: "publiées",
      icon: MessageSquare,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      gradient: "from-amber-500/20 to-amber-600/5",
    },
  ];

  if (loading) {
    return (
      <section className={cn("px-4 sm:px-6 py-8", className)}>
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div 
                key={i} 
                className="h-32 rounded-2xl bg-muted animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("px-4 sm:px-6 py-8", className)}>
      <div className="container mx-auto">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">La Communauté CineVault</h2>
            <p className="text-sm text-muted-foreground">Statistiques en temps réel</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsConfig.map((stat, index) => (
            <StatCard
              key={stat.key}
              {...stat}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Individual stat card with animated counter
interface StatCardProps {
  value: number;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  gradient: string;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  sublabel,
  icon: Icon,
  color,
  bgColor,
  gradient,
  delay,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection observer for triggering animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animated counter
  useEffect(() => {
    if (!isVisible) return;

    const duration = 1500; // ms
    const startTime = Date.now();
    const startValue = 0;
    const endValue = value;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-expo)
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutExpo);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    // Start with delay
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [isVisible, value, delay]);

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toLocaleString("fr-FR");
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5",
        "bg-card/80 backdrop-blur-xl",
        "border border-white/10 dark:border-white/5",
        "transition-all duration-500",
        "hover:scale-[1.02] hover:shadow-xl",
        "group"
      )}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {/* Gradient background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50",
        gradient
      )} />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
          bgColor
        )}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>

        {/* Value */}
        <div className="font-stats text-3xl sm:text-4xl font-bold tracking-tight mb-1">
          {formatNumber(displayValue)}
        </div>

        {/* Labels */}
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{sublabel}</div>
      </div>

      {/* Hover glow effect */}
      <div className={cn(
        "absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100",
        "bg-gradient-to-r from-primary/20 via-transparent to-primary/20",
        "transition-opacity duration-500",
        "pointer-events-none"
      )} />
    </div>
  );
};

export default CommunityStats;
