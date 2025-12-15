import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  CameraOff,
  Keyboard,
  Scan,
  Loader2,
  CheckCircle2,
  XCircle,
  Package,
  Film,
  Trash2,
  Plus,
  ChevronRight,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { cn } from "@/lib/utils";
import { ManualBarcodeInput } from "./ManualBarcodeInput";
import { ScanResultCard } from "./ScanResultCard";
import {
  lookupBarcode,
  isValidEAN,
  normalizeEAN,
  ScanQueueItem,
  setCachedMapping,
  detectFormatFromTitle,
} from "@/services/barcodeService";
import { Movie } from "@/services/tmdb";
import { PhysicalFormat } from "@/services/physicalMovies";
import { toast } from "@/hooks/use-toast";

// ============================================
// Types
// ============================================

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoviesSelected: (
    movies: Array<{
      movie: Movie;
      format: PhysicalFormat;
      ean?: string;
    }>
  ) => void;
}

interface ScannedItem extends ScanQueueItem {
  movies?: Movie[];
  detectedFormat?: PhysicalFormat;
}

// ============================================
// Sound Effects
// ============================================

const playBeep = (success: boolean = true) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = success ? 1200 : 400;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (e) {
    // Audio not supported
  }
};

// ============================================
// Main Component
// ============================================

