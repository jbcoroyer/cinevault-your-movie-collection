/**
 * CINEVAULT MEMBER CARD - Carte de membre premium personnalisable
 * avec cadres, titres et effets holographiques
 */

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Crown, Zap, Film, Sparkles, Star } from "lucide-react";
import { getXpProgress, getTitleForLevel } from "@/data/videoClubData";
import { motion } from "framer-motion";

interface UserReward {
  reward_type: string;
  reward_id: string;
  reward_name: string;
  reward_data: any;
  is_equipped: boolean;
}

interface CinevaultMemberCardProps {
  username: string;
  avatarUrl?: string;
  totalXp: number;
  movieCount: number;
  joinDate?: string;
  equippedTitle?: string | null;
  equippedFrame?: string | null;
  equippedTheme?: string | null;
  userRewards?: UserReward[];
  className?: string;
}

// Frames disponibles
const FRAME_STYLES: Record<string, { border: string; glow: string; animation?: string }> = {
  default: { border: "border-videoclub-cyan/50", glow: "" },
  frame_gold: { 
    border: "border-yellow-500", 
    glow: "shadow-[0_0_20px_rgba(234,179,8,0.5)]",
  },
  frame_neon: { 
    border: "border-fuchsia-500", 
    glow: "shadow-[0_0_25px_rgba(217,70,239,0.6)]",
    animation: "animate-pulse",
  },
  frame_vhs: { 
    border: "border-cyan-400 border-4", 
    glow: "shadow-[0_0_30px_rgba(34,211,238,0.4)]",
  },
  frame_film: { 
    border: "border-zinc-700 border-[6px]", 
    glow: "",
  },
};

// Themes disponibles
const THEME_STYLES: Record<string, { bg: string; accent: string }> = {
  default: { 
    bg: "bg-gradient-to-br from-videoclub-bg via-videoclub-surface to-videoclub-bg", 
    accent: "text-videoclub-cyan" 
  },
  theme_midnight: { 
    bg: "bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23]", 
    accent: "text-rose-500" 
  },
  theme_retro: { 
    bg: "bg-gradient-to-br from-[#2d132c] via-[#4a1942] to-[#1a0a1a]", 
    accent: "text-pink-400" 
  },
  theme_neon: { 
    bg: "bg-gradient-to-br from-[#0d0d0d] via-[#1a1a2e] to-[#0d0d0d]", 
    accent: "text-cyan-400" 
  },
  theme_golden: { 
    bg: "bg-gradient-to-br from-[#1c1c1c] via-[#2a2a2a] to-[#1c1c1c]", 
    accent: "text-yellow-500" 
  },
};

