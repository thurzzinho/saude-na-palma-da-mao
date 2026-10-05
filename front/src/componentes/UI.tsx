import React from 'react'
import type { Go } from '../navegacao'
import type { StatusAgendamento } from '../api/tipos'
import type { ErroApi } from '../api/erros'

// ─── Icon ─────────────────────────────────────────────────────────────────────
export function Icon({ name, size = 24, color }: { name: string; size?: number; color?: string }) {
  const c = color ?? 'currentColor'
  const paths: Record<string, React.ReactElement> = {
    stethoscope: <path d="M12 2C9.24 2 7 4.24 7 7v4c0 2.21 1.79 4 4 4h.5v1.5c0 1.93-1.57 3.5-3.5 3.5S4.5 18.43 4.5 16.5V15c1.46-.45 2.5-1.8 2.5-3.25V7a2 2 0 00-2-2H4a2 2 0 00-2 2v4.75C2 13.2 3.04 14.55 4.5 15v1.5C4.5 19.54 6.96 22 10 22s5.5-2.46 5.5-5.5V13h.5c2.21 0 4-1.79 4-4V7c0-2.76-2.24-5-5-5h-3z" fill={c}/>,
    heart:        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={c}/>,
    bone:         <path d="M17.5 6.5c0-1.1-.9-2-2-2s-2 .9-2 2c0 .37.1.72.28 1.02l-5.76 5.76A2 2 0 006.5 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2c0-.37-.1-.72-.28-1.02l5.76-5.76c.3.18.65.28 1.02.28 1.1 0 2-.9 2-2z" fill={c}/>,
    skin:         <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" fill={c}/>,
    child:        <><circle cx="12" cy="5" r="2.5" fill={c}/><path d="M12 9c-2.21 0-4 1.79-4 4v5h2v5h4v-5h2v-5c0-2.21-1.79-4-4-4z" fill={c}/></>,
    female:       <path d="M12 2a5 5 0 100 10A5 5 0 0012 2zm0 12c-4.41 0-8 1.79-8 4v2h16v-2c0-2.21-3.59-4-8-4zm-1 4v4h2v-4h3l-4-4-4 4h3z" fill={c}/>,
    eye:          <><path d="M12 5C7 5 2.73 8.11 1 12.5 2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill={c}/><circle cx="12" cy="12.5" r="2.5" fill={c}/></>,
    eyeOff:       <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2.71 3.16a.996.996 0 000 1.41l1.97 1.97C3.06 7.83 1.77 9.53 1 11.5 2.73 15.89 7 19 12 19c1.52 0 2.97-.3 4.31-.82l2.72 2.72a.996.996 0 101.41-1.41L4.13 3.16a.996.996 0 00-1.42 0zM12 16c-2.76 0-5-2.24-5-5 0-.77.18-1.5.49-2.14l1.57 1.57c-.03.18-.06.37-.06.57 0 1.66 1.34 3 3 3 .2 0 .38-.03.57-.07L14.14 15.5c-.65.32-1.37.5-2.14.5z" fill={c}/>,
    brain:        <path d="M13 3c-4.42 0-8 3.58-8 8 0 3.54 2.29 6.53 5.47 7.59.1.02.53.23.53.23V21h2v-2.18s.43-.21.53-.23C16.71 17.53 19 14.54 19 11c0-4.42-3.58-8-6-8zm0 2c2.21 0 4 1.79 4 4 0 2-.82 3.75-2.13 4.97L14 14.46v-.96h-2v.96l-.87.54C9.82 13.75 9 12 9 10c0-2.21 1.79-4 4-4z" fill={c}/>,
    calendar:     <><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" fill={c}/><path d="M7 10h5v5H7z" fill={c}/></>,
    clock:        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z" fill={c}/>,
    phone:        <path d="M6.62 10.79a15.46 15.46 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" fill={c}/>,
    user:         <><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" fill={c}/><path d="M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill={c}/></>,
    clinic:       <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" fill={c}/>,
    check:        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill={c}/>,
    close:        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill={c}/>,
    arrowLeft:    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill={c}/>,
    checkCircle:  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill={c}/>,
    location:     <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill={c}/>,
    edit:         <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill={c}/>,
    warning:      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill={c}/>,
    plus:         <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill={c}/>,
    filter:       <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" fill={c}/>,
    toggle:       <path d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm0 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h10c1.65 0 3 1.35 3 3s-1.35 3-3 3zm0-4.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" fill={c}/>,
    wifi:         <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" fill={c}/>,
    schedule:     <><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" fill={c}/></>,
    dashboard:    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill={c}/>,
    people:       <><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill={c}/></>,
    search:       <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill={c}/>,
    refresh:      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill={c}/>,
    card:         <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill={c}/>,
    emergency:    <path d="M19 8h-2.99L16 6H8L7.01 8H4C2.9 8 2 8.9 2 10v9c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2zm-7 11c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z" fill={c}/>,
    benefits:     <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14l-4-4 1.41-1.41L11 12.17l6.59-6.59L19 7l-8 8z" fill={c}/>,
    home:         <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={c}/>,
    bell:         <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill={c}/>,
    map:          <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" fill={c}/>,
    'chevron-right': <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" fill={c}/>,
    microphone: <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5.3-3a5.3 5.3 0 01-10.6 0H5a7 7 0 006 6.92V21H8v2h8v-2h-3v-3.08A7 7 0 0019 11h-1.7z" fill={c}/>,
    send: <path d="M2.5 3.5l19 8.5-19 8.5 2.4-6.7L14 12 4.9 10.7 2.5 3.5z" fill={c}/>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {paths[name] ?? <circle cx="12" cy="12" r="10" fill={c}/>}
    </svg>
  )
}

