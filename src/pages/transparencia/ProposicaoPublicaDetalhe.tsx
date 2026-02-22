import { useProposicaoPublica } from '@/hooks/useTransparencia'
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  History,
  Shield
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

const TIPOS_LABELS: Record<string, string> = {
  projeto_lei: 'Projeto de Lei',
  projeto_lei_complementar: 'Projeto de Lei Complementar',
  projeto_resolucao: 'Projeto de Resolução',
  requerimento: 'Requerimento',
  indicacao: 'Indicação',
  moca_aplausos: 'Moção de Aplausos',
  voto_pesar: 'Voto de Pesar',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  rascunho: { label: 'Rascunho', color: 'text-gray-600', bg: 'bg-gray-100' },
  protocolado: { label: 'Protocolado', color: 'text-blue-700', bg: 'bg-blue-100' },
  em_tramitacao: { label: 'Em Tramitação', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  em_comissao: { label: 'Em Comissão', color: 'text-orange-700', bg: 'bg-orange-100' },
  em_votacao: { label: 'Em Votação', color: 'text-purple-700', bg: 'bg-purple-100' },
  aprovado: { label: 'Aprovado', color: 'text-green-700', bg: 'bg-green-100' },
  rejeitado: { label: 'Rejeitado', color: 'text-red-700', bg: 'bg-red-100' },
  arquivado: { label: 'Arquivado', color: 'text-gray-500', bg: 'bg-gray-100' },
  sancionado: { label: 'Sancionado', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  vetado: { label: 'Vetado', color: 'text-red-600', bg: 'bg-red-100' },
}

export function ProposicaoPublicaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const { proposicao, tramitacoes, loading } = useProposicaoPublica(id!)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!proposicao) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Proposição não encontrada</h1>
        <p className="text-gray-500 mt-2">O documento que você procura não existe ou não é público.</p>
        <Link to="/transparencia" className="btn-primary mt-6">Voltar ao Portal</Link>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[proposicao.status] || STATUS_CONFIG.rascunho

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Fixo */}
      <header className="bg-primary-600 text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/transparencia" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="font-bold text-sm md:text-base truncate">
              {TIPOS_LABELS[proposicao.tipo]} № {proposicao.numero}/{proposicao.ano}
            </h1>
            <p className="text-primary-200 text-xs hidden md:block">Portal da Transparência Legislativa</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">

            {/* Cabeçalho do documento */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className={`badge ${cfg.bg} ${cfg.color} font-semibold py-1 px-3`}>
                    {cfg.label}
                  </span>
                  <span className="text-gray-400 text-sm">•</span>
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Calendar size={14} /> Protocolo: {new Date(proposicao.data_protocolo || proposicao.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-6 leading-tight">
                  {TIPOS_LABELS[proposicao.tipo]} № {proposicao.numero}/{proposicao.ano}
                </h2>

                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 italic text-gray-700 leading-relaxed">
                  "{proposicao.ementa}"
                </div>

                <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                      {proposicao.autor?.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Autor da Proposição</p>
                      <p className="font-semibold text-gray-900">{proposicao.autor?.nome} <span className="text-gray-400 font-normal">({proposicao.autor?.partido || 'Sem partido'})</span></p>
                    </div>
                  </div>
                  <button className="btn-primary flex items-center gap-2 justify-center shadow-indigo-100 shadow-md">
                    <Download size={16} /> Baixar PDF Oficial
                  </button>
                </div>
              </div>
            </div>

            {/* Texto Integral */}
            {proposicao.texto_integral && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText size={20} className="text-primary-600" /> Texto Integral da Proposição
                </h3>
                <div
                  className="prose prose-slate max-w-none text-gray-800 text-lg leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: proposicao.texto_integral }}
                />
              </div>
            )}
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">

            {/* Status Card */}
            <div className={`rounded-2xl p-6 border shadow-sm ${cfg.bg} ${cfg.color.replace('text-', 'border-').replace('700', '200')}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg bg-white/50 backdrop-blur-sm`}>
                  <Shield size={18} />
                </div>
                <h3 className="font-bold uppercase tracking-wider text-xs">Situação Atual</h3>
              </div>
              <p className="text-2xl font-black">{cfg.label}</p>
              <p className="mt-2 text-sm opacity-80 leading-snug">
                Esta proposição encontra-se em estágio de <strong>{cfg.label.toLowerCase()}</strong> no processo legislativo.
              </p>
            </div>

            {/* Histórico Simplificado */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <History size={18} className="text-primary-600" /> Histórico de Tramitação
              </h3>

              <div className="space-y-6 relative ml-1">
                <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-gray-100" />

                {tramitacoes.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aguardando primeiras movimentações.</p>
                ) : (
                  tramitacoes.map((t, i) => {
                    const stepCfg = STATUS_CONFIG[t.status_novo] || STATUS_CONFIG.rascunho
                    return (
                      <div key={t.id} className="relative pl-8">
                        <div className={`absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm ${i === tramitacoes.length - 1 ? 'bg-primary-600' : 'bg-gray-300'}`} />
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold uppercase tracking-wider ${stepCfg.color}`}>
                            {stepCfg.label}
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(t.created_at).toLocaleDateString('pt-BR')} às {new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {t.descricao && (
                            <p className="text-sm text-gray-600 mt-1.5 leading-snug">{t.descricao}</p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Ajuda / Cidadão */}
            <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-lg">
              <h4 className="font-bold mb-2">Tem dúvidas?</h4>
              <p className="text-indigo-200 text-sm mb-4 leading-relaxed">
                Você pode solicitar mais informações sobre este processo através do e-SIC (Sistema de Informação ao Cidadão).
              </p>
              <button className="w-full bg-accent text-primary-900 font-bold py-2.5 rounded-xl hover:bg-accent-light transition-colors text-sm">
                Solicitar Informação
              </button>
            </div>

          </div>
        </div>
      </div>

      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-gray-200 text-center text-gray-400 text-xs">
        © {new Date().getFullYear()} · Portal da Transparência Legislativa · Câmara Municipal
      </footer>
    </div>
  )
}
