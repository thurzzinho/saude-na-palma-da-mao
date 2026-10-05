import type { TipoUsuario } from './api/tipos'

// Telas do app. A navegação é feita por estado (função go), como no protótipo do Figma.

export type PatientScreen =
  | 'welcome' | 'login' | 'register' | 'home'
  | 'pre-triage' | 'booking' | 'success' | 'appointments'
  | 'appointment-detail' | 'profile' | 'clinics' | 'card'

export type ProfessionalScreen =
  | 'pro-login' | 'pro-schedule'
  | 'pro-availability' | 'pro-add-availability'

export type AdminScreen =
  | 'admin-login' | 'admin-dashboard'
  | 'admin-clinics' | 'admin-clinic-form'
  | 'admin-professionals' | 'admin-professional-form'
  | 'admin-specialties' | 'admin-appointments'

export type AlertScreen =
  | 'alerts'
  | 'alert-advance' | 'alert-occupied' | 'alert-limit'
  | 'alert-cancel-deadline' | 'alert-window-occupied'
  | 'alert-connection'
  | 'state-empty' | 'state-loading' | 'state-no-times'

export type ScreenName = PatientScreen | ProfessionalScreen | AdminScreen | AlertScreen

/** Dados passados de uma tela para outra */
export interface Parametros {
  idClinica?: number
  idProfissional?: number
  idAgendamento?: number
  especialidadeSugerida?: string
}

export type Go = (s: ScreenName, p?: Parametros) => void

const PUBLICAS: ScreenName[] = ['welcome', 'login', 'register', 'pro-login', 'admin-login', 'alerts', 'alert-connection']

/** Perfil exigido por cada tela. Telas públicas devolvem null. */
export function perfilDaTela(s: ScreenName): TipoUsuario | null {
  if (PUBLICAS.includes(s)) return null
  if (s.startsWith('admin-')) return 'ADMINISTRADOR'
  if (s.startsWith('pro-')) return 'PROFISSIONAL'
  if (s.startsWith('alert-') || s.startsWith('state-')) return null
  return 'PACIENTE'
}

export function telaInicial(perfil: TipoUsuario): ScreenName {
  if (perfil === 'ADMINISTRADOR') return 'admin-dashboard'
  if (perfil === 'PROFISSIONAL') return 'pro-schedule'
  return 'home'
}

export function telaDeLogin(perfil: TipoUsuario): ScreenName {
  if (perfil === 'ADMINISTRADOR') return 'admin-login'
  if (perfil === 'PROFISSIONAL') return 'pro-login'
  return 'login'
}
