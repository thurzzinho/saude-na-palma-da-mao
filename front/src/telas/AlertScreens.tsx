import { Icon, Header, Btn } from '../componentes/UI'
import type { Go, ScreenName } from '../navegacao'

// ─────────────────────────────────────────────
// FULL-SCREEN ALERT WRAPPER
// ─────────────────────────────────────────────
function AlertPage({ icon, iconColor, iconBg, title, titleColor, headerBg, children, onBack }: {
  icon: string; iconColor: string; iconBg: string; title: string
  titleColor: string; headerBg: string; children: React.ReactNode; onBack: () => void
}) {
  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F4F7FA' }}>
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: headerBg }}>
        <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.18)' }}>
          <Icon name="arrowLeft" size={22} color="#fff"/>
        </button>
        <h2 className="text-white font-bold text-xl flex-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
          Aviso do sistema
        </h2>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 text-center gap-6">
        <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-md"
             style={{ background: iconBg }}>
          <Icon name={icon} size={52} color={iconColor}/>
        </div>
        <h1 className="text-3xl font-black" style={{ color: titleColor, fontFamily: 'Nunito, sans-serif', lineHeight: 1.2 }}>
          {title}
        </h1>
        <div className="w-full max-w-sm flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// ALERT 1: Advance notice
// ─────────────────────────────────────────────
export function AlertAdvanceScreen({ go }: { go: Go }) {
  return (
    <AlertPage icon="clock" iconColor="#E65100" iconBg="#FFF3E0" title="Agendamento com pouca antecedência" titleColor="#E65100" headerBg="#BF360C" onBack={() => go('alerts')}>
      <p className="text-xl leading-relaxed" style={{ color: '#374151' }}>
        Só é possível agendar com no mínimo <strong>24 horas de antecedência</strong>. Escolha outro horário.
      </p>
      <Btn onClick={() => go('booking')} size="lg" color="#E65100">
        <Icon name="calendar" size={22} color="#fff"/> Escolher outro horário
      </Btn>
      <Btn onClick={() => go('home')} variant="ghost" size="md">Voltar ao início</Btn>
    </AlertPage>
  )
}

// ─────────────────────────────────────────────
// ALERT 2: Slot just occupied
// ─────────────────────────────────────────────
export function AlertOccupiedScreen({ go }: { go: Go }) {
  return (
    <AlertPage icon="warning" iconColor="#C62828" iconBg="#FFEBEE" title="Horário indisponível" titleColor="#C62828" headerBg="#B71C1C" onBack={() => go('alerts')}>
      <p className="text-xl leading-relaxed" style={{ color: '#374151' }}>
        Este horário <strong>acabou de ser preenchido</strong> por outro paciente. Por favor, escolha outro horário disponível.
      </p>
      <Btn onClick={() => go('booking')} size="lg">
        <Icon name="calendar" size={22} color="#fff"/> Escolher outro horário
      </Btn>
      <Btn onClick={() => go('home')} variant="ghost" size="md">Voltar ao início</Btn>
    </AlertPage>
  )
}

// ─────────────────────────────────────────────
// ALERT 3: Booking limit reached
// ─────────────────────────────────────────────
export function AlertLimitScreen({ go }: { go: Go }) {
  return (
    <AlertPage icon="warning" iconColor="#6A1B9A" iconBg="#F3E5F5" title="Limite de consultas atingido" titleColor="#6A1B9A" headerBg="#4A148C" onBack={() => go('alerts')}>
      <p className="text-xl leading-relaxed" style={{ color: '#374151' }}>
        Você já tem <strong>5 consultas marcadas</strong>. Cancele uma delas para poder agendar outra.
      </p>
      <Btn onClick={() => go('appointments')} size="lg" color="#6A1B9A">
        <Icon name="calendar" size={22} color="#fff"/> Ver meus agendamentos
      </Btn>
      <Btn onClick={() => go('home')} variant="ghost" size="md">Voltar ao início</Btn>
    </AlertPage>
  )
}

