import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface AuthPlaceholderProps {
  icon: React.ElementType;
  title: string;
  description: string;
  features: string[];
}

export const AuthPlaceholder: React.FC<AuthPlaceholderProps> = ({
  icon: Icon,
  title,
  description,
  features,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center animate-fade-in">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-primary/5">
        <Icon className="w-10 h-10 text-primary" />
      </div>
      
      <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-8 text-lg leading-relaxed">
        {description}
      </p>
      
      <div className="grid gap-3 mb-10 text-left w-full max-w-sm">
        {features.map((feature, i) => (
          <div 
            key={i} 
            className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-lg shadow-sm hover:border-primary/30 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="font-medium">{feature}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
        <Button asChild size="lg" className="w-full text-base font-semibold shadow-lg shadow-primary/20">
          <Link to="/auth">
            <LogIn className="w-5 h-5 mr-2" />
            Se connecter
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full text-base font-semibold">
          <Link to="/auth?mode=signup">
            <UserPlus className="w-5 h-5 mr-2" />
            Créer un compte
          </Link>
        </Button>
      </div>
    </div>
  );
};
