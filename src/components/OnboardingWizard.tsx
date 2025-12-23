import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard";
import { toast } from "@/hooks/use-toast";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Tv,
  Film,
  Sparkles,
  User,
  Loader2,
  Crown,
  Ticket,
  Clapperboard,
  Skull,
  Ghost,
  Heart,
  Rocket,
  Search,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Constantes & Données ---

const STREAMING_SERVICES = [
  { id: "netflix", name: "Netflix", color: "from-red-600 to-red-900" },
  { id: "prime", name: "Prime Video", color: "from-blue-500 to-blue-800" },
  { id: "disney", name: "Disney+", color: "from-indigo-600 to-blue-900" },
  { id: "canal", name: "Canal+", color: "from-gray-800 to-black" },
  { id: "apple", name: "Apple TV+", color: "from-zinc-700 to-zinc-900" },
  { id: "max", name: "HBO Max", color: "from-purple-700 to-indigo-900" },
];

const GENRES = [
  { id: 28, name: "Action", icon: Zap },
  { id: 878, name: "Sci-Fi", icon: Rocket },
  { id: 27, name: "Horreur", icon: Skull },
  { id: 35, name: "Comédie", icon: Sparkles },
  { id: 18, name: "Drame", icon: Ticket },
  { id: 53, name: "Thriller", icon: Ghost },
  { id: 10749, name: "Romance", icon: Heart },
  { id: 99, name: "Documentaire", icon: Clapperboard },
];

// --- Composant Principal ---

