import { useState, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Camera, Loader2, Film, Clapperboard, Tv, Video, Projector } from "lucide-react";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  onUploadComplete: (url: string) => void;
  size?: "sm" | "md" | "lg" | "xl";
  editable?: boolean;
  userId?: string; // Pour le générateur aléatoire
  username?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onUploadComplete,
  size = "lg",
  editable = true,
  userId,
  username,
}) => {
  const { user, profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tailles mises à jour
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-32 h-32",
    xl: "w-40 h-40", // Nouvelle taille pour le profil
  };

  // Générateur d'avatar déterministe basé sur l'ID utilisateur
  const generatedAvatar = useMemo(() => {
    const targetId = userId || user?.id || "default";
    const targetName = username || profile?.username || "User";

    // Somme simple des charCodes pour l'aléatoire stable
    let hash = 0;
    for (let i = 0; i < targetId.length; i++) {
      hash = targetId.charCodeAt(i) + ((hash << 5) - hash);
    }

    const gradients = [
      "bg-gradient-to-br from-red-900 to-red-600",
      "bg-gradient-to-br from-blue-900 to-blue-600",
      "bg-gradient-to-br from-purple-900 to-purple-600",
      "bg-gradient-to-br from-amber-900 to-amber-600",
      "bg-gradient-to-br from-emerald-900 to-emerald-600",
      "bg-gradient-to-br from-slate-900 to-slate-600",
    ];

    const icons = [Film, Clapperboard, Tv, Video, Projector];

    const bgGradient = gradients[Math.abs(hash) % gradients.length];
    const Icon = icons[Math.abs(hash) % icons.length];

    return (
      <div className={`w-full h-full ${bgGradient} flex items-center justify-center`}>
        <Icon className="w-1/2 h-1/2 text-white/90 drop-shadow-lg" strokeWidth={1.5} />
      </div>
    );
  }, [userId, user?.id, username, profile?.username]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Image trop lourde",
        description: "Essayez une image de moins de 2 Mo.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      await supabase.storage
        .from("avatars")
        .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);

      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlWithCacheBuster })
        .eq("id", user.id);

      if (updateError) throw updateError;

      onUploadComplete(urlWithCacheBuster);
      toast({ title: "Photo mise à jour !" });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'uploader l'image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    if (editable && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="relative group inline-block">
      <button
        onClick={handleClick}
        disabled={!editable || uploading}
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-105 disabled:cursor-default disabled:hover:scale-100 ring-4 ring-background shadow-xl`}
      >
        {uploading ? (
          <div className="w-full h-full bg-background/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : currentAvatarUrl ? (
          <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          generatedAvatar
        )}
      </button>

      {editable && !uploading && (
        <div
          onClick={handleClick}
          className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer backdrop-blur-[2px]"
        >
          <Camera className="w-1/3 h-1/3 text-white drop-shadow-md" />
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
    </div>
  );
};
