// Tipos das respostas da API, conferidos com src/apresentadores.js e os
// controllers do repositório saude-palma-mao-api (commit 287ac59).

export type TipoUsuario = 'PACIENTE' | 'PROFISSIONAL' | 'ADMINISTRADOR'
export type StatusAgendamento = 'AGENDADO' | 'CONFIRMADO' | 'CANCELADO' | 'REALIZADO'

export interface UsuarioSessao {
  idUsuario: number
  nome: string
  email: string
  telefone?: string | null
  tipoUsuario: TipoUsuario
  idPaciente: number | null
  idProfissional?: number | null
}

export interface RespostaLogin {
  usuario: UsuarioSessao
  token: string
}

export interface NovoPaciente {
  nome: string
  email: string
  cpf: string
  dataNascimento: string // AAAA-MM-DD
  telefone?: string
  senha: string
}

export interface Paciente {
  idPaciente: number
  idUsuario: number
  nome: string
  email: string
  telefone: string | null
  cpf: string
  dataNascimento: string
  sexo: string | null
  observacoes: string | null
  ativo: boolean
}

export interface Especialidade {
  idEspecialidade: number
  nome: string
  descricao: string | null
  ativo: boolean
}

export interface Endereco {
  logradouro: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  cep: string | null
  completo: string
}

export interface Clinica {
  idClinica: number
  nome: string
  telefone: string | null
  email: string | null
  horarioFuncionamento: string | null
  ativo: boolean
  endereco: Endereco
  especialidades: string[] // nomes
}

export interface DadosClinica {
  nome?: string
  cnpj?: string
  telefone?: string | null
  email?: string | null
  logradouro?: string
  numero?: string | null
  bairro?: string | null
  cidade?: string | null
  uf?: string | null
  cep?: string | null
  horarioFuncionamento?: string | null
  idsEspecialidades?: number[]
  ativo?: boolean
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
  registro: string
  ativo: boolean
  especialidades: { idEspecialidade: number; nome: string }[]
  clinicas: { idProfissionalClinica: number; idClinica: number; nome: string; ativo: boolean }[]
}

export interface DadosProfissional {
  nome?: string
  email?: string
  telefone?: string | null
  cpf?: string
  conselho?: string
  registroProfissional?: string
  ufRegistro?: string
  senha?: string
  idsClinicas?: number[]
  idsEspecialidades?: number[]
  ativo?: boolean
}

/** Resultado de GET /profissionais-clinicas: o vínculo é quem tem agenda. */
export interface Vinculo {
  idProfissionalClinica: number
  idProfissional: number
  nome: string
  registro: string
  especialidades: string[]
  clinica: { idClinica: number; nome: string; endereco: string }
}

export interface RespostaHorarios {
  idProfissionalClinica: number
  data: string
  horarios: { idDisponibilidade: number; dataHora: string }[]
}

export interface Janela {
  idDisponibilidade: number
  idProfissionalClinica: number
  dataAtendimento: string
  horaInicio: string
  horaFim: string
  duracaoMinutos: number
  ativo: boolean
  profissional: string
  clinica: string
  agendamentosAtivos: number
}

export interface NovaJanela {
  idProfissionalClinica: number
  dataAtendimento: string
  horaInicio: string
  horaFim: string
  duracaoMinutos?: number
}

export interface Agendamento {
  idAgendamento: number
  dataHora: string
  status: StatusAgendamento
  observacao: string | null
  canceladoEm: string | null
  motivoCancelamento: string | null
  criadoEm: string
  paciente: { idPaciente: number; nome: string; telefone?: string | null; dataNascimento?: string | null }
  especialidade: { idEspecialidade: number; nome: string }
  profissional: { idProfissionalClinica: number; nome: string; registro: string }
  clinica: { idClinica: number; nome: string; endereco: string }
}

export interface NovoAgendamento {
  idProfissionalClinica: number
  idEspecialidade: number
  dataHora: string
  observacao?: string
}
