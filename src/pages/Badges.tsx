import { useAuth } from "@/contexts/AuthContext";
import { useBadges, BADGES_CONFIG, CULT_MOVIES } from "@/contexts/BadgeContext";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Lock, CheckCircle2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GameBadge } from "@/contexts/BadgeContext";

export default function Badges() {
  const { user, profile } = useAuth();
  const {
    unlockedBadges,
    currentXp,
    currentLevel,
    nextLevelXp,
    progressPercent,
    watchedMovieIds,
    favoriteMovieIds,
  } = useBadges();

  const getInitials = () => {
    if (profile?.username) return profile.username.slice(0, 2).toUpperCase();
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return "U";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* --- HEADER JOUEUR --- */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-primary via-purple-500 to-blue-500">
              <div className="w-full h-full rounded-full border-4 border-background overflow-hidden bg-card flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-muted-foreground">{getInitials()}</span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground font-bold rounded-full w-10 h-10 flex items-center justify-center border-4 border-background text-lg shadow-lg">
              {currentLevel}
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-1">{profile?.username || "Cinéaste"}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-medium text-foreground">{currentXp} XP</span>
            <span>•</span>
            <span>{unlockedBadges.size} Badges</span>
          </div>

          {/* Barre de progression */}
          <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Niveau {currentLevel}</span>
              <span>{Math.floor(progressPercent)}%</span>
              <span>Niveau {currentLevel + 1}</span>
            </div>
            <Progress value={progressPercent} className="h-3 rounded-full bg-secondary" />
            <p className="text-xs text-center text-muted-foreground mt-1">
              Encore {Math.round(nextLevelXp - currentXp)} XP pour le niveau suivant
            </p>
          </div>
        </div>

        {/* --- CONTENU DES BADGES --- */}
        <Tabs defaultValue="all" className="w-full max-w-2xl mx-auto">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="unlocked">Débloqués</TabsTrigger>
            <TabsTrigger value="locked">À débloquer</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <TabsContent value="unlocked" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BADGES_CONFIG.filter((b) => unlockedBadges.has(b.id)).map((badge) => (
                <BadgeCard key={badge.id} badge={badge} isUnlocked={true} currentProgress={badge.maxProgress || 100} />
              ))}
              {unlockedBadges.size === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                  Aucun badge débloqué pour le moment. Regardez des films !
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="locked" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* --- LISTE DES 50 FILMS (CHALLENGE) --- */}
        <section className="max-w-2xl mx-auto mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Défi des 50 Films Cultes
            </h2>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
              +{CULT_MOVIES.length * 20} XP Total
            </Badge>
          </div>

          <Card className="border-2 border-amber-100 dark:border-amber-900/30 overflow-hidden">
            <ScrollArea className="h-[300px]">
              <div className="p-4 space-y-1">
                {CULT_MOVIES.map((id, index) => {
                  const isWatched = watchedMovieIds.includes(id);
                  return (
                    <div
                      key={id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-colors",
                        isWatched ? "bg-amber-50 dark:bg-amber-900/20" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold",
                            isWatched ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {index + 1}
                        </span>
                        <span
                          className={cn("font-medium", isWatched && "text-amber-700 dark:text-amber-400 line-through")}
                        >
                          Film Mystère #{id}
                        </span>
                      </div>
                      {isWatched ? (
                        <CheckCircle2 className="w-5 h-5 text-amber-500" />
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
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

// --- SOUS-COMPOSANT CARTE BADGE ---

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
        isUnlocked
          ? "border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-sm"
          : "border-muted bg-card opacity-90 grayscale hover:grayscale-0"
      )}
    >
      <CardContent className="p-4 flex items-start gap-4">
        {/* Icone */}
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
            isUnlocked ? "bg-white dark:bg-card" : "bg-muted"
          )}
        >
          <Icon className={cn("w-7 h-7", isUnlocked ? badge.color : "text-muted-foreground")} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className={cn("font-bold text-sm", isUnlocked ? "text-foreground" : "text-muted-foreground")}>
              {badge.title}
            </h3>
            {isUnlocked && (
              <Badge
                variant="secondary"
                className="text-[10px] h-5 px-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                Obtenu
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{badge.description}</p>

          {/* Barre de progression */}
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
              <span>+{badge.xp} XP gagnés</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
