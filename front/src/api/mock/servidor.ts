// Servidor simulado. Recebe as mesmas rotas que o backend real (docs/CONTRATO_API.md)
// e aplica as regras do documento regras-agendamento-v3.
// Serve para o front ser desenvolvido e testado antes do backend ficar pronto.
// NÃO é seguro: senhas ficam em texto puro no navegador. Uso apenas em desenvolvimento.

import { ErroApi, type CodigoErro } from '../erros'
import type {
  Agendamento, Clinica, Disponibilidade, Especialidade, Paciente, Profissional, ProfissionalClinica,
  RespostaLogin, StatusAgendamento, TipoUsuario, UsuarioSessao,
} from '../tipos'
import {
  banco, proximoId, salvarBanco,
  type AgendamentoDB, type ClinicaDB, type DisponibilidadeDB, type ProfissionalDB, type UsuarioDB,
} from './banco'
import { dataEmRecife, formatarHora, hojeEmRecife, montarDataHora } from '../../utils/datas'
import { cnpjValido, cpfValido, emailValido, enderecoClinica, soDigitos } from '../../utils/formatos'

// ── Parâmetros das regras (regras v3) ───────────────────────────────────────
const ANTECEDENCIA_MIN_HORAS = 24 // item 2
const JANELA_DIAS = 60 // item 1
const PRAZO_CANCELAMENTO_HORAS = 8 // item 3
const LIMITE_FUTUROS = 5 // item 2
const ATIVOS: StatusAgendamento[] = ['AGENDADO', 'CONFIRMADO']

const HTTP: Partial<Record<CodigoErro, number>> = {
  HORARIO_INDISPONIVEL: 409, HORARIO_INVALIDO: 400, HORARIO_NO_PASSADO: 400, ANTECEDENCIA_INSUFICIENTE: 400,
  PACIENTE_JA_AGENDADO: 409, LIMITE_AGENDAMENTOS_EXCEDIDO: 409, ESPECIALIDADE_NAO_ATENDIDA: 400,
  PROFISSIONAL_CLINICA_INATIVO: 400, CANCELAMENTO_FORA_DO_PRAZO: 400, TRANSICAO_STATUS_INVALIDA: 409,
  AGENDAMENTO_NAO_ENCONTRADO: 404, DISPONIBILIDADE_NAO_ENCONTRADA: 404, DISPONIBILIDADE_COM_AGENDAMENTOS: 409,
  DISPONIBILIDADE_SOBREPOSTA: 409, CREDENCIAIS_INVALIDAS: 401, NAO_AUTENTICADO: 401, ACESSO_NEGADO: 403,
  DADOS_INVALIDOS: 400, CPF_JA_CADASTRADO: 409, EMAIL_JA_CADASTRADO: 409, CNPJ_JA_CADASTRADO: 409,
  REGISTRO_JA_CADASTRADO: 409, NOME_JA_CADASTRADO: 409, RECURSO_NAO_ENCONTRADO: 404,
}
function falhar(codigo: CodigoErro, mensagem?: string, detalhes?: unknown): never {
  throw new ErroApi(codigo, mensagem, HTTP[codigo] ?? 400, detalhes)
}

// ── Utilidades ──────────────────────────────────────────────────────────────
const agoraMs = () => Date.now()
const ms = (iso: string) => new Date(iso).getTime()
const minutos = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const textoOuNulo = (v: unknown) => texto(v) || null
const ehData = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v)
const ehHora = (v: string) => /^\d{2}:\d{2}$/.test(v)

/** Gera os inícios de slot de uma janela. Slots contíguos, sobra descartada (item 1). */
function slotsDaJanela(d: DisponibilidadeDB): string[] {
  const inicio = minutos(d.horaInicio), fim = minutos(d.horaFim)
  const lista: string[] = []
  for (let t = inicio; t + d.duracaoMinutos <= fim; t += d.duracaoMinutos) lista.push(montarDataHora(d.dataAtendimento, hhmm(t)))
  return lista
}

// ── Sessão ──────────────────────────────────────────────────────────────────
function tokenPara(u: UsuarioDB) { return `mock.${u.idUsuario}.${Date.now()}` }

function usuarioDoToken(token: string | null): UsuarioDB {
  const id = Number(token?.split('.')[1])
  const u = banco().usuarios.find(x => x.idUsuario === id && x.ativo)
  if (!u) falhar('NAO_AUTENTICADO')
  return u
}
function exigir(token: string | null, ...perfis: TipoUsuario[]) {
  const u = usuarioDoToken(token)
  if (perfis.length && !perfis.includes(u.tipoUsuario)) falhar('ACESSO_NEGADO')
  return u
}
function sessaoDe(u: UsuarioDB): UsuarioSessao {
  const b = banco()
  return {
    idUsuario: u.idUsuario, nome: u.nome, email: u.email, tipoUsuario: u.tipoUsuario,
    idPaciente: b.pacientes.find(p => p.idUsuario === u.idUsuario)?.idPaciente ?? null,
    idProfissional: b.profissionais.find(p => p.idUsuario === u.idUsuario)?.idProfissional ?? null,
  }
}
const pacienteDoUsuario = (u: UsuarioDB) => banco().pacientes.find(p => p.idUsuario === u.idUsuario) ?? falhar('ACESSO_NEGADO')
const profissionalDoUsuario = (u: UsuarioDB) => banco().profissionais.find(p => p.idUsuario === u.idUsuario) ?? falhar('ACESSO_NEGADO')

