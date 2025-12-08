import React from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 animate-fade-in", className)}>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50" />
        <div className="relative w-20 h-20 bg-muted/50 rounded-2xl border border-border flex items-center justify-center shadow-sm">
          <Icon className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
        </div>
      </div>
      
      <h3 className="text-xl font-serif font-semibold mb-2 text-foreground text-center">
        {title}
      </h3>
      
      <p className="text-muted-foreground text-center max-w-sm mb-8 text-balance leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction} size="lg" className="shadow-glow-sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
