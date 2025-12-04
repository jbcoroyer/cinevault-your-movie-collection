import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMovies } from '@/hooks/useUserMovies';
import { useUserTopMovies } from '@/hooks/useUserTopMovies';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { LogOut, Edit2, Check, X, Film, Clock, Heart } from 'lucide-react';
import { Top5Section } from '@/components/Top5Section';

export default function Profile() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { userMovies } = useUserMovies();
  const { topMovies, setTopMovie } = useUserTopMovies();
  const navigate = useNavigate();
  
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);

  const watchedCount = userMovies.filter((m) => m.status === 'watched').length;
  const watchlistCount = userMovies.filter((m) => m.status === 'watchlist').length;
  const favoritesCount = userMovies.filter((m) => m.is_favorite).length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({ username, bio });
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profil mis à jour' });
      setEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setUsername(profile?.username || '');
    setBio(profile?.bio || '');
    setEditing(false);
  };

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    return profile?.username || user?.email?.split('@')[0] || 'Utilisateur';
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold">Profil</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-2 text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="p-4">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold mb-4">
            {getInitials()}
          </div>
          
          {editing ? (
            <div className="w-full max-w-sm space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Pseudo</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Votre pseudo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Une courte bio..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold">{getDisplayName()}</h2>
              {profile?.bio && (
                <p className="text-muted-foreground text-center mt-2 max-w-xs">
                  {profile.bio}
                </p>
              )}
            </>
          )}
        </div>

        {/* Top 5 Films */}
        <Top5Section topMovies={topMovies} onSetMovie={setTopMovie} />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={Film}
            value={watchedCount}
            label="Films vus"
          />
          <StatCard
            icon={Clock}
            value={watchlistCount}
            label="Watchlist"
          />
          <StatCard
            icon={Heart}
            value={favoritesCount}
            label="Favoris"
          />
        </div>

        {/* Email info */}
        <div className="bg-card rounded-card p-4 mb-8">
          <p className="text-sm text-muted-foreground mb-1">Email</p>
          <p className="font-medium">{user?.email}</p>
        </div>

        {/* Sign out */}
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Se déconnecter
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-card rounded-card p-4 text-center">
      <Icon className="w-5 h-5 mx-auto text-primary mb-2" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
