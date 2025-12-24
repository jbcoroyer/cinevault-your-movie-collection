/**
 * CineVault - Settings Page - Radical Minimalist Design
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Mail, Bell, Lock, Tv, LogOut, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STREAMING_SERVICES = [
  { id: "netflix", name: "Netflix" },
  { id: "prime", name: "Prime Video" },
  { id: "disney", name: "Disney+" },
  { id: "canal", name: "Canal+" },
  { id: "apple", name: "Apple TV+" },
  { id: "hbo", name: "Max" },
  { id: "paramount", name: "Paramount+" },
  { id: "crunchyroll", name: "Crunchyroll" },
];

export default function Settings() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
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
      toast({ title: "Services mis à jour" });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
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
      toast({ title: "Email mis à jour", description: "Vérifiez votre nouvelle adresse." });
      setNewEmail("");
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Erreur", description: "Minimum 6 caractères.", variant: "destructive" });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Mot de passe mis à jour" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Déconnecté" });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background pb-32">
      <main className="px-4 md:px-12 pt-8 md:pt-16 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-heading-mobile md:text-heading-desktop font-bold mb-2">Paramètres</h1>
          <p className="text-muted-foreground text-sm mb-12">Gérez votre compte</p>
        </motion.div>

        <div className="space-y-12">
          {/* Streaming Services */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Tv className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-medium">Services de streaming</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {STREAMING_SERVICES.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => toggleStreamingService(service.id)}
                    className={cn(
                      "relative p-3 text-sm border transition-colors min-h-[44px]",
                      isSelected 
                        ? "border-foreground text-foreground" 
                        : "border-border text-muted-foreground hover:border-foreground/50"
                    )}
                  >
                    {isSelected && (
                      <Check className="absolute top-1 right-1 w-3 h-3" />
                    )}
                    {service.name}
                  </button>
                );
              })}
            </div>
            
            <Button 
              onClick={handleSaveStreamingServices} 
              disabled={servicesLoading}
              className="w-full bg-foreground text-background hover:bg-foreground/90 min-h-[44px]"
            >
              {servicesLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </motion.section>

          {/* Email */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-medium">Email</h2>
            </div>
            
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Actuel</label>
                <input
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-transparent border-0 border-b border-border py-3 text-muted-foreground"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Nouveau</label>
                <input
                  type="email"
                  placeholder="nouveau@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none py-3"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={emailLoading || !newEmail}
                className="w-full bg-foreground text-background hover:bg-foreground/90 min-h-[44px]"
              >
                {emailLoading ? "Envoi..." : "Changer l'email"}
              </Button>
            </form>
          </motion.section>

          {/* Password */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-medium">Mot de passe</h2>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none py-3"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Confirmation</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none py-3"
                />
              </div>

              <Button 
                type="submit" 
                disabled={passwordLoading || !newPassword || !confirmPassword}
                className="w-full bg-foreground text-background hover:bg-foreground/90 min-h-[44px]"
              >
                {passwordLoading ? "Mise à jour..." : "Changer le mot de passe"}
              </Button>
            </form>
          </motion.section>

          {/* Sign Out */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="pt-8 border-t border-border"
          >
            <Button 
              variant="outline"
              onClick={handleSignOut}
              className="w-full border-border hover:bg-card min-h-[44px]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>
          </motion.section>

          <p className="text-center text-xs text-muted-foreground pt-8">
            CineVault © {new Date().getFullYear()}
          </p>
        </div>
      </main>
    </div>
  );
}
