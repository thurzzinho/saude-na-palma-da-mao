import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Icon, Header, Btn, Field, TextInput, StatusBadge, ProgressBar, DoctorAvatar, BottomNav, HealthCard,
  Carregando, ErroCarregamento, MensagemErro, MensagemSucesso, ListaVazia, Modal,
} from '../componentes/UI'
import { agendamentos, clinicas, disponibilidades, especialidades, pacientes, profissionais } from '../api/servicos'
import { comoErroApi, type CodigoErro } from '../api/erros'
import { USAR_MOCK } from '../api/config'
import type { Agendamento, Especialidade, ProfissionalClinica, HorarioDisponivel } from '../api/tipos'
import { useSessao } from '../contexto/Sessao'
import { useCarregar } from '../utils/useCarregar'
import {
  dataPura, diaDaSemana, ehFuturo, formatarData, formatarDataPura, formatarHora, horasAte, hojeEmRecife,
} from '../utils/datas'
import {
  cpfValido, emailValido, enderecoClinica, mascararCpf, mascararTelefone, normalizar, primeiroNome, soDigitos, iniciais,
} from '../utils/formatos'
import { telaInicial, type Go, type Parametros } from '../navegacao'

const AMIL = '#1A365D'
const ATIVOS = ['AGENDADO', 'CONFIRMADO']
const PRAZO_CANCELAMENTO_HORAS = 8 // regras v3, seção 3

// ─────────────────────────────────────────────
// WELCOME
// ─────────────────────────────────────────────
const LOGO = '/assets/logo-saude-facil.svg'
const LOGIN_HERO = '/assets/login-hero.png'

