import { useCallback, useEffect, useRef, useState } from 'react'
import { comoErroApi, type ErroApi } from '../api/erros'

/**
 * Carrega dados da API e expõe os estados de carregamento e erro.
 * Exemplo: const { dados, carregando, erro, recarregar } = useCarregar(() => clinicas.listar(), [])
 */
export function useCarregar<T>(buscar: () => Promise<T>, deps: unknown[]) {
  const [dados, setDados] = useState<T | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<ErroApi | null>(null)
  const chamada = useRef(0)

  const recarregar = useCallback(async () => {
    const minha = ++chamada.current
    setCarregando(true)
    setErro(null)
    try {
      const r = await buscar()
      if (minha === chamada.current) setDados(r)
    } catch (e) {
      if (minha === chamada.current) setErro(comoErroApi(e))
    } finally {
      if (minha === chamada.current) setCarregando(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { recarregar() }, [recarregar])

  return { dados, setDados, carregando, erro, recarregar }
}
