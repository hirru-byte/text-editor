"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, type ReactNode } from "react";
import { isDOMNode } from "lexical";
import { cn } from "@/lib/utils";

export default function Modal({
  onClose,
  children,
  title,
  closeOnClickOutside = false,
}: {
  children: ReactNode;
  closeOnClickOutside?: boolean;
  onClose: () => void;
  title: string;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const clickOutsideHandler = (event: MouseEvent) => {
      const target = event.target;
      if (
        modalRef.current &&
        isDOMNode(target) &&
        !modalRef.current.contains(target) &&
        closeOnClickOutside
      ) {
        onClose();
      }
    };
    const el = modalRef.current?.parentElement;
    if (el) el.addEventListener("click", clickOutsideHandler);
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (el) el.removeEventListener("click", clickOutsideHandler);
    };
  }, [closeOnClickOutside, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal
        aria-label={title}
        className={cn(
          "flex max-h-[90vh] w-full max-w-md flex-col rounded-lg border border-border bg-card shadow-xl",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="overflow-auto p-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
