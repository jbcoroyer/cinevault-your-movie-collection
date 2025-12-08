import React from "react";
import { cn } from "@/lib/utils";
import { PhysicalCondition, conditionLabels, conditionColors } from "@/services/physicalMovies";

interface ConditionBadgeProps {
  condition: PhysicalCondition;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export const ConditionBadge: React.FC<ConditionBadgeProps> = ({
  condition,
  size = "sm",
  showLabel = true,
  className,
}) => {
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium text-white",
        conditionColors[condition],
        sizeClasses[size],
        className
      )}
    >
      {showLabel && conditionLabels[condition]}
    </span>
  );
};

// Version dot uniquement (pour les vues compactes)
export const ConditionDot: React.FC<{ condition: PhysicalCondition; className?: string }> = ({
  condition,
  className,
}) => {
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full",
        conditionColors[condition],
        className
      )}
      title={conditionLabels[condition]}
    />
  );
};
