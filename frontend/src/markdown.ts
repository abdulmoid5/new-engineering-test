import { marked } from 'marked'
import DOMPurify from 'dompurify'

/**
 * Markdown-relevant tags only. Excludes div so embedded HTML cannot break
 * outer layout (e.g. message wrapper div).
 */
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'ul', 'ol', 'li', 'code', 'pre', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'a', 'hr',
]

const ALLOWED_ATTR = ['href', 'target', 'rel']

marked.setOptions({
  gfm: true,
  breaks: true,
})

/**
 * Converts Markdown to safe HTML for display. Use for AI (or user) message bodies.
 * - Renders bold, lists, code, paragraphs, links, etc.
 * - Sanitizes with DOMPurify to prevent XSS (no script, no div, allowlist only).
 */
export function renderMarkdownSafe(text: string): string {
  if (!text.trim()) return ''
  const rawHtml = marked.parse(text, { async: false }) as string
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })
}
