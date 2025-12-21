/**
 * PREMIUM DVD BOX ANIMATION
 * Ultra-sophisticated 3D animation for adding movies to collection
 * Features: 3D box opening, disc drop with physics, confetti celebration
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./DVDBoxAnimation.css";

interface DVDBoxAnimationProps {
  isOpen: boolean;
  posterUrl: string | null;
  movieTitle: string;
  onAnimationComplete?: () => void;
}

type AnimationState = "idle" | "opening" | "disc-in" | "closing" | "flying" | "complete";

// Confetti particle component
const ConfettiParticle = ({ delay, color }: { delay: number; color: string }) => {
  const randomX = useMemo(() => (Math.random() - 0.5) * 400, []);
  const randomY = useMemo(() => Math.random() * -300 - 100, []);
  const randomRotation = useMemo(() => Math.random() * 720 - 360, []);
  const size = useMemo(() => Math.random() * 8 + 4, []);

  return (
    <motion.div
      className="confetti-particle"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      }}
      initial={{ 
        opacity: 0, 
        x: 0, 
        y: 0, 
        rotate: 0,
        scale: 0 
      }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        x: randomX,
        y: [0, randomY, randomY + 400],
        rotate: randomRotation,
        scale: [0, 1, 1, 0.5]
      }}
      transition={{
        duration: 2.5,
        delay: delay,
        ease: [0.34, 1.56, 0.64, 1],
      }}
    />
  );
};

export const DVDBoxAnimation: React.FC<DVDBoxAnimationProps> = ({
  isOpen,
  posterUrl,
  movieTitle,
  onAnimationComplete,
}) => {
  const [animationState, setAnimationState] = useState<AnimationState>("idle");
  const hasStartedRef = useRef(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Confetti colors
  const confettiColors = useMemo(() => [
    "#f59e0b", "#fbbf24", "#f97316", "#ef4444", 
    "#8b5cf6", "#06b6d4", "#10b981", "#ec4899"
  ], []);

  // Generate confetti particles
  const confettiParticles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      delay: 6.7 + Math.random() * 0.5,
      color: confettiColors[i % confettiColors.length],
    }));
  }, [confettiColors]);

  useEffect(() => {
    if (isOpen && !hasStartedRef.current) {
      hasStartedRef.current = true;
      setAnimationState("opening");

      // Optimized timing sequence
      timersRef.current = [
        setTimeout(() => setAnimationState("disc-in"), 1800),
        setTimeout(() => setAnimationState("closing"), 4000),
        setTimeout(() => setAnimationState("flying"), 5500),
        setTimeout(() => {
          setAnimationState("complete");
          onAnimationComplete?.();
        }, 7800),
      ];
    }

    return () => {
      if (!isOpen) {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
      }
    };
  }, [isOpen, onAnimationComplete]);

  useEffect(() => {
    if (!isOpen) {
      hasStartedRef.current = false;
      setAnimationState("idle");
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    }
  }, [isOpen]);

  if (!isOpen && animationState === "idle") {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="dvd-animation-overlay">
        {/* Confetti explosion on flying state */}
        {animationState === "flying" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {confettiParticles.map((particle) => (
              <ConfettiParticle
                key={particle.id}
                delay={0}
                color={particle.color}
              />
            ))}
          </div>
        )}

        <div className={`dvd-scene ${animationState}`}>
          <div className="dvd-box">
            <div className="dvd-box-back">
              <div className="dvd-box-spine" />
            </div>

            <div className="dvd-box-inside">
              <div className="disc-holder" />
              <div className="dvd-disc">
                {posterUrl && (
                  <img src={posterUrl} alt={movieTitle} className="disc-image" />
                )}
                <div className="disc-center" />
                <div className="disc-shine" />
              </div>
            </div>

            <div className="dvd-box-cover">
              {posterUrl ? (
                <img src={posterUrl} alt={movieTitle} className="cover-image" />
              ) : (
                <div className="cover-placeholder">
                  <span>DVD</span>
                </div>
              )}
            </div>
          </div>

          {/* Animated text with motion */}
          <AnimatePresence mode="wait">
            <motion.div
              key={animationState}
              className="animation-text"
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.4 }}
            >
              {animationState === "opening" && "Ouverture du boîtier..."}
              {animationState === "disc-in" && "Insertion du disque..."}
              {animationState === "closing" && "Fermeture..."}
              {animationState === "flying" && (
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, times: [0, 0.5, 1] }}
                  className="text-amber-400"
                >
                  ✨ Ajouté à votre collection !
                </motion.span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AnimatePresence>
  );
};