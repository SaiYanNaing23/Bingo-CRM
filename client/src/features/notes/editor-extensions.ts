import { Node, type MarkdownToken } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'
import Link from '@tiptap/extension-link'
import Paragraph from '@tiptap/extension-paragraph'
import HardBreak from '@tiptap/extension-hard-break'
import { noteUrl } from './note-url'

function paragraphTokens(tokens: MarkdownToken[]): MarkdownToken[] {
  return tokens.map((token) => ({
    ...token,
    ...(token.type === 'text'
      ? { text: token.text?.replaceAll('&#32;', ' ').replaceAll('&#9;', '\t') }
      : {}),
    ...(token.tokens ? { tokens: paragraphTokens(token.tokens) } : {}),
  }))
}

const TextParagraph = Paragraph.extend({
  parseMarkdown(token, helpers) {
    // Image references are inline in this editor, including image-only paragraphs.
    if (token.tokens?.length === 1 && token.tokens[0].type === 'image')
      return helpers.createNode('paragraph', undefined, helpers.parseInline(token.tokens))
    return Paragraph.config.parseMarkdown!.call(
      this,
      { ...token, tokens: paragraphTokens(token.tokens ?? []) },
      helpers,
    )
  },
  renderMarkdown(node, helpers, context) {
    // Typed text must remain literal when the storage format is parsed again.
    // Encode indentation and trailing spaces, and escape block syntax in prose.
    return Paragraph.config
      .renderMarkdown!.call(this, node, helpers, context)
      .replace(/^[ \t]+|[ \t]+$/gm, (space) =>
        space.replaceAll(' ', '&#32;').replaceAll('\t', '&#9;'),
      )
      .replace(/^(#{1,6}|[+-])(?= |$)/gm, '\\$1')
      .replace(/^(\d+)([.)])(?= )/gm, '$1\\$2')
      .replace(/^(=+)(?=\n|$)/gm, '\\$1')
      .replace(/^(-{3,})(?=\n|$)/gm, '\\$1')
  },
})
const TextLineBreak = HardBreak.extend({ renderMarkdown: () => '\\\n' })

const SafeLink = Link.extend({
  parseMarkdown(token, helpers) {
    const content = helpers.parseInline(token.tokens ?? [])
    return noteUrl(token.href ?? '')
      ? helpers.applyMark('link', content, { href: token.href, title: token.title || null })
      : content
  },
  renderHTML({ HTMLAttributes }) {
    const href = noteUrl(HTMLAttributes.href ?? '')
    return href
      ? [
          'a',
          { href, title: HTMLAttributes.title, target: '_blank', rel: 'noopener noreferrer' },
          0,
        ]
      : ['span', {}, 0]
  },
}).configure({
  openOnClick: false,
  defaultProtocol: 'https',
  isAllowedUri: (url) => !!noteUrl(url),
})

// Keep existing image references when editing, without fetching remote images.
const ImageReference = Node.create({
  name: 'imageReference',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes: () => ({
    source: { default: '' },
    label: { default: 'Image' },
    raw: { default: '' },
  }),
  parseHTML: () => [],
  renderHTML({ node }) {
    const href = noteUrl(node.attrs.source)
    return href
      ? [
          'a',
          { href, target: '_blank', rel: 'noopener noreferrer' },
          `${node.attrs.label} (open image)`,
        ]
      : ['span', {}, node.attrs.label]
  },
  renderText: ({ node }) => node.attrs.label,
  markdownTokenName: 'image',
  parseMarkdown: (token, helpers) =>
    helpers.createNode('imageReference', {
      source: token.href ?? '',
      label: token.text || 'Image',
      raw: token.raw ?? '',
    }),
  renderMarkdown: (node) => node.attrs?.raw ?? '',
})

export function noteEditorExtensions() {
  return [
    StarterKit.configure({
      // Only offer formatting that the existing Notes renderer can also display.
      underline: false,
      trailingNode: false,
      codeBlock: { enableTabIndentation: true },
      link: false,
      paragraph: false,
      hardBreak: false,
    }),
    TextParagraph,
    TextLineBreak,
    SafeLink,
    TaskList,
    TaskItem.configure({ nested: true }),
    TableKit,
    ImageReference,
    Markdown.configure({ markedOptions: { gfm: true, breaks: true } }),
  ]
}
