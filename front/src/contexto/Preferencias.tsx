import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// "Letra pequena" foi a dificuldade mais citada na pesquisa (10 de 18), e
// "letra maior e tela simples" apareceu entre os recursos desejados (7 de 18).
// A escolha muda o tamanho base da página; como o layout usa rem, botões e
// espaçamentos crescem junto.
export type TamanhoLetra = 'normal' | 'grande' | 'maior'
const CHAVE = 'saude-facil:letra'

const Contexto = createContext<{ letra: TamanhoLetra; setLetra: (t: TamanhoLetra) => void } | null>(null)

function lerLetra(): TamanhoLetra {
  try {
    const v = localStorage.getItem(CHAVE)
    return v === 'grande' || v === 'maior' ? v : 'normal'
  } catch {
    return 'normal'
  }
}

export function ProvedorPreferencias({ children }: { children: ReactNode }) {
  const [letra, setLetraEstado] = useState<TamanhoLetra>(lerLetra)

  useEffect(() => {
    document.documentElement.dataset.letra = letra
  }, [letra])

  const setLetra = (t: TamanhoLetra) => {
    setLetraEstado(t)
    try {
      localStorage.setItem(CHAVE, t)
    } catch {
      // sem armazenamento, a escolha vale até fechar a aba
    }
  }

  return <Contexto.Provider value={{ letra, setLetra }}>{children}</Contexto.Provider>
}

export function usePreferencias() {
  const v = useContext(Contexto)
  if (!v) throw new Error('usePreferencias precisa estar dentro de ProvedorPreferencias')
  return v
}
