import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Memento Mori Timer',
  description: '死の瞑想タイマー - 残された時間を意識して生きる',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}