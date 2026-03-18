"use client";

/**
 * Images plugin: INSERT_IMAGE_COMMAND and paste/drop image support.
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $createRangeSelection,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  getDOMSelectionFromTarget,
  isHTMLElement,
  type LexicalCommand,
  type LexicalEditor,
} from "lexical";
import { useEffect } from "react";

import {
  $createImageNode,
  $isImageNode,
  ImageNode,
  type ImagePayload,
} from "../nodes/ImageNode";

export type InsertImagePayload = Readonly<ImagePayload>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND");

export default function ImagesPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      console.error("ImagesPlugin: ImageNode not registered");
      return;
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode({
            src: payload.src,
            altText: payload.altText ?? "",
            width: payload.width,
            height: payload.height,
          });
          $insertNodes([imageNode]);
          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => onDragStart(event),
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        DRAGOVER_COMMAND,
        (event) => onDragover(event),
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event) => onDrop(event, editor),
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor]);

  return null;
}

const TRANSPARENT_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const img = document.createElement("img");
img.src = TRANSPARENT_IMAGE;

function onDragStart(event: DragEvent): boolean {
  const node = getImageNodeInSelection();
  if (!node || !event.dataTransfer) return false;
  event.dataTransfer.setData("text/plain", "_");
  event.dataTransfer.setDragImage(img, 0, 0);
  event.dataTransfer.setData(
    "application/x-lexical-drag",
    JSON.stringify({
      type: "image",
      data: {
        src: node.getSrc(),
        altText: node.getAltText(),
      },
    }),
  );
  return true;
}

function onDragover(event: DragEvent): boolean {
  const node = getImageNodeInSelection();
  if (!node) return false;
  if (!canDropImage(event)) event.preventDefault();
  return true;
}

function onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = getImageNodeInSelection();
  if (!node) return false;
  const data = getDragImageData(event);
  if (!data) return false;
  event.preventDefault();
  if (canDropImage(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();
    if (range != null) rangeSelection.applyDOMRange(range);
    $setSelection(rangeSelection);
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, data);
  }
  return true;
}

function getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection();
  if (!selection || !$isNodeSelection(selection)) return null;
  const nodes = selection.getNodes();
  if (nodes.length !== 1) return null;
  const node = nodes[0];
  return $isImageNode(node) ? node : null;
}

function getDragImageData(event: DragEvent): InsertImagePayload | null {
  const raw = event.dataTransfer?.getData("application/x-lexical-drag");
  if (!raw) return null;
  try {
    const { type, data } = JSON.parse(raw);
    if (type !== "image" || !data?.src) return null;
    return { src: data.src, altText: data.altText ?? "" };
  } catch {
    return null;
  }
}

function canDropImage(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    isHTMLElement(target) &&
    !target.closest("code") &&
    isHTMLElement(target.parentElement)
  );
}

function getDragSelection(event: DragEvent): Range | null {
  if (document.caretRangeFromPoint) {
    return document.caretRangeFromPoint(event.clientX, event.clientY);
  }
  const domSelection = getDOMSelectionFromTarget(event.target);
  if (domSelection && domSelection.rangeCount > 0) {
    return domSelection.getRangeAt(0);
  }
  return null;
}
