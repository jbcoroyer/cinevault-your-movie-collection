import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../integrations/supabase/client";
import Header from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "../hooks/use-toast";
import { Moon, Sun, Mail, Bell, RefreshCw, CheckCircle2, Lock, Laptop, Palette, Check } from "lucide-react";
import { ACCENT_COLORS, applyThemeColor } from "@/lib/theme-config";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  // États pour le changement d'email
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // États pour le changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // États pour les notifications (préférences locales simulées)
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [notifSecurity, setNotifSecurity] = useState(true);

  // État pour la couleur d'accentuation
  const [accentColor, setAccentColor] = useState("default");

  // État pour la mise à jour
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    const savedColor = localStorage.getItem("theme-accent") || "default";
    setAccentColor(savedColor);
  }, []);

  // Toggle dark mode
  const isDarkMode = theme === "dark";
  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  // Changement de couleur
  const handleColorChange = (colorValue: string) => {
    setAccentColor(colorValue);
    localStorage.setItem("theme-accent", colorValue);
    applyThemeColor(colorValue);
    toast({
      title: "Thème mis à jour",
      description: "La couleur d'accentuation a été modifiée.",
    });
  };

  // Gestion du changement d'email
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !user) return;

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });

      if (error) throw error;

      toast({
        title: "Email mis à jour",
        description: "Veuillez vérifier votre nouvelle adresse email pour confirmer le changement.",
      });
      setNewEmail("");
    } catch (error: any) {
      console.error("Error updating email:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour l'email.",
        variant: "destructive",
      });
    } finally {
      setEmailLoading(false);
    }
  };

  // Gestion du changement de mot de passe
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
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le mot de passe.",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Simulation de mise à jour de l'application
  const handleCheckUpdate = () => {
    setUpdateLoading(true);
    setTimeout(() => {
      setUpdateLoading(false);
      toast({
        title: "Application à jour",
        description: "Vous utilisez la version 1.0.0 de CineVault.",
        action: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold mb-6">Paramètres</h1>

        {/* --- APPARENCE & THEME --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Apparence & Thème
            </CardTitle>
            <CardDescription>Personnalisez l'expérience visuelle de CineVault.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mode Sombre */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted">
                  {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </div>
                <Label htmlFor="theme-toggle" className="text-base cursor-pointer font-medium">
                  Mode sombre
                </Label>
              </div>
              <Switch id="theme-toggle" checked={isDarkMode} onCheckedChange={handleThemeToggle} />
            </div>

            <Separator />

            {/* Couleur d'accentuation */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Couleur d'accentuation</Label>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorChange(color.value)}
                    className={cn(
                      "group relative w-full aspect-square rounded-full flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary",
                      color.class,
                      accentColor === color.value &&
                        "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110",
                    )}
                    title={color.name}
                  >
                    {accentColor === color.value && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Cette couleur s'appliquera aux boutons, liens et éléments actifs de l'application.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* --- COMPTE / EMAIL --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Adresse email
            </CardTitle>
            <CardDescription>Modifiez votre adresse email de connexion.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div className="space-y-2">
                <Label>Email actuel</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
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
                <p className="text-xs text-muted-foreground">
                  Un email de confirmation sera envoyé à la nouvelle adresse.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* --- MOT DE PASSE --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Mot de passe
            </CardTitle>
            <CardDescription>Changez votre mot de passe de connexion.</CardDescription>
          </CardHeader>
          <CardContent>
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

              <Button type="submit" disabled={passwordLoading || !newPassword || !confirmPassword} className="w-full">
                {passwordLoading ? "Mise à jour..." : "Changer le mot de passe"}
              </Button>
              <p className="text-xs text-muted-foreground">Le mot de passe doit contenir au moins 6 caractères.</p>
            </form>
          </CardContent>
        </Card>

        {/* --- NOTIFICATIONS --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Choisissez ce que vous souhaitez recevoir.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Alertes de sécurité</Label>
                <p className="text-xs text-muted-foreground">Emails concernant la sécurité de votre compte.</p>
              </div>
              <Switch checked={notifSecurity} onCheckedChange={setNotifSecurity} disabled />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Nouveautés & Marketing</Label>
                <p className="text-xs text-muted-foreground">Recevoir des news sur les mises à jour de CineVault.</p>
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
          </CardContent>
        </Card>

        {/* --- APPLICATION / VERSION --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Laptop className="h-5 w-5" />
              Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Version actuelle</p>
                <p className="text-xs text-muted-foreground">v1.0.0 (Bêta)</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleCheckUpdate} disabled={updateLoading}>
                {updateLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {updateLoading ? "Vérification..." : "Vérifier les mises à jour"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground pt-4">
          CineVault © {new Date().getFullYear()} - Fait avec ❤️ pour les passionnés de cinéma
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
