import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { ouvirLentidao } from '@/api/http'
import type { TipoUsuario } from '@/api/tipos'
import { usePreferencias, type TamanhoLetra } from '@/contexto/Preferencias'
import { useSessao } from '@/contexto/Sessao'
import { Icone, Marca } from './Icone'
import { Dialogo, Girando } from './ui'

interface ItemMenu {
  para: string
  texto: string
  icone: string
  fim?: boolean
}

const MENUS: Record<TipoUsuario, ItemMenu[]> = {
  PACIENTE: [
    { para: '/inicio', texto: 'Início', icone: 'inicio' },
    { para: '/agendar', texto: 'Marcar', icone: 'calendarioMais' },
    { para: '/consultas', texto: 'Consultas', icone: 'consultas' },
    { para: '/clinicas', texto: 'Clínicas', icone: 'clinica' },
    { para: '/perfil', texto: 'Perfil', icone: 'usuario' },
  ],
  PROFISSIONAL: [
    { para: '/profissional', texto: 'Agenda', icone: 'calendario', fim: true },
    { para: '/profissional/horarios', texto: 'Horários', icone: 'relogio' },
    { para: '/conta', texto: 'Conta', icone: 'usuario' },
  ],
  ADMINISTRADOR: [
    { para: '/admin', texto: 'Painel', icone: 'painel', fim: true },
    { para: '/admin/consultas', texto: 'Consultas', icone: 'consultas' },
    { para: '/admin/clinicas', texto: 'Clínicas', icone: 'clinica' },
    { para: '/admin/profissionais', texto: 'Profissionais', icone: 'estetoscopio' },
    { para: '/admin/especialidades', texto: 'Especialidades', icone: 'coracao' },
    { para: '/admin/pacientes', texto: 'Pacientes', icone: 'pessoas' },
    { para: '/conta', texto: 'Conta', icone: 'usuario' },
  ],
}

// Na barra inferior do celular cabem quatro itens com rótulo legível.
// O paciente vê Clínicas pelo Início; o administrador abre o menu completo.
const NA_BARRA: Record<TipoUsuario, string[]> = {
  PACIENTE: ['/inicio', '/agendar', '/consultas', '/perfil'],
  PROFISSIONAL: ['/profissional', '/profissional/horarios', '/conta'],
  ADMINISTRADOR: ['/admin', '/admin/consultas', '/admin/clinicas'],
}

const NOME_PERFIL: Record<TipoUsuario, string> = {
  PACIENTE: 'Paciente',
  PROFISSIONAL: 'Profissional de saúde',
  ADMINISTRADOR: 'Administração',
}

