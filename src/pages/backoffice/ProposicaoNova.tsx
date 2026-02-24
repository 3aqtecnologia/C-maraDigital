import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { useProposicoes } from '@/hooks/useProposicoes'
import { PageHeader } from '@/components/layout/PageHeader'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { AlertCircle, ArrowLeft, Save, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Templates para os tipos legislativos padrão
const TEMPLATES: Record<string, string> = {
  projeto_lei: `<h3 style="text-align: center">CÂMARA MUNICIPAL</h3><p style="text-align: center"><strong>PROJETO DE LEI Nº ___/2025</strong></p><p><strong>Autor:</strong> ___________________</p><p><em>Dispõe sobre... e dá outras providências.</em></p><p>A Câmara Municipal aprova:</p><p><strong>Art. 1º</strong> ...</p><p><strong>Art. 2º</strong> Esta lei entra em vigor na data de sua publicação.</p><p style="text-align: right">Sala das Sessões, ___ de _______ de 2025.</p><p style="text-align: center">___________________________<br>Assinatura do Autor</p>`,
  projeto_lei_complementar: `<h3 style="text-align: center">CÂMARA MUNICIPAL</h3><p style="text-align: center"><strong>PROJETO DE LEI COMPLEMENTAR Nº ___/2025</strong></p><p><strong>Autor:</strong> ___________________</p><p><em>Dispõe sobre... e dá outras providências.</em></p><p>A Câmara Municipal aprova:</p><p><strong>Art. 1º</strong> ...</p><p><strong>Art. 2º</strong> Esta lei complementar entra em vigor na data de sua publicação.</p><p style="text-align: right">Sala das Sessões, ___ de _______ de 2025.</p><p style="text-align: center">___________________________<br>Assinatura do Autor</p>`,
  projeto_resolucao: `<h3 style="text-align: center">CÂMARA MUNICIPAL</h3><p style="text-align: center"><strong>PROJETO DE RESOLUÇÃO Nº ___/2025</strong></p><p><strong>Autor:</strong> ___________________</p><p><em>Dispõe sobre...</em></p><p>A Câmara Municipal resolve:</p><p><strong>Art. 1º</strong> ...</p><p><strong>Art. 2º</strong> Esta resolução entra em vigor na data de sua publicação.</p><p style="text-align: right">Sala das Sessões, ___ de _______ de 2025.</p><p style="text-align: center">___________________________<br>Assinatura do Autor</p>`,
  requerimento: `<h3 style="text-align: center">CÂMARA MUNICIPAL</h3><p style="text-align: center"><strong>REQUERIMENTO Nº ___/2025</strong></p><p><strong>Autor:</strong> ___________________</p><p>O Vereador que este subscreve, requer à Mesa Diretora, após ouvido o Plenário, que seja oficiado ao Senhor Prefeito Municipal para que informe a esta Casa sobre:</p><ol><li>...</li><li>...</li></ol><p><strong>Justificativa:</strong></p><p>...</p><p style="text-align: right">Sala das Sessões, ___ de _______ de 2025.</p><p style="text-align: center">___________________________<br>Assinatura do Autor</p>`,
  indicacao: `<h3 style="text-align: center">CÂMARA MUNICIPAL</h3><p style="text-align: center"><strong>INDICAÇÃO Nº ___/2025</strong></p><p><strong>Autor:</strong> ___________________</p><p>O Vereador que a esta subscreve, nos termos regimentais, INDICA ao Chefe do Poder Executivo Municipal a necessidade de se tomar providências junto ao setor competente visando:</p><p>...</p><p><strong>Justificativa:</strong></p><p>...</p><p style="text-align: right">Sala das Sessões, ___ de _______ de 2025.</p><p style="text-align: center">___________________________<br>Assinatura do Autor</p>`,
  moca_aplausos: `<h3 style="text-align: center">CÂMARA MUNICIPAL</h3><p style="text-align: center"><strong>MOÇÃO DE APLAUSOS E RECONHECIMENTO Nº ___/2025</strong></p><p><strong>Autor:</strong> ___________________</p><p>A Câmara Municipal, por seus vereadores, aprova a presente Moção de Aplausos e Reconhecimento a(o):</p><p style="text-align: center"><strong>[NOME DO HOMENAGEADO]</strong></p><p>Pelos relevantes serviços prestados...</p><p style="text-align: right">Sala das Sessões, ___ de _______ de 2025.</p><p style="text-align: center">___________________________<br>Assinatura do Autor</p>`,
  voto_pesar: `<h3 style="text-align: center">CÂMARA MUNICIPAL</h3><p style="text-align: center"><strong>VOTO DE PESAR Nº ___/2025</strong></p><p><strong>Autor:</strong> ___________________</p><p>A Câmara Municipal expressa seu profundo pesar pelo falecimento de:</p><p style="text-align: center"><strong>[NOME DO FALECIDO]</strong></p><p>Apresentamos nossas sinceras condolências aos familiares e amigos, rogando a Deus que traga conforto neste momento de dor.</p><p style="text-align: right">Sala das Sessões, ___ de _______ de 2025.</p><p style="text-align: center">___________________________<br>Assinatura do Autor</p>`,
}

const TEMPLATE_GENERICO = `<h3 style="text-align: center">CÂMARA MUNICIPAL</h3><p style="text-align: center"><strong>MATÉRIA Nº ___/2025</strong></p><p><strong>Autor:</strong> ___________________</p><p>...</p><p style="text-align: right">Sala das Sessões, ___ de _______ de 2025.</p><p style="text-align: center">___________________________<br>Assinatura do Autor</p>`

export function ProposicaoNova() {
  const navigate = useNavigate()
  const { criar, protocolar } = useProposicoes()
  const { tiposProposicao, loading: loadingTipos } = useConfiguracoes()

  const tiposAtivos = tiposProposicao.filter(t => t.ativo)

  const [tipo, setTipo] = useState<string>('')
  const [ementa, setEmenta] = useState('')
  const [texto, setTexto] = useState(TEMPLATE_GENERICO)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Define o tipo inicial após os tipos carregarem
  useEffect(() => {
    if (tiposAtivos.length > 0 && !tipo) {
      const primeiro = tiposAtivos[0].codigo
      setTipo(primeiro)
      setTexto(TEMPLATES[primeiro] ?? TEMPLATE_GENERICO)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiposAtivos.length])

  async function salvar(protocolarImediatamente = false) {
    if (!ementa.trim()) { setError('A ementa é obrigatória.'); return }
    if (!tipo) { setError('Selecione o tipo de proposição.'); return }
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

  function handleMudarTipo(novoTipo: string) {
    const templateAtual = TEMPLATES[tipo] ?? TEMPLATE_GENERICO
    if (texto && texto !== '<p></p>' && texto !== templateAtual) {
      if (!window.confirm('Você digitou um texto personalizado. Se alterar o tipo, o modelo sobrescreverá sua edição atual. Deseja continuar?')) {
        return
      }
    }
    setTipo(novoTipo)
    setTexto(TEMPLATES[novoTipo] ?? TEMPLATE_GENERICO)
  }

  const tipoSelecionado = tiposAtivos.find(t => t.codigo === tipo)

  if (loadingTipos) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Nova Proposição" description="Carregando tipos configurados..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

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
            {tiposAtivos.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                Nenhum tipo de proposição ativo. Configure em <strong>Configurações → Tipos de Proposição</strong>.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tiposAtivos.map(t => (
                  <button
                    key={t.codigo}
                    type="button"
                    onClick={() => handleMudarTipo(t.codigo)}
                    className={`text-left p-3 rounded-lg border transition-all ${tipo === t.codigo
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-400'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <p className={`font-semibold text-sm ${tipo === t.codigo ? 'text-primary-700' : 'text-gray-800'}`}>
                      {t.nome} <span className="font-mono text-xs opacity-60">({t.sigla})</span>
                    </p>
                  </button>
                ))}
              </div>
            )}
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
                placeholder="Ex: Dispõe sobre... e dá outras providências."
                value={ementa}
                onChange={e => setEmenta(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{ementa.length}/500</p>
            </div>

            <div>
              <div className="flex justify-between items-end mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Texto Integral
                  <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Carregar o modelo apagará sua digitação atual. Tem certeza?')) {
                      setTexto(TEMPLATES[tipo] ?? TEMPLATE_GENERICO)
                    }
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-0.5 rounded transition-colors hover:bg-primary-50"
                >
                  Carregar modelo padrão
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all">
                <RichTextEditor
                  content={texto}
                  onChange={setTexto}
                  placeholder={`CÂMARA MUNICIPAL\n\n${tipoSelecionado?.nome?.toUpperCase() ?? 'MATÉRIA'} Nº ___/2025\n\nAutor: ___________\n\nDispõe sobre...`}
                />
              </div>
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
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
