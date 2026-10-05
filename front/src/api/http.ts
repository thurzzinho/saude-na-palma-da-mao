import { API_URL, TEMPO_LIMITE_MS, USAR_MOCK } from './config'
import { ErroApi, type CodigoErro } from './erros'
import { lerSessao } from './sessao'

export type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type Consulta = Record<string, string | number | boolean | undefined | null>

// Avisado pelo contexto de sessão quando a API responde 401.
let aoExpirarSessao: (() => void) | null = null
export function definirAoExpirarSessao(fn: () => void) {
  aoExpirarSessao = fn
}

function montarConsulta(consulta?: Consulta) {
  if (!consulta) return ''
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(consulta)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

/**
 * Ponto único de comunicação com o backend.
 * Em modo mock, a mesma chamada é atendida pelo servidor simulado em src/api/mock,
 * que aplica as regras do documento regras-agendamento-v3.
 */
export async function requisicao<T>(metodo: Metodo, rota: string, corpo?: unknown, consulta?: Consulta): Promise<T> {
  const token = lerSessao()?.token ?? null
  const caminho = rota + montarConsulta(consulta)

  if (USAR_MOCK) {
    const { atenderMock } = await import('./mock/servidor')
    try {
      return (await atenderMock(metodo, caminho, corpo, token)) as T
    } catch (e) {
      if (e instanceof ErroApi && e.status === 401 && token) aoExpirarSessao?.()
      throw e
    }
  }

  const controle = new AbortController()
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS)
  let resposta: Response
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    })
  } catch {
    throw new ErroApi('SEM_CONEXAO')
  } finally {
    clearTimeout(timer)
  }

  if (resposta.status === 204) return undefined as T

  let dados: any = null
  const texto = await resposta.text()
  if (texto) {
    try {
      dados = JSON.parse(texto)
    } catch {
      dados = null
    }
  }

  if (!resposta.ok) {
    const erro = dados?.erro
    const codigo = (erro?.codigo as CodigoErro) ?? (resposta.status === 401 ? 'NAO_AUTENTICADO' : 'ERRO_DESCONHECIDO')
    if (resposta.status === 401 && token) aoExpirarSessao?.()
    throw new ErroApi(codigo, erro?.mensagem, resposta.status, erro?.detalhes)
  }
  return dados as T
}
