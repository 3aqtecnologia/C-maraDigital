import { PageHeader } from '@/components/layout/PageHeader'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { useLeis } from '@/hooks/useLeis'
import { AlertCircle, ArrowLeft, Save } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function LeiNova() {
  const navigate = useNavigate()
  const { criarLei } = useLeis()

  const [numero, setNumero] = useState('')
  const [ano, setAno] = useState(new Date().getFullYear().toString())
  const [esfera, setEsfera] = useState('Lei Ordinária')
  const [ementa, setEmenta] = useState('')
  const [texto, setTexto] = useState('')
  const [dataPublicacao, setDataPublicacao] = useState(new Date().toISOString().split('T')[0])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSalvar() {
    if (!numero.trim() || !ano.trim() || !esfera.trim() || !ementa.trim() || !texto.trim() || !dataPublicacao) {
      setError('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    setSaving(true)
    setError(null)

    const resultado = await criarLei({
      numero: numero.trim(),
      ano: parseInt(ano.trim(), 10),
      esfera: esfera.trim(),
      ementa: ementa.trim(),
      texto_compilado: texto,
      status: 'em_vigor',
      data_publicacao: dataPublicacao
    })

    if (!resultado) {
      setError('Erro ao salvar a lei. Verifique os dados ou se já existe uma lei com este número/ano.')
      setSaving(false)
      return
    }

    navigate(`/backoffice/leis/${resultado.id}`)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Nova Lei (LeisGov)"
        description="Publicação e Compilação de Legislação Municipal"
        actions={
          <button
            onClick={() => navigate('/backoffice/leis')}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={15} />
            Voltar
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl max-auto space-y-6">

          <section className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Dados da Norma</h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Esfera Jurídica <span className="text-red-500">*</span>
                </label>
                <select className="input" value={esfera} onChange={e => setEsfera(e.target.value)}>
                  <option value="Lei Orgânica">Lei Orgânica</option>
                  <option value="Lei Ordinária">Lei Ordinária</option>
                  <option value="Lei Complementar">Lei Complementar</option>
                  <option value="Emenda à Lei Orgânica">Emenda à Lei Orgânica</option>
                  <option value="Decreto Legislativo">Decreto Legislativo</option>
                  <option value="Resolução">Resolução</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Número <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: 1234"
                  value={numero}
                  onChange={e => setNumero(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ano <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="input"
                  placeholder="Ex: 2025"
                  value={ano}
                  onChange={e => setAno(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Data de Publicação <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="input max-w-xs"
                  value={dataPublicacao}
                  onChange={e => setDataPublicacao(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ementa <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                className="input resize-none"
                placeholder="Resumo oficial da norma"
                value={ementa}
                onChange={e => setEmenta(e.target.value)}
                maxLength={500}
              />
            </div>
          </section>

          <section className="card space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Texto Compilado (Rich Text) <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all">
                <RichTextEditor
                  content={texto}
                  onChange={setTexto}
                  placeholder={`Insira aqui o texto integral da norma...`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                O formato do texto será preservado para o Diário Oficial e Consulta Pública.
              </p>
            </div>
          </section>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-start">
            <button
              type="button"
              disabled={saving}
              onClick={handleSalvar}
              className="btn-primary flex items-center gap-2 text-sm justify-center min-w-[150px]"
            >
              {saving ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : <Save size={16} />}
              Publicar Norma
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
