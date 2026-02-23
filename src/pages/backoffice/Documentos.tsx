import { PageHeader } from '@/components/layout/PageHeader'
import { useAssinatura } from '@/hooks/useAssinatura'
import { useAuth } from '@/hooks/useAuth'
import type { Documento, DocumentoTipo } from '@/hooks/useDocumentos'
import { useDocumentos } from '@/hooks/useDocumentos'
import { supabase } from '@/lib/supabase'
import { maskCPF } from '@/lib/utils'
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Filter,
  FolderOpen,
  Loader2,
  QrCode,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
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

interface CertificateModalProps {
  documento: Documento
  onClose: () => void
}

function CertificateModal({ documento, onClose }: CertificateModalProps) {
  const verifyUrl = `${window.location.origin}/verificar/${documento.arquivo_hash}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-blue-600 px-6 py-8 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-white/70"
          >
            <X size={18} />
          </button>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-lg font-bold">Certificado de Autenticidade</h2>
          <p className="text-blue-100 text-xs mt-1">Validação de Assinatura Digital</p>
        </div>

        <div className="p-8 flex flex-col items-center">
          {/* QR Code */}
          <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm mb-6">
            <QRCodeSVG
              value={verifyUrl}
              size={160}
              level="H"
              includeMargin={false}
            />
          </div>

          <p className="text-xs text-gray-400 text-center mb-6">
            Aponte a câmera para verificar a integridade deste documento no portal oficial.
          </p>

          <div className="w-full space-y-4 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-400">Assinado por:</span>
              <span className="text-gray-900 font-bold ml-4">
                {(documento.assinatura_metadata as any)?.assinante_nome ?? 'Usuário Identificado'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-400">CPF:</span>
              <span className="text-gray-900 font-medium">
                {maskCPF((documento.assinatura_metadata as any)?.assinante_cpf)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-400">Data e Hora:</span>
              <span className="text-gray-900 font-medium">
                {new Date((documento.assinatura_metadata as any)?.data_assinatura ?? documento.created_at).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-400">IP de Conexão:</span>
              <span className="text-gray-900 font-medium font-mono text-xs">
                {(documento.assinatura_metadata as any)?.conexao_ip ?? '—'}
              </span>
            </div>
            <div className="flex flex-col gap-1 py-1">
              <span className="text-gray-400 text-xs">Classificação Legal (Lei 14.063/2020):</span>
              <span className="text-blue-700 font-bold text-xs uppercase">
                {(documento.assinatura_metadata as any)?.tipo ?? 'Assinatura Eletrônica Avançada'}
              </span>
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-gray-400 text-xs">ID de Verificação (Hash):</span>
              <span className="text-[10px] font-mono text-gray-500 break-all leading-tight bg-gray-50 p-2 rounded-lg border border-gray-100">
                {documento.arquivo_hash}
              </span>
            </div>
          </div>

          <a
            href={verifyUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors"
          >
            <ExternalLink size={16} />
            Abrir Verificador Público
          </a>

          <button
            onClick={async () => {
              try {
                const { data, error } = await supabase.functions.invoke('stamp-pdf', {
                  body: { documento_id: documento.id }
                })
                if (error || !data) throw new Error(error?.message || 'Erro ao gerar PDF')

                const blob = new Blob([data], { type: 'application/pdf' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `AUTENTICADO_${documento.arquivo_nome}`
                a.click()
              } catch (err) {
                alert(`Erro: ${err instanceof Error ? err.message : String(err)}`)
              }
            }}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 border border-blue-200 text-blue-600 rounded-xl font-medium text-sm hover:bg-blue-50 transition-colors"
          >
            <Download size={16} />
            Baixar Via Autenticada (.pdf)
          </button>
        </div>
      </div>
    </div>
  )
}

interface GovBrSignatureModalProps {
  documento: Documento
  onClose: () => void
  onSuccess: () => void
}

function GovBrSignatureModal({ documento, onClose, onSuccess }: GovBrSignatureModalProps) {
  const [step, setStep] = useState<'login' | 'signing' | 'success'>('login')
  const { profile } = useAuth()
  const [cpf, setCpf] = useState(profile?.cpf || '')
  const [nivel, setNivel] = useState<'Prata' | 'Ouro'>('Ouro')
  const [loading, setLoading] = useState(false)
  const { assinarDocumento } = useAssinatura()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Simula validação de CPF e autenticação Gov.br
    setTimeout(() => {
      setStep('signing')
      setLoading(false)
    }, 1500)
  }

  async function handleSign() {
    setLoading(true)

    // Atualiza o CPF no perfil para garantir a rastreabilidade na Edge Function
    if (cpf && profile && cpf !== profile.cpf) {
      await supabase.from('profiles').update({ cpf }).eq('id', profile.id)
    }

    const { error } = await assinarDocumento(documento.id, nivel)
    setLoading(false)

    if (error) {
      alert(`Erro no processo de assinatura: ${error}`)
    } else {
      setStep('success')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-blue-900/20 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[420px] overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header Gov.br */}
        <div className="bg-[#0047b1] px-6 py-6 text-white flex flex-col items-center gap-2 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-white rounded-lg p-1">
              <ShieldCheck size={24} className="text-[#0047b1]" />
            </div>
            <span className="font-bold text-xl tracking-tight">gov.br</span>
          </div>
          <p className="text-blue-100 text-[10px] font-medium uppercase tracking-widest text-center">Identidade Digital e Assinatura Eletrônica</p>
        </div>

        <div className="p-8">
          {step === 'login' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Identifique-se no gov.br</h3>
                <p className="text-sm text-gray-500 mt-1">Conforme Lei 14.063/2020</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">CPF</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-lg tracking-widest text-center"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={e => setCpf(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Selo de Confiabilidade</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Prata', label: 'Prata', desc: 'Avançada' },
                      { id: 'Ouro', label: 'Ouro', desc: 'Qualificada' },
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setNivel(s.id as 'Prata' | 'Ouro')}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${nivel === s.id
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                          }`}
                      >
                        <p className={`text-xs font-black ${nivel === s.id ? 'text-blue-700' : 'text-gray-400'}`}>SELADO {s.label.toUpperCase()}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{s.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || cpf.length < 11}
                  className="w-full py-4 bg-[#0047b1] hover:bg-[#003a91] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Entrar com gov.br'}
                </button>
              </form>

              <div className="pt-4 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter leading-tight">
                  Sua identidade digital com a segurança da ICP-Brasil
                </p>
              </div>
            </div>
          )}

          {step === 'signing' && (
            <div className="space-y-6 animate-in fade-in duration-500 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-inner">
                <FileText size={32} className="text-[#0047b1]" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">Assinar Documento</h3>
                <p className="text-sm text-gray-500 mt-1 truncate max-w-xs mx-auto">
                  {documento.nome}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl text-left border border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Classificação Legal (Lei 14.063)</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nível da conta:</span>
                    <span className={`font-bold ${nivel === 'Ouro' ? 'text-amber-600' : 'text-gray-600'}`}>
                      {nivel} {nivel === 'Ouro' ? '★★★' : '★★'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo de Assinatura:</span>
                    <span className="font-bold text-blue-700">
                      {nivel === 'Ouro' ? 'Qualificada' : 'Avançada'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amparo:</span>
                    <span className="font-bold text-green-600">Lei 14.063/2020</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSign}
                disabled={loading}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : (
                  <>
                    <ShieldCheck size={20} />
                    Assinar Digitalmente
                  </>
                )}
              </button>

              <button
                onClick={() => setStep('login')}
                disabled={loading}
                className="text-sm font-medium text-gray-400 hover:text-gray-600"
              >
                Voltar
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-6 animate-in zoom-in duration-500 text-center py-4">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 scale-110">
                <CheckCircle2 size={48} className="text-green-600" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Assinado!</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed px-4">
                  Documento formalizado como <strong>Assinatura {nivel === 'Ouro' ? 'Qualificada' : 'Avançada'}</strong> conforme os requisitos da <strong>Lei 14.063/2020</strong>.
                </p>
              </div>

              <button
                onClick={() => { onSuccess(); onClose(); }}
                className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all"
              >
                Retornar ao GED
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Documentos() {
  const { profile } = useAuth()
  const { documentos, loading, fetchDocumentos, uploadDocumento, downloadDocumento, deletarDocumento } = useDocumentos()
  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedCertificate, setSelectedCertificate] = useState<Documento | null>(null)
  const [documentToSign, setDocumentToSign] = useState<Documento | null>(null)

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
    setDocumentToSign(doc)
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
                      <span
                        className="inline-flex items-center gap-1 text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 cursor-help"
                        title={`Hash SHA-256: ${doc.arquivo_hash}\nIntegridade garantida via Gov.br`}
                      >
                        <CheckCircle2 size={12} />
                        Assinado via Gov.br
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
                      title="Assinar com Gov.br"
                      className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-100 flex items-center gap-1"
                    >
                      <ShieldCheck size={16} />
                      <span className="text-[10px] font-bold uppercase">Gov.br</span>
                    </button>
                  )}
                  <button
                    onClick={() => downloadDocumento(doc)}
                    title="Baixar"
                    className="p-2 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    <Download size={16} />
                  </button>
                  {doc.assinado && (
                    <button
                      onClick={() => setSelectedCertificate(doc)}
                      title="Ver Certificado de Autenticidade"
                      className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <QrCode size={16} />
                    </button>
                  )}
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

      {selectedCertificate && (
        <CertificateModal
          documento={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}

      {documentToSign && (
        <GovBrSignatureModal
          documento={documentToSign}
          onClose={() => setDocumentToSign(null)}
          onSuccess={() => {
            fetchDocumentos()
            setDocumentToSign(null)
          }}
        />
      )}
    </div>
  )
}
