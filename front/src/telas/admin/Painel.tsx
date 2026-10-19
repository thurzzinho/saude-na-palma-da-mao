import { Link } from 'react-router'
import { agenda, clinicas, especialidades, profissionais } from '@/api/servicos'
import { Icone } from '@/componentes/Icone'
import { Cabecalho, Carregando, ErroCarregar, Secao, SeloStatus } from '@/componentes/ui'
import { hojeRecife, hora, somarDias, partes } from '@/utils/datas'
import { useCarregar } from '@/utils/useCarregar'

export default function Painel() {
  const hoje = hojeRecife()
  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const [todas, cl, pr, es] = await Promise.all([
      agenda.listar(),
      clinicas.listar({ incluirInativas: true }),
      profissionais.listar({ incluirInativos: true }),
      especialidades.listar(true),
    ])
    const ativas = todas.filter((a) => a.status === 'AGENDADO' || a.status === 'CONFIRMADO')
    const daqui7 = somarDias(hoje, 7)
    return {
      deHoje: todas.filter((a) => partes(a.dataHora).data === hoje).sort((x, y) => Date.parse(x.dataHora) - Date.parse(y.dataHora)),
      semana: ativas.filter((a) => { const d = partes(a.dataHora).data; return d >= hoje && d <= daqui7 }).length,
      aguardando: ativas.filter((a) => a.status === 'AGENDADO' && Date.parse(a.dataHora) > Date.now()).length,
      clinicas: cl.filter((c) => c.ativo).length,
      profissionais: pr.filter((p) => p.ativo).length,
      especialidades: es.filter((e) => e.ativo).length,
    }
  })

  return (
    <>
      <Cabecalho titulo="Painel da administração" subtitulo="Resumo do que está acontecendo hoje." />
      {carregando && !dados ? <Carregando /> : erro || !dados ? <ErroCarregar mensagem={erro ?? ''} tentarDeNovo={recarregar} /> : (
        <>
          <ul className="grid gap-3 sm:grid-cols-3">
            <Numero para="/admin/consultas" valor={dados.deHoje.filter((a) => a.status !== 'CANCELADO').length} texto="consultas hoje" destaque />
            <Numero para="/admin/consultas" valor={dados.semana} texto="marcadas nos próximos 7 dias" />
            <Numero para="/admin/consultas" valor={dados.aguardando} texto="aguardando confirmação" />
          </ul>

          <Secao titulo="Consultas de hoje" acao={<Link to="/admin/consultas" className="min-h-11 content-center font-bold text-azul underline underline-offset-4">Ver agenda completa</Link>}>
            {dados.deHoje.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed border-linha p-5 text-tinta-suave">Nenhuma consulta marcada para hoje.</p>
            ) : (
              <ul className="divide-y divide-linha rounded-2xl border border-linha bg-white">
                {dados.deHoje.map((a) => (
                  <li key={a.idAgendamento} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4">
                    <span className="w-16 font-titulo text-[1.3rem] font-black text-azul-escuro">{hora(a.dataHora)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{a.paciente.nome}</span>
                      <span className="block text-tinta-suave">{a.especialidade.nome} com {a.profissional.nome}, {a.clinica.nome}</span>
                    </span>
                    <SeloStatus status={a.status} curto />
                  </li>
                ))}
              </ul>
            )}
          </Secao>

          <Secao titulo="Cadastros">
            <ul className="grid gap-3 sm:grid-cols-2">
              <Atalho para="/admin/clinicas" icone="clinica" titulo="Clínicas" texto={`${dados.clinicas} ativas`} />
              <Atalho para="/admin/profissionais" icone="estetoscopio" titulo="Profissionais" texto={`${dados.profissionais} ativos`} />
              <Atalho para="/admin/especialidades" icone="coracao" titulo="Especialidades" texto={`${dados.especialidades} ativas`} />
              <Atalho para="/admin/pacientes" icone="pessoas" titulo="Pacientes" texto="Consultar cadastro" />
            </ul>
          </Secao>
        </>
      )}
    </>
  )
}

function Numero({ para, valor, texto, destaque = false }: { para: string; valor: number; texto: string; destaque?: boolean }) {
  return (
    <li>
      <Link to={para} className={`flex h-full items-baseline gap-3 rounded-2xl p-5 ${destaque ? 'sobre-escuro bg-azul text-white' : 'border border-linha bg-white'}`}>
        <span className={`font-titulo text-[2.4rem] font-black leading-none ${destaque ? 'text-sol' : 'text-azul-escuro'}`}>{valor}</span>
        <span className={destaque ? 'text-white/90' : 'text-tinta-suave'}>{texto}</span>
      </Link>
    </li>
  )
}

function Atalho({ para, icone, titulo, texto }: { para: string; icone: string; titulo: string; texto: string }) {
  return (
    <li>
      <Link to={para} className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-linha bg-white p-4 hover:border-azul">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-azul-claro text-azul"><Icone nome={icone} /></span>
        <span><span className="block font-bold">{titulo}</span><span className="text-tinta-suave">{texto}</span></span>
      </Link>
    </li>
  )
}
