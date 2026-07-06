'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import type { UserRole } from '@/types/database'

interface AuthState {
  user: User | null
  session: Session | null
  role: UserRole | null
  nama: string | null
  loading: boolean
}

/**
 * Sumber kebenaran role ada di tabel `pengguna`, BUKAN di user_metadata.
 * User yang dibuat lewat Supabase Dashboard tidak punya metadata role,
 * jadi role harus diambil dari DB agar RLS & tampilan per-role akurat.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    nama: null,
    loading: true,
  })

  useEffect(() => {
    let active = true

    async function loadProfile(session: Session | null) {
      if (!session) {
        if (active) setState({ user: null, session: null, role: null, nama: null, loading: false })
        return
      }

      const { data } = await supabase
        .from('pengguna')
        .select('role, nama')
        .eq('id_pengguna', session.user.id)
        .single()

      if (!active) return

      const profile = data as { role: UserRole; nama: string } | null
      const metaRole = session.user.user_metadata?.role as UserRole | undefined
      const metaNama = session.user.user_metadata?.nama as string | undefined

      setState({
        user: session.user,
        session,
        role: profile?.role ?? metaRole ?? null,
        nama: profile?.nama ?? metaNama ?? session.user.email?.split('@')[0] ?? null,
        loading: false,
      })
    }

    supabase.auth.getSession().then(({ data: { session } }) => loadProfile(session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return state
}
