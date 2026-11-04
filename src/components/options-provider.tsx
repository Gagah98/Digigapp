"use client";
// Fournit à tous les composants clients la liste des projets et aires (pour les sélecteurs).
import { createContext, useContext } from "react";
import type { Options } from "@/db/queries";

const OptionsContext = createContext<Options>({ projects: [], areas: [] });

export function OptionsProvider({ value, children }: { value: Options; children: React.ReactNode }) {
  return <OptionsContext.Provider value={value}>{children}</OptionsContext.Provider>;
}

export const useOptions = () => useContext(OptionsContext);
