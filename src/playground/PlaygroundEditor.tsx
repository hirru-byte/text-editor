"use client";

/**
 * Playground editor with full toolbar, history, list, links, table, image, YouTube, and optional tree view.
 */

import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useSettings } from "./context/SettingsContext";
import { useSharedHistoryContext } from "./context/SharedHistoryContext";
import YouTubePlugin from "@/components/plugin/YoutubePlugin";
import { useState } from "react";

import ImagesPlugin from "./plugins/ImagesPlugin";
import PlaygroundToolbarPlugin from "./plugins/ToolbarPlugin";
import TreeViewPlugin from "./plugins/TreeViewPlugin";

export default function PlaygroundEditor() {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState(false);
  const { historyState } = useSharedHistoryContext();
  const { settings } = useSettings();
  const { showTreeView } = settings;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-border bg-muted/50 px-1 py-1">
        <PlaygroundToolbarPlugin
          editor={editor}
          activeEditor={activeEditor}
          setActiveEditor={setActiveEditor}
          setIsLinkEditMode={setIsLinkEditMode}
        />
      </div>
      <div className="relative p-3">
        <RichTextPlugin
          ErrorBoundary={LexicalErrorBoundary}
          contentEditable={
            <ContentEditable className="min-h-[200px] resize-none bg-transparent outline-none text-foreground" />
          }
          placeholder={
            <div className="pointer-events-none absolute left-3 top-3 select-none text-muted-foreground">
              Enter some rich text…
            </div>
          }
        />
        <HistoryPlugin externalHistoryState={historyState} />
        <ListPlugin />
        <TablePlugin />
        <ClickableLinkPlugin />
        <ImagesPlugin />
        <YouTubePlugin />
      </div>
      {showTreeView && <TreeViewPlugin />}
    </div>
  );
}
