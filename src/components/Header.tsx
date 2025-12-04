import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import { Home, Search, Library, User, ListVideo } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/search', icon: Search, label: 'Recherche' },
  { to: '/collection', icon: Library, label: 'Collection' },
  { to: '/lists', icon: ListVideo, label: 'Listes' },
  { to: '/profile', icon: User, label: 'Profil' },
];

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
      <div className="flex items-center justify-between px-4 h-14 container mx-auto">
        <div className="flex items-center gap-8">
          <h1 
            className="text-xl font-bold text-foreground cursor-pointer"
            onClick={() => navigate('/')}
          >
            Cine<span className="text-primary">Vault</span>
          </h1>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        
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