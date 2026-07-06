'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  IconDashboard, IconPlanning, IconOperational, IconSampling,
  IconHarvest, IconDistribution, IconReport, IconUsers, IconLogOut,
} from '@/components/ui/Icon'

gsap.registerPlugin(useGSAP)

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',       Icon: IconDashboard,    roles: ['petambak', 'admin', 'owner'] },
  { href: '/perencanaan',  label: 'Perencanaan',     Icon: IconPlanning,     roles: ['petambak', 'admin', 'owner'] },
  { href: '/operasional',  label: 'Operasional',     Icon: IconOperational,  roles: ['petambak', 'admin'] },
  { href: '/sampling',     label: 'Sampling',        Icon: IconSampling,     roles: ['petambak', 'admin'] },
  { href: '/panen',        label: 'Panen & Distribusi', Icon: IconHarvest,      roles: ['petambak', 'admin'] },
  { href: '/laporan',      label: 'Laporan',            Icon: IconReport,       roles: ['admin', 'owner'] },
  { href: '/pengguna',     label: 'Pengguna',        Icon: IconUsers,        roles: ['admin'] },
]

const ROLE_LABEL: Record<string, string> = {
  petambak: 'Petambak',
  admin: 'Admin',
  owner: 'Owner',
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, role } = useAuth()
  const sidebarRef = useRef<HTMLElement>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useGSAP(() => {
    gsap.from('.nav-item', {
      x: -16,
      autoAlpha: 0,
      duration: 0.4,
      stagger: 0.06,
      ease: 'power2.out',
      delay: 0.1,
    })
  }, { scope: sidebarRef })

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const visibleNav = NAV_ITEMS.filter(item =>
    !role || item.roles.includes(role)
  )

  const userName = user?.user_metadata?.nama
    ?? user?.email?.split('@')[0]
    ?? 'Pengguna'

  return (
    <aside
      ref={sidebarRef}
      className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 z-30"
      style={{
        background: 'linear-gradient(180deg, var(--color-ocean-950) 0%, var(--color-ocean-900) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, var(--color-sky-500), var(--color-teal-600))',
              boxShadow: '0 0 16px rgba(14,165,233,0.35)',
              color: '#fff',
            }}
          >
            BH
          </div>
          <div>
            <div className="font-bold text-sm leading-tight" style={{ color: '#fff' }}>Blue Harvest</div>
            <div className="text-xs" style={{ color: 'var(--color-ocean-300)' }}>Manajemen Tambak</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
        {visibleNav.map(({ href, label, Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group"
              style={{
                color: isActive ? '#fff' : 'var(--color-ocean-200)',
                background: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{ background: 'var(--color-sky-400)' }}
                />
              )}
              <Icon size={17} strokeWidth={isActive ? 2 : 1.75} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: 'var(--color-ocean-700)', color: 'var(--color-sky-300)' }}
          >
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: '#fff' }}>{userName}</div>
            <div
              className="text-xs font-medium px-1.5 py-0.5 rounded-full inline-block mt-0.5"
              style={{ background: 'rgba(14,165,233,0.15)', color: 'var(--color-sky-400)' }}
            >
              {ROLE_LABEL[role ?? 'petambak']}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50"
          style={{ color: 'var(--color-ocean-300)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <IconLogOut size={17} />
          <span>{loggingOut ? 'Keluar...' : 'Keluar'}</span>
        </button>
      </div>
    </aside>
  )
}

// ── Mobile Bottom Nav ─────────────────────────────────────────
const MOBILE_NAV = [
  { href: '/dashboard',   label: 'Beranda',   Icon: IconDashboard },
  { href: '/operasional', label: 'Harian',    Icon: IconOperational },
  { href: '/sampling',    label: 'Sampling',  Icon: IconSampling },
  { href: '/panen',       label: 'Panen',     Icon: IconHarvest },
  { href: '/laporan',     label: 'Laporan',   Icon: IconReport },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex"
      style={{
        background: 'var(--color-ocean-950)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {MOBILE_NAV.map(({ href, label, Icon }) => {
        const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors"
            style={{ color: isActive ? 'var(--color-sky-400)' : 'var(--color-ocean-400)' }}
          >
            <Icon size={20} strokeWidth={isActive ? 2 : 1.75} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
