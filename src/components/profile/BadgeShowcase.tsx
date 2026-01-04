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

const rarityColors: Record<string, string> = {
  common: "from-slate-500 to-slate-700",
  rare: "from-blue-500 to-blue-700",
  epic: "from-purple-500 to-purple-700",
  legendary: "from-amber-400 to-orange-600",
  holographic: "from-pink-400 via-purple-400 to-cyan-400",
};

const rarityGlow: Record<string, string> = {
  common: "",
  rare: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
  epic: "shadow-[0_0_20px_rgba(168,85,247,0.4)]",
  legendary: "shadow-[0_0_25px_rgba(245,158,11,0.5)]",
  holographic: "shadow-[0_0_30px_rgba(236,72,153,0.5)]",
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
              
              return (
                <motion.button
                  key={badge.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectBadge(badge)}
                  className={cn(
                    "relative aspect-square rounded-xl p-3 flex flex-col items-center justify-center gap-2 border border-white/10 transition-all",
                    "bg-gradient-to-br",
                    rarityColors[rarity] || rarityColors.common,
                    rarityGlow[rarity] || ""
                  )}
                >
                  <Icon className="w-6 h-6 text-white" />
                  <span className="text-[10px] text-white/90 font-medium text-center leading-tight line-clamp-2">
                    {badge.badge.title}
                  </span>
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
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <div
                  className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center border border-white/20",
                    "bg-gradient-to-br",
                    rarityColors[rarity] || rarityColors.common,
                    rarityGlow[rarity] || ""
                  )}
                >
                  <Icon className="w-7 h-7 md:w-8 md:h-8 text-white drop-shadow-lg" />
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
