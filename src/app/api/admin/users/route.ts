import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

// Server-only — menggunakan service role key (tidak pernah ke client)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, nama, role } = await req.json()

    if (!email || !password || !nama || !role) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    const admin = getAdminClient()

    // Buat user di Supabase Auth
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // langsung confirmed, tanpa verifikasi email
      user_metadata: { nama, role },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Upsert ke tabel pengguna (trigger handle_new_user sudah handle ini,
    // tapi kita upsert ulang untuk pastikan nama & role tersimpan)
    await (admin as any).from('pengguna').upsert({
      id_pengguna: data.user.id,
      nama,
      email,
      role,
    }, { onConflict: 'id_pengguna' })

    return NextResponse.json({ success: true, id: data.user.id })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