// ── Montagem das respostas ──────────────────────────────────────────────────
function vEspecialidade(e: { idEspecialidade: number; nome: string; descricao: string | null; ativo: boolean }): Especialidade { return { ...e } }

function vClinica(c: ClinicaDB): Clinica {
  return { ...c, idsEspecialidades: banco().clinicaEspecialidade.filter(x => x.idClinica === c.idClinica).map(x => x.idEspecialidade) }
}

function vProfissional(p: ProfissionalDB): Profissional {
  const b = banco()
  const u = b.usuarios.find(x => x.idUsuario === p.idUsuario)!
  return {
    idProfissional: p.idProfissional, idUsuario: p.idUsuario, nome: u.nome, email: u.email, telefone: u.telefone,
    cpf: p.cpf, conselho: p.conselho, registroProfissional: p.registroProfissional, ufRegistro: p.ufRegistro, ativo: p.ativo,
    idsEspecialidades: b.profissionalEspecialidade.filter(x => x.idProfissional === p.idProfissional).map(x => x.idEspecialidade),
    clinicas: b.profissionalClinica.filter(x => x.idProfissional === p.idProfissional).map(x => ({
      idProfissionalClinica: x.idProfissionalClinica, idClinica: x.idClinica, ativo: x.ativo,
      nomeClinica: b.clinicas.find(c => c.idClinica === x.idClinica)?.nome ?? '',
    })),
  }
}

function vAgendamento(a: AgendamentoDB): Agendamento {
  const b = banco()
  const pc = b.profissionalClinica.find(x => x.idProfissionalClinica === a.idProfissionalClinica)!
  const prof = b.profissionais.find(x => x.idProfissional === pc.idProfissional)!
  const uProf = b.usuarios.find(x => x.idUsuario === prof.idUsuario)!
  const cl = b.clinicas.find(x => x.idClinica === pc.idClinica)!
  const pac = b.pacientes.find(x => x.idPaciente === a.idPaciente)!
  const uPac = b.usuarios.find(x => x.idUsuario === pac.idUsuario)!
  const esp = b.especialidades.find(x => x.idEspecialidade === a.idEspecialidade)!
  return {
    idAgendamento: a.idAgendamento, idProfissionalClinica: a.idProfissionalClinica, dataHora: a.dataHora, status: a.status,
    observacao: a.observacao, canceladoEm: a.canceladoEm, motivoCancelamento: a.motivoCancelamento,
    paciente: { idPaciente: pac.idPaciente, nome: uPac.nome, telefone: uPac.telefone },
    profissional: { idProfissional: prof.idProfissional, nome: uProf.nome, conselho: prof.conselho, registroProfissional: prof.registroProfissional, ufRegistro: prof.ufRegistro },
    clinica: { idClinica: cl.idClinica, nome: cl.nome, bairro: cl.bairro, endereco: enderecoClinica(cl), telefone: cl.telefone },
    especialidade: { idEspecialidade: esp.idEspecialidade, nome: esp.nome },
  }
}

function vDisponibilidade(d: DisponibilidadeDB): Disponibilidade {
  const b = banco()
  const pc = b.profissionalClinica.find(x => x.idProfissionalClinica === d.idProfissionalClinica)!
  return { ...d, nomeClinica: b.clinicas.find(c => c.idClinica === pc.idClinica)?.nome ?? '', totalHorarios: slotsDaJanela(d).length }
}

// ── Regras compartilhadas ───────────────────────────────────────────────────
function vinculoAtivo(idPcl: number) {
  const b = banco()
  const pc = b.profissionalClinica.find(x => x.idProfissionalClinica === idPcl)
  if (!pc) return null
  const prof = b.profissionais.find(x => x.idProfissional === pc.idProfissional)
  const cl = b.clinicas.find(x => x.idClinica === pc.idClinica)
  return pc.ativo && prof?.ativo && cl?.ativo ? pc : null
}

const ocupado = (idPcl: number, dataHora: string) =>
  banco().agendamentos.some(a => a.idProfissionalClinica === idPcl && ATIVOS.includes(a.status) && ms(a.dataHora) === ms(dataHora))

/** Slots de um vínculo numa data, dentro da janela de listagem (item 1.1) */
function horariosDoDia(idPcl: number, data: string) {
  if (!vinculoAtivo(idPcl)) return []
  const min = agoraMs() + ANTECEDENCIA_MIN_HORAS * 3600000
  const max = agoraMs() + JANELA_DIAS * 86400000
  return banco().disponibilidades
    .filter(d => d.idProfissionalClinica === idPcl && d.ativo && d.dataAtendimento === data)
    .flatMap(slotsDaJanela)
    .filter(iso => ms(iso) >= min && ms(iso) <= max)
    .sort((a, c) => ms(a) - ms(c))
    .map(iso => ({ dataHora: iso, hora: formatarHora(iso), disponivel: !ocupado(idPcl, iso) }))
}

