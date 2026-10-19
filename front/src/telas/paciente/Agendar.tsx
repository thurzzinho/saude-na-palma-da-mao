import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import { agendamentos, clinicas, disponibilidades, especialidades, vinculos } from '@/api/servicos'
import type { Agendamento, Especialidade, Vinculo } from '@/api/tipos'
import { Ficha } from '@/componentes/Ficha'
import { Icone } from '@/componentes/Icone'
import { Aviso, Botao, BotaoLink, Carregando, ErroCarregar, Girando } from '@/componentes/ui'
import { useSessao } from '@/contexto/Sessao'
import { baixarLembrete, compartilharConsulta, urlMapa } from '@/utils/acoes'
import { dataPorExtenso, hojeRecife, hora, partesDia, periodo, prazoCancelamento, somarDias, partes } from '@/utils/datas'
import { normalizar } from '@/utils/formatos'
import { useCarregar } from '@/utils/useCarregar'

// Agendamento em quatro etapas, uma decisão por tela. "Muitas etapas até
// concluir" foi citada por 10 de 18 participantes; por isso cada etapa tem
// uma única pergunta, a barra mostra onde a pessoa está e nada é gravado
// antes da revisão final.

const ETAPAS = ['Especialidade', 'Profissional', 'Dia e horário', 'Revisão']
const DIAS_A_FRENTE = 60 // regras v3, seção 1
const CHAVE = 'saude-facil:agendamento'

interface Escolhas {
  etapa: 1 | 2 | 3 | 4
  especialidade: Especialidade | null
  vinculo: Vinculo | null
  dia: string | null
  horario: string | null
}

const VAZIO: Escolhas = { etapa: 1, especialidade: null, vinculo: null, dia: null, horario: null }

function lerRascunho(): Escolhas {
  try {
    const r = sessionStorage.getItem(CHAVE)
    return r ? { ...VAZIO, ...JSON.parse(r) } : VAZIO
  } catch {
    return VAZIO
  }
}

