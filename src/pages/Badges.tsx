import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllBadges, debugUnlockBadge, Badge } from "@/services/badgeService";
import { DESTINIES, ICON_MAP } from "@/data/gameData";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { HoloBadge } from "@/components/gamification/HoloBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function BadgesPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats globales pour le header
  const totalUnlocked = badges.filter((b) => b.isUnlocked).length;
  const totalXP = badges.reduce((acc, b) => (b.isUnlocked ? acc + (b.xp_reward || 0) : acc), 0);

  useEffect(() => {
    if (user) {
      loadBadges();
    }
  }, [user]);

  const loadBadges = async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchAllBadges(user.id);
    setBadges(data);
    setLoading(false);
  };

  const handleDebugUnlock = async (badgeId: string) => {
    if (!user) return;
    const { error } = await debugUnlockBadge(user.id, badgeId);
    if (!error) {
      toast.success("Badge débloqué (Mode Debug)", {
        description: "Rechargement des données...",
      });
      loadBadges();
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-8 pb-12 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-medium mb-6 animate-fade-in">
            <Trophy className="w-4 h-4" />
            <span>Hall of Fame • Niveau {Math.floor(totalXP / 1000) + 1}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-4 text-white">
            Vos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">
              Destinées
            </span>
          </h1>

          <p className="text-muted-foreground max-w-lg mx-auto text-lg mb-8">
            {totalUnlocked} badges débloqués • {totalXP} XP cumulés
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4">
        <Tabs defaultValue="auteur" className="w-full space-y-8">
          {/* Navigation des Destinées */}
          <div className="flex justify-center">
            <TabsList className="bg-white/5 border border-white/10 p-1.5 h-auto rounded-full backdrop-blur-md overflow-x-auto max-w-[100vw] justify-start md:justify-center">
              {DESTINIES.map((destiny) => (
                <TabsTrigger
                  key={destiny.id}
                  value={destiny.id}
                  className="rounded-full px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:text-white transition-all gap-2 min-w-max"
                  style={{
                    // Hack pour injecter le gradient dynamiquement si actif
                    backgroundImage: `var(--gradient-${destiny.id})`,
                  }}
                >
                  <destiny.icon className={cn("w-4 h-4", `text-${destiny.color.split("-")[1]}-400`)} />
                  {destiny.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Contenu des Grilles */}
          {DESTINIES.map((destiny) => (
            <TabsContent
              key={destiny.id}
              value={destiny.id}
              className="animate-in fade-in slide-in-from-bottom-8 duration-500 focus-visible:outline-none"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                {badges
                  .filter((b) => b.category === destiny.id)
                  .map((badge) => {
                    const IconComponent = ICON_MAP[badge.icon_name] || Sparkles;

                    return (
                      <HoloBadge
                        key={badge.id}
                        title={badge.title}
                        description={badge.description}
                        icon={IconComponent}
                        rarity={badge.rarity as any}
                        isLocked={!badge.isUnlocked}
                        progress={badge.progress}
                        // En prod, retirer ce onClick ou le limiter aux admins
                        onClick={() => !badge.isUnlocked && handleDebugUnlock(badge.id)}
                      />
                    );
                  })}
              </div>

              {badges.filter((b) => b.category === destiny.id).length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted/10 flex items-center justify-center">
                    <destiny.icon className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground">Aucune destinée révélée pour le moment.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
