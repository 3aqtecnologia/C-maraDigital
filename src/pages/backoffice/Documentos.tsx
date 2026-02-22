import { Upload, FileText, Download, Search, Filter, Lock, Clock, CheckCircle2, Construction } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/hooks/useAuth'

const MOCK_DOCS = [
  { id: '1', nome: 'Ata da Sessão Ordinária nº 001/2025', tipo: 'ata', tamanho: '245 KB', data: '15/01/2025', assinado: true },
  { id: '2', nome: 'Ofício nº 0034/2025 — Secretaria de Obras', tipo: 'oficio', tamanho: '128 KB', data: '20/01/2025', assinado: true },
  { id: '3', nome: 'Requerimento PL 012/2025 — Aprovação', tipo: 'requerimento', tamanho: '89 KB', data: '25/01/2025', assinado: false },
  { id: '4', nome: 'Decreto Legislativo nº 02/2025', tipo: 'decreto', tamanho: '312 KB', data: '30/01/2025', assinado: true },
]

const TIPO_CORES: Record<string, string> = {
  ata:          'bg-blue-50 text-blue-700',
  oficio:       'bg-purple-50 text-purple-700',
  requerimento: 'bg-amber-50 text-amber-700',
  decreto:      'bg-green-50 text-green-700',
  contrato:     'bg-red-50 text-red-700',
}

export function Documentos() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'servidor'

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Documentos (GED)"
        description="Gestão Eletrônica de Documentos com assinatura digital"
        actions={
          isAdmin ? (
            <button className="btn-primary flex items-center gap-2 text-sm opacity-60 cursor-not-allowed" disabled>
              <Upload size={15} />
              Enviar Documento
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 p-8 overflow-auto space-y-6">

        {/* Banner Em Desenvolvimento */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3 text-amber-800">
          <Construction size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Módulo em desenvolvimento</p>
            <p className="text-xs mt-0.5 text-amber-700">
              O GED completo com assinatura digital ICP-Brasil, verificador QR Code e gestão de versões estará disponível na Fase 5 do roadmap.
              A seguir uma prévia do que está sendo implementado.
            </p>
          </div>
        </div>

        {/* Features preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Lock,         title: 'Assinatura Digital',     desc: 'Integração ICP-Brasil / Gov.br para assinar documentos com validade jurídica', done: false },
            { icon: CheckCircle2, title: 'Verificador QR Code',    desc: 'QR Code impresso no PDF para verificar autenticidade do documento online',     done: false },
            { icon: Clock,        title: 'Controle de Versões',    desc: 'Histórico completo de alterações, versões e aprovações de cada documento',      done: false },
          ].map(f => (
            <div key={f.title} className="card opacity-75">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-3">
                <f.icon size={18} className="text-primary-600" />
              </div>
              <p className="font-medium text-gray-900 text-sm">{f.title}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
              <span className="inline-flex items-center gap-1 text-xs mt-3 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <Clock size={10} /> Em breve
              </span>
            </div>
          ))}
        </div>

        {/* Lista prévia (mock) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Documentos Recentes</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="search" placeholder="Buscar..." className="input pl-8 text-sm py-1.5 w-40" disabled />
              </div>
              <button className="p-1.5 rounded-lg border border-gray-300 text-gray-400" disabled>
                <Filter size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-2 opacity-60">
            {MOCK_DOCS.map(doc => (
              <div key={doc.id} className="card flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.nome}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    <span className={`badge ${TIPO_CORES[doc.tipo] ?? 'bg-gray-100 text-gray-600'}`}>{doc.tipo}</span>
                    <span>{doc.tamanho}</span>
                    <span>{doc.data}</span>
                    {doc.assinado && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 size={10} /> Assinado
                      </span>
                    )}
                  </div>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" disabled>
                  <Download size={15} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-center text-gray-400 mt-3">* Dados ilustrativos — funcionalidade em desenvolvimento</p>
        </div>
      </div>
    </div>
  )
}
