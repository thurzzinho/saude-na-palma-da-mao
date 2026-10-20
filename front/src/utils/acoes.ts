// Ações que levam a consulta para fora do app: lembrete no calendário do
// celular, rota no mapa, ligação para a clínica e envio para um familiar.
// Respondem a três desejos da pesquisa: lembrete antes da consulta (10 de 18),
// ver o endereço e como chegar (9 de 18) e um familiar acompanhar (6 de 18).

import type { Agendamento } from '@/api/tipos'
import { dataPorExtenso, hora } from './datas'
import { somenteDigitos } from './formatos'

/** Link do Google Maps que busca o endereço (API de URLs do Google Maps, sem chave). */
export function urlMapa(endereco: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`
}

export function urlTelefone(telefone: string | null | undefined) {
  const d = somenteDigitos(telefone)
  return d ? `tel:+55${d}` : ''
}

function textoDaConsulta(a: Agendamento) {
  return [
    `Consulta de ${a.especialidade.nome} marcada pelo Saúde Fácil`,
    `${dataPorExtenso(a.dataHora, true)}, às ${hora(a.dataHora)}`,
    `Com ${a.profissional.nome}`,
    `${a.clinica.nome}: ${a.clinica.endereco}`,
    'Chegue 15 minutos antes e leve um documento com foto.',
  ].join('\n')
}

/**
 * Compartilha pelo menu do próprio celular (Web Share API). Onde ele não
 * existe, abre o WhatsApp com o texto pronto.
 */
export async function compartilharConsulta(a: Agendamento): Promise<'compartilhado' | 'whatsapp' | 'cancelado'> {
  const texto = textoDaConsulta(a)
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Minha consulta', text: texto })
      return 'compartilhado'
    } catch {
      return 'cancelado'
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
  return 'whatsapp'
}

function dataIcs(instante: number) {
  return new Date(instante).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escaparIcs(t: string) {
  return t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/**
 * Gera um arquivo de calendário (.ics, RFC 5545) com dois alarmes: na véspera
 * e duas horas antes. Ao abrir o arquivo, o celular oferece "Adicionar à agenda".
 * A duração de 30 minutos é a duração padrão das janelas na API.
 */
export function baixarLembrete(a: Agendamento) {
  const inicio = Date.parse(a.dataHora)
  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Saude Facil//Agendamento//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:consulta-${a.idAgendamento}@saude-facil`,
    `DTSTAMP:${dataIcs(Date.now())}`,
    `DTSTART:${dataIcs(inicio)}`,
    `DTEND:${dataIcs(inicio + 30 * 60_000)}`,
    `SUMMARY:${escaparIcs(`Consulta de ${a.especialidade.nome}`)}`,
    `LOCATION:${escaparIcs(`${a.clinica.nome}, ${a.clinica.endereco}`)}`,
    `DESCRIPTION:${escaparIcs(textoDaConsulta(a))}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Consulta amanhã', 'TRIGGER:-P1D', 'END:VALARM',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Consulta daqui a 2 horas', 'TRIGGER:-PT2H', 'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  const arquivo = new Blob([linhas.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = url
  link.download = `consulta-${a.idAgendamento}.ics`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
