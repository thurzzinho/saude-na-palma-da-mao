import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { StatusAgendamento } from '@/api/tipos'
import { Icone } from './Icone'

// ── Botões ─────────────────────────────────────────────────────────────────
// Altura mínima de 3.25 rem (58 px no tamanho normal). "Botões pequenos"
// apareceu em 7 de 18 respostas da pesquisa.

type Variante = 'primario' | 'secundario' | 'perigo' | 'confirmar' | 'discreto' | 'claro'

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-azul text-white hover:bg-azul-escuro disabled:bg-linha-forte',
  confirmar: 'bg-agua text-white hover:brightness-95 disabled:bg-linha-forte',
  secundario: 'bg-white text-azul border-2 border-azul hover:bg-azul-claro disabled:text-linha-forte disabled:border-linha',
  perigo: 'bg-perigo text-white hover:brightness-95 disabled:bg-linha-forte',
  discreto: 'bg-transparent text-azul underline underline-offset-4 decoration-2 hover:bg-azul-claro',
  claro: 'bg-white text-azul-escuro hover:bg-azul-claro',
}

const TAMANHOS = {
  grande: 'min-h-[3.25rem] px-5 text-[1.05rem]',
  medio: 'min-h-[2.75rem] px-4 text-base',
}

function classesBotao(variante: Variante, tamanho: 'grande' | 'medio', largo: boolean, extra = '') {
  return [
    'inline-flex items-center justify-center gap-2 rounded-xl font-bold text-center leading-tight',
    'transition-colors select-none disabled:cursor-not-allowed py-2',
    VARIANTES[variante], TAMANHOS[tamanho], largo ? 'w-full' : '', extra,
  ].join(' ')
}

export function Botao({ children, variante = 'primario', tamanho = 'grande', largo = false, carregando = false,
  icone, className = '', type = 'button', ...resto }: {
  children: ReactNode
  variante?: Variante
  tamanho?: 'grande' | 'medio'
  largo?: boolean
  carregando?: boolean
  icone?: string
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={classesBotao(variante, tamanho, largo, className)}
      disabled={carregando || resto.disabled} aria-busy={carregando || undefined} {...resto}>
      {carregando ? <Girando /> : icone ? <Icone nome={icone} tamanho="1.25em" /> : null}
      <span>{children}</span>
    </button>
  )
}