export function WelcomeScreen({ go }: { go: Go }) {
  const [restaurado, setRestaurado] = useState(false)
  const features = [
    { icon: 'benefits', title: 'Mais segurança', desc: 'Acesso protegido à sua conta de saúde' },
    { icon: 'people',   title: 'Menos burocracia', desc: 'Um único login para todos os serviços' },
    { icon: 'checkCircle', title: 'Dados protegidos', desc: 'Privacidade e sigilo garantidos' },
  ]
  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F4F9F9' }}>
      {/* Header panel with brand + hero */}
      <div className="relative overflow-hidden rounded-b-[36px] px-6 pt-12 pb-10"
           style={{ background: `linear-gradient(160deg, #2C4A73 0%, ${AMIL} 55%, #12283F 100%)` }}>
        {/* Brand lockup */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/95 flex items-center justify-center shrink-0 shadow-md">
            <img src={LOGO} alt="" className="w-8 h-8" />
          </div>
          <span className="text-[28px] leading-none text-white"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>
            Saúde Fácil
          </span>
        </div>

        {/* Welcome + hero */}
        <div className="relative z-10 mt-8 flex items-end justify-between gap-2">
          <div className="max-w-[58%]">
            <p className="text-[#F8F9FA]/80 text-base" style={{ fontFamily: "Roboto, sans-serif" }}>
              Bem-vindo(a) ao
            </p>
            <h1 className="text-[#B9CBE2] leading-none mt-1"
                style={{ fontFamily: "Roboto, sans-serif", fontWeight: 800, fontSize: 34 }}>
              Saúde Fácil
            </h1>
            <p className="text-[#F8F9FA]/75 text-[15px] leading-snug mt-3"
               style={{ fontFamily: "Roboto, sans-serif" }}>
              Acesse sua conta para agendar consultas, encontrar unidades e muito mais.
            </p>
          </div>
          <img src={LOGIN_HERO} alt="Profissional de saúde atendendo um paciente"
               className="w-[42%] max-w-[190px] object-contain pointer-events-none select-none drop-shadow-lg" />
        </div>
      </div>

      {/* Sign-in area */}
      <div className="flex-1 px-6 pt-7 flex flex-col">
        <h2 className="text-[#111827] text-xl"
            style={{ fontFamily: "Roboto, sans-serif", fontWeight: 600 }}>
          Entrar na sua conta
        </h2>
        <p className="text-[#7F7F7F] text-[15px] mt-1" style={{ fontFamily: "Roboto, sans-serif" }}>
          Para continuar, entre com sua conta de paciente.
        </p>

        {/* Primary: patient login */}
        <button onClick={() => go('login')}
                className="mt-5 w-full flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-white shadow-md transition-transform active:scale-[0.99]"
                style={{ background: AMIL }}>
          <span className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Icon name="user" size={20} color="#fff"/>
            </span>
            <span className="text-lg font-semibold" style={{ fontFamily: "Roboto, sans-serif" }}>
              Entrar como paciente
            </span>
          </span>
          <Icon name="chevron-right" size={22} color="rgba(255,255,255,0.8)"/>
        </button>

        {/* Secondary: professional access */}
        <button onClick={() => go('pro-login')}
                className="mt-3 w-full flex items-center justify-between gap-3 rounded-2xl px-5 py-4 bg-white border transition-transform active:scale-[0.99]"
                style={{ borderColor: '#D7E2EC' }}>
          <span className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#E6F0EA' }}>
              <Icon name="stethoscope" size={20} color="#2E7D32"/>
            </span>
            <span className="text-lg font-semibold" style={{ color: '#111827', fontFamily: "Roboto, sans-serif" }}>
              Acesso do profissional
            </span>
          </span>
          <Icon name="chevron-right" size={22} color="#9AA7B5"/>
        </button>

        <button onClick={() => go('register')}
                className="mt-3 text-center text-[15px]" style={{ color: '#7F7F7F', fontFamily: "Roboto, sans-serif" }}>
          Não tem conta?{' '}
          <span className="font-bold" style={{ color: AMIL }}>Criar agora</span>
        </button>

        {/* Trust features */}
        <div className="mt-7 border-t pt-6" style={{ borderColor: '#E3ECEC' }}>
          <p className="text-center text-[13px] text-[#7F7F7F]" style={{ fontFamily: "Roboto, sans-serif" }}>
            Por que usar o Saúde Fácil?
          </p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {features.map(f => (
              <div key={f.title} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#EAF0F8' }}>
                  <Icon name={f.icon} size={26} color={AMIL}/>
                </div>
                <p className="text-[13px] font-bold mt-2" style={{ color: '#5A6B85', fontFamily: "Roboto, sans-serif" }}>
                  {f.title}
                </p>
                <p className="text-[11px] leading-tight mt-1 text-[#8A97A6]" style={{ fontFamily: "Roboto, sans-serif" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Minimal footer links */}
        <div className="mt-auto pt-6 pb-6 flex items-center justify-center gap-4">
          <button onClick={() => go('admin-login')} className="text-[13px] text-[#9AA7B5] underline underline-offset-2">
            Acesso administrativo
          </button>
          <span className="text-[#D7E2EC]">•</span>
          <button onClick={() => go('alerts')} className="text-[13px] text-[#9AA7B5] underline underline-offset-2">
            Avisos do sistema
          </button>
        </div>
        {USAR_MOCK && (
          <div className="pb-6 -mt-3 text-center">
            <button onClick={async () => { const m = await import('../api/mock/banco'); m.restaurarBanco(); setRestaurado(true) }}
                    className="text-[13px] text-[#9AA7B5] underline underline-offset-2">
              {restaurado ? 'Dados de demonstração restaurados' : 'Modo demonstração: restaurar dados'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function LoginScreen({ go }: { go: Go }) {
  const { entrar } = useSessao()
  const [cpf, setCpf]   = useState('')
  const [pass, setPass] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!cpf.trim() || !pass) { setErro('Informe seu e-mail ou CPF e a senha.'); return }
    setEnviando(true); setErro('')
    try {
      const u = await entrar(cpf.trim(), pass)
      go(telaInicial(u.tipoUsuario))
    } catch (err) {
      setErro(comoErroApi(err).message)
    } finally {
      setEnviando(false)
    }
  }
  const line = 'w-full bg-transparent text-lg py-2 outline-none placeholder:italic placeholder:text-slate-400 border-b-2 border-slate-300 focus:border-[#1A365D] transition-colors'
  return (
    <div className="flex flex-col min-h-full" style={{ background: '#fff' }}>
      <div className="px-6 pt-5 pb-8 flex flex-col gap-4"
           style={{ background: 'linear-gradient(180deg, #2A4A7F 0%, #1A365D 100%)', borderRadius: '0 0 32px 32px' }}>
        <button onClick={() => go('welcome')} aria-label="Voltar"
                className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50">
          <Icon name="arrowLeft" size={24} color="#fff"/>
        </button>
        <div className="flex items-center gap-3">
          <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
            <rect width="48" height="48" rx="12" fill="#fff"/>
            <circle cx="15" cy="12" r="3.2" fill="#2EC4B6"/><circle cx="24" cy="9" r="3.2" fill="#1FA79A"/><circle cx="33" cy="12" r="3.2" fill="#2EC4B6"/>
            <path d="M24 40C11 31 8 24 8 19.5 8 15.5 11 13.5 14 14.5c2.2.7 3.9 2.3 5 3.8L24 16l5-1.7c1.1-1.5 2.8-3.1 5-3.8 3-1 6 1 6 5 0 4.5-3 11.5-16 24.5z" fill="#2EC4B6"/>
            <rect x="21" y="20" width="6" height="14" rx="1.5" fill="#fff"/><rect x="17" y="24" width="14" height="6" rx="1.5" fill="#fff"/>
          </svg>
          <span className="text-white text-[28px] leading-none" style={{ fontFamily: "Poppins, sans-serif" }}>Saúde Fácil</span>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-white text-lg">Bem-vindo(a) ao</p>
            <h1 className="text-3xl leading-tight mb-3" style={{ color: '#BFD0EA', fontFamily: "Poppins, sans-serif" }}>Saúde Fácil</h1>
            <p className="text-white text-base leading-snug">Acesse sua conta para agendar consultas, encontrar unidades e muito mais.</p>
          </div>
          <svg viewBox="0 0 150 170" width="140" height="158" aria-hidden="true" className="shrink-0 hidden min-[400px]:block">
            <rect x="40" y="4" width="76" height="120" rx="14" fill="none" stroke="#9FE3DC" strokeWidth="3"/>
            <rect x="66" y="4" width="24" height="5" rx="2.5" fill="#9FE3DC"/>
            <rect x="52" y="24" width="52" height="34" rx="8" fill="#0F2748"/>
            <path d="M78 52c-9-6-11-10-11-13 0-3 2-4 4-3.5 1.5.4 2.700 1.5 3.5 2.5l3.5-1.200 3.5 1.200c.8-1 2-2.100 3.5-2.5 2-.5 4 .5 4 3.5 0 3-2 7-11 13z" fill="#2EC4B6"/>
            <rect x="76" y="39" width="4" height="9" rx="1" fill="#fff"/><rect x="73.5" y="41.5" width="9" height="4" rx="1" fill="#fff"/>
            <rect x="108" y="36" width="30" height="22" rx="8" fill="#fff"/><path d="M116 47l4 4 8-8" stroke="#2EC4B6" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M118 58l-2 7 8-7z" fill="#fff"/>
            {/* doctor */}
            <circle cx="38" cy="88" r="13" fill="#F2C4A0"/><path d="M25 86c0-10 6-15 14-15 8 0 12 5 12 12-4-5-9-7-13-6-6 1-10 4-13 9z" fill="#2B2B3A"/>
            <path d="M16 170v-50c0-9 8-15 22-15s22 6 22 15v50z" fill="#fff"/>
            <path d="M32 106l6 22 6-22" fill="none" stroke="#9FB4CC" strokeWidth="2"/>
            <rect x="52" y="118" width="28" height="20" rx="3" fill="#2A3B52" transform="rotate(-12 66 128)"/>
            {/* patient */}
            <circle cx="112" cy="92" r="13" fill="#E2A982"/><path d="M99 90c0-9 6-13 13-13 8 0 13 5 13 12-5-4-9-5-13-4-5 0-10 2-13 5z" fill="#1B1B25"/>
            <path d="M84 170v-44c0-10 9-16 28-16s28 6 28 16v44z" fill="#1FA79A"/>
            <path d="M84 134l-6-2" stroke="#1FA79A" strokeWidth="10" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      <form className="flex-1 px-6 pt-8 pb-8 w-full max-w-md mx-auto flex flex-col"
            onSubmit={enviar} noValidate>
        <h2 className="text-2xl font-bold" style={{ color: '#111827', fontFamily: 'Nunito, sans-serif' }}>Entrar na sua conta</h2>
        <p className="text-base mt-1 mb-6" style={{ color: '#475569' }}>Para continuar, entre com sua conta de paciente.</p>

        <label htmlFor="login-id" className="font-bold text-base" style={{ color: '#111827' }}>E-mail ou CPF</label>
        <input id="login-id" value={cpf} onChange={e => setCpf(e.target.value)} autoComplete="username"
               placeholder="exemplo@email.com ou 000.000.000-00" className={`${line} mb-6`} style={{ color: '#111827' }}/>

        <label htmlFor="login-pass" className="font-bold text-base" style={{ color: '#111827' }}>Senha</label>
        <input id="login-pass" type="password" value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password"
               placeholder="Digite sua senha" className={line} style={{ color: '#111827' }}/>

        <div className="mt-5">{erro && <MensagemErro texto={erro}/>}</div>

        <button type="submit"
                disabled={enviando}
                className="w-full rounded-xl text-lg font-bold text-white mt-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1A365D]/40"
                style={{ background: enviando ? '#64748B' : AMIL, minHeight: 56 }}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
        <button type="button" onClick={() => go('register')}
                className="mt-2 min-h-[48px] text-lg font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1A365D]/40 rounded"
                style={{ color: AMIL }}>
          Quero me cadastrar
        </button>

      </form>
    </div>
  )
}

// ─────────────────────────────────────────────
// REGISTER (cadastro de paciente)
// ─────────────────────────────────────────────
export function RegisterScreen({ go }: { go: Go }) {
  const { cadastrarPaciente } = useSessao()
  const [form, setForm] = useState({ name: '', cpf: '', birth: '', phone: '', email: '', pass: '', pass2: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  function validar(): string | null {
    if (form.name.trim().split(/\s+/).length < 2) return 'Informe seu nome completo.'
    if (!cpfValido(form.cpf)) return 'CPF inválido. Confira os números.'
    if (!form.birth || form.birth > hojeEmRecife(0)) return 'Informe uma data de nascimento válida.'
    if (soDigitos(form.phone).length < 10) return 'Informe um telefone com DDD.'
    if (!emailValido(form.email)) return 'Informe um e-mail válido.'
    if (form.pass.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.'
    if (form.pass !== form.pass2) return 'As senhas não são iguais.'
    return null
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    const problema = validar()
    if (problema) { setErro(problema); return }
    setEnviando(true); setErro('')
    try {
      await cadastrarPaciente({
        nome: form.name.trim(), cpf: soDigitos(form.cpf), dataNascimento: form.birth,
        telefone: form.phone, email: form.email.trim().toLowerCase(), senha: form.pass,
      })
      go('home')
    } catch (err) {
      setErro(comoErroApi(err).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F8F9FA' }}>
      <div className="relative overflow-hidden px-6 pt-12 pb-8" style={{ background: AMIL }}>
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }}/>
        <button onClick={() => go('welcome')} className="flex items-center gap-2 text-white/75 mb-3 text-base">
          <Icon name="arrowLeft" size={18} color="rgba(255,255,255,0.75)"/> Voltar
        </button>
        <h1 className="text-white text-3xl font-black" style={{ fontFamily: 'Nunito, sans-serif' }}>Criar minha conta</h1>
        <p className="text-white/70 text-base mt-1">Preencha seus dados para começar.</p>
      </div>
      <form className="flex-1 px-5 pt-5 pb-10 flex flex-col gap-4" onSubmit={enviar} noValidate>
        <div className="rounded-3xl p-5 shadow-sm flex flex-col gap-4" style={{ background: '#fff' }}>
          <Field label="Nome completo" id="reg-name"><TextInput id="reg-name" value={form.name} onChange={set('name')} placeholder="Seu nome completo" autoComplete="name"/></Field>
          <Field label="CPF" id="reg-cpf"><TextInput id="reg-cpf" value={form.cpf} onChange={v => set('cpf')(mascararCpf(v))} placeholder="000.000.000-00" inputMode="numeric"/></Field>
          <Field label="Data de nascimento" id="reg-birth"><TextInput id="reg-birth" type="date" value={form.birth} onChange={set('birth')} autoComplete="bday" max={hojeEmRecife(0)}/></Field>
          <Field label="Telefone" id="reg-phone"><TextInput id="reg-phone" type="tel" value={form.phone} onChange={v => set('phone')(mascararTelefone(v))} placeholder="(81) 99999-9999" autoComplete="tel"/></Field>
          <Field label="E-mail" id="reg-email"><TextInput id="reg-email" type="email" value={form.email} onChange={set('email')} placeholder="seu@email.com" autoComplete="email"/></Field>
          <Field label="Senha (mínimo 6 caracteres)" id="reg-pass"><TextInput id="reg-pass" type="password" value={form.pass} onChange={set('pass')} placeholder="Crie uma senha" autoComplete="new-password"/></Field>
          <Field label="Repita a senha" id="reg-pass2"><TextInput id="reg-pass2" type="password" value={form.pass2} onChange={set('pass2')} placeholder="Digite a senha de novo" autoComplete="new-password"/></Field>
        </div>
        {erro && <MensagemErro texto={erro}/>}
        <Btn type="submit" size="lg" disabled={enviando}>{enviando ? 'Criando conta...' : 'Criar minha conta'}</Btn>
        <p className="text-center text-base" style={{ color: '#64748B' }}>
          Já tenho conta.{' '}
          <button type="button" className="font-bold" style={{ color: AMIL }} onClick={() => go('login')}>Entrar</button>
        </p>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────
// PRE-TRIAGE DATA
// Pré-triagem por regras simples. A versão com IA é escopo da 2ª entrega.
// O resultado é enviado para o agendamento pelo NOME da especialidade,
// que é procurado na lista vinda da API.
// ─────────────────────────────────────────────
const TRIAGE_GROUPS = [
  {
    label: 'Olhos', color: '#6A1B9A', bg: '#F3E5F5', icon: 'eye',
    symptoms: [
      { id: 1, label: 'Baixa visão' },
      { id: 2, label: 'Olho vermelho' },
      { id: 3, label: 'Visão embaçada' },
      { id: 4, label: 'Sensação de areia nos olhos' },
    ],
    specialtyId: 7,
  },
  {
    label: 'Coração', color: '#C62828', bg: '#FFEBEE', icon: 'heart',
    symptoms: [
      { id: 5, label: 'Dor no peito' },
      { id: 6, label: 'Palpitações' },
      { id: 7, label: 'Pressão alta' },
      { id: 8, label: 'Falta de ar ao se esforçar' },
    ],
    specialtyId: 2,
  },
  {
    label: 'Pele', color: '#E65100', bg: '#FFF3E0', icon: 'skin',
    symptoms: [
      { id: 9,  label: 'Manchas na pele' },
      { id: 10, label: 'Coceira intensa' },
      { id: 11, label: 'Acne ou espinhas' },
      { id: 12, label: 'Queda de cabelo' },
    ],
    specialtyId: 4,
  },
  {
    label: 'Ossos e músculos', color: '#37474F', bg: '#ECEFF1', icon: 'bone',
    symptoms: [
      { id: 13, label: 'Dor nas costas' },
      { id: 14, label: 'Dor no joelho' },
      { id: 15, label: 'Dor no ombro' },
      { id: 16, label: 'Dor nas articulações' },
    ],
    specialtyId: 3,
  },
  {
    label: 'Saúde mental', color: '#1565C0', bg: '#E3F2FD', icon: 'brain',
    symptoms: [
      { id: 17, label: 'Ansiedade' },
      { id: 18, label: 'Insônia' },
      { id: 19, label: 'Tristeza persistente' },
      { id: 20, label: 'Irritabilidade constante' },
    ],
    specialtyId: 8,
  },
  {
    label: 'Saúde feminina', color: '#AD1457', bg: '#FCE4EC', icon: 'female',
    symptoms: [
      { id: 21, label: 'Irregularidade menstrual' },
      { id: 22, label: 'Dor pélvica' },
    ],
    specialtyId: 6,
  },
  {
    label: 'Infantil', color: '#2E7D32', bg: '#E8F5E9', icon: 'child',
    symptoms: [
      { id: 23, label: 'Febre na criança' },
      { id: 24, label: 'Tosse persistente (criança)' },
    ],
    specialtyId: 5,
  },
  {
    label: 'Sintomas gerais', color: '#1A365D', bg: '#EAF0F8', icon: 'stethoscope',
    symptoms: [
      { id: 25, label: 'Febre' },
      { id: 26, label: 'Cansaço excessivo' },
      { id: 27, label: 'Dor de cabeça frequente' },
      { id: 28, label: 'Gripe ou resfriado' },
    ],
    specialtyId: 1,
  },
]

const SPECIALTY_EXPLANATIONS: Record<number, string> = {
  1: 'Seus sintomas indicam uma avaliação geral. O clínico geral é o ponto de partida ideal.',
  2: 'Sintomas que podem estar relacionados ao coração. Recomendamos um cardiologista.',
  3: 'Você relatou sintomas musculoesqueléticos. O ortopedista é o especialista indicado.',
  4: 'Sintomas característicos de condições de pele. O dermatologista é o indicado.',
  5: 'Para sintomas em crianças, o pediatra é o profissional mais adequado.',
  6: 'Seus sintomas indicam necessidade de avaliação ginecológica.',
  7: 'Sintomas oculares identificados. O oftalmologista é o especialista indicado.',
  8: 'Seus sintomas sugerem necessidade de acompanhamento em saúde mental.',
}

// ─────────────────────────────────────────────
// PRE-TRIAGE SCREEN
// ─────────────────────────────────────────────
export function PreTriageScreen({ go }: { go: Go }) {
  const onSpecialtySelected = (sp: { id: number; name: string }) => go('booking', { especialidadeSugerida: sp.name })
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [phase, setPhase] = useState<'select' | 'result'>('select')
  const [activeGroup, setActiveGroup] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState<{ from: 'bot' | 'patient'; text: string }[]>([
    { from: 'bot', text: 'Olá! Sou a assistente de pré-triagem. Vou ajudar a encontrar a especialidade mais adequada para você.' },
    { from: 'bot', text: 'Escolha uma área do corpo ou conte, com suas palavras, o que está sentindo.' },
  ])
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [chat, activeGroup, selected])

  function toggle(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectGroup(index: number) {
    const group = TRIAGE_GROUPS[index]
    setActiveGroup(index)
    setChat(prev => [...prev,
      { from: 'patient', text: group.label },
      { from: 'bot', text: `Certo. Quais destes sintomas em ${group.label.toLowerCase()} você percebe? Você pode marcar mais de um.` },
    ])
  }

  function sendMessage() {
    const typed = message.trim()
    if (!typed) return
    const normalized = typed.toLowerCase()
    const matched = TRIAGE_GROUPS.flatMap(group => group.symptoms.filter(sym => {
      const label = sym.label.toLowerCase()
      return label.split(' ').some(word => word.length > 3 && normalized.includes(word))
    }))
    if (matched.length) {
      setSelected(prev => new Set([...prev, ...matched.map(sym => sym.id)]))
    }
    setChat(prev => [...prev,
      { from: 'patient', text: typed },
      { from: 'bot', text: matched.length ? `Registrei ${matched.map(sym => `“${sym.label}”`).join(', ')}. Você pode incluir outros sintomas ou pedir sua recomendação.` : 'Entendi. Para registrar com precisão, escolha uma área abaixo e marque os sintomas que mais se aproximam do que você sente.' },
    ])
    setMessage('')
  }

  function toggleListening() {
    const speechWindow = window as typeof window & { SpeechRecognition?: any; webkitSpeechRecognition?: any }
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setChat(prev => [...prev, { from: 'bot', text: 'A digitação por voz não está disponível neste navegador. Você pode descrever seus sintomas no campo de texto.' }])
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => {
      setIsListening(false)
      setChat(prev => [...prev, { from: 'bot', text: 'Não consegui captar o áudio. Tente falar novamente ou escreva sua resposta.' }])
    }
    recognition.onresult = (event: any) => setMessage(event.results[0][0].transcript)
    recognitionRef.current = recognition
    recognition.start()
  }

  // Score each specialty
  function getBestSpecialty() {
    const scores: Record<number, number> = {}
    for (const group of TRIAGE_GROUPS) {
      const hits = group.symptoms.filter(s => selected.has(s.id)).length
      if (hits > 0) scores[group.specialtyId] = (scores[group.specialtyId] ?? 0) + hits
    }
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
    if (!best) return null
    const spId = Number(best[0])
    const spName = TRIAGE_GROUPS.find(g => g.specialtyId === spId)?.label === 'Sintomas gerais'
      ? 'Clínica Geral'
      : TRIAGE_GROUPS.find(g => g.specialtyId === spId)?.label ?? ''
    // Map group label to specialty name from SPECIALTIES
    const SPECIALTY_NAMES: Record<number, string> = {
      1: 'Clínica Geral', 2: 'Cardiologia', 3: 'Ortopedia',
      4: 'Dermatologia', 5: 'Pediatria', 6: 'Ginecologia',
      7: 'Oftalmologia', 8: 'Psiquiatria',
    }
    return { id: spId, name: SPECIALTY_NAMES[spId] ?? spName }
  }

  const result = phase === 'result' ? getBestSpecialty() : null
  const resultGroup = result ? TRIAGE_GROUPS.find(g => g.specialtyId === result.id) : null

  if (phase === 'result' && result) {
    return (
      <div className="flex flex-col min-h-full" style={{ background: '#F8F9FA' }}>
        <div className="relative overflow-hidden px-5 pt-6 pb-10" style={{ background: AMIL }}>
          <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }}/>
          <button onClick={() => setPhase('select')} className="flex items-center gap-2 text-white/75 mb-3 text-base relative z-10">
            <Icon name="arrowLeft" size={18} color="rgba(255,255,255,0.75)"/> Rever sintomas
          </button>
          <h1 className="text-white text-2xl font-black relative z-10" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Pré-triagem concluída
          </h1>
        </div>

        <div className="flex-1 px-4 -mt-5 pb-8 flex flex-col gap-4">
          {/* Result card */}
          <div className="rounded-3xl overflow-hidden shadow-lg" style={{ background: '#fff' }}>
            <div className="px-5 pt-5 pb-4 flex flex-col items-center text-center gap-3"
                 style={{ background: resultGroup?.bg ?? '#EAF0F8' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
                   style={{ background: resultGroup?.color ?? AMIL }}>
                <Icon name={resultGroup?.icon ?? 'stethoscope'} size={32} color="#fff"/>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest mb-1"
                   style={{ color: resultGroup?.color ?? AMIL, opacity: 0.7 }}>Especialidade indicada</p>
                <h2 className="text-2xl font-black" style={{ color: '#111827', fontFamily: 'Nunito, sans-serif' }}>
                  {result.name}
                </h2>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-base leading-relaxed" style={{ color: '#475569' }}>
                {SPECIALTY_EXPLANATIONS[result.id]}
              </p>
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #F1F5F9' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#94A3B8' }}>Sintomas informados:</p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selected).map(id => {
                    const grp = TRIAGE_GROUPS.find(g => g.symptoms.some(s => s.id === id))
                    const sym = grp?.symptoms.find(s => s.id === id)
                    return sym ? (
                      <span key={id} className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: grp?.bg, color: grp?.color }}>
                        {sym.label}
                      </span>
                    ) : null
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-2xl p-4 flex gap-3"
               style={{ background: '#FEF3E2', border: '1.5px solid #FCD9A5' }}>
            <Icon name="warning" size={20} color="#D97706"/>
            <p className="text-sm leading-snug flex-1" style={{ color: '#8A4B0A' }}>
              Esta pré-triagem é apenas uma sugestão. O diagnóstico final é responsabilidade do médico.
            </p>
          </div>

          <Btn onClick={() => onSpecialtySelected(result)} size="lg">
            <Icon name="calendar" size={22} color="#fff"/> Agendar com {result.name}
          </Btn>
          <Btn onClick={() => go('home')} variant="ghost" size="md">Voltar ao início</Btn>
        </div>
        <BottomNav active="home" go={go}/>
      </div>
    )
  }

  const group = activeGroup === null ? null : TRIAGE_GROUPS[activeGroup]
  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F8F9FA' }}>
      <div className="relative overflow-hidden px-5 pt-6 pb-5" style={{ background: AMIL }}>
        <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }}/>
        <button onClick={() => go('home')} className="flex items-center gap-2 text-white/75 mb-3 text-base relative z-10"><Icon name="arrowLeft" size={18} color="rgba(255,255,255,0.75)"/> Voltar</button>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.16)' }}><Icon name="stethoscope" size={24} color="#fff"/></div>
          <div><h1 className="text-white text-2xl font-black" style={{ fontFamily: 'Nunito, sans-serif' }}>Pré-triagem por conversa</h1><p className="text-white/70 text-sm">Informações seguras, no seu ritmo</p></div>
        </div>
      </div>

      <main className="flex-1 px-4 py-4 flex flex-col gap-3 overflow-y-auto">
        <div className="self-start max-w-[88%] rounded-2xl rounded-tl-md px-4 py-3 shadow-sm" style={{ background: '#EAF0F8', color: AMIL }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1">Assistente Saúde</p>
          <p className="text-sm leading-relaxed">Esta conversa não substitui uma avaliação médica. Em caso de emergência, procure atendimento imediato.</p>
        </div>
        {chat.map((item, index) => <div key={index} className={`max-w-[86%] rounded-2xl px-4 py-3 text-base leading-snug ${item.from === 'patient' ? 'self-end rounded-br-md text-white' : 'self-start rounded-tl-md shadow-sm'}`} style={{ background: item.from === 'patient' ? AMIL : '#fff', color: item.from === 'patient' ? '#fff' : '#334155' }}>{item.text}</div>)}

        <div className="pt-1">
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#64748B' }}>Escolha uma área</p>
          <div className="flex flex-wrap gap-2">
            {TRIAGE_GROUPS.map((item, index) => <button key={item.label} onClick={() => selectGroup(index)} className="px-3 py-2 rounded-full text-sm font-bold transition-transform active:scale-95" style={{ background: activeGroup === index ? item.color : item.bg, color: activeGroup === index ? '#fff' : item.color, border: `1px solid ${activeGroup === index ? item.color : 'transparent'}` }}>{item.label}</button>)}
          </div>
        </div>

        {group && <div className="rounded-2xl p-3" style={{ background: group.bg, border: `1px solid ${group.color}30` }}>
          <div className="flex items-center justify-between mb-2"><p className="text-sm font-bold" style={{ color: group.color }}>Sintomas em {group.label.toLowerCase()}</p><button onClick={() => setActiveGroup(null)} className="text-xs font-bold" style={{ color: group.color }}>Trocar área</button></div>
          <div className="flex flex-wrap gap-2">{group.symptoms.map(sym => { const sel = selected.has(sym.id); return <button key={sym.id} onClick={() => toggle(sym.id)} className="px-3 py-2 rounded-full text-sm font-semibold" style={{ background: sel ? group.color : '#fff', color: sel ? '#fff' : group.color, border: `1px solid ${group.color}50` }}>{sel ? '✓ ' : ''}{sym.label}</button> })}</div>
        </div>}

        {selected.size > 0 && <div className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: '#E8F5E9', border: '1px solid #B7D8B9' }}><span className="text-sm font-bold" style={{ color: '#2E7D32' }}>{selected.size} sintoma{selected.size > 1 ? 's' : ''} registrado{selected.size > 1 ? 's' : ''}</span><button onClick={() => setSelected(new Set())} className="text-sm font-bold" style={{ color: '#C62828' }}>Limpar</button></div>}
        <div ref={chatEndRef}/>
      </main>

      <div className="px-4 pt-3 pb-2" style={{ background: '#fff', borderTop: '1px solid #E2E8F0' }}>
        {selected.size > 0 && <button onClick={() => setPhase('result')} className="w-full mb-3 rounded-2xl py-3 text-base font-bold text-white flex items-center justify-center gap-2" style={{ background: '#2E7D32' }}><Icon name="checkCircle" size={20} color="#fff"/> Ver recomendação</button>}
        <div className="flex items-center gap-2">
          <button onClick={toggleListening} aria-label={isListening ? 'Parar gravação' : 'Falar por áudio'} className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: isListening ? '#FFEBEE' : '#EAF0F8', border: `1px solid ${isListening ? '#C62828' : '#B9CBE2'}` }}><Icon name="microphone" size={22} color={isListening ? '#C62828' : AMIL}/></button>
          <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder={isListening ? 'Ouvindo você…' : 'Digite seus sintomas'} className="min-w-0 flex-1 h-12 rounded-2xl px-4 text-base outline-none" style={{ background: '#F8F9FA', border: '1px solid #CBD5E1', color: '#111827' }}/>
          <button onClick={sendMessage} aria-label="Enviar mensagem" className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: AMIL }}><Icon name="send" size={20} color="#fff"/></button>
        </div>
        <p className="text-center text-xs mt-1.5" style={{ color: isListening ? '#C62828' : '#94A3B8' }}>{isListening ? 'Ouvindo… toque no microfone para parar' : 'Toque no microfone para falar'}</p>
      </div>
      <BottomNav active="home" go={go}/>
    </div>
  )
}

// ─────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: 'card',      label: 'Meu cartão', screen: 'card'         as const, color: '#2196F3', bg: '#E3F2FD' },
  { icon: 'map',       label: 'Clínicas',   screen: 'clinics'      as const, color: '#6A1B9A', bg: '#F3E5F5' },
  { icon: 'schedule',  label: 'Consultas',  screen: 'appointments' as const, color: '#2E7D32', bg: '#E8F5E9' },
  { icon: 'bell',      label: 'Avisos',     screen: 'alerts'       as const, color: '#E65100', bg: '#FFF3E0' },
]

