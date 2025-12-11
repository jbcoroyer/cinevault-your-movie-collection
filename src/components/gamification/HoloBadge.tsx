import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export type BadgeRarity = "common" | "rare" | "epic" | "legendary" | "holographic";

interface HoloBadgeProps {
  title: string;
  description: string;
  icon: React.ElementType;
  rarity?: string;
  isLocked?: boolean;
  progress?: number;
  onClick?: () => void;
  className?: string;
}

const rarityStyles: Record<string, string> = {
  common: "border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 text-slate-300",
  rare: "border-blue-500/50 bg-gradient-to-br from-blue-900/50 to-slate-900 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
  epic: "border-purple-500/50 bg-gradient-to-br from-purple-900/50 to-slate-900 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.3)]",
  legendary:
    "border-amber-500/50 bg-gradient-to-br from-amber-900/50 to-slate-900 text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.4)]",
  holographic: "border-white/40 bg-black text-white shadow-[0_0_30px_rgba(255,255,255,0.25)]",
};

export const HoloBadge = ({
  title,
  description,
  icon: Icon,
  rarity = "common",
  isLocked = false,
  progress = 0,
  onClick,
  className,
}: HoloBadgeProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isLocked) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Rotation inversée pour effet de profondeur
    const rotateX = ((y - centerY) / centerY) * -20;
    const rotateY = ((x - centerX) / centerX) * 20;

    setRotation({ x: rotateX, y: rotateY });
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  const safeRarity = rarityStyles[rarity] ? rarity : rarityStyles.common;

  return (
    <div className={cn("relative group perspective-1000", className)} onClick={onClick}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "relative w-full aspect-[3/4] rounded-xl border transition-all duration-200 ease-out transform-style-3d overflow-hidden select-none",
          isLocked
            ? "bg-muted/10 border-white/5 grayscale opacity-60 cursor-not-allowed"
            : `${safeRarity} cursor-pointer hover:scale-105 hover:z-10`,
        )}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* Holographic Foil Layer */}
        {!isLocked && (rarity === "legendary" || rarity === "holographic") && (
          <div
            className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-color-dodge"
            style={{
              backgroundImage: `linear-gradient(115deg, transparent 20%, rgba(255,0,180,0.5) 45%, rgba(0,255,255,0.5) 55%, transparent 80%)`,
              backgroundSize: "250% 250%",
              backgroundPosition: `${glare.x}% ${glare.y}%`,
            }}
          />
        )}

        {/* Glare/Reflection */}
        {!isLocked && (
          <div
            className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay"
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.9) 0%, transparent 60%)`,
              opacity: glare.opacity * 0.6,
            }}
          />
        )}

        {/* Content Layer (Floating) */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-4 py-8 transform-style-3d translate-z-10">
          {/* Top Badge Icon */}
          <div
            className={cn(
              "p-4 rounded-full shadow-lg transform translate-z-20",
              isLocked
                ? "bg-white/5"
                : "bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-md border border-white/10",
            )}
          >
            {isLocked ? (
              <Lock className="w-8 h-8 text-muted-foreground/50" />
            ) : (
              <Icon className="w-10 h-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" />
            )}
          </div>

          {/* Text Info */}
          <div className="text-center space-y-2 transform translate-z-10 w-full">
            <h3
              className={cn(
                "font-display font-bold uppercase tracking-widest text-sm leading-tight",
                !isLocked && "drop-shadow-md text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70",
              )}
            >
              {title}
            </h3>
            <p className="text-[10px] md:text-xs font-medium opacity-70 leading-relaxed px-1">{description}</p>
          </div>

          {/* Footer / Rarity Label */}
          <div className="transform translate-z-10">
            {!isLocked ? (
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border border-white/20 bg-black/20 backdrop-blur-sm",
                  rarity === "holographic" && "animate-pulse border-white/50",
                )}
              >
                {rarity}
              </span>
            ) : (
              /* Progress Bar if locked */
              <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-white/40" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
