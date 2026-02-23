import { supabase } from '@/lib/supabase'
import { maskCPF } from '@/lib/utils'
import type { Database } from '@/types/database'
import { CheckCircle2, FileText, Globe, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

type DocumentoAssinado = Database['public']['Tables']['documentos']['Row'] & {
  tenants: { nome: string; municipio: string; uf: string } | null
}

export function Verificador() {
  const { hash } = useParams()
  const [loading, setLoading] = useState(true)
  const [documento, setDocumento] = useState<DocumentoAssinado | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function verificar() {
      if (!hash) return
      setLoading(true)

      const { data, error: dbError } = await supabase
        .from('documentos')
        .select('*, tenants(nome, municipio, uf)')
        .eq('arquivo_hash', hash)
        .eq('assinado', true)
        .maybeSingle()

      if (dbError) {
        setError('Erro ao consultar base de dados')
      } else if (!data) {
        setError('Documento não encontrado ou assinatura inválida')
      } else {
        setDocumento(data as unknown as DocumentoAssinado)
      }
      setLoading(false)
    }

    verificar()
  }, [hash])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-blue-600 px-8 py-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck size={120} />
          </div>
          <h1 className="text-2xl font-bold relative z-10">Verificador de Autenticidade</h1>
          <p className="text-blue-100 mt-2 relative z-10">CâmaraDigital — Infraestrutura de Chaves Públicas</p>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
              <p className="text-gray-500 animate-pulse font-medium">Validando assinatura digital...</p>
            </div>
          ) : error || !documento ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <XCircle size={40} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Autenticidade Não Confirmada</h2>
              <p className="text-gray-500 max-w-md">{error}</p>
              <div className="mt-8 p-4 bg-gray-50 rounded-xl w-full text-xs font-mono text-gray-400 break-all border border-dashed">
                HASH: {hash}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sucesso */}
              <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-2xl">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h2 className="text-green-800 font-bold">Documento Autêntico</h2>
                  <p className="text-green-700 text-sm">Assinatura digital validada via Gov.br (ICP-Brasil)</p>
                </div>
              </div>

              {/* Detalhes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Documento</p>
                  <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <FileText size={16} className="text-blue-500" />
                    {documento.nome}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Origem</p>
                  <p className="text-gray-900 font-medium">
                    {documento.tenants?.nome} — {documento.tenants?.municipio}/{documento.tenants?.uf}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Assinado por</p>
                  <p className="text-gray-900 font-bold underline decoration-blue-200 decoration-2 underline-offset-4">
                    {(documento.assinatura_metadata as any)?.assinante_nome ?? 'Usuário Identificado'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">CPF do Assinante</p>
                  <p className="text-gray-900 font-medium">
                    {maskCPF((documento.assinatura_metadata as any)?.assinante_cpf)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Data da Assinatura</p>
                  <p className="text-gray-900 font-medium">
                    {new Date((documento.assinatura_metadata as any)?.data_assinatura).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">IP de Conexão</p>
                  <div className="flex items-center gap-1.5 text-gray-600 font-mono text-xs">
                    <Globe size={12} className="text-gray-400" />
                    {(documento.assinatura_metadata as any)?.conexao_ip ?? '—'}
                  </div>
                </div>
                <div className="space-y-1 col-span-1 md:col-span-2">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Classificação Legal (Lei 14.063/2020)</p>
                  <p className="text-blue-700 font-bold uppercase text-sm">
                    {(documento.assinatura_metadata as any)?.tipo}
                  </p>
                </div>
              </div>

              {/* Hash */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Rastro Digital (SHA-256)</p>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold border border-blue-100">
                    CONFORME LEI 14.063/2020
                  </span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl font-mono text-sm text-gray-600 break-all border border-gray-100">
                  {documento.arquivo_hash}
                </div>
              </div>

              {/* Compliance Info */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-600" />
                  Conformidade Legal
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Este documento atende aos requisitos da <strong>Lei nº 14.063, de 23 de setembro de 2020</strong>,
                  que dispõe sobre o uso de assinaturas eletrônicas em interações com entes públicos.
                  A assinatura detectada é classificada como:
                </p>
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs ring-4 ring-blue-50">
                    {String((documento.assinatura_metadata as any)?.tipo || '').includes('Qualificada') ? 'Q' : 'A'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{(documento.assinatura_metadata as any)?.tipo}</p>
                    <p className="text-[10px] text-gray-400">Validade Jurídica Plena e Integridade Garantida</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 text-center">
                <p className="text-[10px] text-gray-400 italic max-w-sm mx-auto">
                  Este documento possui fé pública e validade jurídica em todo o território nacional conforme
                  MP 2.200-2/2001 e Lei 14.063/2020.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-gray-400 text-sm">
        © 2026 3AQ Tecnologia — Soluções para Governos Digitais
      </p>
    </div>
  )
}
