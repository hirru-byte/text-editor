"use client";

/**
 * Full-featured ToolbarPlugin (from lexical-playground-nextjs), adapted for this project.
 * Block format, font size, text format, alignment, link, and insert (Table, Image).
 */

import {
  $isCodeNode,
  CODE_LANGUAGE_FRIENDLY_NAME_MAP,
  CODE_LANGUAGE_MAP,
} from "@lexical/code";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $isListNode, ListNode } from "@lexical/list";
import {
  $getSelectionStyleValueForProperty,
  $isParentElementRTL,
  $patchStyleText,
} from "@lexical/selection";
import { $isHeadingNode } from "@lexical/rich-text";
import { $isTableNode } from "@lexical/table";
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  $isEditorIsNestedEditor,
  mergeRegister,
} from "@lexical/utils";
import {
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  type ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  type LexicalEditor,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Code,
  Link,
  Table,
  Image,
} from "lucide-react";
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { INSERT_TABLE_COMMAND } from "@lexical/table";

import { blockTypeToBlockName, useToolbarState } from "../../context/ToolbarContext";
import { IS_APPLE } from "../../shared/environment";
import useModal from "../../hooks/useModal";
import { getSelectedNode } from "../../utils/getSelectedNode";
import { sanitizeUrl } from "../../utils/url";
import { INSERT_IMAGE_COMMAND } from "../ImagesPlugin";
import { SHORTCUTS } from "../ShortcutsPlugin/shortcuts";
import FontSize from "./fontSize";
import {
  clearFormatting,
  formatBulletList,
  formatCheckList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
} from "./utils";
import DropDown, { DropDownItem } from "../../ui/DropDown";
import { cn } from "@/lib/utils";

const rootTypeToRootName = { root: "Root", table: "Table" } as const;

const FONT_FAMILY_OPTIONS: [string, string][] = [
  ["Arial", "Arial"],
  ["Courier New", "Courier New"],
  ["Georgia", "Georgia"],
  ["Times New Roman", "Times New Roman"],
  ["Verdana", "Verdana"],
];

const FONT_SIZE_OPTIONS: [string, string][] = [
  "10px", "11px", "12px", "13px", "14px", "15px", "16px", "17px", "18px", "19px", "20px",
].map((s) => [s, s]);

const CODE_LANGUAGE_OPTIONS = Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP).map(
  ([value, name]) => [value, name] as [string, string],
);

const ELEMENT_FORMAT_OPTIONS: Record<
  string,
  { icon: React.ReactNode; name: string }
> = {
  left: { icon: <AlignLeft className="size-4" />, name: "Left Align" },
  center: { icon: <AlignCenter className="size-4" />, name: "Center Align" },
  right: { icon: <AlignRight className="size-4" />, name: "Right Align" },
  justify: { icon: <AlignJustify className="size-4" />, name: "Justify" },
  start: { icon: <AlignLeft className="size-4" />, name: "Start" },
  end: { icon: <AlignRight className="size-4" />, name: "End" },
};

/** Icon-only toolbar button (fixed square, e.g. Undo, Bold, Link) */
const toolbarIconBtn =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

/** Dropdown trigger with label (variable width: Block format, Alignment, Insert) */
const toolbarDropdownBtn =
  "inline-flex h-8 min-w-0 max-w-[200px] shrink items-center gap-1.5 rounded-md px-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&>span:first-child]:min-w-0 [&>span:first-child]:truncate";

/** Text-only toolbar button (e.g. Clear) */
const toolbarTextBtn =
  "inline-flex h-8 min-w-0 shrink-0 items-center justify-center rounded-md px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

function Divider() {
  return <div className="h-6 w-px shrink-0 bg-border" role="separator" aria-hidden />;
}

