import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - CleanStay',
  description: 'CleanStay admin dashboard for managing cleaning operations.',
  robots: 'noindex, nofollow'
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-layout">
      {children}
    </div>
  )
}

