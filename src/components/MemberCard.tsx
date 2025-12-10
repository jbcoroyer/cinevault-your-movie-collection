import { GlassCard } from "@/components/ui/GlassCard";
import { Film, Crown } from "lucide-react";

interface MemberCardProps {
  username: string;
  joinDate?: string;
  level?: number;
  streamingServices?: string[];
  className?: string;
}

export const MemberCard = ({ 
  username, 
  joinDate, 
  level = 1, 
  streamingServices = [], 
  className 
}: MemberCardProps) => {
  return (
    <div className={`relative aspect-[1.586/1] perspective-1000 group ${className}`}>
      <div className="absolute inset-0 bg-amber-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-60" />
      
      <GlassCard 
        variant="gold" 
        className="w-full h-full flex flex-col justify-between p-5 sm:p-6 relative overflow-hidden border-amber-500/30 transform transition-transform group-hover:scale-[1.02] duration-500 shadow-2xl"
      >
        {/* Shine effect */}
        <div className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] translate-x-[-200%] animate-[shine_8s_infinite]" />
        
        <div className="flex justify-between items-start z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black">
              <Film className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-lg sm:text-xl leading-none tracking-tight">CineVault</p>
              <p className="text-[10px] sm:text-xs text-amber-500/90 tracking-[0.2em] uppercase font-semibold mt-1">Member Card</p>
            </div>
          </div>
          <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 drop-shadow-glow animate-pulse" />
        </div>

        <div className="text-left z-10 space-y-1 my-2">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Titulaire</p>
          <p className="font-display text-xl sm:text-3xl font-bold truncate tracking-tight text-foreground/90">{username}</p>
          {joinDate && (
            <p className="text-[10px] text-muted-foreground/60">
              Membre depuis {new Date(joinDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}
            </p>
          )}
        </div>

        <div className="flex justify-between items-end z-10">
           <div className="flex gap-2">
             {streamingServices.slice(0, 4).map((s, i) => (
               <div key={i} className="w-2 h-2 rounded-full bg-white/40 ring-1 ring-white/10" />
             ))}
           </div>
           <div className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-500/10 border border-amber-500/30 backdrop-blur-md">
             <span className="text-amber-500 text-[10px] sm:text-xs font-black tracking-wider">NIVEAU {level}</span>
           </div>
        </div>
      </GlassCard>
    </div>
  );
};
