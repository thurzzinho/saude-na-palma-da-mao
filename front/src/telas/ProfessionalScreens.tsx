import { useMemo, useState } from 'react'
import {
  Icon, Header, Btn, Field, TextInput, StatusBadge, PortalLogin, Carregando, ErroCarregamento,
  MensagemErro, MensagemSucesso, ListaVazia, Modal,
} from '../componentes/UI'
import { agendamentos, disponibilidades, profissionais } from '../api/servicos'
import { comoErroApi } from '../api/erros'
import type { Agendamento } from '../api/tipos'
import { useSessao } from '../contexto/Sessao'
import { useCarregar } from '../utils/useCarregar'
import { dataPura, diaDaSemana, formatarData, formatarDataPura, formatarHora, hojeEmRecife } from '../utils/datas'
import { telaInicial, type Go } from '../navegacao'

const PRO_COLOR = '#1A365D'

// ─────────────────────────────────────────────
// LOGIN DO PROFISSIONAL
// ─────────────────────────────────────────────
export function ProLoginScreen({ go }: { go: Go }) {
  const { entrar } = useSessao()
  return (
    <PortalLogin
      title="Acesso Profissional"
      subtitle="Portal do profissional de saúde"
      color={PRO_COLOR}
      onLogin={async (login, senha) => {
        try {
          const u = await entrar(login, senha)
          go(telaInicial(u.tipoUsuario))
        } catch (e) {
          throw new Error(comoErroApi(e).message)
        }
      }}
      onBack={() => go('welcome')}
    />
  )
}

