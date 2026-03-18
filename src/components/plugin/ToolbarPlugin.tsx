/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
    $getSelection,
    $isRangeSelection,
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    COMMAND_PRIORITY_LOW,
    FORMAT_ELEMENT_COMMAND,
    FORMAT_TEXT_COMMAND,
    REDO_COMMAND,
    SELECTION_CHANGE_COMMAND,
    UNDO_COMMAND,
} from 'lexical';
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
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

function Divider() {
    return (
        <div
            className="h-6 w-px shrink-0 bg-border"
            role="separator"
            aria-hidden
        />
    );
}

export default function ToolbarPlugin() {
    const [editor] = useLexicalComposerContext();
    const toolbarRef = useRef(null);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);

    const $updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            // Update text format
            setIsBold(selection.hasFormat('bold'));
            setIsItalic(selection.hasFormat('italic'));
            setIsUnderline(selection.hasFormat('underline'));
            setIsStrikethrough(selection.hasFormat('strikethrough'));
        }
    }, []);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(
                    () => {
                        $updateToolbar();
                    },
                    { editor },
                );
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    $updateToolbar();
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                CAN_UNDO_COMMAND,
                (payload) => {
                    setCanUndo(payload);
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                CAN_REDO_COMMAND,
                (payload) => {
                    setCanRedo(payload);
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
        );
    }, [editor, $updateToolbar]);

    const toolbarButtonClass =
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-slate-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer';
    const activeClass = 'bg-slate-300/50  hover:bg-slate-300 hover:text-primary-foreground';

    return (
        <div
            ref={toolbarRef}
            className="flex flex-wrap items-center gap-0.5 rounded-t-lg border-b border-border bg-muted/50 px-1 py-1"
            role="toolbar"
            aria-label="Text formatting"
        >
            <button
                type="button"
                disabled={!canUndo}
                onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
                className={toolbarButtonClass}
                aria-label="Undo"
            >
                <Undo2 className="size-4" />
            </button>
            <button
                type="button"
                disabled={!canRedo}
                onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
                className={toolbarButtonClass}
                aria-label="Redo"
            >
                <Redo2 className="size-4" />
            </button>
            <Divider />
            <button
                type="button"
                onClick={() =>
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
                }
                className={cn(toolbarButtonClass, isBold && activeClass)}
                aria-label="Bold"
                aria-pressed={isBold}
            >
                <Bold className="size-4" />
            </button>
            <button
                type="button"
                onClick={() =>
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
                }
                className={cn(toolbarButtonClass, isItalic && activeClass)}
                aria-label="Italic"
                aria-pressed={isItalic}
            >
                <Italic className="size-4" />
            </button>
            <button
                type="button"
                onClick={() =>
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
                }
                className={cn(toolbarButtonClass, isUnderline && activeClass)}
                aria-label="Underline"
                aria-pressed={isUnderline}
            >
                <Underline className="size-4" />
            </button>
            <button
                type="button"
                onClick={() =>
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
                }
                className={cn(
                    toolbarButtonClass,
                    isStrikethrough && activeClass,
                )}
                aria-label="Strikethrough"
                aria-pressed={isStrikethrough}
            >
                <Strikethrough className="size-4" />
            </button>
            <Divider />
            <button
                type="button"
                onClick={() =>
                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')
                }
                className={toolbarButtonClass}
                aria-label="Align left"
            >
                <AlignLeft className="size-4" />
            </button>
            <button
                type="button"
                onClick={() =>
                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')
                }
                className={toolbarButtonClass}
                aria-label="Align center"
            >
                <AlignCenter className="size-4" />
            </button>
            <button
                type="button"
                onClick={() =>
                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')
                }
                className={toolbarButtonClass}
                aria-label="Align right"
            >
                <AlignRight className="size-4" />
            </button>
            <button
                type="button"
                onClick={() =>
                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')
                }
                className={toolbarButtonClass}
                aria-label="Justify"
            >
                <AlignJustify className="size-4" />
            </button>
        </div>
    );
}
