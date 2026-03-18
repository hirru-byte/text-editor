"use client";

/**
 * Font size control for toolbar (from lexical-playground-nextjs).
 */

import type { LexicalEditor } from "lexical";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  MAX_ALLOWED_FONT_SIZE,
  MIN_ALLOWED_FONT_SIZE,
} from "../../context/ToolbarContext";
import { SHORTCUTS } from "../ShortcutsPlugin/shortcuts";
import {
  updateFontSize,
  updateFontSizeInSelection,
  UpdateFontSizeType,
} from "./utils";
import { cn } from "@/lib/utils";

export function parseAllowedFontSize(input: string): string {
  const match = input.match(/^(\d+(?:\.\d+)?)px$/);
  if (match) {
    const n = Number(match[1]);
    if (n >= MIN_ALLOWED_FONT_SIZE && n <= MAX_ALLOWED_FONT_SIZE) return input;
  }
  return "";
}

export default function FontSize({
  selectionFontSize,
  disabled,
  editor,
}: {
  selectionFontSize: string;
  disabled: boolean;
  editor: LexicalEditor;
}) {
  const [inputValue, setInputValue] = useState(selectionFontSize);
  const [inputChangeFlag, setInputChangeFlag] = useState(false);

  useEffect(() => {
    setInputValue(selectionFontSize);
  }, [selectionFontSize]);

  const updateByInput = (inputValueNumber: number) => {
    let size = inputValueNumber;
    if (size > MAX_ALLOWED_FONT_SIZE) size = MAX_ALLOWED_FONT_SIZE;
    else if (size < MIN_ALLOWED_FONT_SIZE) size = MIN_ALLOWED_FONT_SIZE;
    setInputValue(String(size));
    updateFontSizeInSelection(editor, `${size}px`, null);
    setInputChangeFlag(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const num = Number(inputValue);
    if (e.key === "Tab") return;
    if (["e", "E", "+", "-"].includes(e.key) || isNaN(num)) {
      e.preventDefault();
      setInputValue("");
      return;
    }
    setInputChangeFlag(true);
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      updateByInput(num);
    }
  };

  const handleBlur = () => {
    if (inputValue !== "" && inputChangeFlag) {
      updateByInput(Number(inputValue));
    }
  };

  const btnClass =
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50";

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          updateFontSize(editor, UpdateFontSizeType.decrement, inputValue)
        }
        className={btnClass}
        aria-label="Decrease font size"
        title={`Decrease font size (${SHORTCUTS.DECREASE_FONT_SIZE})`}
      >
        <Minus className="size-4" />
      </button>
      <input
        type="number"
        value={inputValue.replace("px", "")}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled}
        className={cn(
          "h-8 w-10 rounded border border-input bg-background text-center text-sm",
          "focus:outline-none focus:ring-2 focus:ring-ring",
        )}
        min={MIN_ALLOWED_FONT_SIZE}
        max={MAX_ALLOWED_FONT_SIZE}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          updateFontSize(editor, UpdateFontSizeType.increment, inputValue)
        }
        className={btnClass}
        aria-label="Increase font size"
        title={`Increase font size (${SHORTCUTS.INCREASE_FONT_SIZE})`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
