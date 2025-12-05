import { useState, useEffect } from "react";
import { getImageUrl } from "@/services/tmdb";
import "./DVDBoxAnimation.css";

interface DVDBoxAnimationProps {
  isOpen: boolean;
  posterUrl: string | null;
  movieTitle: string;
  onAnimationComplete?: () => void;
}

export const DVDBoxAnimation: React.FC<DVDBoxAnimationProps> = ({
  isOpen,
  posterUrl,
  movieTitle,
  onAnimationComplete,
}) => {
  const [animationState, setAnimationState] = useState
    "idle" | "opening" | "disc-in" | "closing" | "flying" | "complete"
  >("idle");

  useEffect(() => {
    if (isOpen && animationState === "idle") {
      // Démarrer la séquence d'animation
      setAnimationState("opening");
      
      // Séquence temporisée
      const timers = [
        setTimeout(() => setAnimationState("disc-in"), 800),
        setTimeout(() => setAnimationState("closing"), 1800),
        setTimeout(() => setAnimationState("flying"), 2600),
        setTimeout(() => {
          setAnimationState("complete");
          onAnimationComplete?.();
        }, 3400),
      ];

      return () => timers.forEach(clearTimeout);
    }
  }, [isOpen, animationState, onAnimationComplete]);

  useEffect(() => {
    if (!isOpen) {
      setAnimationState("idle");
    }
  }, [isOpen]);

  if (!isOpen && animationState === "idle") return null;

  return (
    <div className="dvd-animation-overlay">
      <div className={`dvd-scene ${animationState}`}>
        {/* Boîte DVD */}
        <div className="dvd-box">
          {/* Côté arrière de la boîte */}
          <div className="dvd-box-back">
            <div className="dvd-box-spine"></div>
          </div>
          
          {/* Intérieur de la boîte avec le disque holder */}
          <div className="dvd-box-inside">
            <div className="disc-holder"></div>
            {/* Disque qui arrive */}
            <div className="dvd-disc">
              {posterUrl && (
                <img 
                  src={posterUrl} 
                  alt={movieTitle}
                  className="disc-image"
                />
              )}
              <div className="disc-center"></div>
              <div className="disc-shine"></div>
            </div>
          </div>
          
          {/* Couvercle de la boîte (partie qui s'ouvre) */}
          <div className="dvd-box-cover">
            {posterUrl ? (
              <img 
                src={posterUrl} 
                alt={movieTitle}
                className="cover-image"
              />
            ) : (
              <div className="cover-placeholder">
                <span>DVD</span>
              </div>
            )}
          </div>
        </div>

        {/* Texte d'état */}
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
