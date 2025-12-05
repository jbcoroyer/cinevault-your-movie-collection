import React, { useState, useEffect, useRef } from "react";
import "./DVDBoxAnimation.css";

interface DVDBoxAnimationProps {
  isOpen: boolean;
  posterUrl: string | null;
  movieTitle: string;
  onAnimationComplete?: () => void;
}

type AnimationState = "idle" | "opening" | "disc-in" | "closing" | "flying" | "complete";

export const DVDBoxAnimation: React.FC<DVDBoxAnimationProps> = ({
  isOpen,
  posterUrl,
  movieTitle,
  onAnimationComplete,
}) => {
  const [animationState, setAnimationState] = useState<AnimationState>("idle");
  const hasStartedRef = useRef(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Démarrer l'animation quand isOpen devient true
  useEffect(() => {
    if (isOpen && !hasStartedRef.current) {
      hasStartedRef.current = true;
      setAnimationState("opening");

      // Créer les timers pour la séquence
      timersRef.current = [
        setTimeout(() => setAnimationState("disc-in"), 5000),
        setTimeout(() => setAnimationState("closing"), 3000),
        setTimeout(() => setAnimationState("flying"), 5000),
        setTimeout(() => {
          setAnimationState("complete");
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }, 3400),
      ];
    }

    // Cleanup uniquement quand le composant est démonté
    return () => {
      if (!isOpen) {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
      }
    };
  }, [isOpen, onAnimationComplete]);

  // Reset quand isOpen devient false
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
    <div className="dvd-animation-overlay">
      <div className={`dvd-scene ${animationState}`}>
        <div className="dvd-box">
          <div className="dvd-box-back">
            <div className="dvd-box-spine"></div>
          </div>

          <div className="dvd-box-inside">
            <div className="disc-holder"></div>
            <div className="dvd-disc">
              {posterUrl && <img src={posterUrl} alt={movieTitle} className="disc-image" />}
              <div className="disc-center"></div>
              <div className="disc-shine"></div>
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

        <div className="animation-text">
          {animationState === "opening" && "Ouverture..."}
          {animationState === "disc-in" && "Ajout du disque..."}
          {animationState === "closing" && "Fermeture..."}
          {animationState === "flying" && "Ajout à la collection !"}
        </div>
      </div>
    </div>
  );
};
