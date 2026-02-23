import { supabase } from '@/lib/supabase'
import type { Database, DocumentoTipo } from '@/types/database'
import { useCallback, useState } from 'react'
import { useAuth } from './useAuth'

type Documento = Database['public']['Tables']['documentos']['Row']

export type { Documento, DocumentoTipo }

export function useDocumentos() {
  const { profile } = useAuth()
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDocumentos = useCallback(async (search = '', tipo = '') => {
    if (!profile?.tenant_id) return
    setLoading(true)

    let query = supabase
      .from('documentos')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.ilike('nome', `%${search}%`)
    }
    if (tipo) {
      query = query.eq('tipo', tipo as DocumentoTipo)
    }

    const { data, error } = await query
    if (!error && data) setDocumentos(data as Documento[])
    setLoading(false)
  }, [profile?.tenant_id])

  async function uploadDocumento(
    file: File,
    payload: { nome: string; tipo: DocumentoTipo; descricao?: string }
  ): Promise<{ error: string | null }> {
    if (!profile?.tenant_id) return { error: 'Sem permissão' }

    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${profile.tenant_id}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(path, file)

    if (uploadError) return { error: uploadError.message }

    const { error: dbError } = await supabase.from('documentos').insert({
      tenant_id: profile.tenant_id,
      nome: payload.nome,
      tipo: payload.tipo,
      descricao: payload.descricao ?? null,
      arquivo_path: path,
      arquivo_nome: file.name,
      arquivo_tamanho: file.size,
      arquivo_mime: file.type,
      enviado_por: profile.user_id,
    })

    if (dbError) {
      await supabase.storage.from('documentos').remove([path])
      return { error: dbError.message }
    }

    return { error: null }
  }

  async function downloadDocumento(doc: Documento) {
    const { data, error } = await supabase.storage
      .from('documentos')
      .createSignedUrl(doc.arquivo_path, 120)

    if (error || !data) return

    const link = document.createElement('a')
    link.href = data.signedUrl
    link.download = doc.arquivo_nome || 'documento'
    link.target = '_blank'
    link.click()
  }

  async function deletarDocumento(doc: Documento): Promise<boolean> {
    if (!profile?.tenant_id) return false

    const { error: dbError } = await supabase
      .from('documentos')
      .delete()
      .eq('id', doc.id)
      .eq('tenant_id', profile.tenant_id)

    if (dbError) return false

    await supabase.storage.from('documentos').remove([doc.arquivo_path])
    return true
  }

  return { documentos, loading, fetchDocumentos, uploadDocumento, downloadDocumento, deletarDocumento }
}
