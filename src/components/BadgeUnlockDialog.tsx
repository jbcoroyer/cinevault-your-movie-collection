import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Zap, X } from "lucide-react";
import { cn } from "../lib/utils";

// On réutilise le type défini ailleurs ou on le définit ici pour les props
interface BadgeProps {
  id: string;
  title: string;
  description: string;
  xp: number;
  icon: React.ElementType;
  color: string;
}

interface BadgeUnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badge: BadgeProps | null;
  onClose: () => void;
}

export function BadgeUnlockDialog({ open, onOpenChange, badge, onClose }: BadgeUnlockDialogProps) {
  const [showContent, setShowContent] = useState(false);

  // Reset animation state when dialog opens
  useEffect(() => {
    if (open) {
      setShowContent(false);
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!badge) return null;

  const Icon = badge.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm border-none bg-transparent shadow-none p-0 overflow-visible">
        <div className="relative bg-card border-2 border-primary/20 rounded-xl shadow-2xl overflow-hidden">
          {/* Effet de fond rayonnant */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background" />
          
          {/* Cercles décoratifs animés */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          
          <div className="relative p-6 flex flex-col items-center text-center space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 animate-in fade-in zoom-in duration-500">
                Badge Débloqué !
              </DialogTitle>
            </DialogHeader>

            {/* Animation du Badge */}
            <div className={cn(
              "relative transform transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)",
              showContent ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-180 opacity-0"
            )}>
              {/* Étoiles / Particules décoratives */}
              <div className="absolute -top-4 -right-4 text-yellow-400 animate-bounce delay-100">✦</div>
              <div className="absolute -bottom-2 -left-6 text-primary animate-bounce delay-300">★</div>
              <div className="absolute top-0 -left-4 text-purple-400 animate-pulse">●</div>

              <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-background to-muted border-4 border-primary/30 flex items-center justify-center shadow-xl">
                <Icon className={cn("w-16 h-16 drop-shadow-md", badge.color)} />
              </div>
              
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" />
                +{badge.xp} XP
              </div>
            </div>

            {/* Textes */}
            <div className={cn(
              "space-y-2 transition-all duration-500 delay-300",
              showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}>
              <h3 className="text-xl font-bold">{badge.title}</h3>
              <p className="text-muted-foreground text-sm">
                {badge.description}
              </p>
            </div>

            {/* Bouton */}
            <Button 
              onClick={onClose} 
              className={cn(
                "w-full transition-all duration-500 delay-500",
                showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}
              size="lg"
            >
              Génial !
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
