import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Client Portal - CleanStay',
  description: 'CleanStay client portal for viewing cleaning services.',
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="client-layout">
      {children}
    </div>
  )
}

