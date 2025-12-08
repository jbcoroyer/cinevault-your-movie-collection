import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface FollowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  type: "followers" | "following";
  title: string;
}

export function FollowListDialog({
  open,
  onOpenChange,
  userId,
  type,
  title,
}: FollowListDialogProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchUsers();
    }
  }, [open, userId, type]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let userIds: string[] = [];

      if (type === "followers") {
        // Récupérer les IDs des abonnés
        const { data } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("following_id", userId);
        userIds = data?.map((f) => f.follower_id) || [];
      } else {
        // Récupérer les IDs des abonnements
        const { data } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", userId);
        userIds = data?.map((f) => f.following_id) || [];
      }

      if (userIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Récupérer les profils
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio")
        .in("id", userIds);

      if (error) throw error;
      setUsers(profiles || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (profileId: string) => {
    onOpenChange(false);
    navigate(`/profile/${profileId}`);
  };

  const getInitials = (user: UserProfile) => {
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {type === "followers"
                ? "Aucun abonné pour le moment"
                : "Aucun abonnement pour le moment"}
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {user.username || "Utilisateur"}
                    </p>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground truncate">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
