import type { Metadata } from 'next'
import { ToastProvider } from '@/components/ui/Toast'
import AdminLayoutClient from './_components/AdminLayoutClient'

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
    <ToastProvider>
      <AdminLayoutClient>
        {children}
      </AdminLayoutClient>
    </ToastProvider>
  )
}

