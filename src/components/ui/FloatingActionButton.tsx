/**
 * CineVault - Floating Action Button (FAB)
 * 
 * Bouton flottant pour les actions principales (ajout de film)
 * Avec animation de pulse, états expanded, et menu radial optionnel
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Scan, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FABAction {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions?: FABAction[];
  onMainClick?: () => void;
  className?: string;
  hideOnScroll?: boolean;
}

export const FloatingActionButton = ({
  actions,
  onMainClick,
  className,
  hideOnScroll = true,
}: FloatingActionButtonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    if (!hideOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
        setIsExpanded(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, hideOnScroll]);

  const handleMainClick = () => {
    if (actions && actions.length > 0) {
      setIsExpanded(!isExpanded);
    } else if (onMainClick) {
      onMainClick();
    }
  };

  const handleActionClick = (action: FABAction) => {
    setIsExpanded(false);
    action.onClick();
  };

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <>
      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <motion.div
        initial={{ y: 0, opacity: 1 }}
        animate={{ 
          y: isVisible ? 0 : 100,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }}
        className={cn(
          "fixed right-4 bottom-20 z-50 md:bottom-8 md:right-8",
          className
        )}
      >
        {/* Action buttons (radial menu) */}
        <AnimatePresence>
          {isExpanded && actions && (
            <div className="absolute bottom-16 right-0 flex flex-col-reverse gap-3">
              {actions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: 20, 
                    scale: 0.8,
                    transition: { delay: (actions.length - index) * 0.03 }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleActionClick(action)}
                  className={cn(
                    "flex items-center gap-3 pl-4 pr-5 py-3 rounded-full",
                    "bg-card border border-border shadow-lg",
                    "text-sm font-medium text-foreground",
                    "hover:bg-accent/10 transition-colors"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    action.color || "bg-primary/20"
                  )}>
                    <action.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleMainClick}
          className={cn(
            "relative w-14 h-14 rounded-full",
            "bg-gradient-to-br from-amber-500 to-amber-600",
            "shadow-lg shadow-amber-500/30",
            "flex items-center justify-center",
            "transition-shadow duration-300",
            "hover:shadow-xl hover:shadow-amber-500/40",
            "active:shadow-md",
            // Pulse animation when not expanded
            !isExpanded && "animate-pulse-glow"
          )}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {isExpanded ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Plus className="w-6 h-6 text-white" />
            )}
          </motion.div>

          {/* Ripple effect */}
          {!isExpanded && (
            <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-20" />
          )}
        </motion.button>
      </motion.div>
    </>
  );
};

// Pre-configured FAB for Collection page
export const CollectionFAB = ({
  onAddManual,
  onScanBarcode,
  onQuickAdd,
}: {
  onAddManual: () => void;
  onScanBarcode: () => void;
  onQuickAdd?: () => void;
}) => {
  const actions: FABAction[] = [
    {
      icon: Search,
      label: "Rechercher un film",
      onClick: onAddManual,
      color: "bg-blue-500/20",
    },
    {
      icon: Scan,
      label: "Scanner un code-barres",
      onClick: onScanBarcode,
      color: "bg-green-500/20",
    },
  ];

  if (onQuickAdd) {
    actions.push({
      icon: Sparkles,
      label: "Ajout rapide",
      onClick: onQuickAdd,
      color: "bg-purple-500/20",
    });
  }

  return <FloatingActionButton actions={actions} />;
};

export default FloatingActionButton;
