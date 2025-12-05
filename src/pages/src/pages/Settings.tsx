import { useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  Moon, 
  Sun, 
  Laptop, 
  Mail, 
  Bell, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck 
} from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  
  // États pour le changement d'email
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // États pour les notifications (préférences locales simulées)
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [notifSecurity, setNotifSecurity] = useState(true);

  // État pour la mise à jour
  const [updateLoading, setUpdateLoading] = useState(false);

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

        {/* --- APPARENCE --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Apparence
            </CardTitle>
            <CardDescription>
              Personnalisez l'apparence de l'application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="theme">Thème</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Choisir un thème" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" /> Clair
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" /> Sombre
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Laptop className="h-4 w-4" /> Système
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* --- COMPTE / EMAIL --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Sécurité du compte
            </CardTitle>
            <CardDescription>
              Gérez vos identifiants de connexion.
            </CardDescription>
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

        {/* --- NOTIFICATIONS --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choisissez ce que vous souhaitez recevoir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
