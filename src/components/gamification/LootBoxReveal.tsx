/**
 * LOOT BOX REVEAL - Animation d'ajout de film
 * Expérience "ouverture de pack" style Vidéo Club
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Disc, Sparkles, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Rarity, RARITY_CONFIG } from "@/data/videoClubData";

interface LootBoxRevealProps {
  isOpen: boolean;
  onComplete: () => void;
  movieTitle: string;
  moviePoster?: string;
  format: string;
  xpGained: number;
  rarity: Rarity;
}

export function LootBoxReveal({
  isOpen,
  onComplete,
  movieTitle,
  moviePoster,
  format,
  xpGained,
  rarity,
}: LootBoxRevealProps) {
  const [phase, setPhase] = useState<"spinning" | "reveal" | "done">("spinning");
  const [displayedXp, setDisplayedXp] = useState(0);

  const rarityConfig = RARITY_CONFIG[rarity];

  // Animation sequence
  useEffect(() => {
    if (!isOpen) {
      setPhase("spinning");
      setDisplayedXp(0);
      return;
    }

    const spinTimer = setTimeout(() => setPhase("reveal"), 1500);
    const doneTimer = setTimeout(() => setPhase("done"), 3000);

    return () => {
      clearTimeout(spinTimer);
      clearTimeout(doneTimer);
    };
  }, [isOpen]);

  // XP counter animation
  useEffect(() => {
    if (phase !== "reveal" && phase !== "done") return;

    const duration = 1000;
    const steps = 30;
    const increment = xpGained / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= xpGained) {
        setDisplayedXp(xpGained);
        clearInterval(interval);
      } else {
        setDisplayedXp(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [phase, xpGained]);

  const handleClose = useCallback(() => {
    onComplete();
  }, [onComplete]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-videoclub-bg/95 backdrop-blur-xl"
        onClick={phase === "done" ? handleClose : undefined}
      >
        {/* Particle effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0,
                x: "50vw",
                y: "50vh",
                scale: 0,
              }}
              animate={{ 
                opacity: [0, 1, 0],
                x: `${Math.random() * 100}vw`,
                y: `${Math.random() * 100}vh`,
                scale: [0, 1, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 1.5,
                ease: "easeOut",
              }}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: rarityConfig.color }}
            />
          ))}
        </div>

        {/* Central content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Spinning phase */}
          {phase === "spinning" && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <Disc 
                className="w-32 h-32" 
                style={{ color: rarityConfig.color }}
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full blur-xl opacity-50"
                style={{ backgroundColor: rarityConfig.color }}
              />
            </motion.div>
          )}

          {/* Reveal phase */}
          {(phase === "reveal" || phase === "done") && (
            <motion.div
              initial={{ scale: 0, rotateY: 180 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: 0.2,
              }}
              className="flex flex-col items-center"
            >
              {/* Movie poster */}
              <div 
                className={cn(
                  "relative w-48 h-72 rounded-xl overflow-hidden border-2 shadow-2xl",
                  "bg-gradient-to-br",
                  rarityConfig.bgGradient,
                )}
                style={{ 
                  borderColor: rarityConfig.color,
                  boxShadow: `0 0 60px ${rarityConfig.glowColor}`,
                }}
              >
                {moviePoster ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${moviePoster}`} 
                    alt={movieTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Disc className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}

                {/* Rarity badge */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent"
                >
                  <div 
                    className="text-center text-xs font-mono font-bold uppercase tracking-widest"
                    style={{ color: rarityConfig.color }}
                  >
                    {rarityConfig.label}
                  </div>
                </motion.div>

                {/* Shine effect */}
                <motion.div
                  initial={{ x: "-100%", opacity: 0.5 }}
                  animate={{ x: "200%" }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                />
              </div>

              {/* Movie title */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-xl font-display font-bold text-foreground text-center max-w-xs"
              >
                {movieTitle}
              </motion.h2>

              {/* Format tag */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-2 px-3 py-1 rounded-full bg-videoclub-surface border border-videoclub-cyan/30"
              >
                <span className="text-sm font-mono text-videoclub-cyan">
                  {format}
                </span>
              </motion.div>

              {/* XP Counter */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="mt-6 flex items-center gap-2"
              >
                <Zap className="w-6 h-6 text-videoclub-magenta" />
                <span className="text-3xl font-display font-bold text-videoclub-magenta">
                  +{displayedXp}
                </span>
                <span className="text-lg text-muted-foreground font-mono">
                  XP
                </span>
              </motion.div>

              {/* Continue prompt */}
              {phase === "done" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 text-sm text-muted-foreground font-mono animate-pulse"
                >
                  Cliquez pour continuer
                </motion.p>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
