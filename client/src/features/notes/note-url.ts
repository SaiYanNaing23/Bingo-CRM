export function noteUrl(url: string) {
  if (/^#[\w-]+$/.test(url)) return url
  try {
    const parsed = new URL(url)
    if (['https:', 'http:', 'mailto:'].includes(parsed.protocol)) return url
  } catch {
    // Relative or malformed destinations are shown as text.
  }
  return ''
}
