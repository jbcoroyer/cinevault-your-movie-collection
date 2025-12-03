import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-7xl mx-auto">
        <h1 className="text-xl font-bold text-foreground">
          Cine<span className="text-primary">Vault</span>
        </h1>
        
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold transition-transform hover:scale-105"
        >
          {getInitials()}
        </button>
      </div>
    </header>
  );
};
