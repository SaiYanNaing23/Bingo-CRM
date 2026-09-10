import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { Node as DocumentNode } from '@tiptap/pm/model'
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  SquareCode,
  Link,
  Undo2,
  Redo2,
  RemoveFormatting,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { noteEditorExtensions } from './editor-extensions'
import { noteUrl } from './note-url'

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  ref,
}: {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  disabled: boolean
  invalid: boolean
  ref?: Ref<{ focus: () => void }>
}) {
  // This editor owns its document. Form rerenders (including failed saves) must
  // never reload it or reset the selection/history. NoteForm is keyed by note ID.
  const [initial] = useState(value)
  const [extensions] = useState(noteEditorExtensions)
  const initialDocument = useRef<DocumentNode | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const editor = useEditor({
    extensions,
    content: initial,
    contentType: 'markdown',
    parseOptions: { preserveWhitespace: 'full' },
    enableInputRules: false,
    enablePasteRules: false,
    shouldRerenderOnTransaction: true,
    editable: !disabled,
    editorProps: {
      attributes: {
        id: 'content',
        role: 'textbox',
        'aria-label': 'Content',
        'aria-multiline': 'true',
        'aria-required': 'true',
        'aria-disabled': String(disabled),
        'aria-invalid': String(invalid),
        'aria-describedby': 'content-description content-count',
        class: 'markdown-content rich-text-content min-h-80 px-4 py-3 outline-none',
      },
      // Clicking a saved reference while writing should keep the draft open.
      handleClick: (_view, _pos, event) => {
        if (!(event.target as HTMLElement).closest('a')) return false
        event.preventDefault()
        return true
      },
    },
    onBlur,
    onCreate: ({ editor }) => {
      initialDocument.current = editor.state.doc
    },
    onUpdate: ({ editor }) => {
      onChange(
        initialDocument.current?.eq(editor.state.doc)
          ? initial
          : editor.getText().trim()
            ? editor.getMarkdown()
            : '',
      )
    },
  })
  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        editor?.commands.focus()
      },
    }),
    [editor],
  )
  useEffect(() => {
    editor?.setEditable(!disabled, false)
  }, [editor, disabled])

  if (!editor) return null
  const actions = [
    {
      label: 'Bold',
      icon: Bold,
      active: editor.isActive('bold'),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: 'Italic',
      icon: Italic,
      active: editor.isActive('italic'),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Strikethrough',
      icon: Strikethrough,
      active: editor.isActive('strike'),
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      label: 'Heading 1',
      icon: Heading1,
      active: editor.isActive('heading', { level: 1 }),
      run: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: 'Heading 2',
      icon: Heading2,
      active: editor.isActive('heading', { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'Bulleted list',
      icon: List,
      active: editor.isActive('bulletList'),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Numbered list',
      icon: ListOrdered,
      active: editor.isActive('orderedList'),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Checklist',
      icon: ListChecks,
      active: editor.isActive('taskList'),
      run: () => editor.chain().focus().toggleTaskList().run(),
    },
    {
      label: 'Quote',
      icon: Quote,
      active: editor.isActive('blockquote'),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: 'Inline code',
      icon: Code,
      active: editor.isActive('code'),
      run: () => editor.chain().focus().toggleCode().run(),
    },
    {
      label: 'Code block',
      icon: SquareCode,
      active: editor.isActive('codeBlock'),
      run: () => editor.chain().focus().toggleCodeBlock().run(),
    },
  ]
  const applyLink = () => {
    const href = url.trim()
    if (!noteUrl(href)) {
      setLinkError('Enter an https://, http://, mailto: or #section link.')
      return
    }
    const chain = editor.chain().focus().extendMarkRange('link')
    if (editor.state.selection.empty && !editor.isActive('link'))
      chain
        .insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] })
        .run()
    else chain.setLink({ href }).run()
    setLinkOpen(false)
  }
  return (
    <div
      className={cn(
        'min-w-0 rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring/40',
        invalid && 'border-destructive',
        disabled && 'opacity-60',
      )}
    >
      <div
        className="flex flex-wrap gap-1 border-b bg-muted/40 p-2"
        role="group"
        aria-label="Text formatting"
      >
        {actions.map(({ label, icon: Icon, active, run }) => (
          <Button
            key={label}
            type="button"
            size="icon-sm"
            variant={active ? 'secondary' : 'ghost'}
            aria-label={label}
            title={label}
            aria-pressed={active}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={run}
          >
            <Icon />
          </Button>
        ))}
        <Popover
          open={linkOpen}
          onOpenChange={(open) => {
            setLinkOpen(open)
            if (open) {
              setUrl(editor.getAttributes('link').href ?? '')
              setLinkError('')
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="icon-sm"
              variant={editor.isActive('link') ? 'secondary' : 'ghost'}
              aria-label="Link"
              title="Link"
              aria-pressed={editor.isActive('link')}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
            >
              <Link />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              editor.commands.focus()
            }}
          >
            <Label htmlFor="note-link-url">Link URL</Label>
            <Input
              id="note-link-url"
              className="mt-2"
              value={url}
              placeholder="https://example.com"
              disabled={disabled}
              aria-invalid={!!linkError}
              aria-describedby={linkError ? 'note-link-error' : undefined}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applyLink()
                }
              }}
            />
            {linkError && (
              <p id="note-link-error" role="alert" className="mt-2 text-xs text-destructive">
                {linkError}
              </p>
            )}
            <div className="mt-3 flex justify-end gap-2">
              {editor.isActive('link') && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => {
                    editor.chain().focus().extendMarkRange('link').unsetLink().run()
                    setLinkOpen(false)
                  }}
                >
                  Remove link
                </Button>
              )}
              <Button type="button" size="sm" disabled={disabled} onClick={applyLink}>
                Apply link
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {[
          {
            label: 'Clear formatting',
            icon: RemoveFormatting,
            available: true,
            run: () => editor.chain().focus().unsetAllMarks().clearNodes().run(),
          },
          {
            label: 'Undo',
            icon: Undo2,
            available: editor.can().undo(),
            run: () => editor.chain().focus().undo().run(),
          },
          {
            label: 'Redo',
            icon: Redo2,
            available: editor.can().redo(),
            run: () => editor.chain().focus().redo().run(),
          },
        ].map(({ label, icon: Icon, available, run }) => (
          <Button
            key={label}
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={label}
            title={label}
            disabled={disabled || !available}
            onMouseDown={(event) => event.preventDefault()}
            onClick={run}
          >
            <Icon />
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} className="min-w-0" />
      <p
        id="content-count"
        className={cn(
          'border-t px-4 py-2 text-right text-xs text-muted-foreground',
          value.length > 100000 && 'text-destructive',
        )}
      >
        {value.length.toLocaleString()} / 100,000 characters including formatting
      </p>
    </div>
  )
}
