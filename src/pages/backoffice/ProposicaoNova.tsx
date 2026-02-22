import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Send, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useProposicoes } from '@/hooks/useProposicoes'
import type { ProposicaoTipo } from '@/types/database'

const TIPOS: { value: ProposicaoTipo; label: string; desc: string }[] = [
  { value: 'projeto_lei',             label: 'Projeto de Lei (PL)',           desc: 'Proposta de criação, alteração ou revogação de lei municipal' },
  { value: 'projeto_lei_complementar',label: 'Proj. Lei Complementar (PLC)', desc: 'Complementa a Lei Orgânica ou outras leis fundamentais' },
  { value: 'projeto_resolucao',       label: 'Projeto de Resolução (PR)',     desc: 'Disciplina assuntos internos da Câmara' },
  { value: 'requerimento',            label: 'Requerimento (REQ)',            desc: 'Solicita informações, providências ou manifestações' },
  { value: 'indicacao',               label: 'Indicação (IND)',               desc: 'Sugere ao Executivo adoção de providências' },
  { value: 'moca_aplausos',           label: 'Moção de Aplausos (MOC)',       desc: 'Homenagem ou reconhecimento público' },
  { value: 'voto_pesar',              label: 'Voto de Pesar (VP)',            desc: 'Manifestação de condolências' },
]

export function ProposicaoNova() {
  const navigate = useNavigate()
  const { criar, protocolar } = useProposicoes()

  const [tipo, setTipo] = useState<ProposicaoTipo>('projeto_lei')
  const [ementa, setEmenta] = useState('')
  const [texto, setTexto] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function salvar(protocolarImediatamente = false) {
    if (!ementa.trim()) { setError('A ementa é obrigatória.'); return }
    setSaving(true)
    setError(null)

    const resultado = await criar({ tipo, ementa: ementa.trim(), texto_integral: texto || undefined })

    if (!resultado) {
      setError('Erro ao salvar proposição. Verifique sua conexão.')
      setSaving(false)
      return
    }

    if (protocolarImediatamente) {
      await protocolar(resultado.id)
    }

    navigate(`/backoffice/legislativo/${resultado.id}`)
  }

  const tipoSelecionado = TIPOS.find(t => t.value === tipo)

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Nova Proposição"
        description="Preencha os dados e salve como rascunho ou protocole imediatamente"
        actions={
          <button
            onClick={() => navigate('/backoffice/legislativo')}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={15} />
            Voltar
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl space-y-6">

          {/* Tipo */}
          <section className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Tipo de Proposição</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TIPOS.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    tipo === t.value
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-400'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <p className={`font-semibold text-sm ${tipo === t.value ? 'text-primary-700' : 'text-gray-800'}`}>
                    {t.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{t.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Ementa */}
          <section className="card space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ementa <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                className="input resize-none"
                placeholder={`Ex: Dispõe sobre... e dá outras providências.`}
                value={ementa}
                onChange={e => setEmenta(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{ementa.length}/500</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Texto Integral
                <span className="text-gray-400 font-normal ml-1">(opcional)</span>
              </label>
              <textarea
                rows={12}
                className="input resize-y font-mono text-xs leading-relaxed"
                placeholder={`CÂMARA MUNICIPAL DE ___________\n\n${tipoSelecionado?.label?.toUpperCase() ?? 'PROJETO'} Nº ___/2025\n\nAutor: ___________\n\nDispõe sobre...\n\nA Câmara Municipal de ___________,\n\nAprova:\n\nArt. 1º ...\n\nArt. 2º Esta lei entra em vigor na data de sua publicação.\n\n_______________, ___ de _______ de 2025.\n\n___________________________`}
                value={texto}
                onChange={e => setTexto(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">
                Utilize formatação simples. Suporte a editor rico será adicionado em breve.
              </p>
            </div>
          </section>

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => salvar(false)}
              className="btn-secondary flex items-center gap-2 text-sm justify-center"
            >
              <Save size={15} />
              Salvar como Rascunho
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => salvar(true)}
              className="btn-primary flex items-center gap-2 text-sm justify-center"
            >
              {saving ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : <Send size={15} />}
              Protocolar
            </button>
          </div>

          <p className="text-xs text-gray-400">
            <strong>Rascunho:</strong> salvo sem número. <strong>Protocolar:</strong> recebe número oficial e inicia tramitação.
          </p>
        </div>
      </div>
    </div>
  )
}
