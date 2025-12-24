/**
 * CineVault - Auth Page - Radical Minimalist Design
 */

import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

const emailSchema = z.string().email("Email invalide");
const passwordSchema = z.string()
  .min(8, "Minimum 8 caractères")
  .regex(/[A-Z]/, "Doit contenir une majuscule")
  .regex(/[0-9]/, "Doit contenir un chiffre");

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();

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

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
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
            title: "Compte créé",
            description: "Vérifiez votre email pour confirmer.",
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 mb-12 group">
          <span className="text-xl font-bold tracking-tight">
            Cine<span className="text-muted-foreground">Vault</span>
          </span>
        </Link>

        {/* Title */}
        <h1 className="text-heading-mobile md:text-3xl font-bold mb-2">
          {isLogin ? "Connexion" : "Créer un compte"}
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          {isLogin
            ? "Retrouvez votre collection."
            : "Commencez votre collection."}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none py-3 text-base"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Mot de passe
              </label>
              {isLogin && (
                <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                  Oublié ?
                </Link>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none py-3 pr-10 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Confirmation
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none py-3 text-base"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </motion.div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-foreground text-background hover:bg-foreground/90 min-h-[48px] text-base font-medium"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border border-background/30 border-t-background rounded-full animate-spin" />
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
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-background px-4 text-muted-foreground">ou</span>
          </div>
        </div>

        {/* Google */}
        <Button
          type="button"
          variant="outline"
          className="w-full border-border hover:bg-card min-h-[48px]"
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

        {/* Footer */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Pas encore de compte ? " : "Déjà membre ? "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-foreground hover:underline"
            >
              {isLogin ? "Créer un compte" : "Se connecter"}
            </button>
          </p>

          <Link
            to="/"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            Retour
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
