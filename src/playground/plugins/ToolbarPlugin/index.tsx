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
import {
  getCodeLanguageOptions as getCodeLanguageOptionsPrism,
  normalizeCodeLanguage as normalizeCodeLanguagePrism,
} from '@lexical/code';
import {
  getCodeLanguageOptions as getCodeLanguageOptionsShiki,
  getCodeThemeOptions as getCodeThemeOptionsShiki,
  normalizeCodeLanguage as normalizeCodeLanguageShiki,
} from '@lexical/code';
import { $isHeadingNode } from "@lexical/rich-text";
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  $isEditorIsNestedEditor,
  mergeRegister,
} from "@lexical/utils";
import {
  $addUpdateTag,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  CommandPayloadType,
  type ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  HISTORIC_TAG,
  INDENT_CONTENT_COMMAND,
  LexicalCommand,
  type LexicalEditor,
  LexicalNode,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  SKIP_DOM_SELECTION_TAG,
  SKIP_SELECTION_FOCUS_TAG,
  TextFormatType,
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
import { INSERT_TABLE_COMMAND, $isTableNode, $isTableSelection } from "@lexical/table";

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
import { useSettings } from "@/playground/context/SettingsContext";
import { isKeyboardInput } from "@/playground/utils/focusUtils";

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
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

/** Dropdown trigger with label (variable width: Block format, Alignment, Insert) */
const toolbarDropdownBtn =
  "inline-flex h-8 min-w-0 max-w-[200px] shrink items-center gap-1.5 rounded-md px-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&>span:first-child]:min-w-0 [&>span:first-child]:truncate cursor-pointer";

/** Text-only toolbar button (e.g. Clear) */
const toolbarTextBtn =
  "inline-flex h-8 min-w-0 shrink-0 items-center justify-center rounded-md px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

function Divider() {
  return <div className="h-6 w-px shrink-0 bg-border" role="separator" aria-hidden />;
}

function BlockFormatDropDown({
  editor,
  blockType,
  rootType,
  disabled,
}: {
  editor: LexicalEditor;
  blockType: keyof typeof blockTypeToBlockName;
  rootType: keyof typeof rootTypeToRootName;
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

function $findTopLevelElement(node: LexicalNode) {
  let topLevelElement =
    node.getKey() === 'root'
      ? node
      : $findMatchingParent(node, (e) => {
        const parent = e.getParent();
        return parent !== null && $isRootOrShadowRoot(parent);
      });

  if (topLevelElement === null) {
    topLevelElement = node.getTopLevelElementOrThrow();
  }
  return topLevelElement;
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
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const { toolbarState, updateToolbarState } = useToolbarState();

  const dispatchToolbarCommand = <T extends LexicalCommand<unknown>>(
    command: T,
    payload: CommandPayloadType<T> | undefined = undefined,
    skipRefocus: boolean = false,
  ) => {
    activeEditor.update(() => {
      if (skipRefocus) {
        $addUpdateTag(SKIP_DOM_SELECTION_TAG);
      }

      // Re-assert on Type so that payload can have a default param
      activeEditor.dispatchCommand(command, payload as CommandPayloadType<T>);
    });
  };

  const dispatchFormatTextCommand = (
    payload: TextFormatType,
    skipRefocus: boolean = false,
  ) => dispatchToolbarCommand(FORMAT_TEXT_COMMAND, payload, skipRefocus);

  const $handleHeadingNode = useCallback(
    (selectedElement: LexicalNode) => {
      const type = $isHeadingNode(selectedElement)
        ? selectedElement.getTag()
        : selectedElement.getType();

      if (type in blockTypeToBlockName) {
        updateToolbarState(
          'blockType',
          type as keyof typeof blockTypeToBlockName,
        );
      }
    },
    [updateToolbarState],
  );

  const {
    settings: { isCodeHighlighted, isCodeShiki },
  } = useSettings();

  const $handleCodeNode = useCallback(
    (element: LexicalNode) => {
      if ($isCodeNode(element)) {
        const language = element.getLanguage();
        updateToolbarState(
          'codeLanguage',
          language
            ? (isCodeHighlighted &&
              (isCodeShiki
                ? normalizeCodeLanguageShiki(language)
                : normalizeCodeLanguagePrism(language))) ||
            language
            : '',
        );
        const theme = element.getTheme();
        updateToolbarState('codeTheme', theme || '');
        return;
      }
    },
    [updateToolbarState, isCodeHighlighted, isCodeShiki],
  );


  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      if (activeEditor !== editor && $isEditorIsNestedEditor(activeEditor)) {
        const rootElement = activeEditor.getRootElement();
        updateToolbarState(
          'isImageCaption',
          !!rootElement?.parentElement?.classList.contains(
            'image-caption-container',
          ),
        );
      } else {
        updateToolbarState('isImageCaption', false);
      }

      const anchorNode = selection.anchor.getNode();
      const element = $findTopLevelElement(anchorNode);
      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      updateToolbarState('isRTL', $isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      const isLink = $isLinkNode(parent) || $isLinkNode(node);
      updateToolbarState('isLink', isLink);

      const tableNode = $findMatchingParent(node, $isTableNode);
      if ($isTableNode(tableNode)) {
        updateToolbarState('rootType', 'table');
      } else {
        updateToolbarState('rootType', 'root');
      }

      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode,
          );
          const type = parentList
            ? parentList.getListType()
            : element.getListType();

          updateToolbarState('blockType', type);
        } else {
          $handleHeadingNode(element);
          $handleCodeNode(element);
        }
      }

      // Handle buttons
      updateToolbarState(
        'fontColor',
        $getSelectionStyleValueForProperty(selection, 'color', '#000'),
      );
      updateToolbarState(
        'bgColor',
        $getSelectionStyleValueForProperty(
          selection,
          'background-color',
          '#fff',
        ),
      );
      updateToolbarState(
        'fontFamily',
        $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'),
      );
      let matchingParent;
      if ($isLinkNode(parent)) {
        // If node is a link, we need to fetch the parent paragraph node to set format
        matchingParent = $findMatchingParent(
          node,
          (parentNode) => $isElementNode(parentNode) && !parentNode.isInline(),
        );
      }

      // If matchingParent is a valid node, pass it's format type
      updateToolbarState(
        'elementFormat',
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
            ? node.getFormatType()
            : parent?.getFormatType() || 'left',
      );
    }
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      // Update text format
      updateToolbarState('isBold', selection.hasFormat('bold'));
      updateToolbarState('isItalic', selection.hasFormat('italic'));
      updateToolbarState('isUnderline', selection.hasFormat('underline'));
      updateToolbarState(
        'isStrikethrough',
        selection.hasFormat('strikethrough'),
      );
      updateToolbarState('isSubscript', selection.hasFormat('subscript'));
      updateToolbarState('isSuperscript', selection.hasFormat('superscript'));
      updateToolbarState('isHighlight', selection.hasFormat('highlight'));
      updateToolbarState('isCode', selection.hasFormat('code'));
      updateToolbarState(
        'fontSize',
        $getSelectionStyleValueForProperty(selection, 'font-size', '15px'),
      );
      updateToolbarState('isLowercase', selection.hasFormat('lowercase'));
      updateToolbarState('isUppercase', selection.hasFormat('uppercase'));
      updateToolbarState('isCapitalize', selection.hasFormat('capitalize'));
    }
    if ($isNodeSelection(selection)) {
      const nodes = selection.getNodes();
      for (const selectedNode of nodes) {
        const parentList = $getNearestNodeOfType<ListNode>(
          selectedNode,
          ListNode,
        );
        if (parentList) {
          const type = parentList.getListType();
          updateToolbarState('blockType', type);
        } else {
          const selectedElement = $findTopLevelElement(selectedNode);
          $handleHeadingNode(selectedElement);
          $handleCodeNode(selectedElement);
          // Update elementFormat for node selection (e.g., images)
          if ($isElementNode(selectedElement)) {
            updateToolbarState(
              'elementFormat',
              selectedElement.getFormatType(),
            );
          }
        }
      }
    }
  }, [
    activeEditor,
    editor,
    updateToolbarState,
    $handleHeadingNode,
    $handleCodeNode,
  ]);

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
    activeEditor.getEditorState().read(() => $updateToolbar(), { editor: activeEditor });
  }, [activeEditor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
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
    (
      styles: Record<string, string>,
      skipHistoryStack?: boolean,
      skipRefocus: boolean = false,
    ) => {
      activeEditor.update(
        () => {
          if (skipRefocus) {
            $addUpdateTag(SKIP_DOM_SELECTION_TAG);
          }
          const selection = $getSelection();
          if (selection !== null) {
            $patchStyleText(selection, styles);
          }
        },
        skipHistoryStack ? { tag: HISTORIC_TAG } : {},
      );
    },
    [activeEditor],
  );

  const onFontColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean, skipRefocus: boolean) => {
      applyStyleText({ color: value }, skipHistoryStack, skipRefocus);
    },
    [applyStyleText],
  );

  const onBgColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean, skipRefocus: boolean) => {
      applyStyleText(
        { 'background-color': value },
        skipHistoryStack,
        skipRefocus,
      );
    },
    [applyStyleText],
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
        $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage(value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey],
  );

  const onCodeThemeSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setTheme(value);
          }
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
          disabled={!toolbarState.canUndo || !isEditable}
          onClick={(e) => dispatchToolbarCommand(UNDO_COMMAND, undefined, isKeyboardInput(e))}
          className={toolbarIconBtn}
          title={IS_APPLE ? "Undo (⌘Z)" : "Undo (Ctrl+Z)"}
          aria-label="Undo"
        >
          <Undo2 className="size-4" />
        </button>
        <button
          type="button"
          disabled={!toolbarState.canRedo || !isEditable}
          onClick={(e) => dispatchToolbarCommand(REDO_COMMAND, undefined, isKeyboardInput(e))}
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
              rootType={toolbarState.rootType}
              disabled={false}
            />
            <Divider />
          </>
        )}

        {toolbarState.blockType === "code" && isCodeHighlighted ? (
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
