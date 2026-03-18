"use client";

/**
 * Simplified ImageNode for the playground (block image, no caption).
 */

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import type { JSX } from "react";

import { $applyNodeReplacement, DecoratorNode } from "lexical";

export interface ImagePayload {
  altText: string;
  key?: NodeKey;
  src: string;
  width?: number;
  height?: number;
}

function convertImageElement(domNode: Node): DOMConversionOutput | null {
  const img = domNode as HTMLImageElement;
  if (img.src.startsWith("file:///")) return null;
  const { alt: altText, src, width, height } = img;
  return {
    node: $createImageNode({ altText: altText ?? "", src, width, height }),
  };
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    height?: number;
    src: string;
    width?: number;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: number;
  __height: number;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key,
    );
  }

  static importJSON(serialized: SerializedImageNode): ImageNode {
    const { altText, src, width, height } = serialized;
    return $createImageNode({ altText, src, width, height });
  }

  exportDOM(): DOMExportOutput {
    const el = document.createElement("img");
    el.setAttribute("src", this.__src);
    el.setAttribute("alt", this.__altText);
    if (this.__width) el.setAttribute("width", String(this.__width));
    if (this.__height) el.setAttribute("height", String(this.__height));
    return { element: el };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({ conversion: convertImageElement, priority: 0 }),
    };
  }

  constructor(
    src: string,
    altText: string,
    width: number = 0,
    height: number = 0,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      altText: this.__altText,
      src: this.__src,
      width: this.__width,
      height: this.__height,
    };
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  decorate(): JSX.Element {
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        width={this.__width || undefined}
        height={this.__height || undefined}
        className="max-w-full h-auto rounded-lg border border-border"
        draggable={false}
      />
    );
  }
}

export function $createImageNode(payload: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(
      payload.src,
      payload.altText,
      payload.width,
      payload.height,
      payload.key,
    ),
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}
