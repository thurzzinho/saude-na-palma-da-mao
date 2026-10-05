import { useState } from 'react'
import {
  Icon, Btn, Field, TextInput, StatusBadge, PortalLogin, Carregando, ErroCarregamento,
  MensagemErro, MensagemSucesso, ListaVazia, Modal,
} from '../componentes/UI'
import { agendamentos, clinicas, especialidades, profissionais } from '../api/servicos'
import { comoErroApi } from '../api/erros'
import type { Agendamento, Clinica, DadosClinica, Especialidade, StatusAgendamento } from '../api/tipos'
import { useSessao } from '../contexto/Sessao'
import { useCarregar } from '../utils/useCarregar'
import { ehFuturo, formatarData, formatarDataPura, formatarHora, hojeEmRecife } from '../utils/datas'
import {
  cnpjValido, cpfValido, emailValido, iniciais, mascararCep, mascararCnpj, mascararCpf, mascararTelefone, normalizar, soDigitos,
} from '../utils/formatos'
import { telaInicial, type Go, type Parametros } from '../navegacao'

const ADMIN_COLOR = '#1A365D'
const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const CONSELHOS = ['CRM', 'CRO', 'CRP', 'COREN', 'CREFITO', 'CRN', 'CRF', 'CRFa']
const selectClasse = 'w-full rounded-xl border-2 px-4 py-3 text-lg'
const selectEstilo = { borderColor: '#CBD5E1', background: '#fff', minHeight: 52 }

type AdminSubScreen = 'dashboard' | 'clinics' | 'professionals' | 'specialties' | 'appointments'

// ─────────────────────────────────────────────
// LOGIN ADMINISTRATIVO
// ─────────────────────────────────────────────
export function AdminLoginScreen({ go }: { go: Go }) {
  const { entrar } = useSessao()
  return (
    <PortalLogin
      title="Acesso Administrativo"
      subtitle="Painel de gestão do sistema"
      color={ADMIN_COLOR}
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

// ─────────────────────────────────────────────
// ESTRUTURA COMUM (cabeçalho e abas)
// ─────────────────────────────────────────────
function AdminShell({ title, sub, go, children, onBack }: {
  title: string; sub: AdminSubScreen; go: Go; children: React.ReactNode; onBack?: () => void
}) {
  const { usuario, sair } = useSessao()
  const tabs = [
    { label: 'Painel', icon: 'dashboard', screen: 'admin-dashboard' as const, id: 'dashboard' },
    { label: 'Clínicas', icon: 'clinic', screen: 'admin-clinics' as const, id: 'clinics' },
    { label: 'Profiss.', icon: 'people', screen: 'admin-professionals' as const, id: 'professionals' },
    { label: 'Espec.', icon: 'stethoscope', screen: 'admin-specialties' as const, id: 'specialties' },
    { label: 'Agenda', icon: 'calendar', screen: 'admin-appointments' as const, id: 'appointments' },
  ]
  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F4F7FA' }}>
      <div className="sticky top-0 z-10" style={{ background: ADMIN_COLOR }}>
        <div className="flex items-center justify-between px-4 py-3 gap-2">
          {onBack ? (
            <button onClick={onBack} aria-label="Voltar" className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <Icon name="arrowLeft" size={22} color="#fff"/>
            </button>
          ) : (
            <div className="min-w-0">
              <p className="text-white/70 text-xs">Administração</p>
              <p className="text-white font-bold text-base truncate max-w-[110px]">{usuario?.nome}</p>
            </div>
          )}
          <h2 className="text-white font-black text-xl flex-1 text-center truncate" style={{ fontFamily: 'Nunito, sans-serif' }}>{title}</h2>
          <button onClick={() => { sair(); go('welcome') }} className="py-1.5 px-3 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>
            Sair
          </button>
        </div>
        {!onBack && (
          <nav className="flex border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }} aria-label="Seções da administração">
            {tabs.map(t => (
              <button key={t.id} onClick={() => go(t.screen)} aria-current={sub === t.id ? 'page' : undefined}
                      className="flex-1 py-2 flex flex-col items-center gap-0.5 text-xs font-semibold transition-colors"
                      style={{ color: sub === t.id ? '#fff' : 'rgba(255,255,255,0.6)', borderBottom: `2px solid ${sub === t.id ? '#fff' : 'transparent'}` }}>
                <Icon name={t.icon} size={18} color={sub === t.id ? '#fff' : 'rgba(255,255,255,0.6)'}/>
                {t.label}
              </button>
            ))}
          </nav>
        )}
      </div>
      <div className="flex-1 overflow-y-auto pb-6">{children}</div>
    </div>
  )
}

function SeloAtivo({ ativo, fem = false }: { ativo: boolean; fem?: boolean }) {
  return (
    <span className="px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap"
          style={{ background: ativo ? '#E8F5E9' : '#F1F5F9', color: ativo ? '#2E7D32' : '#64748B' }}>
      {ativo ? (fem ? 'Ativa' : 'Ativo') : (fem ? 'Inativa' : 'Inativo')}
    </span>
  )
}

function BotaoAtivacao({ ativo, onClick, disabled }: { ativo: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex-1 py-2.5 rounded-xl text-base font-semibold"
            style={{ background: ativo ? '#FFEBEE' : '#E8F5E9', color: ativo ? '#C62828' : '#2E7D32', opacity: disabled ? 0.6 : 1 }}>
      {ativo ? 'Desativar' : 'Reativar'}
    </button>
  )
}

function BotaoEditar({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 py-2.5 rounded-xl text-base font-semibold flex items-center justify-center gap-1.5"
            style={{ background: '#EEF2FF', color: ADMIN_COLOR }}>
      <Icon name="edit" size={16} color={ADMIN_COLOR}/> Editar
    </button>
  )
}

function Escolha({ selecionado, onClick, children }: { selecionado: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selecionado}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-base font-semibold text-left transition-all"
            style={{ background: selecionado ? '#EEF2FF' : '#F1F5F9', color: selecionado ? ADMIN_COLOR : '#475569', border: `2px solid ${selecionado ? ADMIN_COLOR : 'transparent'}` }}>
      {children}
      {selecionado && <span className="ml-auto"><Icon name="check" size={18} color={ADMIN_COLOR}/></span>}
    </button>
  )
}

