// Testa as regras do servidor simulado contra o documento regras-agendamento-v3.
// Uso: pnpm testar-mock
import { atenderMock } from '../src/api/mock/servidor'
import { restaurarBanco } from '../src/api/mock/banco'
import { ErroApi } from '../src/api/erros'
import { hojeEmRecife, montarDataHora } from '../src/utils/datas'

let falhas = 0
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? 'OK   ' : 'FALHA'} ${msg}`); if (!cond) falhas++ }
const req = (m: string, r: string, c: unknown, t: string | null) => atenderMock(m, r, c, t)
async function erro(p: Promise<unknown>) { try { await p; return null } catch (e) { return e instanceof ErroApi ? e : null } }

async function main() {
  restaurarBanco()
  const pac = await req('POST', '/autenticacao/login', { login: 'maria.jose@email.com', senha: '123456' }, null) as any
  const adm = await req('POST', '/autenticacao/login', { login: 'admin@saude.com', senha: 'admin123' }, null) as any
  const pro = await req('POST', '/autenticacao/login', { login: 'paulo.menezes@saude.com', senha: '123456' }, null) as any
  ok(pac.usuario.tipoUsuario === 'PACIENTE' && adm.usuario.tipoUsuario === 'ADMINISTRADOR' && pro.usuario.tipoUsuario === 'PROFISSIONAL', 'login dos três perfis')
  ok((await erro(req('POST', '/autenticacao/login', { login: 'maria.jose@email.com', senha: 'x' }, null)))?.codigo === 'CREDENCIAIS_INVALIDAS', 'senha errada')
  ok((await erro(req('GET', '/profissionais', undefined, pac.token)))?.status === 403, 'paciente não lista profissionais (403)')

  const esp = await req('GET', '/especialidades', undefined, pac.token) as any[]
  ok(!esp.some(e => e.nome === 'Psiquiatria'), 'especialidade inativa não aparece para o paciente')
  const cg = esp.find(e => e.nome === 'Clínica Geral')
  const pcs = await req('GET', `/profissionais-clinicas?idEspecialidade=${cg.idEspecialidade}`, undefined, pac.token) as any[]
  ok(pcs.length === 2, 'Dr. Paulo aparece nas duas clínicas ativas')
  const todas = await req('GET', '/profissionais-clinicas', undefined, pac.token) as any[]
  ok(!todas.some(p => p.clinica.nome === 'Clínica Vida Nova'), 'clínica inativa não aparece na busca')

  const pcl = pcs[0].idProfissionalClinica
  const { datas } = await req('GET', `/disponibilidades/datas?idProfissionalClinica=${pcl}`, undefined, pac.token) as any
  ok(datas.length > 0 && datas[0] > hojeEmRecife(0), 'datas futuras listadas')
  const { horarios } = await req('GET', `/disponibilidades?idProfissionalClinica=${pcl}&data=${datas[0]}`, undefined, pac.token) as any
  const amanha = Date.now() + 24 * 3600000
  ok(horarios.every((h: any) => new Date(h.dataHora).getTime() >= amanha), 'nenhum horário com menos de 24h')
  ok(horarios[0].hora === '08:00' && horarios.at(-1).hora === '11:30', 'janela 08:00-12:00 gera 08:00 até 11:30')

  // Ordem de validação (item 2.1)
  const novo = (dataHora: string, extra: object = {}) => req('POST', '/agendamentos', { idProfissionalClinica: pcl, idEspecialidade: cg.idEspecialidade, dataHora, ...extra }, pac.token)
  ok((await erro(novo(new Date(Date.now() - 3600000).toISOString())))?.codigo === 'HORARIO_NO_PASSADO', 'HORARIO_NO_PASSADO')
  ok((await erro(novo(new Date(Date.now() + 3600000).toISOString())))?.codigo === 'ANTECEDENCIA_INSUFICIENTE', 'ANTECEDENCIA_INSUFICIENTE')
  const livre = horarios.find((h: any) => h.disponivel)
  ok((await erro(novo(livre.dataHora, { idEspecialidade: esp.find(e => e.nome === 'Cardiologia').idEspecialidade })))?.codigo === 'ESPECIALIDADE_NAO_ATENDIDA', 'ESPECIALIDADE_NAO_ATENDIDA')
  ok((await erro(novo(montarDataHora(datas[0], '08:17'))))?.codigo === 'HORARIO_INVALIDO', 'HORARIO_INVALIDO (08:17 dentro da janela)')
  const criado = await novo(livre.dataHora) as any
  ok(criado.status === 'AGENDADO', 'agendamento criado')
  ok((await erro(novo(livre.dataHora)))?.codigo === 'HORARIO_INDISPONIVEL', 'HORARIO_INDISPONIVEL no mesmo slot')

  // Limite de 5 futuros (Maria já tem 2 nos dados + 1 criado agora)
  const outros = horarios.filter((h: any) => h.disponivel && h.dataHora !== livre.dataHora)
  await novo(outros[0].dataHora); await novo(outros[1].dataHora)
  ok((await erro(novo(outros[2].dataHora)))?.codigo === 'LIMITE_AGENDAMENTOS_EXCEDIDO', 'LIMITE_AGENDAMENTOS_EXCEDIDO no 6º')

  // Cancelamento
  const c = await req('PATCH', `/agendamentos/${criado.idAgendamento}/cancelamento`, { motivo: 'teste' }, pac.token) as any
  ok(c.status === 'CANCELADO' && c.canceladoEm, 'paciente cancela com mais de 8h')
  ok((await erro(req('PATCH', `/agendamentos/${criado.idAgendamento}/confirmacao`, undefined, pro.token)))?.codigo === 'TRANSICAO_STATUS_INVALIDA', 'cancelado é estado final')
  const denovo = await novo(livre.dataHora) as any
  ok(denovo.status === 'AGENDADO', 'slot cancelado volta a ficar livre')
  const hoje = (await req('GET', `/agendamentos?data=${hojeEmRecife(0)}`, undefined, pro.token)) as any[]
  ok(hoje.length === 4, 'agenda de hoje do profissional')
  const passado = hoje.find(a => a.status === 'REALIZADO')
  ok((await erro(req('PATCH', `/agendamentos/${passado.idAgendamento}/cancelamento`, {}, adm.token)))?.codigo === 'TRANSICAO_STATUS_INVALIDA', 'realizado não cancela')
  ok((await erro(req('PATCH', `/agendamentos/${denovo.idAgendamento}/cancelamento`, {}, pro.token)))?.status === 403, 'profissional não cancela (seção 3)')
  const conf = await req('PATCH', `/agendamentos/${denovo.idAgendamento}/confirmacao`, undefined, pro.token) as any
  ok(conf.status === 'CONFIRMADO', 'profissional confirma')

  // Desativação de janela (item 1.3)
  const minhas = await req('GET', '/disponibilidades/minhas', undefined, pro.token) as any[]
  const janela = minhas.find(j => j.idProfissionalClinica === pcl && j.dataAtendimento === datas[0])
  const e = await erro(req('DELETE', `/disponibilidades/${janela.idDisponibilidade}`, undefined, pro.token))
  ok(e?.codigo === 'DISPONIBILIDADE_COM_AGENDAMENTOS' && (e.detalhes as any).agendamentos.length >= 1, 'janela com agendamentos não desativa (409 + lista)')
  const vazia = minhas.find(j => j.idProfissionalClinica === pcl && j.dataAtendimento > datas[5])
  await req('DELETE', `/disponibilidades/${vazia.idDisponibilidade}`, undefined, pro.token)
  const depois = await req('GET', `/disponibilidades?idProfissionalClinica=${pcl}&data=${vazia.dataAtendimento}`, undefined, pac.token) as any
  ok(depois.horarios.length === 0, 'janela desativada some da listagem')
  ok((await erro(req('POST', '/disponibilidades', { idProfissionalClinica: pcl, dataAtendimento: vazia.dataAtendimento, horaInicio: '09:00', horaFim: '10:00', duracaoMinutos: 30 }, pro.token))) === null, 'nova janela em data liberada')

  // CRUD admin
  const cl = await req('POST', '/clinicas', { nome: 'Clínica Teste', cnpj: '55.667.788/0001-86', cidade: 'Recife', uf: 'PE', idsEspecialidades: [cg.idEspecialidade] }, adm.token) as any
  ok(cl.idClinica > 0 && cl.ativo, 'admin cria clínica')
  ok((await erro(req('POST', '/clinicas', { nome: 'Outra', cnpj: '55667788000186' }, adm.token)))?.codigo === 'CNPJ_JA_CADASTRADO', 'CNPJ duplicado')
  const off = await req('PATCH', `/clinicas/${cl.idClinica}/ativacao`, { ativo: false }, adm.token) as any
  ok(off.ativo === false, 'admin desativa clínica')
  const p = await req('POST', '/profissionais', { nome: 'Dra. Teste Silva', email: 'teste@saude.com', cpf: '529.982.247-25', conselho: 'CRM', registroProfissional: '99999', ufRegistro: 'PE', idsEspecialidades: [cg.idEspecialidade], idsClinicas: [1], senha: '123456' }, adm.token) as any
  ok(p.clinicas.length === 1, 'admin cria profissional com vínculo')
  const cad = await req('POST', '/pacientes', { nome: 'Novo Paciente', cpf: '111.444.777-35', dataNascimento: '1950-01-01', telefone: '', email: 'novo@email.com', senha: '123456' }, null) as any
  ok(cad.usuario.tipoUsuario === 'PACIENTE', 'cadastro de paciente')

  console.log(falhas ? `\n${falhas} falha(s)` : '\nTodas as verificações passaram')
  process.exit(falhas ? 1 : 0)
}
main()
