import DOMPurify from 'dompurify'
import { marked } from 'marked'
export const renderMarkdown = (markdown: string): string =>
  DOMPurify.sanitize(marked.parse(markdown) as string)
