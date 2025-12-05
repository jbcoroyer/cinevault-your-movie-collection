import { useState, useEffect } from "react";
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
  const [animationState, setAnimationState] = useState;
  "idle" | "opening" | "disc-in" | "closing" | "flying" | ("complete" > "idle");

  useEffect(() => {
    if (isOpen && animationState === "idle") {
      setAnimationState("opening");

      const timer1 = setTimeout(() => setAnimationState("disc-in"), 800);
      const timer2 = setTimeout(() => setAnimationState("closing"), 1800);
      const timer3 = setTimeout(() => setAnimationState("flying"), 2600);
      const timer4 = setTimeout(() => {
        setAnimationState("complete");
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 3400);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [isOpen, animationState, onAnimationComplete]);

  useEffect(() => {
    if (!isOpen) {
      setAnimationState("idle");
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
