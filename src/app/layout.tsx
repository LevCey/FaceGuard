import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@mysten/dapp-kit/dist/index.css'
import { SuiWalletProvider } from '@/lib/sui/wallet-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FaceGuard - Blockchain Face Ownership Protection',
  description: 'Prove and protect your facial identity using Sui blockchain and Walrus decentralized storage. Register your face, get timestamped proof, and prevent unauthorized AI usage.',
  keywords: ['face ownership', 'blockchain', 'sui', 'walrus', 'NFT', 'AI protection', 'deepfake', 'identity'],
  authors: [{ name: 'FaceGuard' }],
  openGraph: {
    title: 'FaceGuard - Protect Your Face in the AI Era',
    description: 'Blockchain-verified proof of facial ownership using Sui and Walrus',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FaceGuard - Face Ownership Protection',
    description: 'Prove your face ownership on blockchain',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SuiWalletProvider>
          {children}
        </SuiWalletProvider>
      </body>
    </html>
  )
}
