import { createClient } from '@supabase/supabase-js'

// Acessando as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltam as chaves do Supabase no arquivo .env')
}

export const supabase = createClient(supabaseUrl, supabaseKey)