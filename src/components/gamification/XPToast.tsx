/**
 * CineVault — XP Toast avec animations premium
 *
 * Phase 2: Polish Gamification
 * - Animations Framer Motion spectaculaires
 * - Confetti sur level up
 * - Son optionnel
 * - Progression visuelle
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Zap, Star, TrendingUp, Sparkles, Trophy, Flame } from "lucide-react";
import { getLevelFromXp, getXpProgress } from "@/data/videoClubData";
import confetti from "canvas-confetti";

// ============================================
// Types
// ============================================

interface XPGain {
  id: string;
  amount: number;
  reason: string;
  previousXp: number;
  newXp: number;
  levelUp?: boolean;
  newLevel?: number;
}

interface XPToastContextType {
  showXPGain: (amount: number, reason: string, previousXp: number) => void;
}

const XPToastContext = createContext<XPToastContextType | null>(null);

// ============================================
// Hook
// ============================================

export const useXPToast = () => {
  const context = useContext(XPToastContext);
  if (!context) {
    throw new Error("useXPToast must be used within XPToastProvider");
  }
  return context;
};

// ============================================
// Confetti Effect
// ============================================

const triggerConfetti = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ["#f59e0b", "#fbbf24", "#fcd34d"],
  });

  fire(0.2, {
    spread: 60,
    colors: ["#f59e0b", "#ea580c", "#dc2626"],
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ["#fbbf24", "#f59e0b", "#d97706"],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ["#fcd34d", "#fbbf24", "#f59e0b"],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ["#ea580c", "#f59e0b", "#fbbf24"],
  });
};

// ============================================
// XP Toast Component
// ============================================

const XPToast: React.FC<{ gain: XPGain; onComplete: () => void }> = ({
  gain,
  onComplete,
}) => {
  const previousLevel = getLevelFromXp(gain.previousXp);
  const newLevel = getLevelFromXp(gain.newXp);
  const isLevelUp = newLevel > previousLevel;
  const { percentage } = getXpProgress(gain.newXp);

  useEffect(() => {
    if (isLevelUp) {
      triggerConfetti();
      // Optionnel: jouer un son
      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Joyful ascending notes
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.3); // C6

        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.5
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (e) {
        // Audio not supported
      }
    }

    const timer = setTimeout(onComplete, isLevelUp ? 4000 : 3000);
    return () => clearTimeout(timer);
  }, [isLevelUp, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "fixed bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 z-[100]",
        "px-6 py-4 rounded-2xl",
        "bg-gradient-to-r",
        isLevelUp
          ? "from-amber-500 via-orange-500 to-red-500"
          : "from-amber-500/90 to-orange-500/90",
        "backdrop-blur-xl shadow-2xl",
        isLevelUp && "shadow-amber-500/50"
      )}
    >
      {/* Glow effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-50 blur-xl",
          isLevelUp
            ? "bg-gradient-to-r from-amber-400 to-orange-500"
            : "bg-amber-500/30"
        )}
      />

      <div className="relative flex items-center gap-4">
        {/* Icon */}
        <motion.div
          animate={
            isLevelUp
              ? {
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.2, 1],
                }
              : {
                  scale: [1, 1.1, 1],
                }
          }
          transition={{
            duration: isLevelUp ? 0.6 : 0.3,
            repeat: isLevelUp ? 2 : 0,
          }}
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            "bg-white/20 backdrop-blur-sm"
          )}
        >
          {isLevelUp ? (
            <Trophy className="w-6 h-6 text-white" />
          ) : (
            <Zap className="w-6 h-6 text-white fill-white" />
          )}
        </motion.div>

        {/* Content */}
        <div className="flex flex-col">
          {isLevelUp ? (
            <>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white font-bold text-lg flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                NIVEAU {newLevel} !
              </motion.span>
              <span className="text-white/80 text-sm">{gain.reason}</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="text-white font-bold text-xl"
                >
                  +{gain.amount} XP
                </motion.span>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <TrendingUp className="w-4 h-4 text-white/80" />
                </motion.div>
              </div>
              <span className="text-white/80 text-sm">{gain.reason}</span>
            </>
          )}
        </div>

        {/* Progress ring (non level-up only) */}
        {!isLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative w-10 h-10"
          >
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-white/20"
              />
              <motion.circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-white"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: percentage / 100 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                style={{
                  strokeDasharray: "100",
                  strokeDashoffset: 0,
                }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
              {newLevel}
            </span>
          </motion.div>
        )}
      </div>

      {/* Floating particles */}
      <AnimatePresence>
        {[...Array(isLevelUp ? 8 : 4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 1,
              y: 0,
              x: Math.random() * 100 - 50,
              scale: 1,
            }}
            animate={{
              opacity: 0,
              y: -60 - Math.random() * 40,
              x: Math.random() * 100 - 50,
              scale: 0.5,
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.1,
              ease: "easeOut",
            }}
            className="absolute top-0 left-1/2"
          >
            <Star
              className={cn(
                "w-3 h-3",
                i % 2 === 0 ? "text-amber-300" : "text-orange-300"
              )}
              fill="currentColor"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================
// Provider
// ============================================

export const XPToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [gains, setGains] = useState<XPGain[]>([]);

  const showXPGain = useCallback(
    (amount: number, reason: string, previousXp: number) => {
      const newXp = previousXp + amount;
      const previousLevel = getLevelFromXp(previousXp);
      const newLevel = getLevelFromXp(newXp);

      const gain: XPGain = {
        id: `${Date.now()}-${Math.random()}`,
        amount,
        reason,
        previousXp,
        newXp,
        levelUp: newLevel > previousLevel,
        newLevel: newLevel > previousLevel ? newLevel : undefined,
      };

      setGains((prev) => [...prev, gain]);
    },
    []
  );

  const removeGain = useCallback((id: string) => {
    setGains((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return (
    <XPToastContext.Provider value={{ showXPGain }}>
      {children}
      <AnimatePresence>
        {gains.map((gain) => (
          <XPToast
            key={gain.id}
            gain={gain}
            onComplete={() => removeGain(gain.id)}
          />
        ))}
      </AnimatePresence>
    </XPToastContext.Provider>
  );
};

export default XPToastProvider;
