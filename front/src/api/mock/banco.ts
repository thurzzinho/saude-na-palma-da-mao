// Banco de dados simulado, usado só quando VITE_USAR_MOCK=true.
// Espelha as tabelas do PI_SAUDE_.sql e fica salvo no localStorage do navegador.
// As datas dos dados de exemplo são calculadas a partir de "hoje",
// para que as regras de 24 horas e 8 horas funcionem em qualquer dia de demonstração.

import type { StatusAgendamento, TipoUsuario } from '../tipos'
import { hojeEmRecife, montarDataHora, dataPura } from '../../utils/datas'

export interface UsuarioDB { idUsuario: number; nome: string; email: string; senha: string; telefone: string | null; tipoUsuario: TipoUsuario; ativo: boolean }
export interface PacienteDB { idPaciente: number; idUsuario: number; cpf: string; dataNascimento: string; sexo: string | null }
export interface ProfissionalDB { idProfissional: number; idUsuario: number; cpf: string; conselho: string; registroProfissional: string; ufRegistro: string; ativo: boolean }
export interface ClinicaDB { idClinica: number; nome: string; cnpj: string; telefone: string | null; email: string | null; logradouro: string | null; numero: string | null; bairro: string | null; cidade: string; uf: string; cep: string | null; horarioFuncionamento: string | null; ativo: boolean }
export interface EspecialidadeDB { idEspecialidade: number; nome: string; descricao: string | null; ativo: boolean }
export interface ProfissionalClinicaDB { idProfissionalClinica: number; idProfissional: number; idClinica: number; ativo: boolean }
export interface DisponibilidadeDB { idDisponibilidade: number; idProfissionalClinica: number; dataAtendimento: string; horaInicio: string; horaFim: string; duracaoMinutos: number; ativo: boolean }
export interface AgendamentoDB { idAgendamento: number; idPaciente: number; idProfissionalClinica: number; idEspecialidade: number; dataHora: string; status: StatusAgendamento; observacao: string | null; canceladoEm: string | null; motivoCancelamento: string | null; criadoEm: string }

export interface Banco {
  versao: number
  usuarios: UsuarioDB[]
  pacientes: PacienteDB[]
  profissionais: ProfissionalDB[]
  clinicas: ClinicaDB[]
  especialidades: EspecialidadeDB[]
  profissionalClinica: ProfissionalClinicaDB[]
  profissionalEspecialidade: { idProfissional: number; idEspecialidade: number }[]
  clinicaEspecialidade: { idClinica: number; idEspecialidade: number }[]
  disponibilidades: DisponibilidadeDB[]
  agendamentos: AgendamentoDB[]
  sequencias: Record<string, number>
}

const CHAVE = 'spm:mock-banco'
const VERSAO = 1

// ── Geradores de documentos válidos para os dados de exemplo ────────────────
function cpfDe(base9: string) {
  const d = base9.split('').map(Number)
  const dv = (n: number) => {
    let s = 0
    for (let i = 0; i < n; i++) s += d[i] * (n + 1 - i)
    const r = (s * 10) % 11
    return r === 10 ? 0 : r
  }
  d.push(dv(9)); d.push(dv(10))
  return d.join('')
}
function cnpjDe(base12: string) {
  const d = base12.split('').map(Number)
  const dv = (pesos: number[]) => {
    const s = pesos.reduce((acc, p, i) => acc + p * d[i], 0)
    const r = s % 11
    return r < 2 ? 0 : 11 - r
  }
  d.push(dv([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]))
  d.push(dv([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]))
  return d.join('')
}

/** Próximos dias úteis a partir de "hoje + inicio" */
function diasUteis(inicio: number, quantidade: number): string[] {
  const dias: string[] = []
  let n = inicio
  while (dias.length < quantidade && n < inicio + quantidade * 3) {
    const d = hojeEmRecife(n)
    const semana = dataPura(d).getUTCDay()
    if (semana !== 0 && semana !== 6) dias.push(d)
    n++
  }
  return dias
}

