/**
 * CineVault - Animation Utility Hooks
 * 
 * Hooks réutilisables pour les micro-interactions et animations
 */

import { useState, useCallback, useEffect, useRef } from "react";

/**
 * useDebounce - Debounce a value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useHapticFeedback - Trigger haptic feedback
 */
export function useHapticFeedback() {
  const light = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  const medium = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  }, []);

  const heavy = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate([30, 10, 30]);
    }
  }, []);

  const success = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 20]);
    }
  }, []);

  const error = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50, 30, 50]);
    }
  }, []);

  return { light, medium, heavy, success, error };
}

/**
 * useLongPress - Detect long press gestures
 */
interface UseLongPressOptions {
  threshold?: number;
  onLongPress?: () => void;
  onPress?: () => void;
}

export function useLongPress({
  threshold = 500,
  onLongPress,
  onPress,
}: UseLongPressOptions = {}) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    isLongPress.current = false;
    
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress?.();
    }, threshold);
  }, [threshold, onLongPress]);

  const stop = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    if (!isLongPress.current) {
      onPress?.();
    }
  }, [onPress]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: cancel,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: cancel,
  };
}

/**
 * useIntersectionObserver - Observe element visibility
 */
interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const { threshold = 0.1, rootMargin = "0px", freezeOnceVisible = false } = options;
  
  const [ref, setRef] = useState<Element | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const frozen = useRef(false);

  useEffect(() => {
    if (!ref) return;
    if (frozen.current && freezeOnceVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        
        if (visible && freezeOnceVisible) {
          frozen.current = true;
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin, freezeOnceVisible]);

  return { ref: setRef, isVisible };
}

/**
 * useScrollDirection - Detect scroll direction
 */
export function useScrollDirection(threshold = 10) {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      setIsAtTop(currentScrollY < threshold);

      if (Math.abs(diff) > threshold) {
        setScrollDirection(diff > 0 ? "down" : "up");
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return { scrollDirection, isAtTop };
}

/**
 * useAnimationDelay - Generate stagger delays for list items
 */
export function useAnimationDelay(index: number, baseDelay = 0.05) {
  return index * baseDelay;
}

/**
 * useMediaQuery - Match media queries
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/**
 * useIsMobile - Check if on mobile device
 */
export function useIsMobile() {
  return useMediaQuery("(max-width: 768px)");
}

/**
 * useReducedMotion - Check for reduced motion preference
 */
export function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * usePrefersColorScheme - Check color scheme preference
 */
export function usePrefersColorScheme() {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  return prefersDark ? "dark" : "light";
}

/**
 * useCountUp - Animated number counter
 */
export function useCountUp(
  end: number,
  duration = 1000,
  start = 0
): number {
  const [value, setValue] = useState(start);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      
      setValue(Math.floor(start + (end - start) * easeProgress));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, start]);

  return value;
}

/**
 * useLocalStorage - Persist state in localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

export default {
  useDebounce,
  useHapticFeedback,
  useLongPress,
  useIntersectionObserver,
  useScrollDirection,
  useAnimationDelay,
  useMediaQuery,
  useIsMobile,
  useReducedMotion,
  usePrefersColorScheme,
  useCountUp,
  useLocalStorage,
};
