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

// Metallic color schemes for each rarity - real metal pin style
const rarityMetals: Record<string, {
  frame: string;
  frameHighlight: string;
  frameShadow: string;
  surface: string;
  icon: string;
  glow: string;
  accent: string;
}> = {
  common: {
    frame: "#71717a",
    frameHighlight: "#a1a1aa",
    frameShadow: "#3f3f46",
    surface: "#27272a",
    icon: "#d4d4d8",
    glow: "",
    accent: "#52525b",
  },
  rare: {
    frame: "#94a3b8",
    frameHighlight: "#e2e8f0",
    frameShadow: "#475569",
    surface: "#1e293b",
    icon: "#38bdf8",
    glow: "0 0 20px rgba(56,189,248,0.4)",
    accent: "#0ea5e9",
  },
  epic: {
    frame: "#a855f7",
    frameHighlight: "#d8b4fe",
    frameShadow: "#6b21a8",
    surface: "#1e1b4b",
    icon: "#c084fc",
    glow: "0 0 25px rgba(168,85,247,0.5)",
    accent: "#9333ea",
  },
  legendary: {
    frame: "#d4a853",
    frameHighlight: "#fef08a",
    frameShadow: "#92400e",
    surface: "#1c1917",
    icon: "#fbbf24",
    glow: "0 0 30px rgba(251,191,36,0.5)",
    accent: "#f59e0b",
  },
  holographic: {
    frame: "#e879f9",
    frameHighlight: "#f0abfc",
    frameShadow: "#86198f",
    surface: "#0c0a09",
    icon: "#f0abfc",
    glow: "0 0 35px rgba(232,121,249,0.5)",
    accent: "#d946ef",
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
  const [lightPos, setLightPos] = useState({ x: 50, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isLocked) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setRotation({ x: rotateX, y: rotateY });
    setLightPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setLightPos({ x: 50, y: 0 });
  };

  const metal = rarityMetals[rarity] || rarityMetals.common;
  const lockedMetal = rarityMetals.common;

  const currentMetal = isLocked ? lockedMetal : metal;

  return (
    <div className={cn("relative group", className)} onClick={onClick} style={{ perspective: "800px" }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "relative w-full aspect-square transition-all duration-200 ease-out select-none",
          isLocked ? "cursor-not-allowed" : "cursor-pointer",
        )}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: "preserve-3d",
        }}
        whileHover={!isLocked ? { scale: 1.08 } : undefined}
        whileTap={!isLocked ? { scale: 0.98 } : undefined}
      >
        {/* Drop shadow for 3D lift effect */}
        <div 
          className="absolute inset-0 rounded-xl"
          style={{
            transform: "translateZ(-10px)",
            boxShadow: isLocked 
              ? "0 8px 20px rgba(0,0,0,0.4)"
              : `0 10px 30px rgba(0,0,0,0.5), ${currentMetal.glow}`,
          }}
        />

        {/* Metallic frame - outer bezel */}
        <div 
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(145deg, 
              ${currentMetal.frameHighlight} 0%, 
              ${currentMetal.frame} 20%, 
              ${currentMetal.frameShadow} 45%,
              ${currentMetal.frame} 55%,
              ${currentMetal.frameHighlight} 80%,
              ${currentMetal.frame} 100%
            )`,
            boxShadow: `
              inset 0 2px 4px rgba(255,255,255,0.3),
              inset 0 -2px 4px rgba(0,0,0,0.4)
            `,
          }}
        >
          {/* Brushed metal texture */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 1px,
                rgba(255,255,255,0.03) 1px,
                rgba(255,255,255,0.03) 2px
              )`,
            }}
          />

          {/* Light reflection on metal frame */}
          {!isLocked && (
            <div 
              className="absolute inset-0 transition-opacity duration-200"
              style={{
                background: `radial-gradient(
                  ellipse 60% 40% at ${lightPos.x}% ${lightPos.y}%,
                  rgba(255,255,255,0.4) 0%,
                  transparent 60%
                )`,
                opacity: 0.8,
              }}
            />
          )}
        </div>

        {/* Inner enamel surface - the pin's face */}
        <div 
          className="absolute inset-[6px] rounded-lg overflow-hidden"
          style={{
            background: currentMetal.surface,
            boxShadow: `
              inset 0 2px 6px rgba(0,0,0,0.6),
              inset 0 -1px 2px rgba(255,255,255,0.1)
            `,
          }}
        >
          {/* Surface gloss effect */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                180deg,
                rgba(255,255,255,0.08) 0%,
                transparent 30%,
                transparent 70%,
                rgba(0,0,0,0.2) 100%
              )`,
            }}
          />

          {/* Dynamic light reflection on surface */}
          {!isLocked && (
            <div 
              className="absolute inset-0 transition-all duration-100"
              style={{
                background: `radial-gradient(
                  circle at ${lightPos.x}% ${lightPos.y}%,
                  rgba(255,255,255,0.12) 0%,
                  transparent 40%
                )`,
              }}
            />
          )}

          {/* Holographic rainbow effect for special rarities */}
          {!isLocked && (rarity === "legendary" || rarity === "holographic") && (
            <motion.div
              className="absolute inset-0 mix-blend-overlay opacity-40"
              style={{
                background: `linear-gradient(
                  ${135 + rotation.y * 2}deg,
                  transparent 10%,
                  rgba(255,100,100,0.3) 25%,
                  rgba(255,255,100,0.3) 40%,
                  rgba(100,255,100,0.3) 55%,
                  rgba(100,100,255,0.3) 70%,
                  rgba(255,100,255,0.3) 85%,
                  transparent 90%
                )`,
              }}
            />
          )}
        </div>

        {/* Central icon medallion - raised emblem */}
        <div 
          className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2"
          style={{ 
            transform: `translate(-50%, -50%) translateZ(15px)`,
          }}
        >
          {/* Medallion outer ring */}
          <div 
            className="relative w-12 h-12 md:w-14 md:h-14 rounded-full"
            style={{
              background: `linear-gradient(145deg, 
                ${currentMetal.frameHighlight} 0%, 
                ${currentMetal.frame} 30%, 
                ${currentMetal.frameShadow} 70%,
                ${currentMetal.frame} 100%
              )`,
              boxShadow: `
                0 4px 8px rgba(0,0,0,0.4),
                inset 0 1px 2px rgba(255,255,255,0.4),
                inset 0 -1px 2px rgba(0,0,0,0.3)
              `,
            }}
          >
            {/* Inner icon area */}
            <div 
              className="absolute inset-[3px] rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(
                  circle at 30% 30%,
                  ${currentMetal.frame} 0%,
                  ${currentMetal.frameShadow} 100%
                )`,
                boxShadow: `
                  inset 0 2px 4px rgba(0,0,0,0.3),
                  inset 0 -1px 2px rgba(255,255,255,0.2)
                `,
              }}
            >
              {/* Icon shine overlay */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(
                    135deg,
                    rgba(255,255,255,0.25) 0%,
                    transparent 50%,
                    rgba(0,0,0,0.15) 100%
                  )`,
                }}
              />
              
              {isLocked ? (
                <Lock 
                  className="w-5 h-5 md:w-6 md:h-6 relative z-10" 
                  style={{ color: lockedMetal.icon }}
                />
              ) : (
                <Icon 
                  className="w-5 h-5 md:w-6 md:h-6 relative z-10" 
                  style={{ 
                    color: currentMetal.icon,
                    filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.5))`,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Title engraving - embossed metal look */}
        <div 
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[85%]"
          style={{ transform: `translateX(-50%) translateZ(8px)` }}
        >
          {/* Title plate */}
          <div 
            className="relative px-2 py-1 rounded"
            style={{
              background: `linear-gradient(180deg, 
                rgba(0,0,0,0.3) 0%, 
                rgba(0,0,0,0.5) 100%
              )`,
              boxShadow: isLocked ? 'none' : `
                inset 0 1px 0 rgba(255,255,255,0.05),
                0 1px 2px rgba(0,0,0,0.3)
              `,
            }}
          >
            <h3
              className={cn(
                "font-display font-bold uppercase tracking-[0.1em] text-[9px] md:text-[10px] text-center leading-tight truncate",
              )}
              style={{
                color: isLocked ? '#52525b' : currentMetal.icon,
                textShadow: isLocked ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {title}
            </h3>
          </div>
          
          {/* Description */}
          <p 
            className="text-[7px] md:text-[8px] text-center mt-1 leading-tight line-clamp-1 opacity-60"
            style={{ color: isLocked ? '#52525b' : '#a1a1aa' }}
          >
            {description}
          </p>

          {/* Progress bar for locked badges */}
          {isLocked && (
            <div className="flex flex-col items-center gap-0.5 mt-1.5">
              <div className="w-10 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${lockedMetal.frame}, ${lockedMetal.frameHighlight})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-[6px]" style={{ color: '#52525b' }}>{Math.round(progress)}%</span>
            </div>
          )}

          {/* Rarity badge */}
          {!isLocked && (
            <div className="flex justify-center mt-1.5">
              <div 
                className={cn(
                  "px-1.5 py-0.5 rounded text-[6px] md:text-[7px] font-bold uppercase tracking-wider",
                  (rarity === "legendary" || rarity === "holographic") && "animate-pulse",
                )}
                style={{
                  background: `linear-gradient(135deg, ${currentMetal.frameShadow}, ${currentMetal.surface})`,
                  color: currentMetal.accent,
                  border: `1px solid ${currentMetal.frame}40`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1)`,
                }}
              >
                {rarity}
              </div>
            </div>
          )}
        </div>

        {/* Overall edge highlight */}
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.2),
              inset 0 -1px 0 rgba(0,0,0,0.3)
            `,
          }}
        />
      </motion.div>
    </div>
  );
};
