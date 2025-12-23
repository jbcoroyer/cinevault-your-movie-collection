/**
 * CineVault - XP Toast Component
 * 
 * Toast animé pour afficher les gains d'XP
 * Apparaît après chaque action récompensée
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Star, Flame, Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface XPToastData {
  id: string;
  amount: number;
  reason?: string;
  type?: "xp" | "streak" | "badge" | "bonus";
}

// Singleton pattern for global toast management
let toastCallback: ((data: XPToastData) => void) | null = null;

export const showXPToast = (amount: number, reason?: string, type: XPToastData["type"] = "xp") => {
  if (toastCallback) {
    toastCallback({
      id: Math.random().toString(36).substring(7),
      amount,
      reason,
      type,
    });
  }
};

/**
 * XPToastProvider - Place this at app root level
 */
export const XPToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<XPToastData[]>([]);

  const addToast = useCallback((data: XPToastData) => {
    setToasts(prev => [...prev, data]);
    
    // Auto-remove after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== data.id));
    }, 2500);
  }, []);

  useEffect(() => {
    toastCallback = addToast;
    return () => {
      toastCallback = null;
    };
  }, [addToast]);

  return (
    <>
      {children}
      <XPToastContainer toasts={toasts} />
    </>
  );
};

/**
 * XPToastContainer - Renders active toasts
 */
const XPToastContainer = ({ toasts }: { toasts: XPToastData[] }) => {
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <XPToast key={toast.id} data={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * Individual XP Toast
 */
const XPToast = ({ data }: { data: XPToastData }) => {
  const { amount, reason, type = "xp" } = data;

  const config = {
    xp: {
      icon: Zap,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-500/20",
      textColor: "text-amber-500",
      label: "XP",
    },
    streak: {
      icon: Flame,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/20",
      textColor: "text-orange-500",
      label: "Streak",
    },
    badge: {
      icon: Trophy,
      color: "from-yellow-500 to-amber-500",
      bgColor: "bg-yellow-500/20",
      textColor: "text-yellow-500",
      label: "Badge",
    },
    bonus: {
      icon: Sparkles,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/20",
      textColor: "text-purple-500",
      label: "Bonus",
    },
  }[type];

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.8 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25 
      }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl",
        "bg-background/95 backdrop-blur-xl",
        "border border-border/50 shadow-xl",
        "pointer-events-auto"
      )}
    >
      {/* Icon with gradient background */}
      <motion.div
        initial={{ rotate: -180, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ delay: 0.1, type: "spring" }}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          config.bgColor
        )}
      >
        <Icon className={cn("w-5 h-5", config.textColor)} />
      </motion.div>

      {/* Amount */}
      <div className="flex flex-col">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={cn(
            "text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent",
            config.color
          )}
        >
          +{amount} {config.label}
        </motion.span>
        
        {reason && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-muted-foreground"
          >
            {reason}
          </motion.span>
        )}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 1, 
              scale: 0,
              x: 20 + i * 10,
              y: 20
            }}
            animate={{ 
              opacity: 0, 
              scale: 1,
              y: -20 - i * 10,
            }}
            transition={{ 
              delay: 0.2 + i * 0.1, 
              duration: 0.8,
              ease: "easeOut"
            }}
            className={cn(
              "absolute w-2 h-2 rounded-full",
              type === "xp" && "bg-amber-500",
              type === "streak" && "bg-orange-500",
              type === "badge" && "bg-yellow-500",
              type === "bonus" && "bg-purple-500",
            )}
          />
        ))}
      </div>
    </motion.div>
  );
};

/**
 * Mini XP Indicator - Shows in-line XP gains
 */
export const MiniXPGain = ({ 
  amount, 
  className 
}: { 
  amount: number;
  className?: string;
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.span
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
            "bg-amber-500/20 text-amber-500 text-xs font-bold",
            className
          )}
        >
          <Zap className="w-3 h-3" />
          +{amount}
        </motion.span>
      )}
    </AnimatePresence>
  );
};

/**
 * Floating XP Counter - For big gains
 */
export const FloatingXPCounter = ({
  amount,
  x,
  y,
  onComplete,
}: {
  amount: number;
  x: number;
  y: number;
  onComplete?: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -50, scale: 1.5 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      style={{ 
        position: "fixed", 
        left: x, 
        top: y,
        pointerEvents: "none",
        zIndex: 100
      }}
      className="flex items-center gap-1 text-amber-500 font-bold text-lg"
    >
      <Zap className="w-5 h-5" />
      +{amount}
    </motion.div>
  );
};

export default XPToastProvider;