function podeVerAgendamento(u: UsuarioDB, a: AgendamentoDB) {
  if (u.tipoUsuario === 'ADMINISTRADOR') return true
  if (u.tipoUsuario === 'PACIENTE') return pacienteDoUsuario(u).idPaciente === a.idPaciente
  const prof = profissionalDoUsuario(u)
  return banco().profissionalClinica.some(x => x.idProfissionalClinica === a.idProfissionalClinica && x.idProfissional === prof.idProfissional)
}

function buscarAgendamento(u: UsuarioDB, id: number) {
  const a = banco().agendamentos.find(x => x.idAgendamento === id)
  if (!a || !podeVerAgendamento(u, a)) falhar('AGENDAMENTO_NAO_ENCONTRADO')
  return a
}

// ── Rotas ───────────────────────────────────────────────────────────────────
type Ctx = { corpo: any; consulta: URLSearchParams; token: string | null; params: string[] }
type Manipulador = (c: Ctx) => unknown
const rotas: [string, RegExp, Manipulador][] = []
const rota = (metodo: string, padrao: string, fn: Manipulador) =>
  rotas.push([metodo, new RegExp('^' + padrao.replace(/:\w+/g, '(\\d+|me)') + '$'), fn])

// Autenticação
rota('POST', '/autenticacao/login', ({ corpo }) => {
  const login = texto(corpo?.login).toLowerCase(), senha = texto(corpo?.senha)
  if (!login || !senha) falhar('DADOS_INVALIDOS', 'Informe e-mail ou CPF e a senha.')
  const b = banco()
  const cpf = soDigitos(login)
  const u = b.usuarios.find(x => x.email.toLowerCase() === login) ??
    (cpf.length === 11 ? b.usuarios.find(x => b.pacientes.some(p => p.idUsuario === x.idUsuario && p.cpf === cpf) || b.profissionais.some(p => p.idUsuario === x.idUsuario && p.cpf === cpf)) : undefined)
  if (!u || u.senha !== senha || !u.ativo) falhar('CREDENCIAIS_INVALIDAS')
  return { token: tokenPara(u), usuario: sessaoDe(u) } satisfies RespostaLogin
})

// Pacientes
rota('POST', '/pacientes', ({ corpo }) => {
  const b = banco()
  const nome = texto(corpo?.nome), email = texto(corpo?.email).toLowerCase(), senha = texto(corpo?.senha)
  const cpf = soDigitos(texto(corpo?.cpf)), nasc = texto(corpo?.dataNascimento)
  if (nome.length < 3) falhar('DADOS_INVALIDOS', 'Informe o nome completo.')
  if (!cpfValido(cpf)) falhar('DADOS_INVALIDOS', 'CPF inválido.')
  if (!ehData(nasc) || nasc > hojeEmRecife(0)) falhar('DADOS_INVALIDOS', 'Data de nascimento inválida.')
  if (!emailValido(email)) falhar('DADOS_INVALIDOS', 'E-mail inválido.')
  if (senha.length < 6) falhar('DADOS_INVALIDOS', 'A senha precisa ter pelo menos 6 caracteres.')
  if (b.usuarios.some(u => u.email.toLowerCase() === email)) falhar('EMAIL_JA_CADASTRADO')
  if (b.pacientes.some(p => p.cpf === cpf)) falhar('CPF_JA_CADASTRADO')
  const u: UsuarioDB = { idUsuario: proximoId('usuario'), nome, email, senha, telefone: textoOuNulo(corpo?.telefone), tipoUsuario: 'PACIENTE', ativo: true }
  b.usuarios.push(u)
  b.pacientes.push({ idPaciente: proximoId('paciente'), idUsuario: u.idUsuario, cpf, dataNascimento: nasc, sexo: null })
  return { token: tokenPara(u), usuario: sessaoDe(u) } satisfies RespostaLogin
})

function vPaciente(u: UsuarioDB): Paciente {
  const p = pacienteDoUsuario(u)
  return { idPaciente: p.idPaciente, idUsuario: u.idUsuario, nome: u.nome, email: u.email, telefone: u.telefone, cpf: p.cpf, dataNascimento: p.dataNascimento, sexo: p.sexo }
}
rota('GET', '/pacientes/me', ({ token }) => vPaciente(exigir(token, 'PACIENTE')))
rota('PUT', '/pacientes/me', ({ token, corpo }) => {
  const u = exigir(token, 'PACIENTE')
  const nome = texto(corpo?.nome), email = texto(corpo?.email).toLowerCase()
  if (nome.length < 3) falhar('DADOS_INVALIDOS', 'Informe o nome completo.')
  if (!emailValido(email)) falhar('DADOS_INVALIDOS', 'E-mail inválido.')
  if (banco().usuarios.some(x => x.idUsuario !== u.idUsuario && x.email.toLowerCase() === email)) falhar('EMAIL_JA_CADASTRADO')
  u.nome = nome; u.email = email; u.telefone = textoOuNulo(corpo?.telefone)
  return vPaciente(u)
})

