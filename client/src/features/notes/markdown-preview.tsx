import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function previewUrl(url: string) {
  if (/^#[\w-]+$/.test(url)) return url
  try {
    const parsed = new URL(url)
    if (['https:', 'http:', 'mailto:'].includes(parsed.protocol)) return url
  } catch {
    /* Relative or malformed destinations are shown as text. */
  }
  return ''
}
export function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="markdown-content min-w-0 break-words" aria-label="Markdown preview">
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={previewUrl}
        components={{
          a: ({ href, children }) =>
            href ? (
              <a
                href={href}
                target={href.startsWith('#') ? undefined : '_blank'}
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
          img: ({ src, alt }) =>
            typeof src === 'string' && /^https?:\/\//i.test(src) ? (
              <a href={src} target="_blank" rel="noopener noreferrer">
                {alt || 'Image'} (open image)
              </a>
            ) : (
              <span>{alt || 'Image unavailable'}</span>
            ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
          input: ({ checked }) => (
            <input
              type="checkbox"
              checked={!!checked}
              disabled
              readOnly
              aria-label={checked ? 'Completed item' : 'Incomplete item'}
            />
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}
