"use client";

/**
 * Playground settings context (adapted from lexical-playground-nextjs).
 */

import type { SettingName, Settings } from "../appSettings";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DEFAULT_SETTINGS, getInitialSettings } from "../appSettings";

type SettingsContextShape = {
  setOption: (name: SettingName, value: boolean) => void;
  settings: Settings;
};

const defaultSettings = getInitialSettings();

const Context = createContext<SettingsContextShape>({
  setOption: () => {},
  settings: defaultSettings,
});

export function SettingsContext({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const setOption = useCallback((name: SettingName, value: boolean) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);
      if (value !== DEFAULT_SETTINGS[name]) {
        params.set(name, String(value));
      } else {
        params.delete(name);
      }
      url.search = params.toString();
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  const value = useMemo(() => ({ setOption, settings }), [setOption, settings]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSettings(): SettingsContextShape {
  return useContext(Context);
}
