"use client";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { menuBarStateSelector } from "./menu-bar-state";

import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  FileCode2,
  Minus,
  Undo2,
  Redo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface MenuBarProps {
  editor: Editor | null;
}

export function MenuBar({ editor }: MenuBarProps) {
  if (!editor) return null;

  const editorState = useEditorState({
    editor,
    selector: menuBarStateSelector,
  });

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-background p-2">
      {/* TEXT FORMATTING */}
      <ToggleGroup
        type="multiple"
        value={
          [
            editorState.isBold && "bold",
            editorState.isItalic && "italic",
            editorState.isStrike && "strike",
            editorState.isCode && "code",
          ].filter(Boolean) as string[]
        }
      >
        <ToggleGroupItem
          value="bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editorState.canBold}
        >
          <Tooltip>
            <TooltipTrigger>
              <Bold className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Bold Text</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>

        <ToggleGroupItem
          value="italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editorState.canItalic}
        >
          <Tooltip>
            <TooltipTrigger>
              <Italic className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Italic Text</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>

        <ToggleGroupItem
          value="strike"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editorState.canStrike}
        >
          <Tooltip>
            <TooltipTrigger>
              <Strikethrough className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Strikethrough Text</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>

        <ToggleGroupItem
          value="code"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editorState.canCode}
        >
          <Tooltip>
            <TooltipTrigger>
              <Code className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Code Text</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" className="h-6" />

      {/* HEADINGS */}
      <ToggleGroup
        type="single"
        value={
          editorState.isHeading1
            ? "h1"
            : editorState.isHeading2
              ? "h2"
              : editorState.isHeading3
                ? "h3"
                : ""
        }
      >
        <ToggleGroupItem
          value="h1"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Tooltip>
            <TooltipTrigger>
              <Heading1 className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Heading 1</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>

        <ToggleGroupItem
          value="h2"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Tooltip>
            <TooltipTrigger>
              <Heading2 className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Heading 2</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>

        <ToggleGroupItem
          value="h3"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Tooltip>
            <TooltipTrigger>
              <Heading3 className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Heading 3</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" className="h-6" />

      {/* LISTS */}
      <ToggleGroup
        type="multiple"
        value={
          [
            editorState.isBulletList && "bullet",
            editorState.isOrderedList && "ordered",
          ].filter(Boolean) as string[]
        }
      >
        <ToggleGroupItem
          value="bullet"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <Tooltip>
            <TooltipTrigger>
              <List className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>

        <ToggleGroupItem
          value="ordered"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <Tooltip>
            <TooltipTrigger>
              <ListOrdered className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Number List</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" className="h-6" />

      {/* BLOCKS */}
      <ToggleGroup
        type="multiple"
        value={
          [
            editorState.isBlockquote && "quote",
            editorState.isCodeBlock && "codeblock",
          ].filter(Boolean) as string[]
        }
      >
        <ToggleGroupItem
          value="quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Tooltip>
            <TooltipTrigger>
              <Quote className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Block Quote</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>

        <ToggleGroupItem
          value="codeblock"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Tooltip>
            <TooltipTrigger>
              <FileCode2 className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Code Block</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Horizontal Rule */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Tooltip>
          <TooltipTrigger>
            <Minus className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Horizontal Rule</TooltipContent>
        </Tooltip>
      </Button>

      {/* UNDO / REDO */}
      <div className="ml-auto flex gap-2">
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="outline"
              size="icon"
              disabled={!editorState.canUndo}
              onClick={() => editor.chain().focus().undo().run()}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="outline"
              size="icon"
              disabled={!editorState.canRedo}
              onClick={() => editor.chain().focus().redo().run()}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
