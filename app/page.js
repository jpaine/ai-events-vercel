import { readFileSync } from 'fs'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import './markdown.css'

async function getMarkdownContent() {
  try {
    const content = readFileSync(
      process.cwd() + '/public/ai-events-2026.md',
      'utf-8'
    )
    return content
  } catch (error) {
    console.error('Error reading markdown file:', error)
    return '# Error loading content\n\nCould not load the ai-events-2026.md file.'
  }
}

export default async function Home() {
  const markdown = await getMarkdownContent()
  const htmlContent = await marked(markdown)
  const sanitizedHtml = DOMPurify.sanitize(htmlContent)

  return (
    <main className="markdown-container">
      <article className="markdown-content" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
    </main>
  )
}
