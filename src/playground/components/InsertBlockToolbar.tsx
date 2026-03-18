"use client";

/**
 * Toolbar buttons for inserting table and image.
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { ImagePlus, Table } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { INSERT_IMAGE_COMMAND } from "../plugins/ImagesPlugin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const toolbarButtonClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function InsertBlockToolbar() {
  const [editor] = useLexicalComposerContext();
  const [imageOpen, setImageOpen] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const insertTable = useCallback(() => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: 3, columns: 3 });
  }, [editor]);

  const insertImageByUrl = useCallback(() => {
    const url = urlRef.current?.value?.trim();
    if (!url) return;
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: url, altText: "" });
    urlRef.current!.value = "";
    setImageOpen(false);
  }, [editor]);

  const insertImageByFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
          src,
          altText: file.name,
        });
        setImageOpen(false);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [editor],
  );

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={insertTable}
        className={toolbarButtonClass}
        aria-label="Insert table"
      >
        <Table className="size-4" />
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setImageOpen((v) => !v)}
          className={cn(toolbarButtonClass, imageOpen && "bg-muted")}
          aria-label="Insert image"
          aria-expanded={imageOpen}
        >
          <ImagePlus className="size-4" />
        </button>
        {imageOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              aria-hidden
              onClick={() => setImageOpen(false)}
            />
            <div
              className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-border bg-card p-3 shadow-lg"
              role="dialog"
              aria-label="Insert image"
            >
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    ref={urlRef}
                    type="url"
                    placeholder="Image URL"
                    className="flex-1 rounded border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") insertImageByUrl();
                    }}
                  />
                  <Button size="sm" onClick={insertImageByUrl}>
                    Add
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  or upload:
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm"
                  onChange={insertImageByFile}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
