import { useAuth } from "@/contexts/AuthContext";
import { useBadgeNotification, BADGES_CONFIG, CULT_MOVIES, GameBadge } from "@/contexts/BadgeNotificationContext";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Lock, CheckCircle2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Badges() {
  const { user, profile } = useAuth();
  const { currentXp, currentLevel, nextLevelXp, progressPercent, unlockedBadges, watchedMovieIds, favoriteMovieIds } =
    useBadgeNotification();

  const getInitials = () => {
    if (profile?.username) return profile.username.slice(0, 2).toUpperCase();
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return "U";
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
        {/* --- HEADER JOUEUR --- */}
        <div className="flex flex-col items-center mb-6 sm:mb-8 animate-fade-in">
          {/* Avatar avec niveau */}
          <div className="relative mb-3 sm:mb-4">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-primary via-purple-500 to-blue-500">
              <div className="w-full h-full rounded-full border-4 border-background overflow-hidden bg-card flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl sm:text-3xl font-bold text-muted-foreground">{getInitials()}</span>
                )}
              </div>
            </div>
            {/* Badge niveau */}
            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-primary text-primary-foreground font-bold rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border-4 border-background text-sm sm:text-lg shadow-lg">
              {currentLevel}
            </div>
          </div>

          {/* Nom et stats */}
          <h1 className="text-xl sm:text-2xl font-bold mb-1">{profile?.username || "Cinéaste"}</h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-medium text-foreground">{currentXp} XP</span>
            <span>•</span>
            <span>{unlockedBadges.size} Badges</span>
          </div>

          {/* Barre de progression */}
          <div className="w-full max-w-xs sm:max-w-sm space-y-2 px-2">
            <div className="flex justify-between text-[10px] sm:text-xs font-medium">
              <span>Niveau {currentLevel}</span>
              <span>{Math.floor(progressPercent)}%</span>
              <span>Niveau {currentLevel + 1}</span>
            </div>
            <Progress value={progressPercent} className="h-2.5 sm:h-3 rounded-full bg-secondary" />
            <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-1">
              Encore {Math.round(nextLevelXp - currentXp)} XP pour le niveau suivant
            </p>
          </div>
        </div>

        {/* --- ONGLETS BADGES --- */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4 sm:mb-6 h-10 sm:h-11">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              Tous
            </TabsTrigger>
            <TabsTrigger value="unlocked" className="text-xs sm:text-sm">
              Débloqués
            </TabsTrigger>
            <TabsTrigger value="locked" className="text-xs sm:text-sm">
              À débloquer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 sm:space-y-4 mt-0">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {BADGES_CONFIG.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isUnlocked={unlockedBadges.has(badge.id)}
                  currentProgress={badge.progress ? badge.progress(watchedMovieIds, favoriteMovieIds) : 0}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="unlocked" className="space-y-3 sm:space-y-4 mt-0">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {BADGES_CONFIG.filter((b) => unlockedBadges.has(b.id)).map((badge) => (
                <BadgeCard key={badge.id} badge={badge} isUnlocked={true} currentProgress={badge.maxProgress || 100} />
              ))}
              {unlockedBadges.size === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun badge débloqué pour le moment.</p>
                  <p className="text-sm mt-1">Regardez des films pour gagner des badges !</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="locked" className="space-y-3 sm:space-y-4 mt-0">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {BADGES_CONFIG.filter((b) => !unlockedBadges.has(b.id)).map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isUnlocked={false}
                  currentProgress={badge.progress ? badge.progress(watchedMovieIds, favoriteMovieIds) : 0}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* --- DÉFI 50 FILMS --- */}
        <section className="mt-8 sm:mt-10">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="truncate">Défi des 50 Films Cultes</span>
            </h2>
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-600 border-amber-200 text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0"
            >
              +{CULT_MOVIES.length * 20} XP
            </Badge>
          </div>

          <Card className="border-2 border-amber-100 dark:border-amber-900/30 overflow-hidden">
            <ScrollArea className="h-[250px] sm:h-[300px]">
              <div className="p-3 sm:p-4 space-y-1">
                {CULT_MOVIES.map((id, index) => {
                  const isWatched = watchedMovieIds.includes(id);
                  return (
                    <div
                      key={id}
                      className={cn(
                        "flex items-center justify-between p-2.5 sm:p-3 rounded-lg transition-colors",
                        isWatched ? "bg-amber-50 dark:bg-amber-900/20" : "hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span
                          className={cn(
                            "w-6 h-6 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0",
                            isWatched ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {index + 1}
                        </span>
                        <span
                          className={cn(
                            "text-sm font-medium truncate",
                            isWatched && "text-amber-700 dark:text-amber-400 line-through",
                          )}
                        >
                          Film Mystère #{id}
                        </span>
                      </div>
                      {isWatched ? (
                        <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                          <Lock className="w-3 h-3" />
                          <span>20 XP</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

// --- COMPOSANT CARTE BADGE ---
function BadgeCard({
  badge,
  isUnlocked,
  currentProgress,
}: {
  badge: GameBadge;
  isUnlocked: boolean;
  currentProgress: number;
}) {
  const Icon = badge.icon;
  const progressPercent = badge.maxProgress ? Math.min(100, (currentProgress / badge.maxProgress) * 100) : 0;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 border-2",
        isUnlocked ? "border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-sm" : "border-muted bg-card opacity-90",
      )}
    >
      <CardContent className="p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
        {/* Icône */}
        <div
          className={cn(
            "w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
            isUnlocked ? "bg-white dark:bg-card" : "bg-muted",
          )}
        >
          <Icon className={cn("w-6 h-6 sm:w-7 sm:h-7", isUnlocked ? badge.color : "text-muted-foreground")} />
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className={cn("font-bold text-sm truncate", isUnlocked ? "text-foreground" : "text-muted-foreground")}>
              {badge.title}
            </h3>
            {isUnlocked && (
              <Badge
                variant="secondary"
                className="text-[9px] sm:text-[10px] h-5 px-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0"
              >
                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                Obtenu
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{badge.description}</p>

          {/* Progression */}
          {!isUnlocked && badge.maxProgress && (
            <div className="space-y-1">
              <Progress value={progressPercent} className="h-1.5" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>
                  {currentProgress}/{badge.maxProgress}
                </span>
                <span>+{badge.xp} XP</span>
              </div>
            </div>
          )}
          {isUnlocked && (
            <div className="flex items-center gap-1 text-xs text-primary font-medium">
              <Trophy className="w-3 h-3" />
              <span>+{badge.xp} XP gagnés</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
