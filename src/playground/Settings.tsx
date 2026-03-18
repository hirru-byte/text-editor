"use client";

/**
 * Playground settings panel (adapted from lexical-playground-nextjs).
 */

import { Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { useSettings } from "./context/SettingsContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PlaygroundSettings() {
  const { setOption, settings } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full shadow-md"
        aria-label="Open settings"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <SettingsIcon className="size-5" />
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute bottom-12 left-0 z-50 w-56 rounded-lg border border-border bg-card p-3 shadow-lg",
            )}
            role="dialog"
            aria-label="Playground settings"
          >
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-2 text-sm">
                <span className="font-medium">Empty editor</span>
                <input
                  type="checkbox"
                  checked={settings.emptyEditor}
                  onChange={(e) => {
                    setOption("emptyEditor", e.target.checked);
                    window.location.reload();
                  }}
                  className="h-4 w-4 rounded border-input"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-2 text-sm">
                <span className="font-medium">Debug view</span>
                <input
                  type="checkbox"
                  checked={settings.showTreeView}
                  onChange={(e) =>
                    setOption("showTreeView", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-input"
                />
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
