import { TextStyleKit } from "@tiptap/extension-text-style";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Dispatch, SetStateAction } from "react";
import { MenuBar } from "./menu-bar";

const extensions = [TextStyleKit, StarterKit];

type Props = {
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
};

const TiptapEditor = ({ content, setContent }: Props) => {
  const editor = useEditor({
    extensions,
    content,
    onUpdate: ({ editor }: { editor: Editor }) => {
      setContent(editor.getHTML());
    },
  });

  return (
    <div className="border w-full h-full rounded-lg m-2">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <MenuBar editor={editor} />
      </div>

      {/* CONTENT */}
      <div className="prose dark:prose-invert max-w-none p-4 focus:outline-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor;
