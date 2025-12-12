/**
 * MEMBER CARD - Carte de Membre Vidéo Club
 * Design Néo-Rétro avec effets néon
 */

import { cn } from "@/lib/utils";
import { Crown, Zap, Film } from "lucide-react";
import { getXpProgress, getTitleForLevel } from "@/data/videoClubData";

interface MemberCardProps {
  username: string;
  avatarUrl?: string;
  totalXp: number;
  movieCount: number;
  joinDate?: string;
  className?: string;
}

export function MemberCard({
  username,
  avatarUrl,
  totalXp,
  movieCount,
  joinDate,
  className,
}: MemberCardProps) {
  const { currentLevel, progressPercent, xpToNextLevel } = getXpProgress(totalXp);
  const title = getTitleForLevel(currentLevel);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-videoclub-bg via-videoclub-surface to-videoclub-bg",
        "border border-videoclub-cyan/30",
        "shadow-[0_0_40px_rgba(6,182,212,0.15)]",
        className,
      )}
    >
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
      <div className="h-1 bg-gradient-to-r from-videoclub-cyan via-videoclub-magenta to-videoclub-cyan" />

      <div className="p-6">
        {/* Top row: Logo + Member ID */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-videoclub-cyan" />
            <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
              CineVault Club
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {joinDate ? new Date(joinDate).getFullYear() : "2024"}
          </span>
        </div>

        {/* Avatar + Info */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-16 h-16 rounded-xl overflow-hidden border-2 border-videoclub-cyan/50"
              style={{
                boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)",
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-videoclub-surface flex items-center justify-center">
                  <span className="text-2xl font-display font-bold text-videoclub-cyan">
                    {username?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>
            {/* Level badge */}
            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-videoclub-bg border-2 border-videoclub-magenta flex items-center justify-center">
              <span className="text-xs font-mono font-bold text-videoclub-magenta">
                {currentLevel}
              </span>
            </div>
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-lg text-foreground truncate">
              {username}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Crown className="w-3.5 h-3.5 text-videoclub-gold" />
              <span className="text-sm font-mono text-videoclub-gold">
                {title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Film className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">
                {movieCount} films
              </span>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-videoclub-magenta" />
              <span className="text-xs font-mono text-muted-foreground">
                {totalXp.toLocaleString()} XP
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {xpToNextLevel.toLocaleString()} pour niv. {currentLevel + 1}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-videoclub-surface rounded-full overflow-hidden border border-videoclub-cyan/20">
            <div
              className="h-full bg-gradient-to-r from-videoclub-cyan to-videoclub-magenta rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom barcode effect */}
      <div className="h-8 px-6 pb-3 flex items-end gap-0.5">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-videoclub-cyan/30"
            style={{ height: `${Math.random() * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}