const alternar = (lista: number[], id: number) => (lista.includes(id) ? lista.filter(x => x !== id) : [...lista, id])

// ─────────────────────────────────────────────
// PAINEL
// ─────────────────────────────────────────────
export function AdminDashboardScreen({ go }: { go: Go }) {
  const hoje = hojeEmRecife(0)
  const cl = useCarregar(() => clinicas.listar({ todas: true }), [])
  const pr = useCarregar(() => profissionais.listar(), [])
  const es = useCarregar(() => especialidades.listar(true), [])
  const ag = useCarregar(() => agendamentos.listar({ data: hoje }), [hoje])
  const conta = <T,>(d: T[] | null, filtro: (x: T) => boolean) => (d ? d.filter(filtro).length : '-')
  const stats = [
    { label: 'Clínicas ativas', value: conta(cl.dados, c => c.ativo), icon: 'clinic', color: '#0B4F8A', bg: '#E8F1F9', screen: 'admin-clinics' as const },
    { label: 'Profissionais ativos', value: conta(pr.dados, p => p.ativo), icon: 'people', color: '#2E7D32', bg: '#E8F5E9', screen: 'admin-professionals' as const },
    { label: 'Especialidades ativas', value: conta(es.dados, e => e.ativo), icon: 'stethoscope', color: '#6A1B9A', bg: '#F3E5F5', screen: 'admin-specialties' as const },
    { label: 'Consultas hoje', value: conta(ag.dados, a => a.status !== 'CANCELADO'), icon: 'calendar', color: '#E65100', bg: '#FFF3E0', screen: 'admin-appointments' as const },
  ]
  const todayList = (ag.dados ?? []).filter(a => a.status !== 'CANCELADO')

  return (
    <AdminShell title="Painel" sub="dashboard" go={go}>
      <div className="px-4 pt-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          {stats.map(s => (
            <button key={s.label} onClick={() => go(s.screen)}
                    className="rounded-2xl p-4 flex flex-col gap-2 shadow-sm text-left transition-all active:scale-95"
                    style={{ background: s.bg, border: `2px solid ${s.color}20` }}>
              <Icon name={s.icon} size={24} color={s.color}/>
              <p className="text-3xl font-black" style={{ color: s.color, fontFamily: 'Nunito, sans-serif' }}>{s.value}</p>
              <p className="text-sm font-semibold leading-tight" style={{ color: '#475569' }}>{s.label}</p>
            </button>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: '#fff' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#E8F1F9' }}>
            <p className="font-bold text-base" style={{ color: ADMIN_COLOR }}>Consultas de hoje ({formatarDataPura(hoje).slice(0, 5)})</p>
            <button onClick={() => go('admin-appointments')} className="text-sm font-semibold" style={{ color: ADMIN_COLOR }}>Ver todas</button>
          </div>
          {ag.carregando ? <div className="p-4"><Carregando linhas={2}/></div> : ag.erro ? <div className="p-4"><ErroCarregamento erro={ag.erro} onTentar={ag.recarregar}/></div> :
           todayList.length === 0 ? <p className="px-4 py-4 text-base" style={{ color: '#64748B' }}>Nenhuma consulta hoje.</p> :
           todayList.slice(0, 5).map((a, i) => (
            <div key={a.idAgendamento} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : 'none' }}>
              <p className="w-14 flex-shrink-0 text-base font-black" style={{ color: ADMIN_COLOR, fontFamily: 'Nunito, sans-serif' }}>{formatarHora(a.dataHora)}</p>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base truncate" style={{ color: '#111827' }}>{a.paciente.nome}</p>
                <p className="text-sm truncate" style={{ color: '#64748B' }}>{a.profissional.nome} · {a.especialidade.nome}</p>
              </div>
              <StatusBadge status={a.status}/>
            </div>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: '#fff' }}>
          <div className="px-4 py-3" style={{ background: '#E8F1F9' }}>
            <p className="font-bold text-base" style={{ color: ADMIN_COLOR }}>Situação das clínicas</p>
          </div>
          {cl.carregando ? <div className="p-4"><Carregando linhas={2}/></div> : cl.erro ? <div className="p-4"><ErroCarregamento erro={cl.erro} onTentar={cl.recarregar}/></div> :
           (cl.dados ?? []).map((c, i) => (
            <div key={c.idClinica} className="flex items-center justify-between px-4 py-3 gap-2" style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : 'none' }}>
              <div className="min-w-0">
                <p className="font-semibold text-base truncate" style={{ color: '#111827' }}>{c.nome}</p>
                <p className="text-sm" style={{ color: '#64748B' }}>{c.bairro}</p>
              </div>
              <SeloAtivo ativo={c.ativo} fem/>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  )
}

