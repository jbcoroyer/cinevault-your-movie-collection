import React from "react";
import { X, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  PhysicalFormat,
  PhysicalCondition,
  formatLabels,
  formatColors,
  conditionLabels,
  conditionColors,
} from "@/services/physicalMovies";
import { CollectionFilters as FiltersType } from "@/hooks/useCollectionFilters";

interface CollectionFiltersProps {
  filters: FiltersType;
  filterOptions: {
    genres: string[];
    decades: string[];
    directors: string[];
    priceRange: { min: number; max: number };
  };
  toggleFormat: (format: PhysicalFormat) => void;
  toggleCondition: (condition: PhysicalCondition) => void;
  toggleGenre: (genre: string) => void;
  toggleDecade: (decade: string) => void;
  toggleDirector: (director: string) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

const allFormats: PhysicalFormat[] = ["dvd", "bluray", "4k", "steelbook", "collector"];
const allConditions: PhysicalCondition[] = ["mint", "very_good", "good", "acceptable"];

export const CollectionFiltersDrawer: React.FC<CollectionFiltersProps> = ({
  filters,
  filterOptions,
  toggleFormat,
  toggleCondition,
  toggleGenre,
  toggleDecade,
  toggleDirector,
  setPriceRange,
  resetFilters,
  hasActiveFilters,
  activeFilterCount,
}) => {
  const [open, setOpen] = React.useState(false);
  const [priceValue, setPriceValue] = React.useState<[number, number]>([
    filterOptions.priceRange.min,
    filterOptions.priceRange.max,
  ]);

  const handlePriceChange = (value: number[]) => {
    setPriceValue([value[0], value[1]]);
  };

  const handlePriceCommit = () => {
    const isMinDefault = priceValue[0] === filterOptions.priceRange.min;
    const isMaxDefault = priceValue[1] === filterOptions.priceRange.max;
    setPriceRange(
      isMinDefault ? null : priceValue[0],
      isMaxDefault ? null : priceValue[1]
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filtres
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </SheetTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-muted-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-6">
            {/* Formats */}
            <FilterSection title="Format">
              <div className="flex flex-wrap gap-2">
                {allFormats.map((format) => (
                  <FilterChip
                    key={format}
                    label={formatLabels[format]}
                    isActive={filters.formats.includes(format)}
                    onClick={() => toggleFormat(format)}
                    colorClass={formatColors[format]}
                  />
                ))}
              </div>
            </FilterSection>

            <Separator />

            {/* Condition */}
            <FilterSection title="État">
              <div className="flex flex-wrap gap-2">
                {allConditions.map((condition) => (
                  <FilterChip
                    key={condition}
                    label={conditionLabels[condition]}
                    isActive={filters.conditions.includes(condition)}
                    onClick={() => toggleCondition(condition)}
                    colorClass={conditionColors[condition]}
                  />
                ))}
              </div>
            </FilterSection>

            <Separator />

            {/* Genres */}
            {filterOptions.genres.length > 0 && (
              <>
                <FilterSection title="Genre">
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.genres.slice(0, 15).map((genre) => (
                      <FilterChip
                        key={genre}
                        label={genre}
                        isActive={filters.genres.includes(genre)}
                        onClick={() => toggleGenre(genre)}
                      />
                    ))}
                  </div>
                </FilterSection>
                <Separator />
              </>
            )}

            {/* Décennies */}
            {filterOptions.decades.length > 0 && (
              <>
                <FilterSection title="Décennie">
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.decades.map((decade) => (
                      <FilterChip
                        key={decade}
                        label={decade}
                        isActive={filters.decades.includes(decade)}
                        onClick={() => toggleDecade(decade)}
                      />
                    ))}
                  </div>
                </FilterSection>
                <Separator />
              </>
            )}

            {/* Réalisateurs (top 10) */}
            {filterOptions.directors.length > 0 && (
              <>
                <FilterSection title="Réalisateur">
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.directors.slice(0, 10).map((director) => (
                      <FilterChip
                        key={director}
                        label={director}
                        isActive={filters.directors.includes(director)}
                        onClick={() => toggleDirector(director)}
                      />
                    ))}
                  </div>
                </FilterSection>
                <Separator />
              </>
            )}

            {/* Prix */}
            {filterOptions.priceRange.max > 0 && (
              <FilterSection title="Fourchette de prix">
                <div className="space-y-4">
                  <Slider
                    value={priceValue}
                    onValueChange={handlePriceChange}
                    onValueCommit={handlePriceCommit}
                    min={filterOptions.priceRange.min}
                    max={filterOptions.priceRange.max}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{priceValue[0].toFixed(0)} €</span>
                    <span>{priceValue[1].toFixed(0)} €</span>
                  </div>
                </div>
              </FilterSection>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

// Sous-composants
interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, children }) => (
  <div className="space-y-3">
    <h3 className="text-sm font-medium text-foreground">{title}</h3>
    {children}
  </div>
);

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  colorClass?: string;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, isActive, onClick, colorClass }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
      isActive
        ? colorClass
          ? `${colorClass} text-white`
          : "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground hover:bg-muted/80"
    )}
  >
    {label}
  </button>
);

// Barre de filtres actifs (à afficher au-dessus de la liste)
interface ActiveFiltersBarProps {
  filters: FiltersType;
  toggleFormat: (format: PhysicalFormat) => void;
  toggleCondition: (condition: PhysicalCondition) => void;
  toggleGenre: (genre: string) => void;
  toggleDecade: (decade: string) => void;
  toggleDirector: (director: string) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({
  filters,
  toggleFormat,
  toggleCondition,
  toggleGenre,
  toggleDecade,
  toggleDirector,
  setPriceRange,
  resetFilters,
  hasActiveFilters,
}) => {
  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-sm text-muted-foreground">Filtres actifs:</span>
      
      {filters.formats.map((format) => (
        <ActiveFilterChip
          key={`format-${format}`}
          label={formatLabels[format]}
          onRemove={() => toggleFormat(format)}
        />
      ))}
      
      {filters.conditions.map((condition) => (
        <ActiveFilterChip
          key={`condition-${condition}`}
          label={conditionLabels[condition]}
          onRemove={() => toggleCondition(condition)}
        />
      ))}
      
      {filters.genres.map((genre) => (
        <ActiveFilterChip
          key={`genre-${genre}`}
          label={genre}
          onRemove={() => toggleGenre(genre)}
        />
      ))}
      
      {filters.decades.map((decade) => (
        <ActiveFilterChip
          key={`decade-${decade}`}
          label={decade}
          onRemove={() => toggleDecade(decade)}
        />
      ))}
      
      {filters.directors.map((director) => (
        <ActiveFilterChip
          key={`director-${director}`}
          label={director}
          onRemove={() => toggleDirector(director)}
        />
      ))}
      
      {(filters.priceMin !== null || filters.priceMax !== null) && (
        <ActiveFilterChip
          label={`${filters.priceMin || 0}€ - ${filters.priceMax || "∞"}€`}
          onRemove={() => setPriceRange(null, null)}
        />
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={resetFilters}
        className="text-xs text-muted-foreground h-7"
      >
        Tout effacer
      </Button>
    </div>
  );
};

interface ActiveFilterChipProps {
  label: string;
  onRemove: () => void;
}

const ActiveFilterChip: React.FC<ActiveFilterChipProps> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
    {label}
    <button
      onClick={onRemove}
      className="hover:bg-primary/20 rounded-full p-0.5"
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);
