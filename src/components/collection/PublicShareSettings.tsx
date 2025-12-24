/**
 * CineVault - Public Share Settings Component
 * 
 * Composant pour configurer le partage public de la collection
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Share2,
  Globe,
  Lock,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  PublicCollectionSettings,
  getPublicCollectionSettings,
  createPublicCollectionSettings,
  updatePublicCollectionSettings,
  togglePublicCollection,
  getShareUrl,
  copyShareLink,
} from "@/services/publicCollectionService";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PublicShareSettingsProps {
  trigger?: React.ReactNode;
}

export const PublicShareSettings = ({ trigger }: PublicShareSettingsProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [settings, setSettings] = useState<PublicCollectionSettings | null>(null);
  const [formData, setFormData] = useState({
    is_enabled: false,
    show_values: true,
    show_purchase_prices: false,
    show_conditions: true,
    show_notes: false,
    custom_title: "",
    custom_description: "",
  });

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user || !open) return;
      
      setLoading(true);
      try {
        let data = await getPublicCollectionSettings(user.id);
        
        // Create settings if they don't exist
        if (!data) {
          data = await createPublicCollectionSettings(user.id);
        }
        
        if (data) {
          setSettings(data);
          setFormData({
            is_enabled: data.is_enabled,
            show_values: data.show_values,
            show_purchase_prices: data.show_purchase_prices,
            show_conditions: data.show_conditions,
            show_notes: data.show_notes,
            custom_title: data.custom_title || "",
            custom_description: data.custom_description || "",
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, open]);

  const handleToggleEnabled = async () => {
    if (!user) return;
    
    const newValue = !formData.is_enabled;
    setFormData(prev => ({ ...prev, is_enabled: newValue }));
    
    try {
      await togglePublicCollection(user.id, newValue);
      toast({
        title: newValue ? "Collection publique activée" : "Collection rendue privée",
        description: newValue 
          ? "Votre collection est maintenant visible publiquement."
          : "Votre collection n'est plus accessible publiquement.",
      });
    } catch (error) {
      // Revert on error
      setFormData(prev => ({ ...prev, is_enabled: !newValue }));
      toast({
        title: "Erreur",
        description: "Impossible de modifier les paramètres.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await updatePublicCollectionSettings(user.id, {
        show_values: formData.show_values,
        show_purchase_prices: formData.show_purchase_prices,
        show_conditions: formData.show_conditions,
        show_notes: formData.show_notes,
        custom_title: formData.custom_title || null,
        custom_description: formData.custom_description || null,
      });
      
      toast({
        title: "Paramètres sauvegardés",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!settings?.share_code) return;
    
    const success = await copyShareLink(settings.share_code);
    if (success) {
      setCopied(true);
      toast({
        title: "Lien copié !",
        description: "Le lien de votre collection a été copié.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareUrl = settings?.share_code ? getShareUrl(settings.share_code) : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Partager
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Partager ma collection
          </DialogTitle>
          <DialogDescription>
            Rendez votre collection visible publiquement et partagez-la avec vos amis.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <div className="h-12 bg-muted rounded-lg animate-pulse" />
            <div className="h-32 bg-muted rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Toggle public */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {formData.is_enabled ? (
                  <Globe className="w-5 h-5 text-green-500" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {formData.is_enabled ? "Collection publique" : "Collection privée"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formData.is_enabled 
                      ? "Visible par tous avec le lien" 
                      : "Seul vous pouvez voir votre collection"}
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={handleToggleEnabled}
              />
            </div>

            {/* Share link */}
            {formData.is_enabled && settings?.share_code && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <Label>Lien de partage</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(shareUrl, "_blank")}
                    className="flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
                
                {settings.view_count > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {settings.view_count} vue{settings.view_count > 1 ? 's' : ''}
                  </p>
                )}
              </motion.div>
            )}

            {/* Visibility options */}
            {formData.is_enabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <Label className="text-base font-semibold">Options d'affichage</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Valeurs estimées</p>
                      <p className="text-xs text-muted-foreground">Afficher la valeur eBay</p>
                    </div>
                    <Switch
                      checked={formData.show_values}
                      onCheckedChange={(v) => setFormData(prev => ({ ...prev, show_values: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Prix d'achat</p>
                      <p className="text-xs text-muted-foreground">Afficher vos prix d'achat</p>
                    </div>
                    <Switch
                      checked={formData.show_purchase_prices}
                      onCheckedChange={(v) => setFormData(prev => ({ ...prev, show_purchase_prices: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">État des films</p>
                      <p className="text-xs text-muted-foreground">Neuf, Très bon, etc.</p>
                    </div>
                    <Switch
                      checked={formData.show_conditions}
                      onCheckedChange={(v) => setFormData(prev => ({ ...prev, show_conditions: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Notes personnelles</p>
                      <p className="text-xs text-muted-foreground">Vos annotations sur les films</p>
                    </div>
                    <Switch
                      checked={formData.show_notes}
                      onCheckedChange={(v) => setFormData(prev => ({ ...prev, show_notes: v }))}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Custom title & description */}
            {formData.is_enabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <Label className="text-base font-semibold">Personnalisation</Label>
                
                <div className="space-y-2">
                  <Label className="text-sm">Titre personnalisé</Label>
                  <Input
                    placeholder="Ma collection de films"
                    value={formData.custom_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Description</Label>
                  <Textarea
                    placeholder="Décrivez votre collection..."
                    value={formData.custom_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_description: e.target.value }))}
                    rows={2}
                  />
                </div>
              </motion.div>
            )}

            {/* Save button */}
            {formData.is_enabled && (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full"
              >
                {saving ? "Sauvegarde..." : "Sauvegarder les paramètres"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PublicShareSettings;
