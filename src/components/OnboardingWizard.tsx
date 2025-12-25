import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Ticket,
  Clapperboard,
  Skull,
  Ghost,
  Heart,
  Rocket,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Constantes & Données ---

const STREAMING_SERVICES = [
  { id: "netflix", name: "Netflix" },
  { id: "prime", name: "Prime Video" },
  { id: "disney", name: "Disney+" },
  { id: "canal", name: "Canal+" },
  { id: "apple", name: "Apple TV+" },
  { id: "max", name: "HBO Max" },
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
    favorite_genres: [] as number[],
  });

  // Animation state for step transitions
  const [animating, setAnimating] = useState(false);

  // Initial username pre-fill from email if available
  useEffect(() => {
    if (user?.email && !formData.username) {
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
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', formData.username)
        .neq('id', user?.id || '')
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
    }, 200);
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Sauvegarder le profil ET marquer l'onboarding comme terminé en DB
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          bio: formData.bio,
          streaming_services: formData.streaming_services,
          onboarding_complete: true, // Sauvegarde en DB au lieu de localStorage
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh le contexte Auth pour avoir les nouvelles données
      await refreshProfile();

      toast({ 
        title: "Bienvenue dans le Vault", 
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
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-medium tracking-tight">Qui êtes-vous ?</h2>
        <p className="text-muted-foreground text-sm">Créez votre identité de collectionneur.</p>
      </div>

      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <User className="w-8 h-8 text-white/60" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Pseudo</Label>
          <Input 
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            placeholder="Cinephile42"
            className="bg-white/5 border-white/10 focus:border-white/30 h-12"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bio (Optionnel)</Label>
          <Textarea 
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            placeholder="J'adore les films de Tarantino et la science-fiction..."
            className="bg-white/5 border-white/10 focus:border-white/30 resize-none h-24"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2_Platforms = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-medium tracking-tight">Vos Plateformes</h2>
        <p className="text-muted-foreground text-sm">Où regardez-vous vos films ?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
                "relative h-16 border transition-all duration-200 flex items-center justify-center gap-3",
                isSelected 
                  ? "bg-white text-black border-white" 
                  : "bg-white/5 border-white/10 hover:border-white/30 text-white"
              )}
            >
              <Tv className="w-4 h-4" />
              <span className="text-sm font-medium">{service.name}</span>
              
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep3_Genres = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-medium tracking-tight">Vos Goûts</h2>
        <p className="text-muted-foreground text-sm">Sélectionnez jusqu'à 3 genres favoris.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                "flex flex-col items-center p-4 border transition-all duration-200",
                isSelected 
                  ? "bg-white text-black border-white" 
                  : isMaxed 
                    ? "opacity-30 cursor-not-allowed border-white/5 bg-white/5"
                    : "border-white/10 bg-white/5 text-white hover:border-white/30"
              )}
            >
              <Icon className="w-5 h-5 mb-2" />
              <span className="text-xs font-medium">{genre.name}</span>
            </button>
          );
        })}
      </div>
      
      <p className="text-center text-xs text-muted-foreground">
        {formData.favorite_genres.length} / 3 sélectionnés
      </p>
    </div>
  );

  const renderStep4_Initiation = () => (
    <div className="flex flex-col items-center justify-center text-center space-y-10 animate-fade-in">
      <div className="space-y-3">
        <h2 className="text-3xl font-medium tracking-tight">
          Accès Autorisé
        </h2>
        <p className="text-muted-foreground">Bienvenue, {formData.username}.</p>
      </div>

      {/* Member Card - Monochrome */}
      <div className="w-full max-w-sm aspect-[1.586/1]">
        <div className="w-full h-full flex flex-col justify-between p-6 border border-white/20 bg-white/5 relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          
          <div className="flex justify-between items-start z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white flex items-center justify-center">
                <Film className="w-5 h-5 text-black" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm leading-none">CineVault</p>
                <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-1">Member Card</p>
              </div>
            </div>
          </div>

          <div className="text-left z-10 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Titulaire</p>
            <p className="text-xl font-medium truncate">{formData.username}</p>
          </div>

          <div className="flex justify-between items-end z-10">
             <div className="flex gap-1.5">
               {formData.streaming_services.slice(0, 4).map(s => (
                 <div key={s} className="w-1.5 h-1.5 bg-white/40" />
               ))}
             </div>
             <div className="px-3 py-1 border border-white/20 text-[10px] font-medium tracking-wider uppercase">
               Niveau 1
             </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 w-full">
         <Button 
            onClick={handleFinish} 
            size="lg" 
            className="w-full h-12 bg-white hover:bg-white/90 text-black font-medium"
            disabled={isLoading}
         >
           {isLoading ? (
             <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Initialisation...</>
           ) : (
             "Entrer dans le Vault"
           )}
         </Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background">
      {/* Minimal background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="w-full max-w-md border border-white/10 bg-card relative flex flex-col max-h-[90vh]">
        {/* Progress Bar */}
        <div className="h-px bg-white/10 w-full">
          <div 
            className="h-full bg-white transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Step indicator */}
        <div className="px-6 py-4 border-b border-white/5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Étape {step} / 4
          </span>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
           <div className={cn("transition-opacity duration-200", animating ? "opacity-0" : "opacity-100")}>
              {step === 1 && renderStep1_Identity()}
              {step === 2 && renderStep2_Platforms()}
              {step === 3 && renderStep3_Genres()}
              {step === 4 && renderStep4_Initiation()}
           </div>
        </div>

        {/* Footer Navigation (Hide on Step 4) */}
        {step < 4 && (
          <div className="p-4 border-t border-white/5 flex justify-between">
            <Button 
              variant="ghost" 
              onClick={handleBack} 
              disabled={step === 1}
              className={cn("text-muted-foreground hover:text-white", step === 1 && "invisible")}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Retour
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={isCheckingUsername}
              className="bg-white hover:bg-white/90 text-black"
            >
              {isCheckingUsername ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}