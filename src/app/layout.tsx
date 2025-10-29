import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CleanStay - Profesionální úklid',
  description: 'Profesionální úklid domácností, kanceláří a Airbnb v Praze. Férové ceny, spolehlivost a rychlost.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body>
        {children}
      </body>
    </html>
  )
}

