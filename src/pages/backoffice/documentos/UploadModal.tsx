import type { DocumentoTipo } from '@/hooks/useDocumentos'
import type { useDocumentos } from '@/hooks/useDocumentos'
import { FileText, Loader2, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const TIPOS: { value: DocumentoTipo; label: string }[] = [
  { value: 'ata', label: 'Ata' },
  { value: 'oficio', label: 'Ofício' },
  { value: 'requerimento', label: 'Requerimento' },
  { value: 'decreto', label: 'Decreto' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'portaria', label: 'Portaria' },
  { value: 'outro', label: 'Outro' },
]

interface UploadModalProps {
  onClose: () => void
  onSuccess: () => void
  uploadDocumento: ReturnType<typeof useDocumentos>['uploadDocumento']
}

export function UploadModal({ onClose, onSuccess, uploadDocumento }: UploadModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<DocumentoTipo>('outro')
  const [descricao, setDescricao] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const firstEl = document.querySelector<HTMLElement>('[role="dialog"] input, [role="dialog"] button')
    firstEl?.focus()
  }, [])

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
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="upload-modal-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 id="upload-modal-title" className="text-base font-semibold text-gray-900">Enviar Documento</h2>
          <button onClick={onClose} aria-label="Fechar" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
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
              {TIPOS.map(t => (
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
