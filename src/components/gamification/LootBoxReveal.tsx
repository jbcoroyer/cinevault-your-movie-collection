/**
 * PREMIUM LOOT BOX REVEAL
 * Ultra-sophisticated XP & rarity reveal animation
 * Features: Dynamic particles, holographic effects, cinematic reveals
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Disc, Sparkles, Star, Zap, Crown, Gem } from "lucide-react";
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

// Particle burst component
const ParticleBurst = ({ color, count = 30 }: { color: string; count?: number }) => {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (360 / count) * i + Math.random() * 20,
      distance: 100 + Math.random() * 150,
      size: 3 + Math.random() * 5,
      delay: Math.random() * 0.3,
      duration: 1.5 + Math.random() * 1,
    })), [count]
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p) => {
        const x = Math.cos((p.angle * Math.PI) / 180) * p.distance;
        const y = Math.sin((p.angle * Math.PI) / 180) * p.distance;
        
        return (
          <motion.div
            key={p.id}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: color,
              boxShadow: `0 0 ${p.size * 2}px ${color}`,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: [0, x * 0.3, x],
              y: [0, y * 0.3 - 20, y],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          />
        );
      })}
    </div>
  );
};

// Floating orbs background
const FloatingOrbs = ({ color }: { color: string }) => {
  const orbs = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      size: 100 + Math.random() * 200,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 4 + Math.random() * 4,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// XP Counter with premium animation
const XPCounter = ({ value, color }: { value: number; color: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(interval);
  }, [value]);

  return (
    <motion.div
      className="relative flex items-center gap-3"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 12,
        delay: 0.8 
      }}
    >
      {/* Glow behind */}
      <motion.div
        className="absolute inset-0 blur-2xl opacity-50"
        style={{ backgroundColor: color }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Icon */}
      <motion.div
        className="relative z-10"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
      >
        <Zap 
          className="w-10 h-10" 
          style={{ color, filter: `drop-shadow(0 0 10px ${color})` }} 
          fill={color}
        />
      </motion.div>
      
      {/* Value */}
      <div className="relative z-10 flex items-baseline gap-1">
        <motion.span
          className="text-5xl font-display font-black tabular-nums"
          style={{ 
            color,
            textShadow: `0 0 30px ${color}, 0 0 60px ${color}40`
          }}
          animate={{ scale: displayValue === value ? [1, 1.1, 1] : 1 }}
        >
          +{displayValue}
        </motion.span>
        <span className="text-2xl font-bold text-white/70">XP</span>
      </div>
    </motion.div>
  );
};

// Rarity icon component
const RarityIcon = ({ rarity }: { rarity: Rarity }) => {
  const icons = {
    common: Star,
    rare: Sparkles,
    epic: Gem,
    legendary: Crown,
    grail: Crown,
  };
  const Icon = icons[rarity] || Star;
  return <Icon className="w-4 h-4" />;
};

