import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../integrations/supabase/client";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { toast } from "../hooks/use-toast";
import { 
  Moon, Sun, Mail, Bell, Lock, Laptop, User, 
  Tv, CheckCircle2, LogOut, Trash2 
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const STREAMING_SERVICES = [
  { id: "netflix", name: "Netflix", color: "bg-red-600" },
  { id: "prime", name: "Prime Video", color: "bg-blue-500" },
  { id: "disney", name: "Disney+", color: "bg-indigo-600" },
  { id: "canal", name: "Canal+", color: "bg-black" },
  { id: "apple", name: "Apple TV+", color: "bg-gray-800" },
  { id: "hbo", name: "Max", color: "bg-purple-600" },
  { id: "paramount", name: "Paramount+", color: "bg-blue-700" },
  { id: "crunchyroll", name: "Crunchyroll", color: "bg-orange-500" },
];

export default function Settings() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, profile, updateProfile, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  // États pour le changement d'email
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // États pour le changement de mot de passe
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // États pour les notifications
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [notifSecurity, setNotifSecurity] = useState(true);

  // États pour les services de streaming
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (profile?.streaming_services) {
      setSelectedServices(profile.streaming_services);
    }
  }, [profile]);

  const isDarkMode = resolvedTheme === "dark";

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  const toggleStreamingService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSaveStreamingServices = async () => {
    setServicesLoading(true);
    try {
      const { error } = await updateProfile({ streaming_services: selectedServices });
      if (error) throw error;
      toast({
        title: "Services mis à jour",
        description: "Vos services de streaming ont été enregistrés.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder.",
        variant: "destructive",
      });
    } finally {
      setServicesLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !user) return;

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      toast({
        title: "Email mis à jour",
        description: "Vérifiez votre nouvelle adresse pour confirmer.",
      });
      setNewEmail("");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour l'email.",
        variant: "destructive",
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été changé avec succès.",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le mot de passe.",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté.",
    });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-display">Paramètres</h1>
          <p className="text-muted-foreground">Gérez votre compte et vos préférences.</p>
        </div>

        {/* --- APPARENCE --- */}
        <GlassCard padding="none" className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            {isDarkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            <div>
              <h2 className="text-lg font-semibold">Apparence</h2>
              <p className="text-sm text-muted-foreground">Personnalisez l'affichage.</p>
            </div>
          </div>
          
          <Separator className="bg-border/50" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-muted">
                {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>
              <div>
                <Label htmlFor="theme-toggle" className="text-base cursor-pointer font-medium">
                  Mode sombre
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isDarkMode ? "Thème sombre activé" : "Thème clair activé"}
                </p>
              </div>
            </div>
            <Switch 
              id="theme-toggle" 
              checked={isDarkMode} 
              onCheckedChange={handleThemeToggle} 
            />
          </div>
        </GlassCard>

        {/* --- SERVICES DE STREAMING --- */}
        <GlassCard padding="none" className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Tv className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Services de streaming</h2>
              <p className="text-sm text-muted-foreground">Sélectionnez vos abonnements actuels.</p>
            </div>
          </div>
          
          <Separator className="bg-border/50" />
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STREAMING_SERVICES.map((service) => {
              const isSelected = selectedServices.includes(service.id);
              return (
                <button
                  key={service.id}
                  onClick={() => toggleStreamingService(service.id)}
                  className={`relative p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                    isSelected 
                      ? "border-primary bg-primary/10 text-foreground" 
                      : "border-border/50 bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/50"
                  }`}
                >
                  {isSelected && (
                    <CheckCircle2 className="absolute top-1 right-1 h-4 w-4 text-primary" />
                  )}
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${service.color}`} />
                  {service.name}
                </button>
              );
            })}
          </div>
          
          <Button 
            onClick={handleSaveStreamingServices} 
            disabled={servicesLoading}
            className="w-full"
          >
            {servicesLoading ? "Enregistrement..." : "Enregistrer mes services"}
          </Button>
        </GlassCard>

        {/* --- COMPTE / EMAIL --- */}
        <GlassCard padding="none" className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Adresse email</h2>
              <p className="text-sm text-muted-foreground">Modifiez votre email de connexion.</p>
            </div>
          </div>
          
          <Separator className="bg-border/50" />
          
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email actuel</Label>
              <Input value={user?.email || ""} disabled className="bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-email">Nouvel email</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="nouveau@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button type="submit" disabled={emailLoading || !newEmail}>
                  {emailLoading ? "Envoi..." : "Changer"}
                </Button>
              </div>
            </div>
          </form>
        </GlassCard>

        {/* --- MOT DE PASSE --- */}
        <GlassCard padding="none" className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Mot de passe</h2>
              <p className="text-sm text-muted-foreground">Changez votre mot de passe.</p>
            </div>
          </div>
          
          <Separator className="bg-border/50" />
          
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={passwordLoading || !newPassword || !confirmPassword} 
              className="w-full"
            >
              {passwordLoading ? "Mise à jour..." : "Changer le mot de passe"}
            </Button>
          </form>
        </GlassCard>

        {/* --- NOTIFICATIONS --- */}
        <GlassCard padding="none" className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Notifications</h2>
              <p className="text-sm text-muted-foreground">Gérez vos préférences.</p>
            </div>
          </div>
          
          <Separator className="bg-border/50" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Alertes de sécurité</Label>
                <p className="text-xs text-muted-foreground">Emails concernant la sécurité de votre compte.</p>
              </div>
              <Switch checked={notifSecurity} onCheckedChange={setNotifSecurity} disabled />
            </div>
            
            <Separator className="bg-border/30" />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Nouveautés & Marketing</Label>
                <p className="text-xs text-muted-foreground">Recevoir des news sur CineVault.</p>
              </div>
              <Switch
                checked={notifMarketing}
                onCheckedChange={(checked) => {
                  setNotifMarketing(checked);
                  toast({
                    title: checked ? "Notifications activées" : "Notifications désactivées",
                    duration: 2000,
                  });
                }}
              />
            </div>
          </div>
        </GlassCard>

        {/* --- APPLICATION --- */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Laptop className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Application</h2>
              <p className="text-sm text-muted-foreground">Informations sur CineVault.</p>
            </div>
          </div>
          
          <Separator className="bg-border/50" />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Version</p>
              <p className="text-xs text-muted-foreground">v1.0.0 (Bêta)</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              À jour
            </div>
          </div>
        </GlassCard>

        {/* --- ZONE DANGER --- */}
        <GlassCard padding="none" className="p-6 space-y-4 border-destructive/30">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-destructive" />
            <div>
              <h2 className="text-lg font-semibold">Compte</h2>
              <p className="text-sm text-muted-foreground">Actions sur votre compte.</p>
            </div>
          </div>
          
          <Separator className="bg-border/50" />
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </GlassCard>

        <p className="text-center text-xs text-muted-foreground pt-4">
          CineVault © {new Date().getFullYear()} — Fait avec ❤️ pour les cinéphiles
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
