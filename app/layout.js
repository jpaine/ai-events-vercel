import './globals.css'

export const metadata = {
  title: 'AI Events 2026',
  description: 'Upcoming AI events and conferences',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
