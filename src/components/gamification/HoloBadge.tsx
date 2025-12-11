import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Lock, Sparkles, Trophy } from "lucide-react";

export type BadgeRarity = "common" | "rare" | "epic" | "legendary" | "holographic";

interface HoloBadgeProps {
  title: string;
  description: string;
  icon: React.ElementType;
  rarity?: BadgeRarity;
  isLocked?: boolean;
  progress?: number; // 0 à 100
  onClick?: () => void;
  className?: string;
  currentVal?: number;
  targetVal?: number;
}

const rarityStyles: Record<BadgeRarity, string> = {
  common: "border-slate-700 bg-slate-900/50 text-slate-400",
  rare: "border-blue-500/50 bg-blue-950/30 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.3)]",
  epic: "border-purple-500/50 bg-purple-950/30 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.4)]",
  legendary: "border-amber-500/50 bg-amber-950/30 text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.5)]",
  holographic: "border-white/50 bg-black/40 text-white shadow-[0_0_30px_rgba(255,255,255,0.2)]",
};

export const HoloBadge = ({
  title,
  description,
  icon: Icon,
  rarity = "common",
  isLocked = false,
  progress = 100,
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
    
    // Calcul de la rotation (max +/- 15deg)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    setRotation({ x: rotateX, y: rotateY });
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      className={cn(
        "relative w-full aspect-[3/4] perspective-1000",
        className
      )}
      onClick={onClick}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "w-full h-full rounded-xl border-2 transition-all duration-200 ease-out transform-style-3d overflow-hidden",
          "flex flex-col items-center justify-center p-4 text-center select-none cursor-pointer",
          isLocked ? "bg-muted/20 border-white/5 grayscale opacity-70" : rarityStyles[rarity]
        )}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${glare.opacity > 0 ? 1.05 : 1})`,
        }}
      >
        {/* Effet Holographique (Foil) */}
        {!isLocked && (rarity === "legendary" || rarity === "holographic") && (
          <div
            className="absolute inset-0 z-0 opacity-50 pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage: `linear-gradient(115deg, transparent 20%, ${
                rarity === "holographic" 
                  ? "rgba(255,0,150,0.5) 40%, rgba(0,255,255,0.5) 60%" 
                  : "rgba(255,215,0,0.3) 40%, rgba(255,160,0,0.3) 60%"
              }, transparent 80%)`,
              backgroundSize: "200% 200%",
              backgroundPosition: `${glare.x}% ${glare.y}%`,
            }}
          />
        )}

        {/* Glare Effect (Reflet Blanc) */}
        {!isLocked && (
          <div
            className="absolute inset-0 z-10 pointer-events-none mix-blend-soft-light"
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.8) 0%, transparent 60%)`,
              opacity: glare.opacity * 0.4,
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-20 transform-style-3d translate-z-10 flex flex-col items-center gap-3">
          <div className={cn(
            "p-3 rounded-full shadow-inner",
            isLocked ? "bg-white/5" : "bg-white/10 backdrop-blur-sm"
          )}>
            {isLocked ? (
              <Lock className="w-8 h-8 text-muted-foreground" />
            ) : (
              <Icon className="w-10 h-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            )}
          </div>

          <div>
            <h3 className={cn(
              "font-display font-bold uppercase tracking-wider text-sm",
              !isLocked && "drop-shadow-md"
            )}>
              {title}
            </h3>
            <p className="text-[10px] opacity-80 mt-1 line-clamp-2 leading-tight px-1">
              {description}
            </p>
          </div>

          {/* Rarity Badge */}
          {!isLocked && (
            <div className={cn(
              "mt-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border",
              rarity === 'common' && "border-slate-500 bg-slate-800 text-slate-400",
              rarity === 'rare' && "border-blue-400 bg-blue-900 text-blue-300",
              rarity === 'epic' && "border-purple-400 bg-purple-900 text-purple-300",
              rarity === 'legendary' && "border-amber-400 bg-amber-900 text-amber-300 animate-pulse",
              rarity === 'holographic' && "border-white bg-black text-white animate-pulse"
            )}>
              {rarity}
            </div>
          )}

          {/* Progress Bar (Locked state) */}
          {isLocked && progress < 100 && (
            <div className="w-full mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/30 transition-all duration-500"
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