function BlockFormatDropDown({
  editor,
  blockType,
  disabled,
}: {
  editor: LexicalEditor;
  blockType: keyof typeof blockTypeToBlockName;
  disabled?: boolean;
}) {
  return (
    <DropDown
      buttonClassName={toolbarDropdownBtn}
      buttonLabel={blockTypeToBlockName[blockType]}
      buttonAriaLabel="Block format"
      disabled={disabled}
    >
      <DropDownItem
        onClick={() => formatParagraph(editor)}
        className={blockType === "paragraph" ? "bg-muted" : ""}
        title={SHORTCUTS.NORMAL}
      >
        Normal
      </DropDownItem>
      {(["h1", "h2", "h3"] as const).map((h) => (
        <DropDownItem
          key={h}
          onClick={() => formatHeading(editor, blockType, h)}
          className={blockType === h ? "bg-muted" : ""}
          title={SHORTCUTS[`HEADING${h[1]}` as keyof typeof SHORTCUTS]}
        >
          Heading {h[1]}
        </DropDownItem>
      ))}
      <DropDownItem
        onClick={() => formatBulletList(editor, blockType)}
        className={blockType === "bullet" ? "bg-muted" : ""}
        title={SHORTCUTS.BULLET_LIST}
      >
        Bullet List
      </DropDownItem>
      <DropDownItem
        onClick={() => formatNumberedList(editor, blockType)}
        className={blockType === "number" ? "bg-muted" : ""}
        title={SHORTCUTS.NUMBERED_LIST}
      >
        Numbered List
      </DropDownItem>
      <DropDownItem
        onClick={() => formatCheckList(editor, blockType)}
        className={blockType === "check" ? "bg-muted" : ""}
        title={SHORTCUTS.CHECK_LIST}
      >
        Check List
      </DropDownItem>
      <DropDownItem
        onClick={() => formatQuote(editor, blockType)}
        className={blockType === "quote" ? "bg-muted" : ""}
        title={SHORTCUTS.QUOTE}
      >
        Quote
      </DropDownItem>
      <DropDownItem
        onClick={() => formatCode(editor, blockType)}
        className={blockType === "code" ? "bg-muted" : ""}
        title={SHORTCUTS.CODE_BLOCK}
      >
        Code Block
      </DropDownItem>
    </DropDown>
  );
}

