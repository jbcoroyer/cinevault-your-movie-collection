/**
 * CineVault - Badge Showcase Component
 * 
 * Vitrine à badges - Affiche les 3 badges sélectionnés par l'utilisateur sur son profil
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Award, Plus, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import * as LucideIcons from "lucide-react";

interface Badge {
  id: string;
  badge_id: string;
  rarity: string | null;
  unlocked_at: string | null;
  badge: {
    id: string;
    title: string;
    description: string;
    icon_name: string;
    category: string;
    xp_reward: number | null;
  };
}

interface ShowcaseBadge {
  id: string;
  user_id: string;
  badge_id: string;
  slot: number;
  created_at: string;
}

interface BadgeShowcaseProps {
  userId: string;
  isEditable?: boolean;
  maxSlots?: number;
}

// Metallic color schemes matching the HoloBadge component
const rarityMetals: Record<string, {
  primary: string;
  secondary: string;
  glow: string;
  iconBg: string;
}> = {
  common: {
    primary: "from-zinc-400 via-zinc-300 to-zinc-500",
    secondary: "from-zinc-600 to-zinc-700",
    glow: "",
    iconBg: "from-zinc-500 to-zinc-600",
  },
  rare: {
    primary: "from-blue-400 via-sky-300 to-blue-500",
    secondary: "from-blue-700 to-blue-900",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]",
    iconBg: "from-blue-500 to-blue-700",
  },
  epic: {
    primary: "from-purple-400 via-fuchsia-300 to-purple-500",
    secondary: "from-purple-800 to-purple-950",
    glow: "shadow-[0_0_25px_rgba(168,85,247,0.5)]",
    iconBg: "from-purple-500 to-purple-700",
  },
  legendary: {
    primary: "from-amber-300 via-yellow-200 to-amber-400",
    secondary: "from-amber-700 to-amber-900",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.6)]",
    iconBg: "from-amber-500 to-orange-600",
  },
  holographic: {
    primary: "from-pink-300 via-purple-300 to-cyan-300",
    secondary: "from-violet-900 to-slate-950",
    glow: "shadow-[0_0_35px_rgba(236,72,153,0.5)]",
    iconBg: "from-violet-500 to-fuchsia-600",
  },
};

export function BadgeShowcase({ userId, isEditable = false, maxSlots = 3 }: BadgeShowcaseProps) {
  const [showcaseBadges, setShowcaseBadges] = useState<(Badge | null)[]>(Array(maxSlots).fill(null));
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const isMobile = useIsMobile();

  // Fetch user's badges and showcase selection
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch all user badges
      const { data: userBadges, error: badgesError } = await supabase
        .from("user_badges")
        .select(`
          id,
          badge_id,
          rarity,
          unlocked_at,
          badge:badge_definitions (
            id,
            title,
            description,
            icon_name,
            category,
            xp_reward
          )
        `)
        .eq("user_id", userId);

      if (badgesError) {
        console.error("Error fetching badges:", badgesError);
        setLoading(false);
        return;
      }

      // Filter badges that have badge definition
      const validBadges = (userBadges || []).filter(b => b.badge) as Badge[];
      setAllBadges(validBadges);

      // Fetch showcase selection
      let showcaseData: ShowcaseBadge[] = [];
      try {
        const { data, error } = await supabase
          .from('badge_showcase' as any)
          .select('*')
          .eq('user_id', userId)
          .order('slot', { ascending: true });
        
        if (!error && data) {
          showcaseData = data as unknown as ShowcaseBadge[];
        }
      } catch (e) {
        // Table might not exist yet
      }

      // Map showcase badges to slots
      const slots = Array(maxSlots).fill(null);
      showcaseData.forEach((item: ShowcaseBadge) => {
        const badge = validBadges.find(b => b.badge_id === item.badge_id);
        if (badge && item.slot >= 0 && item.slot < maxSlots) {
          slots[item.slot] = badge;
        }
      });
      
      setShowcaseBadges(slots);
      setLoading(false);
    };

    fetchData();
  }, [userId, maxSlots]);

  const handleSelectBadge = async (badge: Badge) => {
    if (selectedSlot === null) return;

    try {
      // Remove existing badge from this slot
      await supabase
        .from('badge_showcase' as any)
        .delete()
        .eq('user_id', userId)
        .eq('slot', selectedSlot);

      // Insert new selection
      const { error } = await supabase
        .from('badge_showcase' as any)
        .insert({
          user_id: userId,
          badge_id: badge.badge_id,
          slot: selectedSlot,
        });

      if (error) throw error;

      // Update local state
      const newShowcase = [...showcaseBadges];
      newShowcase[selectedSlot] = badge;
      setShowcaseBadges(newShowcase);

      setIsSelectOpen(false);
      setSelectedSlot(null);
      toast({ title: "Badge ajouté à la vitrine" });
    } catch (error) {
      console.error("Error updating showcase:", error);
      toast({ title: "Erreur", description: "Impossible de mettre à jour la vitrine", variant: "destructive" });
    }
  };

  const handleRemoveBadge = async (slot: number) => {
    try {
      await supabase
        .from('badge_showcase' as any)
        .delete()
        .eq('user_id', userId)
        .eq('slot', slot);

      const newShowcase = [...showcaseBadges];
      newShowcase[slot] = null;
      setShowcaseBadges(newShowcase);

      toast({ title: "Badge retiré de la vitrine" });
    } catch (error) {
      console.error("Error removing badge:", error);
    }
  };

  const openSelectDialog = (slot: number) => {
    setSelectedSlot(slot);
    setIsSelectOpen(true);
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || Award;
    return Icon;
  };

  // Don't show if no badges to display and not editable
  if (!loading && allBadges.length === 0 && !isEditable) {
    return null;
  }

  // Selection content for dialog/sheet
  const SelectionContent = () => {
    const availableBadges = allBadges.filter(
      badge => !showcaseBadges.some(s => s?.badge_id === badge.badge_id)
    );

    return (
      <div className="space-y-4">
        {availableBadges.length === 0 ? (
          <p className="text-center text-white/50 py-8">
            Tous vos badges sont déjà dans la vitrine
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {availableBadges.map((badge) => {
              const Icon = getIconComponent(badge.badge.icon_name);
              const rarity = badge.rarity || "common";
              const metal = rarityMetals[rarity] || rarityMetals.common;
              
              return (
                <motion.button
                  key={badge.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectBadge(badge)}
                  className="relative aspect-square rounded-xl overflow-hidden"
                >
                  {/* Metallic border */}
                  <div className={cn(
                    "absolute inset-0 rounded-xl p-[2px] bg-gradient-to-br",
                    metal.primary,
                    metal.glow,
                  )} style={{ '--tw-gradient-stops': undefined } as any}>
                    <div className={cn(
                      "absolute inset-0 rounded-xl bg-gradient-to-br",
                      metal.primary,
                    )} />
                  </div>
                  {/* Inner badge */}
                  <div className={cn(
                    "absolute inset-[2px] rounded-lg bg-gradient-to-br flex flex-col items-center justify-center gap-1",
                    metal.secondary,
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br",
                      metal.iconBg,
                    )}>
                      <Icon className="w-4 h-4 text-white drop-shadow-md" />
                    </div>
                    <span className="text-[8px] text-white/90 font-medium text-center leading-tight line-clamp-2 px-1">
                      {badge.badge.title}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Vitrine à Badges
        </h3>
      </div>

      <div className="flex gap-3 justify-center">
        {Array(maxSlots).fill(null).map((_, index) => {
          const badge = showcaseBadges[index];
          
          if (badge) {
            const Icon = getIconComponent(badge.badge.icon_name);
            const rarity = badge.rarity || "common";
            const metal = rarityMetals[rarity] || rarityMetals.common;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                {/* Metallic pin badge */}
                <div className={cn(
                  "relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden",
                  metal.glow,
                )}>
                  {/* Metallic border */}
                  <div className={cn(
                    "absolute inset-0 rounded-xl p-[2px] bg-gradient-to-br",
                    metal.primary,
                  )} />
                  {/* Inner bevel */}
                  <div className="absolute inset-[2px] rounded-lg bg-gradient-to-br from-white/20 via-transparent to-black/30" />
                  {/* Badge body */}
                  <div className={cn(
                    "absolute inset-[3px] rounded-lg bg-gradient-to-br flex items-center justify-center",
                    metal.secondary,
                  )}>
                    {/* Icon container */}
                    <div className={cn(
                      "w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center bg-gradient-to-br",
                      metal.iconBg,
                    )}>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-md relative z-10" />
                    </div>
                  </div>
                  {/* Edge highlight */}
                  <div className="absolute inset-0 rounded-xl pointer-events-none" style={{
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)",
                  }} />
                </div>
                
                {isEditable && (
                  <button
                    onClick={() => handleRemoveBadge(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
                
                <p className="text-[10px] text-white/60 text-center mt-1 truncate max-w-[64px] md:max-w-[80px]">
                  {badge.badge.title}
                </p>
              </motion.div>
            );
          }

          // Empty slot
          return (
            <motion.button
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => isEditable && allBadges.length > 0 && openSelectDialog(index)}
              disabled={!isEditable || allBadges.length === 0}
              className={cn(
                "w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center",
                isEditable && allBadges.length > 0 ? "hover:border-white/30 cursor-pointer" : "opacity-50"
              )}
            >
              {isEditable ? (
                <Plus className="w-5 h-5 text-white/30" />
              ) : (
                <Award className="w-5 h-5 text-white/10" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selection Dialog/Sheet */}
      {isMobile ? (
        <Sheet open={isSelectOpen} onOpenChange={setIsSelectOpen}>
          <SheetContent side="bottom" className="bg-background border-white/10">
            <SheetHeader>
              <SheetTitle className="text-white">Choisir un badge</SheetTitle>
            </SheetHeader>
            <div className="mt-4 pb-8">
              <SelectionContent />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isSelectOpen} onOpenChange={setIsSelectOpen}>
          <DialogContent className="bg-background border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Choisir un badge</DialogTitle>
            </DialogHeader>
            <SelectionContent />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
