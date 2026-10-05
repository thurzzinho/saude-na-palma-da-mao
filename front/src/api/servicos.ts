// Funções que as telas usam para falar com a API.
// Cada função corresponde a uma rota descrita em docs/CONTRATO_API.md.

import { requisicao } from './http'
import type {
  Agendamento, Clinica, DadosClinica, DadosEspecialidade, DadosProfissional, Disponibilidade,
  Especialidade, FiltrosAgendamento, NovaDisponibilidade, NovoAgendamento, NovoPaciente, Paciente,
  Profissional, ProfissionalClinica, RespostaHorarios, RespostaLogin,
} from './tipos'

// ── Autenticação e paciente ─────────────────────────────────────────────────
export const autenticacao = {
  entrar: (login: string, senha: string) =>
    requisicao<RespostaLogin>('POST', '/autenticacao/login', { login, senha }),
}

export const pacientes = {
  cadastrar: (dados: NovoPaciente) => requisicao<RespostaLogin>('POST', '/pacientes', dados),
  meusDados: () => requisicao<Paciente>('GET', '/pacientes/me'),
  atualizarMeusDados: (dados: { nome: string; telefone: string; email: string }) =>
    requisicao<Paciente>('PUT', '/pacientes/me', dados),
}

// ── Especialidades ──────────────────────────────────────────────────────────
export const especialidades = {
  // Paciente recebe só as ativas. Administrador pode pedir todas.
  listar: (todas = false) => requisicao<Especialidade[]>('GET', '/especialidades', undefined, { todas: todas || undefined }),
  criar: (d: DadosEspecialidade) => requisicao<Especialidade>('POST', '/especialidades', d),
  atualizar: (id: number, d: DadosEspecialidade) => requisicao<Especialidade>('PUT', `/especialidades/${id}`, d),
  definirAtivo: (id: number, ativo: boolean) => requisicao<Especialidade>('PATCH', `/especialidades/${id}/ativacao`, { ativo }),
}

// ── Clínicas ────────────────────────────────────────────────────────────────
export const clinicas = {
  listar: (opcoes: { todas?: boolean; busca?: string } = {}) =>
    requisicao<Clinica[]>('GET', '/clinicas', undefined, { todas: opcoes.todas || undefined, busca: opcoes.busca }),
  obter: (id: number) => requisicao<Clinica>('GET', `/clinicas/${id}`),
  criar: (d: DadosClinica) => requisicao<Clinica>('POST', '/clinicas', d),
  atualizar: (id: number, d: DadosClinica) => requisicao<Clinica>('PUT', `/clinicas/${id}`, d),
  definirAtivo: (id: number, ativo: boolean) => requisicao<Clinica>('PATCH', `/clinicas/${id}/ativacao`, { ativo }),
}

// ── Profissionais ───────────────────────────────────────────────────────────
export const profissionais = {
  listar: () => requisicao<Profissional[]>('GET', '/profissionais'),
  obter: (id: number) => requisicao<Profissional>('GET', `/profissionais/${id}`),
  meusDados: () => requisicao<Profissional>('GET', '/profissionais/me'),
  criar: (d: DadosProfissional) => requisicao<Profissional>('POST', '/profissionais', d),
  atualizar: (id: number, d: DadosProfissional) => requisicao<Profissional>('PUT', `/profissionais/${id}`, d),
  definirAtivo: (id: number, ativo: boolean) => requisicao<Profissional>('PATCH', `/profissionais/${id}/ativacao`, { ativo }),
  // Busca do paciente (regras v3, seção 6)
  buscarParaAgendamento: (f: { idEspecialidade?: number; idClinica?: number }) =>
    requisicao<ProfissionalClinica[]>('GET', '/profissionais-clinicas', undefined, f),
}

// ── Disponibilidades ────────────────────────────────────────────────────────
export const disponibilidades = {
  horariosLivres: (idProfissionalClinica: number, data: string) =>
    requisicao<RespostaHorarios>('GET', '/disponibilidades', undefined, { idProfissionalClinica, data }),
  datasComHorario: (idProfissionalClinica: number) =>
    requisicao<{ datas: string[] }>('GET', '/disponibilidades/datas', undefined, { idProfissionalClinica }),
  minhas: () => requisicao<Disponibilidade[]>('GET', '/disponibilidades/minhas'),
  criar: (d: NovaDisponibilidade) => requisicao<Disponibilidade>('POST', '/disponibilidades', d),
  desativar: (id: number) => requisicao<void>('DELETE', `/disponibilidades/${id}`),
}

// ── Agendamentos ────────────────────────────────────────────────────────────
export const agendamentos = {
  // Paciente: os seus. Profissional: os da sua agenda. Administrador: todos, com filtros.
  listar: (f: FiltrosAgendamento = {}) =>
    requisicao<Agendamento[]>('GET', '/agendamentos', undefined, { ...f }),
  obter: (id: number) => requisicao<Agendamento>('GET', `/agendamentos/${id}`),
  criar: (d: NovoAgendamento) => requisicao<Agendamento>('POST', '/agendamentos', d),
  confirmar: (id: number) => requisicao<Agendamento>('PATCH', `/agendamentos/${id}/confirmacao`),
  marcarRealizado: (id: number) => requisicao<Agendamento>('PATCH', `/agendamentos/${id}/realizacao`),
  cancelar: (id: number, motivo?: string) =>
    requisicao<Agendamento>('PATCH', `/agendamentos/${id}/cancelamento`, { motivo: motivo || null }),
}
