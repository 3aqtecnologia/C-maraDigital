import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Flag exportada para que o App renderize uma tela de erro amigável
// em vez de um crash silencioso quando as env vars não estão configuradas.
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!supabaseConfigured) {
  console.error(
    '[CâmaraDigital] Variáveis de ambiente do Supabase não configuradas.\n' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas ' +
    'variáveis de ambiente da Vercel (ou no arquivo .env.local para dev).'
  )
}

// Usa placeholders para que createClient não lance exceção na inicialização do módulo.
// Todas as chamadas ao banco falharão com erro de rede, não com crash do app.
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)
