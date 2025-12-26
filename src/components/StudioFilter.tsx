import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, X, ChevronDown, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getImageUrl } from "@/services/tmdb";
import { POPULAR_STUDIOS } from "@/services/tmdbCompanies";
import { cn } from "@/lib/utils";

interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
}

interface StudioFilterProps {
  availableStudios: ProductionCompany[];
  selectedStudios: number[];
  onChange: (studioIds: number[]) => void;
  className?: string;
}

export function StudioFilter({
  availableStudios,
  selectedStudios,
  onChange,
  className,
}: StudioFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrer les studios disponibles
  const filteredStudios = useMemo(() => {
    if (!searchQuery) return availableStudios;
    const query = searchQuery.toLowerCase();
    return availableStudios.filter((s) =>
      s.name.toLowerCase().includes(query)
    );
  }, [availableStudios, searchQuery]);

  // Séparer les studios populaires et les autres
  const { popularStudios, otherStudios } = useMemo(() => {
    const popularIds = new Set(POPULAR_STUDIOS.map((s) => s.id));
    const popular: ProductionCompany[] = [];
    const other: ProductionCompany[] = [];

    filteredStudios.forEach((studio) => {
      if (popularIds.has(studio.id)) {
        popular.push(studio);
      } else {
        other.push(studio);
      }
    });

    // Trier les populaires par ordre d'apparition dans POPULAR_STUDIOS
    popular.sort((a, b) => {
      const indexA = POPULAR_STUDIOS.findIndex((s) => s.id === a.id);
      const indexB = POPULAR_STUDIOS.findIndex((s) => s.id === b.id);
      return indexA - indexB;
    });

    return { popularStudios: popular, otherStudios: other };
  }, [filteredStudios]);

  const toggleStudio = (studioId: number) => {
    if (selectedStudios.includes(studioId)) {
      onChange(selectedStudios.filter((id) => id !== studioId));
    } else {
      onChange([...selectedStudios, studioId]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const getStudioName = (id: number) => {
    const studio = availableStudios.find((s) => s.id === id);
    return studio?.name || "Studio";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "gap-2 border-white/10 hover:bg-white/10",
              selectedStudios.length > 0 && "border-amber-500/50 bg-amber-500/10"
            )}
          >
            <Building2 className="w-4 h-4" />
            <span>Studios</span>
            {selectedStudios.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 bg-amber-500/20 text-amber-400 text-xs"
              >
                {selectedStudios.length}
              </Badge>
            )}
            <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0 bg-zinc-900 border-white/10" align="start">
          {/* Search */}
          <div className="p-3 border-b border-white/10">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un studio..."
              className="bg-white/5 border-white/10"
            />
          </div>

          <ScrollArea className="max-h-80">
            {/* Selected studios */}
            {selectedStudios.length > 0 && (
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40 uppercase">
                    Sélectionnés
                  </span>
                  <button
                    onClick={clearAll}
                    className="text-xs text-white/50 hover:text-white"
                  >
                    Tout effacer
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedStudios.map((id) => (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="bg-amber-500/20 text-amber-400 cursor-pointer hover:bg-amber-500/30"
                      onClick={() => toggleStudio(id)}
                    >
                      {getStudioName(id)}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Popular studios */}
            {popularStudios.length > 0 && (
              <div className="p-3">
                <span className="text-xs text-white/40 uppercase block mb-2">
                  Studios populaires
                </span>
                <div className="space-y-1">
                  {popularStudios.map((studio) => (
                    <StudioItem
                      key={studio.id}
                      studio={studio}
                      isSelected={selectedStudios.includes(studio.id)}
                      onClick={() => toggleStudio(studio.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other studios */}
            {otherStudios.length > 0 && (
              <div className="p-3 border-t border-white/10">
                <span className="text-xs text-white/40 uppercase block mb-2">
                  Autres studios
                </span>
                <div className="space-y-1">
                  {otherStudios.map((studio) => (
                    <StudioItem
                      key={studio.id}
                      studio={studio}
                      isSelected={selectedStudios.includes(studio.id)}
                      onClick={() => toggleStudio(studio.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredStudios.length === 0 && (
              <div className="p-8 text-center">
                <Building2 className="w-10 h-10 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/40">Aucun studio trouvé</p>
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Selected badges (visible when popover is closed) */}
      {selectedStudios.length > 0 && !open && selectedStudios.length <= 3 && (
        <div className="hidden md:flex items-center gap-2">
          {selectedStudios.map((id) => (
            <Badge
              key={id}
              variant="secondary"
              className="bg-amber-500/10 text-amber-400 cursor-pointer hover:bg-amber-500/20"
              onClick={() => toggleStudio(id)}
            >
              {getStudioName(id)}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Composant item de studio
function StudioItem({
  studio,
  isSelected,
  onClick,
}: {
  studio: ProductionCompany;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
        isSelected
          ? "bg-amber-500/20 text-amber-400"
          : "hover:bg-white/5 text-white/70"
      )}
    >
      {studio.logo_path ? (
        <div className="w-8 h-6 flex items-center justify-center">
          <img
            src={getImageUrl(studio.logo_path, "w92") || ""}
            alt={studio.name}
            className="max-w-full max-h-full object-contain filter brightness-0 invert opacity-70"
          />
        </div>
      ) : (
        <div className="w-8 h-6 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-white/30" />
        </div>
      )}
      <span className="flex-1 text-sm truncate">{studio.name}</span>
      {isSelected && <Check className="w-4 h-4 text-amber-400" />}
    </button>
  );
}
