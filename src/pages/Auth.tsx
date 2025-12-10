import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Disc, Sparkles, Film, Clapperboard } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";

const emailSchema = z.string().email("Email invalide");
const passwordSchema = z.string().min(6, "Minimum 6 caractères");

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  // Détecter le mode via l'URL (?mode=signup)
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("mode") === "signup") {
      setIsLogin(false);
    }
  }, [location]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [animateCard, setAnimateCard] = useState(false);

  // Animation simple au changement de mode
  const toggleMode = () => {
    setAnimateCard(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setErrors({});
      setAnimateCard(false);
    }, 300);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (!isLogin && password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const { error } = isLogin ? await signIn(email, password) : await signUp(email, password);

      if (error) {
        let message = error.message;
        if (error.message.includes("Invalid login credentials")) {
          message = "Email ou mot de passe incorrect";
        } else if (error.message.includes("User already registered")) {
          message = "Cet email est déjà utilisé";
        }
        toast({ title: "Erreur", description: message, variant: "destructive" });
      } else {
        if (isLogin) {
          navigate("/");
        } else {
          toast({
            title: "Compte créé avec succès !",
            description: "Vérifiez votre email pour confirmer votre compte.",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden selection:bg-primary/30">
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Orbs animés */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px] animate-float opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-500/10 blur-[120px] animate-float-delayed opacity-60" />

        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
      </div>

      <div className="w-full max-w-md px-4 z-10 flex flex-col gap-6">
        {/* --- HEADER --- */}
        <div className="text-center animate-fade-in-up">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group transition-transform hover:scale-105">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all duration-300">
              <Disc className="w-6 h-6 text-white animate-spin-slow" />
              <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight">
              Cine<span className="text-amber-500">Vault</span>
            </span>
          </Link>

          <h1 className="text-3xl font-display font-bold mb-2">{isLogin ? "Bon retour !" : "Rejoignez le club"}</h1>
          <p className="text-muted-foreground text-balance">
            {isLogin
              ? "Gérez votre collection et retrouvez vos films préférés."
              : "Créez votre vidéothèque numérique ultime dès maintenant."}
          </p>
        </div>

        {/* --- MAIN CARD --- */}
        <GlassCard
          variant="strong"
          className={cn(
            "p-6 sm:p-8 backdrop-blur-3xl transition-all duration-300 ease-out transform",
            animateCard ? "scale-95 opacity-50 blur-sm" : "scale-100 opacity-100 blur-0",
          )}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs uppercase tracking-wider text-muted-foreground font-semibold ml-1"
              >
                Email
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="neo@matrix.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background/50 border-white/10 focus:border-primary/50 transition-all h-11"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 font-medium ml-1 animate-in slide-in-from-left-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label
                  htmlFor="password"
                  className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                >
                  Mot de passe
                </Label>
                {isLogin && (
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    Oublié ?
                  </Link>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-background/50 border-white/10 focus:border-primary/50 transition-all h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 font-medium ml-1 animate-in slide-in-from-left-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password (Signup only) */}
            {!isLogin && (
              <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                <Label
                  htmlFor="confirmPassword"
                  className="text-xs uppercase tracking-wider text-muted-foreground font-semibold ml-1"
                >
                  Confirmation
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-background/50 border-white/10 focus:border-primary/50 transition-all h-11"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-400 font-medium ml-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 bg-gradient-to-r from-primary to-indigo-600 hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Chargement...
                </span>
              ) : isLogin ? (
                "Se connecter"
              ) : (
                "Créer mon compte"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-background/80 backdrop-blur px-2 text-muted-foreground">ou continuer avec</span>
            </div>
          </div>

          {/* Google Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 bg-background/50 hover:bg-background border-white/10 hover:border-white/20 transition-all"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
        </GlassCard>

        {/* --- FOOTER LINKS --- */}
        <div className="text-center space-y-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Pas encore de compte ? " : "Déjà membre ? "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary hover:text-primary/80 font-semibold hover:underline transition-all"
            >
              {isLogin ? "Créer un compte" : "Se connecter"}
            </button>
          </p>

          <Link
            to="/"
            className="inline-flex items-center text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            Continuer sans compte
          </Link>
        </div>

        {/* --- DECORATIONS --- */}
        <div className="absolute top-1/2 -left-12 -rotate-12 opacity-10 pointer-events-none hidden md:block">
          <Film className="w-24 h-24 text-foreground" />
        </div>
        <div className="absolute bottom-12 -right-6 rotate-12 opacity-10 pointer-events-none hidden md:block">
          <Clapperboard className="w-32 h-32 text-foreground" />
        </div>
        <div className="absolute top-20 right-[15%] opacity-30 animate-pulse hidden md:block">
          <Sparkles className="w-6 h-6 text-amber-500" />
        </div>
      </div>
    </div>
  );
}
