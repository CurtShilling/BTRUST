import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'B Trust | On-Chain Bonds',
  description: 'The future of fixed income. Issue and trade on-chain bonds on Solana.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-btrust-darker min-h-screen">
        {children}
      </body>
    </html>
  )
}

