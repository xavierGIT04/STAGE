import type { Metadata } from 'next'
import './globals.css'


import { Inter } from 'next/font/google'

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700']
})

export const metadata: Metadata = {
    title: 'KYA Business Model',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr">
            <body className={inter.className} suppressHydrationWarning>
                {children}
            </body>
        </html>
    )
}