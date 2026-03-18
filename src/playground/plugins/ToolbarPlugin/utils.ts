/**
 * Toolbar format helpers (from lexical-playground-nextjs).
 */

import { $createCodeNode } from "@lexical/code";
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { $isDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import { $patchStyleText, $setBlocksType } from "@lexical/selection";
import { $isTableSelection } from "@lexical/table";
import { $getNearestBlockElementAncestorOrThrow } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  type LexicalEditor,
} from "lexical";

import {
  DEFAULT_FONT_SIZE,
  MAX_ALLOWED_FONT_SIZE,
  MIN_ALLOWED_FONT_SIZE,
} from "../../context/ToolbarContext";

export enum UpdateFontSizeType {
  increment = 1,
  decrement,
}

export function calculateNextFontSize(
  currentFontSize: number,
  updateType: UpdateFontSizeType | null,
): number {
  if (!updateType) return currentFontSize;
  let updated = currentFontSize;
  switch (updateType) {
    case UpdateFontSizeType.decrement:
      if (currentFontSize > MAX_ALLOWED_FONT_SIZE) updated = MAX_ALLOWED_FONT_SIZE;
      else if (currentFontSize >= 48) updated -= 12;
      else if (currentFontSize >= 24) updated -= 4;
      else if (currentFontSize >= 14) updated -= 2;
      else if (currentFontSize >= 9) updated -= 1;
      else updated = MIN_ALLOWED_FONT_SIZE;
      break;
    case UpdateFontSizeType.increment:
      if (currentFontSize < MIN_ALLOWED_FONT_SIZE) updated = MIN_ALLOWED_FONT_SIZE;
      else if (currentFontSize < 12) updated += 1;
      else if (currentFontSize < 20) updated += 2;
      else if (currentFontSize < 36) updated += 4;
      else if (currentFontSize <= 60) updated += 12;
      else updated = MAX_ALLOWED_FONT_SIZE;
      break;
  }
  return updated;
}

export function updateFontSizeInSelection(
  editor: LexicalEditor,
  newFontSize: string | null,
  updateType: UpdateFontSizeType | null,
): void {
  const getNext = (prev: string | null): string => {
    if (!prev) prev = `${DEFAULT_FONT_SIZE}px`;
    const num = Number(prev.slice(0, -2));
    return `${calculateNextFontSize(num, updateType)}px`;
  };
  editor.update(() => {
    if (!editor.isEditable()) return;
    const selection = $getSelection();
    if (selection) {
      $patchStyleText(selection, {
        "font-size": newFontSize ?? getNext(null),
      });
    }
  });
}

export function updateFontSize(
  editor: LexicalEditor,
  updateType: UpdateFontSizeType,
  inputValue: string,
): void {
  if (inputValue !== "") {
    const next = calculateNextFontSize(Number(inputValue), updateType);
    updateFontSizeInSelection(editor, `${next}px`, null);
  } else {
    updateFontSizeInSelection(editor, null, updateType);
  }
}

export function formatParagraph(editor: LexicalEditor): void {
  editor.update(() => {
    const selection = $getSelection();
    if (selection) $setBlocksType(selection, () => $createParagraphNode());
  });
}

export function formatHeading(
  editor: LexicalEditor,
  blockType: string,
  headingSize: HeadingTagType,
): void {
  if (blockType === headingSize) return;
  editor.update(() => {
    const selection = $getSelection();
    if (selection) $setBlocksType(selection, () => $createHeadingNode(headingSize));
  });
}

export function formatBulletList(editor: LexicalEditor, blockType: string): void {
  if (blockType !== "bullet") {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  } else {
    formatParagraph(editor);
  }
}

export function formatCheckList(editor: LexicalEditor, blockType: string): void {
  if (blockType !== "check") {
    editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
  } else {
    formatParagraph(editor);
  }
}

export function formatNumberedList(
  editor: LexicalEditor,
  blockType: string,
): void {
  if (blockType !== "number") {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  } else {
    formatParagraph(editor);
  }
}

export function formatQuote(editor: LexicalEditor, blockType: string): void {
  if (blockType === "quote") return;
  editor.update(() => {
    const selection = $getSelection();
    if (selection) $setBlocksType(selection, () => $createQuoteNode());
  });
}

export function formatCode(editor: LexicalEditor, blockType: string): void {
  if (blockType === "code") return;
  editor.update(() => {
    const selection = $getSelection();
    if (!selection) return;
    if (!$isRangeSelection(selection) || selection.isCollapsed()) {
      $setBlocksType(selection, () => $createCodeNode());
    } else {
      const text = selection.getTextContent();
      const codeNode = $createCodeNode();
      selection.insertNodes([codeNode]);
      const sel2 = $getSelection();
      if ($isRangeSelection(sel2)) sel2.insertRawText(text);
    }
  });
}

export function clearFormatting(editor: LexicalEditor): void {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) && !$isTableSelection(selection)) return;
    const anchor = selection.anchor;
    const focus = selection.focus;
    const nodes = selection.getNodes();
    const extracted = selection.extract();
    if (anchor.key === focus.key && anchor.offset === focus.offset) return;
    nodes.forEach((node, idx) => {
      if ($isTextNode(node)) {
        let textNode = node;
        if (idx === 0 && anchor.offset !== 0) {
          textNode = textNode.splitText(anchor.offset)[1] ?? textNode;
        }
        if (idx === nodes.length - 1) {
          textNode = textNode.splitText(focus.offset)[0] ?? textNode;
        }
        const extractedNode = extracted[0];
        if (nodes.length === 1 && $isTextNode(extractedNode)) {
          textNode = extractedNode;
        }
        if (textNode.getStyle()) textNode.setStyle("");
        if (textNode.getFormat() !== 0) {
          textNode.setFormat(0);
          $getNearestBlockElementAncestorOrThrow(textNode).setFormat("");
        }
      } else if ($isHeadingNode(node) || $isQuoteNode(node)) {
        node.replace($createParagraphNode(), true);
      } else if ($isDecoratorBlockNode(node)) {
        node.setFormat("");
      }
    });
  });
}