// ─────────────────────────────────────────────
// ALERT 4: Cancel past deadline
// ─────────────────────────────────────────────
export function AlertCancelDeadlineScreen({ go }: { go: Go }) {
  return (
    <AlertPage icon="clock" iconColor="#C62828" iconBg="#FFEBEE" title="Prazo de cancelamento encerrado" titleColor="#C62828" headerBg="#B71C1C" onBack={() => go('alerts')}>
      <p className="text-xl leading-relaxed" style={{ color: '#374151' }}>
        O cancelamento pelo aplicativo só pode ser feito até <strong>8 horas antes</strong> da consulta. Para cancelar, entre em contato diretamente com a clínica.
      </p>
      <p className="text-base" style={{ color: '#475569' }}>
        O telefone da clínica aparece nos detalhes da consulta.
      </p>
      <Btn onClick={() => go('appointments')} size="lg">Ver minhas consultas</Btn>
      <Btn onClick={() => go('home')} variant="ghost" size="md">Voltar ao início</Btn>
    </AlertPage>
  )
}

// ─────────────────────────────────────────────
// ALERT 5: Professional: window occupied
// ─────────────────────────────────────────────
export function AlertWindowOccupiedScreen({ go }: { go: Go }) {
  const occupiedAppts = [
    { time: '08:00', patient: 'João Santos',  date: '18/09/2026' },
    { time: '08:30', patient: 'Ana Lima',     date: '18/09/2026' },
    { time: '10:00', patient: 'Carlos Silva', date: '18/09/2026' },
  ]
  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F4F7FA' }}>
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#BF360C' }}>
        <button onClick={() => go('alerts')} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
          <Icon name="arrowLeft" size={22} color="#fff"/>
        </button>
        <h2 className="text-white font-bold text-xl flex-1" style={{ fontFamily: 'Nunito, sans-serif' }}>Aviso do sistema</h2>
      </div>
      <div className="flex-1 px-5 py-6 flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#FFEBEE' }}>
            <Icon name="warning" size={46} color="#C62828"/>
          </div>
          <h1 className="text-2xl font-black" style={{ color: '#C62828', fontFamily: 'Nunito, sans-serif', lineHeight: 1.2 }}>
            Janela com consultas marcadas
          </h1>
          <p className="text-xl leading-relaxed" style={{ color: '#374151' }}>
            Existem consultas marcadas neste período. Cancele as consultas abaixo antes de desativar esta janela de atendimento.
          </p>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '2px solid #FFCDD2' }}>
          <div className="px-4 py-3" style={{ background: '#FFEBEE' }}>
            <p className="font-bold text-base" style={{ color: '#C62828' }}>Consultas que impedem a operação</p>
          </div>
          {occupiedAppts.map((a, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3"
                 style={{ background: '#fff', borderTop: i > 0 ? '1px solid #FFCDD2' : 'none' }}>
              <div>
                <p className="font-bold text-lg" style={{ color: '#111827' }}>{a.patient}</p>
                <p className="text-base" style={{ color: '#64748B' }}>{a.date} às {a.time}</p>
              </div>
              <button className="py-2 px-3 rounded-xl text-sm font-semibold"
                      style={{ background: '#FFEBEE', color: '#C62828' }}>
                Cancelar
              </button>
            </div>
          ))}
        </div>
        <Btn onClick={() => go('pro-availability')} variant="danger" size="lg">
          Ir para os agendamentos
        </Btn>
        <Btn onClick={() => go('pro-availability')} variant="ghost" size="md">Manter janela ativa</Btn>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// ALERT 6: Connection error
// ─────────────────────────────────────────────
export function AlertConnectionScreen({ go }: { go: Go }) {
  return (
    <AlertPage icon="wifi" iconColor="#94A3B8" iconBg="#F1F5F9" title="Sem conexão com a internet" titleColor="#475569" headerBg="#374151" onBack={() => go('alerts')}>
      <p className="text-xl leading-relaxed" style={{ color: '#374151' }}>
        Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.
      </p>
      <Btn onClick={() => window.location.reload()} size="lg" color="#475569">
        <Icon name="refresh" size={22} color="#fff"/> Tentar novamente
      </Btn>
      <Btn onClick={() => go('home')} variant="ghost" size="md">Voltar ao início</Btn>
    </AlertPage>
  )
}

