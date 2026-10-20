import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { definirAoExpirarSessao, definirToken } from '@/api/http'
import { autenticacao } from '@/api/servicos'
import type { NovoPaciente, UsuarioSessao } from '@/api/tipos'

// A sessão fica guardada no aparelho para a pessoa não precisar digitar a
// senha a cada visita: "lembrar senha" apareceu em 6 de 18 respostas da
// pesquisa. O token expira no prazo definido pela API (JWT_EXPIRACAO).
const CHAVE = 'saude-facil:sessao'

interface SessaoGuardada {
  token: string
  usuario: UsuarioSessao
}

interface ValorSessao {
  usuario: UsuarioSessao | null
  entrar: (identificador: string, senha: string) => Promise<UsuarioSessao>
  cadastrar: (dados: NovoPaciente) => Promise<UsuarioSessao>
  sair: (aviso?: string) => void
  atualizarNome: (nome: string) => void
  aviso: string | null
  limparAviso: () => void
}

const Contexto = createContext<ValorSessao | null>(null)

function expirado(token: string) {
  try {
    const carga = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof carga.exp === 'number' && carga.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

function lerGuardada(): SessaoGuardada | null {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (!bruto) return null
    const s = JSON.parse(bruto) as SessaoGuardada
    if (!s.token || expirado(s.token)) {
      localStorage.removeItem(CHAVE)
      return null
    }
    return s
  } catch {
    return null
  }
}

function guardar(s: SessaoGuardada | null) {
  try {
    if (s) localStorage.setItem(CHAVE, JSON.stringify(s))
    else localStorage.removeItem(CHAVE)
  } catch {
    // Navegação privada pode bloquear o armazenamento. A sessão segue em memória.
  }
}

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<SessaoGuardada | null>(() => {
    const s = lerGuardada()
    definirToken(s?.token ?? null)
    return s
  })
  const [aviso, setAviso] = useState<string | null>(null)

  const aplicar = useCallback((s: SessaoGuardada | null) => {
    definirToken(s?.token ?? null)
    guardar(s)
    setSessao(s)
  }, [])

  const sair = useCallback((mensagem?: string) => {
    aplicar(null)
    setAviso(mensagem ?? null)
  }, [aplicar])

  useEffect(() => {
    definirAoExpirarSessao(() => sair('Por segurança, sua sessão terminou. Entre de novo para continuar.'))
  }, [sair])

  const entrar = useCallback(async (identificador: string, senha: string) => {
    const r = await autenticacao.entrar(identificador, senha)
    aplicar({ token: r.token, usuario: r.usuario })
    setAviso(null)
    return r.usuario
  }, [aplicar])

  const cadastrar = useCallback(async (dados: NovoPaciente) => {
    const r = await autenticacao.cadastrar(dados)
    aplicar({ token: r.token, usuario: r.usuario })
    return r.usuario
  }, [aplicar])

  const atualizarNome = useCallback((nome: string) => {
    setSessao((s) => {
      if (!s) return s
      const nova = { ...s, usuario: { ...s.usuario, nome } }
      guardar(nova)
      return nova
    })
  }, [])

  const valor = useMemo<ValorSessao>(() => ({
    usuario: sessao?.usuario ?? null,
    entrar, cadastrar, sair, atualizarNome,
    aviso, limparAviso: () => setAviso(null),
  }), [sessao, entrar, cadastrar, sair, atualizarNome, aviso])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useSessao() {
  const v = useContext(Contexto)
  if (!v) throw new Error('useSessao precisa estar dentro de ProvedorSessao')
  return v
}

export function rotaInicial(tipo: UsuarioSessao['tipoUsuario'] | undefined) {
  if (tipo === 'PROFISSIONAL') return '/profissional'
  if (tipo === 'ADMINISTRADOR') return '/admin'
  if (tipo === 'PACIENTE') return '/inicio'
  return '/'
}