export function Agendar() {
  const [busca] = useSearchParams()
  const idEspecialidadeSugerida = Number(busca.get('especialidade')) || null
  const idClinica = Number(busca.get('clinica')) || null
  const [e, setE] = useState<Escolhas>(() => (idEspecialidadeSugerida || idClinica ? VAZIO : lerRascunho()))
  const [marcada, setMarcada] = useState<Agendamento | null>(null)
  const topo = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(e))
    } catch {
      // sem armazenamento, o rascunho só não sobrevive a um recarregamento
    }
  }, [e])

  const irPara = (etapa: Escolhas['etapa'], mudancas: Partial<Escolhas> = {}) => {
    setE((atual) => ({ ...atual, ...mudancas, etapa }))
    requestAnimationFrame(() => {
      topo.current?.focus()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  if (marcada) return <ConsultaMarcada consulta={marcada} />

  return (
    <div ref={topo} tabIndex={-1} className="outline-none">
      <Progresso etapa={e.etapa} />

      {e.etapa === 1 && (
        <EtapaEspecialidade idSugerida={idEspecialidadeSugerida} idClinica={idClinica} escolhida={e.especialidade}
          aoEscolher={(esp) => irPara(2, { especialidade: esp, vinculo: e.especialidade?.idEspecialidade === esp.idEspecialidade ? e.vinculo : null, dia: null, horario: null })} />
      )}
      {e.etapa === 2 && e.especialidade && (
        <EtapaProfissional especialidade={e.especialidade} idClinica={idClinica} escolhido={e.vinculo}
          aoVoltar={() => irPara(1)}
          aoEscolher={(v) => irPara(3, { vinculo: v, dia: v.idProfissionalClinica === e.vinculo?.idProfissionalClinica ? e.dia : null, horario: v.idProfissionalClinica === e.vinculo?.idProfissionalClinica ? e.horario : null })} />
      )}
      {e.etapa === 3 && e.vinculo && (
        <EtapaHorario vinculo={e.vinculo} dia={e.dia} horario={e.horario}
          aoMudar={(dia, horario) => setE((atual) => ({ ...atual, dia, horario }))}
          aoVoltar={() => irPara(2)} aoContinuar={() => irPara(4)} />
      )}
      {e.etapa === 4 && e.especialidade && e.vinculo && e.horario && (
        <EtapaRevisao escolhas={e} aoAlterar={(etapa) => irPara(etapa)}
          aoHorarioOcupado={() => irPara(3, { horario: null })}
          aoMarcar={(a) => {
            sessionStorage.removeItem(CHAVE)
            setMarcada(a)
            window.scrollTo({ top: 0 })
          }} />
      )}
      {/* Estado inválido (rascunho antigo incompleto): recomeça. */}
      {((e.etapa === 2 && !e.especialidade) || (e.etapa === 3 && !e.vinculo) || (e.etapa === 4 && (!e.vinculo || !e.horario))) && (
        <Aviso tipo="info" acao={<Botao tamanho="medio" onClick={() => setE(VAZIO)}>Começar de novo</Botao>}>
          Faltou alguma escolha. Vamos recomeçar o agendamento.
        </Aviso>
      )}
    </div>
  )
}

// ── Barra de progresso ────────────────────────────────────────────────────

function Progresso({ etapa }: { etapa: number }) {
  return (
    <div className="mb-6">
      <p className="text-tinta-suave">Marcar consulta</p>
      <p className="font-titulo text-[1.5rem] font-black text-azul-escuro" aria-live="polite">
        Etapa {etapa} de {ETAPAS.length}: {ETAPAS[etapa - 1]}
      </p>
      <ol className="mt-3 grid grid-cols-4 gap-1.5" aria-label="Etapas do agendamento">
        {ETAPAS.map((nome, i) => {
          const n = i + 1
          const estado = n < etapa ? 'feita' : n === etapa ? 'atual' : 'futura'
          return (
            <li key={nome} aria-current={estado === 'atual' ? 'step' : undefined}>
              <span className={`block h-2 rounded-full ${estado === 'futura' ? 'bg-linha' : estado === 'atual' ? 'bg-sol' : 'bg-azul'}`} />
              <span className={`mt-1.5 hidden text-[0.9rem] sm:block ${estado === 'atual' ? 'font-bold text-tinta' : 'text-tinta-suave'}`}>
                {estado === 'feita' && <span className="sr-only">Concluída: </span>}{nome}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Pergunta({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="font-titulo text-[1.6rem] font-extrabold leading-tight sm:text-[1.8rem]">{titulo}</h1>
      {children && <div className="mt-1 text-tinta-suave">{children}</div>}
    </div>
  )
}

function Opcao({ selecionada, aoClicar, children, desativada = false }: {
  selecionada: boolean
  aoClicar: () => void
  children: React.ReactNode
  desativada?: boolean
}) {
  return (
    <button type="button" onClick={aoClicar} disabled={desativada} aria-pressed={selecionada}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 bg-white p-4 text-left transition-colors ${
        selecionada ? 'border-azul bg-azul-claro' : 'border-linha hover:border-azul'
      } disabled:opacity-60`}>
      <span className="min-w-0 flex-1">{children}</span>
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${selecionada ? 'border-azul bg-azul text-white' : 'border-linha-forte text-transparent'}`}>
        <Icone nome="check" tamanho={18} espessura={3} />
      </span>
    </button>
  )
}

// ── Etapa 1 ───────────────────────────────────────────────────────────────

function EtapaEspecialidade({ idSugerida, idClinica, escolhida, aoEscolher }: {
  idSugerida: number | null
  idClinica: number | null
  escolhida: Especialidade | null
  aoEscolher: (e: Especialidade) => void
}) {
  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const [lista, clinica] = await Promise.all([
      especialidades.listar(),
      idClinica ? clinicas.obter(idClinica) : Promise.resolve(null),
    ])
    return { lista, clinica }
  }, [idClinica])
  const [filtro, setFiltro] = useState('')

  const sugerida = dados?.lista.find((x) => x.idEspecialidade === idSugerida) ?? null
  const lista = useMemo(() => {
    let l = dados?.lista ?? []
    if (dados?.clinica) {
      const daClinica = new Set(dados.clinica.especialidades.map(normalizar))
      l = l.filter((x) => daClinica.has(normalizar(x.nome)))
    }
    if (filtro) l = l.filter((x) => normalizar(x.nome).includes(normalizar(filtro)) || normalizar(x.descricao ?? '').includes(normalizar(filtro)))
    return l
  }, [dados, filtro])

  return (
    <>
      <Pergunta titulo="Com que tipo de médico você quer se consultar?">
        Toque em uma opção. Embaixo de cada nome explicamos o que esse médico cuida.
      </Pergunta>

      {sugerida && (
        <div className="mb-5 rounded-2xl border-2 border-agua bg-agua-fundo p-4">
          <p className="font-bold text-[#064e46]">Sugestão da ajuda para escolher</p>
          <div className="mt-2">
            <Opcao selecionada={escolhida?.idEspecialidade === sugerida.idEspecialidade} aoClicar={() => aoEscolher(sugerida)}>
              <span className="block font-bold text-[1.1rem]">{sugerida.nome}</span>
              {sugerida.descricao && <span className="block text-tinta-suave">{sugerida.descricao}</span>}
            </Opcao>
          </div>
          <p className="mt-2 text-[0.95rem] text-[#064e46]">Você pode escolher outra especialidade na lista abaixo.</p>
        </div>
      )}

      {dados?.clinica && (
        <Aviso tipo="info" className="mb-5">Mostrando só as especialidades atendidas em <strong>{dados.clinica.nome}</strong>.</Aviso>
      )}

      {!sugerida && (
        <Link to="/guia" className="mb-5 flex min-h-12 items-center gap-2 font-bold text-agua underline underline-offset-4">
          <Icone nome="duvida" /> Não sei qual escolher
        </Link>
      )}

      {(dados?.lista.length ?? 0) > 8 && (
        <label className="mb-4 block">
          <span className="font-bold">Procurar pelo nome</span>
          <input className="campo mt-1.5" type="search" value={filtro} onChange={(ev) => setFiltro(ev.target.value)} placeholder="Exemplo: coração, pele, olhos" />
        </label>
      )}

      {carregando && !dados ? <Carregando texto="Buscando especialidades…" /> : erro ? (
        <ErroCarregar mensagem={erro} tentarDeNovo={recarregar} />
      ) : lista.length === 0 ? (
        <Aviso tipo="info">Nenhuma especialidade encontrada{filtro ? ` para "${filtro}"` : ''}.</Aviso>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {lista.filter((x) => x.idEspecialidade !== sugerida?.idEspecialidade).map((esp) => (
            <li key={esp.idEspecialidade}>
              <Opcao selecionada={escolhida?.idEspecialidade === esp.idEspecialidade} aoClicar={() => aoEscolher(esp)}>
                <span className="block font-bold text-[1.1rem]">{esp.nome}</span>
                {esp.descricao && <span className="block text-tinta-suave">{esp.descricao}</span>}
              </Opcao>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

// ── Etapa 2 ───────────────────────────────────────────────────────────────

function EtapaProfissional({ especialidade, idClinica, escolhido, aoEscolher, aoVoltar }: {
  especialidade: Especialidade
  idClinica: number | null
  escolhido: Vinculo | null
  aoEscolher: (v: Vinculo) => void
  aoVoltar: () => void
}) {
  const { dados, carregando, erro, recarregar } = useCarregar(
    () => vinculos.buscar({ idEspecialidade: especialidade.idEspecialidade, idClinica: idClinica ?? undefined }),
    [especialidade.idEspecialidade, idClinica],
  )
  const [clinicaFiltro, setClinicaFiltro] = useState<number | 'todas'>('todas')
  const clinicasDisponiveis = useMemo(() => {
    const mapa = new Map<number, string>()
    dados?.forEach((v) => mapa.set(v.clinica.idClinica, v.clinica.nome))
    return [...mapa.entries()]
  }, [dados])
  const lista = (dados ?? []).filter((v) => clinicaFiltro === 'todas' || v.clinica.idClinica === clinicaFiltro)

  return (
    <>
      <Pergunta titulo="Com qual profissional e em qual lugar?">
        Médicos de <strong className="text-tinta">{especialidade.nome}</strong>. O mesmo médico pode aparecer em mais de uma clínica.
      </Pergunta>

      {clinicasDisponiveis.length > 1 && (
        <fieldset className="mb-5">
          <legend className="mb-2 font-bold">Mostrar clínicas</legend>
          <div className="flex flex-wrap gap-2">
            {[['todas', 'Todas'] as const, ...clinicasDisponiveis].map(([id, nome]) => (
              <button key={id} type="button" onClick={() => setClinicaFiltro(id)} aria-pressed={clinicaFiltro === id}
                className={`min-h-11 rounded-full border-2 px-4 font-bold ${clinicaFiltro === id ? 'border-azul bg-azul text-white' : 'border-linha bg-white text-tinta'}`}>
                {nome}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {carregando && !dados ? <Carregando texto="Buscando profissionais…" /> : erro ? (
        <ErroCarregar mensagem={erro} tentarDeNovo={recarregar} />
      ) : lista.length === 0 ? (
        <Aviso tipo="info" titulo="Nenhum profissional disponível" acao={<Botao variante="secundario" tamanho="medio" onClick={aoVoltar}>Escolher outra especialidade</Botao>}>
          No momento não há profissional de {especialidade.nome} atendendo{idClinica ? ' nesta clínica' : ''} pelo app.
        </Aviso>
      ) : (
        <ul className="grid gap-3">
          {lista.map((v) => (
            <li key={v.idProfissionalClinica}>
              <Opcao selecionada={escolhido?.idProfissionalClinica === v.idProfissionalClinica} aoClicar={() => aoEscolher(v)}>
                <span className="block font-bold text-[1.1rem]">{v.nome}</span>
                <span className="block text-[0.95rem] text-tinta-suave">{v.registro}</span>
                <span className="mt-2 flex items-start gap-1.5"><Icone nome="clinica" tamanho="1.1em" className="mt-1 text-agua" /><span><strong>{v.clinica.nome}</strong><br /><span className="text-tinta-suave">{v.clinica.endereco}</span></span></span>
              </Opcao>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6"><Botao variante="secundario" icone="voltar" onClick={aoVoltar}>Voltar</Botao></div>
    </>
  )
}

// ── Etapa 3 ───────────────────────────────────────────────────────────────

type Horarios = Record<string, string[] | 'erro'>

function EtapaHorario({ vinculo, dia, horario, aoMudar, aoVoltar, aoContinuar }: {
  vinculo: Vinculo
  dia: string | null
  horario: string | null
  aoMudar: (dia: string | null, horario: string | null) => void
  aoVoltar: () => void
  aoContinuar: () => void
}) {
  const primeiroDia = somarDias(hojeRecife(), 1)
  const ultimoDia = somarDias(hojeRecife(), DIAS_A_FRENTE)
  const [inicioSemana, setInicioSemana] = useState(() => (dia && dia >= primeiroDia ? semanaDe(dia, primeiroDia) : primeiroDia))
  const [horarios, setHorarios] = useState<Horarios>({})
  const [procurando, setProcurando] = useState(!dia)
  const [semVaga, setSemVaga] = useState(false)
  const id = vinculo.idProfissionalClinica

  async function carregarDias(dias: string[]) {
    const pares = await Promise.all(dias.map(async (d) => {
      try {
        const r = await disponibilidades.horariosLivres(id, d)
        return [d, r.horarios.map((h) => h.dataHora)] as const
      } catch {
        return [d, 'erro'] as const
      }
    }))
    const novos = Object.fromEntries(pares) as Horarios
    setHorarios((atual) => ({ ...atual, ...novos }))
    return novos
  }

  // Ao entrar na etapa sem dia escolhido, procura sozinho o primeiro dia com
  // vaga, semana a semana, até o limite de 60 dias.
  useEffect(() => {
    let cancelado = false
    async function procurar() {
      if (dia) {
        await carregarDias(diasDaSemana(inicioSemana, ultimoDia))
        setProcurando(false)
        return
      }
      setProcurando(true)
      let semana = primeiroDia
      while (!cancelado && semana <= ultimoDia) {
        const novos = await carregarDias(diasDaSemana(semana, ultimoDia))
        const achado = Object.entries(novos).find(([, h]) => Array.isArray(h) && h.length > 0)
        if (achado) {
          if (!cancelado) {
            setInicioSemana(semana)
            aoMudar(achado[0], null)
          }
          break
        }
        semana = somarDias(semana, 7)
      }
      if (!cancelado) {
        setProcurando(false)
        if (semana > ultimoDia) setSemVaga(true)
      }
    }
    procurar()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const dias = diasDaSemana(inicioSemana, ultimoDia)
  const faltando = dias.filter((d) => !(d in horarios))
  useEffect(() => {
    if (!procurando && faltando.length) carregarDias(faltando)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicioSemana, procurando])

  const doDia = dia ? horarios[dia] : undefined
  const grupos = Array.isArray(doDia)
    ? (['Manhã', 'Tarde', 'Noite'] as const).map((p) => ({ periodo: p, lista: doDia.filter((h) => periodo(h) === p) })).filter((g) => g.lista.length)
    : []

  return (
    <>
      <Pergunta titulo="Escolha o dia e o horário">
        Só aparecem horários livres, com pelo menos 24 horas de antecedência.
      </Pergunta>

      <p className="mb-4 flex items-start gap-2 rounded-xl bg-white p-3 ring-1 ring-linha">
        <Icone nome="estetoscopio" className="mt-0.5 text-agua" />
        <span><strong>{vinculo.nome}</strong> em {vinculo.clinica.nome}</span>
      </p>

      {procurando ? (
        <div role="status" className="flex items-center gap-3 rounded-2xl bg-white p-5 ring-1 ring-linha">
          <Girando className="text-azul" /> Procurando o primeiro dia com horário livre…
        </div>
      ) : semVaga && !dia ? (
        <Aviso tipo="alerta" titulo="Sem horário livre nos próximos 60 dias"
          acao={<Botao variante="secundario" tamanho="medio" onClick={aoVoltar}>Escolher outro profissional</Botao>}>
          A agenda de {vinculo.nome} nesta clínica está cheia ou ainda não foi aberta.
        </Aviso>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">{tituloSemana(dias)}</h2>
            <div className="flex gap-2">
              <button type="button" onClick={() => setInicioSemana(somarDias(inicioSemana, -7))} disabled={inicioSemana <= primeiroDia}
                aria-label="Semana anterior" className="grid h-12 w-12 place-items-center rounded-xl border-2 border-linha bg-white text-azul disabled:opacity-40">
                <Icone nome="voltar" />
              </button>
              <button type="button" onClick={() => setInicioSemana(somarDias(inicioSemana, 7))} disabled={somarDias(inicioSemana, 7) > ultimoDia}
                aria-label="Próxima semana" className="grid h-12 w-12 place-items-center rounded-xl border-2 border-linha bg-white text-azul disabled:opacity-40">
                <Icone nome="avancar" />
              </button>
            </div>
          </div>

          <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7" aria-label="Dias">
            {dias.map((d) => {
              const h = horarios[d]
              const total = Array.isArray(h) ? h.length : 0
              const p = partesDia(d)
              const escolhido = d === dia
              return (
                <li key={d}>
                  <button type="button" disabled={!Array.isArray(h) || total === 0} aria-pressed={escolhido}
                    onClick={() => aoMudar(d, null)}
                    aria-label={`${dataPorExtenso(d)}: ${h === undefined ? 'carregando' : h === 'erro' ? 'não foi possível carregar' : total === 0 ? 'sem horário livre' : `${total} horários livres`}`}
                    className={`flex min-h-[5.2rem] w-full flex-col items-center justify-center rounded-xl border-2 px-1 py-2 transition-colors ${
                      escolhido ? 'border-azul bg-azul text-white' : total ? 'border-linha bg-white hover:border-azul' : 'border-transparent bg-[#e8edf2] text-tinta-suave'
                    }`}>
                    <span className="text-[0.9rem] capitalize">{p.diaSemanaCurto}</span>
                    <span className="font-titulo text-[1.5rem] font-black leading-none">{p.dia}</span>
                    <span className={`mt-1 text-[0.9rem] leading-tight ${escolhido ? 'text-white/90' : ''}`}>
                      {h === undefined ? '…' : h === 'erro' ? 'erro' : total ? `${total} livres` : 'sem vaga'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-6" aria-live="polite">
            {!dia ? (
              <p className="rounded-xl border-2 border-dashed border-linha p-4 text-tinta-suave">Toque em um dia para ver os horários.</p>
            ) : doDia === 'erro' ? (
              <ErroCarregar mensagem="Não conseguimos carregar os horários deste dia." tentarDeNovo={() => carregarDias([dia])} />
            ) : !doDia ? <Carregando texto="Buscando horários…" /> : (
              <>
                <h2 className="font-bold first-letter:uppercase">{dataPorExtenso(dia)}</h2>
                {grupos.map((g) => (
                  <fieldset key={g.periodo} className="mt-3">
                    <legend className="mb-2 text-tinta-suave">{g.periodo}</legend>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
                      {g.lista.map((h) => {
                        const sel = h === horario
                        return (
                          <button key={h} type="button" onClick={() => aoMudar(dia, h)} aria-pressed={sel}
                            className={`flex min-h-[3.25rem] items-center justify-center gap-1 rounded-xl border-2 font-titulo text-[1.25rem] font-black transition-colors ${
                              sel ? 'border-azul-escuro bg-sol text-azul-escuro' : 'border-linha bg-white text-azul-escuro hover:border-azul'
                            }`}>
                            {sel && <Icone nome="check" tamanho={18} espessura={3} />}{hora(h)}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {/* O botão de continuar só aparece, preso acima do menu, depois que um
          horário é escolhido. Assim ele não cobre os dias e horários antes disso. */}
      {horario && (
        <div className="acima-da-barra sticky z-10 mt-6 rounded-2xl bg-papel/95 py-2 backdrop-blur">
          <Botao onClick={aoContinuar} icone="avancar" largo>Continuar com {hora(horario)}</Botao>
        </div>
      )}
      <div className="mt-4"><Botao variante="secundario" icone="voltar" onClick={aoVoltar}>Voltar</Botao></div>
    </>
  )
}

function semanaDe(dia: string, primeiro: string) {
  const diferenca = Math.floor((Date.parse(dia) - Date.parse(primeiro)) / 86_400_000)
  return somarDias(primeiro, Math.floor(diferenca / 7) * 7)
}

function diasDaSemana(inicio: string, ultimo: string) {
  return Array.from({ length: 7 }, (_, i) => somarDias(inicio, i)).filter((d) => d <= ultimo)
}

function tituloSemana(dias: string[]) {
  const a = partesDia(dias[0])
  const b = partesDia(dias[dias.length - 1])
  return a.mes === b.mes ? `${a.dia} a ${b.dia} de ${a.mesNome}` : `${a.dia} de ${a.mesNome} a ${b.dia} de ${b.mesNome}`
}

// ── Etapa 4 ───────────────────────────────────────────────────────────────

function EtapaRevisao({ escolhas, aoAlterar, aoMarcar, aoHorarioOcupado }: {
  escolhas: Escolhas
  aoAlterar: (etapa: 1 | 2 | 3) => void
  aoMarcar: (a: Agendamento) => void
  aoHorarioOcupado: () => void
}) {
  const { usuario } = useSessao()
  const { especialidade, vinculo, horario } = escolhas as Required<{ [K in keyof Escolhas]: NonNullable<Escolhas[K]> }>
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<ErroApi | null>(null)
  const navegar = useNavigate()

  // Prévia da ficha com o que será gravado.
  const previa: Agendamento = {
    idAgendamento: 0, dataHora: horario, status: 'AGENDADO', observacao: null, canceladoEm: null,
    motivoCancelamento: null, criadoEm: '',
    paciente: { idPaciente: usuario?.idPaciente ?? 0, nome: usuario?.nome ?? '' },
    especialidade: { idEspecialidade: especialidade.idEspecialidade, nome: especialidade.nome },
    profissional: { idProfissionalClinica: vinculo.idProfissionalClinica, nome: vinculo.nome, registro: vinculo.registro },
    clinica: { idClinica: vinculo.clinica.idClinica, nome: vinculo.clinica.nome, endereco: vinculo.clinica.endereco },
  }
  const prazo = partes(prazoCancelamento(horario))

  async function confirmar() {
    setEnviando(true)
    setErro(null)
    try {
      const criada = await agendamentos.criar({
        idProfissionalClinica: vinculo.idProfissionalClinica,
        idEspecialidade: especialidade.idEspecialidade,
        dataHora: horario,
        observacao: observacao.trim() || undefined,
      })
      aoMarcar(criada)
    } catch (e) {
      setErro(e instanceof ErroApi ? e : new ErroApi('ERRO_DESCONHECIDO'))
      setEnviando(false)
    }
  }

  return (
    <>
      <Pergunta titulo="Confira antes de confirmar">Nada foi marcado ainda. Se algo estiver errado, toque em Alterar.</Pergunta>

      <Ficha consulta={previa} />

      <ul className="mt-4 divide-y divide-linha rounded-2xl border border-linha bg-white">
        <LinhaRevisao rotulo="Especialidade" valor={especialidade.nome} aoAlterar={() => aoAlterar(1)} />
        <LinhaRevisao rotulo="Profissional e clínica" valor={`${vinculo.nome}, ${vinculo.clinica.nome}`} aoAlterar={() => aoAlterar(2)} />
        <LinhaRevisao rotulo="Dia e horário" valor={`${dataPorExtenso(horario, true)}, às ${hora(horario)}`} aoAlterar={() => aoAlterar(3)} />
        <li className="flex items-start gap-3 p-4">
          <Icone nome="mapa" className="mt-0.5 text-agua" />
          <span><span className="block text-[0.92rem] text-tinta-suave">Endereço</span><span className="font-bold">{vinculo.clinica.endereco}</span></span>
        </li>
      </ul>

      <label className="mt-5 block">
        <span className="font-bold">Quer contar algo para o médico?</span> <span className="text-tinta-suave">(opcional)</span>
        <textarea className="campo mt-1.5 min-h-[6rem]" value={observacao} onChange={(ev) => setObservacao(ev.target.value)} maxLength={500}
          placeholder="Exemplo: dor no joelho há duas semanas" />
      </label>

      <p className="mt-4 flex items-start gap-2 text-tinta-suave">
        <Icone nome="info" className="mt-0.5 text-azul" />
        <span>Se precisar, você pode cancelar pelo app até {prazo.diaSemana}, {prazo.dia} de {prazo.mesNome}, às {prazo.hora}. Depois disso, só ligando para a clínica.</span>
      </p>

      {erro && (
        <Aviso tipo="erro" className="mt-5" acao={
          erro.codigo === 'HORARIO_INDISPONIVEL' || erro.codigo === 'PACIENTE_JA_AGENDADO' || erro.codigo === 'ANTECEDENCIA_INSUFICIENTE' || erro.codigo === 'HORARIO_INVALIDO'
            ? <Botao tamanho="medio" onClick={aoHorarioOcupado}>Escolher outro horário</Botao>
            : erro.codigo === 'LIMITE_AGENDAMENTOS_EXCEDIDO'
              ? <Botao tamanho="medio" onClick={() => navegar('/consultas')}>Ver minhas consultas</Botao>
              : undefined
        }>
          {mensagemDeErro(erro)}
        </Aviso>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
        <Botao variante="confirmar" onClick={confirmar} carregando={enviando} icone="check" className="sm:flex-1">
          {enviando ? 'Marcando…' : 'Confirmar consulta'}
        </Botao>
        <Botao variante="secundario" icone="voltar" onClick={() => aoAlterar(3)} disabled={enviando}>Voltar</Botao>
      </div>
    </>
  )
}

function LinhaRevisao({ rotulo, valor, aoAlterar }: { rotulo: string; valor: string; aoAlterar: () => void }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 p-4">
      <span className="min-w-0 flex-1">
        <span className="block text-[0.92rem] text-tinta-suave">{rotulo}</span>
        <span className="font-bold">{valor}</span>
      </span>
      <button type="button" onClick={aoAlterar} className="min-h-11 rounded-lg px-2 font-bold text-azul underline underline-offset-4 hover:bg-azul-claro">
        Alterar<span className="sr-only"> {rotulo.toLowerCase()}</span>
      </button>
    </li>
  )
}

// ── Concluído ─────────────────────────────────────────────────────────────

function ConsultaMarcada({ consulta }: { consulta: Agendamento }) {
  const [enviado, setEnviado] = useState<string | null>(null)
  return (
    <>
      <div className="mb-5 flex items-start gap-3" role="status">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-agua text-white"><Icone nome="check" tamanho={28} espessura={3} /></span>
        <div>
          <h1 className="font-titulo text-[1.8rem] font-black leading-tight text-azul-escuro">Consulta marcada</h1>
          <p className="text-tinta-suave">Ela já está em Minhas consultas. Guarde um lembrete para não esquecer.</p>
        </div>
      </div>

      <Ficha consulta={consulta} nova />

      {/* Lembrete: pedido por 10 de 18. "Esqueci a consulta" apareceu em 8 de 18. */}
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Botao variante="primario" icone="sino" onClick={() => baixarLembrete(consulta)}>Pôr lembrete no celular</Botao>
        <Botao variante="secundario" icone="compartilhar" onClick={async () => {
          const r = await compartilharConsulta(consulta)
          if (r !== 'cancelado') setEnviado('Pronto. Escolha a pessoa para quem quer mandar.')
        }}>Avisar um familiar</Botao>
        <BotaoLink para={urlMapa(`${consulta.clinica.nome}, ${consulta.clinica.endereco}`)} variante="secundario" icone="mapa">Ver como chegar</BotaoLink>
        <BotaoLink para="/consultas" variante="secundario" icone="consultas">Ver minhas consultas</BotaoLink>
      </div>
      {enviado && <p role="status" className="mt-3 text-tinta-suave">{enviado}</p>}

      <p className="mt-6 flex items-start gap-2 rounded-xl bg-sol-fundo p-4 text-aviso">
        <Icone nome="info" className="mt-0.5" />
        Chegue 15 minutos antes e leve um documento com foto.
      </p>
      <BotaoLink para="/inicio" variante="discreto" className="mt-4" icone="inicio">Voltar ao início</BotaoLink>
    </>
  )
}
