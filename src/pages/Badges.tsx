import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBadgeNotification, UnlockedBadgeInfo } from "@/contexts/BadgeNotificationContext";
import { BADGES_DATA, LEVEL_REWARDS, GameBadge, BadgeTier } from "@/data/gameData";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Lock, CheckCircle2, Crown, Zap, Filter, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Badges() {
  const { user, profile } = useAuth();
  const { 
    currentXp, currentLevel, nextLevelXp, currentLevelXp, progressPercent, 
    unlockedBadges, userStats 
  } = useBadgeNotification();

  const [activeCategory, setActiveCategory] = useState<string>("all");

  const getInitials = () => {
    if (profile?.username) return profile.username.slice(0, 2).toUpperCase();
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return "U";
  };

  // Helper pour obtenir la progression d'un badge spécifique
  const getBadgeProgress = (badge: GameBadge) => {
    if (badge.id === 'total_watched') return userStats.watchedIds.size;
    if (badge.id === 'reviews_count') return userStats.reviewCount;
    if (badge.id === 'favorites_count') return userStats.favoriteIds.size;
    if (badge.id === 'physical_count') return userStats.physicalCount;
    if (badge.movieIds) {
      return badge.movieIds.filter(id => userStats.watchedIds.has(id)).length;
    }
    return 0;
  };

  // Filtrage des badges
  const filteredBadges = BADGES_DATA.filter(badge => {
    if (activeCategory === "all") return true;
    return badge.category === activeCategory;
  });

  // Calculer le prochain niveau
  const nextReward = LEVEL_REWARDS.find(r => r.level > currentLevel) || LEVEL_REWARDS[LEVEL_REWARDS.length - 1];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl">
        {/* --- HEADER DU JOUEUR --- */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6 sm:p-8 mb-8 shadow-xl border border-white/10">
          {/* Background sparkles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* Avatar Level */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-primary to-purple-500">
                <div className="w-full h-full rounded-full border-4 border-slate-900 overflow-hidden bg-slate-800 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl sm:text-4xl font-bold">{getInitials()}</span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground font-bold rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-4 border-slate-900 text-lg shadow-lg">
                {currentLevel}
              </div>
            </div>

            {/* Stats & XP Bar */}
            <div className="flex-1 w-full text-center md:text-left space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1">{profile?.username || "Cinéaste"}</h1>
                <div className="flex items-center justify-center md:justify-start gap-3 text-sm sm:text-base text-slate-300">
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold text-white">{currentXp.toLocaleString()}</span> XP
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                    <Crown className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white">{unlockedBadges.length}</span> Badges
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm font-medium text-slate-300">
                  <span>Niveau {currentLevel}</span>
                  <span className="text-white">{Math.floor(progressPercent)}%</span>
                  <span>Niveau {currentLevel + 1}</span>
                </div>
                <div className="h-4 sm:h-5 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-primary via-yellow-400 to-primary animate-pulse" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 text-center md:text-right">
                  {Math.round(nextLevelXp - currentXp)} XP restants pour le prochain niveau
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- ONGLETS PRINCIPAUX --- */}
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6 h-12 bg-muted/50 p-1">
            <TabsTrigger value="available" className="text-sm font-medium">À Débloquer</TabsTrigger>
            <TabsTrigger value="completed" className="text-sm font-medium">Terminés</TabsTrigger>
            <TabsTrigger value="rewards" className="text-sm font-medium">Récompenses</TabsTrigger>
          </TabsList>

          {/* FILTRES DE CATÉGORIE (Visible sur Available & Completed) */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: "all", label: "Tous", icon: Filter },
              { id: "general", label: "Général", icon: Zap },
              { id: "director", label: "Réalisateurs", icon: Clapperboard },
              { id: "genre", label: "Genres", icon: Film },
              { id: "saga", label: "Sagas", icon: Crown },
              { id: "physical", label: "Physique", icon: Disc },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* --- ONGLET À DÉBLOQUER --- */}
          <TabsContent value="available" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBadges.map((badge) => {
                const progress = getBadgeProgress(badge);
                // Trouver le prochain tier non débloqué
                const nextTierIndex = badge.tiers.findIndex(t => progress < t.target);
                
                // Si tous débloqués, ne pas afficher ici (sauf si on veut montrer le max atteint ?)
                // Pour "A débloquer", on affiche seulement si pas fini
                if (nextTierIndex === -1) return null;

                const nextTier = badge.tiers[nextTierIndex];
                const prevTierTarget = nextTierIndex > 0 ? badge.tiers[nextTierIndex - 1].target : 0;
                
                // Calculer pourcentage pour ce tier spécifique
                const tierProgress = Math.min(100, Math.max(0, ((progress - prevTierTarget) / (nextTier.target - prevTierTarget)) * 100));
                
                const Icon = badge.icon;

                return (
                  <Card key={badge.id} className="overflow-hidden border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: 'hsl(var(--muted-foreground))' }}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-muted-foreground opacity-50" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-base">{nextTier.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{badge.baseTitle} • {badge.description}</p>
                            </div>
                            <Badge variant="outline" className="bg-muted/50 whitespace-nowrap ml-2">
                              +{nextTier.xp} XP
                            </Badge>
                          </div>
                          
                          <div className="mt-3 space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-muted-foreground">Progression</span>
                              <span>{progress} / {nextTier.target}</span>
                            </div>
                            <Progress value={tierProgress} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* Empty state safeguard */}
            <div className="hidden last:block text-center py-10 text-muted-foreground">
              <p>Aucun badge trouvé dans cette catégorie.</p>
            </div>
          </TabsContent>

          {/* --- ONGLET TERMINÉS --- */}
          <TabsContent value="completed" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBadges.map((badge) => {
                const progress = getBadgeProgress(badge);
                // Trouver le plus haut tier débloqué
                const unlockedTiers = badge.tiers.filter(t => progress >= t.target);
                
                if (unlockedTiers.length === 0) return null;

                const highestTier = unlockedTiers[unlockedTiers.length - 1];
                const isMaxed = unlockedTiers.length === badge.tiers.length;
                const Icon = badge.icon;

                return (
                  <Card key={badge.id} className={cn("overflow-hidden border-2 relative", isMaxed ? "border-primary/30 bg-primary/5" : "border-muted")}>
                    {isMaxed && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                        MAX
                      </div>
                    )}
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm", isMaxed ? "bg-gradient-to-br from-primary/20 to-primary/10" : "bg-muted")}>
                        <Icon className={cn("w-7 h-7", badge.color)} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base">{highestTier.title}</h3>
                        <p className="text-xs text-muted-foreground">{badge.baseTitle}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Obtenu ({progress})</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {unlockedBadges.length === 0 && (
              <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <h3 className="text-lg font-medium">Aucun badge débloqué</h3>
                <p className="text-muted-foreground text-sm mt-1">Regardez des films et écrivez des avis pour commencer votre collection !</p>
              </div>
            )}
          </TabsContent>

          {/* --- ONGLET RÉCOMPENSES --- */}
          <TabsContent value="rewards" className="animate-fade-in">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-bold mb-2">Parcours de Progression</h2>
                    <p className="text-muted-foreground text-sm">Montez de niveau pour débloquer des fonctionnalités exclusives</p>
                  </div>

                  <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-border hidden sm:block" />

                    <div className="space-y-6">
                      {LEVEL_REWARDS.map((reward, index) => {
                        const isUnlocked = currentLevel >= reward.level;
                        const isNext = !isUnlocked && currentLevel < reward.level && (index === 0 || currentLevel >= LEVEL_REWARDS[index - 1].level);
                        const RewardIcon = reward.icon;

                        return (
                          <div key={reward.level} className={cn("relative flex items-center gap-4 sm:gap-6 p-4 rounded-xl transition-all", isUnlocked ? "bg-muted/30" : "opacity-70", isNext && "opacity-100 ring-2 ring-primary bg-primary/5")}>
                            {/* Level Circle */}
                            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg border-4 z-10 flex-shrink-0 bg-background", isUnlocked ? "border-primary text-primary" : "border-muted text-muted-foreground", isNext && "border-primary animate-pulse")}>
                              {reward.level}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                              <h3 className="font-bold text-lg flex items-center gap-2">
                                {reward.title}
                                {isUnlocked && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                {isNext && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Prochain</span>}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <RewardIcon className="w-4 h-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">{reward.reward}</p>
                              </div>
                            </div>
                            
                            {!isUnlocked && <Lock className="w-5 h-5 text-muted-foreground opacity-30" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