// ─── Phone Shell ──────────────────────────────────────────────────────────────
// No celular ocupa a tela inteira. No computador mostra a moldura de celular do protótipo.
// O conteúdo é renderizado UMA vez só (antes eram duas cópias, o que duplicava as chamadas à API).
export function PhoneShell({ children, accent = '#1A365D' }: { children: React.ReactNode; accent?: string }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-start md:py-8"
         style={{ background: `linear-gradient(160deg, ${accent} 0%, #2f5385 50%, #6d8bb5 100%)` }}>
      <div className="w-full h-dvh bg-white overflow-hidden flex flex-col md:w-[390px] md:h-[844px] md:rounded-[44px] md:shadow-2xl md:border-8"
           style={{ borderColor: '#111827' }}>
        <div className="hidden md:flex h-8 shrink-0 justify-center items-center" style={{ background: '#111827' }}>
          <div className="w-24 h-4 bg-black rounded-full"/>
        </div>
        <div className="flex-1 min-h-0">{children}</div>
      </div>
      <p className="hidden md:block mt-4 text-white/70 text-sm font-semibold tracking-wide">Saúde na Palma da Mão</p>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
export function Header({ title, onBack, color = '#1A365D', right }: {
  title?: string; onBack?: () => void; color?: string; right?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10" style={{ background: color }}>
      {onBack && (
        <button onClick={onBack} aria-label="Voltar"
                className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.18)' }}>
          <Icon name="arrowLeft" size={22} color="#fff"/>
        </button>
      )}
      {title && (
        <h2 className="text-white font-bold text-xl flex-1 truncate" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {title}
        </h2>
      )}
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  )
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
export function BottomNav({ active, go }: {
  active: 'home' | 'booking' | 'appointments' | 'profile'; go: Go
}) {
  const AMIL = '#1A365D'
  const items = [
    { id: 'home',         label: 'Início',     icon: 'home',     screen: 'home'         as const },
    { id: 'booking',      label: 'Agendar',    icon: 'calendar', screen: 'booking'      as const },
    { id: 'appointments', label: 'Consultas',  icon: 'schedule', screen: 'appointments' as const },
    { id: 'profile',      label: 'Perfil',     icon: 'user',     screen: 'profile'      as const },
  ]
  return (
    <div className="sticky bottom-0 z-10 shrink-0 px-4 pt-2 pointer-events-none"
         style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}>
      <nav aria-label="Navegação principal"
           className="pointer-events-auto mx-auto flex items-center justify-between gap-1 rounded-full p-2 w-full max-w-[420px]"
           style={{ background: AMIL, boxShadow: '0 10px 28px rgba(26,54,93,0.45), 0 2px 6px rgba(0,0,0,0.2)' }}>
        {items.map(item => {
          const isActive = active === item.id
          return (
            <button key={item.id} onClick={() => go(item.screen)}
                    aria-label={item.label} aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center justify-center gap-2 rounded-full h-12 cursor-pointer transition-all duration-200 ${isActive ? 'px-5 flex-[1.6]' : 'flex-1'}`}
                    style={{ background: isActive ? '#2F6FD0' : 'transparent', color: '#fff' }}>
              <Icon name={item.icon} size={24} color="#fff"/>
              {isActive && <span className="text-sm font-bold whitespace-nowrap">{item.label}</span>}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({
  children, onClick, variant = 'primary', size = 'lg',
  disabled = false, type = 'button', full = true, color,
}: {
  children: React.ReactNode; onClick?: () => void
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success' | 'white' | 'teal' | 'indigo'
  size?: 'sm' | 'md' | 'lg'; disabled?: boolean
  type?: 'button' | 'submit'; full?: boolean; color?: string
}) {
  const sizeMap = { sm: 'px-4 py-2 text-base min-h-[40px]', md: 'px-5 py-3 text-lg min-h-[48px]', lg: 'px-6 py-4 text-xl min-h-[56px]' }
  const base = `inline-flex items-center justify-center gap-2 font-semibold rounded-2xl cursor-pointer transition-all select-none ${full ? 'w-full' : ''} ${sizeMap[size]}`
  const AMIL = color ?? '#1A365D'
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: disabled ? '#CBD5E1' : AMIL,   color: '#fff',  boxShadow: disabled ? 'none' : `0 4px 14px ${AMIL}40` },
    outline: { background: '#fff', border: `2px solid ${AMIL}`, color: AMIL },
    ghost:   { background: 'transparent', color: AMIL },
    danger:  { background: disabled ? '#CBD5E1' : '#C62828', color: '#fff' },
    success: { background: disabled ? '#CBD5E1' : '#2E7D32', color: '#fff' },
    white:   { background: '#fff', color: AMIL, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    teal:    { background: disabled ? '#CBD5E1' : '#1A365D', color: '#fff' },
    indigo:  { background: disabled ? '#CBD5E1' : '#1A365D', color: '#fff' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
            className={base} style={{ ...styles[variant], opacity: disabled ? 0.7 : 1 }}>
      {children}
    </button>
  )
}

// ─── Form Field ───────────────────────────────────────────────────────────────
export function Field({ label, children, id }: { label: string; children: React.ReactNode; id?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold text-base" style={{ color: '#334155' }}>{label}</label>
      {children}
    </div>
  )
}

export function TextInput({ id, type = 'text', placeholder, value, onChange, autoComplete, inputMode, min, max, required, disabled }: {
  id?: string; type?: string; placeholder?: string
  value: string; onChange: (v: string) => void; autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; min?: string; max?: string; required?: boolean; disabled?: boolean
}) {
  return (
    <input id={id} type={type} placeholder={placeholder ?? ''} value={value}
           onChange={e => onChange(e.target.value)} autoComplete={autoComplete}
           inputMode={inputMode} min={min} max={max} required={required} disabled={disabled}
           className="w-full rounded-2xl border-2 px-4 py-3 text-lg transition-colors"
           style={{ borderColor: '#E2E8F0', background: '#F8F9FA', color: '#111827', minHeight: 52 }}
           onFocus={e => { e.currentTarget.style.borderColor = '#1A365D'; e.currentTarget.style.background = '#fff' }}
           onBlur={e  => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8F9FA' }}/>
  )
}

export function SelectInput({ id, value, onChange, children }: {
  id?: string; value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <select id={id} value={value} onChange={e => onChange(e.target.value)}
            className="w-full rounded-2xl border-2 px-4 py-3 text-lg"
            style={{ borderColor: '#E2E8F0', background: '#F8F9FA', color: '#111827', minHeight: 52 }}>
      {children}
    </select>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
export const ROTULO_STATUS: Record<StatusAgendamento, string> = {
  AGENDADO: 'Agendado', CONFIRMADO: 'Confirmado', CANCELADO: 'Cancelado', REALIZADO: 'Realizado',
}

export function StatusBadge({ status }: { status: StatusAgendamento }) {
  const map: Record<StatusAgendamento, { bg: string; color: string }> = {
    AGENDADO:   { bg: '#EAF0F8', color: '#1A365D' },
    CONFIRMADO: { bg: '#E8F5E9', color: '#2E7D32' },
    REALIZADO:  { bg: '#F1F5F9', color: '#475569' },
    CANCELADO:  { bg: '#FFEBEE', color: '#C62828' },
  }
  const st = map[status] ?? map.REALIZADO
  return (
    <span className="inline-block px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap"
          style={{ background: st.bg, color: st.color }}>
      {ROTULO_STATUS[status] ?? status}
    </span>
  )
}

// ─── Progress Bar (booking flow) ──────────────────────────────────────────────
export function ProgressBar({ step, total }: { step: number; total: number }) {
  const labels = ['Especialidade', 'Profissional', 'Data e horário', 'Revisão']
  return (
    <div className="px-4 py-3" style={{ background: '#EAF0F8' }}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold" style={{ color: '#475569' }}>Etapa {step} de {total}</span>
        <span className="text-base font-bold" style={{ color: '#1A365D' }}>{labels[step - 1]}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#B9CBE2' }}>
        <div className="h-full rounded-full transition-all duration-500"
             style={{ width: `${(step / total) * 100}%`, background: '#1A365D' }}/>
      </div>
      <div className="flex justify-between mt-2">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
               style={{ background: i + 1 < step ? '#2E7D32' : i + 1 === step ? '#1A365D' : '#B9CBE2', color: i + 1 <= step ? '#fff' : '#94A3B8' }}>
            {i + 1 < step ? <Icon name="check" size={14} color="#fff"/> : i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Doctor Avatar ────────────────────────────────────────────────────────────
export function DoctorAvatar({ name, size = 52 }: { name: string; size?: number }) {
  const initials = name.replace(/^(Dr|Dra)\.\s+/i, '').split(' ').slice(0, 2).map(w => w[0]).join('')
  const colors   = ['#1A365D','#E91E63','#9C27B0','#2196F3','#009688','#FF9800']
  const color    = colors[(name.charCodeAt(4) || 0) % colors.length]
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
         style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}>
      {initials}
    </div>
  )
}

// ─── Health Card (Carteirinha digital) ────────────────────────────────────────
export function HealthCard({ name, plan, cardNumber, valid, numberLabel = 'Nº de cadastro', validLabel = 'Nascimento' }: {
  name: string; plan: string; cardNumber: string; valid: string; numberLabel?: string; validLabel?: string
}) {
  const [revealed, setRevealed] = React.useState(false)
  const maskedNumber = '•••• •••• ••••'
  return (
    <div className="rounded-3xl p-5 relative overflow-hidden select-none transition-all duration-300"
         style={{ background: 'linear-gradient(135deg, #1A365D 0%, #2C4E7D 55%, #33578a 100%)', minHeight: revealed ? 210 : 132 }}>
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
           style={{ background: 'rgba(255,255,255,0.10)' }}/>
      <div className="absolute bottom-0 right-20 w-24 h-24 rounded-full pointer-events-none"
           style={{ background: 'rgba(255,255,255,0.07)' }}/>
      <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full pointer-events-none"
           style={{ background: 'rgba(0,0,0,0.06)' }}/>
      <div className="relative z-10 flex flex-col gap-3">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(255,255,255,0.22)' }}>
              <Icon name="benefits" size={20} color="#fff"/>
            </div>
            <span className="text-white font-black text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Saúde na Palma da Mão
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-sm font-semibold bg-white/15 px-2.5 py-1 rounded-full">
              {plan}
            </span>
            <button onClick={() => setRevealed(r => !r)}
                    aria-label={revealed ? 'Ocultar dados da carteirinha' : 'Mostrar dados da carteirinha'}
                    aria-pressed={revealed}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.22)' }}>
              <Icon name={revealed ? 'eyeOff' : 'eye'} size={20} color="#fff"/>
            </button>
          </div>
        </div>

        {revealed ? (
          <>
            {/* Name */}
            <p className="text-white text-2xl font-black" style={{ fontFamily: 'Nunito, sans-serif' }}>{name}</p>
            {/* Bottom row */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/65 text-xs uppercase tracking-wide">{numberLabel}</p>
                <p className="text-white font-bold text-lg tracking-widest" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {cardNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/65 text-xs uppercase tracking-wide">{validLabel}</p>
                <p className="text-white font-bold text-base">{valid}</p>
              </div>
            </div>
          </>
        ) : (
          /* Collapsed / private state */
          <button onClick={() => setRevealed(true)} className="text-left mt-1">
            <p className="text-white/65 text-xs uppercase tracking-wide">{numberLabel}</p>
            <p className="text-white font-bold text-lg tracking-widest" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {maskedNumber}
            </p>
            <p className="text-white/60 text-sm mt-1 flex items-center gap-1.5">
              <Icon name="eye" size={15} color="rgba(255,255,255,0.6)"/>
              Toque para mostrar seus dados
            </p>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
export function AlertBanner({ variant, icon, title, body, onClose, action }: {
  variant: 'warning' | 'danger' | 'info' | 'success'
  icon: string; title: string; body: string
  onClose?: () => void; action?: { label: string; onClick: () => void }
}) {
  const map = {
    warning: { bg: '#FEF3E2', border: '#FCD9A5', title: '#B45309', icon: '#D97706' },
    danger:  { bg: '#FFEBEE', border: '#EF9A9A', title: '#C62828', icon: '#C62828' },
    info:    { bg: '#EAF0F8', border: '#B9CBE2', title: '#1A365D', icon: '#1A365D' },
    success: { bg: '#E8F5E9', border: '#A5D6A7', title: '#2E7D32', icon: '#2E7D32' },
  }
  const s = map[variant]
  return (
    <div className="rounded-2xl p-4" style={{ background: s.bg, border: `2px solid ${s.border}` }}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5"><Icon name={icon} size={24} color={s.icon}/></div>
        <div className="flex-1">
          <p className="font-bold text-lg leading-tight" style={{ color: s.title }}>{title}</p>
          <p className="text-base mt-1 leading-relaxed" style={{ color: '#374151' }}>{body}</p>
          {action && (
            <button onClick={action.onClick} className="mt-3 px-4 py-2 rounded-xl font-semibold text-base"
                    style={{ background: s.title, color: '#fff' }}>{action.label}</button>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="flex-shrink-0"><Icon name="close" size={20} color="#94A3B8"/></button>
        )}
      </div>
    </div>
  )
}

// ─── Portal Login ─────────────────────────────────────────────────────────────
export function PortalLogin({ title, subtitle, color, onLogin, onBack }: {
  title: string; subtitle: string; color: string
  onLogin: (login: string, senha: string) => Promise<void>; onBack: () => void
}) {
  const [id,   setId]   = React.useState('')
  const [pass, setPass] = React.useState('')
  const [erro, setErro] = React.useState('')
  const [enviando, setEnviando] = React.useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!id.trim() || !pass) { setErro('Informe seu e-mail ou CPF e a senha.'); return }
    setEnviando(true); setErro('')
    try { await onLogin(id.trim(), pass) }
    catch (err) { setErro(err instanceof Error ? err.message : 'Não foi possível entrar.') }
    finally { setEnviando(false) }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#fff' }}>
      <div className="h-40 flex flex-col justify-end pb-5 px-6" style={{ background: color }}>
        <button onClick={onBack} className="flex items-center gap-2 text-white/80 mb-3 text-base">
          <Icon name="arrowLeft" size={18} color="rgba(255,255,255,0.8)"/> Voltar
        </button>
        <h1 className="text-white text-3xl font-black" style={{ fontFamily: 'Nunito, sans-serif' }}>{title}</h1>
        <p className="text-white/70 text-base mt-0.5">{subtitle}</p>
      </div>
      <form className="flex-1 px-6 pt-8 flex flex-col gap-5" onSubmit={enviar} noValidate>
        <Field label="E-mail ou CPF" id="portal-id">
          <TextInput id="portal-id" value={id} onChange={setId} placeholder="Seu e-mail ou CPF" autoComplete="username"/>
        </Field>
        <Field label="Senha" id="portal-pass">
          <TextInput id="portal-pass" type="password" value={pass} onChange={setPass} placeholder="Digite sua senha" autoComplete="current-password"/>
        </Field>
        {erro && <MensagemErro texto={erro}/>}
        <div className="mt-2"><Btn type="submit" size="lg" color={color} disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}</Btn></div>
      </form>
    </div>
  )
}

// ─── Estados de tela: carregando, erro, vazio ─────────────────────────────────
export function Carregando({ texto = 'Carregando informações...', linhas = 3 }: { texto?: string; linhas?: number }) {
  return (
    <div className="flex flex-col gap-3 py-2" role="status" aria-live="polite">
      <p className="text-base font-semibold" style={{ color: '#64748B' }}>{texto}</p>
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="rounded-2xl p-4 flex items-center gap-3 animate-pulse" style={{ background: '#fff' }}>
          <div className="w-12 h-12 rounded-full" style={{ background: '#E2E8F0' }}/>
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 rounded-lg" style={{ background: '#E2E8F0', width: '70%' }}/>
            <div className="h-3 rounded-lg" style={{ background: '#F1F5F9', width: '50%' }}/>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ErroCarregamento({ erro, onTentar }: { erro: ErroApi; onTentar?: () => void }) {
  const semConexao = erro.codigo === 'SEM_CONEXAO'
  return (
    <div role="alert" className="rounded-2xl p-5 flex flex-col items-center gap-3 text-center"
         style={{ background: '#fff', border: '2px solid #E2E8F0' }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: semConexao ? '#F1F5F9' : '#FFEBEE' }}>
        <Icon name={semConexao ? 'wifi' : 'warning'} size={30} color={semConexao ? '#475569' : '#C62828'}/>
      </div>
      <p className="text-lg font-semibold" style={{ color: '#111827' }}>{erro.message}</p>
      {onTentar && <Btn onClick={onTentar} size="md" full={false} variant="outline"><Icon name="refresh" size={20}/> Tentar novamente</Btn>}
    </div>
  )
}

export function MensagemErro({ texto }: { texto: string }) {
  return (
    <p role="alert" className="rounded-xl p-4 text-base font-semibold"
       style={{ background: '#FFEBEE', border: '2px solid #C62828', color: '#8E1B1B' }}>
      {texto}
    </p>
  )
}

export function MensagemSucesso({ texto }: { texto: string }) {
  return (
    <p role="status" className="rounded-xl p-4 text-base font-semibold"
       style={{ background: '#E8F5E9', border: '2px solid #A5D6A7', color: '#1B5E20' }}>
      {texto}
    </p>
  )
}

export function ListaVazia({ texto, children }: { texto: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#EAF0F8' }}>
        <Icon name="calendar" size={40} color="#B9CBE2"/>
      </div>
      <p className="text-xl font-bold" style={{ color: '#475569' }}>{texto}</p>
      {children}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ titulo, icone = 'warning', cor = '#C62828', fundoIcone = '#FFEBEE', children, onFechar }: {
  titulo: string; icone?: string; cor?: string; fundoIcone?: string; children: React.ReactNode; onFechar?: () => void
}) {
  React.useEffect(() => {
    if (!onFechar) return
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [onFechar])
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
         role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl md:rounded-3xl p-6 shadow-2xl" style={{ background: '#fff' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: fundoIcone }}>
            <Icon name={icone} size={26} color={cor}/>
          </div>
          <h3 className="text-xl font-black" style={{ color: cor, fontFamily: 'Nunito, sans-serif' }}>{titulo}</h3>
        </div>
        {children}
      </div>
    </div>
  )
}
