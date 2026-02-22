import { useLeiPublica } from '@/hooks/useTransparencia';
import {
  ArrowLeft,
  Book,
  CalendarCheck,
  Download,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  em_vigor: { label: 'Em Vigor', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
  revogada_parcialmente: { label: 'Revogada Parcialmente', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
  revogada_totalmente: { label: 'Revogada Totalmente', color: 'text-red-700', bg: 'bg-red-50 border-red-100' },
}

export function LeiPublicaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const { lei, loading } = useLeiPublica(id!)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!lei) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Lei não encontrada</h1>
        <p className="text-gray-500 mt-2">O documento que você procura não existe ou não é público.</p>
        <Link to="/transparencia" className="btn-primary mt-6">Voltar ao Portal</Link>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[lei.status] || STATUS_CONFIG.em_vigor

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
              {lei.esfera} № {lei.numero}/{lei.ano}
            </h1>
            <p className="text-primary-200 text-xs hidden md:block">Compilação Oficial de Leis (LeisGov)</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="space-y-8">

          {/* Ficha da Lei */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12">

              <div className="flex flex-wrap items-center gap-4 mb-8">
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color} uppercase tracking-wider shadow-sm`}>
                  <ShieldCheck size={14} />
                  {cfg.label}
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500 text-sm flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-lg">
                  <CalendarCheck size={14} className="text-primary-400" />
                  Publicado em {new Date(lei.data_publicacao).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-primary-600">
                    <Book size={24} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 leading-tight">
                      {lei.esfera} № {lei.numero}
                    </h2>
                    <p className="text-lg text-gray-500 mt-1 font-medium">Data de {lei.ano}</p>
                  </div>
                </div>

                <div className="bg-primary-50/50 border-l-4 border-primary-500 p-6 md:p-8 rounded-r-2xl">
                  <p className="text-primary-900 text-lg leading-relaxed font-serif italic">
                    {lei.ementa}
                  </p>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap gap-4 pt-10 border-t border-gray-100 items-center justify-between">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 flex-1">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Ano</p>
                    <p className="text-sm font-bold text-gray-900">{lei.ano}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Esfera</p>
                    <p className="text-sm font-bold text-gray-900">{lei.esfera}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Número</p>
                    <p className="text-sm font-bold text-gray-900">{lei.numero}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Status</p>
                    <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</p>
                  </div>
                </div>

                <button className="btn-primary px-8 py-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-200">
                  <Download size={20} />
                  Texto Oficial (PDF)
                </button>
              </div>
            </div>
          </div>

          {/* Texto Integral */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-12">
            <div className="flex items-center gap-3 mb-10 border-b border-gray-100 pb-6">
              <div className="p-3 bg-gray-50 rounded-xl">
                <FileText size={24} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Conteúdo da Norma</h3>
            </div>

            <div
              className="prose prose-slate max-w-none
                prose-headings:text-gray-900 prose-headings:font-black
                prose-p:text-gray-800 prose-p:text-lg prose-p:leading-relaxed
                prose-li:text-gray-800"
              dangerouslySetInnerHTML={{ __html: lei.texto_compilado || '' }}
            />

            {!lei.texto_compilado && (
              <div className="text-center py-20 grayscale opacity-40">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium italic">O texto integral desta norma está disponível para download em PDF.</p>
              </div>
            )}
          </div>

          {/* Banner de apoio */}
          <div className="bg-gradient-to-r from-primary-700 to-indigo-800 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="text-center md:text-left">
              <h4 className="text-xl font-bold mb-1">Pesquisa Legislativa Próxima?</h4>
              <p className="text-primary-100 text-sm opacity-80">Encontre outras leis relacionadas ou normas correlatas no nosso portal.</p>
            </div>
            <Link to="/transparencia" className="bg-white text-primary-900 font-bold px-8 py-3 rounded-2xl hover:bg-primary-50 transition-colors whitespace-nowrap shadow-lg">
              Explorar LeisGov
            </Link>
          </div>

        </div>
      </div>

      <footer className="py-12 text-center text-gray-400 text-xs font-medium">
        Portal de Transparência Legislativa · Compilação Oficial Câmara Municipal · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
