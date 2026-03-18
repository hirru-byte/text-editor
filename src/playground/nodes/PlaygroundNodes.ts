/**
 * Lexical nodes used in the playground.
 */

import type { Klass, LexicalNode } from "lexical";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";

import { YouTubeNode } from "@/components/LexicalNode/YoutubeNode";

import { ImageNode } from "./ImageNode";

const PlaygroundNodes: Array<Klass<LexicalNode>> = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  LinkNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  ImageNode,
  YouTubeNode,
];

export default PlaygroundNodes;
