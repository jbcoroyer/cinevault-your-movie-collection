/**
 * CineVault - Enhanced Skeleton Components
 * 
 * Composants de skeleton avec shimmer effect pour un chargement plus fluide
 * Remplace les spinners par des placeholders animés
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/**
 * Base Skeleton with shimmer effect
 */
interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
}

export const Skeleton = ({ className, shimmer = true }: SkeletonProps) => {
  return (
    <div
      className={cn(
        "bg-muted rounded-md",
        shimmer && "relative overflow-hidden",
        className
      )}
    >
      {shimmer && (
        <div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
          style={{
            animation: "shimmer 1.5s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
};

/**
 * Movie Card Skeleton
 */
export const MovieCardSkeleton = ({ 
  size = "md" 
}: { 
  size?: "sm" | "md" | "lg" 
}) => {
  const sizeClasses = {
    sm: "w-24",
    md: "w-32",
    lg: "w-40",
  };

  return (
    <div className={cn("flex-shrink-0", sizeClasses[size])}>
      {/* Poster */}
      <Skeleton className="aspect-[2/3] rounded-lg mb-2" />
      {/* Title */}
      <Skeleton className="h-4 w-full rounded mb-1" />
      {/* Year */}
      <Skeleton className="h-3 w-1/2 rounded" />
    </div>
  );
};

/**
 * Collection Movie Card Skeleton
 */
export const CollectionCardSkeleton = () => {
  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border/50">
      {/* Poster */}
      <Skeleton className="aspect-[2/3]" shimmer />
      
      {/* Content */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
};

/**
 * Movie Grid Skeleton
 */
export const MovieGridSkeleton = ({ 
  count = 8,
  columns = 4 
}: { 
  count?: number;
  columns?: number;
}) => {
  return (
    <div 
      className={cn(
        "grid gap-4",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-2 sm:grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
        columns === 5 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
        columns === 6 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <CollectionCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Movie Row Skeleton (horizontal scroll)
 */
export const MovieRowSkeleton = ({ 
  count = 6,
  size = "md"
}: { 
  count?: number;
  size?: "sm" | "md" | "lg";
}) => {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <MovieCardSkeleton size={size} />
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Section Header Skeleton
 */
export const SectionHeaderSkeleton = () => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="space-y-1">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  );
};

/**
 * User Card Skeleton
 */
export const UserCardSkeleton = () => {
  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50">
      {/* Avatar */}
      <Skeleton className="w-12 h-12 rounded-full" />
      
      {/* Info */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      
      {/* Button */}
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  );
};

/**
 * Stats Card Skeleton
 */
export const StatsCardSkeleton = () => {
  return (
    <div className="bg-card rounded-xl p-4 border border-border/50">
      <Skeleton className="w-10 h-10 rounded-lg mb-3" />
      <Skeleton className="h-7 w-16 mb-1" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
};

/**
 * Collection Header Skeleton
 */
export const CollectionHeaderSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
      
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      
      {/* Filters */}
      <div className="flex gap-2 overflow-hidden">
        <Skeleton className="h-9 w-24 rounded-full flex-shrink-0" />
        <Skeleton className="h-9 w-20 rounded-full flex-shrink-0" />
        <Skeleton className="h-9 w-28 rounded-full flex-shrink-0" />
        <Skeleton className="h-9 w-16 rounded-full flex-shrink-0" />
      </div>
    </div>
  );
};

/**
 * Movie Detail Skeleton
 */
export const MovieDetailSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Backdrop */}
      <Skeleton className="w-full aspect-video rounded-xl" />
      
      {/* Content */}
      <div className="flex gap-6">
        {/* Poster */}
        <Skeleton className="w-32 md:w-48 aspect-[2/3] rounded-xl flex-shrink-0" />
        
        {/* Info */}
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          <Skeleton className="h-20 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Valuation Dashboard Skeleton
 */
export const ValuationDashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Total value card */}
      <Skeleton className="h-32 w-full rounded-2xl" />
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      
      {/* Chart */}
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
};

/**
 * Search Results Skeleton
 */
export const SearchResultsSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="flex items-center gap-3 p-2 rounded-xl"
        >
          <Skeleton className="w-12 h-18 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Badge Grid Skeleton
 */
export const BadgeGridSkeleton = ({ count = 12 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03 }}
          className="flex flex-col items-center gap-2"
        >
          <Skeleton className="w-16 h-16 rounded-xl" />
          <Skeleton className="h-3 w-14" />
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Full Page Loading Skeleton
 */
export const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      
      {/* Hero/Stats */}
      <Skeleton className="h-40 w-full rounded-2xl" />
      
      {/* Content sections */}
      <div className="space-y-6">
        <SectionHeaderSkeleton />
        <MovieRowSkeleton count={4} />
        
        <SectionHeaderSkeleton />
        <MovieGridSkeleton count={6} columns={3} />
      </div>
    </div>
  );
};

export default Skeleton;
