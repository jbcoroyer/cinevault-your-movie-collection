/**
 * CineVault - Animated Avatar Component
 * 
 * Avatar avec effets animés débloquables
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedAvatarProps {
  src: string | null;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  isAnimated?: boolean;
  frame?: string | null;
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24 md:w-32 md:h-32",
  xl: "w-32 h-32 md:w-40 md:h-40",
};

const FRAME_STYLES: Record<string, { border: string; glow: string; animation?: string }> = {
  default: { border: "border-white/10", glow: "" },
  frame_gold: { 
    border: "border-yellow-500 border-2", 
    glow: "shadow-[0_0_20px_rgba(234,179,8,0.5)]",
  },
  frame_neon: { 
    border: "border-fuchsia-500 border-2", 
    glow: "shadow-[0_0_25px_rgba(217,70,239,0.6)]",
    animation: "animate-pulse",
  },
  frame_collector: { 
    border: "border-cyan-400 border-4", 
    glow: "shadow-[0_0_30px_rgba(34,211,238,0.4)]",
  },
  frame_film: { 
    border: "border-zinc-700 border-[6px]", 
    glow: "",
  },
  frame_vhs: {
    border: "border-orange-500 border-2",
    glow: "shadow-[0_0_20px_rgba(249,115,22,0.4)]",
  },
};

export function AnimatedAvatar({ 
  src, 
  fallback, 
  size = "lg", 
  isAnimated = false, 
  frame = "default",
  className 
}: AnimatedAvatarProps) {
  const frameStyle = FRAME_STYLES[frame || "default"] || FRAME_STYLES.default;

  return (
    <div className={cn("relative", className)}>
      {/* Animated glow ring */}
      {isAnimated && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                "0 0 20px 5px rgba(139, 92, 246, 0.3)",
                "0 0 40px 10px rgba(236, 72, 153, 0.4)",
                "0 0 20px 5px rgba(34, 211, 238, 0.3)",
                "0 0 40px 10px rgba(139, 92, 246, 0.4)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 opacity-75 blur-sm"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </>
      )}

      {/* Avatar container */}
      <motion.div
        className={cn(
          "relative rounded-full overflow-hidden flex items-center justify-center bg-white/5 border",
          sizeClasses[size],
          frameStyle.border,
          frameStyle.glow,
          frameStyle.animation
        )}
        whileHover={isAnimated ? { scale: 1.05 } : undefined}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {src ? (
          <img
            src={src}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={cn(
            "font-bold text-white/30",
            size === "sm" ? "text-xs" :
            size === "md" ? "text-base" :
            size === "lg" ? "text-2xl md:text-3xl" :
            "text-3xl md:text-4xl"
          )}>
            {fallback}
          </span>
        )}

        {/* Sparkle effect for animated avatar */}
        {isAnimated && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${20 + i * 30}%`,
                  top: `${20 + i * 20}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
