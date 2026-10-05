import type { UsuarioSessao } from './tipos'

// Guarda o token JWT e os dados básicos do usuário no navegador.
const CHAVE = 'spm:sessao'

export interface SessaoSalva {
  token: string
  usuario: UsuarioSessao
}

export function lerSessao(): SessaoSalva | null {
  try {
    const bruto = localStorage.getItem(CHAVE)
    return bruto ? (JSON.parse(bruto) as SessaoSalva) : null
  } catch {
    return null
  }
}

export function salvarSessao(s: SessaoSalva) {
  localStorage.setItem(CHAVE, JSON.stringify(s))
}

export function limparSessao() {
  localStorage.removeItem(CHAVE)
}
