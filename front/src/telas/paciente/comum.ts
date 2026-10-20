import type { Agendamento } from '@/api/tipos'
import { ehFuturo } from '@/utils/datas'

/** Limite de consultas futuras ativas por paciente (regras v3, seção 2). */
export const LIMITE_CONSULTAS = 5

export const ehAtiva = (a: Agendamento) => a.status === 'AGENDADO' || a.status === 'CONFIRMADO'

export function separarConsultas(lista: Agendamento[]) {
  const proximas = lista.filter((a) => ehAtiva(a) && ehFuturo(a.dataHora))
    .sort((x, y) => Date.parse(x.dataHora) - Date.parse(y.dataHora))
  const anteriores = lista.filter((a) => !proximas.includes(a))
    .sort((x, y) => Date.parse(y.dataHora) - Date.parse(x.dataHora))
  return { proximas, anteriores }
}
