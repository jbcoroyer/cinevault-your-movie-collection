import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Keyboard, Search } from "lucide-react";
import { isValidEAN } from "@/services/barcodeService";

interface ManualBarcodeInputProps {
  onSubmit: (ean: string) => void;
  disabled?: boolean;
}

export const ManualBarcodeInput: React.FC<ManualBarcodeInputProps> = ({
  onSubmit,
  disabled,
}) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setError("Veuillez entrer un code-barres");
      return;
    }

    if (!isValidEAN(trimmed)) {
      setError("Code-barres invalide. Formats acceptés : EAN-13, EAN-8, UPC-A");
      return;
    }

    setError(null);
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Keyboard className="w-4 h-4" />
        <span>Entrez le code-barres manuellement</span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Ex: 3700301047236"
            value={value}
            onChange={(e) => {
              setValue(e.target.value.replace(/\D/g, ""));
              setError(null);
            }}
            disabled={disabled}
            className="font-mono"
            maxLength={13}
          />
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
        <Button type="submit" disabled={disabled || !value.trim()}>
          <Search className="w-4 h-4 mr-2" />
          Rechercher
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        Le code-barres se trouve généralement au dos du boîtier DVD/Blu-ray
      </p>
    </div>
  );
};
