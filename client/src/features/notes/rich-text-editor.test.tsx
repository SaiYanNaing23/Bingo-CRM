import { afterEach, describe, expect, it, vi } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { Editor } from '@tiptap/react'
import { noteEditorExtensions } from './editor-extensions'
import { RichTextEditor } from './rich-text-editor'
import { MarkdownPreview } from './markdown-preview'

const editors: Editor[] = []
function open(content: string) {
  const editor = new Editor({
    extensions: noteEditorExtensions(),
    content,
    contentType: 'markdown',
    parseOptions: { preserveWhitespace: 'full' },
    enableInputRules: false,
    enablePasteRules: false,
  })
  editors.push(editor)
  return editor
}
afterEach(() => editors.splice(0).forEach((editor) => editor.destroy()))

describe('Rich text notes', () => {
  it('keeps literal text and indentation as paragraphs when reopening', () => {
    for (const text of [
      '# A literal heading',
      '- A literal dash',
      '1. A literal number',
      '    Indented text',
      '  Surrounding spaces  ',
      '***literal stars***',
    ]) {
      const editor = open('')
      editor.commands.setContent({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
      })
      const reopened = open(editor.getMarkdown())
      expect(reopened.getJSON(), text).toEqual(editor.getJSON())
    }
  })

  it('persists bold and italic formatting and renders it after reopening', () => {
    const editor = open('Review indexes')
    editor.chain().selectAll().toggleBold().toggleItalic().run()
    const saved = editor.getMarkdown()
    const reopened = open(saved)
    expect(reopened.getHTML()).toContain('<strong><em>Review indexes</em></strong>')
    const { container } = render(<MarkdownPreview content={saved} />)
    expect(container.querySelector('strong em, em strong')).toHaveTextContent('Review indexes')
    editor.commands.undo()
    expect(editor.getHTML()).toBe('<p>Review indexes</p>')
    editor.commands.redo()
    expect(editor.getHTML()).toContain('<strong><em>')
  })

  it('retains code indentation, blank lines, tables, checklists and image references during a content edit', () => {
    const editor = open(
      '# Notes\n\n```ts\n  const ready = true\n\n\treturn ready\n```\n\n| Topic | Ready |\n| --- | --- |\n| SQL | Yes |\n\n- [x] Review indexes\n\n![Diagram](https://example.com/image.png)',
    )
    editor.commands.insertContentAt(2, 'Updated ')
    const saved = editor.getMarkdown()
    expect(saved).toContain('  const ready = true\n\n\treturn ready')
    expect(saved).toContain('- [x] Review indexes')
    expect(saved).toContain('![Diagram](https://example.com/image.png)')
    const reopened = open(saved)
    expect(reopened.getHTML()).toContain('<table')
    expect(reopened.getHTML()).toContain('SQL')
    expect(reopened.view.dom.querySelector('img[src]')).toBeNull()
    expect(reopened.view.dom.querySelector('pre code')?.textContent).toBe(
      '  const ready = true\n\n\treturn ready',
    )
  })

  it('does not activate stored HTML, unsafe links or remote images in the editor', () => {
    const editor = open(
      '<script>window.evil = true</script>\n\n<img src="https://example.com/tracker" onerror="alert(1)">\n\n[Bad](javascript:alert%281%29) [Relative](/logout) [Data](data:text/html,bad) [Good](https://example.com)\n\n![Image](https://example.com/image.png)',
    )
    expect(editor.view.dom.querySelector('script, img[src], iframe, [onerror]')).toBeNull()
    expect(
      [...editor.view.dom.querySelectorAll('a[href]')].map((link) => link.getAttribute('href')),
    ).toEqual(['https://example.com', 'https://example.com/image.png'])
    expect(editor.commands.setLink({ href: 'javascript:alert(1)' })).toBe(false)
  })

  it('keeps an untouched draft unchanged when mounted, disabled for saving, and enabled after a failed save', async () => {
    const onChange = vi.fn()
    const props = {
      value: '  # Exact\n\n```ts\n  const x = 1\n```\n',
      onChange,
      onBlur: vi.fn(),
      invalid: false,
    }
    const { rerender } = render(
      <StrictMode>
        <RichTextEditor {...props} disabled={false} />
      </StrictMode>,
    )
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Content' })).toHaveAttribute(
        'contenteditable',
        'true',
      ),
    )
    rerender(
      <StrictMode>
        <RichTextEditor {...props} disabled />
      </StrictMode>,
    )
    expect(screen.getByRole('textbox', { name: 'Content' })).toHaveAttribute(
      'contenteditable',
      'false',
    )
    rerender(
      <StrictMode>
        <RichTextEditor {...props} disabled={false} />
      </StrictMode>,
    )
    expect(screen.getByRole('textbox', { name: 'Content' })).toHaveAttribute(
      'contenteditable',
      'true',
    )
    expect(screen.getByRole('textbox', { name: 'Content' })).toHaveTextContent('const x = 1')
    expect(onChange).not.toHaveBeenCalled()
  })
})