// Especialidades
rota('GET', '/especialidades', ({ token, consulta }) => {
  const u = exigir(token)
  const todas = consulta.get('todas') === 'true' && u.tipoUsuario === 'ADMINISTRADOR'
  return banco().especialidades.filter(e => todas || e.ativo).sort((a, b) => a.nome.localeCompare(b.nome)).map(vEspecialidade)
})
function salvarEspecialidade(corpo: any, id?: number) {
  const b = banco()
  const nome = texto(corpo?.nome)
  if (nome.length < 3) falhar('DADOS_INVALIDOS', 'Informe o nome da especialidade.')
  if (b.especialidades.some(e => e.idEspecialidade !== id && e.nome.toLowerCase() === nome.toLowerCase())) falhar('NOME_JA_CADASTRADO', 'Já existe uma especialidade com este nome.')
  if (id) {
    const e = b.especialidades.find(x => x.idEspecialidade === id) ?? falhar('RECURSO_NAO_ENCONTRADO')
    e.nome = nome; e.descricao = textoOuNulo(corpo?.descricao)
    return vEspecialidade(e)
  }
  const e = { idEspecialidade: proximoId('especialidade'), nome, descricao: textoOuNulo(corpo?.descricao), ativo: true }
  b.especialidades.push(e)
  return vEspecialidade(e)
}
rota('POST', '/especialidades', ({ token, corpo }) => { exigir(token, 'ADMINISTRADOR'); return salvarEspecialidade(corpo) })
rota('PUT', '/especialidades/:id', ({ token, corpo, params }) => { exigir(token, 'ADMINISTRADOR'); return salvarEspecialidade(corpo, Number(params[0])) })
rota('PATCH', '/especialidades/:id/ativacao', ({ token, corpo, params }) => {
  exigir(token, 'ADMINISTRADOR')
  const e = banco().especialidades.find(x => x.idEspecialidade === Number(params[0])) ?? falhar('RECURSO_NAO_ENCONTRADO')
  e.ativo = Boolean(corpo?.ativo)
  return vEspecialidade(e)
})

// Clínicas
rota('GET', '/clinicas', ({ token, consulta }) => {
  const u = exigir(token)
  const todas = consulta.get('todas') === 'true' && u.tipoUsuario === 'ADMINISTRADOR'
  const busca = (consulta.get('busca') ?? '').toLowerCase()
  return banco().clinicas
    .filter(c => todas || c.ativo)
    .filter(c => !busca || c.nome.toLowerCase().includes(busca) || (c.bairro ?? '').toLowerCase().includes(busca))
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map(vClinica)
})
rota('GET', '/clinicas/:id', ({ token, params }) => {
  const u = exigir(token)
  const c = banco().clinicas.find(x => x.idClinica === Number(params[0]))
  if (!c || (!c.ativo && u.tipoUsuario !== 'ADMINISTRADOR')) falhar('RECURSO_NAO_ENCONTRADO')
  return vClinica(c)
})
function salvarClinica(corpo: any, id?: number) {
  const b = banco()
  const nome = texto(corpo?.nome), cnpj = soDigitos(texto(corpo?.cnpj)), cep = soDigitos(texto(corpo?.cep))
  if (nome.length < 3) falhar('DADOS_INVALIDOS', 'Informe o nome da clínica.')
  if (!cnpjValido(cnpj)) falhar('DADOS_INVALIDOS', 'CNPJ inválido.')
  if (cep && cep.length !== 8) falhar('DADOS_INVALIDOS', 'CEP deve ter 8 dígitos.')
  const email = textoOuNulo(corpo?.email)
  if (email && !emailValido(email)) falhar('DADOS_INVALIDOS', 'E-mail inválido.')
  if (b.clinicas.some(c => c.idClinica !== id && c.cnpj === cnpj)) falhar('CNPJ_JA_CADASTRADO')
  const uf = (texto(corpo?.uf) || 'PE').toUpperCase().slice(0, 2)
  const dados = {
    nome, cnpj, telefone: textoOuNulo(corpo?.telefone), email, logradouro: textoOuNulo(corpo?.logradouro),
    numero: textoOuNulo(corpo?.numero), bairro: textoOuNulo(corpo?.bairro), cidade: texto(corpo?.cidade) || 'Recife', uf,
    cep: cep || null, horarioFuncionamento: textoOuNulo(corpo?.horarioFuncionamento),
  }
  let c: ClinicaDB
  if (id) {
    c = b.clinicas.find(x => x.idClinica === id) ?? falhar('RECURSO_NAO_ENCONTRADO')
    Object.assign(c, dados)
  } else {
    c = { idClinica: proximoId('clinica'), ...dados, ativo: true }
    b.clinicas.push(c)
  }
  const ids: number[] = Array.isArray(corpo?.idsEspecialidades) ? corpo.idsEspecialidades.map(Number) : []
  b.clinicaEspecialidade = b.clinicaEspecialidade.filter(x => x.idClinica !== c.idClinica)
  for (const idE of new Set(ids)) if (b.especialidades.some(e => e.idEspecialidade === idE)) b.clinicaEspecialidade.push({ idClinica: c.idClinica, idEspecialidade: idE })
  return vClinica(c)
}
rota('POST', '/clinicas', ({ token, corpo }) => { exigir(token, 'ADMINISTRADOR'); return salvarClinica(corpo) })
rota('PUT', '/clinicas/:id', ({ token, corpo, params }) => { exigir(token, 'ADMINISTRADOR'); return salvarClinica(corpo, Number(params[0])) })
rota('PATCH', '/clinicas/:id/ativacao', ({ token, corpo, params }) => {
  exigir(token, 'ADMINISTRADOR')
  const c = banco().clinicas.find(x => x.idClinica === Number(params[0])) ?? falhar('RECURSO_NAO_ENCONTRADO')
  c.ativo = Boolean(corpo?.ativo)
  return vClinica(c)
})

