import { PageHeader } from '@/components/layout/PageHeader'
import { useAssinatura } from '@/hooks/useAssinatura'
import { useAuth } from '@/hooks/useAuth'
import type { Documento, DocumentoTipo } from '@/hooks/useDocumentos'
import { useDocumentos } from '@/hooks/useDocumentos'
import {
  CheckCircle2,
  Download,
  FileText,
  Filter,
  FolderOpen,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const TIPOS: { value: DocumentoTipo | ''; label: string }[] = [
  { value: '', label: 'Todos os tipos' },
  { value: 'ata', label: 'Ata' },
  { value: 'oficio', label: 'Ofício' },
  { value: 'requerimento', label: 'Requerimento' },
  { value: 'decreto', label: 'Decreto' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'portaria', label: 'Portaria' },
  { value: 'outro', label: 'Outro' },
]

const TIPO_COR: Record<DocumentoTipo, string> = {
  ata: 'bg-blue-50 text-blue-700 border-blue-200',
  oficio: 'bg-purple-50 text-purple-700 border-purple-200',
  requerimento: 'bg-amber-50 text-amber-700 border-amber-200',
  decreto: 'bg-green-50 text-green-700 border-green-200',
  contrato: 'bg-red-50 text-red-700 border-red-200',
  portaria: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  outro: 'bg-gray-50 text-gray-600 border-gray-200',
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

interface UploadModalProps {
  onClose: () => void
  onSuccess: () => void
  uploadDocumento: ReturnType<typeof useDocumentos>['uploadDocumento']
}

function UploadModal({ onClose, onSuccess, uploadDocumento }: UploadModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<DocumentoTipo>('outro')
  const [descricao, setDescricao] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    if (!nome) setNome(f.name.replace(/\.[^/.]+$/, ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setError(null)
    setUploading(true)
    const { error: err } = await uploadDocumento(file, { nome, tipo, descricao })
    setUploading(false)
    if (err) {
      setError(err)
    } else {
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Enviar Documento</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Área de upload */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3 text-gray-700">
                <FileText size={20} className="text-primary-600" />
                <div className="text-left">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                </div>
              </div>
            ) : (
              <div className="text-gray-400">
                <Upload size={24} className="mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Clique para selecionar</p>
                <p className="text-xs mt-1">PDF, Word, Excel, imagens — até 50 MB</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do documento *</label>
            <input
              className="input"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              placeholder="Ex: Ata da Sessão Ordinária 001/2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo *</label>
            <select className="input" value={tipo} onChange={e => setTipo(e.target.value as DocumentoTipo)}>
              {TIPOS.filter(t => t.value).map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição (opcional)</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Breve descrição do conteúdo..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading || !file || !nome}
              className="btn-primary flex-1 justify-center flex items-center gap-2"
            >
              {uploading ? <><Loader2 size={15} className="animate-spin" /> Enviando...</> : <><Upload size={15} /> Enviar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Documentos() {
  const { profile } = useAuth()
  const { documentos, loading, fetchDocumentos, uploadDocumento, downloadDocumento, deletarDocumento } = useDocumentos()
  const { assinarDocumento, loading: signing } = useAssinatura()

  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [signingId, setSigningId] = useState<string | null>(null)

  const canEdit = profile?.role === 'admin' || profile?.role === 'servidor'
  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    fetchDocumentos(search, tipoFiltro)
  }, [fetchDocumentos, search, tipoFiltro])

  async function handleDelete(doc: Documento) {
    if (!confirm(`Excluir "${doc.nome}"? Esta ação não pode ser desfeita.`)) return
    setDeletingId(doc.id)
    await deletarDocumento(doc)
    await fetchDocumentos(search, tipoFiltro)
    setDeletingId(null)
  }

  async function handleSign(doc: Documento) {
    if (!confirm(`Deseja assinar digitalmente o documento "${doc.nome}" via Gov.br (ICP-Brasil)?`)) return
    setSigningId(doc.id)
    const { error } = await assinarDocumento(doc.id)
    if (error) {
      alert(`Erro ao assinar: ${error}`)
    } else {
      await fetchDocumentos(search, tipoFiltro)
    }
    setSigningId(null)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Documentos (GED)"
        description="Gestão Eletrônica de Documentos da câmara"
        actions={
          canEdit ? (
            <button
              onClick={() => setShowUpload(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Upload size={15} />
              Enviar Documento
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 p-6 overflow-auto space-y-5">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar por nome..."
              className="input pl-9 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400 flex-shrink-0" />
            <select
              className="input text-sm py-2"
              value={tipoFiltro}
              onChange={e => setTipoFiltro(e.target.value)}
            >
              {TIPOS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary-500" />
          </div>
        ) : documentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <FolderOpen size={24} className="text-gray-400" />
            </div>
            <p className="font-medium text-gray-700">Nenhum documento encontrado</p>
            <p className="text-sm text-gray-400 mt-1">
              {search || tipoFiltro ? 'Tente ajustar os filtros.' : 'Clique em "Enviar Documento" para começar.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {documentos.map(doc => (
              <div
                key={doc.id}
                className="card flex items-center gap-4 hover:shadow-sm transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-primary-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.nome}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium capitalize ${TIPO_COR[doc.tipo]}`}>
                      {doc.tipo}
                    </span>
                    <span>{formatBytes(doc.arquivo_tamanho)}</span>
                    <span>{doc.arquivo_mime?.split('/')[1]?.toUpperCase() ?? 'Arquivo'}</span>
                    <span>{formatDate(doc.created_at)}</span>
                    {doc.assinado && (
                      <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle2 size={12} />
                        Assinado Digitalmente (ICP-Brasil)
                      </span>
                    )}
                    {doc.descricao && (
                      <span className="text-gray-400 truncate max-w-xs hidden sm:inline">— {doc.descricao}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {!doc.assinado && canEdit && (
                    <button
                      onClick={() => handleSign(doc)}
                      disabled={signing || !!signingId}
                      title="Assinar Digitalmente"
                      className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      {signingId === doc.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ShieldCheck size={16} />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => downloadDocumento(doc)}
                    title="Baixar"
                    className="p-2 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    <Download size={16} />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={deletingId === doc.id}
                      title="Excluir"
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      {deletingId === doc.id
                        ? <Loader2 size={16} className="animate-spin" />
                        : <Trash2 size={16} />
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rodapé com total */}
        {!loading && documentos.length > 0 && (
          <p className="text-xs text-gray-400 text-center">
            {documentos.length} documento{documentos.length !== 1 ? 's' : ''} encontrado{documentos.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => fetchDocumentos(search, tipoFiltro)}
          uploadDocumento={uploadDocumento}
        />
      )}
    </div>
  )
}
