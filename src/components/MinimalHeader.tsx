/**
 * CineVault — Minimal Header (Desktop only)
 * 
 * Radical Minimalist design:
 * - Logo only, centered or left-aligned
 * - No navigation (dock handles that)
 * - Profile menu on right
 */

import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileMenu } from "./ProfileMenu";

export const MinimalHeader = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 hidden md:block">
      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.button 
            whileHover={{ opacity: 0.7 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/")} 
            className="flex items-center gap-3"
          >
            <span className="font-display text-display-sm tracking-wider text-white">
              CINEVAULT
            </span>
          </motion.button>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {!loading && user && (
              <ProfileMenu />
            )}

            {!loading && !user && (
              <motion.button
                whileHover={{ opacity: 0.7 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/auth")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2",
                  "border border-white/20 rounded-full",
                  "text-sm text-white",
                  "transition-all duration-300",
                  "hover:bg-white hover:text-black"
                )}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MinimalHeader;