// Profissionais
rota('GET', '/profissionais', ({ token }) => {
  exigir(token, 'ADMINISTRADOR')
  return banco().profissionais.map(vProfissional).sort((a, b) => a.nome.localeCompare(b.nome))
})
rota('GET', '/profissionais/me', ({ token }) => vProfissional(profissionalDoUsuario(exigir(token, 'PROFISSIONAL'))))
rota('GET', '/profissionais/:id', ({ token, params }) => {
  exigir(token, 'ADMINISTRADOR')
  return vProfissional(banco().profissionais.find(x => x.idProfissional === Number(params[0])) ?? falhar('RECURSO_NAO_ENCONTRADO'))
})
function salvarProfissional(corpo: any, id?: number) {
  const b = banco()
  const nome = texto(corpo?.nome), email = texto(corpo?.email).toLowerCase(), cpf = soDigitos(texto(corpo?.cpf))
  const conselho = texto(corpo?.conselho).toUpperCase(), registro = texto(corpo?.registroProfissional), uf = texto(corpo?.ufRegistro).toUpperCase()
  const idsEsp: number[] = Array.isArray(corpo?.idsEspecialidades) ? [...new Set<number>(corpo.idsEspecialidades.map(Number))] : []
  const idsCl: number[] = Array.isArray(corpo?.idsClinicas) ? [...new Set<number>(corpo.idsClinicas.map(Number))] : []
  if (nome.length < 3) falhar('DADOS_INVALIDOS', 'Informe o nome completo.')
  if (!emailValido(email)) falhar('DADOS_INVALIDOS', 'E-mail inválido.')
  if (!cpfValido(cpf)) falhar('DADOS_INVALIDOS', 'CPF inválido.')
  if (!conselho || !registro || uf.length !== 2) falhar('DADOS_INVALIDOS', 'Informe conselho, número de registro e UF.')
  if (!idsEsp.length) falhar('DADOS_INVALIDOS', 'Selecione ao menos uma especialidade.')
  if (!idsCl.length) falhar('DADOS_INVALIDOS', 'Selecione ao menos uma clínica.')
  const atual = id ? b.profissionais.find(x => x.idProfissional === id) ?? falhar('RECURSO_NAO_ENCONTRADO') : null
  if (b.usuarios.some(u => u.idUsuario !== atual?.idUsuario && u.email.toLowerCase() === email)) falhar('EMAIL_JA_CADASTRADO')
  if (b.profissionais.some(p => p.idProfissional !== id && p.cpf === cpf)) falhar('CPF_JA_CADASTRADO')
  if (b.profissionais.some(p => p.idProfissional !== id && p.conselho === conselho && p.ufRegistro === uf && p.registroProfissional === registro)) falhar('REGISTRO_JA_CADASTRADO')

  let p: ProfissionalDB
  if (atual) {
    p = atual
    const u = b.usuarios.find(x => x.idUsuario === p.idUsuario)!
    Object.assign(u, { nome, email, telefone: textoOuNulo(corpo?.telefone) })
    Object.assign(p, { cpf, conselho, registroProfissional: registro, ufRegistro: uf })
  } else {
    const senha = texto(corpo?.senha)
    if (senha.length < 6) falhar('DADOS_INVALIDOS', 'A senha inicial precisa ter pelo menos 6 caracteres.')
    const u: UsuarioDB = { idUsuario: proximoId('usuario'), nome, email, senha, telefone: textoOuNulo(corpo?.telefone), tipoUsuario: 'PROFISSIONAL', ativo: true }
    b.usuarios.push(u)
    p = { idProfissional: proximoId('profissional'), idUsuario: u.idUsuario, cpf, conselho, registroProfissional: registro, ufRegistro: uf, ativo: true }
    b.profissionais.push(p)
  }
  b.profissionalEspecialidade = b.profissionalEspecialidade.filter(x => x.idProfissional !== p.idProfissional)
  for (const idE of idsEsp) b.profissionalEspecialidade.push({ idProfissional: p.idProfissional, idEspecialidade: idE })
  // Vínculos removidos são desativados (exclusão lógica), nunca apagados
  for (const v of b.profissionalClinica.filter(x => x.idProfissional === p.idProfissional)) v.ativo = idsCl.includes(v.idClinica)
  for (const idC of idsCl) {
    if (!b.profissionalClinica.some(x => x.idProfissional === p.idProfissional && x.idClinica === idC)) {
      b.profissionalClinica.push({ idProfissionalClinica: proximoId('profissional_clinica'), idProfissional: p.idProfissional, idClinica: idC, ativo: true })
    }
  }
  return vProfissional(p)
}
rota('POST', '/profissionais', ({ token, corpo }) => { exigir(token, 'ADMINISTRADOR'); return salvarProfissional(corpo) })
rota('PUT', '/profissionais/:id', ({ token, corpo, params }) => { exigir(token, 'ADMINISTRADOR'); return salvarProfissional(corpo, Number(params[0])) })
rota('PATCH', '/profissionais/:id/ativacao', ({ token, corpo, params }) => {
  exigir(token, 'ADMINISTRADOR')
  const b = banco()
  const p = b.profissionais.find(x => x.idProfissional === Number(params[0])) ?? falhar('RECURSO_NAO_ENCONTRADO')
  p.ativo = Boolean(corpo?.ativo)
  b.usuarios.find(u => u.idUsuario === p.idUsuario)!.ativo = p.ativo
  return vProfissional(p)
})

