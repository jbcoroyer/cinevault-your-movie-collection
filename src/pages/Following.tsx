import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Film,
  Building2,
  Calendar,
  Bell,
  Search,
  Trash2,
} from "lucide-react";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFollowedEntities } from "@/hooks/useFollowedEntities";
import { useAuth } from "@/contexts/AuthContext";
import { unfollowEntity, EntityType, FollowedEntity } from "@/services/entityFollowService";
import { getImageUrl } from "@/services/tmdb";
import { useToast } from "@/hooks/use-toast";

// Composant carte d'entité suivie
function FollowedEntityCard({
  entity,
  onUnfollow,
}: {
  entity: FollowedEntity;
  onUnfollow: () => void;
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (entity.entity_type === "person") {
      navigate(`/person/${entity.entity_id}`);
    } else {
      navigate(`/studio/${entity.entity_id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all group"
    >
      <button onClick={handleClick} className="flex-shrink-0">
        {entity.entity_type === "company" ? (
          entity.entity_image_path ? (
            <div className="w-14 h-14 bg-white/10 rounded-lg p-2 flex items-center justify-center">
              <img
                src={getImageUrl(entity.entity_image_path, "w200") || ""}
                alt={entity.entity_name}
                className="max-w-full max-h-full object-contain filter brightness-0 invert"
              />
            </div>
          ) : (
            <div className="w-14 h-14 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-amber-400" />
            </div>
          )
        ) : (
          <Avatar className="w-14 h-14">
            <AvatarImage src={getImageUrl(entity.entity_image_path, "w200") || ""} />
            <AvatarFallback className="bg-amber-500/20 text-amber-400">
              {entity.entity_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <button onClick={handleClick} className="text-left">
          <h3 className="font-medium text-white group-hover:text-amber-400 transition-colors truncate">
            {entity.entity_name}
          </h3>
        </button>
        <p className="text-xs text-white/50 capitalize">{entity.entity_role}</p>
        <p className="text-xs text-white/30">
          Suivi depuis{" "}
          {new Date(entity.created_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}
        </p>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/50 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ne plus suivre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous ne recevrez plus de notifications pour {entity.entity_name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onUnfollow}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

// Composant empty state
function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-16 h-16 text-white/10 mb-4" />
      <h3 className="text-lg font-medium text-white/50 mb-2">{title}</h3>
      <p className="text-sm text-white/30">{description}</p>
    </div>
  );
}

// Composant loading
function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl bg-white/5 animate-pulse"
        >
          <div className="w-14 h-14 bg-white/10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Following() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { actors, directors, studios, upcomingReleases, loading, refresh } =
    useFollowedEntities();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");

  const filteredActors = useMemo(() => {
    if (!searchQuery) return actors;
    return actors.filter((a) =>
      a.entity_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [actors, searchQuery]);

  const filteredDirectors = useMemo(() => {
    if (!searchQuery) return directors;
    return directors.filter((d) =>
      d.entity_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [directors, searchQuery]);

  const filteredStudios = useMemo(() => {
    if (!searchQuery) return studios;
    return studios.filter((s) =>
      s.entity_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [studios, searchQuery]);

  const handleUnfollow = async (
    entityType: EntityType,
    entityId: number,
    entityName: string
  ) => {
    if (!user) return;
    const result = await unfollowEntity(user.id, entityType, entityId);
    if (result.success) {
      toast({ title: "Désabonné", description: `Vous ne suivez plus ${entityName}` });
      refresh();
    }
  };

  const totalFollowing = actors.length + directors.length + studios.length;

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Bell className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 mb-4">Connectez-vous pour voir vos suivis</p>
            <Button onClick={() => navigate("/auth")}>Se connecter</Button>
          </div>
        </main>
        <FloatingDock />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <MinimalHeader />
      <main className="pt-20 md:pt-24 px-4 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/70" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Mes suivis</h1>
                <p className="text-sm text-white/50">{totalFollowing} suivis</p>
              </div>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/5 border border-white/10 mb-8">
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-amber-500/20">
                <Calendar className="w-4 h-4 mr-2" />À venir ({upcomingReleases.length})
              </TabsTrigger>
              <TabsTrigger value="actors" className="data-[state=active]:bg-amber-500/20">
                <Users className="w-4 h-4 mr-2" />Acteurs ({actors.length})
              </TabsTrigger>
              <TabsTrigger value="directors" className="data-[state=active]:bg-amber-500/20">
                <Film className="w-4 h-4 mr-2" />Réalisateurs ({directors.length})
              </TabsTrigger>
              <TabsTrigger value="studios" className="data-[state=active]:bg-amber-500/20">
                <Building2 className="w-4 h-4 mr-2" />Studios ({studios.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {loading ? <LoadingGrid /> : upcomingReleases.length === 0 ? (
                <EmptyState icon={Calendar} title="Aucune sortie à venir" description="Suivez des personnes ou studios" />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {upcomingReleases.map((r) => (
                    <button key={r.movie.id} onClick={() => navigate(`/movie/${r.movie.id}`)} className="text-left">
                      <img src={getImageUrl(r.movie.poster_path, "w300") || ""} alt={r.movie.title} className="rounded-lg w-full" />
                      <p className="text-sm text-white mt-2 truncate">{r.movie.title}</p>
                      <p className="text-xs text-amber-400">{r.movie.release_date}</p>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="actors">
              {loading ? <LoadingGrid /> : filteredActors.length === 0 ? (
                <EmptyState icon={Users} title="Aucun acteur suivi" description="Visitez une fiche film pour suivre des acteurs" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {filteredActors.map((actor) => (
                      <FollowedEntityCard key={actor.id} entity={actor} onUnfollow={() => handleUnfollow("person", actor.entity_id, actor.entity_name)} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            <TabsContent value="directors">
              {loading ? <LoadingGrid /> : filteredDirectors.length === 0 ? (
                <EmptyState icon={Film} title="Aucun réalisateur suivi" description="Visitez une fiche film pour suivre des réalisateurs" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {filteredDirectors.map((director) => (
                      <FollowedEntityCard key={director.id} entity={director} onUnfollow={() => handleUnfollow("person", director.entity_id, director.entity_name)} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            <TabsContent value="studios">
              {loading ? <LoadingGrid /> : filteredStudios.length === 0 ? (
                <EmptyState icon={Building2} title="Aucun studio suivi" description="Visitez une fiche film pour suivre des studios" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {filteredStudios.map((studio) => (
                      <FollowedEntityCard key={studio.id} entity={studio} onUnfollow={() => handleUnfollow("company", studio.entity_id, studio.entity_name)} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <FloatingDock />
    </div>
  );
}
