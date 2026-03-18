"use client";

/**
 * Shared history state for the playground (adapted from lexical-playground-nextjs).
 */

import {
  createEmptyHistoryState,
  type HistoryState,
} from "@lexical/react/LexicalHistoryPlugin";
import { createContext, useContext, useMemo, type ReactNode } from "react";

type ContextShape = {
  historyState: HistoryState;
};

const Context = createContext<ContextShape | null>(null);

export function SharedHistoryContext({ children }: { children: ReactNode }) {
  const historyState = useMemo(
    () => ({ historyState: createEmptyHistoryState() }),
    [],
  );
  return (
    <Context.Provider value={historyState}>{children}</Context.Provider>
  );
}

export function useSharedHistoryContext(): ContextShape {
  const ctx = useContext(Context);
  if (!ctx) {
    return { historyState: createEmptyHistoryState() };
  }
  return ctx;
}
