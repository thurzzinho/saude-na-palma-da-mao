// Formato de erro da API: { "erro": { "codigo": "...", "mensagem": "..." } }
// Os códigos abaixo são os que a API do repositório saude-palma-mao-api
// devolve hoje (controllers e middlewares). As mensagens daqui substituem as
// da API quando existem, porque a API escreve sem acento e com termos técnicos.

const MENSAGENS: Record<string, string> = {
  // Sessão e acesso
  CREDENCIAIS_INVALIDAS: 'E-mail, CPF ou senha não conferem. Confira e tente de novo.',
  USUARIO_INATIVO: 'Esta conta está desativada. Procure a administração da clínica.',
  NAO_AUTENTICADO: 'Entre na sua conta para continuar.',
  TOKEN_EXPIRADO: 'Por segurança, sua sessão terminou. Entre de novo para continuar.',
  TOKEN_INVALIDO: 'Por segurança, sua sessão terminou. Entre de novo para continuar.',
  SEM_PERMISSAO: 'Seu perfil não tem acesso a esta parte do sistema.',

  // Cadastro
  EMAIL_JA_CADASTRADO: 'Este e-mail já tem uma conta. Tente entrar com ele.',
  CPF_JA_CADASTRADO: 'Este CPF já tem uma conta. Tente entrar com ele.',

  // Agendamento (documento de regras v3, seção 2.1)
  HORARIO_NO_PASSADO: 'Esse horário já passou. Escolha outro dia.',
  ANTECEDENCIA_INSUFICIENTE: 'As consultas precisam ser marcadas com pelo menos 24 horas de antecedência.',
  PROFISSIONAL_CLINICA_INATIVO: 'Este profissional ou esta clínica não está atendendo no momento. Escolha outro.',
  ESPECIALIDADE_NAO_ATENDIDA: 'Este profissional não atende a especialidade escolhida.',
  HORARIO_INVALIDO: 'Este horário não está na agenda do profissional. Escolha um dos horários da lista.',
  LIMITE_AGENDAMENTOS_EXCEDIDO: 'Você já tem 5 consultas marcadas. Cancele uma antes de marcar outra.',
  HORARIO_INDISPONIVEL: 'Outra pessoa marcou esse horário agora há pouco. Escolha outro, por favor.',
  PACIENTE_JA_AGENDADO: 'Você já tem outra consulta marcada nesse mesmo horário.',
  CANCELAMENTO_FORA_DO_PRAZO: 'Faltam menos de 8 horas para a consulta. Para cancelar, ligue para a clínica.',
  AGENDAMENTO_NAO_ENCONTRADO: 'Não encontramos esta consulta.',

  // Agenda do profissional
  DATA_NO_PASSADO: 'Não é possível abrir horários em uma data que já passou.',
  JANELA_SOBREPOSTA: 'Já existe um período de atendimento que cruza com esse horário nesse dia.',
  DISPONIBILIDADE_NAO_ENCONTRADA: 'Período de atendimento não encontrado.',

  // Cadastros administrativos
  CNPJ_JA_CADASTRADO: 'Já existe uma clínica com esse CNPJ.',
  ESPECIALIDADE_JA_EXISTE: 'Já existe uma especialidade com esse nome.',
  REGISTRO_JA_CADASTRADO: 'Já existe um profissional com esse conselho, UF e número de registro.',
  VINCULO_JA_EXISTE: 'Este profissional já atende nesta clínica.',
  CLINICA_NAO_ENCONTRADA: 'Clínica não encontrada.',
  ESPECIALIDADE_NAO_ENCONTRADA: 'Especialidade não encontrada.',
  PROFISSIONAL_NAO_ENCONTRADO: 'Profissional não encontrado.',
  PACIENTE_NAO_ENCONTRADO: 'Paciente não encontrado.',

  // Gerados pelo próprio front
  SEM_CONEXAO: 'Não foi possível falar com o servidor. Confira sua internet e tente de novo.',
  TEMPO_ESGOTADO: 'O servidor demorou demais para responder. Tente de novo em instantes.',
  ERRO_INTERNO: 'O servidor teve um problema. Tente de novo em instantes.',
  ERRO_DESCONHECIDO: 'Algo não saiu como esperado. Tente de novo.',
}

// Códigos cuja mensagem da API traz detalhe útil (quantas consultas impedem
// a ação, qual campo está errado). Nesses casos mostramos a mensagem da API.
const USAR_MENSAGEM_DA_API = new Set([
  'DADOS_INVALIDOS',
  'DISPONIBILIDADE_COM_AGENDAMENTOS',
  'CLINICA_COM_AGENDAMENTOS',
  'PROFISSIONAL_COM_AGENDAMENTOS',
  'ESPECIALIDADE_COM_AGENDAMENTOS',
  'VINCULO_COM_AGENDAMENTOS',
  'TRANSICAO_STATUS_INVALIDA',
  'VINCULO_INVALIDO',
])

export class ErroApi extends Error {
  codigo: string
  status: number

  constructor(codigo: string, mensagemApi?: string, status = 0) {
    const mensagem = USAR_MENSAGEM_DA_API.has(codigo) && mensagemApi
      ? mensagemApi
      : MENSAGENS[codigo] ?? mensagemApi ?? MENSAGENS.ERRO_DESCONHECIDO
    super(mensagem)
    this.name = 'ErroApi'
    this.codigo = codigo
    this.status = status
  }
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ErroApi) return erro.message
  return MENSAGENS.ERRO_DESCONHECIDO
}
