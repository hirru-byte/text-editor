"use client";

import { isDOMNode } from "lexical";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type DropDownContextType = {
  registerItem: (ref: React.RefObject<HTMLButtonElement | null>) => void;
};

const DropDownContext = React.createContext<DropDownContextType | null>(null);

const padding = 4;

export function DropDownItem({
  children,
  className,
  onClick,
  title,
}: {
  children: ReactNode;
  className?: string;
  onClick: (event: React.MouseEvent) => void;
  title?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const ctx = useContext(DropDownContext);
  if (!ctx) throw new Error("DropDownItem must be used within DropDown");
  useEffect(() => {
    if (ref.current) ctx.registerItem(ref);
  }, [ctx]);

  return (
    <button
      ref={ref}
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}

export default function DropDown({
  disabled = false,
  buttonLabel,
  buttonAriaLabel,
  buttonClassName,
  buttonIconClassName,
  children,
  stopCloseOnClickSelf,
}: {
  disabled?: boolean;
  buttonAriaLabel?: string;
  buttonClassName: string;
  buttonIconClassName?: string;
  buttonLabel?: ReactNode;
  children: ReactNode;
  stopCloseOnClickSelf?: boolean;
}) {
  const dropDownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showDropDown, setShowDropDown] = useState(false);
  const [items, setItems] = useState<Array<React.RefObject<HTMLButtonElement | null>>>([]);

  const registerItem = useCallback(
    (ref: React.RefObject<HTMLButtonElement | null>) => {
      setItems((prev) => (prev.includes(ref) ? prev : [...prev, ref]));
    },
    [],
  );

  const handleClose = useCallback(() => {
    setShowDropDown(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    const button = buttonRef.current;
    const dropDown = dropDownRef.current;
    if (showDropDown && button && dropDown) {
      const { top, left } = button.getBoundingClientRect();
      dropDown.style.top = `${top + button.offsetHeight + padding}px`;
      dropDown.style.left = `${Math.min(
        left,
        window.innerWidth - dropDown.offsetWidth - 20,
      )}px`;
    }
  }, [showDropDown]);

  useEffect(() => {
    if (!showDropDown) return;
    const handle = (event: MouseEvent) => {
      const target = event.target;
      if (!isDOMNode(target)) return;
      if (stopCloseOnClickSelf && dropDownRef.current?.contains(target)) return;
      if (!buttonRef.current?.contains(target)) setShowDropDown(false);
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [showDropDown, stopCloseOnClickSelf]);

  const contextValue = useMemo(() => ({ registerItem }), [registerItem]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-label={buttonAriaLabel}
        aria-expanded={showDropDown}
        className={buttonClassName}
        onClick={() => setShowDropDown((v) => !v)}
      >
        {buttonIconClassName && <span className={buttonIconClassName} />}
        {buttonLabel != null && <span>{buttonLabel}</span>}
        <span className="ml-1">▼</span>
      </button>
      {showDropDown &&
        createPortal(
          <div
            ref={dropDownRef}
            className="fixed z-[100] min-w-[140px] rounded-md border border-border bg-card py-1 shadow-lg"
            role="listbox"
          >
            <DropDownContext.Provider value={contextValue}>
              {children}
            </DropDownContext.Provider>
          </div>,
          document.body,
        )}
    </>
  );
}
