/**
 * CineVault - Settings Page
 *
 * Page de paramètres avec:
 * - MinimalHeader + FloatingDock (navigation cohérente)
 * - Services de streaming
 * - Email et mot de passe
 * - Déconnexion
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, Tv, LogOut, Check, ArrowLeft, Shield } from "lucide-react";
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
  const navigate = useNavigate();
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
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((s) => s !== serviceId) : [...prev, serviceId],
    );
  };

  const handleSaveStreamingServices = async () => {
    setServicesLoading(true);
    try {
      const { error } = await updateProfile({
        streaming_services: selectedServices,
      });
      if (error) throw error;
      toast({ title: "Services mis à jour" });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
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
        description: "Vérifiez votre nouvelle adresse.",
      });
      setNewEmail("");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
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
        description: "Minimum 6 caractères.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast({ title: "Mot de passe mis à jour" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast({ title: "Déconnecté" });
  };

  if (!mounted) return null;

  // Guest view
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-12 max-w-2xl mx-auto text-center py-20">
          <Shield className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 mb-6">Connectez-vous pour accéder aux paramètres</p>
          <Button onClick={() => navigate("/auth")} className="bg-white text-black hover:bg-white/90">
            Se connecter
          </Button>
        </main>
        <FloatingDock />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <MinimalHeader />

      <main className="pt-20 md:pt-24 px-4 md:px-12 max-w-2xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Retour</span>
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">Paramètres</h1>
          <p className="text-white/50 text-sm mb-10">Gérez votre compte</p>
        </motion.div>

        <div className="space-y-10">
          {/* Streaming Services */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Tv className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Services de streaming</h2>
                <p className="text-xs text-white/40">Sélectionnez vos abonnements</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {STREAMING_SERVICES.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => toggleStreamingService(service.id)}
                    className={cn(
                      "relative p-3 text-sm rounded-xl border transition-all min-h-[44px]",
                      isSelected
                        ? "border-white bg-white/10 text-white"
                        : "border-white/10 text-white/50 hover:border-white/30 hover:text-white/70",
                    )}
                  >
                    {isSelected && <Check className="absolute top-2 right-2 w-3 h-3" />}
                    {service.name}
                  </button>
                );
              })}
            </div>

            <Button
              onClick={handleSaveStreamingServices}
              disabled={servicesLoading}
              className="w-full bg-white text-black hover:bg-white/90"
            >
              {servicesLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </motion.section>

          {/* Email */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Adresse email</h2>
                <p className="text-xs text-white/40">Modifier votre email</p>
              </div>
            </div>

            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Email actuel</label>
                <Input value={user?.email || ""} disabled className="bg-white/5 border-white/10 text-white/50" />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1 block">Nouvel email</label>
                <Input
                  type="email"
                  placeholder="nouveau@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              <Button
                type="submit"
                disabled={emailLoading || !newEmail}
                className="w-full bg-white text-black hover:bg-white/90"
              >
                {emailLoading ? "Mise à jour..." : "Mettre à jour l'email"}
              </Button>
            </form>
          </motion.section>

          {/* Password */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Mot de passe</h2>
                <p className="text-xs text-white/40">Modifier votre mot de passe</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Nouveau mot de passe</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1 block">Confirmer le mot de passe</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              <Button
                type="submit"
                disabled={passwordLoading || !newPassword || !confirmPassword}
                className="w-full bg-white text-black hover:bg-white/90"
              >
                {passwordLoading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </Button>
            </form>
          </motion.section>

          {/* Sign Out */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </Button>
          </motion.section>
        </div>
      </main>

      <FloatingDock />
    </div>
  );
}
