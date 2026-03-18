"use client";

/**
 * Debug tree view for the Lexical editor state (adapted from lexical-playground-nextjs).
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TreeView } from "@lexical/react/LexicalTreeView";

export default function TreeViewPlugin() {
  const [editor] = useLexicalComposerContext();

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs overflow-auto max-h-[280px]">
      <div className="mb-2 font-semibold text-foreground">Debug view</div>
      <TreeView
        viewClassName="tree-view-output"
        treeTypeButtonClassName="hidden"
        timeTravelButtonClassName="hidden"
        editor={editor}
      />
    </div>
  );
}
