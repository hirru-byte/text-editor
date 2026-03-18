/**
 * Pre-populated rich text content for the playground.
 */

import { $createLinkNode } from "@lexical/link";
import { $createListItemNode, $createListNode } from "@lexical/list";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
} from "lexical";

export function prepopulatedRichText(): void {
  const root = $getRoot();
  if (root.getFirstChild() !== null) return;

  const heading = $createHeadingNode("h1");
  heading.append($createTextNode("Welcome to the Lexical Playground"));
  root.append(heading);

  const quote = $createQuoteNode();
  quote.append(
    $createTextNode(
      "This is a demo built with Lexical and Next.js. Try formatting text with the toolbar, " +
        "or insert a YouTube video. The debug view at the bottom shows the editor state tree.",
    ),
  );
  root.append(quote);

  const p1 = $createParagraphNode();
  p1.append(
    $createTextNode("You can type "),
    $createTextNode("bold").toggleFormat("bold"),
    $createTextNode(", "),
    $createTextNode("italic").toggleFormat("italic"),
    $createTextNode(", or "),
    $createTextNode("underline").toggleFormat("underline"),
    $createTextNode(" text."),
  );
  root.append(p1);

  const p2 = $createParagraphNode();
  p2.append(
    $createTextNode("Links work too: "),
    $createLinkNode("https://lexical.dev").append($createTextNode("Lexical")),
    $createTextNode(" and "),
    $createLinkNode("https://github.com/facebook/lexical").append(
      $createTextNode("GitHub"),
    ),
    $createTextNode("."),
  );
  root.append(p2);

  const list = $createListNode("bullet");
  list.append(
    $createListItemNode().append($createTextNode("First item")),
    $createListItemNode().append($createTextNode("Second item")),
    $createListItemNode().append($createTextNode("Third item")),
  );
  root.append(list);

  const p3 = $createParagraphNode();
  p3.append(
    $createTextNode(
      "Toggle settings with the gear icon to show/hide the debug tree view or start with an empty editor.",
    ),
  );
  root.append(p3);
}
