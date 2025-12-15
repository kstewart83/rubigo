"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Person } from "@/types/personnel";

const STORAGE_KEY = "rubigo-persona";

interface PersonaContextType {
  currentPersona: Person | null;
  isLoading: boolean;
  setPersona: (person: Person) => void;
  signOut: () => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

interface PersonaProviderProps {
  children: ReactNode;
}

export function PersonaProvider({ children }: PersonaProviderProps) {
  const [currentPersona, setCurrentPersona] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted persona on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCurrentPersona(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load persona from storage:", e);
    }
    setIsLoading(false);
  }, []);

  const setPersona = (person: Person) => {
    setCurrentPersona(person);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(person));
  };

  const signOut = () => {
    setCurrentPersona(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <PersonaContext.Provider
      value={{
        currentPersona,
        isLoading,
        setPersona,
        signOut,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return context;
}
