import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Untyped client — type safety enforced at the repository layer via
// explicit function signatures and return type annotations.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