// Cabeçalho com abas compartilhado pelas telas do profissional
function ProShell({ go, aba, children }: { go: Go; aba: 'agenda' | 'disp'; children: React.ReactNode }) {
  const { usuario, sair } = useSessao()
  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F4F7FA' }}>
      <div className="sticky top-0 z-10" style={{ background: PRO_COLOR }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-white/70 text-sm">Bem-vindo(a),</p>
            <h2 className="text-white font-black text-xl" style={{ fontFamily: 'Nunito, sans-serif' }}>{usuario?.nome}</h2>
          </div>
          <button onClick={() => { sair(); go('welcome') }} className="py-2 px-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            Sair
          </button>
        </div>
        <div className="flex" role="tablist">
          {[
            { label: 'Agenda', screen: 'pro-schedule' as const, id: 'agenda' },
            { label: 'Disponibilidades', screen: 'pro-availability' as const, id: 'disp' },
          ].map(tab => (
            <button key={tab.label} role="tab" aria-selected={aba === tab.id} onClick={() => go(tab.screen)}
                    className="flex-1 py-3 text-base font-bold transition-colors"
                    style={{ color: aba === tab.id ? '#fff' : 'rgba(255,255,255,0.55)', borderBottom: `3px solid ${aba === tab.id ? '#fff' : 'transparent'}` }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────
// AGENDA DO DIA
// ─────────────────────────────────────────────
export function ProScheduleScreen({ go }: { go: Go }) {
  const hoje = hojeEmRecife(0)
  const dias = useMemo(() => Array.from({ length: 10 }, (_, i) => hojeEmRecife(i - 2)), [])
  const [selectedDate, setSelectedDate] = useState(hoje)
  const [acaoErro, setAcaoErro] = useState('')
  const [emAndamento, setEmAndamento] = useState<number | null>(null)
  const { dados, setDados, carregando, erro, recarregar } = useCarregar(() => agendamentos.listar({ data: selectedDate }), [selectedDate])
  const schedule = (dados ?? []).slice().sort((a, b) => a.dataHora.localeCompare(b.dataHora))

  async function executar(a: Agendamento, acao: 'confirmar' | 'realizar') {
    setEmAndamento(a.idAgendamento); setAcaoErro('')
    try {
      const novo = acao === 'confirmar' ? await agendamentos.confirmar(a.idAgendamento) : await agendamentos.marcarRealizado(a.idAgendamento)
      setDados(prev => (prev ?? []).map(x => x.idAgendamento === novo.idAgendamento ? novo : x))
    } catch (e) {
      setAcaoErro(comoErroApi(e).message)
    } finally {
      setEmAndamento(null)
    }
  }

  const ativos = schedule.filter(s => s.status !== 'CANCELADO')
  const done = ativos.filter(s => s.status === 'REALIZADO').length
  const pending = ativos.filter(s => s.status === 'AGENDADO' || s.status === 'CONFIRMADO').length

  return (
    <ProShell go={go} aba="agenda">
      <div className="px-4 pt-3 pb-2" style={{ background: '#E8F1F9' }}>
        <p className="text-sm font-semibold mb-2" style={{ color: PRO_COLOR }}>Selecionar data</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dias.map(d => (
            <button key={d} onClick={() => setSelectedDate(d)} aria-pressed={selectedDate === d}
                    className="flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl transition-all text-sm font-bold"
                    style={{ background: selectedDate === d ? PRO_COLOR : '#fff', color: selectedDate === d ? '#fff' : '#111827', border: `2px solid ${selectedDate === d ? PRO_COLOR : '#B9CBE2'}` }}>
              {formatarDataPura(d).slice(0, 5)}
              <span className="text-xs font-semibold mt-0.5" style={{ color: selectedDate === d ? 'rgba(255,255,255,0.8)' : PRO_COLOR }}>
                {d === hoje ? 'Hoje' : diaDaSemana(dataPura(d)).slice(0, 3)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        {[
          { label: 'Consultas', value: ativos.length, color: '#0B4F8A' },
          { label: 'Realizadas', value: done, color: '#2E7D32' },
          { label: 'Pendentes', value: pending, color: '#E65100' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-3 text-center shadow-sm" style={{ background: '#fff' }}>
            <p className="text-2xl font-black" style={{ color: stat.color, fontFamily: 'Nunito, sans-serif' }}>{carregando ? '-' : stat.value}</p>
            <p className="text-xs font-semibold" style={{ color: '#64748B' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 px-4 pb-6 flex flex-col gap-3">
        <p className="text-sm font-bold uppercase tracking-wide" style={{ color: '#475569' }}>Agenda de {formatarDataPura(selectedDate)}</p>
        {acaoErro && <MensagemErro texto={acaoErro}/>}
        {carregando ? <Carregando/> : erro ? <ErroCarregamento erro={erro} onTentar={recarregar}/> :
         schedule.length === 0 ? <ListaVazia texto="Nenhuma consulta marcada nesta data."/> :
         schedule.map(item => {
          const isDone = item.status === 'REALIZADO'
          const isCancel = item.status === 'CANCELADO'
          return (
            <div key={item.idAgendamento} className="rounded-2xl overflow-hidden shadow-sm"
                 style={{ background: '#fff', border: `2px solid ${isCancel ? '#F1F5F9' : isDone ? '#E8F5E9' : '#E8F1F9'}`, opacity: isCancel ? 0.65 : 1 }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ background: isCancel ? '#F8FAFC' : isDone ? '#E8F5E9' : '#E8F1F9' }}>
                <div className="flex items-center gap-2">
                  <Icon name="clock" size={18} color={PRO_COLOR}/>
                  <span className="text-xl font-black" style={{ color: '#111827', fontFamily: 'Nunito, sans-serif' }}>{formatarHora(item.dataHora)}</span>
                </div>
                <StatusBadge status={item.status}/>
              </div>
              <div className="px-4 py-3">
                <p className="font-bold text-lg" style={{ color: '#111827' }}>{item.paciente.nome}</p>
                <p className="text-base" style={{ color: '#64748B' }}>{item.especialidade.nome} · {item.clinica.nome}</p>
                {item.observacao && <p className="text-sm mt-1" style={{ color: '#475569' }}>Obs.: {item.observacao}</p>}
                {(item.status === 'AGENDADO' || item.status === 'CONFIRMADO') && (
                  <div className="flex gap-2 mt-3">
                    {item.status === 'AGENDADO' && (
                      <button onClick={() => executar(item, 'confirmar')} disabled={emAndamento === item.idAgendamento}
                              className="flex-1 py-2.5 rounded-xl text-base font-semibold flex items-center justify-center gap-1.5"
                              style={{ background: '#E8F1F9', color: '#0B4F8A', border: '1.5px solid #B8D4EC' }}>
                        <Icon name="check" size={18} color="#0B4F8A"/> Confirmar
                      </button>
                    )}
                    <button onClick={() => executar(item, 'realizar')} disabled={emAndamento === item.idAgendamento}
                            className="flex-1 py-2.5 rounded-xl text-base font-semibold flex items-center justify-center gap-1.5"
                            style={{ background: '#E8F5E9', color: '#2E7D32', border: '1.5px solid #A5D6A7' }}>
                      <Icon name="checkCircle" size={18} color="#2E7D32"/> Marcar realizado
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </ProShell>
  )
}

// ─────────────────────────────────────────────
// MINHAS DISPONIBILIDADES
// ─────────────────────────────────────────────
interface Impedimento { idAgendamento: number; dataHora: string; nomePaciente: string }

export function ProAvailabilityScreen({ go }: { go: Go }) {
  const hoje = hojeEmRecife(0)
  const [verPassadas, setVerPassadas] = useState(false)
  const [alvo, setAlvo] = useState<number | null>(null)
  const [impedimentos, setImpedimentos] = useState<Impedimento[] | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const { dados, carregando, erro, recarregar } = useCarregar(() => disponibilidades.minhas(), [])
  const lista = (dados ?? []).filter(w => verPassadas || w.dataAtendimento >= hoje)

  async function desativar(id: number) {
    setEnviando(true); setMsg(null)
    try {
      await disponibilidades.desativar(id)
      setAlvo(null)
      setMsg({ tipo: 'ok', texto: 'Janela desativada. Os horários dela não aparecem mais para os pacientes.' })
      recarregar()
    } catch (e) {
      const err = comoErroApi(e)
      if (err.codigo === 'DISPONIBILIDADE_COM_AGENDAMENTOS') {
        setImpedimentos(((err.detalhes as { agendamentos?: Impedimento[] })?.agendamentos) ?? [])
      } else {
        setMsg({ tipo: 'erro', texto: err.message })
      }
      setAlvo(null)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <ProShell go={go} aba="disp">
      <div className="flex-1 px-4 pt-4 pb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xl font-bold" style={{ color: '#111827', fontFamily: 'Nunito, sans-serif' }}>Janelas de atendimento</p>
          <Btn onClick={() => go('pro-add-availability')} size="sm" full={false} color={PRO_COLOR}>
            <Icon name="plus" size={18} color="#fff"/> Nova
          </Btn>
        </div>
        <label className="flex items-center gap-2 text-base" style={{ color: '#475569' }}>
          <input type="checkbox" checked={verPassadas} onChange={e => setVerPassadas(e.target.checked)} className="w-5 h-5"/>
          Mostrar janelas de datas passadas
        </label>
        {msg && (msg.tipo === 'ok' ? <MensagemSucesso texto={msg.texto}/> : <MensagemErro texto={msg.texto}/>)}

        {carregando ? <Carregando/> : erro ? <ErroCarregamento erro={erro} onTentar={recarregar}/> :
         lista.length === 0 ? <ListaVazia texto="Nenhuma janela cadastrada."/> :
         lista.map(w => {
          const passada = w.dataAtendimento < hoje
          return (
            <div key={w.idDisponibilidade} className="rounded-2xl overflow-hidden shadow-sm"
                 style={{ background: '#fff', border: `2px solid ${w.ativo ? '#B9CBE2' : '#E2E8F0'}`, opacity: w.ativo && !passada ? 1 : 0.7 }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: w.ativo ? '#E8F1F9' : '#F1F5F9' }}>
                <div className="flex items-center gap-2">
                  <Icon name="calendar" size={18} color={w.ativo ? PRO_COLOR : '#94A3B8'}/>
                  <span className="font-bold text-lg" style={{ color: '#111827', fontFamily: 'Nunito, sans-serif' }}>
                    {diaDaSemana(dataPura(w.dataAtendimento)).slice(0, 3)}, {formatarDataPura(w.dataAtendimento)}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold"
                      style={{ background: w.ativo ? '#E8F5E9' : '#F1F5F9', color: w.ativo ? '#2E7D32' : '#64748B' }}>
                  {w.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                <p className="text-base font-semibold" style={{ color: '#111827' }}>{w.nomeClinica}</p>
                <div className="flex flex-wrap gap-4">
                  <span className="flex items-center gap-1.5 text-base" style={{ color: '#475569' }}>
                    <Icon name="clock" size={16} color={PRO_COLOR}/> {w.horaInicio} às {w.horaFim}
                  </span>
                  <span className="text-base font-semibold" style={{ color: PRO_COLOR }}>{w.duracaoMinutos} min por atendimento</span>
                </div>
                <p className="text-base" style={{ color: '#64748B' }}>{w.totalHorarios} horários gerados</p>
                {w.ativo && !passada && (
                  <button onClick={() => setAlvo(w.idDisponibilidade)}
                          className="self-start py-2 px-4 rounded-xl text-base font-semibold"
                          style={{ background: '#FFEBEE', color: '#C62828' }}>
                    Desativar janela
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {alvo !== null && (
        <Modal titulo="Desativar janela" onFechar={() => setAlvo(null)}>
          <p className="text-lg mb-5" style={{ color: '#475569' }}>
            Os horários desta janela deixarão de aparecer para os pacientes. Esta ação não pode ser desfeita, mas você pode cadastrar uma nova janela depois.
          </p>
          <div className="flex gap-3">
            <Btn onClick={() => setAlvo(null)} variant="outline" size="md">Voltar</Btn>
            <Btn onClick={() => desativar(alvo)} variant="danger" size="md" disabled={enviando}>{enviando ? 'Desativando...' : 'Desativar'}</Btn>
          </div>
        </Modal>
      )}

      {impedimentos && (
        <Modal titulo="Janela com consultas marcadas" onFechar={() => setImpedimentos(null)}>
          <p className="text-lg mb-4" style={{ color: '#475569' }}>
            Existem consultas marcadas nesta janela. Elas precisam ser canceladas antes da desativação. Pelas regras do sistema, o cancelamento é feito pelo paciente ou pela administração.
          </p>
          <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1.5px solid #FFCDD2' }}>
            <div className="px-3 py-2" style={{ background: '#FFEBEE' }}>
              <p className="text-sm font-bold" style={{ color: '#C62828' }}>Consultas que impedem a operação</p>
            </div>
            {impedimentos.map((c, i) => (
              <div key={c.idAgendamento} className="flex items-center justify-between px-3 py-2.5"
                   style={{ borderTop: i > 0 ? '1px solid #FFCDD2' : 'none', background: '#fff' }}>
                <span className="text-base font-semibold" style={{ color: '#111827' }}>{c.nomePaciente}</span>
                <span className="text-base" style={{ color: '#475569' }}>{formatarHora(c.dataHora)} - {formatarData(c.dataHora)}</span>
              </div>
            ))}
          </div>
          <Btn onClick={() => setImpedimentos(null)} size="md">Entendido</Btn>
        </Modal>
      )}
    </ProShell>
  )
}

// ─────────────────────────────────────────────
// CADASTRAR DISPONIBILIDADE
// ─────────────────────────────────────────────
export function ProAddAvailabilityScreen({ go }: { go: Go }) {
  const eu = useCarregar(() => profissionais.meusDados(), [])
  const vinculos = (eu.dados?.clinicas ?? []).filter(c => c.ativo)
  const [form, setForm] = useState({ clinica: '', date: '', start: '08:00', end: '12:00', duration: '30' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  const idPcl = form.clinica || (vinculos.length === 1 ? String(vinculos[0].idProfissionalClinica) : '')

  // Mesma conta do backend: slots contíguos, sobra descartada (regras v3, item 1)
  function calcSlots(): number {
    if (!form.start || !form.end || !form.duration) return 0
    const [sh, sm] = form.start.split(':').map(Number)
    const [eh, em] = form.end.split(':').map(Number)
    const totalMin = (eh * 60 + em) - (sh * 60 + sm)
    const dur = parseInt(form.duration, 10)
    if (totalMin <= 0 || dur <= 0) return 0
    return Math.floor(totalMin / dur)
  }
  const slots = calcSlots()

  async function salvar() {
    if (!idPcl) { setErro('Escolha a clínica de atendimento.'); return }
    if (!form.date) { setErro('Escolha a data.'); return }
    if (slots < 1) { setErro('A hora de fim precisa ser depois da hora de início, com espaço para pelo menos um atendimento.'); return }
    setEnviando(true); setErro('')
    try {
      await disponibilidades.criar({
        idProfissionalClinica: Number(idPcl), dataAtendimento: form.date,
        horaInicio: form.start, horaFim: form.end, duracaoMinutos: Number(form.duration),
      })
      go('pro-availability')
    } catch (e) {
      setErro(comoErroApi(e).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F4F7FA' }}>
      <Header title="Cadastrar disponibilidade" onBack={() => go('pro-availability')} color={PRO_COLOR}/>
      <div className="flex-1 px-4 pt-4 pb-10 flex flex-col gap-4">
        <div className="rounded-2xl p-4" style={{ background: '#E8F1F9', border: '1.5px solid #B9CBE2' }}>
          <div className="flex items-start gap-3">
            <Icon name="schedule" size={22} color={PRO_COLOR}/>
            <div>
              <p className="font-bold text-base" style={{ color: PRO_COLOR }}>Geração automática de horários</p>
              <p className="text-base mt-1" style={{ color: '#334155' }}>
                Os horários são gerados em sequência dentro da janela, com base na duração de cada atendimento. Se sobrar tempo no fim, ele é descartado.
              </p>
            </div>
          </div>
        </div>

        {eu.carregando ? <Carregando linhas={1}/> : eu.erro ? <ErroCarregamento erro={eu.erro} onTentar={eu.recarregar}/> : (
          <Field label="Clínica de atendimento" id="av-clinica">
            <select id="av-clinica" value={idPcl} onChange={e => set('clinica')(e.target.value)}
                    className="w-full rounded-xl border-2 px-4 py-3 text-lg" style={{ borderColor: '#CBD5E1', background: '#fff', minHeight: 52 }}>
              <option value="">Selecione</option>
              {vinculos.map(v => <option key={v.idProfissionalClinica} value={v.idProfissionalClinica}>{v.nomeClinica}</option>)}
            </select>
          </Field>
        )}
        <Field label="Data" id="av-date">
          <TextInput id="av-date" type="date" value={form.date} onChange={set('date')} min={hojeEmRecife(0)}/>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hora de início" id="av-start"><TextInput id="av-start" type="time" value={form.start} onChange={set('start')}/></Field>
          <Field label="Hora de fim" id="av-end"><TextInput id="av-end" type="time" value={form.end} onChange={set('end')}/></Field>
        </div>
        <Field label="Duração por atendimento" id="av-duration">
          <select id="av-duration" value={form.duration} onChange={e => set('duration')(e.target.value)}
                  className="w-full rounded-xl border-2 px-4 py-3 text-lg" style={{ borderColor: '#CBD5E1', background: '#fff', minHeight: 52 }}>
            {['15', '20', '30', '40', '45', '60'].map(v => <option key={v} value={v}>{v} minutos</option>)}
          </select>
        </Field>

        {slots > 0 && (
          <div className="rounded-2xl p-4" style={{ background: '#E8F5E9', border: '1.5px solid #A5D6A7' }}>
            <p className="font-bold text-lg" style={{ color: '#2E7D32' }}>
              {slots} {slots !== 1 ? 'horários serão criados' : 'horário será criado'}
            </p>
            <p className="text-base mt-1" style={{ color: '#1B5E20' }}>De {form.start} a {form.end}, a cada {form.duration} minutos.</p>
          </div>
        )}
        {erro && <MensagemErro texto={erro}/>}

        <Btn onClick={salvar} size="lg" color={PRO_COLOR} disabled={enviando}>
          <Icon name="check" size={22} color="#fff"/> {enviando ? 'Salvando...' : 'Salvar disponibilidade'}
        </Btn>
        <Btn onClick={() => go('pro-availability')} variant="ghost" size="md">Cancelar</Btn>
      </div>
    </div>
  )
}

