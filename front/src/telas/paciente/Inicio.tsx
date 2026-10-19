import { Link, useLocation } from 'react-router'
import { agendamentos } from '@/api/servicos'
import { Ficha } from '@/componentes/Ficha'
import { Icone } from '@/componentes/Icone'
import { Aviso, BotaoLink, Carregando, ErroCarregar, Secao } from '@/componentes/ui'
import { useSessao } from '@/contexto/Sessao'
import { baixarLembrete, urlMapa } from '@/utils/acoes'
import { dataPorExtenso, hojeRecife } from '@/utils/datas'
import { plural, primeiroNome } from '@/utils/formatos'
import { useCarregar } from '@/utils/useCarregar'
import { LIMITE_CONSULTAS, separarConsultas } from './comum'

export function Inicio() {
  const { usuario } = useSessao()
  const local = useLocation()
  const boasVindas = (local.state as { boasVindas?: boolean } | null)?.boasVindas
  const { dados, carregando, erro, recarregar } = useCarregar(() => agendamentos.meus())
  const { proximas } = separarConsultas(dados ?? [])
  const proxima = proximas[0]
  const noLimite = proximas.length >= LIMITE_CONSULTAS

  return (
    <>
      <header className="mb-6">
        <p className="text-tinta-suave">{capitalizar(dataPorExtenso(hojeRecife()))}</p>
        <h1 className="font-titulo text-[2rem] font-black text-azul-escuro">Olá, {primeiroNome(usuario?.nome)}</h1>
      </header>

      {boasVindas && (
        <Aviso tipo="sucesso" titulo="Sua conta foi criada" className="mb-6">Agora é só marcar sua primeira consulta.</Aviso>
      )}

      {/* Ação principal: 14 de 18 participantes queriam ver horários livres na hora. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link to={noLimite ? '/consultas' : '/agendar'}
          className="sobre-escuro group flex min-h-[7.5rem] flex-col justify-between rounded-2xl bg-azul p-5 text-white transition-colors hover:bg-azul-escuro">
          <Icone nome="calendarioMais" tamanho={32} className="text-sol" />
          <span>
            <span className="block font-titulo text-[1.45rem] font-black leading-tight">Marcar consulta</span>
            <span className="text-white/85">Veja os horários livres agora</span>
          </span>
        </Link>
        <Link to="/guia"
          className="flex min-h-[7.5rem] flex-col justify-between rounded-2xl border-2 border-azul/20 bg-white p-5 transition-colors hover:border-azul">
          <Icone nome="duvida" tamanho={32} className="text-agua" />
          <span>
            <span className="block font-titulo text-[1.25rem] font-black leading-tight text-azul-escuro">Não sei qual médico procurar</span>
            <span className="text-tinta-suave">Responda uma pergunta e veja uma sugestão</span>
          </span>
        </Link>
      </div>

      {noLimite && (
        <Aviso tipo="alerta" className="mt-4" titulo={`Você já tem ${LIMITE_CONSULTAS} consultas marcadas`}>
          Esse é o limite por pessoa. Para marcar outra, cancele uma das consultas que você não vai usar.
        </Aviso>
      )}

      <Secao titulo="Sua próxima consulta" acao={proximas.length > 1 && (
        <Link to="/consultas" className="min-h-11 content-center font-bold text-azul underline underline-offset-4">
          Ver todas ({proximas.length})
        </Link>
      )}>
        {carregando && !dados ? <Carregando texto="Buscando suas consultas…" /> : erro ? (
          <ErroCarregar mensagem={erro} tentarDeNovo={recarregar} />
        ) : proxima ? (
          <div className="flex flex-col gap-3">
            <Ficha consulta={proxima} para={`/consultas/${proxima.idAgendamento}`} />
            <div className="grid gap-2 min-[25rem]:grid-cols-2 sm:flex">
              <BotaoLink para={urlMapa(`${proxima.clinica.nome}, ${proxima.clinica.endereco}`)} variante="secundario" tamanho="medio" icone="mapa">Como chegar</BotaoLink>
              <button onClick={() => baixarLembrete(proxima)}
                className="inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border-2 border-azul bg-white px-4 font-bold text-azul hover:bg-azul-claro">
                <Icone nome="sino" tamanho="1.25em" /> Lembrete
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-linha bg-white/60 p-5">
            <p className="font-bold">Você não tem consulta marcada.</p>
            <p className="text-tinta-suave">Quando marcar, ela aparece aqui com dia, hora e endereço.</p>
          </div>
        )}
      </Secao>

      <Secao titulo="Atalhos">
        <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha bg-white">
          <Atalho para="/consultas" icone="consultas" titulo="Minhas consultas"
            texto={dados ? `${plural(proximas.length, 'marcada', 'marcadas')} de ${LIMITE_CONSULTAS} possíveis` : 'Marcadas e anteriores'} />
          <Atalho para="/clinicas" icone="clinica" titulo="Clínicas e endereços" texto="Horário de funcionamento, telefone e como chegar" />
          <Atalho para="/perfil" icone="letra" titulo="Meus dados e tamanho da letra" texto="Alterar telefone, e-mail e aparência" />
        </ul>
      </Secao>
    </>
  )
}

function Atalho({ para, icone, titulo, texto }: { para: string; icone: string; titulo: string; texto: string }) {
  return (
    <li>
      <Link to={para} className="flex min-h-[4.5rem] items-center gap-4 px-4 py-3 hover:bg-papel">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-azul-claro text-azul"><Icone nome={icone} /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{titulo}</span>
          <span className="block text-[0.95rem] text-tinta-suave">{texto}</span>
        </span>
        <Icone nome="avancar" className="text-tinta-suave" />
      </Link>
    </li>
  )
}

function capitalizar(t: string) {
  return t.charAt(0).toUpperCase() + t.slice(1)
}
