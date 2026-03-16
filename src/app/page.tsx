"use client";

import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $getRoot, $getSelection, EditorState } from "lexical";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";

import { Button } from "@/components/ui/button";
import { useState } from "react";

type Item = {
  id: string;
  label: string;
};

function SortableItem({ id, label }: Item) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.li
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`flex items-center justify-between rounded-md border bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900 ${isDragging ? "ring-2 ring-primary" : ""
        }`}
      {...attributes}
      {...listeners}
    >
      <span className="text-zinc-800 dark:text-zinc-100">{label}</span>
      <span className="text-xs text-zinc-400">drag</span>
    </motion.li>
  );
}

function ExampleEditor() {
  const initialConfig = {
    namespace: "ExampleEditor",
    onError(error: unknown) {
      console.error(error);
    },
    theme: {
      paragraph: "mb-1",
    },
    nodes: [],
  };

  function onChange(editorState: EditorState) {
    editorState.read(() => {
      const root = $getRoot();
      const selection = $getSelection();
      console.log("EditorState:", root.__cachedText, selection);
    });
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="rounded-lg border bg-background p-3 text-sm">

        <RichTextPlugin
          ErrorBoundary={LexicalErrorBoundary}
          contentEditable={
            <ContentEditable className="min-h-[80px] resize-none bg-transparent outline-none text-black" />
          }
          placeholder={
            <div className="pointer-events-none select-none text-sm text-muted-foreground">
              Start typing your notes here…
            </div>
          }
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={onChange} />
      </div>
    </LexicalComposer>
  );
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([
    { id: "1", label: "First task" },
    { id: "2", label: "Second task" },
    { id: "3", label: "Third task" },
  ]);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function shuffle() {
    setItems((prev) => [...prev].sort(() => Math.random() - 0.5));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black px-4 py-10 text-slate-100">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-xl shadow-slate-950/60 backdrop-blur">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Text editor playground
            </h1>
            <p className="text-sm text-slate-400">
              Lexical editor, dnd-kit list, and Framer Motion animations.
            </p>
          </div>
          <motion.div
            className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-500 to-violet-500"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </header>

        <section className="grid gap-6 md:grid-cols-[minmax(0,3fr),minmax(0,2fr)]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-200">
                Lexical editor
              </h2>
            </div>
            <ExampleEditor />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-slate-200">
                Draggable list
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={shuffle}
              >
                Shuffle
              </Button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <motion.ul
                  layout
                  className="space-y-2 rounded-lg border border-white/10 bg-slate-950/60 p-3"
                >
                  {items.map((item) => (
                    <SortableItem key={item.id} {...item} />
                  ))}
                </motion.ul>
              </SortableContext>
            </DndContext>
          </div>
        </section>
      </main>
    </div>
  );
}
