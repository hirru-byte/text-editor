"use client";

/**
 * Lexical Playground app (adapted from lexical-playground-nextjs).
 * Composer + settings + editor. Supports tables, images, and full toolbar.
 */

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { SettingsContext, useSettings } from "./context/SettingsContext";
import { SharedHistoryContext } from "./context/SharedHistoryContext";
import { ToolbarContext } from "./context/ToolbarContext";
import { prepopulatedRichText } from "./initialContent";
import PlaygroundEditor from "./PlaygroundEditor";
import PlaygroundNodes from "./nodes/PlaygroundNodes";
import PlaygroundEditorTheme from "./theme/PlaygroundEditorTheme";
import Settings from "./Settings";

function PlaygroundRoot() {
  const { settings } = useSettings();

  const initialConfig = {
    namespace: "Playground",
    theme: PlaygroundEditorTheme,
    nodes: PlaygroundNodes,
    onError: (error: Error) => {
      console.error(error);
    },
    editorState: settings.emptyEditor ? undefined : prepopulatedRichText,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <ToolbarContext>
      <SharedHistoryContext>
        <div className="min-h-screen bg-background p-4 md:p-6">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              Lexical Playground
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Rich text with toolbar, links, lists, tables, images, and YouTube.
              Use the gear icon for debug view or empty editor.
            </p>
          </header>
          <main className="mx-auto max-w-4xl">
            <PlaygroundEditor />
          </main>
        </div>
        <Settings />
      </SharedHistoryContext>
      </ToolbarContext>
    </LexicalComposer>
  );
}

export default function PlaygroundApp() {
  return (
    <SettingsContext>
      <PlaygroundRoot />
    </SettingsContext>
  );
}
