/**
 * PATCH BADGE - Style "Écusson brodé" Néo-Rétro
 * Remplace HoloBadge pour le thème Vidéo Club
 */

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { type Rarity, RARITY_CONFIG } from "@/data/videoClubData";

interface PatchBadgeProps {
  title: string;
  description: string;
  icon: React.ElementType;
  rarity?: Rarity;
  isLocked?: boolean;
  progress?: number;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

export function PatchBadge({
  title,
  description,
  icon: Icon,
  rarity = "common",
  isLocked = false,
  progress = 0,
  onClick,
  className,
  compact = false,
}: PatchBadgeProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative group cursor-pointer transition-all duration-300",
        isLocked && "cursor-not-allowed",
        className,
      )}
    >
      {/* Glow effect */}
      {!isLocked && (
        <div
          className={cn(
            "absolute -inset-1 rounded-2xl blur-md transition-opacity duration-300",
            isHovered ? "opacity-60" : "opacity-0",
          )}
          style={{ backgroundColor: rarityConfig.glowColor }}
        />
      )}

      {/* Main badge container - Patch style */}
      <div
        className={cn(
          "relative w-full aspect-square rounded-2xl overflow-hidden",
          "border-2 transition-all duration-300",
          "bg-gradient-to-br",
          isLocked
            ? "border-muted/20 from-muted/5 to-muted/10 grayscale"
            : rarityConfig.bgGradient,
          !isLocked && "hover:scale-105 hover:-rotate-2",
        )}
        style={{
          borderColor: isLocked ? undefined : rarityConfig.color,
        }}
      >
        {/* Stitching effect (couture brodée) */}
        <div
          className="absolute inset-2 rounded-xl border-2 border-dashed opacity-30"
          style={{ borderColor: isLocked ? "hsl(220 10% 30%)" : rarityConfig.color }}
        />

        {/* Content */}
        <div className={cn(
          "absolute inset-0 flex flex-col items-center justify-center text-center",
          compact ? "p-2" : "p-4"
        )}>
          {/* Icon */}
          <div
            className={cn(
              "relative rounded-full",
              compact ? "p-2 mb-1.5" : "p-3 mb-3",
              isLocked ? "bg-muted/10" : "bg-black/30",
            )}
          >
            {isLocked ? (
              <Lock className={cn(compact ? "w-5 h-5" : "w-8 h-8", "text-muted-foreground/50")} />
            ) : (
              <Icon
                className={compact ? "w-5 h-5" : "w-8 h-8"}
                style={{ color: rarityConfig.color }}
              />
            )}

            {/* Icon glow */}
            {!isLocked && isHovered && (
              <div
                className="absolute inset-0 rounded-full blur-lg opacity-50"
                style={{ backgroundColor: rarityConfig.color }}
              />
            )}
          </div>

          {/* Title */}
          <h3
            className={cn(
              "font-display font-bold uppercase tracking-wider leading-tight",
              compact ? "text-[10px] md:text-xs" : "text-base md:text-lg",
              isLocked ? "text-muted-foreground/50" : "text-foreground",
            )}
          >
            {title}
          </h3>

          {/* Description - hidden in compact */}
          {!compact && (
            <p
              className={cn(
                "text-xs md:text-sm mt-1.5 font-mono leading-tight",
                isLocked ? "text-muted-foreground/30" : "text-muted-foreground",
              )}
            >
              {description}
            </p>
          )}

          {/* Rarity label or progress */}
          <div className={compact ? "mt-1.5" : "mt-3"}>
            {isLocked ? (
              <div className={cn(compact ? "w-10 h-1" : "w-16 h-1.5", "bg-muted/20 rounded-full overflow-hidden")}>
                <div
                  className="h-full bg-videoclub-cyan/50 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : (
              <span
                className={cn(
                  "rounded-full font-mono font-bold uppercase tracking-widest",
                  "border bg-black/20",
                  compact ? "px-1.5 py-0.5 text-[7px]" : "px-2 py-0.5 text-[9px]",
                )}
                style={{
                  borderColor: `${rarityConfig.color}50`,
                  color: rarityConfig.color,
                }}
              >
                {rarityConfig.label}
              </span>
            )}
          </div>
        </div>

        {/* Texture overlay (simule le tissu) */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zM2 0h1v1H2zM4 0h1v1H4zM1 1h1v1H1zM3 1h1v1H3zM5 1h1v1H5zM0 2h1v1H0zM2 2h1v1H2zM4 2h1v1H4zM1 3h1v1H1zM3 3h1v1H3zM5 3h1v1H5zM0 4h1v1H0zM2 4h1v1H2zM4 4h1v1H4zM1 5h1v1H1zM3 5h1v1H3zM5 5h1v1H5z' fill='white' fill-opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: "4px 4px",
          }}
        />
      </div>
    </div>
  );
}
