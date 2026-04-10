"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { cn } from "@/lib/utils";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListIcon,
  ListOrderedIcon,
  UndoIcon,
  RedoIcon,
  LinkIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type RichTextEditorProps = {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  name?: string;
};

export function RichTextEditor({
  content = "",
  onChange,
  placeholder = "Tulis deskripsi di sini...",
  className,
  name,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm prose prose-sm max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    immediatelyRender: false,
  });

  const addLink = () => {
    if (editor && linkUrl) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  const removeLink = () => {
    if (editor) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setShowLinkInput(false);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-1 rounded-md border border-input bg-transparent p-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bold") && "bg-muted"
          )}
        >
          <BoldIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("italic") && "bg-muted"
          )}
        >
          <ItalicIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("underline") && "bg-muted"
          )}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={!editor.can().chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("heading", { level: 1 }) && "bg-muted"
          )}
        >
          <Heading1Icon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("heading", { level: 2 }) && "bg-muted"
          )}
        >
          <Heading2Icon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={!editor.can().chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("heading", { level: 3 }) && "bg-muted"
          )}
        >
          <Heading3Icon className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bulletList") && "bg-muted"
          )}
        >
          <ListIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("orderedList") && "bg-muted"
          )}
        >
          <ListOrderedIcon className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive({ textAlign: "left" }) && "bg-muted"
          )}
        >
          <AlignLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive({ textAlign: "center" }) && "bg-muted"
          )}
        >
          <AlignCenterIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive({ textAlign: "right" }) && "bg-muted"
          )}
        >
          <AlignRightIcon className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowLinkInput(!showLinkInput)}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("link") && "bg-muted"
          )}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="h-8 w-8 p-0"
        >
          <UndoIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="h-8 w-8 p-0"
        >
          <RedoIcon className="h-4 w-4" />
        </Button>
      </div>

      {showLinkInput && (
        <div className="flex gap-2 rounded-md border border-input bg-transparent p-2">
          <input
            type="text"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <Button type="button" size="sm" onClick={addLink}>
            Tambah
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={removeLink}>
            Hapus Link
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setShowLinkInput(false)}>
            Batal
          </Button>
        </div>
      )}

      <EditorContent editor={editor} />
      {name && (
        <input
          type="hidden"
          name={name}
          value={editor.getHTML()}
        />
      )}
    </div>
  );
}
