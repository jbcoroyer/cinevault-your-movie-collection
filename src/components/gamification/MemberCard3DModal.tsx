/**
 * Modal 3D interactive pour la carte membre CineVault
 * Permet de faire tourner la carte, voir le dos, etc.
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Sparkles, Film, Zap, Crown, Star, Calendar, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { getXpProgress, getTitleForLevel } from "@/data/videoClubData";

interface MemberCard3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  avatarUrl?: string;
  totalXp: number;
  movieCount: number;
  joinDate?: string;
  equippedTitle?: string | null;
  equippedFrame?: string | null;
  equippedTheme?: string | null;
  badgeCount?: number;
}

export function MemberCard3DModal({
  isOpen,
  onClose,
  username,
  avatarUrl,
  totalXp,
  movieCount,
  joinDate,
  equippedTitle,
  equippedFrame,
  equippedTheme,
  badgeCount = 0,
}: MemberCard3DModalProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const lastPosition = useRef({ x: 0, y: 0 });

  const xpProgress = getXpProgress(totalXp);
  const currentLevel = xpProgress.level;
  const progressPercent = xpProgress.percentage;
  const defaultTitle = getTitleForLevel(currentLevel);
  const displayTitle = equippedTitle || defaultTitle;

  const hasGoldEffect = equippedFrame === 'frame_gold' || equippedTheme === 'theme_golden';
  const hasHolographic = equippedFrame === 'frame_neon' || equippedFrame === 'frame_collector';

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastPosition.current.x;
    const deltaY = e.clientY - lastPosition.current.y;
    
    setRotation(prev => ({
      x: Math.max(-30, Math.min(30, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5,
    }));
    
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.touches[0].clientX - lastPosition.current.x;
    const deltaY = e.touches[0].clientY - lastPosition.current.y;
    
    setRotation(prev => ({
      x: Math.max(-30, Math.min(30, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5,
    }));
    
    lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
    setRotation({ x: 0, y: isFlipped ? 0 : 180 });
  };

  const resetRotation = () => {
    setRotation({ x: 0, y: isFlipped ? 180 : 0 });
  };

  const memberSince = joinDate ? new Date(joinDate).getFullYear() : 2024;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); flipCard(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-videoclub-cyan/20 border border-videoclub-cyan/30 text-videoclub-cyan font-mono text-sm hover:bg-videoclub-cyan/30 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retourner
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); resetRotation(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white font-mono text-sm hover:bg-white/20 transition-colors"
            >
              Réinitialiser
            </button>
          </div>

          {/* Instruction */}
          <p className="absolute top-8 left-1/2 -translate-x-1/2 text-white/50 font-mono text-sm">
            Glissez pour faire tourner la carte
          </p>

          {/* 3D Card Container */}
          <div
            className="relative cursor-grab active:cursor-grabbing"
            style={{ perspective: "1500px" }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setIsDragging(false)}
          >
            <motion.div
              className="relative w-[340px] h-[480px] sm:w-[380px] sm:h-[540px]"
              style={{ transformStyle: "preserve-3d" }}
              animate={{
                rotateX: rotation.x,
                rotateY: rotation.y,
              }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              {/* FRONT SIDE */}
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl overflow-hidden border-2",
                  "bg-gradient-to-br from-videoclub-bg via-videoclub-surface to-videoclub-bg",
                  hasGoldEffect ? "border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.4)]" : "border-videoclub-cyan/50",
                  hasHolographic && "shadow-[0_0_40px_rgba(217,70,239,0.4)]"
                )}
                style={{ backfaceVisibility: "hidden" }}
              >
                {/* Holographic overlay */}
                {hasHolographic && (
                  <div 
                    className="absolute inset-0 pointer-events-none z-10 mix-blend-overlay opacity-40"
                    style={{
                      background: `linear-gradient(${rotation.y}deg, 
                        rgba(255,0,128,0.4) 0%, 
                        rgba(0,255,255,0.4) 25%, 
                        rgba(255,255,0,0.4) 50%, 
                        rgba(128,0,255,0.4) 75%, 
                        rgba(255,0,128,0.4) 100%)`
                    }}
                  />
                )}

                {/* Scanlines */}
                <div className="absolute inset-0 pointer-events-none opacity-5">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
                    }}
                  />
                </div>

                {/* Header glow */}
                <div className={cn(
                  "h-2",
                  hasGoldEffect 
                    ? "bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"
                    : "bg-gradient-to-r from-videoclub-cyan via-videoclub-magenta to-videoclub-cyan"
                )} />

                <div className="p-6 relative z-20 h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Film className={cn("w-6 h-6", hasGoldEffect ? "text-yellow-500" : "text-videoclub-cyan")} />
                      <span className="font-mono text-sm text-muted-foreground tracking-widest uppercase">
                        CineVault Club
                      </span>
                    </div>
                    <div className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase",
                      hasGoldEffect 
                        ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                        : "bg-videoclub-cyan/20 text-videoclub-cyan border border-videoclub-cyan/30"
                    )}>
                      {currentLevel >= 10 ? "VIP" : currentLevel >= 5 ? "Pro" : "Member"}
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="flex justify-center mb-6">
                    <div className={cn(
                      "w-28 h-28 rounded-2xl overflow-hidden border-4",
                      hasGoldEffect ? "border-yellow-500" : "border-videoclub-cyan/50"
                    )}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-videoclub-surface flex items-center justify-center">
                          <span className={cn("text-4xl font-display font-bold", hasGoldEffect ? "text-yellow-500" : "text-videoclub-cyan")}>
                            {username?.[0]?.toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Username & Title */}
                  <div className="text-center mb-6">
                    <h2 className="font-display font-bold text-2xl text-foreground mb-2">
                      {username}
                    </h2>
                    <div className="flex items-center justify-center gap-2">
                      <Crown className={cn("w-5 h-5", hasGoldEffect ? "text-yellow-500" : "text-videoclub-gold")} />
                      <span className={cn("text-base font-mono font-semibold", hasGoldEffect ? "text-yellow-500" : "text-videoclub-gold")}>
                        {displayTitle}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                      <Film className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-lg font-mono font-bold text-foreground">{movieCount}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">Films</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                      <Zap className={cn("w-5 h-5 mx-auto mb-1", hasGoldEffect ? "text-yellow-500" : "text-videoclub-magenta")} />
                      <p className="text-lg font-mono font-bold text-foreground">{currentLevel}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">Niveau</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                      <Trophy className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-lg font-mono font-bold text-foreground">{badgeCount}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">Badges</p>
                    </div>
                  </div>

                  {/* XP Bar */}
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-muted-foreground">{totalXp.toLocaleString()} XP</span>
                      <span className="text-xs font-mono text-muted-foreground">Niv. {currentLevel + 1}</span>
                    </div>
                    <div className="h-3 bg-videoclub-surface/50 rounded-full overflow-hidden border border-white/10">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          hasGoldEffect 
                            ? "bg-gradient-to-r from-yellow-600 to-yellow-400"
                            : "bg-gradient-to-r from-videoclub-cyan to-videoclub-magenta"
                        )}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Barcode */}
                <div className="h-8 px-6 pb-3 flex items-end gap-0.5">
                  {[...Array(60)].map((_, i) => (
                    <div
                      key={i}
                      className={cn("flex-1 rounded-t-sm", hasGoldEffect ? "bg-yellow-500/30" : "bg-videoclub-cyan/30")}
                      style={{ height: `${Math.random() * 100}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* BACK SIDE */}
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl overflow-hidden border-2",
                  "bg-gradient-to-br from-videoclub-bg via-videoclub-surface to-videoclub-bg",
                  hasGoldEffect ? "border-yellow-500" : "border-videoclub-cyan/50"
                )}
                style={{ 
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)"
                }}
              >
                {/* Pattern background */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)`,
                    backgroundSize: '20px 20px',
                  }}
                />

                <div className="p-6 h-full flex flex-col relative z-10">
                  {/* Logo */}
                  <div className="flex justify-center mb-8 mt-4">
                    <div className="flex items-center gap-3">
                      <Film className={cn("w-10 h-10", hasGoldEffect ? "text-yellow-500" : "text-videoclub-cyan")} />
                      <div>
                        <h3 className="font-display font-bold text-xl text-foreground">CineVault</h3>
                        <p className="text-xs font-mono text-muted-foreground tracking-wider">COLLECTOR'S CLUB</p>
                      </div>
                    </div>
                  </div>

                  {/* Member Info */}
                  <div className="space-y-4 flex-1">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs font-mono text-muted-foreground mb-1">MEMBRE DEPUIS</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-videoclub-cyan" />
                        <p className="font-mono text-foreground">{memberSince}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs font-mono text-muted-foreground mb-1">EXPERIENCE TOTALE</p>
                      <div className="flex items-center gap-2">
                        <Zap className={cn("w-4 h-4", hasGoldEffect ? "text-yellow-500" : "text-videoclub-magenta")} />
                        <p className="font-mono text-foreground">{totalXp.toLocaleString()} XP</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs font-mono text-muted-foreground mb-1">COLLECTION</p>
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-videoclub-cyan" />
                        <p className="font-mono text-foreground">{movieCount} films physiques</p>
                      </div>
                    </div>

                    {hasHolographic && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/30">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-fuchsia-400" />
                          <p className="font-mono text-sm text-fuchsia-400">Édition Holographique</p>
                        </div>
                      </div>
                    )}

                    {hasGoldEffect && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <p className="font-mono text-sm text-yellow-500">Édition Gold</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QR Code placeholder */}
                  <div className="mt-auto flex justify-center">
                    <div className="w-24 h-24 bg-white rounded-lg p-2">
                      <div className="w-full h-full bg-videoclub-bg rounded grid grid-cols-5 gap-0.5 p-1">
                        {[...Array(25)].map((_, i) => (
                          <div 
                            key={i} 
                            className={cn("rounded-sm", Math.random() > 0.5 ? "bg-white" : "bg-videoclub-bg")}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
