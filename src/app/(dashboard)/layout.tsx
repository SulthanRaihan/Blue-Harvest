'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Sidebar, { MobileBottomNav } from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'
import { ConfirmProvider } from '@/components/ui/ConfirmDialog'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, var(--color-sky-500), var(--color-teal-600))', color: '#fff' }}
          >
            BH
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: 'var(--color-ocean-300)',
                  animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); opacity: 0.4; }
            50% { transform: translateY(-6px); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  if (!user) return null

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="min-h-screen flex" style={{ background: 'var(--color-surface)' }}>
          <Sidebar />
          <main className="flex-1 lg:ml-60 pb-20 lg:pb-0 min-h-screen">
            {children}
          </main>
          <MobileBottomNav />
        </div>
      </ConfirmProvider>
    </ToastProvider>
  )
}
