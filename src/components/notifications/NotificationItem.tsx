import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Bell, 
  UserPlus, 
  Heart, 
  MessageCircle, 
  Award, 
  Trophy, 
  Info,
  X,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification, NotificationType } from '@/services/notificationService';
import { Button } from '@/components/ui/button';

const ICON_MAP: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  price_alert: Bell,
  new_follower: UserPlus,
  like: Heart,
  comment: MessageCircle,
  badge_earned: Award,
  challenge_completed: Trophy,
  system: Info,
};

const COLOR_MAP: Record<NotificationType, string> = {
  price_alert: 'text-amber-500 bg-amber-500/10',
  new_follower: 'text-blue-500 bg-blue-500/10',
  like: 'text-rose-500 bg-rose-500/10',
  comment: 'text-green-500 bg-green-500/10',
  badge_earned: 'text-purple-500 bg-purple-500/10',
  challenge_completed: 'text-yellow-500 bg-yellow-500/10',
  system: 'text-muted-foreground bg-muted',
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) => {
  const Icon = ICON_MAP[notification.type];
  const colorClass = COLOR_MAP[notification.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors',
        notification.is_read 
          ? 'bg-transparent opacity-60' 
          : 'bg-accent/50'
      )}
    >
      <div className={cn('p-2 rounded-full shrink-0', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground">
          {notification.title}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { 
            addSuffix: true,
            locale: fr 
          })}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMarkAsRead(notification.id)}
            title="Marquer comme lu"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(notification.id)}
          title="Supprimer"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
