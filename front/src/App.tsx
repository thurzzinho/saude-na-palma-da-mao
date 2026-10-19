import { lazy, Suspense, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import type { TipoUsuario } from '@/api/tipos'
import { Layout } from '@/componentes/Layout'
import { Carregando } from '@/componentes/ui'
import { rotaInicial, useSessao } from '@/contexto/Sessao'
import { Entrada } from '@/telas/publico/Entrada'
import { Cadastro } from '@/telas/publico/Cadastro'
import { NaoEncontrada } from '@/telas/NaoEncontrada'
import { Inicio } from '@/telas/paciente/Inicio'
import { Agendar } from '@/telas/paciente/Agendar'
import { Guia } from '@/telas/paciente/Guia'
import { Consultas } from '@/telas/paciente/Consultas'
import { DetalheConsulta } from '@/telas/paciente/DetalheConsulta'
import { Clinicas } from '@/telas/paciente/Clinicas'
import { Perfil } from '@/telas/paciente/Perfil'
import { Conta } from '@/telas/Conta'

// As telas de profissional e administrador só são baixadas por quem entra
// com esses perfis. O paciente, maioria dos acessos, carrega menos código.
const Agenda = lazy(() => import('@/telas/profissional/Agenda'))
const Horarios = lazy(() => import('@/telas/profissional/Horarios'))
const Painel = lazy(() => import('@/telas/admin/Painel'))
const ConsultasAdmin = lazy(() => import('@/telas/admin/ConsultasAdmin'))
const ClinicasAdmin = lazy(() => import('@/telas/admin/ClinicasAdmin'))
const FormClinica = lazy(() => import('@/telas/admin/FormClinica'))
const ProfissionaisAdmin = lazy(() => import('@/telas/admin/ProfissionaisAdmin'))
const FormProfissional = lazy(() => import('@/telas/admin/FormProfissional'))
const EspecialidadesAdmin = lazy(() => import('@/telas/admin/EspecialidadesAdmin'))
const PacientesAdmin = lazy(() => import('@/telas/admin/PacientesAdmin'))

function Protegido({ perfis, children }: { perfis: TipoUsuario[]; children: ReactNode }) {
  const { usuario } = useSessao()
  const local = useLocation()
  if (!usuario) return <Navigate to="/" replace state={{ de: local.pathname }} />
  if (!perfis.includes(usuario.tipoUsuario)) return <Navigate to={rotaInicial(usuario.tipoUsuario)} replace />
  return <Suspense fallback={<Carregando />}>{children}</Suspense>
}

// Quem já chega logado vai direto para o início. Quem entra ou se cadastra
// nesta tela é levado pela própria tela, que sabe para onde ir.
function SomenteVisitante({ children }: { children: ReactNode }) {
  const { usuario } = useSessao()
  const [jaLogado] = useState(usuario)
  if (jaLogado) return <Navigate to={rotaInicial(jaLogado.tipoUsuario)} replace />
  return children
}

const P: TipoUsuario[] = ['PACIENTE']
const R: TipoUsuario[] = ['PROFISSIONAL']
const A: TipoUsuario[] = ['ADMINISTRADOR']

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SomenteVisitante><Entrada /></SomenteVisitante>} />
        <Route path="/cadastro" element={<SomenteVisitante><Cadastro /></SomenteVisitante>} />

        <Route element={<Protegido perfis={['PACIENTE', 'PROFISSIONAL', 'ADMINISTRADOR']}><Layout /></Protegido>}>
          <Route path="/inicio" element={<Protegido perfis={P}><Inicio /></Protegido>} />
          <Route path="/agendar" element={<Protegido perfis={P}><Agendar /></Protegido>} />
          <Route path="/guia" element={<Protegido perfis={P}><Guia /></Protegido>} />
          <Route path="/consultas" element={<Protegido perfis={P}><Consultas /></Protegido>} />
          <Route path="/consultas/:id" element={<Protegido perfis={P}><DetalheConsulta /></Protegido>} />
          <Route path="/clinicas" element={<Protegido perfis={P}><Clinicas /></Protegido>} />
          <Route path="/perfil" element={<Protegido perfis={P}><Perfil /></Protegido>} />

          <Route path="/profissional" element={<Protegido perfis={R}><Agenda /></Protegido>} />
          <Route path="/profissional/horarios" element={<Protegido perfis={R}><Horarios /></Protegido>} />

          <Route path="/admin" element={<Protegido perfis={A}><Painel /></Protegido>} />
          <Route path="/admin/consultas" element={<Protegido perfis={A}><ConsultasAdmin /></Protegido>} />
          <Route path="/admin/clinicas" element={<Protegido perfis={A}><ClinicasAdmin /></Protegido>} />
          <Route path="/admin/clinicas/nova" element={<Protegido perfis={A}><FormClinica /></Protegido>} />
          <Route path="/admin/clinicas/:id" element={<Protegido perfis={A}><FormClinica /></Protegido>} />
          <Route path="/admin/profissionais" element={<Protegido perfis={A}><ProfissionaisAdmin /></Protegido>} />
          <Route path="/admin/profissionais/novo" element={<Protegido perfis={A}><FormProfissional /></Protegido>} />
          <Route path="/admin/profissionais/:id" element={<Protegido perfis={A}><FormProfissional /></Protegido>} />
          <Route path="/admin/especialidades" element={<Protegido perfis={A}><EspecialidadesAdmin /></Protegido>} />
          <Route path="/admin/pacientes" element={<Protegido perfis={A}><PacientesAdmin /></Protegido>} />

          <Route path="/conta" element={<Protegido perfis={['PROFISSIONAL', 'ADMINISTRADOR']}><Conta /></Protegido>} />
          <Route path="*" element={<NaoEncontrada />} />
        </Route>
        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </BrowserRouter>
  )
}
