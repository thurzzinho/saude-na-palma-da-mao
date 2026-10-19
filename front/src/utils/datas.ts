// A API trafega datas em UTC (ISO 8601). Tudo que aparece na tela é
// convertido para o fuso das clínicas, America/Recife (UTC-3, sem horário de
// verão), como pede a seção 0 do documento de regras v3.

export const FUSO = 'America/Recife'

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const formatadorPartes = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

export interface PartesData {
  data: string // AAAA-MM-DD no fuso do Recife
  hora: string // HH:MM
  dia: number
  mes: number // 1 a 12
  ano: number
  diaSemana: string
  diaSemanaCurto: string
  mesNome: string
  mesCurto: string
}

function partesDeDataIso(dataIso: string): Omit<PartesData, 'hora'> {
  const [a, m, d] = dataIso.split('-').map(Number)
  const semana = new Date(Date.UTC(a, m - 1, d)).getUTCDay()
  return {
    data: dataIso, dia: d, mes: m, ano: a,
    diaSemana: DIAS[semana], diaSemanaCurto: DIAS_CURTOS[semana],
    mesNome: MESES[m - 1], mesCurto: MESES_CURTOS[m - 1],
  }
}

/** Converte um instante (ISO UTC) em partes de data e hora no Recife. */
export function partes(instante: string | Date): PartesData {
  const valores: Record<string, string> = {}
  for (const p of formatadorPartes.formatToParts(new Date(instante))) valores[p.type] = p.value
  const data = `${valores.year}-${valores.month}-${valores.day}`
  return { ...partesDeDataIso(data), hora: `${valores.hour}:${valores.minute}` }
}

/** Partes de uma data sem hora (AAAA-MM-DD). */
export function partesDia(dataIso: string) {
  return partesDeDataIso(dataIso)
}

export function hojeRecife(): string {
  return partes(new Date()).data
}

export function somarDias(dataIso: string, dias: number): string {
  const [a, m, d] = dataIso.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10)
}

/** "quinta-feira, 19 de outubro" */
export function dataPorExtenso(instanteOuDia: string, comAno = false): string {
  const p = instanteOuDia.length > 10 ? partes(instanteOuDia) : partesDia(instanteOuDia)
  return `${p.diaSemana}, ${p.dia} de ${p.mesNome}${comAno ? ` de ${p.ano}` : ''}`
}

/** "19/10/2026" */
export function dataCurta(instanteOuDia: string): string {
  const p = instanteOuDia.length > 10 ? partes(instanteOuDia) : partesDia(instanteOuDia)
  return `${String(p.dia).padStart(2, '0')}/${String(p.mes).padStart(2, '0')}/${p.ano}`
}

export function hora(instante: string): string {
  return partes(instante).hora
}

/** "hoje", "amanhã", "em 5 dias" ou vazio quando já passou. */
export function quandoRelativo(instante: string): string {
  const hoje = hojeRecife()
  const dia = partes(instante).data
  const diferenca = Math.round((Date.parse(dia) - Date.parse(hoje)) / 86_400_000)
  if (diferenca === 0) return 'hoje'
  if (diferenca === 1) return 'amanhã'
  if (diferenca > 1) return `daqui a ${diferenca} dias`
  return ''
}

/** Prazo final para o paciente cancelar pelo app (regras v3, seção 3: 8 horas). */
export const HORAS_PRAZO_CANCELAMENTO = 8
export function prazoCancelamento(instante: string): Date {
  return new Date(Date.parse(instante) - HORAS_PRAZO_CANCELAMENTO * 3_600_000)
}

export function ehFuturo(instante: string) {
  return Date.parse(instante) > Date.now()
}

export function idade(dataNascimento: string | null | undefined): number | null {
  if (!dataNascimento) return null
  const [a, m, d] = dataNascimento.slice(0, 10).split('-').map(Number)
  const hoje = partesDia(hojeRecife())
  let anos = hoje.ano - a
  if (hoje.mes < m || (hoje.mes === m && hoje.dia < d)) anos -= 1
  return anos
}

/** Período do dia para agrupar horários: manhã, tarde ou noite. */
export function periodo(instante: string): 'Manhã' | 'Tarde' | 'Noite' {
  const h = Number(partes(instante).hora.slice(0, 2))
  if (h < 12) return 'Manhã'
  if (h < 18) return 'Tarde'
  return 'Noite'
}
