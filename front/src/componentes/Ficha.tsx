import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Agendamento } from '@/api/tipos'
import { partes, quandoRelativo } from '@/utils/datas'
import { Icone } from './Icone'
import { SeloStatus } from './ui'

/**
 * A consulta marcada, desenhada como a ficha de papel que a pessoa recebe
 * na recepção. Data e hora ficam no tamanho maior da tela, porque são a
 * informação que a pessoa precisa lembrar.
 */
export function Ficha({ consulta, para, nova = false, fundo, children, mostrarPaciente = false }: {
  consulta: Agendamento
  para?: string
  nova?: boolean
  fundo?: string
  children?: ReactNode
  mostrarPaciente?: boolean
}) {
  const p = partes(consulta.dataHora)
  const relativo = quandoRelativo(consulta.dataHora)
  const estado = consulta.status === 'CANCELADO' ? 'cancelada' : consulta.status === 'REALIZADO' ? 'realizada' : 'ativa'
  const ativa = estado === 'ativa'

  const corpo = (
    <>
      <div className="ficha-canhoto flex flex-col items-center justify-center px-1 py-4 text-center">
        <span className="text-[0.95rem] font-bold capitalize">{p.diaSemanaCurto}</span>
        <span className="font-titulo text-[min(2.4rem,46px)] font-black leading-none">{p.dia}</span>
        <span className="text-[0.95rem] font-bold capitalize">{p.mesCurto}</span>
      </div>
      <div className="min-w-0 p-4 pl-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={`font-titulo text-[2rem] font-black leading-none ${ativa ? 'text-azul-escuro' : 'text-tinta-suave line-through decoration-2'}`}>
            {p.hora}
          </span>
          {ativa && relativo && <span className="whitespace-nowrap rounded-full bg-sol-fundo px-2.5 py-0.5 text-[0.9rem] font-bold text-aviso">{relativo}</span>}
          {!ativa || consulta.status === 'CONFIRMADO' ? <SeloStatus status={consulta.status} curto /> : null}
        </div>
        <p className="mt-2 font-bold text-[1.1rem] leading-snug">{consulta.especialidade.nome}</p>
        {mostrarPaciente && (
          <p className="flex items-center gap-1.5 font-bold text-azul"><Icone nome="usuario" tamanho="1.05em" />{consulta.paciente.nome}</p>
        )}
        <p className="flex items-start gap-1.5 text-tinta-suave"><Icone nome="estetoscopio" tamanho="1.05em" className="mt-1" />{consulta.profissional.nome}</p>
        <p className="flex items-start gap-1.5 text-tinta-suave"><Icone nome="clinica" tamanho="1.05em" className="mt-1" />{consulta.clinica.nome}</p>
        {children}
      </div>
    </>
  )

  const estilo = fundo ? ({ ['--fundo-ficha' as string]: fundo } as React.CSSProperties) : undefined
  const classes = `ficha ${nova ? 'ficha-nova' : ''}`

  if (para) {
    return (
      <Link to={para} className={`${classes} transition-transform hover:-translate-y-0.5`} data-estado={estado} style={estilo}
        aria-label={`Consulta de ${consulta.especialidade.nome}, ${p.diaSemana}, ${p.dia} de ${p.mesNome}, às ${p.hora}. Ver detalhes.`}>
        {corpo}
      </Link>
    )
  }
  return <article className={classes} data-estado={estado} style={estilo}>{corpo}</article>
}
