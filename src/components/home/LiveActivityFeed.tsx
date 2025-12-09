import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCommunityActivity, formatLabels, activityLabels, CommunityActivity } from "@/hooks/useCommunityActivity";
import { cn } from "@/lib/utils";
import { Star, Disc, Heart, Eye, MessageSquare, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * LiveActivityFeed — Bandeau d'activité en temps réel
 * 
 * Affiche un ticker défilant avec les dernières actions de la communauté:
 * - Films ajoutés aux collections
 * - Notes attribuées
 * - Reviews publiées
 */

interface LiveActivityFeedProps {
  className?: string;
  speed?: "slow" | "normal" | "fast";
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ 
  className,
  speed = "normal" 
}) => {
  const { activities, loading } = useCommunityActivity({ limit: 15 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const speedDuration = {
    slow: "60s",
    normal: "40s",
    fast: "25s",
  };

  if (loading) {
    return (
      <div className={cn(
        "w-full overflow-hidden py-3",
        "bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5",
        "border-y border-border/50",
        className
      )}>
        <div className="flex gap-8 px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-muted" />
              <div className="w-32 h-4 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return null;
  }

  return (
    <div 
      className={cn(
        "w-full overflow-hidden py-3",
        "bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5",
        "border-y border-border/50",
        "relative",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Live indicator */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 pr-4 bg-gradient-to-r from-background via-background to-transparent">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          Live
        </span>
      </div>

      {/* Scrolling content */}
      <div 
        ref={scrollRef}
        className="flex whitespace-nowrap"
        style={{
          animation: `scroll ${speedDuration[speed]} linear infinite`,
          animationPlayState: isPaused ? "paused" : "running",
        }}
      >
        {/* Duplicate content for seamless loop */}
        {[...activities, ...activities].map((activity, index) => (
          <ActivityItem key={`${activity.id}-${index}`} activity={activity} />
        ))}
      </div>

      {/* Gradient fade edges */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />

      {/* Animation keyframes */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

// Individual activity item
const ActivityItem: React.FC<{ activity: CommunityActivity }> = ({ activity }) => {
  const getIcon = () => {
    switch (activity.type) {
      case "physical_added":
        return <Disc className="w-4 h-4 text-purple-500" />;
      case "rated":
        return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
      case "reviewed":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "favorite":
        return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case "watched":
        return <Eye className="w-4 h-4 text-emerald-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  const getActionText = () => {
    const action = activityLabels[activity.type];
    
    if (activity.type === "physical_added" && activity.metadata.format) {
      const format = formatLabels[activity.metadata.format] || activity.metadata.format;
      return `${action} en ${format}`;
    }
    
    if (activity.type === "rated" && activity.metadata.rating) {
      return `${action} ${"★".repeat(activity.metadata.rating)}`;
    }
    
    return action;
  };

  const timeAgo = formatDistanceToNow(new Date(activity.createdAt), {
    addSuffix: false,
    locale: fr,
  });

  return (
    <div className="inline-flex items-center gap-3 px-6 py-1 group">
      {/* Icon */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-card flex items-center justify-center border border-border/50">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex items-center gap-2 text-sm">
        <Link 
          to={`/profile/${activity.userId}`}
          className="font-semibold text-foreground hover:text-primary transition-colors"
        >
          @{activity.username}
        </Link>
        <span className="text-muted-foreground">
          {getActionText()}
        </span>
        {activity.movieTitle && (
          <Link
            to={`/movie/${activity.tmdbId}`}
            className="font-medium text-foreground hover:text-primary transition-colors max-w-[200px] truncate"
          >
            {activity.movieTitle}
          </Link>
        )}
        <span className="text-xs text-muted-foreground/60">
          · {timeAgo}
        </span>
      </div>

      {/* Separator */}
      <div className="w-1 h-1 rounded-full bg-border/50 ml-2" />
    </div>
  );
};

export default LiveActivityFeed;
