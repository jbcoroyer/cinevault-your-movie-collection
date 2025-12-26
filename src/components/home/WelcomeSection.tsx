/**
 * CineVault — Welcome Section avec Onboarding Guidé
 *
 * Phase 3: Optimisation Zero State
 * - Étapes guidées pour les nouveaux utilisateurs
 * - Incitation au premier scan
 * - Progress tracker visuel
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Scan,
  ListPlus,
  Users,
  Check,
  ChevronRight,
  Sparkles,
  Film,
  Star,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// Types
// ============================================

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: string;
  actionPath?: string;
  isCompleted: boolean;
  xpReward: number;
}

// ============================================
// Onboarding Progress Component
// ============================================

interface OnboardingProgressProps {
  steps: OnboardingStep[];
  currentStep: number;
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  steps,
  currentStep,
}) => {
  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
          />
        </div>
        <span className="text-sm text-white/60 font-medium">
          {completedCount}/{steps.length}
        </span>
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-1.5",
              step.isCompleted
                ? "text-amber-500"
                : index === currentStep
                  ? "text-white"
                  : "text-white/30"
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                step.isCompleted
                  ? "bg-amber-500 text-black"
                  : index === currentStep
                    ? "bg-white/20 text-white"
                    : "bg-white/10 text-white/40"
              )}
            >
              {step.isCompleted ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                index + 1
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// Onboarding Step Card
// ============================================

interface StepCardProps {
  step: OnboardingStep;
  isActive: boolean;
  onAction: () => void;
}

const StepCard: React.FC<StepCardProps> = ({ step, isActive, onAction }) => {
  const Icon = step.icon;

  if (step.isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-4 p-4 rounded-xl",
          "bg-amber-500/10 border border-amber-500/30"
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Check className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-amber-500">{step.title}</p>
          <p className="text-sm text-amber-500/70">Complété</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">
          +{step.xpReward} XP
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isActive ? { scale: 1.02 } : {}}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl transition-all",
        isActive
          ? "bg-white/10 border border-white/20 cursor-pointer"
          : "bg-white/5 border border-white/10 opacity-60"
      )}
      onClick={isActive ? onAction : undefined}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          isActive ? "bg-white/20" : "bg-white/10"
        )}
      >
        <Icon className={cn("w-6 h-6", isActive ? "text-white" : "text-white/50")} />
      </div>
      <div className="flex-1">
        <p className={cn("font-medium", isActive ? "text-white" : "text-white/60")}>
          {step.title}
        </p>
        <p className={cn("text-sm", isActive ? "text-white/60" : "text-white/40")}>
          {step.description}
        </p>
      </div>
      {isActive && (
        <Button
          size="sm"
          className="bg-white text-black hover:bg-white/90 rounded-full gap-2"
        >
          {step.action}
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
};

// ============================================
// Welcome Section Component
// ============================================

interface WelcomeSectionProps {
  className?: string;
  onScanClick?: () => void;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  className,
  onScanClick,
}) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  // Check onboarding progress
  useEffect(() => {
    if (!user) return;

    const checkProgress = async () => {
      setLoading(true);
      try {
        // Check collection
        const { count: collectionCount } = await supabase
          .from("physical_movies")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Check watchlist
        const { count: watchlistCount } = await supabase
          .from("user_movies")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "watchlist");

        // Check follows
        const { count: followsCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", user.id);

        setSteps([
          {
            id: "scan",
            title: "Scanne ton premier film",
            description: "Utilise la caméra pour scanner un DVD ou Blu-ray",
            icon: Scan,
            action: "Scanner",
            isCompleted: (collectionCount || 0) > 0,
            xpReward: 50,
          },
          {
            id: "watchlist",
            title: "Crée ta watchlist",
            description: "Ajoute des films que tu veux voir",
            icon: ListPlus,
            action: "Ajouter",
            actionPath: "/search",
            isCompleted: (watchlistCount || 0) > 0,
            xpReward: 25,
          },
          {
            id: "follow",
            title: "Suis des collectionneurs",
            description: "Découvre les collections d'autres passionnés",
            icon: Users,
            action: "Explorer",
            actionPath: "/feed",
            isCompleted: (followsCount || 0) > 0,
            xpReward: 25,
          },
        ]);
      } catch (error) {
        console.error("Error checking onboarding progress:", error);
      } finally {
        setLoading(false);
      }
    };

    checkProgress();
  }, [user]);

  // Calculate current step
  const currentStepIndex = steps.findIndex((s) => !s.isCompleted);
  const allCompleted = steps.every((s) => s.isCompleted);

  // Handle step action
  const handleStepAction = (step: OnboardingStep) => {
    if (step.id === "scan" && onScanClick) {
      onScanClick();
    } else if (step.actionPath) {
      navigate(step.actionPath);
    }
  };

  if (loading) {
    return (
      <div className={cn("animate-pulse space-y-4", className)}>
        <div className="h-8 bg-white/10 rounded w-1/2" />
        <div className="h-24 bg-white/5 rounded-xl" />
      </div>
    );
  }

  // All steps completed - show success state
  if (allCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl p-8",
          "bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent",
          "border border-amber-500/30",
          className
        )}
      >
        {/* Background sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
                x: Math.random() * 100,
                y: Math.random() * 100,
              }}
              transition={{
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            >
              <Sparkles className="w-4 h-4 text-amber-500/50" />
            </motion.div>
          ))}
        </div>

        <div className="relative flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Star className="w-8 h-8 text-white fill-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">
              Bienvenue dans le Vault ! 🎉
            </h3>
            <p className="text-white/60">
              Tu as terminé l'initiation. Continue à explorer et agrandir ta collection.
            </p>
          </div>
          <Button
            onClick={() => navigate("/collection")}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-full gap-2"
          >
            Ma Collection
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            Bienvenue, {profile?.username || "Collectionneur"} !
          </h2>
          <p className="text-white/50 text-sm">
            Complete ces étapes pour démarrer ton aventure
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-500">+100 XP</span>
        </div>
      </div>

      {/* Progress */}
      <OnboardingProgress steps={steps} currentStep={currentStepIndex} />

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            isActive={index === currentStepIndex}
            onAction={() => handleStepAction(step)}
          />
        ))}
      </div>
    </div>
  );
};

export default WelcomeSection;
