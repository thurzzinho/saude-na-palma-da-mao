import { useMemo, useState } from 'react'
import { mensagemDeErro } from '@/api/erros'
import { agenda, agendamentos } from '@/api/servicos'
import type { Agendamento, StatusAgendamento } from '@/api/tipos'
import { Icone } from '@/componentes/Icone'
import { Aviso, Botao, Cabecalho, Carregando, Dialogo, ErroCarregar, SeloStatus, Vazio } from '@/componentes/ui'
import { urlTelefone } from '@/utils/acoes'
import { dataPorExtenso, ehFuturo, hojeRecife, hora, idade, partes, somarDias } from '@/utils/datas'
import { telefoneLegivel } from '@/utils/formatos'
import { useCarregar } from '@/utils/useCarregar'

type FiltroDia = 'hoje' | 'amanha' | 'proximas' | 'dia'
type FiltroStatus = 'ativas' | StatusAgendamento | 'todas'

/**
 * Agenda usada pelo profissional (GET /agenda devolve só a dele) e, com
 * filtro por profissional, pela administração.
 */
export function ListaAgenda({ modoAdmin = false, idProfissionalClinica }: { modoAdmin?: boolean; idProfissionalClinica?: number }) {
  const [filtroDia, setFiltroDia] = useState<FiltroDia>('proximas')
  const [dia, setDia] = useState(hojeRecife())
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('ativas')
  const [acao, setAcao] = useState<{ tipo: 'confirmar' | 'realizar' | 'cancelar'; consulta: Agendamento } | null>(null)
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erroAcao, setErroAcao] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const dataConsulta = filtroDia === 'hoje' ? hojeRecife() : filtroDia === 'amanha' ? somarDias(hojeRecife(), 1) : filtroDia === 'dia' ? dia : undefined
  const statusApi = filtroStatus === 'ativas' || filtroStatus === 'todas' ? undefined : filtroStatus
  const { dados, carregando, erro, recarregar, setDados } = useCarregar(
    () => agenda.listar({ data: dataConsulta, status: statusApi, idProfissionalClinica }),
    [dataConsulta, statusApi, idProfissionalClinica],
  )

  const lista = useMemo(() => {
    let l = dados ?? []
    if (filtroStatus === 'ativas') l = l.filter((a) => a.status === 'AGENDADO' || a.status === 'CONFIRMADO')
    // "Próximas" esconde o que já passou há mais de um dia.
    if (filtroDia === 'proximas') l = l.filter((a) => Date.parse(a.dataHora) > Date.now() - 86_400_000)
    return [...l].sort((x, y) => Date.parse(x.dataHora) - Date.parse(y.dataHora))
  }, [dados, filtroStatus, filtroDia])

  const porDia = useMemo(() => {
    const grupos = new Map<string, Agendamento[]>()
    lista.forEach((a) => {
      const d = partes(a.dataHora).data
      grupos.set(d, [...(grupos.get(d) ?? []), a])
    })
    return [...grupos.entries()]
  }, [lista])

  async function executar() {
    if (!acao) return
    setSalvando(true)
    setErroAcao(null)
    try {
      const id = acao.consulta.idAgendamento
      const r = acao.tipo === 'confirmar' ? await agendamentos.confirmar(id)
        : acao.tipo === 'realizar' ? await agendamentos.marcarRealizado(id)
        : await agendamentos.cancelar(id, motivo.trim())
      setDados((atual) => atual?.map((a) => (a.idAgendamento === id ? { ...a, ...r, paciente: { ...a.paciente, ...r.paciente, telefone: a.paciente.telefone, dataNascimento: a.paciente.dataNascimento } } : a)) ?? null)
      setAviso(acao.tipo === 'confirmar' ? 'Consulta confirmada.' : acao.tipo === 'realizar' ? 'Consulta marcada como realizada.' : 'Consulta cancelada. O paciente verá o cancelamento no app.')
      setAcao(null)
      setMotivo('')
    } catch (e) {
      setErroAcao(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  const DIAS: { valor: FiltroDia; texto: string }[] = [
    { valor: 'proximas', texto: 'Próximas' },
    { valor: 'hoje', texto: 'Hoje' },
    { valor: 'amanha', texto: 'Amanhã' },
    { valor: 'dia', texto: 'Escolher dia' },
  ]

  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl border border-linha bg-white p-4 sm:p-5">
        <fieldset>
          <legend className="mb-2 font-bold">Quando</legend>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((d) => (
              <button key={d.valor} onClick={() => setFiltroDia(d.valor)} aria-pressed={filtroDia === d.valor}
                className={`min-h-11 rounded-full border-2 px-4 font-bold ${filtroDia === d.valor ? 'border-azul bg-azul text-white' : 'border-linha bg-white'}`}>
                {d.texto}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-4">
          {filtroDia === 'dia' && (
            <label className="flex flex-col gap-1.5">
              <span className="font-bold">Dia</span>
              <input type="date" className="campo w-auto" value={dia} onChange={(e) => e.target.value && setDia(e.target.value)} />
            </label>
          )}
          <label className="flex w-full flex-col gap-1.5 sm:w-auto sm:min-w-[16rem]">
            <span className="font-bold">Situação</span>
            <select className="campo" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as FiltroStatus)}>
              <option value="ativas">Marcadas e confirmadas</option>
              <option value="AGENDADO">Só aguardando confirmação</option>
              <option value="CONFIRMADO">Só confirmadas</option>
              <option value="REALIZADO">Realizadas</option>
              <option value="CANCELADO">Canceladas</option>
              <option value="todas">Todas</option>
            </select>
          </label>
        </div>
      </div>

      {aviso && <Aviso tipo="sucesso" className="mt-5">{aviso}</Aviso>}

      <div className="mt-6">
        {carregando && !dados ? <Carregando texto="Buscando a agenda…" /> : erro ? (
          <ErroCarregar mensagem={erro} tentarDeNovo={recarregar} />
        ) : porDia.length === 0 ? (
          <Vazio titulo="Nenhuma consulta neste filtro">Quando um paciente marcar, a consulta aparece aqui.</Vazio>
        ) : porDia.map(([d, consultas]) => (
          <section key={d} className="mb-8">
            <h2 className="mb-3 font-titulo text-[1.25rem] font-extrabold text-azul-escuro first-letter:uppercase">
              {dataPorExtenso(d)} <span className="font-sans text-base font-normal text-tinta-suave">({consultas.length})</span>
            </h2>
            <ul className="flex flex-col gap-3">
              {consultas.map((a) => {
                const anos = idade(a.paciente.dataNascimento)
                const ativa = a.status === 'AGENDADO' || a.status === 'CONFIRMADO'
                return (
                  <li key={a.idAgendamento} className="grid gap-3 rounded-2xl border border-linha bg-white p-4 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-start">
                    <p className="font-titulo text-[1.7rem] font-black leading-none text-azul-escuro">{hora(a.dataHora)}</p>
                    <div className="min-w-0">
                      <p className="text-[1.1rem] font-bold">{a.paciente.nome}{anos !== null && <span className="font-normal text-tinta-suave">, {anos} anos</span>}</p>
                      <p className="text-tinta-suave">{a.especialidade.nome}, {a.clinica.nome}</p>
                      {modoAdmin && <p className="text-tinta-suave">Com {a.profissional.nome}</p>}
                      {a.paciente.telefone && (
                        <a href={urlTelefone(a.paciente.telefone)} className="mt-1 inline-flex min-h-10 items-center gap-1.5 font-bold text-azul underline underline-offset-4">
                          <Icone nome="telefone" tamanho="1.05em" />{telefoneLegivel(a.paciente.telefone)}
                        </a>
                      )}
                      {a.observacao && <p className="mt-2 rounded-lg bg-papel p-2.5"><span className="text-tinta-suave">Paciente contou: </span>{a.observacao}</p>}
                      <div className="mt-2"><SeloStatus status={a.status} /></div>
                    </div>
                    {ativa && (
                      <div className="flex flex-col gap-2 sm:w-[13rem]">
                        {a.status === 'AGENDADO' && ehFuturo(a.dataHora) && (
                          <Botao tamanho="medio" variante="confirmar" icone="check" onClick={() => setAcao({ tipo: 'confirmar', consulta: a })}>Confirmar</Botao>
                        )}
                        {/* Só faz sentido depois que o atendimento começou (com 30 minutos de folga). */}
                        {Date.parse(a.dataHora) <= Date.now() + 30 * 60_000 && (
                          <Botao tamanho="medio" variante="secundario" icone="check" onClick={() => setAcao({ tipo: 'realizar', consulta: a })}>Foi realizada</Botao>
                        )}
                        {modoAdmin && ehFuturo(a.dataHora) && (
                          <Botao tamanho="medio" variante="secundario" icone="fechar" onClick={() => setAcao({ tipo: 'cancelar', consulta: a })}>Cancelar</Botao>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      {!modoAdmin && (
        <p className="mt-2 flex items-start gap-2 text-tinta-suave">
          <Icone nome="info" className="mt-0.5" />
          Para cancelar uma consulta, peça à administração. O sistema não deixa o profissional cancelar sozinho.
        </p>
      )}

      <Dialogo aberto={!!acao} aoFechar={() => { setAcao(null); setErroAcao(null) }}
        titulo={acao?.tipo === 'confirmar' ? 'Confirmar esta consulta?' : acao?.tipo === 'realizar' ? 'Marcar como realizada?' : 'Cancelar esta consulta?'}
        acoes={<>
          <Botao variante="secundario" onClick={() => setAcao(null)} disabled={salvando}>Voltar</Botao>
          <Botao variante={acao?.tipo === 'cancelar' ? 'perigo' : 'confirmar'} onClick={executar} carregando={salvando}>
            {acao?.tipo === 'confirmar' ? 'Confirmar' : acao?.tipo === 'realizar' ? 'Marcar como realizada' : 'Cancelar consulta'}
          </Botao>
        </>}>
        {acao && <p>{acao.consulta.paciente.nome}, {dataPorExtenso(acao.consulta.dataHora)}, às {hora(acao.consulta.dataHora)}.</p>}
        {acao?.tipo === 'realizar' && <p className="text-tinta-suave">Use depois que o atendimento aconteceu. Essa ação não pode ser desfeita.</p>}
        {acao?.tipo === 'cancelar' && (
          <label className="block">
            <span className="font-bold">Motivo</span> <span className="text-tinta-suave">(o paciente verá)</span>
            <textarea className="campo mt-1.5 min-h-[5rem]" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={255} />
          </label>
        )}
        {erroAcao && <Aviso tipo="erro">{erroAcao}</Aviso>}
      </Dialogo>
    </>
  )
}

export default function Agenda() {
  return (
    <>
      <Cabecalho titulo="Minha agenda" subtitulo="Consultas que os pacientes marcaram com você." />
      <ListaAgenda />
    </>
  )
}