/** Próxima consulta ativa e futura */
function proximaConsulta(lista: Agendamento[] | null) {
  return (lista ?? [])
    .filter(a => ATIVOS.includes(a.status) && ehFuturo(a.dataHora))
    .sort((a, b) => a.dataHora.localeCompare(b.dataHora))[0]
}

export function HomeScreen({ go }: { go: Go }) {
  const { usuario } = useSessao()
  const { dados, carregando, erro, recarregar } = useCarregar(() => agendamentos.listar(), [])
  const next = proximaConsulta(dados)
  const nome = usuario?.nome ?? ''
  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F8F9FA' }}>
      <div className="relative overflow-hidden px-5 pt-5 pb-20" style={{ background: AMIL }}>
        <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }}/>
        <div className="relative z-10 flex items-center gap-2">
          <Icon name="benefits" size={24} color="#fff"/>
          <span className="text-white font-black text-xl" style={{ fontFamily: 'Nunito, sans-serif' }}>Saúde na Palma da Mão</span>
        </div>
      </div>

      <div className="flex-1 pb-2 flex flex-col gap-5 -mt-14">
        <div className="mx-4 rounded-3xl bg-white p-5 shadow-md flex flex-col gap-3">
          <div className="flex items-stretch gap-3">
            <div className="w-1 rounded-full shrink-0" style={{ background: AMIL }}/>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black truncate" style={{ color: '#111827', fontFamily: 'Nunito, sans-serif' }}>Olá, {primeiroNome(nome)}</h1>
              <p className="text-sm mt-1" style={{ color: '#64748B' }}>O que você precisa hoje?</p>
            </div>
            <button onClick={() => go('profile')} aria-label="Abrir perfil"
                    className="w-16 h-16 rounded-full flex items-center justify-center font-black text-xl text-white shrink-0"
                    style={{ background: AMIL, border: '3px solid #2E7D32', fontFamily: 'Nunito, sans-serif' }}>
              {iniciais(nome)}
            </button>
          </div>
          <Btn onClick={() => go('booking')} size="md">
            <Icon name="calendar" size={20} color="#fff"/> Agendar consulta
          </Btn>
        </div>

        <div>
          <div className="flex items-center justify-between px-5 mb-3">
            <p className="font-bold text-base" style={{ color: '#111827' }}>Acesso rápido</p>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1 snap-x" style={{ scrollbarWidth: 'none' }}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} onClick={() => go(a.screen)}
                      className="flex flex-col items-center gap-2 w-[84px] shrink-0 snap-start active:scale-95 transition-transform">
                <span className="w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-sm" style={{ border: `2px solid ${a.bg}` }}>
                  <Icon name={a.icon} size={28} color={a.color}/>
                </span>
                <span className="text-xs font-semibold text-center leading-tight" style={{ color: '#334155' }}>{a.label}</span>
              </button>
            ))}
            {/* SAMU: 192 é o número nacional de emergência médica */}
            <a href="tel:192" className="flex flex-col items-center gap-2 w-[84px] shrink-0 snap-start active:scale-95 transition-transform">
              <span className="w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-sm" style={{ border: '2px solid #FFEBEE' }}>
                <Icon name="emergency" size={28} color="#C62828"/>
              </span>
              <span className="text-xs font-semibold text-center leading-tight" style={{ color: '#334155' }}>Emergência (192)</span>
            </a>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto px-4 snap-x snap-mandatory pb-1" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => go('pre-triage')}
                  className="snap-center shrink-0 w-[86%] max-w-[380px] rounded-3xl p-5 flex items-center gap-3 text-left shadow-sm relative overflow-hidden"
                  style={{ background: AMIL }}>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }}/>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <Icon name="stethoscope" size={26} color="#fff"/>
            </div>
            <div className="flex-1 min-w-0 relative">
              <p className="font-black text-lg leading-tight text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>Iniciar pré-triagem</p>
              <p className="text-sm text-white/70 leading-snug">Descubra a especialidade ideal para você</p>
            </div>
            <Icon name="chevron-right" size={22} color="rgba(255,255,255,0.85)"/>
          </button>

          <div className="snap-center shrink-0 w-[86%] max-w-[380px]">
            {carregando ? (
              <div className="rounded-3xl p-5 bg-white shadow-sm animate-pulse h-full min-h-[120px]"/>
            ) : erro ? (
              <ErroCarregamento erro={erro} onTentar={recarregar}/>
            ) : next ? (
              <button onClick={() => go('appointment-detail', { idAgendamento: next.idAgendamento })}
                      className="w-full h-full rounded-3xl p-4 flex flex-col gap-2 text-left shadow-sm bg-white">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold" style={{ color: '#111827' }}>Próxima consulta</p>
                  <span className="text-xs font-semibold" style={{ color: AMIL }}>Ver detalhes</span>
                </div>
                <div className="flex items-center gap-3">
                  <DoctorAvatar name={next.profissional.nome} size={52}/>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base leading-tight truncate" style={{ color: '#111827' }}>{next.profissional.nome}</p>
                    <p className="text-sm" style={{ color: '#64748B' }}>{next.especialidade.nome}</p>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: AMIL }}>
                        <Icon name="calendar" size={14} color={AMIL}/> {formatarData(next.dataHora)}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: AMIL }}>
                        <Icon name="clock" size={14} color={AMIL}/> {formatarHora(next.dataHora)}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={next.status}/>
                </div>
              </button>
            ) : (
              <div className="rounded-3xl p-5 flex flex-col items-center gap-3 text-center shadow-sm bg-white h-full">
                <p className="text-base font-semibold" style={{ color: '#64748B' }}>Você ainda não tem consultas marcadas</p>
                <Btn onClick={() => go('booking')} size="md" full={false}>
                  <Icon name="calendar" size={20} color="#fff"/> Agendar consulta
                </Btn>
              </div>
            )}
          </div>
        </div>

        <div className="mx-4 rounded-2xl p-4 flex items-center gap-3 bg-white shadow-sm">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#EAF0F8' }}>
            <Icon name="heart" size={22} color={AMIL}/>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-base" style={{ color: AMIL }}>Dica de saúde</p>
            <p className="text-sm mt-0.5 leading-snug" style={{ color: '#334155' }}>
              Consultas preventivas ajudam a identificar problemas antes que se tornem graves.
            </p>
          </div>
        </div>
      </div>

      <BottomNav active="home" go={go}/>
    </div>
  )
}

