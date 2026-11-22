'use client'

import { useRef, useState, useEffect } from 'react'
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
  Smile, Palette, Highlighter, Type, X, Search
} from 'lucide-react'
import { uploadToCloudinary } from '@/lib/cloudinary'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
    fontFamily: {
      setFontFamily: (font: string) => ReturnType
      unsetFontFamily: () => ReturnType
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

const FontFamily = Extension.create({
  name: 'fontFamily',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontFamily?.replace(/['"]/g, '') || null,
            renderHTML: (attributes: { fontFamily?: string | null }) => {
              if (!attributes.fontFamily) return {}
              return { style: `font-family: ${attributes.fontFamily}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontFamily: (font: string) => ({ chain }) => chain().setMark('textStyle', { fontFamily: font }).run(),
      unsetFontFamily: () => ({ chain }) => chain().setMark('textStyle', { fontFamily: null }).run(),
    }
  },
})

const FONT_FAMILIES = [
  { label: 'Phông mặc định', value: '' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Be Vietnam Pro', value: '"Be Vietnam Pro", sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Segoe UI', value: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New (Code)', value: '"Courier New", Courier, monospace' },
]

const FONT_SIZES = [
  { label: 'Cỡ chữ: Chuẩn', value: '' },
  { label: '13px (Rất nhỏ)', value: '13px' },
  { label: '14px (Nhỏ)', value: '14px' },
  { label: '16px (Chuẩn)', value: '16px' },
  { label: '18px (Vừa lớn)', value: '18px' },
  { label: '20px (Lớn)', value: '20px' },
  { label: '24px (Tiêu đề)', value: '24px' },
  { label: '28px (Rất lớn)', value: '28px' },
]

const TEXT_COLORS = [
  { label: 'Đen', value: '#111827' },
  { label: 'Xám', value: '#4b5563' },
  { label: 'Đỏ', value: '#dc2626' },
  { label: 'Cam', value: '#ea580c' },
  { label: 'Vàng hổ phách', value: '#d97706' },
  { label: 'Xanh lá', value: '#16a34a' },
  { label: 'Xanh lơ', value: '#0891b2' },
  { label: 'Xanh dương', value: '#2563eb' },
  { label: 'Tím', value: '#7c3aed' },
  { label: 'Hồng', value: '#db2777' },
]

const HIGHLIGHT_COLORS = [
  { label: 'Vàng nhạt', value: '#fef08a' },
  { label: 'Xanh lá nhạt', value: '#bbf7d0' },
  { label: 'Xanh dương nhạt', value: '#bfdbfe' },
  { label: 'Hồng nhạt', value: '#fbcfe8' },
  { label: 'Cam nhạt', value: '#fed7aa' },
  { label: 'Tím nhạt', value: '#ddd6fe' },
  { label: 'Xám nhạt', value: '#e2e8f0' },
  { label: 'Đỏ nhạt', value: '#fecaca' },
]

const ICON_CATEGORIES = [
  {
    name: 'Phổ biến',
    icons: ['🔥', '⭐', '✨', '💎', '🚀', '🎯', '💡', '⚡', '🏆', '👑', '🎁', '🏷️', '📌', '📍', '✅', '✔️', '❌', '⚠️', '❗', '❓', '🔔', '⏰', '🔒', '🛡️', '🔑'],
  },
  {
    name: 'Kinh doanh & Sản phẩm',
    icons: ['💰', '💵', '💳', '🧾', '📊', '📈', '📉', '🛒', '🛍️', '📦', '🚚', '🏢', '🏦', '⚖️', '📜', '📑', '📋', '📁', '📂', '💼', '🖋️', '📝', '🤝', '🏛️'],
  },
  {
    name: 'Công nghệ & Liên hệ',
    icons: ['💻', '🖥️', '📱', '📞', '📧', '✉️', '🌐', '🔗', '⚙️', '🛠️', '🔧', '🖨️', '💬', '🗨️', '📢', '📣', '👥', '👤', '🧑‍💼', '👨‍💻', '📅', '🗓️', '🎉', '🎊'],
  },
  {
    name: 'Ký hiệu & Điểm nhấn',
    icons: ['👉', '➡️', '▶️', '🔹', '🔸', '▫️', '▪️', '🔘', '⚪', '⚫', '🔴', '🟢', '🟡', '🔵', '🟣', '🔶', '🔷', '🔺', '🔻', '💯', '🆗', '🆙', '🆓', '🆕', '🔟'],
  },
]

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Viết nội dung bài viết / giới thiệu sản phẩm…',
  minHeight = 'min-h-[320px]',
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const iconPickerRef = useRef<HTMLDivElement>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [iconTab, setIconTab] = useState(0)
  const [iconSearch, setIconSearch] = useState('')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      TiptapImage.configure({ HTMLAttributes: { class: 'rounded-xl max-w-full my-2' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      FontSize,
      FontFamily,
    ],
    content,
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose-base dark:prose-invert max-w-none ${minHeight} px-4 py-3 focus:outline-none leading-relaxed [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-3 [&_blockquote]:italic`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Close icon picker when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target as Node)) {
        setShowIconPicker(false)
      }
    }
    if (showIconPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showIconPicker])

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

  function handleInsertIcon(icon: string) {
    if (!editor) return
    editor.chain().focus().insertContent(icon).run()
  }

  if (!editor) {
    return (
      <div className={`flex items-center justify-center ${minHeight} rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900`}>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  // Filter icons for search
  const allIcons = ICON_CATEGORIES.flatMap((c) => c.icons)
  const displayedIcons = iconSearch.trim()
    ? allIcons.filter((ic) => ic.includes(iconSearch.trim()))
    : ICON_CATEGORIES[iconTab]?.icons ?? []

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/80 px-2.5 py-1.5 sticky top-0 z-10 backdrop-blur-sm">
        <ToolbarButton label="Hoàn tác (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton label="Làm lại (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Phông chữ */}
        <div className="flex items-center gap-1" title="Phông chữ">
          <Type className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 hidden sm:inline" />
          <select
            value={(editor.getAttributes('textStyle').fontFamily as string | undefined) ?? ''}
            onChange={(e) => {
              const v = e.target.value
              if (!v) editor.chain().focus().unsetFontFamily().run()
              else editor.chain().focus().setFontFamily(v).run()
            }}
            className="h-7 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs px-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cỡ chữ */}
        <select
          value={(editor.getAttributes('textStyle').fontSize as string | undefined) ?? ''}
          onChange={(e) => {
            const v = e.target.value
            if (!v) editor.chain().focus().unsetFontSize().run()
            else editor.chain().focus().setFontSize(v).run()
          }}
          className="h-7 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs px-1.5 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
        >
          {FONT_SIZES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Định dạng khối */}
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
          className="h-7 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs px-1.5 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="p">Đoạn văn</option>
          <option value="h1">Tiêu đề 1</option>
          <option value="h2">Tiêu đề 2</option>
          <option value="h3">Tiêu đề 3</option>
        </select>

        <Divider />

        {/* Định dạng văn bản */}
        <ToolbarButton label="In đậm (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton label="In nghiêng (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton label="Gạch chân (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton label="Gạch ngang" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Màu chữ */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700" title="Màu chữ">
          <Palette className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          <div className="flex items-center gap-0.5">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().setColor(c.value).run()}
                className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10 dark:ring-white/20 hover:scale-125 transition-transform"
                style={{ backgroundColor: c.value }}
                title={`Màu chữ: ${c.label}`}
                aria-label={`Màu chữ ${c.label}`}
              />
            ))}
          </div>
          {/* Custom color picker */}
          <label className="relative flex items-center cursor-pointer ml-0.5" title="Chọn màu chữ tùy chỉnh">
            <span className="text-[10px] text-gray-500 font-bold px-1 hover:text-indigo-600">Màu khác</span>
            <input
              type="color"
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            />
          </label>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="text-[10px] text-gray-400 hover:text-red-500 px-0.5"
            title="Bỏ màu chữ"
          >
            ✕
          </button>
        </div>

        {/* Màu nền / Highlight chữ */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700" title="Màu nền / Highlight chữ">
          <Highlighter className="w-3.5 h-3.5 text-amber-500" />
          <div className="flex items-center gap-0.5">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleHighlight({ color: c.value }).run()}
                className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10 dark:ring-white/20 hover:scale-125 transition-transform"
                style={{ backgroundColor: c.value }}
                title={`Highlight: ${c.label}`}
                aria-label={`Highlight ${c.label}`}
              />
            ))}
          </div>
          {/* Custom highlight picker */}
          <label className="relative flex items-center cursor-pointer ml-0.5" title="Chọn màu highlight tùy chỉnh">
            <span className="text-[10px] text-gray-500 font-bold px-1 hover:text-amber-600">Nền khác</span>
            <input
              type="color"
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
            />
          </label>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().unsetHighlight().run()}
            className="text-[10px] text-gray-400 hover:text-red-500 px-0.5"
            title="Bỏ highlight"
          >
            ✕
          </button>
        </div>

        <Divider />

        {/* Chèn Icon / Emoji */}
        <div className="relative" ref={iconPickerRef}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowIconPicker((prev) => !prev)}
            title="Chèn icon / emoji sinh động"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
              showIconPicker
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 ring-1 ring-amber-400'
                : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Smile className="w-3.5 h-3.5 text-amber-500" />
            <span>Icon</span>
          </button>

          {/* Icon Picker Popover */}
          {showIconPicker && (
            <div className="absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-80 p-3 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800 mb-2">
                <span className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-amber-500" /> Chọn Icon / Emoji
                </span>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Category tabs */}
              <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
                {ICON_CATEGORIES.map((cat, idx) => (
                  <button
                    key={cat.name}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setIconTab(idx)
                      setIconSearch('')
                    }}
                    className={`px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap transition-colors ${
                      iconTab === idx && !iconSearch
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative my-1.5">
                <Search className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Dán hoặc tìm icon..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="w-full pl-6 pr-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Icon grid */}
              <div className="grid grid-cols-7 gap-1.5 max-h-44 overflow-y-auto p-1 mt-1 scrollbar-thin">
                {displayedIcons.map((ic, i) => (
                  <button
                    key={`${ic}-${i}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleInsertIcon(ic)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:scale-125 transition-transform"
                    title={`Chèn ${ic}`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* Căn lề */}
        <ToolbarButton label="Căn trái" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton label="Căn giữa" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton label="Căn phải" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Danh sách */}
        <ToolbarButton label="Danh sách chấm" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton label="Danh sách số" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton label="Trích dẫn / Ghi chú" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Chèn liên kết & hình ảnh */}
        <ToolbarButton label="Chèn liên kết" active={editor.isActive('link')} onClick={handleSetLink}>
          <Link2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton label="Chèn ảnh" onClick={() => imageInputRef.current?.click()}>
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />

        <Divider />

        {/* Xóa định dạng */}
        <ToolbarButton label="Xóa định dạng" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <Eraser className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor Body */}
      <EditorContent editor={editor} />
    </div>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5 shrink-0" />
}

function ToolbarButton({
  children, onClick, active, label,
}: { children: React.ReactNode; onClick: () => void; active?: boolean; label: string }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-gray-700/80'
      }`}
    >
      {children}
    </button>
  )
}
