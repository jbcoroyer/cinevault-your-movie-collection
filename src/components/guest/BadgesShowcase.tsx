import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Star,
  Sparkles,
  ArrowRight,
  Film,
  Disc,
  Crown,
  Gem,
  Zap,
  Target,
  Heart,
  Eye,
  Award,
  Medal,
  Shield,
  Flame,
  Library,
  Users,
  Clock,
  Check,
} from "lucide-react";

// Types de rareté des badges
type BadgeRarity = "common" | "rare" | "epic" | "legendary" | "grail";

interface DemoBadge {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  rarity: BadgeRarity;
  xp: number;
  category: string;
}

// Badges de démonstration
const DEMO_BADGES: DemoBadge[] = [
  // Collection
  { id: "premier_clap", title: "Premier Clap", description: "Ajoutez votre premier film", icon: Film, rarity: "common", xp: 50, category: "Collection" },
  { id: "mur_de_briques", title: "Mur de Briques", description: "10 films dans votre vidéothèque", icon: Library, rarity: "common", xp: 150, category: "Collection" },
  { id: "videotheque", title: "Vidéothèque", description: "500 films - Vous êtes un vrai vidéo club !", icon: Crown, rarity: "epic", xp: 1000, category: "Collection" },
  { id: "le_musee", title: "Le Musée", description: "5000 films - Une vraie vidéothèque !", icon: Gem, rarity: "grail", xp: 5000, category: "Collection" },
  
  // Format
  { id: "4k_pioneer", title: "4K Pioneer", description: "Possédez 10 films en 4K UHD", icon: Gem, rarity: "rare", xp: 300, category: "Format" },
  { id: "steelbook_hunter", title: "Steelbook Hunter", description: "Collection de 5 Steelbooks", icon: Shield, rarity: "rare", xp: 400, category: "Format" },
  { id: "collector_elite", title: "Collector Elite", description: "Possédez 10 éditions Collector", icon: Crown, rarity: "legendary", xp: 500, category: "Format" },
  { id: "bluray_master", title: "Blu-ray Master", description: "Possédez 25 Blu-rays", icon: Disc, rarity: "epic", xp: 400, category: "Format" },
  
  // Social
  { id: "influenceur", title: "Influenceur", description: "Avoir 50 abonnés", icon: Users, rarity: "rare", xp: 300, category: "Social" },
  { id: "critique_assidu", title: "Critique Assidu", description: "10 Notes du Staff rédigées", icon: Star, rarity: "rare", xp: 200, category: "Social" },
  { id: "plume_doree", title: "Plume Dorée", description: "50 Notes du Staff rédigées", icon: Award, rarity: "legendary", xp: 1000, category: "Social" },
  
  // Secret
  { id: "be_kind_rewind", title: "Be Kind Rewind", description: "Vous avez trouvé l'easter egg !", icon: Sparkles, rarity: "legendary", xp: 500, category: "Secret" },
];

// Couleurs par rareté
const RARITY_STYLES: Record<BadgeRarity, { bg: string; border: string; glow: string; text: string; label: string }> = {
  common: {
    bg: "from-slate-600 to-slate-800",
    border: "border-slate-500/50",
    glow: "shadow-slate-500/20",
    text: "text-slate-300",
    label: "Commun",
  },
  rare: {
    bg: "from-blue-500 to-blue-700",
    border: "border-blue-400/50",
    glow: "shadow-blue-500/30",
    text: "text-blue-300",
    label: "Rare",
  },
  epic: {
    bg: "from-purple-500 to-purple-700",
    border: "border-purple-400/50",
    glow: "shadow-purple-500/40",
    text: "text-purple-300",
    label: "Épique",
  },
  legendary: {
    bg: "from-amber-400 to-orange-600",
    border: "border-amber-400/50",
    glow: "shadow-amber-500/50",
    text: "text-amber-300",
    label: "Légendaire",
  },
  grail: {
    bg: "from-rose-400 via-pink-500 to-purple-600",
    border: "border-rose-400/50",
    glow: "shadow-rose-500/60",
    text: "text-rose-300",
    label: "Graal",
  },
};

interface Badge3DCardProps {
  badge: DemoBadge;
  isLocked?: boolean;
  index: number;
}

const Badge3DCard = ({ badge, isLocked = false, index }: Badge3DCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const style = RARITY_STYLES[badge.rarity];
  const Icon = badge.icon;

  return (
    <div
      className={cn(
        "relative group cursor-pointer perspective-1000",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "relative w-full aspect-square p-4",
          "rounded-2xl border-2",
          "transform transition-all duration-500 ease-out",
          "preserve-3d",
          isHovered && "rotate-y-12 rotate-x-6 scale-110",
          isLocked ? "opacity-50 grayscale" : "",
          style.border,
          `shadow-xl ${style.glow}`
        )}
        style={{
          background: `linear-gradient(135deg, ${style.bg.split(" ").map(c => c.replace("from-", "").replace("to-", "").replace("via-", "")).join(", ")})`,
        }}
      >
        {/* Holographic effect overlay */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            "bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)]",
            "bg-[length:200%_200%]",
            isHovered && "animate-shimmer"
          )}
        />

        {/* Rarity indicator */}
        <div
          className={cn(
            "absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold",
            "bg-black/80 backdrop-blur-sm",
            style.text
          )}
        >
          {style.label}
        </div>

        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl z-10">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white/40 rounded-sm" />
            </div>
          </div>
        )}

        {/* Icon */}
        <div className="flex flex-col items-center justify-center h-full relative z-5">
          <div
            className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center mb-3",
              "bg-white/10 backdrop-blur-sm",
              "ring-2 ring-white/20",
              "transform transition-transform duration-300",
              isHovered && "scale-110 rotate-6"
            )}
          >
            <Icon className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
          <h3 className="text-white text-sm font-bold text-center mb-1 line-clamp-1">
            {badge.title}
          </h3>
          <p className="text-white/60 text-[10px] text-center line-clamp-2">
            {badge.description}
          </p>

          {/* XP Reward */}
          <div className="flex items-center gap-1 mt-2">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400 text-xs font-bold">+{badge.xp} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Carte membre CineVault 3D