// ─────────────────────────────────────────────
// CLÍNICAS (consulta e pesquisa)
// ─────────────────────────────────────────────
export function ClinicsScreen({ go }: { go: Go }) {
  const [busca, setBusca] = useState('')
  const lista = useCarregar(() => clinicas.listar(), [])
  const esps = useCarregar(() => especialidades.listar(), [])
  const nomeEsp = (id: number) => esps.dados?.find(e => e.idEspecialidade === id)?.nome
  const filtradas = (lista.dados ?? []).filter(c =>
    !busca || normalizar(c.nome).includes(normalizar(busca)) || normalizar(c.bairro ?? '').includes(normalizar(busca)))

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F8F9FA' }}>
      <Header title="Clínicas" onBack={() => go('home')}/>

      <main className="flex-1 px-4 py-5 flex flex-col gap-4">
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: '#EAF0F8', border: '1.5px solid #B9CBE2' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fff' }}>
            <Icon name="map" size={24} color={AMIL}/>
          </div>
          <div>
            <p className="font-bold text-lg leading-tight" style={{ color: AMIL }}>Clínicas da plataforma</p>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: '#475569' }}>
              Consulte endereços, horários e especialidades atendidas.
            </p>
          </div>
        </div>

        <Field label="Buscar por nome ou bairro" id="cl-busca">
          <TextInput id="cl-busca" type="search" value={busca} onChange={setBusca} placeholder="Ex.: Boa Viagem"/>
        </Field>

        {lista.carregando ? <Carregando/> : lista.erro ? <ErroCarregamento erro={lista.erro} onTentar={lista.recarregar}/> : (
          <>
            <p className="text-sm font-semibold" style={{ color: '#64748B' }}>
              {filtradas.length} {filtradas.length === 1 ? 'clínica encontrada' : 'clínicas encontradas'}
            </p>
            {filtradas.length === 0 && <ListaVazia texto="Nenhuma clínica encontrada para esta busca."/>}
            {filtradas.map(clinic => {
              const nomes = clinic.idsEspecialidades.map(nomeEsp).filter(Boolean) as string[]
              return (
                <article key={clinic.idClinica} className="rounded-2xl p-4 shadow-sm" style={{ background: '#fff', border: '1px solid #E2E8F0' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#E8F5E9' }}>
                      <Icon name="clinic" size={26} color="#2E7D32"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-lg leading-tight" style={{ color: '#111827', fontFamily: 'Nunito, sans-serif' }}>{clinic.nome}</p>
                      {clinic.bairro && <p className="text-sm font-semibold mt-1" style={{ color: AMIL }}>{clinic.bairro}</p>}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex items-start gap-2.5">
                      <Icon name="location" size={18} color="#64748B"/>
                      <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{enderecoClinica(clinic)}</p>
                    </div>
                    {clinic.horarioFuncionamento && (
                      <div className="flex items-start gap-2.5">
                        <Icon name="clock" size={18} color="#64748B"/>
                        <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{clinic.horarioFuncionamento}</p>
                      </div>
                    )}
                    {clinic.telefone && (
                      <a href={`tel:${soDigitos(clinic.telefone)}`} className="flex items-start gap-2.5">
                        <Icon name="phone" size={18} color="#64748B"/>
                        <span className="text-sm leading-relaxed underline" style={{ color: '#475569' }}>{clinic.telefone}</span>
                      </a>
                    )}
                  </div>
                  {nomes.length > 0 && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E2E8F0' }}>
                      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#64748B' }}>Especialidades</p>
                      <div className="flex flex-wrap gap-2">
                        {nomes.map(n => (
                          <span key={n} className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: '#EAF0F8', color: AMIL }}>{n}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <Btn onClick={() => go('booking', { idClinica: clinic.idClinica })} size="sm">
                      <Icon name="calendar" size={18} color="#fff"/> Agendar nesta clínica
                    </Btn>
                  </div>
                </article>
              )
            })}
          </>
        )}
      </main>

      <BottomNav active="home" go={go}/>
    </div>
  )
}

// ─────────────────────────────────────────────
// BOOKING FLOW (consulta de horários e agendamento)
// ─────────────────────────────────────────────
function StepActions({ onBack, onNext, disabled = false, hint, nextLabel = 'Continuar', success = false }: {
  onBack: () => void; onNext: () => void; disabled?: boolean; hint?: string; nextLabel?: string; success?: boolean
}) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      {hint && <p className="text-base" style={{ color: '#334155' }}>{hint}</p>}
      <button onClick={onNext} disabled={disabled}
              className="w-full rounded-xl text-lg font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1A365D]/40"
              style={{ background: disabled ? '#64748B' : success ? '#2E7D32' : AMIL, minHeight: 56, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {nextLabel}
      </button>
      <button onClick={onBack}
              className="w-full rounded-xl text-lg font-bold bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1A365D]/40"
              style={{ border: '2px solid #94A3B8', color: '#111827', minHeight: 56 }}>
        Voltar
      </button>
    </div>
  )
}

function ReviewEdit({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="mt-2 text-base font-bold underline underline-offset-4 min-h-[44px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1A365D]/40 rounded"
            style={{ color: AMIL }}>
      {label}
    </button>
  )
}

function ReviewRow({ label, value, extra, onEdit, editLabel, last = false }: {
  label: string; value: string; extra?: string; onEdit?: () => void; editLabel?: string; last?: boolean
}) {
  return (
    <div className="p-4" style={{ borderBottom: last ? 'none' : '1px solid #CBD5E1' }}>
      <p className="text-base" style={{ color: '#334155' }}>{label}</p>
      <p className="text-lg font-bold" style={{ color: '#111827' }}>{value}</p>
      {extra && <p className="text-base" style={{ color: '#334155' }}>{extra}</p>}
      {onEdit && editLabel && <ReviewEdit label={editLabel} onClick={onEdit}/>}
    </div>
  )
}

const registro = (p: { conselho: string; registroProfissional: string; ufRegistro: string }) =>
  `${p.conselho} ${p.registroProfissional}/${p.ufRegistro}`

// Erros do POST que pedem uma nova escolha de horário
const ERROS_DE_HORARIO: CodigoErro[] = ['HORARIO_INDISPONIVEL', 'HORARIO_INVALIDO', 'HORARIO_NO_PASSADO', 'ANTECEDENCIA_INSUFICIENTE', 'PACIENTE_JA_AGENDADO']
const ERROS_DE_PROFISSIONAL: CodigoErro[] = ['ESPECIALIDADE_NAO_ATENDIDA', 'PROFISSIONAL_CLINICA_INATIVO']
const DATAS_POR_PAGINA = 12

export function BookingScreen({ go, params }: { go: Go; params: Parametros }) {
  const { usuario } = useSessao()
  const [step, setStep] = useState(1)
  const [esp, setEsp] = useState<Especialidade | null>(null)
  const [pc, setPc] = useState<ProfissionalClinica | null>(null)
  const [data, setData] = useState<string | null>(null)
  const [horario, setHorario] = useState<HorarioDisponivel | null>(null)
  const [notes, setNotes] = useState('')
  const [clinicFilter, setClinicFilter] = useState(params.idClinica ? String(params.idClinica) : 'all')
  const [search, setSearch] = useState('')
  const [specSearch, setSpecSearch] = useState('')
  const [aviso, setAviso] = useState('')
  const [erroEnvio, setErroEnvio] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [recarga, setRecarga] = useState(0)
  const [maisDatas, setMaisDatas] = useState(false)
  const sugestaoAplicada = useRef(false)

  const esps = useCarregar(() => especialidades.listar(), [])
  const listaClinicas = useCarregar(() => clinicas.listar(), [])
  const profs = useCarregar(
    () => esp ? profissionais.buscarParaAgendamento({ idEspecialidade: esp.idEspecialidade, idClinica: clinicFilter === 'all' ? undefined : Number(clinicFilter) }) : Promise.resolve([]),
    [esp?.idEspecialidade, clinicFilter, recarga])
  const datas = useCarregar(
    () => pc ? disponibilidades.datasComHorario(pc.idProfissionalClinica) : Promise.resolve({ datas: [] as string[] }),
    [pc?.idProfissionalClinica, recarga])
  const horarios = useCarregar(
    () => pc && data ? disponibilidades.horariosLivres(pc.idProfissionalClinica, data) : Promise.resolve(null),
    [pc?.idProfissionalClinica, data, recarga])

  // Especialidade indicada pela pré-triagem
  useEffect(() => {
    if (sugestaoAplicada.current || !esps.dados || !params.especialidadeSugerida) return
    sugestaoAplicada.current = true
    const achada = esps.dados.find(e => normalizar(e.nome) === normalizar(params.especialidadeSugerida!))
    if (achada) { setEsp(achada); setStep(2) }
    else setAviso(`A especialidade indicada (${params.especialidadeSugerida}) não está disponível no momento. Escolha outra especialidade ou procure atendimento presencial.`)
  }, [esps.dados, params.especialidadeSugerida])

  const filteredSpecs = (esps.dados ?? []).filter(sp => normalizar(sp.nome).includes(normalizar(specSearch)))
  const filteredDoctors = (profs.dados ?? []).filter(d => !search || normalizar(d.profissional.nome).includes(normalizar(search)))

  const next = () => { setAviso(''); setStep(s => s + 1) }
  const back = () => {
    setAviso('')
    if (step === 1) go('home')
    else setStep(s => s - 1)
  }

  async function confirmar() {
    if (!esp || !pc || !horario) return
    setEnviando(true); setErroEnvio('')
    try {
      const criado = await agendamentos.criar({
        idProfissionalClinica: pc.idProfissionalClinica, idEspecialidade: esp.idEspecialidade,
        dataHora: horario.dataHora, observacao: notes.trim() || undefined,
      })
      go('success', { idAgendamento: criado.idAgendamento })
    } catch (e) {
      const err = comoErroApi(e)
      if (err.codigo === 'LIMITE_AGENDAMENTOS_EXCEDIDO') { go('alert-limit'); return }
      if (ERROS_DE_HORARIO.includes(err.codigo)) {
        setHorario(null); setRecarga(r => r + 1); setStep(3); setAviso(err.message)
      } else if (ERROS_DE_PROFISSIONAL.includes(err.codigo)) {
        setPc(null); setData(null); setHorario(null); setRecarga(r => r + 1); setStep(2); setAviso(err.message)
      } else {
        setErroEnvio(err.message)
      }
    } finally {
      setEnviando(false)
    }
  }

  const listaDatas = datas.dados?.datas ?? []
  const datasVisiveis = maisDatas ? listaDatas : listaDatas.slice(0, DATAS_POR_PAGINA)

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F8F9FA' }}>
      <Header title="Agendar consulta" onBack={back}/>
      <ProgressBar step={step} total={4}/>
      <div className="flex-1 overflow-y-auto pb-6">
        {aviso && <div className="px-4 pt-4 w-full max-w-3xl mx-auto"><MensagemErro texto={aviso}/></div>}

        {/* Etapa 1: especialidade */}
        {step === 1 && (
          <div className="px-4 pt-6 w-full max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#111827', fontFamily: 'Nunito, sans-serif' }}>Escolha uma especialidade</h2>
            <p className="text-base mb-5" style={{ color: '#475569' }}>Toque na especialidade desejada. Em seguida, você escolhe o profissional.</p>
            <label htmlFor="spec-search" className="block text-base font-bold mb-2" style={{ color: '#111827' }}>Buscar especialidade</label>
            <input id="spec-search" type="search" value={specSearch} onChange={e => setSpecSearch(e.target.value)}
                   placeholder="Digite o nome, por exemplo: Cardiologia" autoComplete="off"
                   className="w-full rounded-xl px-4 text-lg mb-6 outline-none focus:border-[#1A365D] focus:ring-4 focus:ring-[#1A365D]/20"
                   style={{ border: '2px solid #94A3B8', background: '#fff', color: '#111827', minHeight: 56 }}/>
            {esps.carregando ? <Carregando/> : esps.erro ? <ErroCarregamento erro={esps.erro} onTentar={esps.recarregar}/> :
             filteredSpecs.length === 0 ? (
              <p role="status" className="rounded-xl p-5 text-lg" style={{ background: '#fff', border: '2px solid #CBD5E1', color: '#111827' }}>
                Nenhuma especialidade encontrada para "{specSearch}". Tente digitar outro nome.
              </p>
            ) : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" aria-label="Especialidades">
                {filteredSpecs.map(sp => {
                  const sel = esp?.idEspecialidade === sp.idEspecialidade
                  return (
                    <li key={sp.idEspecialidade} className="flex">
                      <button onClick={() => { if (!sel) { setPc(null); setData(null); setHorario(null) } setEsp(sp); next() }}
                              aria-pressed={sel}
                              className="w-full rounded-xl px-3 py-4 flex items-center justify-between gap-2 text-left text-lg font-bold leading-snug cursor-pointer transition-colors hover:bg-[#EAF0F8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1A365D]/40"
                              style={{ background: sel ? '#EAF0F8' : '#fff', border: `${sel ? 3 : 2}px solid ${sel ? AMIL : '#CBD5E1'}`, color: '#111827', minHeight: 72 }}>
                        <span className="break-words min-w-0">{sp.nome}</span>
                        {sel && <Icon name="check" size={22} color={AMIL}/>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {/* Etapa 2: profissional */}
        {step === 2 && esp && (
          <div className="px-4 pt-6 w-full max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#111827', fontFamily: 'Nunito, sans-serif' }}>Escolha o profissional</h2>
            {params.especialidadeSugerida && normalizar(params.especialidadeSugerida) === normalizar(esp.nome) ? (
              <p className="text-base mb-5 rounded-xl px-4 py-3" style={{ background: '#EAF0F8', border: '2px solid #B9CBE2', color: '#111827' }}>
                Indicado pela pré-triagem: <strong>{esp.nome}</strong>
              </p>
            ) : (
              <p className="text-base mb-5" style={{ color: '#475569' }}>Especialidade: <strong style={{ color: '#111827' }}>{esp.nome}</strong></p>
            )}
            <label htmlFor="doc-search" className="block text-base font-bold mb-2" style={{ color: '#111827' }}>Buscar profissional</label>
            <input id="doc-search" type="search" value={search} onChange={e => setSearch(e.target.value)} autoComplete="off"
                   placeholder="Digite o nome do profissional"
                   className="w-full rounded-xl px-4 text-lg mb-4 outline-none focus:border-[#1A365D] focus:ring-4 focus:ring-[#1A365D]/20"
                   style={{ border: '2px solid #94A3B8', background: '#fff', color: '#111827', minHeight: 56 }}/>
            <label htmlFor="clinic-filter" className="block text-base font-bold mb-2" style={{ color: '#111827' }}>Filtrar por clínica</label>
            <select id="clinic-filter" value={clinicFilter} onChange={e => { setClinicFilter(e.target.value); setPc(null) }}
                    className="w-full rounded-xl px-4 text-lg mb-6 outline-none focus:border-[#1A365D] focus:ring-4 focus:ring-[#1A365D]/20"
                    style={{ border: '2px solid #94A3B8', background: '#fff', color: '#111827', minHeight: 56 }}>
              <option value="all">Todas as clínicas</option>
              {(listaClinicas.dados ?? []).map(c => <option key={c.idClinica} value={c.idClinica}>{c.nome}{c.bairro ? ` - ${c.bairro}` : ''}</option>)}
            </select>
            {profs.carregando ? <Carregando texto="Buscando profissionais..."/> : profs.erro ? <ErroCarregamento erro={profs.erro} onTentar={profs.recarregar}/> :
             filteredDoctors.length === 0 ? (
              <p role="status" className="rounded-xl p-5 text-lg" style={{ background: '#fff', border: '2px solid #CBD5E1', color: '#111827' }}>
                Nenhum profissional encontrado. Tente alterar a busca ou a clínica.
              </p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="Profissionais">
                {filteredDoctors.map(doc => {
                  const sel = pc?.idProfissionalClinica === doc.idProfissionalClinica
                  return (
                    <li key={doc.idProfissionalClinica} className="flex">
                      <button onClick={() => { if (!sel) { setData(null); setHorario(null); setMaisDatas(false) } setPc(doc) }} aria-pressed={sel}
                              className="w-full rounded-xl p-4 text-left flex items-start justify-between gap-3 cursor-pointer transition-colors hover:bg-[#EAF0F8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1A365D]/40"
                              style={{ background: sel ? '#EAF0F8' : '#fff', border: `${sel ? 3 : 2}px solid ${sel ? AMIL : '#CBD5E1'}`, minHeight: 72 }}>
                        <span className="min-w-0">
                          <span className="block font-bold text-lg leading-snug" style={{ color: '#111827' }}>{doc.profissional.nome}</span>
                          <span className="block text-base font-semibold" style={{ color: AMIL }}>{doc.especialidades.map(e => e.nome).join(', ')}</span>
                          <span className="block text-base" style={{ color: '#334155' }}>{registro(doc.profissional)}</span>
                          <span className="block text-base mt-1" style={{ color: '#334155' }}>{doc.clinica.nome}{doc.clinica.bairro ? ` · ${doc.clinica.bairro}` : ''}</span>
                        </span>
                        {sel && (
                          <span className="shrink-0 flex items-center gap-1 text-sm font-bold" style={{ color: AMIL }}>
                            <Icon name="check" size={20} color={AMIL}/> Selecionado
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <StepActions onBack={back} onNext={next} disabled={!pc}
                         hint={!pc ? 'Selecione um profissional para continuar.' : undefined}/>
          </div>
        )}

        {/* Etapa 3: data e horário */}
        {step === 3 && pc && (
          <div className="px-4 pt-6 w-full max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#111827', fontFamily: 'Nunito, sans-serif' }}>Escolha a data e o horário</h2>
            <p className="text-base mb-6" style={{ color: '#475569' }}>
              Primeiro toque em uma data e depois em um horário livre. As consultas precisam ser marcadas com pelo menos 24 horas de antecedência.
            </p>

            <h3 className="text-lg font-bold mb-3" style={{ color: '#111827' }}>1. Data</h3>
            {datas.carregando ? <Carregando texto="Buscando datas..." linhas={2}/> : datas.erro ? <ErroCarregamento erro={datas.erro} onTentar={datas.recarregar}/> :
             listaDatas.length === 0 ? (
              <p role="status" className="rounded-xl p-5 text-lg mb-6" style={{ background: '#fff', border: '2px solid #CBD5E1' }}>
                Este profissional não tem horários livres nos próximos 60 dias. Volte e escolha outro profissional.
              </p>
            ) : (
              <>
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3" aria-label="Datas disponíveis">
                  {datasVisiveis.map(dia => {
                    const sel = data === dia
                    return (
                      <li key={dia} className="flex">
                        <button onClick={() => { setData(dia); setHorario(null) }} aria-pressed={sel}
                                className="w-full rounded-xl px-3 py-3 text-left cursor-pointer transition-colors hover:bg-[#EAF0F8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1A365D]/40"
                                style={{ background: sel ? '#EAF0F8' : '#fff', border: `${sel ? 3 : 2}px solid ${sel ? AMIL : '#CBD5E1'}`, minHeight: 72 }}>
                          <span className="block text-base" style={{ color: '#334155' }}>{diaDaSemana(dataPura(dia))}</span>
                          <span className="flex items-center justify-between font-bold text-xl" style={{ color: '#111827' }}>
                            {formatarDataPura(dia).slice(0, 5)}
                            {sel && <Icon name="check" size={22} color={AMIL}/>}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {listaDatas.length > DATAS_POR_PAGINA && (
                  <button onClick={() => setMaisDatas(v => !v)} className="mb-6 text-base font-bold underline underline-offset-4 min-h-[44px]" style={{ color: AMIL }}>
                    {maisDatas ? 'Mostrar menos datas' : `Ver mais datas (${listaDatas.length - DATAS_POR_PAGINA})`}
                  </button>
                )}
              </>
            )}

            <h3 className="text-lg font-bold mb-3 mt-4" style={{ color: '#111827' }}>2. Horário</h3>
            {!data ? (
              <p className="rounded-xl p-4 text-base mb-6" style={{ background: '#fff', border: '2px dashed #94A3B8', color: '#334155' }}>
                Escolha uma data para ver os horários.
              </p>
            ) : horarios.carregando ? <Carregando texto="Buscando horários..." linhas={2}/> : horarios.erro ? <ErroCarregamento erro={horarios.erro} onTentar={horarios.recarregar}/> :
              !horarios.dados || horarios.dados.horarios.length === 0 ? (
              <p role="status" className="rounded-xl p-5 text-lg mb-6" style={{ background: '#fff', border: '2px solid #CBD5E1' }}>
                Não há horários disponíveis em {formatarDataPura(data)}. Escolha outra data.
              </p>
            ) : (
              <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" aria-label="Horários">
                {horarios.dados.horarios.map(h => {
                  const taken = !h.disponivel
                  const sel = horario?.dataHora === h.dataHora
                  return (
                    <li key={h.dataHora} className="flex">
                      <button disabled={taken} aria-pressed={sel} onClick={() => setHorario(h)}
                              className="w-full rounded-xl py-3 px-2 flex flex-col items-center justify-center transition-colors enabled:hover:bg-[#EAF0F8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1A365D]/40"
                              style={{ background: sel ? '#EAF0F8' : taken ? '#F1F5F9' : '#fff', border: `${sel ? 3 : 2}px solid ${sel ? AMIL : taken ? '#E2E8F0' : '#CBD5E1'}`, color: taken ? '#64748B' : '#111827', cursor: taken ? 'not-allowed' : 'pointer', minHeight: 64 }}>
                        <span className="text-xl font-bold" style={{ textDecoration: taken ? 'line-through' : 'none' }}>{h.hora}</span>
                        <span className="text-sm font-semibold">{taken ? 'Ocupado' : sel ? 'Selecionado' : 'Livre'}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {data && horario && (
              <p role="status" className="rounded-xl p-4 text-lg mb-2" style={{ background: '#EAF0F8', border: '2px solid #B9CBE2', color: '#111827' }}>
                Você escolheu: <strong>{diaDaSemana(horario.dataHora)}, {formatarData(horario.dataHora)}, às {horario.hora}</strong>
              </p>
            )}
            <StepActions onBack={back} onNext={next} disabled={!data || !horario}
                         hint={!data || !horario ? 'Escolha uma data e um horário para continuar.' : undefined}/>
          </div>
        )}

        {/* Etapa 4: revisão */}
        {step === 4 && esp && pc && horario && (
          <div className="px-4 pt-6 w-full max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#111827', fontFamily: 'Nunito, sans-serif' }}>Revise os dados</h2>
            <p className="text-base mb-5" style={{ color: '#475569' }}>Confira as informações antes de confirmar o agendamento.</p>

            <div className="rounded-xl bg-white" style={{ border: '2px solid #CBD5E1' }}>
              <div className="p-4" style={{ background: '#EAF0F8', borderRadius: '10px 10px 0 0', borderBottom: '2px solid #CBD5E1' }}>
                <p className="text-base" style={{ color: '#334155' }}>Data e horário</p>
                <p className="text-xl font-bold" style={{ color: '#111827' }}>
                  {diaDaSemana(horario.dataHora)}, {formatarData(horario.dataHora)} às {horario.hora}
                </p>
                <ReviewEdit label="Alterar data ou horário" onClick={() => setStep(3)}/>
              </div>
              <ReviewRow label="Profissional" value={pc.profissional.nome} extra={registro(pc.profissional)} onEdit={() => setStep(2)} editLabel="Alterar profissional"/>
              <ReviewRow label="Especialidade" value={esp.nome} onEdit={() => setStep(1)} editLabel="Alterar especialidade"/>
              <ReviewRow label="Unidade de atendimento" value={pc.clinica.nome} extra={pc.clinica.endereco}/>
              <ReviewRow label="Paciente" value={usuario?.nome ?? ''} last/>
            </div>

            <label htmlFor="notes" className="block text-base font-bold mt-6 mb-2" style={{ color: '#111827' }}>Observações (opcional)</label>
            <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} maxLength={500}
                      rows={3} placeholder="Descreva o motivo da consulta ou sintomas"
                      className="w-full rounded-xl px-4 py-3 text-lg resize-none outline-none focus:border-[#1A365D] focus:ring-4 focus:ring-[#1A365D]/20"
                      style={{ border: '2px solid #94A3B8', background: '#fff', color: '#111827' }}/>

            {erroEnvio && <div className="mt-4"><MensagemErro texto={`${erroEnvio} Suas escolhas foram mantidas. Toque em "Confirmar agendamento" para tentar novamente.`}/></div>}
            <StepActions onBack={back} onNext={confirmar} disabled={enviando}
                         nextLabel={enviando ? 'Confirmando...' : 'Confirmar agendamento'} success/>
          </div>
        )}
      </div>
      <BottomNav active="booking" go={go}/>
    </div>
  )
}

// ─────────────────────────────────────────────
// SUCCESS
// ─────────────────────────────────────────────
export function SuccessScreen({ go, params }: { go: Go; params: Parametros }) {
  const { dados: ag, carregando, erro, recarregar } = useCarregar(
    () => params.idAgendamento ? agendamentos.obter(params.idAgendamento) : Promise.resolve(null), [params.idAgendamento])
  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F8F9FA' }}>
      <div className="px-5 pt-10 pb-8 flex flex-col items-center text-center" style={{ background: '#2E7D32' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#fff' }}>
          <Icon name="check" size={36} color="#2E7D32"/>
        </div>
        <h1 className="text-white text-3xl font-black" style={{ fontFamily: 'Nunito, sans-serif' }} role="status">
          Consulta agendada com sucesso
        </h1>
        <p className="text-white text-lg mt-2">Você pode acompanhar em "Minhas consultas".</p>
      </div>
      <div className="flex-1 px-4 pt-6 pb-8 flex flex-col gap-4 w-full max-w-xl mx-auto">
        {carregando ? <Carregando linhas={1}/> : erro ? <ErroCarregamento erro={erro} onTentar={recarregar}/> : ag && (
          <div className="rounded-xl bg-white" style={{ border: '2px solid #CBD5E1' }}>
            <div className="p-4" style={{ background: '#E8F5E9', borderRadius: '10px 10px 0 0', borderBottom: '2px solid #CBD5E1' }}>
              <p className="text-base" style={{ color: '#334155' }}>Data e horário</p>
              <p className="text-xl font-bold" style={{ color: '#111827' }}>
                {diaDaSemana(ag.dataHora)}, {formatarData(ag.dataHora)} às {formatarHora(ag.dataHora)}
              </p>
            </div>
            <ReviewRow label="Profissional" value={ag.profissional.nome} extra={registro(ag.profissional)}/>
            <ReviewRow label="Especialidade" value={ag.especialidade.nome}/>
            <ReviewRow label="Unidade de atendimento" value={ag.clinica.nome} extra={ag.clinica.endereco}/>
            <ReviewRow label="Paciente" value={ag.paciente.nome} last/>
          </div>
        )}
        <p className="rounded-xl p-4 text-base" style={{ background: '#FEF3E2', border: '2px solid #FCD9A5', color: '#7A3B00' }}>
          <strong>Lembrete:</strong> chegue 15 minutos antes e traga um documento de identidade com foto. Se precisar cancelar, faça isso até {PRAZO_CANCELAMENTO_HORAS} horas antes da consulta.
        </p>
        <button onClick={() => go('appointments')}
                className="w-full rounded-xl text-lg font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1A365D]/40"
                style={{ background: AMIL, minHeight: 56 }}>
          Ver meus agendamentos
        </button>
        <button onClick={() => go('home')}
                className="w-full rounded-xl text-lg font-bold bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1A365D]/40"
                style={{ border: '2px solid #94A3B8', color: '#111827', minHeight: 56 }}>
          Voltar ao início
        </button>
      </div>
      <BottomNav active="appointments" go={go}/>
    </div>
  )
}

// ─────────────────────────────────────────────
// MINHAS CONSULTAS
// ─────────────────────────────────────────────
export function AppointmentsScreen({ go }: { go: Go }) {
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming')
  const { dados, carregando, erro, recarregar } = useCarregar(() => agendamentos.listar(), [])
  const { upcoming, history } = useMemo(() => {
    const todos = dados ?? []
    const up = todos.filter(a => ATIVOS.includes(a.status) && ehFuturo(a.dataHora)).sort((a, b) => a.dataHora.localeCompare(b.dataHora))
    const hi = todos.filter(a => !up.includes(a)).sort((a, b) => b.dataHora.localeCompare(a.dataHora))
    return { upcoming: up, history: hi }
  }, [dados])
  const list = tab === 'upcoming' ? upcoming : history
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#F8F9FA' }}>
      <div className="shrink-0" style={{ background: AMIL }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <h2 className="text-white font-bold text-xl flex-1" style={{ fontFamily: 'Nunito, sans-serif' }}>Minhas consultas</h2>
        </div>
        <div className="flex" role="tablist">
          {(['upcoming', 'history'] as const).map((val, idx) => (
            <button key={val} role="tab" aria-selected={tab === val} onClick={() => setTab(val)} className="flex-1 py-3 text-lg font-bold"
                    style={{ color: tab === val ? '#fff' : 'rgba(255,255,255,0.55)', borderBottom: `3px solid ${tab === val ? '#fff' : 'transparent'}` }}>
              {['Próximas', 'Histórico'][idx]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-2 flex flex-col gap-3">
        {carregando ? <Carregando/> : erro ? <ErroCarregamento erro={erro} onTentar={recarregar}/> : (
          <>
            {list.length === 0 && (
              <ListaVazia texto={tab === 'upcoming' ? 'Você ainda não tem consultas marcadas.' : 'Sem histórico ainda.'}>
                {tab === 'upcoming' && (
                  <Btn onClick={() => go('booking')} size="md" full={false}>
                    <Icon name="calendar" size={20} color="#fff"/> Agendar agora
                  </Btn>
                )}
              </ListaVazia>
            )}
            {list.map(a => (
              <button key={a.idAgendamento} onClick={() => go('appointment-detail', { idAgendamento: a.idAgendamento })}
                      className="rounded-2xl p-4 shadow-sm flex flex-col gap-2 text-left" style={{ background: '#fff' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <DoctorAvatar name={a.profissional.nome} size={48}/>
                    <div>
                      <p className="font-bold text-lg leading-tight" style={{ color: '#111827' }}>{a.profissional.nome}</p>
                      <p className="text-base" style={{ color: '#64748B' }}>{a.especialidade.nome}</p>
                    </div>
                  </div>
                  <StatusBadge status={a.status}/>
                </div>
                <div className="flex flex-wrap gap-4 pt-2" style={{ borderTop: '1px solid #F1F5F9' }}>
                  <span className="flex items-center gap-1.5 text-base" style={{ color: '#475569' }}>
                    <Icon name="calendar" size={16} color={AMIL}/> {formatarData(a.dataHora)}
                  </span>
                  <span className="flex items-center gap-1.5 text-base" style={{ color: '#475569' }}>
                    <Icon name="clock" size={16} color={AMIL}/> {formatarHora(a.dataHora)}
                  </span>
                  <span className="flex items-center gap-1.5 text-base" style={{ color: '#475569' }}>
                    <Icon name="location" size={16} color={AMIL}/> {a.clinica.bairro ?? a.clinica.nome}
                  </span>
                </div>
              </button>
            ))}
          </>
        )}
      </div>
      <BottomNav active="appointments" go={go}/>
    </div>
  )
}

// ─────────────────────────────────────────────
// DETALHE E CANCELAMENTO
// ─────────────────────────────────────────────
export function AppointmentDetailScreen({ go, params }: { go: Go; params: Parametros }) {
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroCancelar, setErroCancelar] = useState('')
  const [sucesso, setSucesso] = useState('')
  const { dados: appointment, setDados, carregando, erro, recarregar } = useCarregar(
    () => params.idAgendamento ? agendamentos.obter(params.idAgendamento) : Promise.resolve(null), [params.idAgendamento])

  async function cancelar() {
    if (!appointment) return
    setEnviando(true); setErroCancelar('')
    try {
      const atualizado = await agendamentos.cancelar(appointment.idAgendamento, reason.trim())
      setDados(atualizado); setShowModal(false); setSucesso('Consulta cancelada. O horário foi liberado.')
    } catch (e) {
      const err = comoErroApi(e)
      if (err.codigo === 'CANCELAMENTO_FORA_DO_PRAZO') { go('alert-cancel-deadline'); return }
      setErroCancelar(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const ativo = appointment ? ATIVOS.includes(appointment.status) && ehFuturo(appointment.dataHora) : false
  const dentroDoPrazo = appointment ? horasAte(appointment.dataHora) >= PRAZO_CANCELAMENTO_HORAS : false

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#F8F9FA' }}>
      <Header title="Detalhes da consulta" onBack={() => go('appointments')}/>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-8 flex flex-col gap-4">
        {carregando ? <Carregando linhas={1}/> : erro ? <ErroCarregamento erro={erro} onTentar={recarregar}/> : !appointment ? (
          <ListaVazia texto="Consulta não encontrada."/>
        ) : (
          <>
            {sucesso && <MensagemSucesso texto={sucesso}/>}
            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: '#fff' }}>
              <div className="flex items-center gap-4 p-4" style={{ background: '#EAF0F8' }}>
                <DoctorAvatar name={appointment.profissional.nome} size={68}/>
                <div>
                  <p className="font-black text-xl leading-tight" style={{ color: '#111827', fontFamily: 'Nunito, sans-serif' }}>{appointment.profissional.nome}</p>
                  <p className="text-lg font-semibold" style={{ color: AMIL }}>{appointment.especialidade.nome}</p>
                  <div className="mt-1"><StatusBadge status={appointment.status}/></div>
                </div>
              </div>
              <div className="flex flex-col gap-0 px-4 py-2">
                {[
                  { icon: 'calendar', label: 'Data', value: `${diaDaSemana(appointment.dataHora)}, ${formatarData(appointment.dataHora)}` },
                  { icon: 'clock', label: 'Horário', value: formatarHora(appointment.dataHora) },
                  { icon: 'clinic', label: 'Clínica', value: appointment.clinica.nome },
                  { icon: 'location', label: 'Endereço', value: appointment.clinica.endereco },
                  ...(appointment.clinica.telefone ? [{ icon: 'phone', label: 'Telefone da clínica', value: appointment.clinica.telefone }] : []),
                  ...(appointment.observacao ? [{ icon: 'edit', label: 'Observações', value: appointment.observacao }] : []),
                  ...(appointment.status === 'CANCELADO' ? [{ icon: 'close', label: 'Motivo do cancelamento', value: appointment.motivoCancelamento || 'Não informado' }] : []),
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EAF0F8' }}>
                      <Icon name={row.icon} size={18} color={AMIL}/>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748B' }}>{row.label}</p>
                      <p className="text-base font-semibold" style={{ color: '#111827' }}>{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {ativo && dentroDoPrazo && (
              <Btn onClick={() => setShowModal(true)} variant="danger" size="lg">
                <Icon name="close" size={22} color="#fff"/> Cancelar consulta
              </Btn>
            )}
            {ativo && !dentroDoPrazo && (
              <div className="rounded-2xl p-4" style={{ background: '#FEF3E2', border: '1.5px solid #FCD9A5' }}>
                <p className="text-base" style={{ color: '#7A3B00' }}>
                  Faltam menos de {PRAZO_CANCELAMENTO_HORAS} horas para esta consulta, então o cancelamento pelo aplicativo não está mais disponível.
                  {appointment.clinica.telefone ? ` Para cancelar, ligue para a clínica: ${appointment.clinica.telefone}.` : ' Para cancelar, entre em contato com a clínica.'}
                </p>
              </div>
            )}
            {appointment.status === 'REALIZADO' && (
              <div className="rounded-2xl p-4" style={{ background: '#E8F5E9', border: '1.5px solid #A5D6A7' }}>
                <p className="font-semibold text-base" style={{ color: '#2E7D32' }}>Consulta realizada.</p>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav active="appointments" go={go}/>
      {showModal && appointment && (
        <Modal titulo="Cancelar consulta" onFechar={() => setShowModal(false)}>
          <p className="text-lg mb-5" style={{ color: '#475569' }}>
            Deseja mesmo cancelar a consulta com <strong>{appointment.profissional.nome}</strong> no dia <strong>{formatarData(appointment.dataHora)}</strong> às <strong>{formatarHora(appointment.dataHora)}</strong>?
          </p>
          <Field label="Motivo do cancelamento (opcional)" id="cancel-reason">
            <textarea id="cancel-reason" value={reason} onChange={e => setReason(e.target.value)} rows={3} maxLength={255}
                      placeholder="Ex.: impossibilidade de comparecer..."
                      className="w-full rounded-2xl border-2 px-4 py-3 text-lg resize-none"
                      style={{ borderColor: '#E2E8F0', background: '#F8F9FA', minHeight: 80 }}/>
          </Field>
          {erroCancelar && <div className="mt-4"><MensagemErro texto={erroCancelar}/></div>}
          <div className="flex gap-3 mt-5">
            <Btn onClick={() => setShowModal(false)} variant="outline" size="md">Voltar</Btn>
            <Btn onClick={cancelar} variant="danger" size="md" disabled={enviando}>{enviando ? 'Cancelando...' : 'Sim, cancelar'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// PERFIL
// ─────────────────────────────────────────────
export function ProfileScreen({ go }: { go: Go }) {
  const { sair, atualizarNome } = useSessao()
  const { dados: pac, setDados, carregando, erro, recarregar } = useCarregar(() => pacientes.meusDados(), [])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [erroSalvar, setErroSalvar] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  function editar() {
    if (!pac) return
    setForm({ name: pac.nome, phone: pac.telefone ?? '', email: pac.email })
    setErroSalvar(''); setSucesso(''); setEditing(true)
  }

  async function salvar() {
    if (form.name.trim().split(/\s+/).length < 2) { setErroSalvar('Informe o nome completo.'); return }
    if (!emailValido(form.email)) { setErroSalvar('Informe um e-mail válido.'); return }
    setEnviando(true); setErroSalvar('')
    try {
      const novo = await pacientes.atualizarMeusDados({ nome: form.name.trim(), telefone: form.phone, email: form.email.trim().toLowerCase() })
      setDados(novo); atualizarNome(novo.nome); setEditing(false); setSucesso('Dados atualizados.')
    } catch (e) {
      setErroSalvar(comoErroApi(e).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F8F9FA' }}>
      <div className="relative overflow-hidden px-5 pt-8 pb-16" style={{ background: AMIL }}>
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }}/>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-white/70 text-base">Meu perfil</p>
            <h1 className="text-white text-2xl font-black" style={{ fontFamily: 'Nunito, sans-serif' }}>Dados pessoais</h1>
          </div>
          <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl text-white"
               style={{ background: 'rgba(255,255,255,0.22)', fontFamily: 'Nunito, sans-serif' }}>
            {iniciais(pac?.nome ?? '')}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-10 pb-2 flex flex-col gap-4">
        {carregando ? <Carregando linhas={2}/> : erro ? <ErroCarregamento erro={erro} onTentar={recarregar}/> : pac && (
          <>
            <HealthCard name={pac.nome} plan="Paciente" cardNumber={String(pac.idPaciente).padStart(6, '0')}
                        valid={formatarDataPura(pac.dataNascimento)}/>
            {sucesso && <MensagemSucesso texto={sucesso}/>}
            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: '#fff' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#EAF0F8' }}>
                <span className="font-bold text-base" style={{ color: AMIL }}>Dados pessoais</span>
                <button onClick={() => (editing ? setEditing(false) : editar())}
                        className="flex items-center gap-1.5 text-base font-semibold" style={{ color: AMIL }}>
                  <Icon name="edit" size={16} color={AMIL}/>
                  {editing ? 'Cancelar' : 'Editar'}
                </button>
              </div>
              <div className="flex flex-col gap-4 px-4 py-4">
                {editing ? (
                  <>
                    <Field label="Nome completo" id="pf-name"><TextInput id="pf-name" value={form.name} onChange={set('name')} autoComplete="name"/></Field>
                    <Field label="Telefone" id="pf-phone"><TextInput id="pf-phone" type="tel" value={form.phone} onChange={v => set('phone')(mascararTelefone(v))} autoComplete="tel"/></Field>
                    <Field label="E-mail" id="pf-email"><TextInput id="pf-email" type="email" value={form.email} onChange={set('email')} autoComplete="email"/></Field>
                    {erroSalvar && <MensagemErro texto={erroSalvar}/>}
                    <Btn onClick={salvar} variant="success" size="md" disabled={enviando}>
                      <Icon name="check" size={20} color="#fff"/> {enviando ? 'Salvando...' : 'Salvar alterações'}
                    </Btn>
                  </>
                ) : (
                  [
                    { label: 'Nome completo', value: pac.nome },
                    { label: 'CPF', value: mascararCpf(pac.cpf) },
                    { label: 'Data de nascimento', value: formatarDataPura(pac.dataNascimento) },
                    { label: 'Telefone', value: pac.telefone || 'Não informado' },
                    { label: 'E-mail', value: pac.email },
                  ].map((row, i, arr) => (
                    <div key={row.label} className="flex flex-col gap-0.5"
                         style={{ borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none', paddingBottom: 12 }}>
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748B' }}>{row.label}</span>
                      <span className="text-lg font-semibold break-all" style={{ color: '#111827' }}>{row.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        <button className="py-4 rounded-2xl text-lg font-semibold flex items-center justify-center gap-2"
                style={{ background: '#FFEBEE', color: '#C62828' }} onClick={() => { sair(); go('welcome') }}>
          <Icon name="close" size={20} color="#C62828"/> Sair da conta
        </button>
      </div>
      <BottomNav active="profile" go={go}/>
    </div>
  )
}

// ─────────────────────────────────────────────
// CARTÃO DO PACIENTE
// ─────────────────────────────────────────────
export function CardScreen({ go }: { go: Go }) {
  const { dados: pac, carregando, erro, recarregar } = useCarregar(() => pacientes.meusDados(), [])
  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F1F3F5' }}>
      <div className="relative sticky top-0 z-10 px-4 pt-4 pb-6 flex items-center"
           style={{ background: AMIL, borderRadius: '0 0 28px 28px' }}>
        <button onClick={() => go('home')} aria-label="Voltar"
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.18)' }}>
          <Icon name="arrowLeft" size={22} color="#fff"/>
        </button>
        <h2 className="flex-1 text-center text-white font-bold text-xl pr-10" style={{ fontFamily: 'Nunito, sans-serif' }}>Meu cartão</h2>
      </div>

      <div className="flex-1 px-4 pt-5 pb-2 flex flex-col gap-5 w-full max-w-[460px] mx-auto">
        {carregando ? <Carregando linhas={1}/> : erro ? <ErroCarregamento erro={erro} onTentar={recarregar}/> : pac && (
          <div className="rounded-3xl overflow-hidden shadow-md bg-white">
            <div className="relative overflow-hidden p-5 flex flex-col gap-4" style={{ background: 'linear-gradient(135deg, #1A365D 0%, #2F6FD0 100%)' }}>
              <div className="absolute -right-16 -top-10 w-56 h-56 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.10)' }}/>
              <div className="relative flex items-start justify-between gap-3">
                <p className="text-white font-bold text-lg leading-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>{pac.nome}</p>
                <span className="text-white font-black text-sm text-right leading-tight shrink-0" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Saúde na<br/>Palma da Mão
                </span>
              </div>
              <div className="relative flex items-center gap-2">
                <Icon name="card" size={26} color="#fff"/>
                <span className="text-white/80 text-sm">Nº de cadastro</span>
                <span className="text-white font-black text-2xl tracking-wider" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {String(pac.idPaciente).padStart(6, '0')}
                </span>
              </div>
            </div>
            <div className="relative p-5">
              <div className="absolute left-3 top-5 bottom-5 w-1 rounded-full" style={{ background: '#E2E8F0' }}/>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 pl-4">
                {[
                  { label: 'Nascimento', value: formatarDataPura(pac.dataNascimento) },
                  { label: 'CPF', value: mascararCpf(pac.cpf) },
                  { label: 'Telefone', value: pac.telefone || 'Não informado' },
                ].map(f => (
                  <div key={f.label} className="min-w-0">
                    <p className="text-xs" style={{ color: '#64748B' }}>{f.label}</p>
                    <p className="font-bold text-sm break-words" style={{ color: '#111827' }}>{f.value}</p>
                  </div>
                ))}
                <div className="col-span-2 min-w-0">
                  <p className="text-xs" style={{ color: '#64748B' }}>E-mail</p>
                  <p className="font-bold text-sm break-all" style={{ color: '#111827' }}>{pac.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <p className="text-sm text-center" style={{ color: '#64748B' }}>
          Apresente este cartão e um documento com foto na recepção da clínica.
        </p>
      </div>
      <BottomNav active="profile" go={go}/>
    </div>
  )
}