// ─────────────────────────────────────────────
// STATE: Empty appointments
// ─────────────────────────────────────────────
export function StateEmptyScreen({ go }: { go: Go }) {
  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F4F7FA' }}>
      <Header title="Meus agendamentos" onBack={() => go('alerts')}/>
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
        {/* Simple illustration */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ background: '#E8F1F9' }}>
            <Icon name="calendar" size={64} color="#B8D4EC"/>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center"
               style={{ background: '#fff', border: '2px solid #E2E8F0' }}>
            <Icon name="close" size={20} color="#CBD5E1"/>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black" style={{ color: '#475569', fontFamily: 'Nunito, sans-serif' }}>
            Você ainda não tem consultas marcadas
          </h2>
          <p className="text-lg mt-2" style={{ color: '#94A3B8' }}>
            Agende sua primeira consulta e cuide da sua saúde.
          </p>
        </div>
        <Btn onClick={() => go('booking')} size="lg">
          <Icon name="calendar" size={22} color="#fff"/> Agendar consulta
        </Btn>
        <button onClick={() => go('home')} className="text-base font-semibold" style={{ color: '#64748B' }}>
          Voltar ao início
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STATE: Loading
// ─────────────────────────────────────────────
export function StateLoadingScreen({ go }: { go: Go }) {
  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F4F7FA' }}>
      <Header title="Carregando..." onBack={() => go('alerts')}/>
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
        {/* Animated rings */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
               style={{ borderColor: '#B8D4EC', borderTopColor: '#0B4F8A' }}/>
          <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: '#E8F1F9' }}>
            <Icon name="clinic" size={28} color="#0B4F8A"/>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#111827', fontFamily: 'Nunito, sans-serif' }}>
            Carregando informações…
          </h2>
          <p className="text-lg mt-2" style={{ color: '#64748B' }}>
            Por favor, aguarde um momento.
          </p>
        </div>
        {/* Skeleton cards */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl p-4 flex items-center gap-3 animate-pulse" style={{ background: '#fff' }}>
              <div className="w-12 h-12 rounded-full" style={{ background: '#E2E8F0' }}/>
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 rounded-lg" style={{ background: '#E2E8F0', width: '70%' }}/>
                <div className="h-3 rounded-lg" style={{ background: '#F1F5F9', width: '50%' }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STATE: No times available for date
// ─────────────────────────────────────────────
export function StateNoTimesScreen({ go }: { go: Go }) {
  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F4F7FA' }}>
      <Header title="Escolher horário" onBack={() => go('alerts')}/>
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
        <div className="w-28 h-28 rounded-full flex items-center justify-center" style={{ background: '#FFF3E0' }}>
          <Icon name="clock" size={60} color="#FFCC80"/>
        </div>
        <div>
          <h2 className="text-2xl font-black" style={{ color: '#E65100', fontFamily: 'Nunito, sans-serif' }}>
            Nenhum horário disponível
          </h2>
          <p className="text-xl mt-2 leading-relaxed" style={{ color: '#374151' }}>
            Não há horários disponíveis para o dia <strong>24/09/2026</strong>.
          </p>
          <p className="text-lg mt-2" style={{ color: '#64748B' }}>
            Tente escolher outra data no calendário.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <div className="rounded-2xl p-4 mb-4" style={{ background: '#E8F1F9', border: '1.5px solid #B8D4EC' }}>
            <p className="font-bold text-base" style={{ color: '#0B4F8A' }}>Datas com horários disponíveis:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {['25/09','26/09','29/09','30/09'].map(d => (
                <span key={d} className="px-3 py-1.5 rounded-xl font-bold text-base"
                      style={{ background: '#0B4F8A', color: '#fff' }}>
                  {d}
                </span>
              ))}
            </div>
          </div>
          <Btn onClick={() => go('booking')} size="lg">
            <Icon name="calendar" size={22} color="#fff"/> Escolher outra data
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// ALERTS CATALOG (index)
// ─────────────────────────────────────────────
const ALERT_ITEMS = [
  { screen: 'alert-advance'         as ScreenName, label: 'Antecedência mínima',             desc: '24h antes obrigatório',              color: '#E65100', bg: '#FFF3E0', icon: 'clock'      },
  { screen: 'alert-occupied'        as ScreenName, label: 'Horário recém-ocupado',            desc: 'Outro paciente acabou de reservar',  color: '#C62828', bg: '#FFEBEE', icon: 'warning'    },
  { screen: 'alert-limit'           as ScreenName, label: 'Limite de consultas',              desc: '5 consultas simultâneas no máximo',  color: '#6A1B9A', bg: '#F3E5F5', icon: 'warning'    },
  { screen: 'alert-cancel-deadline' as ScreenName, label: 'Cancelamento fora do prazo',      desc: 'Menos de 8h para a consulta',        color: '#C62828', bg: '#FFEBEE', icon: 'clock'      },
  { screen: 'alert-window-occupied' as ScreenName, label: 'Janela com consultas (prof.)',    desc: 'Não pode desativar janela ocupada',  color: '#C62828', bg: '#FFEBEE', icon: 'warning'    },
  { screen: 'alert-connection'      as ScreenName, label: 'Erro de conexão',                 desc: 'Sem internet ou servidor offline',   color: '#475569', bg: '#F1F5F9', icon: 'wifi'       },
  { screen: 'state-empty'           as ScreenName, label: 'Lista vazia',                     desc: 'Sem consultas marcadas',             color: '#0B4F8A', bg: '#E8F1F9', icon: 'calendar'   },
  { screen: 'state-loading'         as ScreenName, label: 'Carregando',                      desc: 'Estado de aguardo com esqueleto',    color: '#475569', bg: '#F1F5F9', icon: 'refresh'    },
  { screen: 'state-no-times'        as ScreenName, label: 'Sem horários na data',            desc: 'Nenhum slot disponível',             color: '#E65100', bg: '#FFF3E0', icon: 'clock'      },
]

export function AlertsCatalogScreen({ go }: { go: Go }) {
  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F4F7FA' }}>
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#374151' }}>
        <button onClick={() => go('welcome')} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
          <Icon name="arrowLeft" size={22} color="#fff"/>
        </button>
        <div>
          <h2 className="text-white font-bold text-xl" style={{ fontFamily: 'Nunito, sans-serif' }}>Avisos e estados</h2>
          <p className="text-white/60 text-sm">Catálogo de avisos do sistema</p>
        </div>
      </div>
      <div className="flex-1 px-4 pt-4 pb-8 flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide mb-1" style={{ color: '#64748B' }}>
          Avisos e mensagens de erro
        </p>
        {ALERT_ITEMS.slice(0, 6).map(item => (
          <button key={item.screen} onClick={() => go(item.screen)}
                  className="rounded-2xl p-4 flex items-center gap-4 shadow-sm text-left transition-all active:scale-95"
                  style={{ background: '#fff', border: '2px solid #E2E8F0' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
              <Icon name={item.icon} size={26} color={item.color}/>
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg leading-tight" style={{ color: '#111827' }}>{item.label}</p>
              <p className="text-base" style={{ color: '#64748B' }}>{item.desc}</p>
            </div>
            <Icon name="arrowLeft" size={20} color="#CBD5E1" />
          </button>
        ))}
        <p className="text-sm font-semibold uppercase tracking-wide mt-2 mb-1" style={{ color: '#64748B' }}>
          Estados adicionais
        </p>
        {ALERT_ITEMS.slice(6).map(item => (
          <button key={item.screen} onClick={() => go(item.screen)}
                  className="rounded-2xl p-4 flex items-center gap-4 shadow-sm text-left transition-all active:scale-95"
                  style={{ background: '#fff', border: '2px solid #E2E8F0' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
              <Icon name={item.icon} size={26} color={item.color}/>
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg leading-tight" style={{ color: '#111827' }}>{item.label}</p>
              <p className="text-base" style={{ color: '#64748B' }}>{item.desc}</p>
            </div>
            <Icon name="arrowLeft" size={20} color="#CBD5E1" />
          </button>
        ))}
      </div>
    </div>
  )
}
