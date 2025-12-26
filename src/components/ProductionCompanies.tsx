import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { ProductionCompany } from "@/services/tmdbCompanies";
import { getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";

interface ProductionCompaniesProps {
  companies: ProductionCompany[];
  variant?: "default" | "compact" | "logos-only";
  className?: string;
  maxDisplay?: number;
}

export function ProductionCompanies({
  companies,
  variant = "default",
  className,
  maxDisplay = 5,
}: ProductionCompaniesProps) {
  const navigate = useNavigate();

  if (!companies || companies.length === 0) return null;

  const displayedCompanies = companies.slice(0, maxDisplay);
  const remainingCount = companies.length - maxDisplay;

  const handleClick = (companyId: number) => {
    navigate(`/studio/${companyId}`);
  };

  if (variant === "logos-only") {
    return (
      <div className={cn("flex items-center gap-3 flex-wrap", className)}>
        {displayedCompanies.map((company, index) => (
          <motion.button
            key={company.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleClick(company.id)}
            className="group relative"
            title={company.name}
          >
            {company.logo_path ? (
              <div className="h-8 px-3 py-1 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all">
                <img
                  src={getImageUrl(company.logo_path, "w200") || ""}
                  alt={company.name}
                  className="h-full w-auto object-contain filter brightness-0 invert opacity-70 group-hover:opacity-100 transition-opacity"
                />
              </div>
            ) : (
              <div className="h-8 px-3 py-1 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all flex items-center gap-2">
                <Building2 className="w-4 h-4 text-white/50" />
                <span className="text-xs text-white/70">{company.name}</span>
              </div>
            )}
          </motion.button>
        ))}
        {remainingCount > 0 && (
          <span className="text-xs text-white/40">+{remainingCount}</span>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {displayedCompanies.map((company) => (
          <button
            key={company.id}
            onClick={() => handleClick(company.id)}
            className="text-xs text-white/60 hover:text-amber-400 transition-colors"
          >
            {company.name}
          </button>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-xs text-white/40 uppercase tracking-wider">Production</h3>
      <div className="flex flex-wrap gap-3">
        {displayedCompanies.map((company, index) => (
          <motion.button
            key={company.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleClick(company.id)}
            className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 transition-all"
          >
            {company.logo_path ? (
              <div className="w-12 h-8 flex items-center justify-center">
                <img
                  src={getImageUrl(company.logo_path, "w200") || ""}
                  alt={company.name}
                  className="max-w-full max-h-full object-contain filter brightness-0 invert opacity-60 group-hover:opacity-100 transition-opacity"
                />
              </div>
            ) : (
              <div className="w-12 h-8 flex items-center justify-center bg-white/10 rounded">
                <Building2 className="w-5 h-5 text-white/40" />
              </div>
            )}
            <div className="text-left">
              <p className="text-sm text-white group-hover:text-amber-400 transition-colors">
                {company.name}
              </p>
              {company.origin_country && (
                <p className="text-xs text-white/40">{company.origin_country}</p>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Version inline pour les cartes de films
interface InlineStudiosProps {
  companies: { id: number; name: string; logo_path: string | null }[];
  className?: string;
}

export function InlineStudios({ companies, className }: InlineStudiosProps) {
  const navigate = useNavigate();

  if (!companies || companies.length === 0) return null;

  // Afficher max 2 studios
  const displayedCompanies = companies.slice(0, 2);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {displayedCompanies.map((company) => (
        <button
          key={company.id}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/studio/${company.id}`);
          }}
          className="group"
        >
          {company.logo_path ? (
            <img
              src={getImageUrl(company.logo_path, "w92") || ""}
              alt={company.name}
              className="h-4 w-auto object-contain filter brightness-0 invert opacity-50 group-hover:opacity-100 transition-opacity"
              title={company.name}
            />
          ) : (
            <span className="text-[10px] text-white/40 group-hover:text-white/70 transition-colors">
              {company.name}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
