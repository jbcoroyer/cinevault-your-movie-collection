import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

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

// Metallic color schemes for each rarity - inspired by Pokémon gym badges
const rarityMetals: Record<string, {
  primary: string;
  secondary: string;
  border: string;
  glow: string;
  iconBg: string;
  shimmer: string;
}> = {
  common: {
    primary: "from-zinc-400 via-zinc-300 to-zinc-500",
    secondary: "from-zinc-600 to-zinc-700",
    border: "from-zinc-300 via-zinc-500 to-zinc-400",
    glow: "",
    iconBg: "from-zinc-500 to-zinc-600",
    shimmer: "rgba(161, 161, 170, 0.3)",
  },
  rare: {
    primary: "from-blue-400 via-sky-300 to-blue-500",
    secondary: "from-blue-700 to-blue-900",
    border: "from-blue-300 via-cyan-400 to-blue-400",
    glow: "shadow-[0_0_25px_rgba(59,130,246,0.4)]",
    iconBg: "from-blue-500 to-blue-700",
    shimmer: "rgba(59, 130, 246, 0.5)",
  },
  epic: {
    primary: "from-purple-400 via-fuchsia-300 to-purple-500",
    secondary: "from-purple-800 to-purple-950",
    border: "from-purple-300 via-pink-400 to-purple-400",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.5)]",
    iconBg: "from-purple-500 to-purple-700",
    shimmer: "rgba(168, 85, 247, 0.5)",
  },
  legendary: {
    primary: "from-amber-300 via-yellow-200 to-amber-400",
    secondary: "from-amber-700 to-amber-900",
    border: "from-yellow-300 via-amber-400 to-orange-400",
    glow: "shadow-[0_0_35px_rgba(245,158,11,0.6)]",
    iconBg: "from-amber-500 to-orange-600",
    shimmer: "rgba(245, 158, 11, 0.6)",
  },
  holographic: {
    primary: "from-pink-300 via-purple-300 to-cyan-300",
    secondary: "from-violet-900 to-slate-950",
    border: "from-pink-400 via-purple-500 to-cyan-400",
    glow: "shadow-[0_0_40px_rgba(236,72,153,0.5)]",
    iconBg: "from-violet-500 to-fuchsia-600",
    shimmer: "rgba(236, 72, 153, 0.6)",
  },
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

    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    setRotation({ x: rotateX, y: rotateY });
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  const metal = rarityMetals[rarity] || rarityMetals.common;

  return (
    <div className={cn("relative group", className)} onClick={onClick} style={{ perspective: "1000px" }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "relative w-full aspect-[3/4] transition-all duration-300 ease-out select-none",
          isLocked ? "cursor-not-allowed" : "cursor-pointer",
        )}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: "preserve-3d",
        }}
        whileHover={!isLocked ? { scale: 1.05 } : undefined}
      >
        {/* Outer metallic ring/border - the "pin" frame */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl p-[3px]",
            isLocked ? "opacity-40" : metal.glow,
          )}
          style={{
            background: isLocked 
              ? "linear-gradient(135deg, #3f3f46 0%, #27272a 50%, #3f3f46 100%)"
              : `linear-gradient(135deg, var(--tw-gradient-stops))`,
          }}
        >
          <div className={cn(
            "absolute inset-0 rounded-2xl bg-gradient-to-br",
            isLocked ? "from-zinc-600 via-zinc-500 to-zinc-600" : metal.border,
          )} />
          
          {/* Inner metallic bevel for depth */}
          <div className="absolute inset-[3px] rounded-xl bg-gradient-to-br from-white/30 via-transparent to-black/30" />
        </div>

        {/* Main badge body */}
        <div
          className={cn(
            "absolute inset-[4px] rounded-xl overflow-hidden",
            isLocked ? "bg-zinc-900" : "",
          )}
          style={{
            background: isLocked 
              ? "linear-gradient(180deg, #18181b 0%, #09090b 100%)"
              : `linear-gradient(180deg, var(--tw-gradient-stops))`,
          }}
        >
          <div className={cn(
            "absolute inset-0 bg-gradient-to-b",
            isLocked ? "from-zinc-800 to-zinc-950" : metal.secondary,
          )} />

          {/* Enamel-like inner surface with shine */}
          <div className="absolute inset-[6px] rounded-lg overflow-hidden">
            {/* Base enamel color */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br",
              isLocked ? "from-zinc-800/80 to-zinc-900/80" : metal.secondary,
            )} />

            {/* Top highlight for convex effect */}
            <div 
              className="absolute inset-0 opacity-60"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 40%, rgba(0,0,0,0.2) 100%)",
              }}
            />

            {/* Shimmer effect on hover */}
            {!isLocked && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${metal.shimmer} 0%, transparent 50%)`,
                  opacity: glare.opacity * 0.8,
                }}
              />
            )}

            {/* Rainbow holographic effect for legendary/holographic */}
            {!isLocked && (rarity === "legendary" || rarity === "holographic") && (
              <motion.div
                className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-30"
                style={{
                  backgroundImage: `linear-gradient(${45 + glare.x * 0.5}deg, 
                    transparent 20%, 
                    rgba(255,0,100,0.4) 35%, 
                    rgba(255,200,0,0.4) 45%, 
                    rgba(0,255,200,0.4) 55%, 
                    rgba(100,0,255,0.4) 65%, 
                    transparent 80%)`,
                  backgroundSize: "200% 200%",
                  backgroundPosition: `${glare.x}% ${glare.y}%`,
                }}
              />
            )}
          </div>
        </div>

        {/* Central emblem/icon container - raised "jewel" effect */}
        <div 
          className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2"
          style={{ transform: `translateX(-50%) translateY(-50%) translateZ(20px)` }}
        >
          {/* Outer metallic ring for icon */}
          <div 
            className={cn(
              "relative w-14 h-14 md:w-16 md:h-16 rounded-full p-[2px]",
              isLocked ? "" : metal.glow,
            )}
          >
            <div className={cn(
              "absolute inset-0 rounded-full bg-gradient-to-br",
              isLocked ? "from-zinc-500 to-zinc-700" : metal.primary,
            )} />
            
            {/* Inner bevel */}
            <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-white/40 via-transparent to-black/40" />
            
            {/* Icon background */}
            <div 
              className={cn(
                "absolute inset-[3px] rounded-full flex items-center justify-center bg-gradient-to-br",
                isLocked ? "from-zinc-700 to-zinc-900" : metal.iconBg,
              )}
            >
              {/* Inner shine */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)",
                }}
              />
              
              {isLocked ? (
                <Lock className="w-6 h-6 md:w-7 md:h-7 text-zinc-500 relative z-10" />
              ) : (
                <Icon className="w-6 h-6 md:w-7 md:h-7 text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
              )}
            </div>
          </div>
        </div>

        {/* Content overlay */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-end pb-4 px-3"
          style={{ transform: "translateZ(10px)" }}
        >
          {/* Title plate - embossed metal look */}
          <div className="w-full">
            <div 
              className={cn(
                "relative px-2 py-1.5 rounded-md mx-auto max-w-[90%]",
                isLocked ? "bg-zinc-800/80" : "bg-black/40 backdrop-blur-sm",
              )}
            >
              {/* Metallic edge effect */}
              <div 
                className={cn(
                  "absolute inset-0 rounded-md border",
                  isLocked ? "border-zinc-700" : "border-white/10",
                )}
                style={{
                  boxShadow: isLocked ? "none" : "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)",
                }}
              />
              
              <h3
                className={cn(
                  "font-display font-bold uppercase tracking-wider text-[10px] md:text-xs text-center leading-tight relative z-10",
                  isLocked ? "text-zinc-500" : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]",
                )}
              >
                {title}
              </h3>
            </div>
            
            <p 
              className={cn(
                "text-[8px] md:text-[9px] text-center mt-1.5 leading-tight line-clamp-2 px-1",
                isLocked ? "text-zinc-600" : "text-white/60",
              )}
            >
              {description}
            </p>
          </div>

          {/* Rarity indicator / Progress bar */}
          <div className="mt-2">
            {!isLocked ? (
              <div 
                className={cn(
                  "px-2 py-0.5 rounded-full text-[7px] md:text-[8px] font-bold uppercase tracking-[0.15em] border",
                  rarity === "common" && "border-zinc-500/50 bg-zinc-800/80 text-zinc-400",
                  rarity === "rare" && "border-blue-400/50 bg-blue-950/80 text-blue-300",
                  rarity === "epic" && "border-purple-400/50 bg-purple-950/80 text-purple-300",
                  rarity === "legendary" && "border-amber-400/50 bg-amber-950/80 text-amber-300 animate-pulse",
                  rarity === "holographic" && "border-pink-400/50 bg-gradient-to-r from-pink-950/80 to-cyan-950/80 text-pink-300 animate-pulse",
                )}
              >
                {rarity}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-zinc-500 to-zinc-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-[7px] text-zinc-600">{Math.round(progress)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Edge highlight for 3D depth */}
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: isLocked 
              ? "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.5)"
              : "inset 0 2px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3)",
          }}
        />
      </motion.div>
    </div>
  );
};
