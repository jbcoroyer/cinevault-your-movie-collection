import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";
import { BADGES_DATA, LEVEL_REWARDS, GameBadge } from "@/data/gameData";
import Header from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Lock, CheckCircle2, Crown, Zap, Filter, Star, Clapperboard, Film, Disc } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeTab = "available" | "completed" | "rewards";

export default function Badges() {
  const { user, profile } = useAuth();
  const { currentXp, currentLevel, nextLevelXp, progressPercent, unlockedBadges, userStats } = useBadgeNotification();

  const [activeTab, setActiveTab] = useState<BadgeTab>("available");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const getInitials = () => {
    if (profile?.username) return profile.username.slice(0, 2).toUpperCase();
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return "U";
  };

  const getBadgeProgress = (badge: GameBadge) => {
    if (badge.id === "total_watched") return userStats.watchedIds.size;
    if (badge.id === "reviews_count") return userStats.reviewCount;
    if (badge.id === "favorites_count") return userStats.favoriteIds.size;
    if (badge.id === "physical_count") return userStats.physicalCount;
    if (badge.movieIds) {
      return badge.movieIds.filter((id) => userStats.watchedIds.has(id)).length;
    }
    return 0;
  };

  const filteredBadges = BADGES_DATA.filter((badge) => {
    if (activeCategory === "all") return true;
    return badge.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl">
        {/* --- HEADER DU JOUEUR --- */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6 sm:p-8 mb-8 shadow-xl border border-white/10">
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

        {/* --- ONGLETS (SEGMENTED CONTROL) --- */}
        <div className="flex p-1 bg-muted/50 rounded-xl mb-6 relative">
          <button
            onClick={() => setActiveTab("available")}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === "available"
                ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            À Débloquer
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === "completed"
                ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Terminés
          </button>
          <button
            onClick={() => setActiveTab("rewards")}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === "rewards"
                ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Récompenses
          </button>
        </div>

        {/* --- CONTENU --- */}
        {(activeTab === "available" || activeTab === "completed") && (
          <>
            {/* FILTRES DE CATÉGORIE (CHIPS) */}
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
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border",
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:bg-muted",
                  )}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>

            <div
              className={cn(
                "space-y-6 animate-fade-in",
                activeTab === "completed"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0"
                  : "grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0",
              )}
            >
              {filteredBadges.map((badge) => {
                const progress = getBadgeProgress(badge);

                // LOGIQUE D'AFFICHAGE SELON L'ONGLET
                if (activeTab === "available") {
                  // Trouver le prochain tier non débloqué
                  const nextTierIndex = badge.tiers.findIndex((t) => progress < t.target);
                  if (nextTierIndex === -1) return null; // Tous débloqués

                  const nextTier = badge.tiers[nextTierIndex];
                  const prevTierTarget = nextTierIndex > 0 ? badge.tiers[nextTierIndex - 1].target : 0;
                  const tierProgress = Math.min(
                    100,
                    Math.max(0, ((progress - prevTierTarget) / (nextTier.target - prevTierTarget)) * 100),
                  );
                  const Icon = badge.icon;

                  return (
                    <Card
                      key={badge.id}
                      className="overflow-hidden border-l-4 hover:shadow-md transition-shadow"
                      style={{ borderLeftColor: "hsl(var(--muted-foreground))" }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-muted-foreground opacity-50" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-base">{nextTier.title}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {badge.baseTitle} • {badge.description}
                                </p>
                              </div>
                              <Badge variant="outline" className="bg-muted/50 whitespace-nowrap ml-2">
                                +{nextTier.xp} XP
                              </Badge>
                            </div>

                            <div className="mt-3 space-y-1.5">
                              <div className="flex justify-between text-xs font-medium">
                                <span className="text-muted-foreground">Progression</span>
                                <span>
                                  {progress} / {nextTier.target}
                                </span>
                              </div>
                              <Progress value={tierProgress} className="h-2" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                } else {
                  // Onglet Completed
                  const unlockedTiers = badge.tiers.filter((t) => progress >= t.target);
                  if (unlockedTiers.length === 0) return null;

                  const highestTier = unlockedTiers[unlockedTiers.length - 1];
                  const isMaxed = unlockedTiers.length === badge.tiers.length;
                  const Icon = badge.icon;

                  return (
                    <Card
                      key={badge.id}
                      className={cn(
                        "overflow-hidden border-2 relative",
                        isMaxed ? "border-primary/30 bg-primary/5" : "border-muted",
                      )}
                    >
                      {isMaxed && (
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                          MAX
                        </div>
                      )}
                      <CardContent className="p-4 flex items-center gap-4">
                        <div
                          className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                            isMaxed ? "bg-gradient-to-br from-primary/20 to-primary/10" : "bg-muted",
                          )}
                        >
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
                }
              })}
            </div>

            {/* Empty States */}
            {activeTab === "available" && (
              <div className="hidden last:block text-center py-10 text-muted-foreground">
                <p>Aucun badge à débloquer dans cette catégorie.</p>
              </div>
            )}
            {activeTab === "completed" && unlockedBadges.length === 0 && (
              <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <h3 className="text-lg font-medium">Aucun badge débloqué</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Regardez des films et écrivez des avis pour commencer votre collection !
                </p>
              </div>
            )}
          </>
        )}

        {/* --- ONGLET RÉCOMPENSES --- */}
        {activeTab === "rewards" && (
          <div className="animate-fade-in">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-bold mb-2">Parcours de Progression</h2>
                    <p className="text-muted-foreground text-sm">
                      Montez de niveau pour débloquer des fonctionnalités exclusives
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-border hidden sm:block" />
                    <div className="space-y-6">
                      {LEVEL_REWARDS.map((reward, index) => {
                        const isUnlocked = currentLevel >= reward.level;
                        const isNext =
                          !isUnlocked &&
                          currentLevel < reward.level &&
                          (index === 0 || currentLevel >= LEVEL_REWARDS[index - 1].level);
                        const RewardIcon = reward.icon;

                        return (
                          <div
                            key={reward.level}
                            className={cn(
                              "relative flex items-center gap-4 sm:gap-6 p-4 rounded-xl transition-all",
                              isUnlocked ? "bg-muted/30" : "opacity-70",
                              isNext && "opacity-100 ring-2 ring-primary bg-primary/5",
                            )}
                          >
                            <div
                              className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg border-4 z-10 flex-shrink-0 bg-background",
                                isUnlocked ? "border-primary text-primary" : "border-muted text-muted-foreground",
                                isNext && "border-primary animate-pulse",
                              )}
                            >
                              {reward.level}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg flex items-center gap-2">
                                {reward.title}
                                {isUnlocked && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                {isNext && (
                                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                    Prochain
                                  </span>
                                )}
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
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
