import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  User,
  Star,
  Sparkles,
  ArrowRight,
  Film,
  Library,
  Crown,
  Heart,
  Eye,
  Trophy,
  Users,
  Calendar,
  Edit2,
  Settings,
  Zap,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

// Données de démonstration pour le profil
const DEMO_PROFILE = {
  username: "CinéphilePro",
  bio: "Passionné de cinéma depuis 20 ans. Collectionneur de Blu-ray et éditions Steelbook. Mes réalisateurs préférés : Nolan, Villeneuve, Fincher.",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
  level: 15,
  xp: 3450,
  maxXp: 5000,
  title: "Collectionneur Légendaire",
  memberSince: "Janvier 2023",
  stats: {
    collection: 256,
    watched: 1247,
    watchlist: 89,
    favorites: 42,
    followers: 128,
    following: 95,
    reviews: 73,
    badges: 18,
  },
  topMovies: [
    { title: "Inception", poster: "https://image.tmdb.org/t/p/w185/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg" },
    { title: "Interstellar", poster: "https://image.tmdb.org/t/p/w185/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
    { title: "The Dark Knight", poster: "https://image.tmdb.org/t/p/w185/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
    { title: "Blade Runner 2049", poster: "https://image.tmdb.org/t/p/w185/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg" },
    { title: "Dune", poster: "https://image.tmdb.org/t/p/w185/d5NXSklXo0qyIYkgV94XAgMIckC.jpg" },
  ],
  recentBadges: [
    { title: "Vidéothèque", rarity: "epic", icon: Library },
    { title: "4K Pioneer", rarity: "rare", icon: Crown },
    { title: "Critique Assidu", rarity: "rare", icon: Star },
  ],
};

// Styles de rareté des badges
const RARITY_COLORS = {
  common: "from-slate-500 to-slate-700",
  rare: "from-blue-500 to-blue-700",
  epic: "from-purple-500 to-purple-700",
  legendary: "from-amber-400 to-orange-600",
};

interface ProfileShowcaseProps {
  className?: string;
}

export const ProfileShowcase = ({ className }: ProfileShowcaseProps) => {
  const navigate = useNavigate();

  const features = [
    { icon: Library, title: "Votre Collection", description: "Cataloguez tous vos films physiques" },
    { icon: Trophy, title: "Badges & XP", description: "Gagnez des récompenses en collectionnant" },
    { icon: Users, title: "Communauté", description: "Suivez d'autres collectionneurs" },
    { icon: Star, title: "Critiques", description: "Partagez vos avis sur les films" },
  ];

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 animate-fade-in">
              <User className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Votre espace personnel
              </span>
            </div>

            {/* Titre */}
            <h1
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              Votre profil{" "}
              <span className="relative">
                <span className="text-emerald-500">unique</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path
                    d="M2 6C50 2 150 2 198 6"
                    stroke="rgb(16 185 129)"
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
              Créez votre identité de collectionneur. Partagez votre passion, suivez vos statistiques
              et connectez-vous avec la communauté.
            </p>

            {/* CTA */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
              style={{ animationDelay: "300ms" }}
            >
              <Button
                size="lg"
                onClick={() => navigate("/auth?mode=signup")}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold px-8 py-6 rounded-full shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-105"
              >
                <User className="w-5 h-5 mr-2" />
                Créer mon profil
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto text-base px-8 py-6 rounded-full border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5"
              >
                Se connecter
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Profile Card */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                Aperçu d'un profil CineVault
              </h2>
              <p className="text-muted-foreground">
                Voici à quoi ressemblera votre espace personnel
              </p>
            </div>

            {/* Profile Preview Card */}
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden shadow-xl">
              {/* Header Banner */}
              <div className="h-32 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 relative">
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`,
                }} />
              </div>

              {/* Profile Content */}
              <div className="px-6 pb-6">
                {/* Avatar & Basic Info */}
                <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 mb-6">
                  <Avatar className="w-32 h-32 border-4 border-background shadow-xl ring-4 ring-amber-500/20">
                    <AvatarImage src={DEMO_PROFILE.avatar} alt={DEMO_PROFILE.username} />
                    <AvatarFallback className="text-3xl font-bold bg-amber-500 text-white">
                      {DEMO_PROFILE.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold">@{DEMO_PROFILE.username}</h2>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {DEMO_PROFILE.title}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-3">{DEMO_PROFILE.bio}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Membre depuis {DEMO_PROFILE.memberSince}
                      </span>
                    </div>
                  </div>

                  {/* XP Progress */}
                  <div className="md:text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span className="font-bold text-lg">Niveau {DEMO_PROFILE.level}</span>
                    </div>
                    <Progress value={(DEMO_PROFILE.xp / DEMO_PROFILE.maxXp) * 100} className="h-2 w-48" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {DEMO_PROFILE.xp} / {DEMO_PROFILE.maxXp} XP
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-6">
                  {[
                    { icon: Library, value: DEMO_PROFILE.stats.collection, label: "Collection" },
                    { icon: Eye, value: DEMO_PROFILE.stats.watched, label: "Vus" },
                    { icon: Film, value: DEMO_PROFILE.stats.watchlist, label: "Watchlist" },
                    { icon: Heart, value: DEMO_PROFILE.stats.favorites, label: "Favoris" },
                    { icon: Users, value: DEMO_PROFILE.stats.followers, label: "Abonnés" },
                    { icon: Users, value: DEMO_PROFILE.stats.following, label: "Abonnements" },
                    { icon: Star, value: DEMO_PROFILE.stats.reviews, label: "Critiques" },
                    { icon: Trophy, value: DEMO_PROFILE.stats.badges, label: "Badges" },
                  ].map((stat, index) => (
                    <div
                      key={stat.label}
                      className="text-center p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <stat.icon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <div className="font-bold text-lg">{stat.value}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top 5 Movies */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    Top 5 Films
                  </h3>
                  <div className="flex gap-3">
                    {DEMO_PROFILE.topMovies.map((movie, index) => (
                      <div
                        key={movie.title}
                        className="relative group cursor-pointer"
                      >
                        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center z-10 shadow-lg">
                          {index + 1}
                        </div>
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-24 h-36 object-cover rounded-lg shadow-md ring-2 ring-white/10 group-hover:ring-amber-500/50 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Badges */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-purple-500" />
                    Derniers badges obtenus
                  </h3>
                  <div className="flex gap-3">
                    {DEMO_PROFILE.recentBadges.map((badge) => {
                      const Icon = badge.icon;
                      return (
                        <div
                          key={badge.title}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl",
                            "bg-gradient-to-r text-white",
                            RARITY_COLORS[badge.rarity as keyof typeof RARITY_COLORS]
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-semibold">{badge.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
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
                  "hover:border-emerald-500/30 transition-colors",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-emerald-500" />
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
              Personnalisez votre profil
            </h2>
            <div className="space-y-4">
              {[
                "Choisissez votre avatar et votre bannière personnalisée",
                "Affichez vos 5 films préférés en évidence",
                "Partagez votre bio et vos goûts cinématographiques",
                "Montrez vos badges et votre progression",
                "Connectez-vous avec d'autres collectionneurs",
                "Consultez vos statistiques détaillées",
                "Personnalisez votre carte membre CineVault",
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
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-emerald-500/10 rounded-3xl blur-xl" />
            <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 md:p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <User className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">
                Créez votre identité CineVault
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Rejoignez la communauté des passionnés de cinéma. Votre profil n'attend plus que vous !
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold px-10 py-6 rounded-full shadow-lg shadow-emerald-500/25"
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

export default ProfileShowcase;
