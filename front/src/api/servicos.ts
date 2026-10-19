// Uma função por rota da API. Os caminhos, métodos e corpos seguem o README
// e o Swagger do repositório saude-palma-mao-api (/docs).

import { requisicao } from './http'
import type {
  Agendamento, Clinica, DadosClinica, DadosProfissional, Especialidade, Janela, NovaJanela,
  NovoAgendamento, NovoPaciente, Paciente, Profissional, RespostaHorarios, RespostaLogin,
  StatusAgendamento, UsuarioSessao, Vinculo,
} from './tipos'

export const autenticacao = {
  /** Aceita e-mail ou CPF no mesmo campo. */
  entrar: (identificador: string, senha: string) =>
    requisicao<RespostaLogin>('POST', '/autenticacao/login', { corpo: { identificador, senha } }),
  cadastrar: (dados: NovoPaciente) =>
    requisicao<RespostaLogin>('POST', '/autenticacao/cadastro', { corpo: dados }),
  eu: () => requisicao<UsuarioSessao & { cpf: string | null; dataNascimento: string | null }>('GET', '/autenticacao/eu'),
}

export const pacientes = {
  meusDados: () => requisicao<Paciente>('GET', '/pacientes/eu'),
  atualizarMeusDados: (dados: Partial<Pick<Paciente, 'nome' | 'email' | 'telefone' | 'dataNascimento'>>) =>
    requisicao<Paciente>('PATCH', '/pacientes/eu', { corpo: dados }),
  buscar: (filtro: { cpf?: string; nome?: string }) =>
    requisicao<Paciente[]>('GET', '/pacientes', { consulta: filtro }),
}

export const especialidades = {
  listar: (incluirInativas = false) =>
    requisicao<Especialidade[]>('GET', '/especialidades', { consulta: { incluirInativas: incluirInativas || undefined } }),
  criar: (d: { nome: string; descricao?: string | null }) =>
    requisicao<Especialidade>('POST', '/especialidades', { corpo: d }),
  atualizar: (id: number, d: { nome?: string; descricao?: string | null; ativo?: boolean }) =>
    requisicao<Especialidade>('PATCH', `/especialidades/${id}`, { corpo: d }),
  desativar: (id: number) => requisicao<void>('DELETE', `/especialidades/${id}`),
}

export const clinicas = {
  listar: (f: { idEspecialidade?: number; busca?: string; incluirInativas?: boolean } = {}) =>
    requisicao<Clinica[]>('GET', '/clinicas', {
      consulta: { idEspecialidade: f.idEspecialidade, busca: f.busca, incluirInativas: f.incluirInativas || undefined },
    }),
  obter: (id: number) => requisicao<Clinica>('GET', `/clinicas/${id}`),
  criar: (d: DadosClinica) => requisicao<Clinica>('POST', '/clinicas', { corpo: d }),
  atualizar: (id: number, d: DadosClinica) => requisicao<Clinica>('PATCH', `/clinicas/${id}`, { corpo: d }),
  definirEspecialidades: (id: number, idsEspecialidades: number[]) =>
    requisicao<Clinica>('PUT', `/clinicas/${id}/especialidades`, { corpo: { idsEspecialidades } }),
  desativar: (id: number) => requisicao<void>('DELETE', `/clinicas/${id}`),
}

export const vinculos = {
  /** Busca do paciente: cada profissional aparece uma vez por clínica. */
  buscar: (f: { idEspecialidade?: number; idClinica?: number; nome?: string } = {}) =>
    requisicao<Vinculo[]>('GET', '/profissionais-clinicas', { consulta: f }),
}

export const profissionais = {
  listar: (f: { busca?: string; incluirInativos?: boolean } = {}) =>
    requisicao<Profissional[]>('GET', '/profissionais', {
      consulta: { busca: f.busca, incluirInativos: f.incluirInativos || undefined },
    }),
  obter: (id: number) => requisicao<Profissional>('GET', `/profissionais/${id}`),
  criar: (d: DadosProfissional) => requisicao<Profissional>('POST', '/profissionais', { corpo: d }),
  atualizar: (id: number, d: DadosProfissional) =>
    requisicao<Profissional>('PATCH', `/profissionais/${id}`, { corpo: d }),
  definirEspecialidades: (id: number, idsEspecialidades: number[]) =>
    requisicao<Profissional>('PUT', `/profissionais/${id}/especialidades`, { corpo: { idsEspecialidades } }),
  vincularClinica: (id: number, idClinica: number) =>
    requisicao<Profissional>('POST', `/profissionais/${id}/clinicas`, { corpo: { idClinica } }),
  desvincularClinica: (id: number, idClinica: number) =>
    requisicao<void>('DELETE', `/profissionais/${id}/clinicas/${idClinica}`),
  desativar: (id: number) => requisicao<void>('DELETE', `/profissionais/${id}`),
}

export const disponibilidades = {
  /** Horários livres de um dia (já descontados os ocupados e respeitando 24 h de antecedência). */
  horariosLivres: (idProfissionalClinica: number, data: string) =>
    requisicao<RespostaHorarios>('GET', '/disponibilidades', { consulta: { idProfissionalClinica, data } }),
  janelas: (f: { de?: string; ate?: string; idProfissionalClinica?: number } = {}) =>
    requisicao<Janela[]>('GET', '/disponibilidades/janelas', { consulta: f }),
  criar: (d: NovaJanela) => requisicao<Janela & { horariosGerados: number }>('POST', '/disponibilidades', { corpo: d }),
  desativar: (id: number) => requisicao<void>('DELETE', `/disponibilidades/${id}`),
}

export const agendamentos = {
  meus: () => requisicao<Agendamento[]>('GET', '/agendamentos'),
  obter: (id: number) => requisicao<Agendamento>('GET', `/agendamentos/${id}`),
  criar: (d: NovoAgendamento) => requisicao<Agendamento>('POST', '/agendamentos', { corpo: d }),
  cancelar: (id: number, motivo?: string) =>
    requisicao<Agendamento>('PATCH', `/agendamentos/${id}/cancelamento`, { corpo: { motivo: motivo || undefined } }),
  confirmar: (id: number) => requisicao<Agendamento>('PATCH', `/agendamentos/${id}/confirmacao`),
  marcarRealizado: (id: number) => requisicao<Agendamento>('PATCH', `/agendamentos/${id}/realizacao`),
}

export const agenda = {
  /** Profissional vê a própria agenda; administrador vê todas e pode filtrar por vínculo. */
  listar: (f: { data?: string; status?: StatusAgendamento; idProfissionalClinica?: number } = {}) =>
    requisicao<Agendamento[]>('GET', '/agenda', { consulta: f }),
}
