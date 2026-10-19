// Máscaras e validações de formulário. A API valida de novo; aqui a ideia é
// avisar a pessoa antes de enviar, no próprio campo.

export const somenteDigitos = (v: string | null | undefined) => String(v ?? '').replace(/\D/g, '')

export function mascaraCpf(v: string) {
  const d = somenteDigitos(v).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
}

/** Mesmo cálculo de dígito verificador usado pela API (src/validacao.js). */
export function cpfValido(v: string) {
  const cpf = somenteDigitos(v)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const digito = (n: number) => {
    let soma = 0
    for (let i = 0; i < n; i += 1) soma += Number(cpf[i]) * (n + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10])
}

/** "***.982.247-**": mostra só o miolo, como recomenda a pesquisa (receio com o CPF). */
export function cpfOculto(cpf: string | null | undefined) {
  const d = somenteDigitos(cpf)
  if (d.length !== 11) return ''
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`
}

export function mascaraTelefone(v: string) {
  const d = somenteDigitos(v).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function telefoneLegivel(v: string | null | undefined) {
  const d = somenteDigitos(v)
  return d ? mascaraTelefone(d) : ''
}

export const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

export function mascaraData(v: string) {
  const d = somenteDigitos(v).slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

/** "12/03/1958" para "1958-03-12". Devolve null se a data não existir ou for futura. */
export function dataBrParaIso(v: string): string | null {
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const iso = `${m[3]}-${m[2]}-${m[1]}`
  const data = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== iso) return null
  if (data.getTime() > Date.now() || Number(m[3]) < 1900) return null
  return iso
}

export function isoParaDataBr(iso: string | null | undefined) {
  if (!iso) return ''
  const [a, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

export function mascaraCnpj(v: string) {
  const d = somenteDigitos(v).slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function mascaraCep(v: string) {
  const d = somenteDigitos(v).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export function primeiroNome(nome: string | null | undefined) {
  return (nome ?? '').trim().split(/\s+/)[0] ?? ''
}

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter((p) => p.length > 2 || /^[A-ZÀ-Ú]/.test(p))
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}

/** Para comparar textos ignorando acento e maiúsculas ("Clínica" e "Clinica"). */
export const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function plural(n: number, singular: string, pluralTexto: string) {
  return `${n} ${n === 1 ? singular : pluralTexto}`
}