export const BarcodeScannerDialog: React.FC<BarcodeScannerDialogProps> = ({
  open,
  onOpenChange,
  onMoviesSelected,
}) => {
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [continuousMode, setContinuousMode] = useState(true);

  // Scanned items queue
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [processingEan, setProcessingEan] = useState<string | null>(null);

  // Scanner instance
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const lastScannedRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  // ============================================
  // Scanner Lifecycle
  // ============================================

  const startScanner = useCallback(async () => {
    if (!scannerContainerRef.current) return;

    try {
      setCameraError(null);

      // Create scanner instance
      const scanner = new Html5Qrcode("barcode-scanner-container");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 120 },
          aspectRatio: 1.777,
          disableFlip: false,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // QR code not detected - ignore
        }
      );

      setIsScanning(true);
    } catch (error: any) {
      console.error("[Scanner] Start error:", error);
      setCameraError(
        error.message?.includes("NotAllowedError") || error.message?.includes("Permission")
          ? "Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur."
          : "Impossible d'accéder à la caméra. Vérifiez que votre appareil dispose d'une caméra."
      );
      setIsScanning(false);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (error) {
        console.error("[Scanner] Stop error:", error);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Start scanner when dialog opens on camera tab
  useEffect(() => {
    if (open && activeTab === "camera") {
      // Small delay to ensure DOM is ready
      const timeout = setTimeout(() => {
        startScanner();
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      stopScanner();
    }
  }, [open, activeTab, startScanner, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // ============================================
  // Scan Handlers
  // ============================================

  const handleScanSuccess = async (decodedText: string) => {
    const now = Date.now();

    // Debounce: ignore same code within 2 seconds
    if (
      decodedText === lastScannedRef.current &&
      now - lastScanTimeRef.current < 2000
    ) {
      return;
    }

    // Validate EAN
    if (!isValidEAN(decodedText)) {
      console.log("[Scanner] Invalid EAN:", decodedText);
      return;
    }

    const normalizedEan = normalizeEAN(decodedText);

    // Check if already scanned
    if (scannedItems.some((item) => item.ean === normalizedEan)) {
      if (soundEnabled) playBeep(false);
      toast({
        title: "Déjà scanné",
        description: "Ce code-barres est déjà dans la liste.",
        variant: "destructive",
      });
      return;
    }

    lastScannedRef.current = decodedText;
    lastScanTimeRef.current = now;

    if (soundEnabled) playBeep(true);

    // Add to queue and process
    await processBarcode(normalizedEan);
  };

  const processBarcode = async (ean: string) => {
    setProcessingEan(ean);

    // Add pending item
    setScannedItems((prev) => [
      ...prev,
      { ean, status: "processing" },
    ]);

    try {
      const result = await lookupBarcode(ean);

      setScannedItems((prev) =>
        prev.map((item) =>
          item.ean === ean
            ? {
                ...item,
                // Mark as found if product exists (even without TMDB matches)
                status: result.success && result.product ? "found" : "not_found",
                product: result.product,
                movies: result.movies || [],
                error: result.error,
                detectedFormat: result.product
                  ? detectFormatFromTitle(result.product.title)
                  : "bluray",
              }
            : item
        )
      );

      if (result.success && result.movies?.length) {
        toast({
          title: "Film trouvé !",
          description: result.product?.title || "Correspondance TMDB trouvée",
        });
      } else {
        toast({
          title: "Produit non trouvé",
          description: "Vous pouvez rechercher manuellement le film.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setScannedItems((prev) =>
        prev.map((item) =>
          item.ean === ean
            ? { ...item, status: "error", error: "Erreur de recherche" }
            : item
        )
      );
    } finally {
      setProcessingEan(null);
    }
  };

  const handleManualEan = (ean: string) => {
    const normalizedEan = normalizeEAN(ean);

    if (scannedItems.some((item) => item.ean === normalizedEan)) {
      toast({
        title: "Déjà ajouté",
        description: "Ce code-barres est déjà dans la liste.",
        variant: "destructive",
      });
      return;
    }

    processBarcode(normalizedEan);
  };

  // ============================================
  // Item Management
  // ============================================

  const handleSelectMovie = (ean: string, movie: Movie) => {
    setScannedItems((prev) =>
      prev.map((item) =>
        item.ean === ean ? { ...item, selectedMovie: movie } : item
      )
    );
  };

  const handleRemoveItem = (ean: string) => {
    setScannedItems((prev) => prev.filter((item) => item.ean !== ean));
  };

  const handleChangeFormat = (ean: string, format: PhysicalFormat) => {
    setScannedItems((prev) =>
      prev.map((item) =>
        item.ean === ean ? { ...item, detectedFormat: format } : item
      )
    );
  };

  // ============================================
  // Submit
  // ============================================

  const selectedCount = scannedItems.filter(
    (item) => item.selectedMovie && item.status === "found"
  ).length;

  const handleSubmit = async () => {
    const moviesToAdd = scannedItems
      .filter((item) => item.selectedMovie && item.status === "found")
      .map((item) => ({
        movie: item.selectedMovie!,
        format: item.detectedFormat || "bluray",
        ean: item.ean,
      }));

    if (moviesToAdd.length === 0) {
      toast({
        title: "Aucun film sélectionné",
        description: "Sélectionnez au moins un film à ajouter.",
        variant: "destructive",
      });
      return;
    }

    // Cache the EAN → TMDB mappings for future scans
    for (const item of moviesToAdd) {
      if (item.ean) {
        await setCachedMapping(item.ean, item.movie.id, item.movie.title);
      }
    }

    onMoviesSelected(moviesToAdd);
    handleClose();
  };

  const handleClose = () => {
    stopScanner();
    setScannedItems([]);
    setProcessingEan(null);
    setCameraError(null);
    onOpenChange(false);
  };

  // ============================================
  // Render
  // ============================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-videoclub-surface border-videoclub-cyan/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Scan className="w-5 h-5 text-videoclub-cyan" />
            Scanner des codes-barres
            {scannedItems.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 bg-videoclub-cyan/20 text-videoclub-cyan"
              >
                {scannedItems.length} scanné{scannedItems.length > 1 ? "s" : ""}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Scannez les codes-barres de vos DVD/Blu-ray pour les ajouter rapidement
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "camera" | "manual")}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2 bg-background/50">
            <TabsTrigger value="camera" className="gap-2">
              <Camera className="w-4 h-4" />
              Caméra
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Keyboard className="w-4 h-4" />
              Saisie manuelle
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 space-y-4">
            {/* Camera Tab */}
            <TabsContent value="camera" className="m-0 space-y-4">
              {/* Scanner Controls */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={cn(
                      "gap-1",
                      soundEnabled
                        ? "border-videoclub-cyan/30"
                        : "border-muted"
                    )}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setContinuousMode(!continuousMode)}
                    className={cn(
                      "gap-1",
                      continuousMode
                        ? "border-videoclub-cyan/30 bg-videoclub-cyan/10"
                        : "border-muted"
                    )}
                  >
                    <Zap className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {continuousMode ? "Continu" : "Simple"}
                    </span>
                  </Button>
                </div>

                {isScanning && (
                  <Badge variant="outline" className="border-green-500 text-green-500">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                    Scanner actif
                  </Badge>
                )}
              </div>

              {/* Camera Preview */}
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                {cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <CameraOff className="w-12 h-12 text-red-500 mb-4" />
                    <p className="text-sm text-muted-foreground">{cameraError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={startScanner}
                    >
                      Réessayer
                    </Button>
                  </div>
                ) : (
                  <>
                    <div
                      id="barcode-scanner-container"
                      ref={scannerContainerRef}
                      className="w-full h-full"
                    />

                    {/* Scanning Overlay */}
                    {!isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <Loader2 className="w-8 h-8 animate-spin text-videoclub-cyan" />
                      </div>
                    )}

                    {/* Scan Target Guide */}
                    {isScanning && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-72 h-24 border-2 border-videoclub-cyan rounded-lg relative">
                          <div className="absolute inset-0 border-2 border-videoclub-cyan/30 animate-pulse rounded-lg" />
                          {/* Corner markers */}
                          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-videoclub-cyan" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-videoclub-cyan" />
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-videoclub-cyan" />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-videoclub-cyan" />
                        </div>
                      </div>
                    )}

                    {/* Processing indicator */}
                    {processingEan && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-full flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-videoclub-cyan" />
                        <span className="text-sm font-mono">{processingEan}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Placez le code-barres dans le cadre • Les formats EAN-13, EAN-8 et UPC-A sont supportés
              </p>
            </TabsContent>

            {/* Manual Tab */}
            <TabsContent value="manual" className="m-0">
              <ManualBarcodeInput
                onSubmit={handleManualEan}
                disabled={!!processingEan}
              />
            </TabsContent>

            {/* Scanned Items List */}
            {scannedItems.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Films scannés ({scannedItems.length})
                  </h4>
                  {scannedItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScannedItems([])}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Tout effacer
                    </Button>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {scannedItems.map((item) => (
                    <ScanResultCard
                      key={item.ean}
                      item={item}
                      onSelectMovie={(movie) => handleSelectMovie(item.ean, movie)}
                      onChangeFormat={(format) => handleChangeFormat(item.ean, format)}
                      onRemove={() => handleRemoveItem(item.ean)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border mt-auto">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={selectedCount === 0}
            className="gap-2 bg-gradient-to-r from-videoclub-cyan to-videoclub-magenta hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Ajouter {selectedCount > 0 ? `${selectedCount} film${selectedCount > 1 ? "s" : ""}` : ""}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
