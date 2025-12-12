import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Ghost, Gift, Sun, Trophy, Calendar, Sparkles, Star
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getActiveEvents, SeasonalEvent } from "@/services/gamificationService";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

const EVENT_ICONS: Record<string, any> = {
  halloween: Ghost,
  christmas: Gift,
  summer: Sun,
  festival: Trophy,
};

export function SeasonalEvents() {
  const [events, setEvents] = useState<SeasonalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const data = await getActiveEvents();
    setEvents(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return null; // Ne rien afficher s'il n'y a pas d'événements
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const IconComponent = EVENT_ICONS[event.event_type] || Star;
        const daysLeft = differenceInDays(new Date(event.end_date), new Date());
        const endDateFormatted = format(new Date(event.end_date), "d MMMM", { locale: fr });

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="overflow-hidden border-2"
              style={{ borderColor: event.theme_color }}
            >
              {/* Header avec gradient */}
              <div 
                className="p-4 text-white relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${event.theme_color}, ${event.theme_color}dd)`
                }}
              >
                <div className="absolute top-0 right-0 opacity-20">
                  <IconComponent className="w-32 h-32 -mr-8 -mt-8" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent className="w-6 h-6" />
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      Événement Saisonnier
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold">{event.title}</h3>
                  <p className="text-sm opacity-90 mt-1">{event.description}</p>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Jusqu'au {endDateFormatted}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      <span>{daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges de l'événement */}
              {event.event_badges && event.event_badges.length > 0 && (
                <CardContent className="pt-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    Badges Exclusifs
                  </h4>
                  <div className="grid gap-2">
                    {event.event_badges.map((badge) => (
                      <div 
                        key={badge.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${event.theme_color}20` }}
                        >
                          <IconComponent 
                            className="w-5 h-5" 
                            style={{ color: event.theme_color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{badge.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {badge.description}
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "shrink-0",
                            badge.rarity === 'legendary' && "border-yellow-500 text-yellow-500",
                            badge.rarity === 'epic' && "border-purple-500 text-purple-500"
                          )}
                        >
                          +{badge.xp_reward} XP
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
