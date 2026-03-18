"use client";

/**
 * Toolbar state context (from lexical-playground-nextjs).
 */

import type { ElementFormatType } from "lexical";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const MIN_ALLOWED_FONT_SIZE = 8;
export const MAX_ALLOWED_FONT_SIZE = 72;
export const DEFAULT_FONT_SIZE = 15;

const rootTypeToRootName = {
  root: "Root",
  table: "Table",
} as const;

export const blockTypeToBlockName = {
  bullet: "Bulleted List",
  check: "Check List",
  code: "Code Block",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  number: "Numbered List",
  paragraph: "Normal",
  quote: "Quote",
} as const;

type ToolbarState = {
  bgColor: string;
  blockType: keyof typeof blockTypeToBlockName;
  canRedo: boolean;
  canUndo: boolean;
  codeLanguage: string;
  elementFormat: ElementFormatType;
  fontColor: string;
  fontFamily: string;
  fontSize: string;
  fontSizeInputValue: string;
  isBold: boolean;
  isCode: boolean;
  isHighlight: boolean;
  isImageCaption: boolean;
  isItalic: boolean;
  isLink: boolean;
  isRTL: boolean;
  isStrikethrough: boolean;
  isSubscript: boolean;
  isSuperscript: boolean;
  isUnderline: boolean;
  isLowercase: boolean;
  isUppercase: boolean;
  isCapitalize: boolean;
  rootType: keyof typeof rootTypeToRootName;
};

const INITIAL_TOOLBAR_STATE: ToolbarState = {
  bgColor: "#fff",
  blockType: "paragraph",
  canRedo: false,
  canUndo: false,
  codeLanguage: "",
  elementFormat: "left",
  fontColor: "#000",
  fontFamily: "Arial",
  fontSize: `${DEFAULT_FONT_SIZE}px`,
  fontSizeInputValue: `${DEFAULT_FONT_SIZE}`,
  isBold: false,
  isCode: false,
  isHighlight: false,
  isImageCaption: false,
  isItalic: false,
  isLink: false,
  isRTL: false,
  isStrikethrough: false,
  isSubscript: false,
  isSuperscript: false,
  isUnderline: false,
  isLowercase: false,
  isUppercase: false,
  isCapitalize: false,
  rootType: "root",
};

type ToolbarStateKey = keyof ToolbarState;
type ToolbarStateValue = ToolbarState[ToolbarStateKey];

type ContextShape = {
  toolbarState: ToolbarState;
  updateToolbarState: (key: ToolbarStateKey, value: ToolbarStateValue) => void;
};

const Context = createContext<ContextShape | undefined>(undefined);

export function ToolbarContext({ children }: { children: ReactNode }) {
  const [toolbarState, setToolbarState] =
    useState<ToolbarState>(INITIAL_TOOLBAR_STATE);
  const selectionFontSize = toolbarState.fontSize;

  const updateToolbarState = useCallback(
    (key: ToolbarStateKey, value: ToolbarStateValue) => {
      setToolbarState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  useEffect(() => {
    updateToolbarState("fontSizeInputValue", selectionFontSize.slice(0, -2));
  }, [selectionFontSize, updateToolbarState]);

  const value = useMemo(
    () => ({ toolbarState, updateToolbarState }),
    [toolbarState, updateToolbarState],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useToolbarState(): ContextShape {
  const ctx = useContext(Context);
  if (ctx === undefined) {
    throw new Error("useToolbarState must be used within ToolbarContext");
  }
  return ctx;
}