export function Layout() {
  const { usuario } = useSessao()
  const local = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)
  const tipo = usuario?.tipoUsuario ?? 'PACIENTE'
  const itens = MENUS[tipo]
  const naBarra = itens.filter((i) => NA_BARRA[tipo].includes(i.para))
  const temMais = naBarra.length < itens.length && tipo !== 'PACIENTE'

  useEffect(() => {
    setMenuAberto(false)
    window.scrollTo({ top: 0 })
  }, [local.pathname])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      {/* Menu lateral, só no computador */}
      <div className="hidden bg-azul-escuro lg:block">
      <aside className="sobre-escuro sticky top-0 flex h-dvh flex-col text-white">
        <div className="flex items-center gap-3 px-6 pb-6 pt-7">
          <Marca tamanho={44} />
          <div>
            <p className="font-titulo text-[1.35rem] font-black leading-none">Saúde Fácil</p>
            <p className="mt-1 text-[0.9rem] text-white/70">{NOME_PERFIL[tipo]}</p>
          </div>
        </div>
        <nav aria-label="Menu principal" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {itens.map((i) => (
            <NavLink key={i.para} to={i.para} end={i.fim}
              className={({ isActive }) => `flex min-h-12 items-center gap-3 rounded-xl px-3 font-bold transition-colors ${isActive ? 'bg-white text-azul-escuro' : 'text-white/85 hover:bg-white/10 hover:text-white'}`}>
              <Icone nome={i.icone} /> {i.texto}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/15 px-6 py-5">
          <p className="truncate font-bold">{usuario?.nome}</p>
          <SeletorLetra escuro />
        </div>
      </aside>
      </div>

      <div className="flex min-w-0 flex-col">
        {/* Barra superior, só no celular e tablet */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-linha bg-white/95 px-4 py-2 backdrop-blur lg:hidden"
          style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
          <div className="flex min-w-0 items-center gap-2">
            <Marca tamanho={36} comFundo={false} />
            <span className="truncate font-titulo text-[min(1.2rem,22px)] font-black text-azul-escuro">Saúde Fácil</span>
          </div>
          <BotaoLetra />
        </header>

        <AvisosConexao />

        <main id="conteudo" className="espaco-barra-inferior mx-auto w-full max-w-[60rem] px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          <Outlet />
        </main>
      </div>

      {/* Barra inferior, só no celular e tablet */}
      <nav aria-label="Menu principal" className="barra-inferior fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-white px-2 pt-1.5 shadow-[0_-6px_20px_-12px_rgba(15,39,66,0.35)] lg:hidden">
        <ul className="mx-auto flex max-w-[34rem] items-stretch">
          {naBarra.map((i) => (
            <li key={i.para} className="min-w-0 flex-1">
              <NavLink to={i.para} end={i.fim}
                className={({ isActive }) => `flex min-h-[3.4rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 ${isActive ? 'text-azul-escuro' : 'text-tinta-suave'}`}>
                {({ isActive }) => (
                  <>
                    <span className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${isActive ? 'bg-sol' : ''}`}>
                      <Icone nome={i.icone} tamanho={24} espessura={isActive ? 2.4 : 2} />
                    </span>
                    <span className={`max-w-full truncate text-[15px] min-[360px]:text-[16px] ${isActive ? 'font-bold' : ''}`}>{i.texto}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
          {temMais && (
            <li className="min-w-0 flex-1">
              <button onClick={() => setMenuAberto(true)} className="flex min-h-[3.4rem] w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-tinta-suave">
                <span className="grid h-8 w-14 place-items-center"><Icone nome="menu" /></span>
                <span className="text-[15px] min-[360px]:text-[16px]">Mais</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      <Dialogo aberto={menuAberto} aoFechar={() => setMenuAberto(false)} titulo="Menu"
        acoes={<button className="min-h-12 rounded-xl px-4 font-bold text-azul" onClick={() => setMenuAberto(false)}>Fechar</button>}>
        <ul className="flex flex-col gap-1">
          {itens.map((i) => (
            <li key={i.para}>
              <NavLink to={i.para} end={i.fim}
                className={({ isActive }) => `flex min-h-12 items-center gap-3 rounded-xl px-3 font-bold ${isActive ? 'bg-azul-claro text-azul-escuro' : 'hover:bg-papel'}`}>
                <Icone nome={i.icone} /> {i.texto}
              </NavLink>
            </li>
          ))}
        </ul>
      </Dialogo>
    </div>
  )
}

// ── Tamanho da letra ──────────────────────────────────────────────────────

const ORDEM: TamanhoLetra[] = ['normal', 'grande', 'maior']
const NOME_TAMANHO: Record<TamanhoLetra, string> = { normal: 'normal', grande: 'grande', maior: 'muito grande' }

function BotaoLetra() {
  const { letra, setLetra } = usePreferencias()
  const proximo = ORDEM[(ORDEM.indexOf(letra) + 1) % ORDEM.length]
  return (
    <button onClick={() => setLetra(proximo)}
      aria-label={`Tamanho da letra: ${NOME_TAMANHO[letra]}. Tocar muda para ${NOME_TAMANHO[proximo]}.`}
      className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border-2 border-linha px-3 font-bold text-azul-escuro">
      <Icone nome="letra" tamanho={22} />
      <span className="text-[min(0.9rem,17px)] max-[359px]:sr-only">Letra</span>
      <span aria-hidden="true" className="flex gap-0.5">
        {ORDEM.map((t) => <span key={t} className={`h-1.5 w-1.5 rounded-full ${ORDEM.indexOf(t) <= ORDEM.indexOf(letra) ? 'bg-azul' : 'bg-linha'}`} />)}
      </span>
    </button>
  )
}

export function SeletorLetra({ escuro = false }: { escuro?: boolean }) {
  const { letra, setLetra } = usePreferencias()
  return (
    <fieldset className="mt-3">
      <legend className={`text-[0.9rem] ${escuro ? 'text-white/75' : 'font-bold text-tinta'}`}>Tamanho da letra</legend>
      <div className="mt-1.5 flex gap-2">
        {ORDEM.map((t, i) => (
          <button key={t} onClick={() => setLetra(t)} aria-pressed={letra === t} aria-label={`Letra ${NOME_TAMANHO[t]}`}
            className={`grid min-h-12 min-w-12 flex-1 place-items-center rounded-xl border-2 font-titulo font-black ${
              letra === t
                ? escuro ? 'border-sol bg-sol text-azul-escuro' : 'border-azul bg-azul text-white'
                : escuro ? 'border-white/30 text-white' : 'border-linha-forte bg-white text-azul-escuro'
            }`}
            style={{ fontSize: `${[1, 1.25, 1.5][i]}rem` }}>
            A
          </button>
        ))}
      </div>
    </fieldset>
  )
}

// ── Avisos de conexão ─────────────────────────────────────────────────────

export function AvisosConexao() {
  const [lentas, setLentas] = useState(0)
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => ouvirLentidao(setLentas), [])
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (!online) {
    return (
      <div role="status" className="flex items-center gap-2 bg-tinta px-4 py-2.5 text-white">
        <Icone nome="semInternet" /> Você está sem internet. Assim que voltar, tente de novo.
      </div>
    )
  }
  if (lentas > 0) {
    return (
      <div role="status" className="flex items-center gap-2 bg-sol-fundo px-4 py-2.5 text-aviso">
        <Girando /> Conectando ao servidor. Na primeira vez do dia isso pode levar até um minuto.
      </div>
    )
  }
  return null
}

export function Conteudo({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[60rem]">{children}</div>
}