const MemberCard3D = () => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotation({ x: y * 20, y: x * 20 });
  };

  return (
    <div
      className="relative w-full max-w-md mx-auto perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setRotation({ x: 0, y: 0 })}
    >
      <div
        className={cn(
          "relative w-full aspect-[1.6/1] rounded-2xl overflow-hidden",
          "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
          "border border-amber-500/30",
          "shadow-2xl shadow-amber-500/20",
          "transform transition-transform duration-200 ease-out preserve-3d"
        )}
        style={{
          transform: `rotateX(${-rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* Holographic overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/10"
          style={{
            transform: `translateX(${rotation.y * 3}px) translateY(${rotation.x * 3}px)`,
          }}
        />

        {/* Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)`,
          }} />
        </div>

        {/* Content */}
        <div className="relative h-full p-6 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
                <Library className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-amber-500 text-xs font-semibold tracking-wider uppercase">
                  CineVault
                </div>
                <div className="text-white text-lg font-bold">Membre Gold</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="text-amber-500 font-bold">Lv.15</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-white/60 text-xs mb-1">Collectionneur Légendaire</div>
              <div className="text-white text-xl font-bold">@VotreNom</div>
            </div>
            <div className="text-right">
              <div className="text-white/60 text-xs mb-1">Collection</div>
              <div className="text-amber-500 text-2xl font-bold">256 films</div>
            </div>
          </div>
        </div>

        {/* Shine effect */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 0)",
          }}
        />
      </div>
    </div>
  );
};

interface BadgesShowcaseProps {
  className?: string;
}

export const BadgesShowcase = ({ className }: BadgesShowcaseProps) => {
  const navigate = useNavigate();

  const features = [
    { icon: Trophy, title: "30+ Badges", description: "Débloquez des badges uniques selon vos accomplissements" },
    { icon: Zap, title: "Système XP", description: "Gagnez de l'expérience et montez en niveau" },
    { icon: Crown, title: "Titres Exclusifs", description: "Obtenez des titres rares à afficher sur votre profil" },
    { icon: Star, title: "Raretés Multiples", description: "De Commun à Graal, collectionnez-les tous" },
  ];

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6 animate-fade-in">
              <Trophy className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Système de gamification
              </span>
            </div>

            {/* Titre */}
            <h1
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              Collectionnez des{" "}
              <span className="relative">
                <span className="text-purple-500">badges</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path
                    d="M2 6C50 2 150 2 198 6"
                    stroke="rgb(168 85 247)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="animate-draw"
                  />
                </svg>
              </span>
            </h1>

            {/* Sous-titre */}
            <p
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              Transformez votre passion en aventure. Gagnez de l'XP, débloquez des badges exclusifs et
              devenez un collectionneur légendaire !
            </p>

            {/* CTA */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
              style={{ animationDelay: "300ms" }}
            >
              <Button
                size="lg"
                onClick={() => navigate("/auth?mode=signup")}
                className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600 text-white text-base font-semibold px-8 py-6 rounded-full shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 hover:scale-105"
              >
                <Trophy className="w-5 h-5 mr-2" />
                Commencer l'aventure
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto text-base px-8 py-6 rounded-full border-border/50 hover:border-purple-500/30 hover:bg-purple-500/5"
              >
                Se connecter
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Member Card Section */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Votre carte membre CineVault
            </h2>
            <p className="text-muted-foreground">
              Une carte unique qui évolue avec votre collection
            </p>
          </div>
          <MemberCard3D />
        </div>
      </section>

      {/* Badges Showcase */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Badges à débloquer
            </h2>
            <p className="text-muted-foreground">
              Plus de 30 badges répartis en différentes catégories et raretés
            </p>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {DEMO_BADGES.map((badge, index) => (
              <Badge3DCard
                key={badge.id}
                badge={badge}
                isLocked={index > 4}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={cn(
                  "text-center p-6 rounded-2xl",
                  "bg-card/50 backdrop-blur-sm border border-border/50",
                  "hover:border-purple-500/30 transition-colors",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you can do */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
              Ce que vous pouvez accomplir
            </h2>
            <div className="space-y-4">
              {[
                "Débloquer des badges en ajoutant des films à votre collection",
                "Gagner de l'XP et monter en niveau",
                "Collecter différents formats (DVD, Blu-ray, 4K, Steelbook...)",
                "Rédiger des critiques et partager vos avis",
                "Suivre d'autres collectionneurs et découvrir leurs trouvailles",
                "Participer à des défis saisonniers",
                "Personnaliser votre carte membre avec des thèmes exclusifs",
              ].map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl",
                    "bg-card/50 border border-border/50",
                    "animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-purple-500/10 rounded-3xl blur-xl" />
            <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 md:p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-purple-500" />
              </div>
              <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">
                Prêt à relever le défi ?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Créez votre compte gratuit et commencez à collectionner des badges dès maintenant.
                Votre aventure de collectionneur commence ici !
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-purple-500 hover:bg-purple-600 text-white text-base font-semibold px-10 py-6 rounded-full shadow-lg shadow-purple-500/25"
              >
                Créer mon compte gratuit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BadgesShowcase;
