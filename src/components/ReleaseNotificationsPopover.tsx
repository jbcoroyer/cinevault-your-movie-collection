import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  Film,
  Calendar,
  User,
  Building2,
  X,
  Check,
  ChevronRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUnreadReleaseNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/services/entityFollowService";
import { getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";

interface ReleaseNotification {
  id: string;
  user_id: string;
  tmdb_id: number;
  movie_title: string;
  movie_poster_path: string | null;
  release_date: string | null;
  entity_type: string;
  entity_id: number;
  entity_name: string;
  entity_role: string;
  is_read: boolean;
  created_at: string;
}

export function ReleaseNotificationsPopover() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ReleaseNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user && open) {
      fetchNotifications();
    }
  }, [user, open]);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUnreadReleaseNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.id);
    setNotifications([]);
  };

  const handleNotificationClick = async (notification: ReleaseNotification) => {
    await handleMarkAsRead(notification.id);
    setOpen(false);
    navigate(`/movie/${notification.tmdb_id}`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getEntityIcon = (entityType: string, entityRole: string) => {
    if (entityType === "company") {
      return <Building2 className="w-3 h-3" />;
    }
    if (entityRole === "director") {
      return <Film className="w-3 h-3" />;
    }
    return <User className="w-3 h-3" />;
  };

  const unreadCount = notifications.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="w-5 h-5 text-white/70" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 md:w-96 p-0 bg-zinc-900 border-white/10"
        align="end"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            Sorties à venir
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-white/50 hover:text-white"
            >
              <Check className="w-3 h-3 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 rounded-lg bg-white/5 animate-pulse"
                >
                  <div className="w-12 h-16 bg-white/10 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellOff className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/50">Aucune notification</p>
              <p className="text-xs text-white/30 mt-1">
                Suivez des acteurs, réalisateurs ou studios pour être notifié
              </p>
            </div>
          ) : (
            <div className="p-2">
              <AnimatePresence>
                {notifications.map((notification, index) => (
                  <motion.button
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full flex gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left group"
                  >
                    {notification.movie_poster_path ? (
                      <img
                        src={getImageUrl(notification.movie_poster_path, "w92") || ""}
                        alt={notification.movie_title}
                        className="w-12 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-white/10 rounded flex items-center justify-center">
                        <Film className="w-5 h-5 text-white/30" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-amber-400 transition-colors">
                        {notification.movie_title}
                      </p>

                      <div className="flex items-center gap-1 mt-1 text-xs text-white/50">
                        {getEntityIcon(notification.entity_type, notification.entity_role)}
                        <span className="truncate">{notification.entity_name}</span>
                      </div>

                      {notification.release_date && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-amber-500/20 text-amber-400 border-0"
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(notification.release_date)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors self-center" />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t border-white/10">
            <Button
              variant="ghost"
              className="w-full text-sm text-white/50 hover:text-white"
              onClick={() => {
                setOpen(false);
                navigate("/following");
              }}
            >
              Voir tous mes suivis
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
