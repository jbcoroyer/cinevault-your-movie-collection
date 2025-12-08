import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * BentoGrid — Système de grille asymétrique inspiré des widgets Apple
 * 
 * @description Crée des layouts visuellement riches avec des cartes de tailles variées.
 * Parfait pour dashboards, landing pages et sections d'accueil.
 * 
 * @example
 * <BentoGrid>
 *   <BentoItem size="featured">Hero content</BentoItem>
 *   <BentoItem size="md">Widget 1</BentoItem>
 *   <BentoItem size="sm">Widget 2</BentoItem>
 * </BentoGrid>
 */

/* --- Grid Container --- */

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nombre de colonnes de base (4, 6 ou 12) */
  cols?: 4 | 6 | 12;
  /** Espacement entre les items */
  gap?: "sm" | "md" | "lg";
}

const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  ({ className, cols = 12, gap = "md", children, ...props }, ref) => {
    const gapClasses = {
      sm: "gap-2 sm:gap-3",
      md: "gap-3 sm:gap-4",
      lg: "gap-4 sm:gap-6",
    };

    const colClasses = {
      4: "grid-cols-2 sm:grid-cols-4",
      6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-6",
      12: "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "grid auto-rows-[minmax(80px,auto)] sm:auto-rows-[minmax(100px,auto)]",
          colClasses[cols],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BentoGrid.displayName = "BentoGrid";

/* --- Grid Item --- */

const bentoItemVariants = cva(
  "relative overflow-hidden rounded-2xl transition-all duration-500",
  {
    variants: {
      size: {
        sm: "col-span-1 row-span-1",
        md: "col-span-1 row-span-2 sm:col-span-2",
        lg: "col-span-2 row-span-2",
        xl: "col-span-2 row-span-3 sm:col-span-3",
        wide: "col-span-2 row-span-1 sm:col-span-4",
        tall: "col-span-1 row-span-3 sm:col-span-2",
        featured: "col-span-2 row-span-3 sm:col-span-4 md:col-span-6 lg:col-span-8",
        hero: "col-span-2 row-span-4 sm:col-span-4 md:col-span-8 lg:col-span-8",
      },
      variant: {
        default: [
          "bg-card/80 backdrop-blur-xl",
          "border border-white/10 dark:border-white/5",
          "shadow-[0_4px_20px_rgba(0,0,0,0.06)]",
          "dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
        ],
        glass: [
          "bg-card/60 backdrop-blur-2xl",
          "border border-white/15 dark:border-white/8",
          "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
        ],
        solid: "bg-card border border-border",
        gradient: [
          "bg-gradient-to-br from-card via-card/90 to-muted/50",
          "border border-white/10",
        ],
        primary: [
          "bg-gradient-to-br from-primary to-primary/80",
          "text-primary-foreground",
          "shadow-glow-sm",
        ],
        image: "bg-cover bg-center",
        outline: "bg-transparent border-2 border-dashed border-border/50",
      },
      interactive: {
        true: [
          "cursor-pointer",
          "hover:translate-y-[-4px] hover:shadow-[0_12px_30px_rgba(0,0,0,0.12)]",
          "dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.4)]",
          "active:scale-[0.98]",
        ],
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
      interactive: false,
    },
  }
);

export interface BentoItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bentoItemVariants> {
  /** URL d'image de fond (pour variant="image") */
  backgroundImage?: string;
  /** Overlay gradient sur l'image */
  overlay?: boolean;
  /** Animation d'entrée avec délai (en ms) */
  animationDelay?: number;
}

const BentoItem = React.forwardRef<HTMLDivElement, BentoItemProps>(
  (
    {
      className,
      size,
      variant,
      interactive,
      backgroundImage,
      overlay = true,
      animationDelay,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const combinedStyle: React.CSSProperties = {
      ...style,
      ...(backgroundImage && { backgroundImage: `url(${backgroundImage})` }),
      ...(animationDelay !== undefined && { animationDelay: `${animationDelay}ms` }),
    };

    return (
      <div
        ref={ref}
        className={cn(
          bentoItemVariants({ size, variant, interactive }),
          animationDelay !== undefined && "opacity-0 animate-fade-in-up",
          className
        )}
        style={combinedStyle}
        {...props}
      >
        {/* Overlay gradient pour les images */}
        {variant === "image" && overlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        )}
        
        {/* Contenu */}
        <div className={cn("relative z-10 h-full", variant === "image" && "flex flex-col justify-end")}>
          {children}
        </div>
      </div>
    );
  }
);
BentoItem.displayName = "BentoItem";

/* --- Bento Content Helpers --- */

const BentoContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { padding?: "sm" | "md" | "lg" }
>(({ className, padding = "md", ...props }, ref) => {
  const paddingClasses = {
    sm: "p-3",
    md: "p-4 sm:p-5",
    lg: "p-5 sm:p-6 md:p-8",
  };

  return (
    <div
      ref={ref}
      className={cn("h-full flex flex-col", paddingClasses[padding], className)}
      {...props}
    />
  );
});
BentoContent.displayName = "BentoContent";

const BentoIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    color?: "default" | "primary" | "muted";
  }
>(({ className, color = "default", children, ...props }, ref) => {
  const colorClasses = {
    default: "bg-muted text-foreground",
    primary: "bg-primary/15 text-primary",
    muted: "bg-muted/50 text-muted-foreground",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center",
        "transition-transform duration-300 group-hover:scale-110",
        colorClasses[color],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
BentoIcon.displayName = "BentoIcon";

const BentoLabel = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em]",
      "text-primary font-accent",
      className
    )}
    {...props}
  />
));
BentoLabel.displayName = "BentoLabel";

const BentoTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-display text-lg sm:text-xl md:text-2xl font-semibold leading-tight",
      className
    )}
    {...props}
  />
));
BentoTitle.displayName = "BentoTitle";

const BentoValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "font-stats text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight",
      className
    )}
    {...props}
  />
));
BentoValue.displayName = "BentoValue";

const BentoDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground mt-1", className)}
    {...props}
  />
));
BentoDescription.displayName = "BentoDescription";

export {
  BentoGrid,
  BentoItem,
  BentoContent,
  BentoIcon,
  BentoLabel,
  BentoTitle,
  BentoValue,
  BentoDescription,
};