// ─────────────────────────────────────────────
// CLÍNICAS: LISTA
// ─────────────────────────────────────────────
export function AdminClinicsScreen({ go }: { go: Go }) {
  const { dados, setDados, carregando, erro, recarregar } = useCarregar(() => clinicas.listar({ todas: true }), [])
  const [busca, setBusca] = useState('')
  const [emAndamento, setEmAndamento] = useState<number | null>(null)
  const [msgErro, setMsgErro] = useState('')
  const lista = (dados ?? []).filter(c => !busca || normalizar(c.nome).includes(normalizar(busca)) || normalizar(c.bairro ?? '').includes(normalizar(busca)))

  async function toggle(c: Clinica) {
    setEmAndamento(c.idClinica); setMsgErro('')
    try {
      const nova = await clinicas.definirAtivo(c.idClinica, !c.ativo)
      setDados(prev => (prev ?? []).map(x => x.idClinica === nova.idClinica ? nova : x))
    } catch (e) {
      setMsgErro(comoErroApi(e).message)
    } finally {
      setEmAndamento(null)
    }
  }

  return (
    <AdminShell title="Clínicas" sub="clinics" go={go}>
      <div className="px-4 pt-4 flex flex-col gap-3">
        <Btn onClick={() => go('admin-clinic-form')} size="md" color={ADMIN_COLOR}>
          <Icon name="plus" size={20} color="#fff"/> Nova clínica
        </Btn>
        <Field label="Buscar" id="adm-cl-busca"><TextInput id="adm-cl-busca" type="search" value={busca} onChange={setBusca} placeholder="Nome ou bairro"/></Field>
        {msgErro && <MensagemErro texto={msgErro}/>}
        {carregando ? <Carregando/> : erro ? <ErroCarregamento erro={erro} onTentar={recarregar}/> :
         lista.length === 0 ? <ListaVazia texto="Nenhuma clínica encontrada."/> :
         lista.map(c => (
          <div key={c.idClinica} className="rounded-2xl overflow-hidden shadow-sm"
               style={{ background: '#fff', border: '2px solid #E2E8F0', opacity: c.ativo ? 1 : 0.8 }}>
            <div className="px-4 py-3 flex items-center justify-between gap-2" style={{ background: c.ativo ? '#EEF2FF' : '#F8FAFC' }}>
              <p className="font-bold text-lg leading-tight" style={{ color: '#111827', fontFamily: 'Nunito, sans-serif' }}>{c.nome}</p>
              <SeloAtivo ativo={c.ativo} fem/>
            </div>
            <div className="px-4 py-3 flex flex-col gap-1.5">
              <p className="text-base" style={{ color: '#475569' }}><span className="font-semibold">CNPJ:</span> {mascararCnpj(c.cnpj)}</p>
              {c.bairro && <p className="text-base" style={{ color: '#475569' }}><span className="font-semibold">Bairro:</span> {c.bairro}</p>}
              {c.telefone && <p className="text-base" style={{ color: '#475569' }}><span className="font-semibold">Telefone:</span> {c.telefone}</p>}
              {c.horarioFuncionamento && <p className="text-base" style={{ color: '#475569' }}><span className="font-semibold">Horário:</span> {c.horarioFuncionamento}</p>}
              <div className="flex gap-2 mt-2">
                <BotaoEditar onClick={() => go('admin-clinic-form', { idClinica: c.idClinica })}/>
                <BotaoAtivacao ativo={c.ativo} onClick={() => toggle(c)} disabled={emAndamento === c.idClinica}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  )
}

// ─────────────────────────────────────────────
// CLÍNICAS: CADASTRO E EDIÇÃO
// ─────────────────────────────────────────────
const CLINICA_VAZIA = {
  nome: '', cnpj: '', telefone: '', email: '', logradouro: '', numero: '', bairro: '',
  cidade: 'Recife', uf: 'PE', cep: '', horarioFuncionamento: '', idsEspecialidades: [] as number[],
}

export function AdminClinicFormScreen({ go, params }: { go: Go; params: Parametros }) {
  const editando = Boolean(params.idClinica)
  const [form, setForm] = useState(CLINICA_VAZIA)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const esps = useCarregar(() => especialidades.listar(true), [])
  const atual = useCarregar(async () => {
    if (!params.idClinica) return null
    const c = await clinicas.obter(params.idClinica)
    setForm({
      nome: c.nome, cnpj: mascararCnpj(c.cnpj), telefone: c.telefone ?? '', email: c.email ?? '', logradouro: c.logradouro ?? '',
      numero: c.numero ?? '', bairro: c.bairro ?? '', cidade: c.cidade, uf: c.uf, cep: c.cep ? mascararCep(c.cep) : '',
      horarioFuncionamento: c.horarioFuncionamento ?? '', idsEspecialidades: c.idsEspecialidades,
    })
    return c
  }, [params.idClinica])
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  async function salvar() {
    if (form.nome.trim().length < 3) { setErro('Informe o nome da clínica.'); return }
    if (!cnpjValido(form.cnpj)) { setErro('CNPJ inválido. Confira os números.'); return }
    if (form.email && !emailValido(form.email)) { setErro('E-mail inválido.'); return }
    if (form.cep && soDigitos(form.cep).length !== 8) { setErro('O CEP deve ter 8 dígitos.'); return }
    const dados: DadosClinica = {
      nome: form.nome.trim(), cnpj: soDigitos(form.cnpj), telefone: form.telefone || null, email: form.email.trim() || null,
      logradouro: form.logradouro.trim() || null, numero: form.numero.trim() || null, bairro: form.bairro.trim() || null,
      cidade: form.cidade.trim() || 'Recife', uf: form.uf, cep: soDigitos(form.cep) || null,
      horarioFuncionamento: form.horarioFuncionamento.trim() || null, idsEspecialidades: form.idsEspecialidades,
    }
    setEnviando(true); setErro('')
    try {
      if (params.idClinica) await clinicas.atualizar(params.idClinica, dados)
      else await clinicas.criar(dados)
      go('admin-clinics')
    } catch (e) {
      setErro(comoErroApi(e).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AdminShell title={editando ? 'Editar clínica' : 'Nova clínica'} sub="clinics" go={go} onBack={() => go('admin-clinics')}>
      {atual.carregando && editando ? <div className="p-4"><Carregando/></div> : atual.erro ? <div className="p-4"><ErroCarregamento erro={atual.erro} onTentar={atual.recarregar}/></div> : (
        <div className="px-4 pt-4 pb-10 flex flex-col gap-4">
          <Field label="Nome da clínica *" id="cl-name"><TextInput id="cl-name" value={form.nome} onChange={set('nome')} placeholder="Ex.: Clínica Recife Saúde"/></Field>
          <Field label="CNPJ *" id="cl-cnpj"><TextInput id="cl-cnpj" value={form.cnpj} onChange={v => set('cnpj')(mascararCnpj(v))} placeholder="00.000.000/0000-00" inputMode="numeric"/></Field>
          <Field label="Telefone" id="cl-phone"><TextInput id="cl-phone" type="tel" value={form.telefone} onChange={v => set('telefone')(mascararTelefone(v))} placeholder="(81) 0000-0000"/></Field>
          <Field label="E-mail" id="cl-email"><TextInput id="cl-email" type="email" value={form.email} onChange={set('email')} placeholder="contato@clinica.com.br"/></Field>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Field label="Logradouro" id="cl-log"><TextInput id="cl-log" value={form.logradouro} onChange={set('logradouro')} placeholder="Rua, avenida"/></Field></div>
            <Field label="Número" id="cl-num"><TextInput id="cl-num" value={form.numero} onChange={set('numero')} placeholder="Nº"/></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bairro" id="cl-bairro"><TextInput id="cl-bairro" value={form.bairro} onChange={set('bairro')} placeholder="Bairro"/></Field>
            <Field label="CEP" id="cl-cep"><TextInput id="cl-cep" value={form.cep} onChange={v => set('cep')(mascararCep(v))} placeholder="00000-000" inputMode="numeric"/></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Field label="Cidade" id="cl-city"><TextInput id="cl-city" value={form.cidade} onChange={set('cidade')} placeholder="Cidade"/></Field></div>
            <Field label="UF" id="cl-uf">
              <select id="cl-uf" value={form.uf} onChange={e => set('uf')(e.target.value)} className={selectClasse} style={selectEstilo}>
                {UFS.map(v => <option key={v}>{v}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Horário de funcionamento" id="cl-hours">
            <TextInput id="cl-hours" value={form.horarioFuncionamento} onChange={set('horarioFuncionamento')} placeholder="Ex.: Seg a Sex, 08h às 18h"/>
          </Field>
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-base" style={{ color: '#334155' }}>Especialidades atendidas</p>
            {esps.carregando ? <Carregando linhas={1}/> : esps.erro ? <ErroCarregamento erro={esps.erro} onTentar={esps.recarregar}/> : (
              <div className="grid grid-cols-2 gap-2">
                {(esps.dados ?? []).map(sp => (
                  <Escolha key={sp.idEspecialidade} selecionado={form.idsEspecialidades.includes(sp.idEspecialidade)}
                           onClick={() => setForm(f => ({ ...f, idsEspecialidades: alternar(f.idsEspecialidades, sp.idEspecialidade) }))}>
                    {sp.nome}{!sp.ativo && ' (inativa)'}
                  </Escolha>
                ))}
              </div>
            )}
          </div>
          {erro && <MensagemErro texto={erro}/>}
          <Btn onClick={salvar} size="lg" color={ADMIN_COLOR} disabled={enviando}>
            <Icon name="check" size={22} color="#fff"/> {enviando ? 'Salvando...' : 'Salvar clínica'}
          </Btn>
          <Btn onClick={() => go('admin-clinics')} variant="ghost" size="md">Cancelar</Btn>
        </div>
      )}
    </AdminShell>
  )
}

// ─────────────────────────────────────────────
// PROFISSIONAIS: LISTA
// ─────────────────────────────────────────────
export function AdminProfessionalsScreen({ go }: { go: Go }) {
  const { dados, setDados, carregando, erro, recarregar } = useCarregar(() => profissionais.listar(), [])
  const esps = useCarregar(() => especialidades.listar(true), [])
  const [busca, setBusca] = useState('')
  const [emAndamento, setEmAndamento] = useState<number | null>(null)
  const [msgErro, setMsgErro] = useState('')
  const nomeEsp = (id: number) => esps.dados?.find(e => e.idEspecialidade === id)?.nome ?? ''
  const lista = (dados ?? []).filter(p => !busca ||
    normalizar(p.nome).includes(normalizar(busca)) ||
    p.clinicas.some(c => normalizar(c.nomeClinica).includes(normalizar(busca))) ||
    p.idsEspecialidades.some(id => normalizar(nomeEsp(id)).includes(normalizar(busca))))

  async function toggle(id: number, ativo: boolean) {
    setEmAndamento(id); setMsgErro('')
    try {
      const novo = await profissionais.definirAtivo(id, !ativo)
      setDados(prev => (prev ?? []).map(x => x.idProfissional === novo.idProfissional ? novo : x))
    } catch (e) {
      setMsgErro(comoErroApi(e).message)
    } finally {
      setEmAndamento(null)
    }
  }

  return (
    <AdminShell title="Profissionais" sub="professionals" go={go}>
      <div className="px-4 pt-4 flex flex-col gap-3">
        <Btn onClick={() => go('admin-professional-form')} size="md" color={ADMIN_COLOR}>
          <Icon name="plus" size={20} color="#fff"/> Novo profissional
        </Btn>
        <Field label="Buscar" id="adm-pr-busca"><TextInput id="adm-pr-busca" type="search" value={busca} onChange={setBusca} placeholder="Nome, clínica ou especialidade"/></Field>
        {msgErro && <MensagemErro texto={msgErro}/>}
        {carregando ? <Carregando/> : erro ? <ErroCarregamento erro={erro} onTentar={recarregar}/> :
         lista.length === 0 ? <ListaVazia texto="Nenhum profissional encontrado."/> :
         lista.map(doc => (
          <div key={doc.idProfissional} className="rounded-2xl overflow-hidden shadow-sm"
               style={{ background: '#fff', border: '2px solid #E2E8F0', opacity: doc.ativo ? 1 : 0.8 }}>
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#EEF2FF' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0" style={{ background: ADMIN_COLOR }}>
                {iniciais(doc.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg leading-tight truncate" style={{ color: '#111827' }}>{doc.nome}</p>
                <p className="text-base font-semibold truncate" style={{ color: ADMIN_COLOR }}>{doc.idsEspecialidades.map(nomeEsp).filter(Boolean).join(', ')}</p>
              </div>
              <SeloAtivo ativo={doc.ativo}/>
            </div>
            <div className="px-4 py-3 flex flex-col gap-1">
              <p className="text-base" style={{ color: '#475569' }}><span className="font-semibold">Registro:</span> {doc.conselho} {doc.registroProfissional}/{doc.ufRegistro}</p>
              <p className="text-base" style={{ color: '#475569' }}>
                <span className="font-semibold">Clínicas:</span> {doc.clinicas.filter(c => c.ativo).map(c => c.nomeClinica).join(', ') || 'Nenhuma'}
              </p>
              <div className="flex gap-2 mt-2">
                <BotaoEditar onClick={() => go('admin-professional-form', { idProfissional: doc.idProfissional })}/>
                <BotaoAtivacao ativo={doc.ativo} onClick={() => toggle(doc.idProfissional, doc.ativo)} disabled={emAndamento === doc.idProfissional}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  )
}

// ─────────────────────────────────────────────
// PROFISSIONAIS: CADASTRO E EDIÇÃO
// ─────────────────────────────────────────────
const PROF_VAZIO = {
  nome: '', email: '', telefone: '', cpf: '', conselho: 'CRM', registroProfissional: '', ufRegistro: 'PE', senha: '',
  idsEspecialidades: [] as number[], idsClinicas: [] as number[],
}

export function AdminProfessionalFormScreen({ go, params }: { go: Go; params: Parametros }) {
  const editando = Boolean(params.idProfissional)
  const [form, setForm] = useState(PROF_VAZIO)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const esps = useCarregar(() => especialidades.listar(true), [])
  const cls = useCarregar(() => clinicas.listar({ todas: true }), [])
  const atual = useCarregar(async () => {
    if (!params.idProfissional) return null
    const p = await profissionais.obter(params.idProfissional)
    setForm({
      nome: p.nome, email: p.email, telefone: p.telefone ?? '', cpf: mascararCpf(p.cpf), conselho: p.conselho,
      registroProfissional: p.registroProfissional, ufRegistro: p.ufRegistro, senha: '',
      idsEspecialidades: p.idsEspecialidades, idsClinicas: p.clinicas.filter(c => c.ativo).map(c => c.idClinica),
    })
    return p
  }, [params.idProfissional])
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  async function salvar() {
    if (form.nome.trim().split(/\s+/).length < 2) { setErro('Informe o nome completo.'); return }
    if (!emailValido(form.email)) { setErro('E-mail inválido.'); return }
    if (!cpfValido(form.cpf)) { setErro('CPF inválido. Confira os números.'); return }
    if (!form.registroProfissional.trim()) { setErro('Informe o número de registro no conselho.'); return }
    if (!form.idsEspecialidades.length) { setErro('Selecione ao menos uma especialidade.'); return }
    if (!form.idsClinicas.length) { setErro('Selecione ao menos uma clínica.'); return }
    if (!editando && form.senha.length < 6) { setErro('A senha inicial precisa ter pelo menos 6 caracteres.'); return }
    const dados = {
      nome: form.nome.trim(), email: form.email.trim().toLowerCase(), telefone: form.telefone || null, cpf: soDigitos(form.cpf),
      conselho: form.conselho, registroProfissional: form.registroProfissional.trim(), ufRegistro: form.ufRegistro,
      idsEspecialidades: form.idsEspecialidades, idsClinicas: form.idsClinicas, ...(editando ? {} : { senha: form.senha }),
    }
    setEnviando(true); setErro('')
    try {
      if (params.idProfissional) await profissionais.atualizar(params.idProfissional, dados)
      else await profissionais.criar(dados)
      go('admin-professionals')
    } catch (e) {
      setErro(comoErroApi(e).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AdminShell title={editando ? 'Editar profissional' : 'Novo profissional'} sub="professionals" go={go} onBack={() => go('admin-professionals')}>
      {atual.carregando && editando ? <div className="p-4"><Carregando/></div> : atual.erro ? <div className="p-4"><ErroCarregamento erro={atual.erro} onTentar={atual.recarregar}/></div> : (
        <div className="px-4 pt-4 pb-10 flex flex-col gap-4">
          <Field label="Nome completo *" id="pr-name"><TextInput id="pr-name" value={form.nome} onChange={set('nome')} placeholder="Dr(a). Nome Sobrenome"/></Field>
          <Field label="E-mail (usado no login) *" id="pr-email"><TextInput id="pr-email" type="email" value={form.email} onChange={set('email')} placeholder="nome@clinica.com.br"/></Field>
          <Field label="Telefone" id="pr-tel"><TextInput id="pr-tel" type="tel" value={form.telefone} onChange={v => set('telefone')(mascararTelefone(v))} placeholder="(81) 99999-9999"/></Field>
          <Field label="CPF *" id="pr-cpf"><TextInput id="pr-cpf" value={form.cpf} onChange={v => set('cpf')(mascararCpf(v))} placeholder="000.000.000-00" inputMode="numeric"/></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Conselho *" id="pr-council">
              <select id="pr-council" value={form.conselho} onChange={e => set('conselho')(e.target.value)} className={selectClasse} style={selectEstilo}>
                {CONSELHOS.map(v => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Nº de registro *" id="pr-reg"><TextInput id="pr-reg" value={form.registroProfissional} onChange={set('registroProfissional')} placeholder="00000"/></Field>
          </div>
          <Field label="UF de registro *" id="pr-uf">
            <select id="pr-uf" value={form.ufRegistro} onChange={e => set('ufRegistro')(e.target.value)} className={selectClasse} style={selectEstilo}>
              {UFS.map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
          {!editando && (
            <Field label="Senha inicial (mínimo 6 caracteres) *" id="pr-senha">
              <TextInput id="pr-senha" type="password" value={form.senha} onChange={set('senha')} autoComplete="new-password"/>
            </Field>
          )}
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-base" style={{ color: '#334155' }}>Especialidades *</p>
            {esps.carregando ? <Carregando linhas={1}/> : esps.erro ? <ErroCarregamento erro={esps.erro} onTentar={esps.recarregar}/> : (
              <div className="grid grid-cols-2 gap-2">
                {(esps.dados ?? []).map((sp: Especialidade) => (
                  <Escolha key={sp.idEspecialidade} selecionado={form.idsEspecialidades.includes(sp.idEspecialidade)}
                           onClick={() => setForm(f => ({ ...f, idsEspecialidades: alternar(f.idsEspecialidades, sp.idEspecialidade) }))}>
                    {sp.nome}{!sp.ativo && ' (inativa)'}
                  </Escolha>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-base" style={{ color: '#334155' }}>Clínicas vinculadas *</p>
            {cls.carregando ? <Carregando linhas={1}/> : cls.erro ? <ErroCarregamento erro={cls.erro} onTentar={cls.recarregar}/> :
             (cls.dados ?? []).map(cl => (
              <Escolha key={cl.idClinica} selecionado={form.idsClinicas.includes(cl.idClinica)}
                       onClick={() => setForm(f => ({ ...f, idsClinicas: alternar(f.idsClinicas, cl.idClinica) }))}>
                <Icon name="clinic" size={20} color={form.idsClinicas.includes(cl.idClinica) ? ADMIN_COLOR : '#94A3B8'}/>
                <span>
                  <span className="block">{cl.nome}{!cl.ativo && ' (inativa)'}</span>
                  <span className="block text-sm font-normal">{cl.bairro}</span>
                </span>
              </Escolha>
            ))}
          </div>
          {erro && <MensagemErro texto={erro}/>}
          <Btn onClick={salvar} size="lg" color={ADMIN_COLOR} disabled={enviando}>
            <Icon name="check" size={22} color="#fff"/> {enviando ? 'Salvando...' : 'Salvar profissional'}
          </Btn>
          <Btn onClick={() => go('admin-professionals')} variant="ghost" size="md">Cancelar</Btn>
        </div>
      )}
    </AdminShell>
  )
}

// ─────────────────────────────────────────────
// ESPECIALIDADES (lista, cadastro, edição e ativação)
// ─────────────────────────────────────────────
export function AdminSpecialtiesScreen({ go }: { go: Go }) {
  const { dados, setDados, carregando, erro, recarregar } = useCarregar(() => especialidades.listar(true), [])
  const [editor, setEditor] = useState<{ id: number | null; nome: string; descricao: string } | null>(null)
  const [erroForm, setErroForm] = useState('')
  const [msgErro, setMsgErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function salvar() {
    if (!editor) return
    if (editor.nome.trim().length < 3) { setErroForm('Informe o nome da especialidade.'); return }
    setEnviando(true); setErroForm('')
    try {
      const d = { nome: editor.nome.trim(), descricao: editor.descricao.trim() || null }
      const salvo = editor.id ? await especialidades.atualizar(editor.id, d) : await especialidades.criar(d)
      setDados(prev => {
        const lista = prev ?? []
        const existe = lista.some(x => x.idEspecialidade === salvo.idEspecialidade)
        return (existe ? lista.map(x => x.idEspecialidade === salvo.idEspecialidade ? salvo : x) : [...lista, salvo])
          .sort((a, b) => a.nome.localeCompare(b.nome))
      })
      setEditor(null)
    } catch (e) {
      setErroForm(comoErroApi(e).message)
    } finally {
      setEnviando(false)
    }
  }

  async function toggle(sp: Especialidade) {
    setMsgErro('')
    try {
      const novo = await especialidades.definirAtivo(sp.idEspecialidade, !sp.ativo)
      setDados(prev => (prev ?? []).map(x => x.idEspecialidade === novo.idEspecialidade ? novo : x))
    } catch (e) {
      setMsgErro(comoErroApi(e).message)
    }
  }

  return (
    <AdminShell title="Especialidades" sub="specialties" go={go}>
      <div className="px-4 pt-4 flex flex-col gap-3">
        <Btn onClick={() => { setErroForm(''); setEditor({ id: null, nome: '', descricao: '' }) }} size="md" color={ADMIN_COLOR}>
          <Icon name="plus" size={20} color="#fff"/> Nova especialidade
        </Btn>
        {msgErro && <MensagemErro texto={msgErro}/>}
        {carregando ? <Carregando/> : erro ? <ErroCarregamento erro={erro} onTentar={recarregar}/> :
         (dados ?? []).length === 0 ? <ListaVazia texto="Nenhuma especialidade cadastrada."/> :
         (dados ?? []).map(sp => (
          <div key={sp.idEspecialidade} className="rounded-2xl overflow-hidden shadow-sm"
               style={{ background: '#fff', border: '2px solid #E2E8F0', opacity: sp.ativo ? 1 : 0.8 }}>
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: sp.ativo ? '#EEF2FF' : '#F8FAFC' }}>
              <Icon name="stethoscope" size={22} color={sp.ativo ? ADMIN_COLOR : '#94A3B8'}/>
              <p className="flex-1 font-bold text-lg" style={{ color: '#111827' }}>{sp.nome}</p>
              <SeloAtivo ativo={sp.ativo} fem/>
            </div>
            <div className="px-4 py-3">
              <p className="text-base" style={{ color: '#475569' }}>{sp.descricao || 'Sem descrição.'}</p>
              <div className="flex gap-2 mt-3">
                <BotaoEditar onClick={() => { setErroForm(''); setEditor({ id: sp.idEspecialidade, nome: sp.nome, descricao: sp.descricao ?? '' }) }}/>
                <BotaoAtivacao ativo={sp.ativo} onClick={() => toggle(sp)}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editor && (
        <Modal titulo={editor.id ? 'Editar especialidade' : 'Nova especialidade'} icone="stethoscope" cor={ADMIN_COLOR} fundoIcone="#EEF2FF" onFechar={() => setEditor(null)}>
          <div className="flex flex-col gap-4">
            <Field label="Nome *" id="esp-nome"><TextInput id="esp-nome" value={editor.nome} onChange={v => setEditor(e => e && { ...e, nome: v })} placeholder="Ex.: Cardiologia"/></Field>
            <Field label="Descrição" id="esp-desc">
              <textarea id="esp-desc" value={editor.descricao} onChange={e => setEditor(ed => ed && { ...ed, descricao: e.target.value })} rows={3}
                        className="w-full rounded-2xl border-2 px-4 py-3 text-lg resize-none" style={{ borderColor: '#E2E8F0', background: '#F8F9FA' }}/>
            </Field>
            {erroForm && <MensagemErro texto={erroForm}/>}
            <div className="flex gap-3">
              <Btn onClick={() => setEditor(null)} variant="outline" size="md">Cancelar</Btn>
              <Btn onClick={salvar} size="md" color={ADMIN_COLOR} disabled={enviando}>{enviando ? 'Salvando...' : 'Salvar'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </AdminShell>
  )
}

// ─────────────────────────────────────────────
// AGENDAMENTOS (gestão administrativa)
// ─────────────────────────────────────────────
export function AdminAppointmentsScreen({ go }: { go: Go }) {
  const [filterClinic, setFilterClinic] = useState('')
  const [filterDoctor, setFilterDoctor] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [cancelando, setCancelando] = useState<Agendamento | null>(null)
  const [motivo, setMotivo] = useState('')
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [emAndamento, setEmAndamento] = useState<number | null>(null)
  const cls = useCarregar(() => clinicas.listar({ todas: true }), [])
  const prs = useCarregar(() => profissionais.listar(), [])
  const { dados, setDados, carregando, erro, recarregar } = useCarregar(() => agendamentos.listar({
    idClinica: filterClinic ? Number(filterClinic) : undefined,
    idProfissional: filterDoctor ? Number(filterDoctor) : undefined,
    data: filterDate || undefined,
    status: (filterStatus || undefined) as StatusAgendamento | undefined,
  }), [filterClinic, filterDoctor, filterDate, filterStatus])
  const lista = (dados ?? []).slice().sort((a, b) => b.dataHora.localeCompare(a.dataHora))

  function trocar(novo: Agendamento) {
    setDados(prev => (prev ?? []).map(x => x.idAgendamento === novo.idAgendamento ? novo : x))
  }

  async function executar(a: Agendamento, acao: 'confirmar' | 'realizar') {
    setEmAndamento(a.idAgendamento); setMsg(null)
    try {
      trocar(acao === 'confirmar' ? await agendamentos.confirmar(a.idAgendamento) : await agendamentos.marcarRealizado(a.idAgendamento))
    } catch (e) {
      setMsg({ tipo: 'erro', texto: comoErroApi(e).message })
    } finally {
      setEmAndamento(null)
    }
  }

  async function doCancel() {
    if (!cancelando) return
    setEmAndamento(cancelando.idAgendamento); setMsg(null)
    try {
      trocar(await agendamentos.cancelar(cancelando.idAgendamento, motivo.trim()))
      setMsg({ tipo: 'ok', texto: 'Agendamento cancelado e horário liberado.' })
    } catch (e) {
      setMsg({ tipo: 'erro', texto: comoErroApi(e).message })
    } finally {
      setEmAndamento(null); setCancelando(null); setMotivo('')
    }
  }

  const filtroSelect = 'w-full rounded-xl border-2 px-3 py-2 text-base'
  const filtroEstilo = { borderColor: '#CBD5E1', background: '#fff', minHeight: 44 }

  return (
    <AdminShell title="Agendamentos" sub="appointments" go={go}>
      <div className="px-4 pt-4 flex flex-col gap-3">
        <div className="rounded-2xl p-3 flex flex-col gap-2 shadow-sm" style={{ background: '#fff' }}>
          <div className="flex items-center gap-2">
            <Icon name="filter" size={18} color={ADMIN_COLOR}/>
            <span className="font-bold text-base" style={{ color: ADMIN_COLOR }}>Filtros</span>
          </div>
          <Field label="Clínica" id="f-clinic">
            <select id="f-clinic" value={filterClinic} onChange={e => setFilterClinic(e.target.value)} className={filtroSelect} style={filtroEstilo}>
              <option value="">Todas as clínicas</option>
              {(cls.dados ?? []).map(c => <option key={c.idClinica} value={c.idClinica}>{c.nome}</option>)}
            </select>
          </Field>
          <Field label="Profissional" id="f-doc">
            <select id="f-doc" value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)} className={filtroSelect} style={filtroEstilo}>
              <option value="">Todos os profissionais</option>
              {(prs.dados ?? []).map(d => <option key={d.idProfissional} value={d.idProfissional}>{d.nome}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Data" id="f-date">
              <input id="f-date" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className={filtroSelect} style={filtroEstilo}/>
            </Field>
            <Field label="Situação" id="f-status">
              <select id="f-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={filtroSelect} style={filtroEstilo}>
                <option value="">Todas</option>
                <option value="AGENDADO">Agendado</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="REALIZADO">Realizado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </Field>
          </div>
          {(filterClinic || filterDoctor || filterDate || filterStatus) && (
            <button onClick={() => { setFilterClinic(''); setFilterDoctor(''); setFilterDate(''); setFilterStatus('') }}
                    className="self-start text-sm font-bold underline" style={{ color: ADMIN_COLOR }}>
              Limpar filtros
            </button>
          )}
        </div>

        {msg && (msg.tipo === 'ok' ? <MensagemSucesso texto={msg.texto}/> : <MensagemErro texto={msg.texto}/>)}

        {carregando ? <Carregando/> : erro ? <ErroCarregamento erro={erro} onTentar={recarregar}/> : (
          <>
            <p className="text-sm font-semibold" style={{ color: '#64748B' }}>
              {lista.length} agendamento{lista.length !== 1 ? 's' : ''} encontrado{lista.length !== 1 ? 's' : ''}
            </p>
            {lista.length === 0 && <ListaVazia texto="Nenhum agendamento com estes filtros."/>}
            {lista.map(a => {
              const ativo = a.status === 'AGENDADO' || a.status === 'CONFIRMADO'
              const futuro = ehFuturo(a.dataHora)
              const ocupado = emAndamento === a.idAgendamento
              return (
                <div key={a.idAgendamento} className="rounded-2xl overflow-hidden shadow-sm" style={{ background: '#fff', border: '2px solid #E2E8F0' }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#EEF2FF' }}>
                    <div className="flex items-center gap-2">
                      <Icon name="calendar" size={16} color={ADMIN_COLOR}/>
                      <span className="font-bold text-base" style={{ color: '#111827' }}>{formatarData(a.dataHora)}</span>
                      <span className="font-bold text-base" style={{ color: ADMIN_COLOR }}>{formatarHora(a.dataHora)}</span>
                    </div>
                    <StatusBadge status={a.status}/>
                  </div>
                  <div className="px-4 py-3 flex flex-col gap-1">
                    <p className="font-bold text-lg leading-tight" style={{ color: '#111827' }}>{a.paciente.nome}</p>
                    <p className="text-base" style={{ color: '#475569' }}>{a.profissional.nome} · {a.especialidade.nome}</p>
                    <p className="text-sm" style={{ color: '#64748B' }}>{a.clinica.nome}</p>
                    {a.status === 'CANCELADO' && a.motivoCancelamento && <p className="text-sm" style={{ color: '#64748B' }}>Motivo: {a.motivoCancelamento}</p>}
                    {ativo && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {a.status === 'AGENDADO' && (
                          <button onClick={() => executar(a, 'confirmar')} disabled={ocupado} className="py-2 px-3 rounded-xl text-base font-semibold"
                                  style={{ background: '#E8F1F9', color: '#0B4F8A' }}>Confirmar</button>
                        )}
                        <button onClick={() => executar(a, 'realizar')} disabled={ocupado} className="py-2 px-3 rounded-xl text-base font-semibold"
                                style={{ background: '#E8F5E9', color: '#2E7D32' }}>Marcar realizado</button>
                        {futuro && (
                          <button onClick={() => { setMotivo(''); setCancelando(a) }} disabled={ocupado} className="py-2 px-3 rounded-xl text-base font-semibold"
                                  style={{ background: '#FFEBEE', color: '#C62828' }}>Cancelar</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {cancelando && (
        <Modal titulo="Cancelar agendamento" onFechar={() => setCancelando(null)}>
          <p className="text-lg mb-4" style={{ color: '#475569' }}>
            Cancelar a consulta de <strong>{cancelando.paciente.nome}</strong> em <strong>{formatarData(cancelando.dataHora)} às {formatarHora(cancelando.dataHora)}</strong>?
            O administrador pode cancelar a qualquer momento antes do horário.
          </p>
          <Field label="Motivo (opcional)" id="adm-motivo">
            <textarea id="adm-motivo" value={motivo} onChange={e => setMotivo(e.target.value)} rows={2} maxLength={255}
                      className="w-full rounded-2xl border-2 px-4 py-3 text-lg resize-none" style={{ borderColor: '#E2E8F0', background: '#F8F9FA' }}/>
          </Field>
          <div className="flex gap-3 mt-5">
            <Btn onClick={() => setCancelando(null)} variant="outline" size="md">Voltar</Btn>
            <Btn onClick={doCancel} variant="danger" size="md" disabled={emAndamento !== null}>Sim, cancelar</Btn>
          </div>
        </Modal>
      )}
    </AdminShell>
  )
}
