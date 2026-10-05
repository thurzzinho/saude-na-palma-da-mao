import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { autenticacao, pacientes } from '../api/servicos'
import { definirAoExpirarSessao } from '../api/http'
import { lerSessao, limparSessao, salvarSessao, type SessaoSalva } from '../api/sessao'
import type { NovoPaciente, UsuarioSessao } from '../api/tipos'

interface ValorSessao {
  usuario: UsuarioSessao | null
  entrar: (login: string, senha: string) => Promise<UsuarioSessao>
  cadastrarPaciente: (dados: NovoPaciente) => Promise<UsuarioSessao>
  atualizarNome: (nome: string) => void
  sair: () => void
  sessaoExpirada: boolean
}

const Contexto = createContext<ValorSessao | null>(null)

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<SessaoSalva | null>(() => lerSessao())
  const [sessaoExpirada, setSessaoExpirada] = useState(false)

  const guardar = useCallback((s: SessaoSalva) => {
    salvarSessao(s)
    setSessao(s)
    setSessaoExpirada(false)
    return s.usuario
  }, [])

  const sair = useCallback(() => {
    limparSessao()
    setSessao(null)
  }, [])

  useEffect(() => {
    definirAoExpirarSessao(() => {
      limparSessao()
      setSessao(null)
      setSessaoExpirada(true)
    })
  }, [])

  const valor = useMemo<ValorSessao>(() => ({
    usuario: sessao?.usuario ?? null,
    sessaoExpirada,
    entrar: async (login, senha) => guardar(await autenticacao.entrar(login, senha)),
    cadastrarPaciente: async dados => guardar(await pacientes.cadastrar(dados)),
    atualizarNome: nome => {
      if (!sessao) return
      guardar({ ...sessao, usuario: { ...sessao.usuario, nome } })
    },
    sair,
  }), [sessao, sessaoExpirada, guardar, sair])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useSessao() {
  const v = useContext(Contexto)
  if (!v) throw new Error('useSessao precisa estar dentro de ProvedorSessao')
  return v
}
