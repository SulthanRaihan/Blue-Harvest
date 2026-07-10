import { supabase } from '@/lib/supabase'

const BUCKET = 'dokumentasi'

// Upload foto dokumentasi (persiapan tambak, panen, dll) ke bucket
// public 'dokumentasi', return public URL-nya buat disimpan di kolom foto_url.
export async function uploadFoto(path: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const fullPath = `${path}-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(fullPath, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fullPath)
  return data.publicUrl
}