export default function PlaygroundToolbarPlugin({
  editor,
  activeEditor,
  setActiveEditor,
  setIsLinkEditMode,
}: {
  editor: LexicalEditor;
  activeEditor: LexicalEditor;
  setActiveEditor: Dispatch<SetStateAction<LexicalEditor>>;
  setIsLinkEditMode?: Dispatch<SetStateAction<boolean>>;
}) {
  const [selectedElementKey, setSelectedElementKey] = useState<string | null>(null);
  const [modal, showModal] = useModal();
  const { toolbarState, updateToolbarState } = useToolbarState();

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      updateToolbarState("isImageCaption", false);
      const anchorNode = selection.anchor.getNode();
      let element: ReturnType<typeof $findMatchingParent> =
        anchorNode.getKey() === "root"
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
            const p = e.getParent();
            return p !== null && $isRootOrShadowRoot(p);
          });
      if (element === null) element = anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);
      updateToolbarState("isRTL", $isParentElementRTL(selection));
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      const isLink = $isLinkNode(parent) || $isLinkNode(node);
      updateToolbarState("isLink", isLink);
      const tableNode = $findMatchingParent(node, $isTableNode);
      updateToolbarState("rootType", $isTableNode(tableNode) ? "table" : "root");
      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();
          updateToolbarState("blockType", type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          if (type in blockTypeToBlockName) {
            updateToolbarState("blockType", type as keyof typeof blockTypeToBlockName);
          }
          if ($isCodeNode(element)) {
            const lang = element.getLanguage();
            updateToolbarState(
              "codeLanguage",
              CODE_LANGUAGE_MAP[lang as keyof typeof CODE_LANGUAGE_MAP] ?? lang,
            );
          }
        }
      }
      updateToolbarState("fontColor", $getSelectionStyleValueForProperty(selection, "color", "#000"));
      updateToolbarState("bgColor", $getSelectionStyleValueForProperty(selection, "background-color", "#fff"));
      updateToolbarState("fontFamily", $getSelectionStyleValueForProperty(selection, "font-family", "Arial"));
      let matchingParent = $findMatchingParent(
        node,
        (n) => $isElementNode(n) && !n.isInline(),
      );
      if ($isLinkNode(parent)) matchingParent = parent.getParent();
      updateToolbarState(
        "elementFormat",
        ($isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
            ? node.getFormatType()
            : parent?.getFormatType()) ?? "left",
      );
    }
    if ($isRangeSelection(selection)) {
      updateToolbarState("isBold", selection.hasFormat("bold"));
      updateToolbarState("isItalic", selection.hasFormat("italic"));
      updateToolbarState("isUnderline", selection.hasFormat("underline"));
      updateToolbarState("isStrikethrough", selection.hasFormat("strikethrough"));
      updateToolbarState("isSubscript", selection.hasFormat("subscript"));
      updateToolbarState("isSuperscript", selection.hasFormat("superscript"));
      updateToolbarState("isHighlight", selection.hasFormat("highlight"));
      updateToolbarState("isCode", selection.hasFormat("code"));
      updateToolbarState("fontSize", $getSelectionStyleValueForProperty(selection, "font-size", "15px"));
      updateToolbarState("isLowercase", selection.hasFormat("lowercase"));
      updateToolbarState("isUppercase", selection.hasFormat("uppercase"));
      updateToolbarState("isCapitalize", selection.hasFormat("capitalize"));
    }
  }, [activeEditor, updateToolbarState]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        $updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, $updateToolbar, setActiveEditor]);

  useEffect(() => {
    activeEditor.getEditorState().read(() => $updateToolbar());
  }, [activeEditor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => $updateToolbar());
      }),
      activeEditor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          updateToolbarState("canUndo", payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          updateToolbarState("canRedo", payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [$updateToolbar, activeEditor, updateToolbarState]);

  const applyStyleText = useCallback(
    (styles: Record<string, string>, skipHistory?: boolean) => {
      activeEditor.update(
        () => {
          const sel = $getSelection();
          if (sel) $patchStyleText(sel, styles);
        },
        skipHistory ? { tag: "historic" } : {},
      );
    },
    [activeEditor],
  );

  const insertLink = useCallback(() => {
    if (!toolbarState.isLink) {
      setIsLinkEditMode?.(true);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl("https://"));
    } else {
      setIsLinkEditMode?.(false);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [activeEditor, toolbarState.isLink, setIsLinkEditMode]);

  const onCodeLanguageSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        if (selectedElementKey) {
          const node = $getNodeByKey(selectedElementKey);
          if (node && $isCodeNode(node)) (node as { setLanguage: (l: string) => void }).setLanguage(value);
        }
      });
    },
    [activeEditor, selectedElementKey],
  );

  const canShowBlockDropdown = toolbarState.blockType in blockTypeToBlockName && activeEditor === editor;
  const formatOption = ELEMENT_FORMAT_OPTIONS[toolbarState.elementFormat ?? "left"] ?? ELEMENT_FORMAT_OPTIONS.left;

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5">
        <button
          type="button"
          disabled={!toolbarState.canUndo}
          onClick={() => activeEditor.dispatchCommand(UNDO_COMMAND, undefined)}
          className={toolbarIconBtn}
          title={IS_APPLE ? "Undo (⌘Z)" : "Undo (Ctrl+Z)"}
          aria-label="Undo"
        >
          <Undo2 className="size-4" />
        </button>
        <button
          type="button"
          disabled={!toolbarState.canRedo}
          onClick={() => activeEditor.dispatchCommand(REDO_COMMAND, undefined)}
          className={toolbarIconBtn}
          title={IS_APPLE ? "Redo (⇧⌘Z)" : "Redo (Ctrl+Y)"}
          aria-label="Redo"
        >
          <Redo2 className="size-4" />
        </button>
        <Divider />

        {canShowBlockDropdown && (
          <>
            <BlockFormatDropDown
              editor={activeEditor}
              blockType={toolbarState.blockType}
              disabled={false}
            />
            <Divider />
          </>
        )}

        {toolbarState.blockType === "code" ? (
          <DropDown
            buttonClassName={toolbarDropdownBtn}
            buttonLabel={toolbarState.codeLanguage || "Code"}
            buttonAriaLabel="Code language"
            disabled={false}
          >
            {CODE_LANGUAGE_OPTIONS.map(([value, name]) => (
              <DropDownItem
                key={value}
                onClick={() => onCodeLanguageSelect(value)}
                className={toolbarState.codeLanguage === value ? "bg-muted" : ""}
              >
                {name}
              </DropDownItem>
            ))}
          </DropDown>
        ) : (
          <>
            <FontSize
              editor={activeEditor}
              selectionFontSize={toolbarState.fontSize}
              disabled={false}
            />
            <Divider />
            <button
              type="button"
              onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
              className={cn(toolbarIconBtn, toolbarState.isBold && "bg-primary/20 text-primary")}
              title={`Bold (${SHORTCUTS.BOLD})`}
              aria-label="Bold"
            >
              <Bold className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
              className={cn(toolbarIconBtn, toolbarState.isItalic && "bg-primary/20 text-primary")}
              title={`Italic (${SHORTCUTS.ITALIC})`}
              aria-label="Italic"
            >
              <Italic className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
              className={cn(toolbarIconBtn, toolbarState.isUnderline && "bg-primary/20 text-primary")}
              title={`Underline (${SHORTCUTS.UNDERLINE})`}
              aria-label="Underline"
            >
              <Underline className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
              className={cn(toolbarIconBtn, toolbarState.isCode && "bg-primary/20 text-primary")}
              title={`Code (${SHORTCUTS.INSERT_CODE_BLOCK})`}
              aria-label="Code"
            >
              <Code className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
              className={cn(toolbarIconBtn, toolbarState.isStrikethrough && "bg-primary/20 text-primary")}
              title={`Strikethrough (${SHORTCUTS.STRIKETHROUGH})`}
              aria-label="Strikethrough"
            >
              <Strikethrough className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => clearFormatting(activeEditor)}
              className={toolbarTextBtn}
              title={`Clear formatting (${SHORTCUTS.CLEAR_FORMATTING})`}
              aria-label="Clear formatting"
            >
              Clear
            </button>
            <Divider />

            <DropDown
              buttonClassName={toolbarDropdownBtn}
              buttonLabel={formatOption.name}
              buttonAriaLabel="Alignment"
              disabled={false}
            >
              {(["left", "center", "right", "justify"] as const).map((fmt) => {
                const opt = ELEMENT_FORMAT_OPTIONS[fmt];
                return (
                  <DropDownItem
                    key={fmt}
                    onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, fmt)}
                    className={toolbarState.elementFormat === fmt ? "bg-muted" : ""}
                    title={opt?.name}
                  >
                    {opt?.icon}
                    {opt?.name}
                  </DropDownItem>
                );
              })}
              <DropDownItem
                onClick={() => activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}
                title={SHORTCUTS.OUTDENT}
              >
                Outdent
              </DropDownItem>
              <DropDownItem
                onClick={() => activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)}
                title={SHORTCUTS.INDENT}
              >
                Indent
              </DropDownItem>
            </DropDown>
            <Divider />

            <button
              type="button"
              onClick={insertLink}
              className={cn(toolbarIconBtn, toolbarState.isLink && "bg-primary/20 text-primary")}
              title={`Link (${SHORTCUTS.INSERT_LINK})`}
              aria-label="Link"
            >
              <Link className="size-4" />
            </button>
            <Divider />

            <DropDown
              buttonClassName={toolbarDropdownBtn}
              buttonLabel="Insert"
              buttonAriaLabel="Insert"
              disabled={false}
            >
              <DropDownItem
                onClick={() => activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: "3", columns: "3" })}
                title="Table"
              >
                <Table className="size-4" />
                Table
              </DropDownItem>
              <DropDownItem
                onClick={() =>
                  showModal("Insert Image", (onClose) => (
                    <InsertImageModalContent
                      editor={activeEditor}
                      onClose={onClose}
                    />
                  ))
                }
                title="Image"
              >
                <Image className="size-4" />
                Image
              </DropDownItem>
            </DropDown>
          </>
        )}
      </div>
      {modal}
    </>
  );
}

function InsertImageModalContent({
  editor,
  onClose,
}: {
  editor: LexicalEditor;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");

  const insertByUrl = () => {
    const src = url.trim();
    if (!src) return;
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src, altText: alt || "" });
    onClose();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src: reader.result as string,
        altText: file.name,
      });
      onClose();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-foreground">Image URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground">Alt text</label>
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Description"
          className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={insertByUrl}
        className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
      >
        Insert from URL
      </button>
      <div className="text-sm text-muted-foreground">or upload:</div>
      <input type="file" accept="image/*" onChange={onFileChange} className="text-sm" />
    </div>
  );
}
