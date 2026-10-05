import { useEffect, useRef, useState } from 'react'
import { PhoneShell } from './componentes/UI'
import { useSessao } from './contexto/Sessao'
import { perfilDaTela, telaDeLogin, telaInicial, type Parametros, type ScreenName } from './navegacao'

import {
  WelcomeScreen, LoginScreen, RegisterScreen, HomeScreen,
  PreTriageScreen, BookingScreen, SuccessScreen, AppointmentsScreen,
  AppointmentDetailScreen, ProfileScreen, ClinicsScreen, CardScreen,
} from './telas/PatientScreens'
import {
  ProLoginScreen, ProScheduleScreen, ProAvailabilityScreen, ProAddAvailabilityScreen,
} from './telas/ProfessionalScreens'
import {
  AdminLoginScreen, AdminDashboardScreen, AdminClinicsScreen, AdminClinicFormScreen,
  AdminProfessionalsScreen, AdminProfessionalFormScreen, AdminSpecialtiesScreen, AdminAppointmentsScreen,
} from './telas/AdminScreens'
import {
  AlertsCatalogScreen, AlertAdvanceScreen, AlertOccupiedScreen, AlertLimitScreen,
  AlertCancelDeadlineScreen, AlertWindowOccupiedScreen, AlertConnectionScreen,
  StateEmptyScreen, StateLoadingScreen, StateNoTimesScreen,
} from './telas/AlertScreens'

function accentForScreen(s: ScreenName): string {
  if (s.startsWith('alert') || s.startsWith('state-')) return '#374151'
  return '#1A365D'
}

export default function App() {
  const { usuario, sessaoExpirada } = useSessao()
  const [screen, setScreen] = useState<ScreenName>(() => (usuario ? telaInicial(usuario.tipoUsuario) : 'welcome'))
  const [params, setParams] = useState<Parametros>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  function go(s: ScreenName, p: Parametros = {}) {
    setParams(p)
    setScreen(s)
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' }), 0)
  }

  // Controle de acesso: cada tela exige o perfil correto (Visão Geral do PI, item 6)
  const exigido = perfilDaTela(screen)
  const bloqueado = exigido !== null && usuario?.tipoUsuario !== exigido
  useEffect(() => {
    if (bloqueado && exigido) setScreen(telaDeLogin(exigido))
  }, [bloqueado, exigido])

  // Sessão expirada (401): volta para o login do perfil da tela atual
  useEffect(() => {
    if (sessaoExpirada) setScreen(exigido ? telaDeLogin(exigido) : 'welcome')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessaoExpirada])

  function renderScreen() {
    if (bloqueado) return null
    switch (screen) {
      // Paciente
      case 'welcome':              return <WelcomeScreen go={go}/>
      case 'login':                return <LoginScreen go={go}/>
      case 'register':             return <RegisterScreen go={go}/>
      case 'home':                 return <HomeScreen go={go}/>
      case 'pre-triage':           return <PreTriageScreen go={go}/>
      case 'booking':              return <BookingScreen go={go} params={params}/>
      case 'success':              return <SuccessScreen go={go} params={params}/>
      case 'appointments':         return <AppointmentsScreen go={go}/>
      case 'appointment-detail':   return <AppointmentDetailScreen go={go} params={params}/>
      case 'profile':              return <ProfileScreen go={go}/>
      case 'clinics':              return <ClinicsScreen go={go}/>
      case 'card':                 return <CardScreen go={go}/>
      // Profissional
      case 'pro-login':            return <ProLoginScreen go={go}/>
      case 'pro-schedule':         return <ProScheduleScreen go={go}/>
      case 'pro-availability':     return <ProAvailabilityScreen go={go}/>
      case 'pro-add-availability': return <ProAddAvailabilityScreen go={go}/>
      // Administrador
      case 'admin-login':          return <AdminLoginScreen go={go}/>
      case 'admin-dashboard':      return <AdminDashboardScreen go={go}/>
      case 'admin-clinics':        return <AdminClinicsScreen go={go}/>
      case 'admin-clinic-form':    return <AdminClinicFormScreen go={go} params={params}/>
      case 'admin-professionals':  return <AdminProfessionalsScreen go={go}/>
      case 'admin-professional-form': return <AdminProfessionalFormScreen go={go} params={params}/>
      case 'admin-specialties':    return <AdminSpecialtiesScreen go={go}/>
      case 'admin-appointments':   return <AdminAppointmentsScreen go={go}/>
      // Avisos e estados
      case 'alerts':               return <AlertsCatalogScreen go={go}/>
      case 'alert-advance':        return <AlertAdvanceScreen go={go}/>
      case 'alert-occupied':       return <AlertOccupiedScreen go={go}/>
      case 'alert-limit':          return <AlertLimitScreen go={go}/>
      case 'alert-cancel-deadline':return <AlertCancelDeadlineScreen go={go}/>
      case 'alert-window-occupied':return <AlertWindowOccupiedScreen go={go}/>
      case 'alert-connection':     return <AlertConnectionScreen go={go}/>
      case 'state-empty':          return <StateEmptyScreen go={go}/>
      case 'state-loading':        return <StateLoadingScreen go={go}/>
      case 'state-no-times':       return <StateNoTimesScreen go={go}/>
    }
  }

  return (
    <PhoneShell accent={accentForScreen(screen)}>
      <div ref={scrollRef} className="h-full overflow-y-auto">
        {renderScreen()}
      </div>
    </PhoneShell>
  )
}
