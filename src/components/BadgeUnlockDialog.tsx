import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (open) {
      setShowContent(false);
      setShowParticles(false);
      const contentTimer = setTimeout(() => setShowContent(true), 100);
      const particleTimer = setTimeout(() => setShowParticles(true), 300);
      return () => {
        clearTimeout(contentTimer);
        clearTimeout(particleTimer);
      };
    } else {
      // Reset states when dialog closes
      setShowContent(false);
      setShowParticles(false);
    }
  }, [open]);

  if (!badge) return null;

  const Icon = badge.icon;

  // Handle button click - call onClose directly
  const handleButtonClick = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm border-none bg-transparent shadow-none p-0 overflow-visible"
        onPointerDownOutside={(e) => {
          // Prevent closing on outside click if needed, or let it close via onOpenChange
          e.preventDefault();
          onClose();
        }}
        onEscapeKeyDown={() => {
          onClose();
        }}
      >
        <div className="relative bg-card border-2 border-primary/30 rounded-2xl shadow-2xl overflow-hidden">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/5 to-background animate-pulse" />

          {/* Glowing orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/30 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-bounce"
            style={{ animationDuration: "3s" }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-yellow-500/20 rounded-full blur-2xl animate-bounce"
            style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}
          />

          {/* Floating particles */}
          {showParticles && (
            <>
              <div
                className="absolute top-8 left-8 text-yellow-400 text-2xl animate-bounce"
                style={{ animationDuration: "1.5s" }}
              >
                ✦
              </div>
              <div
                className="absolute top-12 right-10 text-primary text-xl animate-bounce"
                style={{ animationDuration: "2s", animationDelay: "0.3s" }}
              >
                ★
              </div>
              <div
                className="absolute bottom-20 left-12 text-purple-400 text-lg animate-bounce"
                style={{ animationDuration: "1.8s", animationDelay: "0.6s" }}
              >
                ●
              </div>
              <div
                className="absolute bottom-16 right-8 text-blue-400 text-2xl animate-bounce"
                style={{ animationDuration: "2.2s", animationDelay: "0.2s" }}
              >
                ◆
              </div>
              <div className="absolute top-1/3 left-6 text-amber-300 text-sm animate-ping">✨</div>
              <div
                className="absolute top-1/3 right-6 text-amber-300 text-sm animate-ping"
                style={{ animationDelay: "0.5s" }}
              >
                ✨
              </div>
            </>
          )}

          <div className="relative p-8 flex flex-col items-center text-center space-y-6">
            <DialogHeader>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary animate-in fade-in zoom-in duration-500">
                  Badge Débloqué !
                </DialogTitle>
                <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" style={{ animationDelay: "0.5s" }} />
              </div>
            </DialogHeader>

            {/* Badge Animation */}
            <div
              className={cn(
                "relative transform transition-all duration-700",
                showContent ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-180 opacity-0",
              )}
              style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
              {/* Rotating ring */}
              <div
                className="absolute inset-0 -m-4 rounded-full border-4 border-dashed border-primary/30 animate-spin"
                style={{ animationDuration: "8s" }}
              />

              {/* Badge container with glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/40 rounded-3xl blur-xl animate-pulse" />
                <div className="relative w-36 h-36 rounded-3xl bg-gradient-to-tr from-background via-card to-muted border-4 border-primary/40 flex items-center justify-center shadow-2xl">
                  <Icon className={cn("w-20 h-20 drop-shadow-lg", badge.color)} />
                </div>
              </div>

              {/* XP Badge */}
              <div
                className={cn(
                  "absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-500 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-bold shadow-lg whitespace-nowrap flex items-center gap-1.5 transition-all duration-500",
                  showContent ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-75",
                )}
                style={{ transitionDelay: "0.3s" }}
              >
                <Zap className="w-4 h-4 fill-current" />+{badge.xp} XP
              </div>
            </div>

            {/* Text content */}
            <div
              className={cn(
                "space-y-2 transition-all duration-500",
                showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
              )}
              style={{ transitionDelay: "0.4s" }}
            >
              <h3 className="text-xl font-bold">{badge.title}</h3>
              <p className="text-muted-foreground text-sm">{badge.description}</p>
            </div>

            {/* Button */}
            <Button
              onClick={handleButtonClick}
              className={cn(
                "w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transition-all duration-500 shadow-lg",
                showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
              )}
              style={{ transitionDelay: "0.5s" }}
              size="lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Génial !
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
