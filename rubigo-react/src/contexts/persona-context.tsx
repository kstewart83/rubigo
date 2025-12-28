"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Person } from "@/types/personnel";

const STORAGE_KEY = "rubigo-persona";
const PERSONA_COOKIE_NAME = "rubigo_persona_id";

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
        const persona = JSON.parse(stored);
        setCurrentPersona(persona);
        // Ensure cookie is also set on reload
        setPersonaCookie(persona.id);
      }
    } catch (e) {
      console.error("Failed to load persona from storage:", e);
    }
    setIsLoading(false);
  }, []);

  const setPersona = (person: Person) => {
    setCurrentPersona(person);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(person));
    // Set cookie for server-side auth
    setPersonaCookie(person.id);
  };

  const signOut = () => {
    setCurrentPersona(null);
    localStorage.removeItem(STORAGE_KEY);
    // Clear cookie
    document.cookie = `${PERSONA_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
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

function setPersonaCookie(personnelId: string) {
  // Set cookie with 7-day expiry
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  document.cookie = `${PERSONA_COOKIE_NAME}=${encodeURIComponent(personnelId)}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return context;
}

