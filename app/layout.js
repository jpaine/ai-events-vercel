import './globals.css'

export const metadata = {
  title: 'AI Events 2026 — AI, ML & Robotics Conferences',
  description: '95 curated AI, ML, Deep Learning, NLP, Computer Vision, and Robotics conferences for 2026. Academic research and industry events with daily updates and calendar subscription.',
  metadataBase: new URL('https://ai-events-vercel.vercel.app'),
  openGraph: {
    title: 'AI Events 2026 — AI, ML & Robotics Conferences',
    description: '95 curated events across academic research and industry practice. Updated daily.',
    url: 'https://ai-events-vercel.vercel.app',
    siteName: 'AI Events 2026',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Events 2026 — AI, ML & Robotics Conferences',
    description: '95 curated events across academic research and industry practice. Updated daily.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
