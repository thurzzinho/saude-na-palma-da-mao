// Utilidades de data e hora.
// Regra v3, seção 0: banco e API em UTC/ISO 8601 com fuso, exibição em America/Recife.
// Recife usa UTC-3 o ano todo, sem horário de verão.

export const FUSO = 'America/Recife'
const OFFSET = '-03:00'

/** "2026-10-20" + "08:00" -> "2026-10-20T08:00:00-03:00" */
export function montarDataHora(data: string, hora: string): string {
  return `${data}T${hora}:00${OFFSET}`
}

function partes(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const f = new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'long', hourCycle: 'h23',
  })
  const obj: Record<string, string> = {}
  for (const p of f.formatToParts(d)) obj[p.type] = p.value
  return obj
}

/** 20/10/2026 */
export function formatarData(iso: string | Date): string {
  const p = partes(iso)
  return `${p.day}/${p.month}/${p.year}`
}

/** 08:00 */
export function formatarHora(iso: string | Date): string {
  const p = partes(iso)
  return `${p.hour}:${p.minute}`
}

/** Segunda-feira */
export function diaDaSemana(iso: string | Date): string {
  const w = partes(iso).weekday
  return w.charAt(0).toUpperCase() + w.slice(1)
}

/** Data de hoje em Recife no formato YYYY-MM-DD */
export function hojeEmRecife(desloc = 0): string {
  const d = new Date(Date.now() + desloc * 86400000)
  const p = partes(d)
  return `${p.year}-${p.month}-${p.day}`
}

/** "2026-10-20" (data pura) -> objeto Date ao meio-dia em Recife, para formatar sem erro de fuso */
export function dataPura(data: string): Date {
  return new Date(`${data}T12:00:00${OFFSET}`)
}

/** "2026-10-20" -> "20/10/2026" */
export function formatarDataPura(data: string): string {
  const [a, m, d] = data.split('-')
  return `${d}/${m}/${a}`
}

/** Horas que faltam até a data informada (negativo se já passou) */
export function horasAte(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / 3600000
}

export function ehFuturo(iso: string): boolean {
  return new Date(iso).getTime() > Date.now()
}

/** Data AAAA-MM-DD em Recife de um instante ISO */
export function dataEmRecife(iso: string | Date): string {
  const p = partes(iso)
  return `${p.year}-${p.month}-${p.day}`
}
