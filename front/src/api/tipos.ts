// Tipos trocados entre o front e a API REST.
// Os nomes seguem o schema PI_SAUDE_.sql, convertidos para camelCase.
// O contrato completo está em docs/CONTRATO_API.md.

export type TipoUsuario = 'PACIENTE' | 'PROFISSIONAL' | 'ADMINISTRADOR'
export type StatusAgendamento = 'AGENDADO' | 'CONFIRMADO' | 'CANCELADO' | 'REALIZADO'

export interface UsuarioSessao {
  idUsuario: number
  nome: string
  email: string
  tipoUsuario: TipoUsuario
  idPaciente: number | null
  idProfissional: number | null
}

export interface RespostaLogin {
  token: string
  usuario: UsuarioSessao
}

export interface Paciente {
  idPaciente: number
  idUsuario: number
  nome: string
  email: string
  telefone: string | null
  cpf: string            // somente dígitos
  dataNascimento: string // YYYY-MM-DD
  sexo: string | null
}

export interface NovoPaciente {
  nome: string
  cpf: string
  dataNascimento: string
  telefone: string
  email: string
  senha: string
}

export interface Especialidade {
  idEspecialidade: number
  nome: string
  descricao: string | null
  ativo: boolean
}

export interface DadosEspecialidade {
  nome: string
  descricao: string | null
}

export interface Clinica {
  idClinica: number
  nome: string
  cnpj: string // somente dígitos
  telefone: string | null
  email: string | null
  logradouro: string | null
  numero: string | null
  bairro: string | null
  cidade: string
  uf: string
  cep: string | null
  horarioFuncionamento: string | null
  ativo: boolean
  idsEspecialidades: number[]
}

export type DadosClinica = Omit<Clinica, 'idClinica' | 'ativo'>

export interface VinculoClinica {
  idProfissionalClinica: number
  idClinica: number
  nomeClinica: string
  ativo: boolean
}

export interface Profissional {
  idProfissional: number
  idUsuario: number
  nome: string
  email: string
  telefone: string | null
  cpf: string
  conselho: string
  registroProfissional: string
  ufRegistro: string
  ativo: boolean
  idsEspecialidades: number[]
  clinicas: VinculoClinica[]
}

export interface DadosProfissional {
  nome: string
  email: string
  telefone: string | null
  cpf: string
  conselho: string
  registroProfissional: string
  ufRegistro: string
  idsEspecialidades: number[]
  idsClinicas: number[]
  senha?: string // obrigatória só no cadastro
}

// Retorno de GET /profissionais-clinicas (busca do paciente)
export interface ProfissionalClinica {
  idProfissionalClinica: number
  profissional: {
    idProfissional: number
    nome: string
    conselho: string
    registroProfissional: string
    ufRegistro: string
  }
  clinica: {
    idClinica: number
    nome: string
    bairro: string | null
    endereco: string
  }
  especialidades: { idEspecialidade: number; nome: string }[]
}

export interface Disponibilidade {
  idDisponibilidade: number
  idProfissionalClinica: number
  nomeClinica: string
  dataAtendimento: string // YYYY-MM-DD
  horaInicio: string      // HH:MM
  horaFim: string         // HH:MM
  duracaoMinutos: number
  ativo: boolean
  totalHorarios: number
}

export interface NovaDisponibilidade {
  idProfissionalClinica: number
  dataAtendimento: string
  horaInicio: string
  horaFim: string
  duracaoMinutos: number
}

export interface HorarioDisponivel {
  dataHora: string // ISO 8601 com fuso, ex.: 2026-10-20T08:00:00-03:00
  hora: string     // HH:MM em America/Recife
  disponivel: boolean
}

export interface RespostaHorarios {
  data: string
  horarios: HorarioDisponivel[]
}

export interface Agendamento {
  idAgendamento: number
  idProfissionalClinica: number
  dataHora: string
  status: StatusAgendamento
  observacao: string | null
  canceladoEm: string | null
  motivoCancelamento: string | null
  paciente: { idPaciente: number; nome: string; telefone: string | null }
  profissional: {
    idProfissional: number
    nome: string
    conselho: string
    registroProfissional: string
    ufRegistro: string
  }
  clinica: { idClinica: number; nome: string; bairro: string | null; endereco: string; telefone: string | null }
  especialidade: { idEspecialidade: number; nome: string }
}

export interface NovoAgendamento {
  idProfissionalClinica: number
  idEspecialidade: number
  dataHora: string
  observacao?: string
}

export interface FiltrosAgendamento {
  data?: string
  idClinica?: number
  idProfissional?: number
  status?: StatusAgendamento
}