// Busca para agendamento (regras v3, seção 6)
rota('GET', '/profissionais-clinicas', ({ token, consulta }) => {
  exigir(token)
  const b = banco()
  const idEsp = Number(consulta.get('idEspecialidade')) || null
  const idCl = Number(consulta.get('idClinica')) || null
  return b.profissionalClinica
    .filter(pc => vinculoAtivo(pc.idProfissionalClinica))
    .filter(pc => !idCl || pc.idClinica === idCl)
    .filter(pc => !idEsp || b.profissionalEspecialidade.some(x => x.idProfissional === pc.idProfissional && x.idEspecialidade === idEsp))
    .map((pc): ProfissionalClinica => {
      const p = vProfissional(b.profissionais.find(x => x.idProfissional === pc.idProfissional)!)
      const c = b.clinicas.find(x => x.idClinica === pc.idClinica)!
      return {
        idProfissionalClinica: pc.idProfissionalClinica,
        profissional: { idProfissional: p.idProfissional, nome: p.nome, conselho: p.conselho, registroProfissional: p.registroProfissional, ufRegistro: p.ufRegistro },
        clinica: { idClinica: c.idClinica, nome: c.nome, bairro: c.bairro, endereco: enderecoClinica(c) },
        especialidades: b.especialidades.filter(e => e.ativo && p.idsEspecialidades.includes(e.idEspecialidade)).map(e => ({ idEspecialidade: e.idEspecialidade, nome: e.nome })),
      }
    })
    .sort((a, c) => a.profissional.nome.localeCompare(c.profissional.nome))
})