export function criarBancoInicial(): Banco {
  const b: Banco = {
    versao: VERSAO, usuarios: [], pacientes: [], profissionais: [], clinicas: [], especialidades: [],
    profissionalClinica: [], profissionalEspecialidade: [], clinicaEspecialidade: [], disponibilidades: [],
    agendamentos: [], sequencias: {},
  }
  const prox = (t: string) => (b.sequencias[t] = (b.sequencias[t] ?? 0) + 1)

  // Especialidades (vindas do protótipo do Figma)
  const esp: [string, string, boolean][] = [
    ['Clínica Geral', 'Atendimento clínico geral e medicina preventiva', true],
    ['Cardiologia', 'Diagnóstico e tratamento de doenças do coração', true],
    ['Ortopedia', 'Tratamento do sistema músculo-esquelético', true],
    ['Dermatologia', 'Diagnóstico e tratamento de doenças da pele', true],
    ['Pediatria', 'Cuidados médicos para crianças e adolescentes', true],
    ['Ginecologia', 'Saúde da mulher e acompanhamento ginecológico', true],
    ['Oftalmologia', 'Diagnóstico e tratamento de doenças dos olhos', true],
    ['Psiquiatria', 'Tratamento de transtornos mentais e comportamentais', false],
    ['Geriatria', 'Cuidado integral da saúde da pessoa idosa', true],
    ['Endocrinologia', 'Diabetes, tireoide, colesterol e saúde hormonal', true],
    ['Neurologia', 'Memória, equilíbrio, tremores e doenças do sistema nervoso', true],
    ['Reumatologia', 'Artrose, osteoporose e dores nas articulações', true],
    ['Urologia', 'Próstata, bexiga e saúde do sistema urinário', true],
    ['Otorrinolaringologia', 'Audição, zumbido, tontura e saúde da garganta', true],
    ['Pneumologia', 'Doenças dos pulmões e dificuldades para respirar', true],
    ['Nefrologia', 'Saúde dos rins e controle da pressão', true],
  ]
  for (const [nome, descricao, ativo] of esp) b.especialidades.push({ idEspecialidade: prox('especialidade'), nome, descricao, ativo })
  const idEsp = (nome: string) => b.especialidades.find(e => e.nome === nome)!.idEspecialidade

  // Clínicas
  const cl: Omit<ClinicaDB, 'idClinica'>[] = [
    { nome: 'Clínica Recife Saúde', cnpj: cnpjDe('123456780001'), telefone: '(81) 3000-1234', email: 'contato@recifesaude.com.br', logradouro: 'Av. Boa Viagem', numero: '2340', bairro: 'Boa Viagem', cidade: 'Recife', uf: 'PE', cep: '51020000', horarioFuncionamento: 'Seg a Sex: 07h às 19h | Sáb: 08h às 13h', ativo: true },
    { nome: 'Centro Médico Derby', cnpj: cnpjDe('987654320001'), telefone: '(81) 3000-5678', email: 'contato@derbymedico.com.br', logradouro: 'Rua do Derby', numero: '180', bairro: 'Derby', cidade: 'Recife', uf: 'PE', cep: '52010000', horarioFuncionamento: 'Seg a Sex: 08h às 18h | Sáb: 08h às 12h', ativo: true },
    { nome: 'Clínica Vida Nova', cnpj: cnpjDe('112223330001'), telefone: '(81) 3000-9012', email: 'contato@vidanova.com.br', logradouro: 'Rua Henrique Dias', numero: '500', bairro: 'Casa Forte', cidade: 'Recife', uf: 'PE', cep: '52061000', horarioFuncionamento: 'Seg a Sex: 08h às 17h', ativo: false },
  ]
  for (const c of cl) b.clinicas.push({ idClinica: prox('clinica'), ...c })

  // Usuários fixos de demonstração
  const novoUsuario = (nome: string, email: string, senha: string, telefone: string | null, tipoUsuario: TipoUsuario) => {
    const u: UsuarioDB = { idUsuario: prox('usuario'), nome, email, senha, telefone, tipoUsuario, ativo: true }
    b.usuarios.push(u)
    return u
  }
  novoUsuario('Ana Rodrigues', 'admin@saude.com', 'admin123', '(81) 3000-0000', 'ADMINISTRADOR')

  // Profissionais [nome, especialidade, clínicas, base do CPF, registro]
  const prof: [string, string, number[], string, string][] = [
    ['Dr. Paulo Menezes', 'Clínica Geral', [1, 2], '444555666', '45678'],
    ['Dra. Helena Vasconcelos', 'Cardiologia', [1], '111222333', '12345'],
    ['Dr. Rafael Moura', 'Ortopedia', [2], '222333444', '23456'],
    ['Dra. Camila Andrade', 'Dermatologia', [3], '333444555', '34567'],
    ['Dra. Beatriz Lima', 'Pediatria', [2], '555666777', '56789'],
    ['Dr. Sérgio Alencar', 'Oftalmologia', [3], '666777888', '67890'],
    ['Dra. Marta Siqueira', 'Geriatria', [1], '777888999', '70777'],
    ['Dr. Henrique Tavares', 'Endocrinologia', [2], '888999000', '70888'],
    ['Dra. Lúcia Cavalcanti', 'Neurologia', [1], '999000111', '70999'],
    ['Dr. Otávio Barbosa', 'Reumatologia', [2], '101010101', '71110'],
    ['Dr. Fernando Leite', 'Urologia', [1], '121212121', '71221'],
    ['Dra. Renata Nogueira', 'Otorrinolaringologia', [2], '131313131', '71332'],
    ['Dr. Augusto Pessoa', 'Pneumologia', [1], '141414141', '71443'],
    ['Dra. Vera Monteiro', 'Nefrologia', [2], '151515151', '71554'],
  ]
  for (const [nome, especialidade, clinicasIds, baseCpf, reg] of prof) {
    const slug = nome.replace(/^(Dr|Dra)\.\s+/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '.')
    const u = novoUsuario(nome, `${slug}@saude.com`, '123456', '(81) 98888-0000', 'PROFISSIONAL')
    const p: ProfissionalDB = { idProfissional: prox('profissional'), idUsuario: u.idUsuario, cpf: cpfDe(baseCpf), conselho: 'CRM', registroProfissional: reg, ufRegistro: 'PE', ativo: true }
    b.profissionais.push(p)
    b.profissionalEspecialidade.push({ idProfissional: p.idProfissional, idEspecialidade: idEsp(especialidade) })
    for (const idClinica of clinicasIds) {
      b.profissionalClinica.push({ idProfissionalClinica: prox('profissional_clinica'), idProfissional: p.idProfissional, idClinica, ativo: true })
      if (!b.clinicaEspecialidade.some(x => x.idClinica === idClinica && x.idEspecialidade === idEsp(especialidade))) {
        b.clinicaEspecialidade.push({ idClinica, idEspecialidade: idEsp(especialidade) })
      }
    }
  }
  // Dr. Paulo também atende Geriatria, para demonstrar profissional com mais de uma especialidade
  b.profissionalEspecialidade.push({ idProfissional: 1, idEspecialidade: idEsp('Geriatria') })

  // Pacientes
  const pac: [string, string, string, string, string][] = [
    ['Maria José da Silva', 'maria.jose@email.com', '(81) 99876-5432', '123456789', '1958-03-15'],
    ['João Santos', 'joao.santos@email.com', '(81) 99111-2222', '234567891', '1960-07-02'],
    ['Ana Lima', 'ana.lima@email.com', '(81) 99333-4444', '345678912', '1975-11-20'],
    ['Carlos Silva', 'carlos.silva@email.com', '(81) 99555-6666', '456789123', '1949-01-09'],
    ['Lúcia Ferreira', 'lucia.ferreira@email.com', '(81) 99777-8888', '567891234', '1955-05-30'],
  ]
  for (const [nome, email, tel, baseCpf, nasc] of pac) {
    const u = novoUsuario(nome, email, '123456', tel, 'PACIENTE')
    b.pacientes.push({ idPaciente: prox('paciente'), idUsuario: u.idUsuario, cpf: cpfDe(baseCpf), dataNascimento: nasc, sexo: null })
  }

  // Disponibilidades: manhãs dos próximos 15 dias úteis para todo vínculo de clínica ativa
  const futuros = diasUteis(1, 15)
  for (const pc of b.profissionalClinica) {
    const clinica = b.clinicas.find(c => c.idClinica === pc.idClinica)!
    if (!clinica.ativo) continue
    const ehPauloDerby = pc.idProfissional === 1 && pc.idClinica === 2
    for (const dia of futuros) {
      b.disponibilidades.push({
        idDisponibilidade: prox('disponibilidade'), idProfissionalClinica: pc.idProfissionalClinica, dataAtendimento: dia,
        horaInicio: ehPauloDerby ? '14:00' : '08:00', horaFim: ehPauloDerby ? '17:00' : '12:00', duracaoMinutos: 30, ativo: true,
      })
    }
  }
  // Agenda de hoje e dos dias anteriores do Dr. Paulo na Clínica Recife Saúde (vínculo 1)
  const hoje = hojeEmRecife(0)
  const passados = [hojeEmRecife(-30), hojeEmRecife(-7), hoje]
  for (const dia of passados) {
    b.disponibilidades.push({ idDisponibilidade: prox('disponibilidade'), idProfissionalClinica: 1, dataAtendimento: dia, horaInicio: '08:00', horaFim: '12:00', duracaoMinutos: 30, ativo: true })
  }

  // Agendamentos
  const pclDe = (idProfissional: number, idClinica: number) =>
    b.profissionalClinica.find(x => x.idProfissional === idProfissional && x.idClinica === idClinica)!.idProfissionalClinica
  const agora = new Date().toISOString()
  const ag = (idPaciente: number, idPcl: number, especialidade: string, data: string, hora: string, status: StatusAgendamento, motivo: string | null = null) => {
    b.agendamentos.push({
      idAgendamento: prox('agendamento'), idPaciente, idProfissionalClinica: idPcl, idEspecialidade: idEsp(especialidade),
      dataHora: montarDataHora(data, hora), status, observacao: null,
      canceladoEm: status === 'CANCELADO' ? agora : null, motivoCancelamento: motivo, criadoEm: agora,
    })
  }
  // Maria (paciente 1)
  ag(1, pclDe(1, 1), 'Clínica Geral', futuros[2], '09:00', 'AGENDADO')
  ag(1, pclDe(2, 1), 'Cardiologia', futuros[4], '10:30', 'CONFIRMADO')
  ag(1, pclDe(1, 1), 'Clínica Geral', hojeEmRecife(-30), '10:30', 'REALIZADO')
  ag(1, pclDe(2, 1), 'Cardiologia', hojeEmRecife(-7), '08:00', 'CANCELADO', 'Imprevisto pessoal')
  // Agenda de hoje do Dr. Paulo
  ag(2, 1, 'Clínica Geral', hoje, '08:00', 'REALIZADO')
  ag(3, 1, 'Clínica Geral', hoje, '08:30', 'CONFIRMADO')
  ag(4, 1, 'Clínica Geral', hoje, '09:30', 'AGENDADO')
  ag(5, 1, 'Clínica Geral', hoje, '11:30', 'AGENDADO')
  // Outros futuros
  ag(2, pclDe(1, 1), 'Clínica Geral', futuros[2], '08:00', 'AGENDADO')
  ag(3, pclDe(3, 2), 'Ortopedia', futuros[1], '09:00', 'AGENDADO')
  ag(4, pclDe(5, 2), 'Pediatria', futuros[3], '10:00', 'CONFIRMADO')

  return b
}

let cache: Banco | null = null
const temStorage = () => typeof localStorage !== 'undefined'

export function banco(): Banco {
  if (cache) return cache
  if (temStorage()) {
    try {
      const bruto = localStorage.getItem(CHAVE)
      if (bruto) {
        const lido = JSON.parse(bruto) as Banco
        if (lido.versao === VERSAO) return (cache = lido)
      }
    } catch { /* recria abaixo */ }
  }
  cache = criarBancoInicial()
  salvarBanco()
  return cache
}

export function salvarBanco() {
  if (cache && temStorage()) localStorage.setItem(CHAVE, JSON.stringify(cache))
}

/** Apaga tudo e recria os dados de demonstração. */
export function restaurarBanco() {
  cache = criarBancoInicial()
  salvarBanco()
}

export function proximoId(tabela: string) {
  const b = banco()
  return (b.sequencias[tabela] = (b.sequencias[tabela] ?? 0) + 1)
}
