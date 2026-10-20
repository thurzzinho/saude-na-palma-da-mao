import { useCallback, useEffect, useRef, useState } from 'react'
import { mensagemDeErro } from '@/api/erros'

/**
 * Carrega dados da API e expõe estado de carregamento, erro e uma função
 * para recarregar. Ignora respostas antigas quando as dependências mudam.
 */
export function useCarregar<T>(buscar: () => Promise<T>, dependencias: unknown[] = []) {
  const [dados, setDados] = useState<T | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const pedido = useRef(0)

  const carregar = useCallback(async () => {
    const meu = ++pedido.current
    setCarregando(true)
    setErro(null)
    try {
      const r = await buscar()
      if (meu === pedido.current) setDados(r)
    } catch (e) {
      if (meu === pedido.current) setErro(mensagemDeErro(e))
    } finally {
      if (meu === pedido.current) setCarregando(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias)

  useEffect(() => {
    carregar()
  }, [carregar])

  return { dados, carregando, erro, recarregar: carregar, setDados }
}
