import { Link } from "react-router-dom";
import { UserProfile } from "@/services/users";
import { Film, Heart, User } from "lucide-react";

interface UserCardProps {
  user: UserProfile;
}

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const initials = user.username
    ? user.username.slice(0, 2).toUpperCase()
    : "??";

  return (
    <Link
      to={`/profile/${user.id}`}
      className="flex items-center gap-4 p-4 bg-card rounded-lg hover:bg-muted transition-colors"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.username}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-semibold text-lg">{initials}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{user.username || "Utilisateur"}</h3>
        {user.bio && (
          <p className="text-sm text-muted-foreground line-clamp-1">{user.bio}</p>
        )}
        
        {/* Stats */}
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          {user.movies_watched !== undefined && (
            <span className="flex items-center gap-1">
              <Film className="w-3 h-3" />
              {user.movies_watched} vus
            </span>
          )}
          {user.favorites_count !== undefined && (
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {user.favorites_count} favoris
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export const UserCardSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg">
      <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
      </div>
    </div>
  );
};
