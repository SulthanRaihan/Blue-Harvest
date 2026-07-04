'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import type { UserRole } from '@/types/database'

interface AuthState {
  user: User | null
  session: Session | null
  role: UserRole | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const role = session.user.user_metadata?.role as UserRole ?? null
        setState({ user: session.user, session, role, loading: false })
      } else {
        setState(s => ({ ...s, loading: false }))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const role = session?.user.user_metadata?.role as UserRole ?? null
      setState({ user: session?.user ?? null, session, role, loading: false })
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}
