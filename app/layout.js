import './globals.css'

export const metadata = {
  title: 'PDF Editor',
  description: 'Advanced PDF editing tool with merge, split, and manipulation features',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
