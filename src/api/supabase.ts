import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '⚠️ Supabase no configurado. Creá un proyecto en https://supabase.com y agregá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env',
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
