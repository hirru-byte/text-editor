/**
 * Playground app settings (adapted from lexical-playground-nextjs).
 */

export const isDevPlayground: boolean = false;

export const DEFAULT_SETTINGS = {
  disableBeforeInput: false,
  emptyEditor: isDevPlayground,
  hasLinkAttributes: false,
  isAutocomplete: false,
  isCharLimit: false,
  isCharLimitUtf8: false,
  isCollab: false,
  isMaxLength: false,
  isRichText: true,
  measureTypingPerf: false,
  selectionAlwaysOnDisplay: false,
  shouldAllowHighlightingWithBrackets: false,
  shouldPreserveNewLinesInMarkdown: false,
  shouldUseLexicalContextMenu: false,
  showNestedEditorTreeView: false,
  showTableOfContents: false,
  showTreeView: true,
  tableCellBackgroundColor: true,
  tableCellMerge: true,
  tableHorizontalScroll: true,
} as const;

export function getInitialSettings(): Record<
  keyof typeof DEFAULT_SETTINGS,
  boolean
> {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  const settings = { ...DEFAULT_SETTINGS };
  const params = new URLSearchParams(window.location.search);
  (Object.keys(DEFAULT_SETTINGS) as Array<keyof typeof DEFAULT_SETTINGS>).forEach(
    (key) => {
      const value = params.get(key);
      if (value === "true" || value === "false") {
        (settings as Record<string, boolean>)[key] = value === "true";
      }
    },
  );
  return settings;
}

export const INITIAL_SETTINGS: Record<keyof typeof DEFAULT_SETTINGS, boolean> =
  { ...DEFAULT_SETTINGS };

export type SettingName = keyof typeof DEFAULT_SETTINGS;
export type Settings = typeof INITIAL_SETTINGS;
