import { useAssinatura } from '@/hooks/useAssinatura'
import { useAuth } from '@/hooks/useAuth'
import type { Documento } from '@/hooks/useDocumentos'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, FileText, Loader2, ShieldCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface GovBrSignatureModalProps {
  documento: Documento
  onClose: () => void
  onSuccess: () => void
}

export function GovBrSignatureModal({ documento, onClose, onSuccess }: GovBrSignatureModalProps) {
  const [step, setStep] = useState<'login' | 'signing' | 'success'>('login')
  const { profile } = useAuth()
  const [cpf, setCpf] = useState(profile?.cpf || '')
  const [nivel, setNivel] = useState<'Prata' | 'Ouro'>('Ouro')
  const [loading, setLoading] = useState(false)
  const { assinarDocumento } = useAssinatura()

  useEffect(() => {
    const firstEl = document.querySelector<HTMLElement>('[role="dialog"] input, [role="dialog"] button')
    firstEl?.focus()
  }, [])

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
    <div
      role="presentation"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-blue-900/20 backdrop-blur-md p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="govbr-modal-title" className="bg-white rounded-3xl shadow-2xl w-full max-w-[420px] overflow-hidden">
        {/* Header Gov.br */}
        <div className="bg-[#0047b1] px-6 py-6 text-white flex flex-col items-center gap-2 relative">
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-white rounded-lg p-1">
              <ShieldCheck size={24} className="text-[#0047b1]" />
            </div>
            <span id="govbr-modal-title" className="font-bold text-xl tracking-tight">gov.br</span>
          </div>
          <p className="text-blue-100 text-[10px] font-medium uppercase tracking-widest text-center">Identidade Digital e Assinatura Eletrônica</p>
        </div>

        <div className="p-8">
          {step === 'login' && (
            <div className="space-y-6">
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
            <div className="space-y-6 text-center">
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
            <div className="space-y-6 text-center py-4">
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
