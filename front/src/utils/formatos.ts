// Máscaras e validações simples. O banco guarda CPF, CNPJ e CEP só com dígitos.

export const soDigitos = (v: string) => v.replace(/\D/g, '')

export function mascararCpf(v: string) {
  const d = soDigitos(v).slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function mascararCnpj(v: string) {
  const d = soDigitos(v).slice(0, 14)
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function mascararCep(v: string) {
  const d = soDigitos(v).slice(0, 8)
  return d.replace(/(\d{5})(\d{1,3})$/, '$1-$2')
}

export function mascararTelefone(v: string) {
  const d = soDigitos(v).slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

/** Valida os dígitos verificadores do CPF (algoritmo da Receita Federal). */
export function cpfValido(v: string) {
  const c = soDigitos(v)
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
  const calc = (n: number) => {
    let soma = 0
    for (let i = 0; i < n; i++) soma += Number(c[i]) * (n + 1 - i)
    const r = (soma * 10) % 11
    return r === 10 ? 0 : r
  }
  return calc(9) === Number(c[9]) && calc(10) === Number(c[10])
}

/** Valida os dígitos verificadores do CNPJ. */
export function cnpjValido(v: string) {
  const c = soDigitos(v)
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false
  const calc = (n: number) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let soma = 0
    for (let i = 0; i < n; i++) soma += Number(c[i]) * pesos[i]
    const r = soma % 11
    return r < 2 ? 0 : 11 - r
  }
  return calc(12) === Number(c[12]) && calc(13) === Number(c[13])
}

export const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export function iniciais(nome: string) {
  return nome
    .replace(/^(Dr|Dra)\.\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('')
}

const CONECTORES = new Set(['da', 'de', 'do', 'das', 'dos', 'e'])

/** "Maria José da Silva" -> "Maria José"; "João da Silva" -> "João" */
export function primeiroNome(nome: string) {
  const partes = nome.trim().replace(/^(Dr|Dra)\.\s+/i, '').split(/\s+/)
  if (partes.length > 1 && !CONECTORES.has(partes[1].toLowerCase())) return `${partes[0]} ${partes[1]}`
  return partes[0] ?? nome
}

export const normalizar = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export function enderecoClinica(c: { logradouro: string | null; numero: string | null; bairro: string | null; cidade: string; uf: string }) {
  const rua = [c.logradouro, c.numero].filter(Boolean).join(', ')
  return [rua, c.bairro, `${c.cidade} - ${c.uf}`].filter(Boolean).join(', ')
}
