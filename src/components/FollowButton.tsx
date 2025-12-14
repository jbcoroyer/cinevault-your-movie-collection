import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  targetUserId: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ targetUserId }) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Vérifier si on suit déjà cet utilisateur au chargement
  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      setIsFollowing(!!data);
      setLoading(false);
    };

    checkStatus();
  }, [user, targetUserId]);

  const handleToggleFollow = async () => {
    if (!user) {
      toast({ title: "Connexion requise", description: "Vous devez être connecté pour suivre un profil." });
      return;
    }

    setProcessing(true);

    try {
      if (isFollowing) {
        // Se désabonner
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
        setIsFollowing(false);
        toast({ title: "Désabonné" });
      } else {
        // S'abonner
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });

        if (error) throw error;
        setIsFollowing(true);
        toast({ title: "Abonné !" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur", description: "Impossible de modifier l'abonnement", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  // On ne s'affiche pas sur son propre profil
  if (user?.id === targetUserId) return null;

  if (loading) {
    return <Button variant="ghost" size="sm" disabled><Loader2 className="w-4 h-4 animate-spin" /></Button>;
  }

  return (
    <Button
      variant={isFollowing ? "secondary" : "default"}
      size="sm"
      onClick={handleToggleFollow}
      disabled={processing}
      className={isFollowing ? "hover:bg-destructive/10 hover:text-destructive transition-colors" : ""}
    >
      {processing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="w-4 h-4 mr-2" />
          Abonné
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Suivre
        </>
      )}
    </Button>
  );
};
