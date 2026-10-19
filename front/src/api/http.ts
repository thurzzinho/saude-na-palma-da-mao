import { API_URL, AVISO_LENTIDAO_MS, TEMPO_LIMITE_MS } from './config'
import { ErroApi } from './erros'

export type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type Consulta = Record<string, string | number | boolean | undefined | null>

// ── Token da sessão ────────────────────────────────────────────────────────
// O contexto de sessão informa o token atual e é avisado quando a API
// responde 401 (sessão expirada), para mandar a pessoa de volta ao login.
let tokenAtual: string | null = null
let aoExpirar: ((codigo: string) => void) | null = null

export function definirToken(token: string | null) {
  tokenAtual = token
}
export function definirAoExpirarSessao(fn: (codigo: string) => void) {
  aoExpirar = fn
}

// ── Aviso de servidor lento ────────────────────────────────────────────────
// Quantas requisições estão demorando mais que o normal. A interface mostra
// "o servidor está acordando" enquanto esse número for maior que zero.
let lentas = 0
const ouvintes = new Set<(n: number) => void>()
function avisar() {
  ouvintes.forEach((fn) => fn(lentas))
}
export function ouvirLentidao(fn: (n: number) => void) {
  ouvintes.add(fn)
  return () => {
    ouvintes.delete(fn)
  }
}

function montarConsulta(consulta?: Consulta) {
  if (!consulta) return ''
  const p = new URLSearchParams()
  for (const [chave, valor] of Object.entries(consulta)) {
    if (valor !== undefined && valor !== null && valor !== '') p.set(chave, String(valor))
  }
  const texto = p.toString()
  return texto ? `?${texto}` : ''
}

/** Ponto único de comunicação com a API REST. */
export async function requisicao<T>(
  metodo: Metodo,
  rota: string,
  opcoes: { corpo?: unknown; consulta?: Consulta } = {},
): Promise<T> {
  const { corpo, consulta } = opcoes
  const controle = new AbortController()
  let ficouLenta = false
  const timerLento = setTimeout(() => {
    ficouLenta = true
    lentas += 1
    avisar()
  }, AVISO_LENTIDAO_MS)
  const timerLimite = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS)

  let resposta: Response
  try {
    resposta = await fetch(`${API_URL}${rota}${montarConsulta(consulta)}`, {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(tokenAtual ? { Authorization: `Bearer ${tokenAtual}` } : {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    })
  } catch (e) {
    throw new ErroApi(controle.signal.aborted ? 'TEMPO_ESGOTADO' : 'SEM_CONEXAO')
  } finally {
    clearTimeout(timerLento)
    clearTimeout(timerLimite)
    if (ficouLenta) {
      lentas -= 1
      avisar()
    }
  }

  if (resposta.status === 204) return undefined as T

  const texto = await resposta.text()
  let dados: any = null
  if (texto) {
    try {
      dados = JSON.parse(texto)
    } catch {
      dados = null
    }
  }

  if (!resposta.ok) {
    const codigo: string = dados?.erro?.codigo ?? (resposta.status >= 500 ? 'ERRO_INTERNO' : 'ERRO_DESCONHECIDO')
    if (resposta.status === 401 && tokenAtual && rota !== '/autenticacao/login') aoExpirar?.(codigo)
    throw new ErroApi(codigo, dados?.erro?.mensagem, resposta.status)
  }
  return dados as T
}