// Disponibilidades
rota('GET', '/disponibilidades', ({ token, consulta }) => {
  exigir(token)
  const idPcl = Number(consulta.get('idProfissionalClinica')), data = consulta.get('data') ?? ''
  if (!idPcl || !ehData(data)) falhar('DADOS_INVALIDOS', 'Informe idProfissionalClinica e data (AAAA-MM-DD).')
  return { data, horarios: horariosDoDia(idPcl, data) }
})
rota('GET', '/disponibilidades/datas', ({ token, consulta }) => {
  exigir(token)
  const idPcl = Number(consulta.get('idProfissionalClinica'))
  if (!idPcl) falhar('DADOS_INVALIDOS', 'Informe idProfissionalClinica.')
  const datas = [...new Set(banco().disponibilidades.filter(d => d.idProfissionalClinica === idPcl && d.ativo).map(d => d.dataAtendimento))]
    .filter(d => horariosDoDia(idPcl, d).some(h => h.disponivel))
    .sort()
  return { datas }
})
rota('GET', '/disponibilidades/minhas', ({ token }) => {
  const u = exigir(token, 'PROFISSIONAL')
  const prof = profissionalDoUsuario(u)
  const meus = banco().profissionalClinica.filter(x => x.idProfissional === prof.idProfissional).map(x => x.idProfissionalClinica)
  return banco().disponibilidades
    .filter(d => meus.includes(d.idProfissionalClinica))
    .sort((a, b) => (a.dataAtendimento + a.horaInicio).localeCompare(b.dataAtendimento + b.horaInicio))
    .map(vDisponibilidade)
})
function vinculoDoUsuario(u: UsuarioDB, idPcl: number) {
  const b = banco()
  const pc = b.profissionalClinica.find(x => x.idProfissionalClinica === idPcl)
  if (!pc) return null
  if (u.tipoUsuario === 'ADMINISTRADOR') return pc
  return pc.idProfissional === profissionalDoUsuario(u).idProfissional ? pc : null
}
rota('POST', '/disponibilidades', ({ token, corpo }) => {
  const u = exigir(token, 'PROFISSIONAL', 'ADMINISTRADOR')
  const b = banco()
  const idPcl = Number(corpo?.idProfissionalClinica)
  const data = texto(corpo?.dataAtendimento), ini = texto(corpo?.horaInicio), fim = texto(corpo?.horaFim)
  const dur = Number(corpo?.duracaoMinutos)
  const pc = vinculoDoUsuario(u, idPcl)
  if (!pc) falhar('DADOS_INVALIDOS', 'Clínica de atendimento inválida.')
  if (!vinculoAtivo(idPcl)) falhar('PROFISSIONAL_CLINICA_INATIVO')
  if (!ehData(data) || data < hojeEmRecife(0)) falhar('DADOS_INVALIDOS', 'Informe uma data de hoje em diante.')
  if (!ehHora(ini) || !ehHora(fim) || minutos(fim) <= minutos(ini)) falhar('DADOS_INVALIDOS', 'A hora de fim precisa ser depois da hora de início.')
  if (!Number.isInteger(dur) || dur < 5 || dur > 240) falhar('DADOS_INVALIDOS', 'A duração deve ficar entre 5 e 240 minutos.')
  if (minutos(ini) + dur > minutos(fim)) falhar('DADOS_INVALIDOS', 'A janela é menor que a duração de um atendimento.')
  const doVinculo = b.disponibilidades.filter(d => d.idProfissionalClinica === idPcl && d.dataAtendimento === data)
  // Mesma regra da constraint uq_disponibilidade_janela (vale também para janelas inativas)
  if (doVinculo.some(d => d.horaInicio === ini)) falhar('DISPONIBILIDADE_SOBREPOSTA', 'Já existe uma janela começando neste horário nesta data.')
  if (doVinculo.some(d => d.ativo && minutos(ini) < minutos(d.horaFim) && minutos(d.horaInicio) < minutos(fim))) falhar('DISPONIBILIDADE_SOBREPOSTA')
  const d: DisponibilidadeDB = { idDisponibilidade: proximoId('disponibilidade'), idProfissionalClinica: idPcl, dataAtendimento: data, horaInicio: ini, horaFim: fim, duracaoMinutos: dur, ativo: true }
  b.disponibilidades.push(d)
  return vDisponibilidade(d)
})
rota('DELETE', '/disponibilidades/:id', ({ token, params }) => {
  const u = exigir(token, 'PROFISSIONAL', 'ADMINISTRADOR')
  const b = banco()
  const d = b.disponibilidades.find(x => x.idDisponibilidade === Number(params[0]))
  if (!d || !vinculoDoUsuario(u, d.idProfissionalClinica)) falhar('DISPONIBILIDADE_NAO_ENCONTRADA')
  const slots = slotsDaJanela(d).map(ms)
  // Item 1.3: bloqueia se houver agendamentos ativos e futuros dentro da janela
  const impedem = b.agendamentos.filter(a => a.idProfissionalClinica === d.idProfissionalClinica && ATIVOS.includes(a.status) && ms(a.dataHora) > agoraMs() && slots.includes(ms(a.dataHora)))
  if (impedem.length) {
    falhar('DISPONIBILIDADE_COM_AGENDAMENTOS', undefined, {
      agendamentos: impedem.map(a => { const v = vAgendamento(a); return { idAgendamento: v.idAgendamento, dataHora: v.dataHora, nomePaciente: v.paciente.nome, status: v.status } }),
    })
  }
  d.ativo = false
  return undefined
})

// Agendamentos
rota('GET', '/agendamentos', ({ token, consulta }) => {
  const u = exigir(token)
  const b = banco()
  const data = consulta.get('data'), idCl = Number(consulta.get('idClinica')) || null
  const idProf = Number(consulta.get('idProfissional')) || null, status = consulta.get('status')
  return b.agendamentos
    .filter(a => podeVerAgendamento(u, a))
    .map(vAgendamento)
    .filter(a => !data || dataEmRecife(a.dataHora) === data)
    .filter(a => !idCl || a.clinica.idClinica === idCl)
    .filter(a => !idProf || a.profissional.idProfissional === idProf)
    .filter(a => !status || a.status === status)
    .sort((a, c) => ms(a.dataHora) - ms(c.dataHora))
})
rota('GET', '/agendamentos/:id', ({ token, params }) => vAgendamento(buscarAgendamento(exigir(token), Number(params[0]))))

