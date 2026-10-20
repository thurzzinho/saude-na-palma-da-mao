import { somenteDigitos } from '@/utils/formatos'

export function EtiquetaAtivo({ ativo }: { ativo: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.9rem] font-bold ${ativo ? 'bg-agua-fundo text-agua' : 'bg-[#e8edf2] text-tinta-suave'}`}>
      {ativo ? 'Ativo' : 'Desativado'}
    </span>
  )
}

/** Lista de caixas de seleção em colunas, usada para especialidades e clínicas. */
export function Marcadores<T extends number>({ legenda, opcoes, marcados, aoMudar, ajuda }: {
  legenda: string
  opcoes: { id: T; nome: string }[]
  marcados: T[]
  aoMudar: (ids: T[]) => void
  ajuda?: string
}) {
  return (
    <fieldset>
      <legend className="font-bold">{legenda}</legend>
      {ajuda && <p className="text-[0.92rem] text-tinta-suave">{ajuda}</p>}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {opcoes.map((o) => {
          const sel = marcados.includes(o.id)
          return (
            <label key={o.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2 ${sel ? 'border-azul bg-azul-claro' : 'border-linha bg-white'}`}>
              <input type="checkbox" className="h-5 w-5 shrink-0 accent-azul" checked={sel}
                onChange={(e) => aoMudar(e.target.checked ? [...marcados, o.id] : marcados.filter((x) => x !== o.id))} />
              <span className="min-w-0">{o.nome}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Dígitos verificadores do CNPJ (mesma regra da API, src/validacaoCnpj.js). */
export function cnpjValido(valor: string) {
  const c = somenteDigitos(valor)
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false
  const calc = (n: number) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const soma = pesos.reduce((s, p, i) => s + Number(c[i]) * p, 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  return calc(12) === Number(c[12]) && calc(13) === Number(c[13])
}

export const CONSELHOS = ['CRM', 'CRO', 'CRP', 'COREN', 'CREFITO', 'CRN', 'CRF', 'CREFONO']
export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
