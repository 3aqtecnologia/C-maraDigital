import type { Documento } from '@/hooks/useDocumentos'
import { supabase } from '@/lib/supabase'
import { maskCPF } from '@/lib/utils'
import type { AssinaturaMetadata } from '@/types/database'
import { Download, ExternalLink, ShieldCheck, X } from 'lucide-react'
import { useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface CertificateModalProps {
  documento: Documento
  onClose: () => void
}

export function CertificateModal({ documento, onClose }: CertificateModalProps) {
  const verifyUrl = `${window.location.origin}/verificar/${documento.arquivo_hash}`
  const meta = documento.assinatura_metadata as unknown as AssinaturaMetadata | null

  useEffect(() => {
    const firstEl = document.querySelector<HTMLElement>('[role="dialog"] button')
    firstEl?.focus()
  }, [])

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="cert-modal-title" className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 px-6 py-8 text-white text-center relative">
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-white/70"
          >
            <X size={18} />
          </button>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
            <ShieldCheck size={32} />
          </div>
          <h2 id="cert-modal-title" className="text-lg font-bold">Certificado de Autenticidade</h2>
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
                {meta?.assinante_nome ?? 'Usuário Identificado'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-400">CPF:</span>
              <span className="text-gray-900 font-medium">
                {maskCPF(meta?.assinante_cpf)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-400">Data e Hora:</span>
              <span className="text-gray-900 font-medium">
                {new Date(meta?.data_assinatura ?? documento.created_at).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-400">IP de Conexão:</span>
              <span className="text-gray-900 font-medium font-mono text-xs">
                {meta?.conexao_ip ?? '—'}
              </span>
            </div>
            <div className="flex flex-col gap-1 py-1">
              <span className="text-gray-400 text-xs">Classificação Legal (Lei 14.063/2020):</span>
              <span className="text-blue-700 font-bold text-xs uppercase">
                {meta?.tipo ?? 'Assinatura Eletrônica Avançada'}
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
