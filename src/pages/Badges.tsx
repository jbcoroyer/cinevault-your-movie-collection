import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserBadgesStatus, debugUnlockBadge } from "@/services/badgeService";
import { DESTINIES } from "@/data/gameData";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { HoloBadge } from "@/components/gamification/HoloBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles } from "lucide-react";

export default function BadgesPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserBadgesStatus(user.id).then((data) => {
        setBadges(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background pb-24 selection:bg-primary/30">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-medium animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span>CineVault RPG</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Hall of Fame
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Tracez votre destinée cinématographique. Collectionnez des badges uniques et augmentez votre niveau de
            rareté.
          </p>
        </div>

        <Tabs defaultValue="auteur" className="w-full">
          <div className="flex justify-center mb-8 overflow-x-auto pb-4 scrollbar-hide">
            <TabsList className="bg-muted/50 p-1 h-auto rounded-full">
              {DESTINIES.map((destiny) => (
                <TabsTrigger
                  key={destiny.id}
                  value={destiny.id}
                  className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  <span className="mr-2">{<destiny.icon className="w-4 h-4 inline" />}</span>
                  {destiny.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {DESTINIES.map((destiny) => (
            <TabsContent
              key={destiny.id}
              value={destiny.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                {badges
                  .filter((b) => b.destinyId === destiny.id)
                  .map((badge) => (
                    <div key={badge.id} className="flex flex-col items-center">
                      <HoloBadge
                        title={badge.title}
                        description={badge.description}
                        icon={badge.icon}
                        rarity={badge.rarity}
                        isLocked={!badge.isUnlocked}
                        progress={badge.progress}
                        onClick={() => {
                          if (!badge.isUnlocked && user) {
                            // Demo feature: Click to simulate unlock
                            debugUnlockBadge(user.id, badge.id).then(() => {
                              window.location.reload();
                            });
                          }
                        }}
                      />
                      {/* Petit indicateur de progression sous la carte si verrouillé */}
                      {!badge.isUnlocked && (
                        <div className="mt-4 text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                          {badge.currentVal} / {badge.targetVal} requis
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {badges.filter((b) => b.destinyId === destiny.id).length === 0 && (
                <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-white/5">
                  <p className="text-muted-foreground">Aucun badge disponible dans cette destinée pour le moment.</p>
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
