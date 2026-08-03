'use client'

import { useRef } from 'react'
import { useEditor, EditorContent, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import TiptapImage from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { toast } from 'sonner'
import {
  Bold, Italic, UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Link2, ImageIcon, Undo2, Redo2, Eraser, Loader2,
} from 'lucide-react'
import { uploadToCloudinary } from '@/lib/cloudinary'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: { fontSize?: string | null }) => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }) => chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).run(),
    }
  },
})

const FONT_SIZES = [
  { label: 'Nhỏ', value: '14px' },
  { label: 'Vừa', value: '16px' },
  { label: 'Lớn', value: '20px' },
  { label: 'Rất lớn', value: '28px' },
]

const TEXT_COLORS = ['#111827', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777']
const HIGHLIGHT_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa']

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      TiptapImage.configure({ HTMLAttributes: { class: 'rounded-xl' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Viết nội dung bài viết…' }),
      FontSize,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none min-h-[360px] px-4 py-3 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !editor) return
    try {
      const url = await uploadToCloudinary(file)
      editor.chain().focus().setImage({ src: url }).run()
    } catch {
      toast.error('Tải ảnh thất bại, thử lại')
    }
  }

  function handleSetLink() {
    if (!editor) return
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Nhập URL liên kết:', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[420px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-2 py-1.5 sticky top-0 z-10">
        <ToolbarButton label="Hoàn tác" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton label="Làm lại" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="w-4 h-4" /></ToolbarButton>

        <Divider />

        <select
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1' :
            editor.isActive('heading', { level: 2 }) ? 'h2' :
            editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'
          }
          onChange={(e) => {
            const v = e.target.value
            if (v === 'p') editor.chain().focus().setParagraph().run()
            else editor.chain().focus().toggleHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 }).run()
          }}
          className="h-7 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs px-1.5 text-gray-700 dark:text-gray-200 focus:outline-none"
        >
          <option value="p">Đoạn văn</option>
          <option value="h1">Tiêu đề 1</option>
          <option value="h2">Tiêu đề 2</option>
          <option value="h3">Tiêu đề 3</option>
        </select>

        <select
          value={(editor.getAttributes('textStyle').fontSize as string | undefined) ?? ''}
          onChange={(e) => {
            const v = e.target.value
            if (!v) editor.chain().focus().unsetFontSize().run()
            else editor.chain().focus().setFontSize(v).run()
          }}
          className="h-7 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs px-1.5 text-gray-700 dark:text-gray-200 focus:outline-none"
        >
          <option value="">Cỡ chữ</option>
          {FONT_SIZES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        <Divider />

        <ToolbarButton label="In đậm" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton label="In nghiêng" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton label="Gạch chân" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton label="Gạch ngang" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="w-4 h-4" /></ToolbarButton>

        <Divider />

        <div className="flex items-center gap-0.5" title="Màu chữ">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => editor.chain().focus().setColor(c).run()}
              className="w-4 h-4 rounded-full ring-1 ring-black/10 dark:ring-white/20"
              style={{ backgroundColor: c }}
              aria-label={`Màu chữ ${c}`}
            />
          ))}
          <button type="button" onClick={() => editor.chain().focus().unsetColor().run()} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-1" title="Bỏ màu chữ">✕</button>
        </div>

        <div className="flex items-center gap-0.5 ml-1" title="Màu nền chữ">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
              className="w-4 h-4 rounded-full ring-1 ring-black/10 dark:ring-white/20"
              style={{ backgroundColor: c }}
              aria-label={`Highlight ${c}`}
            />
          ))}
          <button type="button" onClick={() => editor.chain().focus().unsetHighlight().run()} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-1" title="Bỏ highlight">✕</button>
        </div>

        <Divider />

        <ToolbarButton label="Căn trái" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton label="Căn giữa" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton label="Căn phải" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight className="w-4 h-4" /></ToolbarButton>

        <Divider />

        <ToolbarButton label="Danh sách" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton label="Danh sách số" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton label="Trích dẫn" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="w-4 h-4" /></ToolbarButton>

        <Divider />

        <ToolbarButton label="Chèn liên kết" active={editor.isActive('link')} onClick={handleSetLink}><Link2 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton label="Chèn ảnh" onClick={() => imageInputRef.current?.click()}><ImageIcon className="w-4 h-4" /></ToolbarButton>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />

        <Divider />

        <ToolbarButton label="Xóa định dạng" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><Eraser className="w-4 h-4" /></ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />
}

function ToolbarButton({
  children, onClick, active, label,
}: { children: React.ReactNode; onClick: () => void; active?: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  )
}