export function LootBoxReveal({
  isOpen,
  onComplete,
  movieTitle,
  moviePoster,
  format,
  xpGained,
  rarity,
}: LootBoxRevealProps) {
  const [phase, setPhase] = useState<"spinning" | "burst" | "reveal" | "done">("spinning");
  const rarityConfig = RARITY_CONFIG[rarity];

  // Mouse tracking for holographic effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [15, -15]);
  const rotateY = useTransform(mouseX, [-300, 300], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  // Animation sequence
  useEffect(() => {
    if (!isOpen) {
      setPhase("spinning");
      return;
    }

    const timers = [
      setTimeout(() => setPhase("burst"), 1200),
      setTimeout(() => setPhase("reveal"), 1800),
      setTimeout(() => setPhase("done"), 3500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (phase === "done") onComplete();
  }, [phase, onComplete]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        onClick={handleClose}
        onMouseMove={handleMouseMove}
      >
        {/* Premium background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
        
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at center, ${rarityConfig.color}40 0%, transparent 60%)`,
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Floating orbs */}
        <FloatingOrbs color={rarityConfig.color} />

        {/* Central content */}
        <div className="relative z-10 flex flex-col items-center px-4">
          
          {/* Spinning phase - Premium disc */}
          {phase === "spinning" && (
            <motion.div
              className="relative"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="relative w-40 h-40"
              >
                <Disc 
                  className="w-full h-full" 
                  style={{ 
                    color: rarityConfig.color,
                    filter: `drop-shadow(0 0 30px ${rarityConfig.color})`
                  }}
                />
              </motion.div>
              
              {/* Pulsing glow */}
              <motion.div
                className="absolute inset-0 rounded-full blur-3xl"
                style={{ backgroundColor: rarityConfig.color }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.div>
          )}

          {/* Burst phase - Particle explosion */}
          {(phase === "burst" || phase === "reveal" || phase === "done") && (
            <ParticleBurst color={rarityConfig.color} count={50} />
          )}

          {/* Reveal phase - Movie card */}
          {(phase === "reveal" || phase === "done") && (
            <motion.div
              className="flex flex-col items-center"
              style={{ perspective: 1000 }}
            >
              {/* Movie poster with 3D effect */}
              <motion.div
                className="relative"
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                initial={{ scale: 0, rotateY: 180, opacity: 0 }}
                animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 150, 
                  damping: 15,
                  delay: 0.2 
                }}
              >
                {/* Card glow */}
                <motion.div
                  className="absolute -inset-4 rounded-2xl blur-2xl opacity-60"
                  style={{ backgroundColor: rarityConfig.color }}
                  animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                {/* Main card */}
                <div 
                  className={cn(
                    "relative w-56 h-80 rounded-xl overflow-hidden",
                    "border-2 shadow-2xl",
                    "bg-gradient-to-br from-zinc-900 to-zinc-950"
                  )}
                  style={{ 
                    borderColor: rarityConfig.color,
                    boxShadow: `
                      0 0 40px ${rarityConfig.glowColor},
                      0 25px 50px -12px rgba(0, 0, 0, 0.8),
                      inset 0 1px 0 rgba(255,255,255,0.1)
                    `,
                  }}
                >
                  {/* Poster */}
                  {moviePoster ? (
                    <img 
                      src={`https://image.tmdb.org/t/p/w500${moviePoster}`} 
                      alt={movieTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                      <Disc className="w-20 h-20 text-zinc-700" />
                    </div>
                  )}

                  {/* Holographic shine overlay */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(
                        105deg,
                        transparent 40%,
                        rgba(255,255,255,0.1) 45%,
                        rgba(255,255,255,0.2) 50%,
                        rgba(255,255,255,0.1) 55%,
                        transparent 60%
                      )`,
                    }}
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  />

                  {/* Rarity badge */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 p-4"
                    style={{
                      background: `linear-gradient(to top, ${rarityConfig.color}90 0%, transparent 100%)`,
                    }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div 
                      className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-[0.2em]"
                      style={{ color: "white", textShadow: `0 0 10px ${rarityConfig.color}` }}
                    >
                      <RarityIcon rarity={rarity} />
                      {rarityConfig.label}
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Movie title */}
              <motion.h2
                className="mt-8 text-2xl font-display font-bold text-white text-center max-w-xs"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}
              >
                {movieTitle}
              </motion.h2>

              {/* Format badge */}
              <motion.div
                className="mt-3 px-4 py-2 rounded-full border backdrop-blur-sm"
                style={{ 
                  borderColor: `${rarityConfig.color}50`,
                  backgroundColor: `${rarityConfig.color}20`,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
              >
                <span 
                  className="text-sm font-mono font-semibold"
                  style={{ color: rarityConfig.color }}
                >
                  {format}
                </span>
              </motion.div>

              {/* XP Counter */}
              <div className="mt-8">
                <XPCounter value={xpGained} color={rarityConfig.color} />
              </div>

              {/* Continue prompt */}
              {phase === "done" && (
                <motion.p
                  className="mt-10 text-sm text-white/50 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Touchez pour continuer
                </motion.p>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}