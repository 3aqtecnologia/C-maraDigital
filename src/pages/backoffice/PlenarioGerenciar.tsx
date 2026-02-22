import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, GripVertical, Play, Search,
  FileText, AlertCircle, Gavel, ChevronUp, ChevronDown
} from 'lucide-react'
import { useSessoes } from '@/hooks/useSessoes'
import { usePautaItens } from '@/hooks/usePautaItens'
import { useProposicoes } from '@/hooks/useProposicoes'
import { useAuth } from '@/hooks/useAuth'

const TIPO_SIGLAS: Record<string, string> = {
  projeto_lei: 'PL', projeto_lei_complementar: 'PLC', projeto_resolucao: 'PR',
  requerimento: 'REQ', indicacao: 'IND', moca_aplausos: 'MOC', voto_pesar: 'VP',
}

const TIPO_SESSAO: Record<string, string> = {
  ordinaria: 'Sessão Ordinária',
  extraordinaria: 'Sessão Extraordinária',
  especial: 'Sessão Especial',
  solene: 'Sessão Solene',
}

export function PlenarioGerenciar() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const { sessoes, iniciar } = useSessoes()
  const sessao = sessoes.find(s => s.id === id)

  const { itens, loading: loadingItens, adicionarItem, removerItem, reordenar } = usePautaItens(id!)
  const { proposicoes } = useProposicoes()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'servidor'

  const [showSeletor, setShowSeletor] = useState(false)
  const [busca, setBusca] = useState('')
  const [adicionando, setAdicionando] = useState<string | null>(null)
  const [iniciando, setIniciando] = useState(false)

  // Proposições que já estão na pauta
  const idsNaPauta = new Set(itens.map(i => i.proposicao?.id).filter(Boolean))

  const proposicoesFiltradas = proposicoes.filter(p => {
    if (idsNaPauta.has(p.id)) return false
    if (!busca) return true
    const termo = busca.toLowerCase()
    return p.ementa.toLowerCase().includes(termo) || p.numero.toLowerCase().includes(termo)
  })

  async function handleAdicionar(proposicaoId: string) {
    setAdicionando(proposicaoId)
    await adicionarItem(proposicaoId)
    setAdicionando(null)
  }

  async function handleIniciar() {
    if (!id) return
    setIniciando(true)
    const ok = await iniciar(id)
    setIniciando(false)
    if (ok) navigate(`/backoffice/plenario/${id}`)
  }

  async function moverItem(itemId: string, direcao: 'up' | 'down') {
    const idx = itens.findIndex(i => i.id === itemId)
    if (direcao === 'up' && idx === 0) return
    if (direcao === 'down' && idx === itens.length - 1) return
    const vizinho = itens[direcao === 'up' ? idx - 1 : idx + 1]
    await reordenar(itemId, vizinho.ordem)
    await reordenar(vizinho.id, itens[idx].ordem)
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Gavel size={40} className="mx-auto mb-3 opacity-20" />
          <p>Acesso restrito a administradores</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/backoffice/plenario')}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">
                {sessao ? `${TIPO_SESSAO[sessao.tipo]} nº ${sessao.numero}/${sessao.ano}` : 'Gerenciar Sessão'}
              </h1>
              <p className="text-gray-500 text-sm">
                {sessao
                  ? `${new Date(sessao.data_inicio).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })} · ${sessao.local}`
                  : 'Carregando...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSeletor(true)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Plus size={15} />
              Adicionar à Pauta
            </button>
            <button
              onClick={handleIniciar}
              disabled={iniciando || itens.length === 0}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Play size={15} />
              {iniciando ? 'Iniciando...' : 'Iniciar Sessão'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Info da sessão */}
          {sessao && (
            <div className="grid grid-cols-3 gap-4">
              <div className="card text-center p-4">
                <p className="text-2xl font-bold text-primary-600">{itens.length}</p>
                <p className="text-sm text-gray-500 mt-0.5">Itens na pauta</p>
              </div>
              <div className="card text-center p-4">
                <p className="text-2xl font-bold text-gray-800">{sessao.quorum_minimo}</p>
                <p className="text-sm text-gray-500 mt-0.5">Quórum mínimo</p>
              </div>
              <div className="card text-center p-4">
                <p className="text-2xl font-bold text-gray-800">{sessao.presentes.length}</p>
                <p className="text-sm text-gray-500 mt-0.5">Presentes</p>
              </div>
            </div>
          )}

          {/* Ordem do Dia */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Ordem do Dia</h2>
              {itens.length === 0 && !loadingItens && (
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  Pauta vazia — adicione proposições antes de iniciar
                </span>
              )}
            </div>

            {loadingItens ? (
              <div className="py-8 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : itens.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <FileText size={36} className="mx-auto mb-2 opacity-20" />
                <p className="font-medium">Nenhuma proposição na pauta</p>
                <p className="text-xs mt-1">Clique em "Adicionar à Pauta" para incluir proposições</p>
              </div>
            ) : (
              <ol className="space-y-2">
                {itens.map((item, idx) => (
                  <li key={item.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-white transition-colors group">
                    {/* Drag handle visual */}
                    <div className="text-gray-400 mt-0.5 flex-shrink-0">
                      <GripVertical size={16} />
                    </div>

                    {/* Número */}
                    <span className="text-sm font-mono font-bold text-gray-400 w-5 flex-shrink-0 mt-0.5">{idx + 1}.</span>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-primary-600 font-semibold">
                        {TIPO_SIGLAS[item.proposicao?.tipo ?? ''] ?? ''} {item.proposicao?.numero}
                      </p>
                      <p className="text-sm text-gray-700 mt-0.5 leading-snug">
                        {item.proposicao?.ementa}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moverItem(item.id, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                        title="Mover para cima"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => moverItem(item.id, 'down')}
                        disabled={idx === itens.length - 1}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                        title="Mover para baixo"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        onClick={() => removerItem(item.id)}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                        title="Remover da pauta"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Aviso para iniciar */}
          {itens.length > 0 && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-blue-700 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <p>
                A pauta está pronta com <strong>{itens.length} {itens.length === 1 ? 'item' : 'itens'}</strong>.
                Clique em <strong>Iniciar Sessão</strong> para abrir o painel ao vivo e iniciar as votações.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal seletor de proposições */}
      {showSeletor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Selecionar Proposição</h2>
              <button
                onClick={() => setShowSeletor(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                Fechar
              </button>
            </div>

            <div className="px-5 py-3 border-b border-gray-100">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Buscar por número ou ementa..."
                  className="input pl-9 text-sm"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {proposicoesFiltradas.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">
                  {busca ? 'Nenhuma proposição encontrada para essa busca.' : 'Todas as proposições já estão na pauta.'}
                </p>
              ) : proposicoesFiltradas.map(p => (
                <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-primary-600 font-semibold">
                      {TIPO_SIGLAS[p.tipo] ?? p.tipo} {p.numero}/{p.ano}
                    </p>
                    <p className="text-sm text-gray-700 mt-0.5 line-clamp-2 leading-snug">{p.ementa}</p>
                    <p className="text-xs text-gray-400 mt-1">{p.autor?.nome ?? '—'}</p>
                  </div>
                  <button
                    onClick={() => handleAdicionar(p.id)}
                    disabled={adicionando === p.id}
                    className="btn-primary text-xs py-1.5 px-3 flex-shrink-0 flex items-center gap-1"
                  >
                    {adicionando === p.id ? (
                      <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
                    ) : (
                      <Plus size={12} />
                    )}
                    Incluir
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
