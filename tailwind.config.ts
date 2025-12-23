import type { Config } from "tailwindcss";

/**
 * CineVault 2.0 - Tailwind Configuration AMÉLIORÉE
 *
 * AMÉLIORATIONS:
 * - Easing system unifié (cubic-bezier cohérent)
 * - Nouvelles animations (shimmer, pulse-glow, float)
 * - Design tokens consolidés
 * - Ombres cohérentes (3 niveaux)
 * - Border radius system
 */

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // ============================================
      // FONTS
      // ============================================
      fontFamily: {
        sans: ['"Space Grotesk"', "system-ui", "sans-serif"],
        display: ['"Syne"', "system-ui", "sans-serif"],
        serif: ['"Playfair Display"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },

      // ============================================
      // COLORS - Design Tokens
      // ============================================
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Aurora colors for effects
        aurora: {
          1: "hsl(var(--aurora-1))",
          2: "hsl(var(--aurora-2))",
          3: "hsl(var(--aurora-3))",
        },
        // Gold for gamification
        gold: "hsl(var(--gold))",
        // Video Club Néo-Rétro Colors
        videoclub: {
          bg: "hsl(240 10% 4%)",
          surface: "hsl(240 10% 8%)",
          cyan: "hsl(var(--videoclub-cyan))",
          magenta: "hsl(var(--videoclub-magenta))",
          gold: "hsl(var(--videoclub-gold))",
        },
      },

      // ============================================
      // BORDER RADIUS - Consistent system
      // ============================================
      borderRadius: {
        sm: "0.375rem", // 6px - badges, small elements
        DEFAULT: "0.5rem", // 8px - default
        md: "0.625rem", // 10px - buttons, inputs
        lg: "0.75rem", // 12px - cards
        xl: "1rem", // 16px - larger cards
        "2xl": "1.25rem", // 20px - featured cards
        "3xl": "1.5rem", // 24px - hero elements
      },

      // ============================================
      // BOX SHADOWS - 3 level system
      // ============================================
      boxShadow: {
        // Base shadows
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        DEFAULT: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        // Glass shadow
        glass: "var(--glass-shadow)",
        // Glow shadows - for interactions
        "glow-sm": "0 0 20px -5px hsl(var(--primary) / 0.3)",
        "glow-md": "0 0 40px -10px hsl(var(--primary) / 0.4)",
        "glow-lg": "0 0 60px -15px hsl(var(--primary) / 0.5)",
        "glow-gold": "0 0 30px -5px hsl(var(--gold) / 0.5)",
        "glow-amber": "0 0 30px -5px rgb(245 158 11 / 0.5)",
        // Inner shadow
        inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
      },

      // ============================================
      // TRANSITIONS - Unified easing system
      // ============================================
      transitionTimingFunction: {
        // Default - smooth, natural feeling
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
        // In - starts slow
        in: "cubic-bezier(0.4, 0, 1, 1)",
        // Out - ends slow (most common for UI)
        out: "cubic-bezier(0, 0, 0.2, 1)",
        // In-out - both
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
        // Bounce - for playful interactions
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        // Spring - for micro-interactions
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },

      // ============================================
      // KEYFRAMES - Enhanced animations
      // ============================================
      keyframes: {
        // Accordion
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Fade in up - for content entering
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Fade in - simple fade
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        // Scale in - for modals/popovers
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        // Shimmer - for skeletons
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        // Float - subtle floating effect
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        // Pulse glow - for FAB and CTAs
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 hsl(var(--primary) / 0.4)",
            transform: "scale(1)",
          },
          "50%": {
            boxShadow: "0 0 20px 4px hsl(var(--primary) / 0.2)",
            transform: "scale(1.02)",
          },
        },
        // Aurora - for gradient backgrounds
        aurora: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        // Spin slow - for loading icons
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        // Bounce subtle
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        // Shake - for errors
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        // Slide in from right
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        // Slide in from bottom
        "slide-in-bottom": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        // Ping
        ping: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
        // Confetti particle
        confetti: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(-100px) rotate(720deg)", opacity: "0" },
        },
      },

      // ============================================
      // ANIMATIONS - Ready to use
      // ============================================
      animation: {
        // Base
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // Fade
        "fade-in": "fade-in 0.3s ease-out forwards",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        // Scale
        "scale-in": "scale-in 0.3s ease-out forwards",
        // Shimmer for skeletons
        shimmer: "shimmer 1.5s ease-in-out infinite",
        // Float
        float: "float 4s ease-in-out infinite",
        // Pulse glow for FAB
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        // Aurora background
        aurora: "aurora 8s ease-in-out infinite",
        // Spin variations
        "spin-slow": "spin-slow 3s linear infinite",
        // Bounce
        "bounce-subtle": "bounce-subtle 1s ease-in-out infinite",
        // Shake
        shake: "shake 0.5s ease-in-out",
        // Slide
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-bottom": "slide-in-bottom 0.3s ease-out",
        // Ping
        ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
        // Confetti
        confetti: "confetti 1s ease-out forwards",
      },

      // ============================================
      // BACKDROP BLUR
      // ============================================
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "40px",
        "3xl": "64px",
      },

      // ============================================
      // Z-INDEX - Consistent layering
      // ============================================
      zIndex: {
        "0": "0",
        "10": "10",
        "20": "20",
        "30": "30",
        "40": "40",
        "50": "50", // Default overlay level
        "60": "60", // Modals
        "70": "70", // Toasts
        "80": "80", // Critical overlays
        "90": "90", // Top-most elements
        "100": "100",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
