/**
 * Minimal Lexical theme for the playground (Tailwind-friendly class names).
 */

import type { EditorThemeClasses } from "lexical";

const theme: EditorThemeClasses = {
  paragraph: "mb-2",
  quote: "border-l-4 border-primary/50 pl-4 my-2 text-muted-foreground italic",
  heading: {
    h1: "text-2xl font-bold mb-2 mt-4",
    h2: "text-xl font-semibold mb-2 mt-3",
    h3: "text-lg font-medium mb-1 mt-2",
    h4: "text-base font-medium",
    h5: "text-sm font-medium",
    h6: "text-sm font-medium",
  },
  list: {
    listitem: "ml-4 my-0.5",
    listitemChecked: "line-through opacity-70",
    listitemUnchecked: "",
    nested: { listitem: "ml-4" },
    ol: "list-decimal list-inside",
    ul: "list-disc list-inside",
    checklist: "list-none ml-0",
  },
  link: "text-primary underline underline-offset-2 hover:opacity-80",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "bg-muted px-1 py-0.5 rounded text-sm font-mono",
  },
  code: "block bg-muted rounded-lg p-3 font-mono text-sm overflow-x-auto my-2",
  embedBlock: {
    base: "my-2",
    focus: "ring-2 ring-ring ring-offset-2 rounded",
  },
  image: "editor-image block max-w-full h-auto rounded-lg border border-border",
  table: "border-collapse border border-border my-2 w-full",
  tableCell: "border border-border p-2 align-top",
  tableCellHeader: "border border-border p-2 font-semibold bg-muted/50 text-left",
  tableRow: "border-b border-border",
};

export default theme;
