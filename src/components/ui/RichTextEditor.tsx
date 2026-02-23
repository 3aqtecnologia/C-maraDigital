import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { Editor, EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold, Italic,
  List, ListOrdered,
  Redo,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null

  return (
    <div className="border border-gray-300 bg-gray-50 rounded-t-lg p-2 flex flex-wrap gap-1 items-center">
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 text-primary-700' : 'text-gray-600'}`}
          title="Negrito"
          type="button"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 text-primary-700' : 'text-gray-600'}`}
          title="Itálico"
          type="button"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('underline') ? 'bg-gray-200 text-primary-700' : 'text-gray-600'}`}
          title="Sublinhado"
          type="button"
        >
          <UnderlineIcon size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('strike') ? 'bg-gray-200 text-primary-700' : 'text-gray-600'}`}
          title="Tachado"
          type="button"
        >
          <Strikethrough size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-1">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 text-primary-700' : 'text-gray-600'}`}
          title="Alinhar à Esquerda"
          type="button"
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 text-primary-700' : 'text-gray-600'}`}
          title="Centralizar"
          type="button"
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 text-primary-700' : 'text-gray-600'}`}
          title="Alinhar à Direita"
          type="button"
        >
          <AlignRight size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200 text-primary-700' : 'text-gray-600'}`}
          title="Justificar"
          type="button"
        >
          <AlignJustify size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-1">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 text-primary-700' : 'text-gray-600'}`}
          title="Lista com Marcadores"
          type="button"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 text-primary-700' : 'text-gray-600'}`}
          title="Lista Numerada"
          type="button"
        >
          <ListOrdered size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 disabled:opacity-30"
          title="Desfazer"
          type="button"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 disabled:opacity-30"
          title="Refazer"
          type="button"
        >
          <Redo size={16} />
        </button>
      </div>
    </div>
  )
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content || (placeholder ? `<p class="text-gray-400 prose-sm">${placeholder.replace(/\n/g, '<br/>')}</p>` : ''),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-6 bg-white border border-gray-300 border-t-0 rounded-b-lg font-sans text-gray-800 leading-relaxed shadow-inner overflow-y-auto',
      },
    },
  })

  return (
    <div className="flex flex-col w-full shadow-sm">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
