import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * GlassCard — Composant de carte glassmorphism premium
 * 
 * @description Carte avec effet verre dépoli, bordures lumineuses et hover effects.
 * Utilisable pour tous les conteneurs de l'application.
 */

const glassCardVariants = cva(
  "relative overflow-hidden rounded-2xl transition-all duration-500",
  {
    variants: {
      variant: {
        default: [
          "bg-card/80 backdrop-blur-xl",
          "border border-white/10 dark:border-white/5",
          "shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        ],
        subtle: [
          "bg-card/60 backdrop-blur-md",
          "border border-white/5",
        ],
        strong: [
          "bg-card/90 backdrop-blur-2xl saturate-150",
          "border border-white/15 dark:border-white/10",
          "shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.1)]",
          "dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)]",
        ],
        outline: [
          "bg-transparent backdrop-blur-sm",
          "border-2 border-border/50",
        ],
        gradient: [
          "backdrop-blur-xl",
          "border border-white/10",
          "bg-gradient-to-br from-card/90 via-card/70 to-card/50",
        ],
        gold: [
          "backdrop-blur-xl",
          "border border-primary/20",
          "bg-gradient-to-br from-primary/10 via-card/80 to-card/90",
          "shadow-[0_8px_32px_rgba(0,0,0,0.1),0_0_0_1px_hsl(var(--primary)/0.1)]",
        ],
      },
      hover: {
        none: "",
        lift: "hover:translate-y-[-8px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]",
        scale: "hover:scale-[1.02]",
        glow: "hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]",
        aurora: [
          "before:absolute before:inset-0 before:opacity-0 before:transition-opacity before:duration-500",
          "before:bg-[radial-gradient(circle_at_20%_50%,hsl(var(--primary)/0.15)_0%,transparent_50%),radial-gradient(circle_at_80%_50%,hsl(280_80%_60%/0.1)_0%,transparent_50%)]",
          "hover:before:opacity-100",
        ],
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4 sm:p-5",
        lg: "p-6 sm:p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: "none",
      padding: "md",
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  glow?: boolean;
  reducedMotion?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, hover, padding, glow, reducedMotion, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          glassCardVariants({ variant, hover: reducedMotion ? "none" : hover, padding }),
          glow && "shadow-glow",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

/* --- Sub-components --- */

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
GlassCardHeader.displayName = "GlassCardHeader";

const GlassCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-display text-xl font-semibold leading-tight tracking-tight",
      className
    )}
    {...props}
  />
));
GlassCardTitle.displayName = "GlassCardTitle";

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
GlassCardDescription.displayName = "GlassCardDescription";

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
GlassCardContent.displayName = "GlassCardContent";

const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
GlassCardFooter.displayName = "GlassCardFooter";

/* --- Stat Component --- */

interface GlassCardStatProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  value: number | string;
  label: string;
  variant?: "default" | "primary";
}

const GlassCardStat = React.forwardRef<HTMLDivElement, GlassCardStatProps>(
  ({ className, icon, value, label, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("h-full flex items-center justify-between", className)}
      {...props}
    >
      <div>
        <p className={cn(
          "text-3xl font-bold font-display",
          variant === "primary" && "text-primary"
        )}>
          {value}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      {icon && (
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          variant === "primary" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        )}>
          {icon}
        </div>
      )}
    </div>
  )
);
GlassCardStat.displayName = "GlassCardStat";

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
  GlassCardStat,
};