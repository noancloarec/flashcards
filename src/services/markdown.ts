import { marked } from 'marked'
import DOMPurify from 'dompurify'
export const renderMarkdown = (markdown: string): string =>
  DOMPurify.sanitize(marked.parse(markdown) as string)
