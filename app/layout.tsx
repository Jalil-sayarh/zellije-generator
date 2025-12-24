import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zellije Generator | Digital Islamic Geometry',
  description: 'Create mathematically accurate Islamic star patterns using the Polygons-in-Contact method',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

