/**
 * CineVault - AddMovieContext
 * 
 * Context global pour ouvrir le sheet d'ajout de film depuis n'importe où
 */

import React, { createContext, useContext, useState, useCallback } from "react";

interface AddMovieContextType {
  isOpen: boolean;
  openAddMovie: () => void;
  closeAddMovie: () => void;
}

const AddMovieContext = createContext<AddMovieContextType | undefined>(undefined);

export const AddMovieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openAddMovie = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeAddMovie = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AddMovieContext.Provider value={{ isOpen, openAddMovie, closeAddMovie }}>
      {children}
    </AddMovieContext.Provider>
  );
};

export const useAddMovie = () => {
  const context = useContext(AddMovieContext);
  if (!context) {
    throw new Error("useAddMovie must be used within an AddMovieProvider");
  }
  return context;
};
