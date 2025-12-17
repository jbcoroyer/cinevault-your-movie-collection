import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Bell, 
  UserPlus, 
  Heart, 
  MessageCircle, 
  Award, 
  Trophy, 
  Info,
  Mail,
  Smartphone
} from 'lucide-react';

interface NotificationPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationPreferencesDialog = ({
  open,
  onOpenChange,
}: NotificationPreferencesDialogProps) => {
  const { preferences, preferencesLoading, updatePreferences } = useNotifications();

  const notificationTypes = [
    { key: 'price_alerts', label: 'Alertes de prix', icon: Bell, description: 'Changements de prix sur votre collection' },
    { key: 'new_followers', label: 'Nouveaux abonnés', icon: UserPlus, description: 'Quand quelqu\'un vous suit' },
    { key: 'likes', label: 'J\'aime', icon: Heart, description: 'J\'aime sur vos reviews et listes' },
    { key: 'comments', label: 'Commentaires', icon: MessageCircle, description: 'Commentaires sur vos contenus' },
    { key: 'badges', label: 'Badges obtenus', icon: Award, description: 'Nouveaux badges débloqués' },
    { key: 'challenges', label: 'Défis complétés', icon: Trophy, description: 'Défis hebdomadaires terminés' },
    { key: 'system', label: 'Système', icon: Info, description: 'Mises à jour et annonces' },
  ] as const;

  const deliveryMethods = [
    { key: 'push_notifications', label: 'Notifications push', icon: Smartphone, description: 'Notifications dans l\'app' },
    { key: 'email_notifications', label: 'Notifications email', icon: Mail, description: 'Recevoir par email (bientôt)' },
  ] as const;

  const handleToggle = (key: string, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Préférences de notifications</DialogTitle>
          <DialogDescription>
            Personnalisez les notifications que vous souhaitez recevoir
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Notification Types */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Types de notifications</h4>
            <div className="space-y-3">
              {notificationTypes.map(({ key, label, icon: Icon, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                        {label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <Switch
                    id={key}
                    checked={preferences?.[key as keyof typeof preferences] as boolean ?? true}
                    onCheckedChange={(checked) => handleToggle(key, checked)}
                    disabled={preferencesLoading}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Delivery Methods */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Méthodes de livraison</h4>
            <div className="space-y-3">
              {deliveryMethods.map(({ key, label, icon: Icon, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                        {label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <Switch
                    id={key}
                    checked={preferences?.[key as keyof typeof preferences] as boolean ?? (key === 'push_notifications')}
                    onCheckedChange={(checked) => handleToggle(key, checked)}
                    disabled={preferencesLoading || key === 'email_notifications'}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
