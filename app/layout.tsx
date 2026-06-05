import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Timekeep',
  description: 'Workforce scheduling and time tracking',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Timekeep',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',   // expose safe-area-inset-* on iOS
  themeColor: '#faf9f7',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
