import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { useLeiDetalhe, useLeis } from '@/hooks/useLeis'
import type { LeiStatus } from '@/types/database'
import { ArrowLeft, BookOpen, FileText, Globe, Settings } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const STATUS_CONFIG: Record<LeiStatus, { label: string; color: string; bg: string }> = {
  em_vigor: { label: 'Em Vigor', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  revogada_parcialmente: { label: 'Revogada Parcialmente', color: 'text-amber-700', bg: 'bg-amber-100' },
  revogada_totalmente: { label: 'Revogada Totalmente', color: 'text-red-700', bg: 'bg-red-100' },
}

export function LeiDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { lei, loading, fetch } = useLeiDetalhe(id!)
  const { atualizarLei } = useLeis()

  const [saving, setSaving] = useState(false)

  const isAdmin = profile?.role === 'admin' || profile?.role === 'servidor'

  async function handleMudarStatus(novoStatus: LeiStatus) {
    if (!lei) return
    setSaving(true)
    const ok = await atualizarLei(lei.id, { status: novoStatus })
    if (ok) {
      await fetch()
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-400">Carregando Lei...</p>
        </div>
      </div>
    )
  }

  if (!lei) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>Lei não encontrada ou removida</p>
          <button onClick={() => navigate('/backoffice/leis')} className="btn-primary mt-4 text-sm">
            Voltar ao acervo
          </button>
        </div>
      </div>
    )
  }

  const stCfg = STATUS_CONFIG[lei.status]

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <PageHeader
        title={`${lei.esfera} Nº ${lei.numero}/${lei.ano}`}
        description={lei.ementa}
        actions={
          <button
            onClick={() => navigate('/backoffice/leis')}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={15} />
            Voltar
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

            <div className="xl:col-span-3 space-y-4">
              {/* Documento Compilado */}
              <div className="bg-white rounded-lg shadow-md border-t-4 border-l border-r border-b border-gray-200 border-t-primary-600 p-8 sm:p-12 relative">
                <div className="absolute top-0 right-0 p-4">
                  <span className={`badge uppercase tracking-wider text-[10px] font-bold ${stCfg.bg} ${stCfg.color}`}>
                    {stCfg.label.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-center mb-10 pb-6 border-b border-gray-100">
                  <h1 className="text-2xl font-serif text-gray-900 mb-2">{lei.esfera} Nº {lei.numero}, DE {new Date(lei.data_publicacao).getFullYear()}</h1>
                  <p className="text-sm text-gray-500 font-medium">Publicada em {new Date(lei.data_publicacao).toLocaleDateString('pt-BR')}</p>

                  <div className="mt-8 flex justify-end">
                    <p className="w-1/2 text-right text-sm italic font-serif text-gray-600 leading-relaxed bg-gray-50 p-4 rounded border-l-2 border-primary-500">
                      {lei.ementa}
                    </p>
                  </div>
                </div>

                <div
                  className="prose prose-sm sm:prose-base max-w-none text-gray-800 font-serif pb-12"
                  dangerouslySetInnerHTML={{ __html: lei.texto_compilado }}
                />
              </div>
            </div>

            <div className="xl:col-span-1 space-y-4">

              {/* Metadata Box */}
              <div className="card space-y-3 bg-white">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
                  <Settings size={14} className="text-gray-400" /> Detalhes Legais
                </h3>

                <div className="text-xs text-gray-600 space-y-2">
                  <div>
                    <strong className="block text-gray-400">Esfera</strong>
                    <span>{lei.esfera}</span>
                  </div>
                  <div>
                    <strong className="block text-gray-400">Inserção no sistema</strong>
                    <span>{new Date(lei.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  {lei.updated_at !== lei.created_at && (
                    <div>
                      <strong className="block text-gray-400">Última edição</strong>
                      <span>{new Date(lei.updated_at).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="pt-4 border-t border-gray-100 mt-2">
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Alterar Status</label>
                    <select
                      className="input text-xs w-full py-1.5 bg-gray-50"
                      value={lei.status}
                      disabled={saving}
                      onChange={e => handleMudarStatus(e.target.value as LeiStatus)}
                    >
                      <option value="em_vigor">Em Vigor</option>
                      <option value="revogada_parcialmente">Revogada Parcialmente</option>
                      <option value="revogada_totalmente">Revogada Totalmente</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Ações Visão Público */}
              <div className="card space-y-3 bg-white">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
                  <Globe size={14} className="text-gray-400" /> Abertura Pública
                </h3>

                <button
                  onClick={() => window.open(`/transparencia/lei/${lei.id}`, '_blank')}
                  className="btn-secondary w-full text-xs justify-center flex items-center gap-2 py-2"
                >
                  <FileText size={14} /> Link do Cidadão
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
