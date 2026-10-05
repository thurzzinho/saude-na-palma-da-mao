// Erro padrão da API: { "erro": { "codigo": "...", "mensagem": "..." } }
// Códigos da seção 5 do documento regras-agendamento-v3.

export type CodigoErro =
  // Domínio de agendamento (regras v3, seção 5)
  | 'HORARIO_INDISPONIVEL'
  | 'HORARIO_INVALIDO'
  | 'HORARIO_NO_PASSADO'
  | 'ANTECEDENCIA_INSUFICIENTE'
  | 'PACIENTE_JA_AGENDADO'
  | 'LIMITE_AGENDAMENTOS_EXCEDIDO'
  | 'ESPECIALIDADE_NAO_ATENDIDA'
  | 'PROFISSIONAL_CLINICA_INATIVO'
  | 'CANCELAMENTO_FORA_DO_PRAZO'
  | 'TRANSICAO_STATUS_INVALIDA'
  | 'AGENDAMENTO_NAO_ENCONTRADO'
  | 'DISPONIBILIDADE_NAO_ENCONTRADA'
  | 'DISPONIBILIDADE_COM_AGENDAMENTOS'
  // Propostos pelo front, ainda não estão na v3 (ver docs/CONTRATO_API.md)
  | 'DISPONIBILIDADE_SOBREPOSTA'
  | 'CREDENCIAIS_INVALIDAS'
  | 'NAO_AUTENTICADO'
  | 'ACESSO_NEGADO'
  | 'DADOS_INVALIDOS'
  | 'CPF_JA_CADASTRADO'
  | 'EMAIL_JA_CADASTRADO'
  | 'CNPJ_JA_CADASTRADO'
  | 'REGISTRO_JA_CADASTRADO'
  | 'NOME_JA_CADASTRADO'
  | 'RECURSO_NAO_ENCONTRADO'
  // Gerados pelo próprio front
  | 'SEM_CONEXAO'
  | 'ERRO_DESCONHECIDO'

// Mensagens usadas quando a API não envia uma, ou quando o erro nasce no front.
export const MENSAGENS_PADRAO: Partial<Record<CodigoErro, string>> = {
  HORARIO_INDISPONIVEL: 'Este horário acabou de ser preenchido por outro paciente. Escolha outro horário.',
  HORARIO_INVALIDO: 'Este horário não faz parte da agenda do profissional. Escolha um horário da lista.',
  HORARIO_NO_PASSADO: 'Este horário já passou. Escolha outro horário.',
  ANTECEDENCIA_INSUFICIENTE: 'Só é possível agendar com no mínimo 24 horas de antecedência.',
  PACIENTE_JA_AGENDADO: 'Você já tem uma consulta marcada neste mesmo horário.',
  LIMITE_AGENDAMENTOS_EXCEDIDO: 'Você já tem 5 consultas futuras marcadas. Cancele uma para agendar outra.',
  ESPECIALIDADE_NAO_ATENDIDA: 'Este profissional não atende a especialidade escolhida.',
  PROFISSIONAL_CLINICA_INATIVO: 'Este profissional ou clínica não está disponível no momento.',
  CANCELAMENTO_FORA_DO_PRAZO: 'O cancelamento pelo aplicativo só pode ser feito até 8 horas antes da consulta.',
  TRANSICAO_STATUS_INVALIDA: 'Esta consulta não pode mais ser alterada.',
  AGENDAMENTO_NAO_ENCONTRADO: 'Consulta não encontrada.',
  DISPONIBILIDADE_NAO_ENCONTRADA: 'Janela de atendimento não encontrada.',
  DISPONIBILIDADE_COM_AGENDAMENTOS: 'Existem consultas marcadas nesta janela. Cancele-as antes de desativá-la.',
  DISPONIBILIDADE_SOBREPOSTA: 'Já existe uma janela ativa que ocupa parte deste horário.',
  CREDENCIAIS_INVALIDAS: 'E-mail, CPF ou senha incorretos.',
  NAO_AUTENTICADO: 'Sua sessão expirou. Entre novamente.',
  ACESSO_NEGADO: 'Você não tem permissão para esta ação.',
  DADOS_INVALIDOS: 'Alguns dados estão inválidos. Confira os campos.',
  CPF_JA_CADASTRADO: 'Este CPF já está cadastrado.',
  EMAIL_JA_CADASTRADO: 'Este e-mail já está cadastrado.',
  CNPJ_JA_CADASTRADO: 'Este CNPJ já está cadastrado.',
  REGISTRO_JA_CADASTRADO: 'Este registro profissional já está cadastrado.',
  NOME_JA_CADASTRADO: 'Já existe um cadastro com este nome.',
  RECURSO_NAO_ENCONTRADO: 'Registro não encontrado.',
  SEM_CONEXAO: 'Não foi possível falar com o servidor. Verifique sua internet e tente novamente.',
  ERRO_DESCONHECIDO: 'Algo deu errado. Tente novamente em instantes.',
}

export class ErroApi extends Error {
  codigo: CodigoErro
  status: number
  detalhes?: unknown

  constructor(codigo: CodigoErro, mensagem?: string, status = 0, detalhes?: unknown) {
    super(mensagem || MENSAGENS_PADRAO[codigo] || MENSAGENS_PADRAO.ERRO_DESCONHECIDO!)
    this.name = 'ErroApi'
    this.codigo = codigo
    this.status = status
    this.detalhes = detalhes
  }
}

export function comoErroApi(e: unknown): ErroApi {
  if (e instanceof ErroApi) return e
  return new ErroApi('ERRO_DESCONHECIDO', e instanceof Error ? e.message : undefined)
}
