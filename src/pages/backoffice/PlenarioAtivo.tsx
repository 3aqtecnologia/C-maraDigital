import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Gavel, Radio, ThumbsUp, ThumbsDown, Minus, CheckCircle2 } from 'lucide-react'
import { useSessaoAtiva } from '@/hooks/useSessoes'
import { useAuth } from '@/hooks/useAuth'

const TIPO_SIGLAS: Record<string, string> = {
  projeto_lei: 'PL', projeto_lei_complementar: 'PLC', projeto_resolucao: 'PR',
  requerimento: 'REQ', indicacao: 'IND', moca_aplausos: 'MOC', voto_pesar: 'VP',
}

export function PlenarioAtivo() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { sessao, loading, votar, iniciarVotacao, encerrarVotacao } = useSessaoAtiva(id!)

  const isAdmin = profile?.role === 'admin' || profile?.role === 'servidor'
  const isVereador = profile?.role === 'vereador'
  const itemEmVotacao = sessao?.pauta_itens.find(i => i.em_votacao)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="animate-spin w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Carregando sessão...</p>
        </div>
      </div>
    )
  }

  if (!sessao) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Gavel size={40} className="mx-auto mb-3 opacity-30" />
          <p>Sessão não encontrada</p>
          <button onClick={() => navigate('/backoffice/plenario')} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">
            Voltar
          </button>
        </div>
      </div>
    )
  }

  const presentes = sessao.presentes.length
  const quorum = sessao.quorum_minimo
  const quorumOk = presentes >= quorum

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/backoffice/plenario')}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-900/30 px-2.5 py-1 rounded-full">
                  <Radio size={10} className="animate-pulse" />
                  AO VIVO
                </span>
                <h1 className="font-bold text-lg">
                  {sessao.tipo === 'ordinaria' ? 'Sessão Ordinária' :
                   sessao.tipo === 'extraordinaria' ? 'Sessão Extraordinária' :
                   sessao.tipo === 'especial' ? 'Sessão Especial' : 'Sessão Solene'} nº {sessao.numero}/{sessao.ano}
                </h1>
              </div>
              <p className="text-gray-400 text-xs mt-0.5">{sessao.local}</p>
            </div>
          </div>

          {/* Quórum */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${quorumOk ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            <Users size={16} />
            <span className="font-bold text-lg">{presentes}</span>
            <span className="text-sm opacity-70">/ {quorum} quórum</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex gap-0">
        {/* Pauta — Coluna esquerda */}
        <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-700">
            <h2 className="font-semibold text-gray-200 text-sm uppercase tracking-wide">Ordem do Dia</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sessao.pauta_itens.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Pauta vazia</p>
            ) : sessao.pauta_itens.map(item => (
              <div
                key={item.id}
                className={`rounded-xl p-3 transition-all ${
                  item.em_votacao
                    ? 'bg-purple-600/20 border border-purple-500'
                    : 'bg-gray-750 border border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 font-mono w-5 flex-shrink-0">{item.ordem}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-400">
                      {TIPO_SIGLAS[item.proposicao?.tipo ?? ''] ?? ''} {item.proposicao?.numero}
                    </p>
                    <p className="text-sm text-gray-200 line-clamp-2 mt-0.5">
                      {item.proposicao?.ementa}
                    </p>
                    {item.em_votacao && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-300 mt-1">
                        <Radio size={9} className="animate-pulse" />
                        Votação aberta
                      </span>
                    )}
                  </div>
                </div>

                {/* Botões admin para controle da votação */}
                {isAdmin && (
                  <div className="mt-2 flex gap-1.5">
                    {!item.em_votacao ? (
                      <button
                        onClick={() => iniciarVotacao(item.id)}
                        className="flex-1 text-xs bg-purple-600 hover:bg-purple-700 text-white py-1.5 rounded-lg transition-colors"
                      >
                        Iniciar Votação
                      </button>
                    ) : (
                      <button
                        onClick={() => encerrarVotacao(item.id)}
                        className="flex-1 text-xs bg-gray-600 hover:bg-gray-500 text-white py-1.5 rounded-lg transition-colors"
                      >
                        Encerrar
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Painel central */}
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          {itemEmVotacao ? (
            <div className="w-full max-w-2xl text-center space-y-8">
              {/* Proposição em votação */}
              <div>
                <div className="inline-flex items-center gap-2 text-purple-400 text-sm font-medium mb-3">
                  <Radio size={14} className="animate-pulse" />
                  VOTAÇÃO EM ANDAMENTO
                </div>
                <div className="bg-gray-800 rounded-2xl border border-purple-500/30 p-8">
                  <p className="text-xs font-mono text-gray-400 mb-2">
                    {TIPO_SIGLAS[itemEmVotacao.proposicao?.tipo ?? ''] ?? ''} {itemEmVotacao.proposicao?.numero}/{new Date().getFullYear()}
                  </p>
                  <p className="text-xl font-semibold text-white leading-relaxed">
                    {itemEmVotacao.proposicao?.ementa}
                  </p>
                </div>
              </div>

              {/* Botões de voto — apenas vereadores */}
              {isVereador && (
                <div>
                  <p className="text-gray-400 text-sm mb-4">Registre seu voto:</p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => votar(itemEmVotacao.proposicao!.id, 'sim')}
                      className="flex flex-col items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-10 py-6 rounded-2xl text-lg font-bold transition-colors shadow-lg shadow-green-900/30"
                    >
                      <ThumbsUp size={28} />
                      SIM
                    </button>
                    <button
                      onClick={() => votar(itemEmVotacao.proposicao!.id, 'nao')}
                      className="flex flex-col items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-10 py-6 rounded-2xl text-lg font-bold transition-colors shadow-lg shadow-red-900/30"
                    >
                      <ThumbsDown size={28} />
                      NÃO
                    </button>
                    <button
                      onClick={() => votar(itemEmVotacao.proposicao!.id, 'abstencao')}
                      className="flex flex-col items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white px-8 py-6 rounded-2xl text-lg font-bold transition-colors"
                    >
                      <Minus size={28} />
                      ABST.
                    </button>
                  </div>
                </div>
              )}

              {/* Mensagem para não-vereadores */}
              {!isVereador && (
                <div className="text-gray-500 text-sm">
                  Aguardando votos dos vereadores...
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium text-gray-400">Nenhuma votação em andamento</p>
              <p className="text-sm mt-1">
                {isAdmin ? 'Selecione um item da pauta para iniciar a votação.' : 'Aguarde o presidente iniciar a votação.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