export function BotaoLink({ children, para, variante = 'primario', tamanho = 'grande', largo = false, icone, className = '', externo = false }: {
  children: ReactNode
  para: string
  variante?: Variante
  tamanho?: 'grande' | 'medio'
  largo?: boolean
  icone?: string
  className?: string
  externo?: boolean
}) {
  const conteudo = <>{icone && <Icone nome={icone} tamanho="1.25em" />}<span>{children}</span></>
  const classes = classesBotao(variante, tamanho, largo, className)
  if (externo || /^(https?:|tel:|mailto:)/.test(para)) {
    const novaAba = para.startsWith('http')
    return <a href={para} className={classes} {...(novaAba ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{conteudo}</a>
  }
  return <Link to={para} className={classes}>{conteudo}</Link>
}

export function Girando({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="1.25em" height="1.25em" className={`girando shrink-0 ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ── Formulário ────────────────────────────────────────────────────────────

export function Campo({ rotulo, ajuda, erro, children, id, opcional = false }: {
  rotulo: string
  ajuda?: ReactNode
  erro?: string | null
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode
  id?: string
  opcional?: boolean
}) {
  const gerado = useId()
  const idCampo = id ?? gerado
  const idAjuda = `${idCampo}-ajuda`
  const idErro = `${idCampo}-erro`
  const descritores = [ajuda ? idAjuda : '', erro ? idErro : ''].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label htmlFor={idCampo} className="font-bold text-tinta">
        {rotulo}{opcional && <span className="font-normal text-tinta-suave"> (opcional)</span>}
      </label>
      {ajuda && <p id={idAjuda} className="text-[0.92rem] text-tinta-suave -mt-1">{ajuda}</p>}
      {children({ id: idCampo, 'aria-describedby': descritores, 'aria-invalid': erro ? true : undefined })}
      {erro && (
        <p id={idErro} className="flex items-start gap-1.5 text-[0.95rem] font-bold text-perigo">
          <Icone nome="alerta" tamanho="1.1em" className="mt-0.5" />{erro}
        </p>
      )}
    </div>
  )
}

// ── Mensagens ─────────────────────────────────────────────────────────────

const TIPOS_AVISO = {
  info: { classe: 'bg-azul-claro border-azul/30 text-azul-escuro', icone: 'info' },
  sucesso: { classe: 'bg-agua-fundo border-agua/40 text-[#064e46]', icone: 'check' },
  alerta: { classe: 'bg-sol-fundo border-sol text-aviso', icone: 'alerta' },
  erro: { classe: 'bg-perigo-fundo border-perigo/40 text-[#7a1810]', icone: 'alerta' },
}

export function Aviso({ tipo = 'info', titulo, children, acao, className = '' }: {
  tipo?: keyof typeof TIPOS_AVISO
  titulo?: string
  children?: ReactNode
  acao?: ReactNode
  className?: string
}) {
  const t = TIPOS_AVISO[tipo]
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'} className={`flex gap-3 rounded-xl border-2 p-4 ${t.classe} ${className}`}>
      <Icone nome={t.icone} tamanho="1.4em" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        {titulo && <p className="font-bold">{titulo}</p>}
        {children && <div className={titulo ? 'mt-0.5' : ''}>{children}</div>}
        {acao && <div className="mt-3 flex flex-wrap gap-2">{acao}</div>}
      </div>
    </div>
  )
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-8 text-tinta-suave">
      <Girando className="text-azul" /> <span>{texto}</span>
    </div>
  )
}

export function ErroCarregar({ mensagem, tentarDeNovo }: { mensagem: string; tentarDeNovo: () => void }) {
  return (
    <Aviso tipo="erro" titulo="Não conseguimos carregar" acao={
      <Botao variante="secundario" tamanho="medio" icone="recarregar" onClick={tentarDeNovo}>Tentar de novo</Botao>
    }>
      {mensagem}
    </Aviso>
  )
}

export function Vazio({ icone = 'calendario', titulo, children, acao }: {
  icone?: string
  titulo: string
  children?: ReactNode
  acao?: ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border-2 border-dashed border-linha bg-white/60 p-6">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-azul-claro text-azul">
        <Icone nome={icone} tamanho={26} />
      </span>
      <div>
        <p className="font-titulo text-xl font-extrabold">{titulo}</p>
        {children && <div className="mt-1 text-tinta-suave">{children}</div>}
      </div>
      {acao}
    </div>
  )
}

// ── Status da consulta ────────────────────────────────────────────────────
// Texto e ícone, não só cor.

const STATUS: Record<StatusAgendamento, { texto: string; classe: string; icone: string }> = {
  AGENDADO: { texto: 'Marcada', classe: 'bg-azul-claro text-azul', icone: 'calendario' },
  CONFIRMADO: { texto: 'Confirmada pela clínica', classe: 'bg-agua-fundo text-agua', icone: 'check' },
  REALIZADO: { texto: 'Realizada', classe: 'bg-[#eef1f4] text-tinta-suave', icone: 'check' },
  CANCELADO: { texto: 'Cancelada', classe: 'bg-perigo-fundo text-perigo', icone: 'fechar' },
}

export function SeloStatus({ status, curto = false }: { status: StatusAgendamento; curto?: boolean }) {
  const s = STATUS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.9rem] font-bold leading-tight ${s.classe}`}>
      <Icone nome={s.icone} tamanho="1em" espessura={2.5} />
      {curto && status === 'CONFIRMADO' ? 'Confirmada' : s.texto}
    </span>
  )
}

// ── Estrutura de página ───────────────────────────────────────────────────

export function Cabecalho({ titulo, subtitulo, voltar, acoes }: {
  titulo: string
  subtitulo?: ReactNode
  voltar?: { para: string; texto?: string } | { aoClicar: () => void; texto?: string }
  acoes?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-col gap-3">
      {voltar && ('para' in voltar ? (
        <Link to={voltar.para} className="-ml-1 inline-flex min-h-11 w-fit items-center gap-1 rounded-lg pr-3 font-bold text-azul hover:bg-azul-claro">
          <Icone nome="voltar" /> {voltar.texto ?? 'Voltar'}
        </Link>
      ) : (
        <button onClick={voltar.aoClicar} className="-ml-1 inline-flex min-h-11 w-fit items-center gap-1 rounded-lg pr-3 font-bold text-azul hover:bg-azul-claro">
          <Icone nome="voltar" /> {voltar.texto ?? 'Voltar'}
        </button>
      ))}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-titulo text-[1.75rem] font-extrabold text-azul-escuro sm:text-[2rem]">{titulo}</h1>
          {subtitulo && <div className="mt-1 max-w-[42rem] text-tinta-suave">{subtitulo}</div>}
        </div>
        {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
      </div>
    </header>
  )
}

export function Secao({ titulo, children, acao, className = '' }: {
  titulo: string
  children: ReactNode
  acao?: ReactNode
  className?: string
}) {
  return (
    <section className={`mt-8 ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-titulo text-[1.3rem] font-extrabold text-azul-escuro">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  )
}

export function Cartao({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-linha bg-white p-4 sm:p-5 ${className}`}>{children}</div>
}

/** Pares rótulo e valor, em uma coluna no celular e duas no computador. */
export function Dados({ itens }: { itens: { rotulo: string; valor: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {itens.map((i) => (
        <div key={i.rotulo} className="min-w-0">
          <dt className="text-[0.92rem] text-tinta-suave">{i.rotulo}</dt>
          <dd className="font-bold break-words">{i.valor || 'Não informado'}</dd>
        </div>
      ))}
    </dl>
  )
}

// ── Diálogo de confirmação ────────────────────────────────────────────────
// Usa o <dialog> nativo: prende o foco e fecha com Esc sem código extra.

export function Dialogo({ aberto, aoFechar, titulo, children, acoes }: {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  children: ReactNode
  acoes: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (aberto && !d.open) d.showModal()
    if (!aberto && d.open) d.close()
  }, [aberto])
  return (
    <dialog ref={ref} onClose={aoFechar} onCancel={aoFechar} aria-labelledby="titulo-dialogo"
      className="m-auto w-[calc(100%-2rem)] max-w-[32rem] rounded-2xl bg-white p-0 text-tinta shadow-2xl">
      {aberto && (
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <h2 id="titulo-dialogo" className="font-titulo text-[1.4rem] font-extrabold text-azul-escuro">{titulo}</h2>
          <div className="flex flex-col gap-3">{children}</div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{acoes}</div>
        </div>
      )}
    </dialog>
  )
}

/** Abas simples com estado na tela (Próximas / Anteriores). */
export function Abas<T extends string>({ valor, opcoes, aoMudar, rotulo }: {
  valor: T
  opcoes: { valor: T; texto: string; total?: number }[]
  aoMudar: (v: T) => void
  rotulo: string
}) {
  return (
    <div role="tablist" aria-label={rotulo} className="flex gap-1 rounded-xl bg-[#e3e9f0] p-1">
      {opcoes.map((o) => (
        <button key={o.valor} role="tab" aria-selected={valor === o.valor} onClick={() => aoMudar(o.valor)}
          className={`flex min-h-11 min-w-0 flex-1 flex-wrap items-center justify-center gap-x-1.5 rounded-lg px-2 py-1 font-bold leading-tight transition-colors ${valor === o.valor ? 'bg-white text-azul-escuro shadow-sm' : 'text-tinta-suave hover:text-tinta'}`}>
          <span>{o.texto}</span>{o.total !== undefined && <span className="font-normal">({o.total})</span>}
        </button>
      ))}
    </div>
  )
}