export function CinevaultMemberCard({
  username,
  avatarUrl,
  totalXp,
  movieCount,
  joinDate,
  equippedTitle,
  equippedFrame,
  equippedTheme,
  userRewards = [],
  className,
}: CinevaultMemberCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const { currentLevel, progressPercent, xpToNextLevel } = getXpProgress(totalXp);
  const defaultTitle = getTitleForLevel(currentLevel);

  // Get equipped rewards
  const equippedTitleReward = userRewards.find(r => r.reward_type === 'title' && r.is_equipped);
  const displayTitle = equippedTitleReward?.reward_name || equippedTitle || defaultTitle;
  const titleColor = equippedTitleReward?.reward_data?.color;

  const frameStyle = FRAME_STYLES[equippedFrame || 'default'] || FRAME_STYLES.default;
  const themeStyle = THEME_STYLES[equippedTheme || 'default'] || THEME_STYLES.default;

  // Check for special effects
  const hasHolographic = equippedFrame === 'frame_neon' || equippedFrame === 'frame_vhs';
  const hasGoldEffect = equippedFrame === 'frame_gold' || equippedTheme === 'theme_golden';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  // Calculate holographic gradient position
  const holoGradient = useMemo(() => {
    if (!hasHolographic) return '';
    const angle = mousePosition.x * 360;
    return `linear-gradient(${angle}deg, 
      rgba(255,0,128,0.3) 0%, 
      rgba(0,255,255,0.3) 25%, 
      rgba(255,255,0,0.3) 50%, 
      rgba(128,0,255,0.3) 75%, 
      rgba(255,0,128,0.3) 100%)`;
  }, [mousePosition.x, hasHolographic]);

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl cursor-pointer select-none",
        themeStyle.bg,
        frameStyle.border,
        frameStyle.glow,
        frameStyle.animation,
        "border-2 transition-all duration-300",
        isHovering && "scale-[1.02]",
        className,
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{ perspective: "1000px" }}
      animate={{
        rotateX: isHovering ? (mousePosition.y - 0.5) * -10 : 0,
        rotateY: isHovering ? (mousePosition.x - 0.5) * 10 : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Holographic overlay */}
      {hasHolographic && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 mix-blend-overlay opacity-60 transition-opacity"
          style={{ background: holoGradient }}
        />
      )}

      {/* Gold shimmer effect */}
      {hasGoldEffect && isHovering && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)",
          }}
        />
      )}

      {/* Scanlines effect */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
          }}
        />
      </div>

      {/* Header glow bar */}
      <div className={cn(
        "h-1.5",
        hasGoldEffect 
          ? "bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"
          : "bg-gradient-to-r from-videoclub-cyan via-videoclub-magenta to-videoclub-cyan"
      )} />

      <div className="p-6 relative z-20">
        {/* Top row: Logo + Member ID */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Film className={cn("w-5 h-5", themeStyle.accent)} />
            <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
              CineVault Club
            </span>
            {hasHolographic && (
              <Sparkles className="w-4 h-4 text-fuchsia-400 animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasGoldEffect && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
            <span className="font-mono text-[10px] text-muted-foreground">
              #{joinDate ? new Date(joinDate).getFullYear() : "2024"}
            </span>
          </div>
        </div>

        {/* Avatar + Info */}
        <div className="flex items-start gap-4">
          {/* Avatar with frame */}
          <div className="relative">
            <div
              className={cn(
                "w-20 h-20 rounded-xl overflow-hidden",
                frameStyle.border,
                frameStyle.glow,
              )}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={cn("w-full h-full bg-videoclub-surface flex items-center justify-center", themeStyle.bg)}>
                  <span className={cn("text-3xl font-display font-bold", themeStyle.accent)}>
                    {username?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>
            
            {/* Level badge */}
            <div className={cn(
              "absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center",
              "bg-videoclub-bg border-2",
              hasGoldEffect ? "border-yellow-500" : "border-videoclub-magenta"
            )}>
              <span className={cn(
                "text-sm font-mono font-bold",
                hasGoldEffect ? "text-yellow-500" : "text-videoclub-magenta"
              )}>
                {currentLevel}
              </span>
            </div>
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-xl text-foreground truncate">
              {username}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Crown className={cn("w-4 h-4", titleColor ? "" : "text-videoclub-gold")} style={titleColor ? { color: titleColor } : {}} />
              <span 
                className={cn("text-sm font-mono font-semibold", !titleColor && "text-videoclub-gold")}
                style={titleColor ? { color: titleColor } : {}}
              >
                {displayTitle}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Film className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground">
                  {movieCount} films
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <Zap className={cn("w-4 h-4", hasGoldEffect ? "text-yellow-500" : "text-videoclub-magenta")} />
              <span className="text-sm font-mono text-muted-foreground">
                {totalXp.toLocaleString()} XP
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {xpToNextLevel.toLocaleString()} → Niv. {currentLevel + 1}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 bg-videoclub-surface/50 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className={cn(
                "h-full rounded-full",
                hasGoldEffect 
                  ? "bg-gradient-to-r from-yellow-600 to-yellow-400"
                  : "bg-gradient-to-r from-videoclub-cyan to-videoclub-magenta"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Bottom barcode effect */}
      <div className="h-10 px-6 pb-4 flex items-end gap-0.5">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-t-sm",
              hasGoldEffect ? "bg-yellow-500/30" : "bg-videoclub-cyan/30"
            )}
            style={{ height: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      {/* Membership badge */}
      <div className="absolute top-4 right-4">
        <div className={cn(
          "px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider",
          hasGoldEffect 
            ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
            : "bg-videoclub-cyan/20 text-videoclub-cyan border border-videoclub-cyan/30"
        )}>
          {currentLevel >= 10 ? "VIP" : currentLevel >= 5 ? "Pro" : "Member"}
        </div>
      </div>
    </motion.div>
  );
}
