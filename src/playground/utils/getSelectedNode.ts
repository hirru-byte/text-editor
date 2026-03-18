import { $isAtNodeEnd } from "@lexical/selection";
import type { ElementNode, RangeSelection, TextNode } from "lexical";

export function getSelectedNode(
  selection: RangeSelection,
): TextNode | ElementNode {
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) return anchorNode;
  const isBackward = selection.isBackward();
  return isBackward
    ? ($isAtNodeEnd(focusNode) ? anchorNode : focusNode)
    : ($isAtNodeEnd(anchorNode) ? anchorNode : focusNode);
}