export default function OnboardingWizard() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    streaming_services: [] as string[],
    favorite_genres: [] as number[], // IDs TMDB
  });

  // Animation state for step transitions
  const [animating, setAnimating] = useState(false);

  // Initial username pre-fill from email if available
  useEffect(() => {
    if (user?.email && !formData.username) {
      // Pré-remplir le pseudo avec la partie avant le @ de l'email
      setFormData(prev => ({ ...prev, username: user.email!.split('@')[0] }));
    }
  }, [user]);

  const handleNext = async () => {
    if (step === 1) {
      if (formData.username.length < 3) {
        toast({ title: "Erreur", description: "Le pseudo doit faire au moins 3 caractères.", variant: "destructive" });
        return;
      }
      
      // Vérification unicité username
      setIsCheckingUsername(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', formData.username)
        .neq('id', user?.id || '') // Exclure l'utilisateur actuel
        .maybeSingle();
      
      setIsCheckingUsername(false);

      if (data) {
        toast({ title: "Pseudo indisponible", description: "Ce pseudo est déjà pris.", variant: "destructive" });
        return;
      }
    }

    if (step === 3 && formData.favorite_genres.length === 0) {
       toast({ title: "Sélection requise", description: "Choisissez au moins un genre.", variant: "destructive" });
       return;
    }

    changeStep(step + 1);
  };

  const handleBack = () => {
    changeStep(step - 1);
  };

  const changeStep = (newStep: number) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setAnimating(false);
    }, 300);
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // 1. Sauvegarder le profil
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          bio: formData.bio,
          streaming_services: formData.streaming_services,
        })
        .eq('id', user.id);

      if (error) throw error;

      // 2. Marquer l'onboarding comme terminé
      localStorage.setItem(`onboarding_complete_${user.id}`, 'true');

      // 3. Refresh le contexte Auth pour avoir les nouvelles données
      await refreshProfile();

      toast({ 
        title: "Bienvenue dans le Vault !", 
        description: "Votre profil a été créé avec succès." 
      });

      navigate("/");
    } catch (error: any) {
      console.error(error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Rendu des Étapes ---

  const renderStep1_Identity = () => (
    <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-display font-bold">Qui êtes-vous ?</h2>
        <p className="text-muted-foreground text-sm">Créez votre identité de collectionneur.</p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border-2 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <User className="w-10 h-10 text-amber-500" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Pseudo</Label>
          <div className="relative">
            <Input 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="Cinephile42"
              className="bg-background/50 border-white/10 focus:border-amber-500/50 pl-10"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Bio (Optionnel)</Label>
          <Textarea 
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            placeholder="J'adore les films de Tarantino et la science-fiction..."
            className="bg-background/50 border-white/10 focus:border-amber-500/50 resize-none h-24"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2_Platforms = () => (
    <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-display font-bold">Vos Plateformes</h2>
        <p className="text-muted-foreground text-sm">Où regardez-vous vos films habituellement ?</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {STREAMING_SERVICES.map((service) => {
          const isSelected = formData.streaming_services.includes(service.id);
          return (
            <button
              key={service.id}
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  streaming_services: isSelected 
                    ? prev.streaming_services.filter(id => id !== service.id)
                    : [...prev.streaming_services, service.id]
                }));
              }}
              className={cn(
                "relative h-20 rounded-xl border transition-all duration-300 overflow-hidden group",
                isSelected 
                  ? "border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]" 
                  : "border-white/5 hover:border-white/20 bg-card/40"
              )}
            >
              {/* Background gradient on select */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300",
                service.color,
                isSelected ? "opacity-20" : "group-hover:opacity-10"
              )} />
              
              <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
                <Tv className={cn(
                  "w-6 h-6 transition-colors",
                  isSelected ? "text-amber-500" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-foreground" : "text-muted-foreground"
                )}>
                  {service.name}
                </span>
              </div>
              
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-black font-bold" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep3_Genres = () => (
    <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-display font-bold">Vos Goûts</h2>
        <p className="text-muted-foreground text-sm">Sélectionnez vos 3 genres favoris.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {GENRES.map((genre) => {
          const isSelected = formData.favorite_genres.includes(genre.id);
          const isMaxed = formData.favorite_genres.length >= 3 && !isSelected;
          const Icon = genre.icon;

          return (
            <button
              key={genre.id}
              disabled={isMaxed}
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  favorite_genres: isSelected 
                    ? prev.favorite_genres.filter(id => id !== genre.id)
                    : [...prev.favorite_genres, genre.id]
                }));
              }}
              className={cn(
                "flex flex-col items-center p-4 rounded-xl border transition-all duration-200",
                isSelected 
                  ? "bg-amber-500/10 border-amber-500 text-amber-500" 
                  : isMaxed 
                    ? "opacity-50 cursor-not-allowed border-transparent bg-muted/20"
                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="w-6 h-6 mb-2" />
              <span className="text-xs font-medium">{genre.name}</span>
            </button>
          );
        })}
      </div>
      
      <p className="text-center text-xs text-muted-foreground mt-4">
        {formData.favorite_genres.length} / 3 sélectionnés
      </p>
    </div>
  );

  const renderStep4_Initiation = () => (
    <div className="flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 fade-in duration-700">
      <div className="space-y-2">
        <h2 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200 animate-shimmer bg-[length:200%_auto]">
          Accès Autorisé
        </h2>
        <p className="text-muted-foreground">Bienvenue dans l'élite, {formData.username}.</p>
      </div>

      {/* Member Card */}
      <div className="relative w-full max-w-sm aspect-[1.586/1] perspective-1000 group">
        <div className="absolute inset-0 bg-amber-500/20 rounded-2xl blur-2xl animate-pulse" />
        
        <GlassCard 
          variant="gold" 
          className="w-full h-full flex flex-col justify-between p-6 relative overflow-hidden border-amber-500/30 transform transition-transform group-hover:scale-105 duration-500"
        >
          {/* Card Shine */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />
          
          <div className="flex justify-between items-start z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Film className="w-6 h-6 text-black" />
              </div>
              <div className="text-left">
                <p className="font-display font-bold text-lg leading-none">CineVault</p>
                <p className="text-[10px] text-amber-500/80 tracking-widest uppercase">Member Card</p>
              </div>
            </div>
            <Crown className="w-6 h-6 text-amber-500 animate-bounce" />
          </div>

          <div className="text-left z-10 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Titulaire</p>
            <p className="font-display text-2xl font-bold truncate">{formData.username}</p>
          </div>

          <div className="flex justify-between items-end z-10">
             <div className="flex gap-2">
               {formData.streaming_services.slice(0, 3).map(s => (
                 <div key={s} className="w-2 h-2 rounded-full bg-white/50" />
               ))}
             </div>
             <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold">
               NIVEAU 1
             </div>
          </div>
        </GlassCard>
      </div>

      <div className="space-y-4 w-full">
         <p className="text-sm text-muted-foreground animate-pulse">Configuration terminée.</p>
         <Button 
            onClick={handleFinish} 
            size="lg" 
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all hover:scale-[1.02]"
            disabled={isLoading}
         >
           {isLoading ? (
             <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Initialisation...</>
           ) : (
             "Entrer dans le Vault"
           )}
         </Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-3xl">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <GlassCard className="w-full max-w-lg overflow-hidden border-white/10 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-muted">
          <div 
            className="h-full bg-amber-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
           {/* Step Content with basic transition handling */}
           <div className={cn("transition-opacity duration-300", animating ? "opacity-0" : "opacity-100")}>
              {step === 1 && renderStep1_Identity()}
              {step === 2 && renderStep2_Platforms()}
              {step === 3 && renderStep3_Genres()}
              {step === 4 && renderStep4_Initiation()}
           </div>
        </div>

        {/* Footer Navigation (Hide on Step 4) */}
        {step < 4 && (
          <div className="p-6 border-t border-white/5 flex justify-between bg-black/20">
            <Button 
              variant="ghost" 
              onClick={handleBack} 
              disabled={step === 1}
              className={cn(step === 1 && "invisible")}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={isCheckingUsername}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {isCheckingUsername ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
