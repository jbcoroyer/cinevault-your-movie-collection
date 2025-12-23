/**
 * CineVault - PullToRefresh Component
 * 
 * Composant de pull-to-refresh avec animation satisfaisante
 * Compatible mobile uniquement
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  threshold?: number;
}

type RefreshState = "idle" | "pulling" | "ready" | "refreshing" | "complete";

export const PullToRefresh = ({
  onRefresh,
  children,
  className,
  disabled = false,
  threshold = 80,
}: PullToRefreshProps) => {
  const [state, setState] = useState<RefreshState>("idle");
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  
  const pullDistance = useMotionValue(0);
  const pullProgress = useTransform(pullDistance, [0, threshold], [0, 1]);
  const indicatorOpacity = useTransform(pullDistance, [0, 20, threshold], [0, 1, 1]);
  const indicatorScale = useTransform(pullDistance, [0, threshold], [0.5, 1]);
  const indicatorRotate = useTransform(pullDistance, [0, threshold * 2], [0, 360]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || state === "refreshing") return;
    
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setState("pulling");
  }, [disabled, state]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (state !== "pulling" && state !== "ready") return;
    
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop > 0) {
      pullDistance.set(0);
      return;
    }

    currentY.current = e.touches[0].clientY;
    const diff = Math.max(0, currentY.current - startY.current);
    
    // Apply resistance
    const resistance = 0.5;
    const distance = diff * resistance;
    
    pullDistance.set(distance);
    setState(distance >= threshold ? "ready" : "pulling");

    // Prevent default scroll when pulling
    if (diff > 0) {
      e.preventDefault();
    }
  }, [state, threshold, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (state === "ready") {
      setState("refreshing");
      
      try {
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
        
        await onRefresh();
        setState("complete");
        
        // Brief pause to show completion
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error("Refresh error:", error);
      }
    }
    
    // Animate back to idle
    animate(pullDistance, 0, { 
      type: "spring", 
      stiffness: 300, 
      damping: 30 
    });
    setState("idle");
  }, [state, onRefresh, pullDistance]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className={cn("relative overflow-auto", className)}>
      {/* Pull indicator */}
      <motion.div
        style={{ 
          opacity: indicatorOpacity,
          y: useTransform(pullDistance, [0, threshold], [-40, 0])
        }}
        className="absolute top-0 left-0 right-0 flex justify-center pt-4 z-10 pointer-events-none"
      >
        <motion.div
          style={{ scale: indicatorScale }}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-background border border-border shadow-lg",
            state === "ready" && "bg-amber-500 border-amber-500",
            state === "refreshing" && "bg-amber-500 border-amber-500",
            state === "complete" && "bg-green-500 border-green-500"
          )}
        >
          {state === "refreshing" ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : state === "complete" ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-white text-lg"
            >
              ✓
            </motion.div>
          ) : (
            <motion.div style={{ rotate: indicatorRotate }}>
              <RefreshCw className={cn(
                "w-5 h-5 transition-colors",
                state === "ready" ? "text-white" : "text-muted-foreground"
              )} />
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Content with pull offset */}
      <motion.div
        style={{ 
          y: state === "refreshing" ? threshold / 2 : pullDistance 
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
