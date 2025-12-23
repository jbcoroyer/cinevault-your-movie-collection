/**
 * CineVault - Page Transition Wrapper
 * 
 * Wrapper pour transitions de page fluides avec Framer Motion
 * Supporte différents types d'animations selon le contexte
 */

import { motion, AnimatePresence, Variants } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode } from "react";

// Transition variants
const pageVariants: Record<string, Variants> = {
  // Default fade + slide up
  default: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
  // Slide from right (for drill-down navigation)
  slideRight: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  },
  // Slide from left (for back navigation)
  slideLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  },
  // Scale in (for modals/overlays)
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  },
  // Fade only (minimal)
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  // None (no animation)
  none: {
    initial: {},
    animate: {},
    exit: {},
  },
};

// Transition config
const pageTransition = {
  type: "tween" as const,
  ease: [0.4, 0, 0.2, 1] as const,
  duration: 0.25,
};

interface PageTransitionProps {
  children: ReactNode;
  variant?: keyof typeof pageVariants;
  className?: string;
}

/**
 * PageTransition - Wrap pages for smooth transitions
 */
export const PageTransition = ({ 
  children, 
  variant = "default",
  className = ""
}: PageTransitionProps) => {
  const location = useLocation();
  const variants = pageVariants[variant];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={pageTransition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * AnimatedPage - Simple wrapper for full page animations
 */
export const AnimatedPage = ({ 
  children,
  className = ""
}: { 
  children: ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * FadeIn - Fade in on mount
 */
export const FadeIn = ({ 
  children, 
  delay = 0,
  duration = 0.3,
  className = ""
}: { 
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * SlideUp - Slide up on mount with fade
 */
export const SlideUp = ({ 
  children, 
  delay = 0,
  distance = 20,
  className = ""
}: { 
  children: ReactNode;
  delay?: number;
  distance?: number;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay, 
        duration: 0.4, 
        ease: [0.4, 0, 0.2, 1] 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * ScaleIn - Scale in on mount
 */
export const ScaleIn = ({ 
  children, 
  delay = 0,
  className = ""
}: { 
  children: ReactNode;
  delay?: number;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        delay, 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1] 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerContainer - Container for staggered children animations
 */
export const StaggerContainer = ({ 
  children,
  staggerDelay = 0.05,
  className = ""
}: { 
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerItem - Child of StaggerContainer
 */
export const StaggerItem = ({ 
  children,
  className = ""
}: { 
  children: ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { 
          opacity: 1, 
          y: 0,
          transition: { 
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1]
          }
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * ListStagger - Animated list with stagger effect
 */
interface ListStaggerProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string | number;
  staggerDelay?: number;
  className?: string;
  itemClassName?: string;
}

export function ListStagger<T>({
  items,
  renderItem,
  keyExtractor,
  staggerDelay = 0.03,
  className = "",
  itemClassName = ""
}: ListStaggerProps<T>) {
  return (
    <motion.div 
      className={className}
      initial="initial"
      animate="animate"
      variants={{
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {items.map((item, index) => (
        <motion.div
          key={keyExtractor(item)}
          variants={{
            initial: { opacity: 0, y: 15 },
            animate: { 
              opacity: 1, 
              y: 0,
              transition: { 
                duration: 0.35,
                ease: [0.4, 0, 0.2, 1]
              }
            },
          }}
          className={itemClassName}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default PageTransition;
