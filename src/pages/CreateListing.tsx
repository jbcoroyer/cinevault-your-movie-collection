/**
 * CineVault - Create Listing Page
 * 
 * Formulaire de création d'annonce avec:
 * - Recherche TMDB
 * - Sélection format/état
 * - Upload photos
 * - Prix et livraison
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  Search,
  Film,
  Disc,
  Package,
  Euro,
  Truck,
  Camera,
  X,
  Plus,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Box,
  BookOpen,
  Save,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentSellerProfile } from "@/services/sellerService";
import { createListing, publishListing, type CreateListingData } from "@/services/listingService";
import { toast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

// ============================================
// Types
// ============================================

interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
}

type ListingCondition = "mint" | "near_mint" | "very_good" | "good" | "acceptable";

const CONDITIONS: { id: ListingCondition; label: string; description: string }[] = [
  { id: "mint", label: "Neuf (Mint)", description: "Jamais ouvert, sous blister" },
  { id: "near_mint", label: "Comme neuf", description: "Parfait état, ouvert mais jamais utilisé" },
  { id: "very_good", label: "Très bon état", description: "Légères traces sur le boîtier" },
  { id: "good", label: "Bon état", description: "Usure normale, quelques marques" },
  { id: "acceptable", label: "Acceptable", description: "Usure visible mais fonctionnel" },
];

const FORMATS = [
  { id: "4k", label: "4K Ultra HD", icon: Disc, color: "text-purple-400" },
  { id: "bluray", label: "Blu-ray", icon: Disc, color: "text-blue-400" },
  { id: "steelbook", label: "Steelbook", icon: Box, color: "text-amber-400" },
  { id: "collector", label: "Édition Collector", icon: Sparkles, color: "text-rose-400" },
  { id: "dvd", label: "DVD", icon: Disc, color: "text-zinc-400" },
];

// ============================================
// Movie Search Component
// ============================================

interface MovieSearchProps {
  onSelect: (movie: TMDBMovie) => void;
  selected: TMDBMovie | null;
}

const MovieSearch = ({ onSelect, selected }: MovieSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const searchMovies = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // Note: In production, this would go through your backend
        const response = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(debouncedQuery)}&language=fr-FR`
        );
        const data = await response.json();
        setResults(data.results?.slice(0, 8) || []);
      } catch (error) {
        console.error("TMDB search error:", error);
      } finally {
        setLoading(false);
      }
    };

    searchMovies();
  }, [debouncedQuery]);

  if (selected) {
    return (
      <div className="flex gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
        <img
          src={
            selected.poster_path
              ? `https://image.tmdb.org/t/p/w92${selected.poster_path}`
              : "/placeholder-movie.png"
          }
          alt={selected.title}
          className="w-16 h-24 rounded object-cover"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">{selected.title}</h3>
          <p className="text-sm text-muted-foreground">
            {selected.release_date?.slice(0, 4) || "Date inconnue"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {selected.overview}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSelect(null as any)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un film..."
          className="pl-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {results.map((movie) => (
            <button
              key={movie.id}
              onClick={() => {
                onSelect(movie);
                setQuery("");
                setResults([]);
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
                    : "/placeholder-movie.png"
                }
                alt={movie.title}
                className="w-full aspect-[2/3] rounded object-cover mb-2"
              />
              <p className="text-sm font-medium truncate">{movie.title}</p>
              <p className="text-xs text-muted-foreground">
                {movie.release_date?.slice(0, 4)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// Image Upload Component
// ============================================

interface ImageUploadProps {
  images: File[];
  onChange: (images: File[]) => void;
  maxImages?: number;
}

const ImageUpload = ({ images, onChange, maxImages = 5 }: ImageUploadProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (f) => f.type.startsWith("image/") && f.size < 10 * 1024 * 1024
    );

    if (images.length + validFiles.length > maxImages) {
      toast({
        title: "Limite atteinte",
        description: `Maximum ${maxImages} images autorisées.`,
        variant: "destructive",
      });
      return;
    }

    onChange([...images, ...validFiles]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {images.map((file, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
            <img
              src={URL.createObjectURL(file)}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
            {index === 0 && (
              <Badge className="absolute bottom-1 left-1 text-xs bg-amber-500 text-black">
                Photo principale
              </Badge>
            )}
          </div>
        ))}

        {images.length < maxImages && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-white/20 hover:border-amber-500/50 transition-colors flex flex-col items-center justify-center cursor-pointer">
            <Camera className="w-6 h-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Ajouter</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {images.length}/{maxImages} photos • Max 10 Mo par image • La première sera la photo principale
      </p>
    </div>
  );
};

// ============================================
// Main Create Listing Page
// ============================================

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // Form state
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [format, setFormat] = useState("");
  const [condition, setCondition] = useState<ListingCondition>("very_good");
  const [conditionNotes, setConditionNotes] = useState("");
  const [priceCents, setPriceCents] = useState(0);
  const [description, setDescription] = useState("");
  const [edition, setEdition] = useState("");
  const [regionCode, setRegionCode] = useState("B");
  const [isSealed, setIsSealed] = useState(false);
  const [includesSlipcover, setIncludesSlipcover] = useState(false);
  const [includesBooklet, setIncludesBooklet] = useState(false);
  const [shippingDomesticCents, setShippingDomesticCents] = useState(399);
  const [shippingEuCents, setShippingEuCents] = useState(699);
  const [shippingFromCity, setShippingFromCity] = useState("");
  const [acceptsMondialRelay, setAcceptsMondialRelay] = useState(true);
  const [acceptsColissimo, setAcceptsColissimo] = useState(true);
  const [acceptsHandDelivery, setAcceptsHandDelivery] = useState(false);
  const [images, setImages] = useState<File[]>([]);

  // Check seller profile
  useEffect(() => {
    const checkSeller = async () => {
      if (!user) {
        navigate("/auth?redirect=/sell/new");
        return;
      }

      try {
        const profile = await getCurrentSellerProfile(user.id);
        if (!profile || !profile.stripe_onboarding_complete) {
          toast({
            title: "Profil vendeur requis",
            description: "Veuillez d'abord compléter votre inscription vendeur.",
          });
          navigate("/sell");
          return;
        }
        setSellerId(profile.id);
      } catch (error) {
        console.error("Error checking seller:", error);
        navigate("/sell");
      } finally {
        setLoading(false);
      }
    };

    checkSeller();
  }, [user, navigate]);

  // Calculate progress
  const progress = (() => {
    let p = 0;
    if (selectedMovie) p += 25;
    if (format) p += 20;
    if (condition) p += 15;
    if (priceCents > 0) p += 25;
    if (images.length > 0) p += 15;
    return p;
  })();

  // Validate step
  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedMovie;
      case 2:
        return !!format;
      case 3:
        return priceCents >= 100; // Min 1€
      case 4:
        return true;
      default:
        return false;
    }
  };

  // Handle save (draft or publish)
  const handleSave = async (publish: boolean) => {
    if (!sellerId || !selectedMovie) return;

    setSaving(true);
    try {
      const data: CreateListingData = {
        tmdbId: selectedMovie.id,
        movieTitle: selectedMovie.title,
        moviePosterPath: selectedMovie.poster_path || undefined,
        movieReleaseYear: selectedMovie.release_date
          ? parseInt(selectedMovie.release_date.slice(0, 4))
          : undefined,
        format,
        condition,
        conditionNotes: conditionNotes || undefined,
        priceCents,
        description: description || undefined,
        edition: edition || undefined,
        regionCode,
        isSealed,
        includesSlipcover,
        includesBooklet,
        shippingDomesticCents,
        shippingEuCents,
        shippingFromCity: shippingFromCity || undefined,
        acceptsMondialRelay,
        acceptsColissimo,
        acceptsHandDelivery,
        images,
      };

      const result = await createListing(data, sellerId);

      if (!result.success) {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (publish && result.listing) {
        await publishListing(result.listing.id);
        toast({
          title: "Annonce publiée !",
          description: "Votre annonce est maintenant en ligne.",
        });
      } else {
        toast({
          title: "Brouillon enregistré",
          description: "Vous pouvez le modifier depuis votre espace vendeur.",
        });
      }

      navigate("/sell");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'annonce.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-2xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/sell")}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour
              </Button>
              <h1 className="text-xl font-bold">Nouvelle annonce</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {progress}% complété
              </span>
            </div>
          </div>
          <Progress value={progress} className="mt-3 h-1" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Step 1: Movie Selection */}
        <GlassCard className={cn("p-6 mb-4", step !== 1 && selectedMovie && "opacity-60")}>
          <div
            className="flex items-center gap-3 mb-4 cursor-pointer"
            onClick={() => setStep(1)}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                selectedMovie
                  ? "bg-emerald-500 text-black"
                  : step === 1
                  ? "bg-amber-500 text-black"
                  : "bg-white/10"
              )}
            >
              {selectedMovie ? <CheckCircle className="w-5 h-5" /> : "1"}
            </div>
            <div>
              <h2 className="font-semibold">Quel film vendez-vous ?</h2>
              <p className="text-sm text-muted-foreground">
                Recherchez dans notre base de données
              </p>
            </div>
          </div>

          {step === 1 && (
            <>
              <MovieSearch
                selected={selectedMovie}
                onSelect={setSelectedMovie}
              />
              {selectedMovie && (
                <Button
                  className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-black"
                  onClick={() => setStep(2)}
                >
                  Continuer
                </Button>
              )}
            </>
          )}
        </GlassCard>

        {/* Step 2: Format & Condition */}
        <GlassCard className={cn("p-6 mb-4", step !== 2 && format && "opacity-60")}>
          <div
            className="flex items-center gap-3 mb-4 cursor-pointer"
            onClick={() => selectedMovie && setStep(2)}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                format
                  ? "bg-emerald-500 text-black"
                  : step === 2
                  ? "bg-amber-500 text-black"
                  : "bg-white/10"
              )}
            >
              {format ? <CheckCircle className="w-5 h-5" /> : "2"}
            </div>
            <div>
              <h2 className="font-semibold">Format et état</h2>
              <p className="text-sm text-muted-foreground">
                Décrivez votre article
              </p>
            </div>
          </div>

          {step === 2 && (
            <div className="space-y-6">
              {/* Format */}
              <div>
                <Label className="mb-3 block">Format *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FORMATS.map((f) => {
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setFormat(f.id)}
                        className={cn(
                          "p-3 rounded-lg border transition-all flex flex-col items-center gap-2",
                          format === f.id
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-white/10 hover:border-white/30"
                        )}
                      >
                        <Icon className={cn("w-5 h-5", f.color)} />
                        <span className="text-sm font-medium">{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Condition */}
              <div>
                <Label className="mb-3 block">État *</Label>
                <RadioGroup value={condition} onValueChange={(v) => setCondition(v as ListingCondition)}>
                  <div className="space-y-2">
                    {CONDITIONS.map((c) => (
                      <label
                        key={c.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          condition === c.id
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-white/10 hover:border-white/30"
                        )}
                      >
                        <RadioGroupItem value={c.id} />
                        <div>
                          <p className="font-medium text-sm">{c.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Condition notes */}
              <div>
                <Label htmlFor="conditionNotes">Précisions sur l'état</Label>
                <Textarea
                  id="conditionNotes"
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="Décrivez l'état en détail (rayures, marques, etc.)"
                  className="mt-2"
                />
              </div>

              {/* Features */}
              <div className="space-y-3">
                <Label>Caractéristiques</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={isSealed}
                      onCheckedChange={setIsSealed}
                    />
                    <span className="text-sm">Sous blister</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={includesSlipcover}
                      onCheckedChange={setIncludesSlipcover}
                    />
                    <span className="text-sm">Slipcover inclus</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={includesBooklet}
                      onCheckedChange={setIncludesBooklet}
                    />
                    <span className="text-sm">Livret inclus</span>
                  </label>
                </div>
              </div>

              {/* Edition & Region */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edition">Édition</Label>
                  <Input
                    id="edition"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    placeholder="Ex: Criterion, Arrow..."
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Région</Label>
                  <Select value={regionCode} onValueChange={setRegionCode}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Région A</SelectItem>
                      <SelectItem value="B">Région B</SelectItem>
                      <SelectItem value="C">Région C</SelectItem>
                      <SelectItem value="FREE">Zone Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                onClick={() => setStep(3)}
                disabled={!format}
              >
                Continuer
              </Button>
            </div>
          )}
        </GlassCard>

        {/* Step 3: Price & Shipping */}
        <GlassCard className={cn("p-6 mb-4", step !== 3 && priceCents > 0 && "opacity-60")}>
          <div
            className="flex items-center gap-3 mb-4 cursor-pointer"
            onClick={() => format && setStep(3)}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                priceCents > 0
                  ? "bg-emerald-500 text-black"
                  : step === 3
                  ? "bg-amber-500 text-black"
                  : "bg-white/10"
              )}
            >
              {priceCents > 0 ? <CheckCircle className="w-5 h-5" /> : "3"}
            </div>
            <div>
              <h2 className="font-semibold">Prix et livraison</h2>
              <p className="text-sm text-muted-foreground">
                Définissez votre prix de vente
              </p>
            </div>
          </div>

          {step === 3 && (
            <div className="space-y-6">
              {/* Price */}
              <div>
                <Label htmlFor="price">Prix de vente *</Label>
                <div className="relative mt-2">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    step="0.01"
                    value={priceCents > 0 ? priceCents / 100 : ""}
                    onChange={(e) =>
                      setPriceCents(Math.round(parseFloat(e.target.value || "0") * 100))
                    }
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Commission CineVault: 5% soit {((priceCents * 0.05) / 100).toFixed(2)} €
                  • Vous recevrez: {((priceCents * 0.95) / 100).toFixed(2)} €
                </p>
              </div>

              {/* Shipping */}
              <Separator className="bg-white/10" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Livraison France (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingDomesticCents / 100}
                    onChange={(e) =>
                      setShippingDomesticCents(Math.round(parseFloat(e.target.value || "0") * 100))
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Livraison Europe (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingEuCents / 100}
                    onChange={(e) =>
                      setShippingEuCents(Math.round(parseFloat(e.target.value || "0") * 100))
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>Ville d'expédition</Label>
                <Input
                  value={shippingFromCity}
                  onChange={(e) => setShippingFromCity(e.target.value)}
                  placeholder="Ex: Paris, Lyon..."
                  className="mt-2"
                />
              </div>

              {/* Shipping methods */}
              <div className="space-y-3">
                <Label>Modes de livraison acceptés</Label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-sm">Mondial Relay (Point Relais)</span>
                    <Switch
                      checked={acceptsMondialRelay}
                      onCheckedChange={setAcceptsMondialRelay}
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-sm">Colissimo (Domicile)</span>
                    <Switch
                      checked={acceptsColissimo}
                      onCheckedChange={setAcceptsColissimo}
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-sm">Remise en main propre</span>
                    <Switch
                      checked={acceptsHandDelivery}
                      onCheckedChange={setAcceptsHandDelivery}
                    />
                  </label>
                </div>
              </div>

              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                onClick={() => setStep(4)}
                disabled={priceCents < 100}
              >
                Continuer
              </Button>
            </div>
          )}
        </GlassCard>

        {/* Step 4: Photos & Description */}
        <GlassCard className={cn("p-6 mb-4", step !== 4 && "opacity-60")}>
          <div
            className="flex items-center gap-3 mb-4 cursor-pointer"
            onClick={() => priceCents > 0 && setStep(4)}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                images.length > 0
                  ? "bg-emerald-500 text-black"
                  : step === 4
                  ? "bg-amber-500 text-black"
                  : "bg-white/10"
              )}
            >
              {images.length > 0 ? <CheckCircle className="w-5 h-5" /> : "4"}
            </div>
            <div>
              <h2 className="font-semibold">Photos et description</h2>
              <p className="text-sm text-muted-foreground">
                Ajoutez des photos de votre article
              </p>
            </div>
          </div>

          {step === 4 && (
            <div className="space-y-6">
              {/* Images */}
              <div>
                <Label className="mb-3 block">Photos de l'article</Label>
                <ImageUpload images={images} onChange={setImages} />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ajoutez des détails supplémentaires sur votre article..."
                  className="mt-2 min-h-24"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder brouillon
                </Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
                  onClick={() => handleSave(true)}
                  disabled={saving || progress < 75}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Publier l'annonce
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