rota('POST', '/agendamentos', ({ token, corpo }) => {
  const u = exigir(token, 'PACIENTE')
  const b = banco()
  const pac = pacienteDoUsuario(u)
  const idPcl = Number(corpo?.idProfissionalClinica), idEsp = Number(corpo?.idEspecialidade), dataHora = texto(corpo?.dataHora)
  const t = ms(dataHora)
  if (!idPcl || !idEsp || !dataHora || Number.isNaN(t)) falhar('DADOS_INVALIDOS', 'Informe profissional, especialidade e data/hora.')
  // Ordem de validação do item 2.1
  if (t <= agoraMs()) falhar('HORARIO_NO_PASSADO')
  if (t < agoraMs() + ANTECEDENCIA_MIN_HORAS * 3600000) falhar('ANTECEDENCIA_INSUFICIENTE')
  const pc = vinculoAtivo(idPcl)
  if (!pc) falhar('PROFISSIONAL_CLINICA_INATIVO')
  const espOk = b.especialidades.some(e => e.idEspecialidade === idEsp && e.ativo) &&
    b.profissionalEspecialidade.some(x => x.idProfissional === pc.idProfissional && x.idEspecialidade === idEsp)
  if (!espOk) falhar('ESPECIALIDADE_NAO_ATENDIDA')
  const ehSlot = b.disponibilidades.some(d => d.idProfissionalClinica === idPcl && d.ativo && slotsDaJanela(d).some(s => ms(s) === t))
  if (!ehSlot) falhar('HORARIO_INVALIDO')
  const futuros = b.agendamentos.filter(a => a.idPaciente === pac.idPaciente && ATIVOS.includes(a.status) && ms(a.dataHora) > agoraMs())
  if (futuros.length >= LIMITE_FUTUROS) falhar('LIMITE_AGENDAMENTOS_EXCEDIDO')
  // Item 7: os índices únicos do banco
  if (ocupado(idPcl, dataHora)) falhar('HORARIO_INDISPONIVEL')
  if (b.agendamentos.some(a => a.idPaciente === pac.idPaciente && ATIVOS.includes(a.status) && ms(a.dataHora) === t)) falhar('PACIENTE_JA_AGENDADO')
  const novo: AgendamentoDB = {
    idAgendamento: proximoId('agendamento'), idPaciente: pac.idPaciente, idProfissionalClinica: idPcl, idEspecialidade: idEsp,
    dataHora: montarDataHora(dataEmRecife(dataHora), formatarHora(dataHora)), status: 'AGENDADO',
    observacao: textoOuNulo(corpo?.observacao), canceladoEm: null, motivoCancelamento: null, criadoEm: new Date().toISOString(),
  }
  b.agendamentos.push(novo)
  return vAgendamento(novo)
})

function transicao(a: AgendamentoDB, para: StatusAgendamento) {
  const permitidas: Record<StatusAgendamento, StatusAgendamento[]> = {
    AGENDADO: ['CONFIRMADO', 'CANCELADO', 'REALIZADO'], CONFIRMADO: ['CANCELADO', 'REALIZADO'], CANCELADO: [], REALIZADO: [],
  }
  if (!permitidas[a.status].includes(para)) falhar('TRANSICAO_STATUS_INVALIDA')
}
rota('PATCH', '/agendamentos/:id/confirmacao', ({ token, params }) => {
  const u = exigir(token, 'PROFISSIONAL', 'ADMINISTRADOR')
  const a = buscarAgendamento(u, Number(params[0]))
  transicao(a, 'CONFIRMADO')
  a.status = 'CONFIRMADO'
  return vAgendamento(a)
})
rota('PATCH', '/agendamentos/:id/realizacao', ({ token, params }) => {
  const u = exigir(token, 'PROFISSIONAL', 'ADMINISTRADOR')
  const a = buscarAgendamento(u, Number(params[0]))
  transicao(a, 'REALIZADO')
  a.status = 'REALIZADO'
  return vAgendamento(a)
})
rota('PATCH', '/agendamentos/:id/cancelamento', ({ token, params, corpo }) => {
  const u = exigir(token, 'PACIENTE', 'ADMINISTRADOR')
  const a = buscarAgendamento(u, Number(params[0]))
  transicao(a, 'CANCELADO')
  // Item 3: agendamento passado não pode ser cancelado por ninguém
  if (ms(a.dataHora) <= agoraMs()) falhar('TRANSICAO_STATUS_INVALIDA', 'Esta consulta já passou e não pode ser cancelada.')
  // Prazo de 8 horas vale só para o paciente
  if (u.tipoUsuario === 'PACIENTE' && ms(a.dataHora) - agoraMs() < PRAZO_CANCELAMENTO_HORAS * 3600000) falhar('CANCELAMENTO_FORA_DO_PRAZO')
  a.status = 'CANCELADO'
  a.canceladoEm = new Date().toISOString()
  a.motivoCancelamento = textoOuNulo(corpo?.motivo)?.slice(0, 255) ?? null
  return vAgendamento(a)
})

// ── Ponto de entrada ────────────────────────────────────────────────────────
const ATRASO_MS = 250 // simula a latência da rede para os estados de carregamento aparecerem

export async function atenderMock(metodo: string, caminho: string, corpo: unknown, token: string | null) {
  await new Promise(r => setTimeout(r, typeof window === 'undefined' ? 0 : ATRASO_MS))
  const [rotaPura, qs] = caminho.split('?')
  const consulta = new URLSearchParams(qs ?? '')
  for (const [m, re, fn] of rotas) {
    if (m !== metodo) continue
    const achou = rotaPura.match(re)
    if (!achou) continue
    const resultado = fn({ corpo: corpo ? JSON.parse(JSON.stringify(corpo)) : corpo, consulta, token, params: achou.slice(1) })
    if (metodo !== 'GET') salvarBanco()
    // Devolve uma cópia, como uma resposta HTTP faria
    return resultado === undefined ? undefined : JSON.parse(JSON.stringify(resultado))
  }
  throw new ErroApi('RECURSO_NAO_ENCONTRADO', `Rota não encontrada no mock: ${metodo} ${rotaPura}`, 404)
}
