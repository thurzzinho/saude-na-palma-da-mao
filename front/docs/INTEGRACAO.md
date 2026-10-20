# Integração com a API

O front foi escrito contra o código do repositório `jean-jpss/saude-palma-mao-api` (commit `287ac59`, de 10/10/2026): rotas, corpos, respostas e códigos de erro foram conferidos nos controllers, nos models e em `src/apresentadores.js`. O front anterior seguia um contrato próprio (`docs/CONTRATO_API.md`) que não batia com a API, por exemplo `POST /pacientes` em vez de `POST /autenticacao/cadastro`, `/pacientes/me` em vez de `/pacientes/eu`, campo `login` em vez de `identificador` e rotas `/ativacao` que não existem. Esse contrato e o servidor simulado foram removidos.

## Rotas usadas por tela

| Tela | Rotas |
|---|---|
| Entrada | `POST /autenticacao/login` |
| Cadastro | `POST /autenticacao/cadastro` |
| Início, Minhas consultas | `GET /agendamentos` |
| Marcar consulta | `GET /especialidades`, `GET /clinicas/:id` (quando vem da tela de clínicas), `GET /profissionais-clinicas?idEspecialidade=&idClinica=`, `GET /disponibilidades?idProfissionalClinica=&data=` (um dia por chamada), `POST /agendamentos` |
| Ajuda para escolher | `GET /especialidades` |
| Detalhe da consulta | `GET /agendamentos/:id`, `GET /clinicas/:id`, `PATCH /agendamentos/:id/cancelamento` |
| Clínicas | `GET /clinicas?busca=` |
| Perfil do paciente | `GET /pacientes/eu`, `PATCH /pacientes/eu` |
| Agenda do profissional | `GET /agenda?data=&status=`, `PATCH /agendamentos/:id/confirmacao`, `PATCH /agendamentos/:id/realizacao` |
| Horários do profissional | `GET /profissionais-clinicas` (filtrado pelo `idProfissional` do login), `GET /disponibilidades/janelas?de=&ate=`, `POST /disponibilidades`, `DELETE /disponibilidades/:id` |
| Conta (profissional e administração) | `GET /autenticacao/eu` |
| Painel e Consultas (administração) | `GET /agenda`, `GET /clinicas`, `GET /profissionais`, `GET /especialidades`, `PATCH /agendamentos/:id/cancelamento` |
| Clínicas (administração) | `GET /clinicas?incluirInativas=true`, `POST /clinicas`, `PATCH /clinicas/:id`, `PUT /clinicas/:id/especialidades`, `DELETE /clinicas/:id` |
| Profissionais (administração) | `GET /profissionais`, `GET /profissionais/:id`, `POST /profissionais`, `PATCH /profissionais/:id`, `PUT /profissionais/:id/especialidades`, `POST /profissionais/:id/clinicas`, `DELETE /profissionais/:id/clinicas/:idClinica`, `DELETE /profissionais/:id` |
| Especialidades (administração) | `GET /especialidades?incluirInativas=true`, `POST`, `PATCH /especialidades/:id`, `DELETE /especialidades/:id` |
| Pacientes (administração) | `GET /pacientes?nome=&cpf=` |

Reativar clínica, profissional ou especialidade usa o `PATCH` com `{ "ativo": true }`, que a API já aceita.

Datas: a API devolve UTC e o front mostra tudo no fuso `America/Recife`. No `POST /agendamentos` o front envia o `dataHora` exatamente como veio da lista de horários livres.

## Como foi testado

Em 15 e 16/10/2026, com a API rodando localmente (Node 22, PostgreSQL 16) sobre o schema `PI_SAUDE_.sql` e o seed que estava no histórico da API (o repositório do banco não estava acessível). Um roteiro automático com Playwright passou por:

- login com erro e com CPF, cadastro de paciente com validação de campos, sessão inválida voltando para a entrada com aviso;
- agendamento completo nas 4 etapas, prévia, confirmação, download do lembrete `.ics`, lista de consultas, detalhe e cancelamento pelo paciente;
- ajuda para escolher levando à especialidade sugerida, lista de clínicas e perfil;
- profissional abrindo horários em um novo dia, vendo a agenda e confirmando uma consulta;
- administração criando especialidade e clínica, editando telefone da clínica, cancelando uma consulta e buscando pacientes;
- ausência de rolagem horizontal em 320, 375, 768 e 1280 px, e com a letra no tamanho "muito grande".

Contra a API publicada no Render o teste não foi feito daqui, porque o ambiente usado não tinha acesso à internet aberta. Vale repetir o fluxo principal depois do deploy, com o CORS configurado.

## Pendências e divergências para o grupo decidir

Nenhuma delas impede a entrega; o front já contorna cada uma.

| # | Situação | Efeito hoje | Sugestão |
|---|---|---|---|
| 1 | Mensagens de erro da API estão sem acento ("Faca login", "nao"), embora o README da API diga que texto exibido ao usuário leva acento | O front troca a mensagem pelo código do erro. Para `DADOS_INVALIDOS` e bloqueios com contagem, mostra a mensagem da API sem acento | Acentuar as mensagens na API |
| 2 | Os dados do seed estão sem acento ("Clinica Geral", "Cuida do coracao", "Hospital Portugues") | O paciente vê os nomes assim | Acentuar o `02-seed.sql` no repositório do banco |
| 3 | Regras v3, seção 1.3: o profissional cancela as consultas de uma janela para poder fechá-la. Na API, `PATCH /cancelamento` só aceita paciente e administração | O front avisa o profissional para pedir à administração | Decidir qual vale e alinhar regra e código |
| 4 | Não há rota que diga quais dias têm horário livre | O front consulta dia a dia, 7 chamadas por semana mostrada | Rota como `GET /disponibilidades/dias?idProfissionalClinica=&de=&ate=` |
| 5 | O token expira em 2 horas (`JWT_EXPIRACAO`) e não há renovação | Depois de 2 horas a pessoa precisa entrar de novo, e "lembrar senha" foi barreira para 6 de 18 | Avaliar validade maior ou token de renovação. É uma troca entre conveniência e segurança |
| 6 | Não existe recuperação de senha | O front não mostra "Esqueci minha senha" | Backlog |
| 7 | A busca de profissionais não confere se a clínica atende a especialidade (`clinica_especialidade`) | No seed, a cardiologista aparece no Hospital Unimed, que não tem Cardiologia cadastrada | Incluir o filtro na consulta ou ajustar o seed |
| 8 | O profissional não tem rota para listar os próprios vínculos | O front usa `GET /profissionais-clinicas` e filtra pelo `idProfissional`. Profissional sem especialidade não aparece ali | Rota `GET /profissionais/eu` |
| 9 | A resposta de clínica não traz o CNPJ | O CNPJ não aparece na edição da clínica | Incluir no apresentador da visão administrativa |
| 10 | Vínculo desativado não pode ser reativado (`uq_prof_clinica` e nenhuma rota de reativação) | A administração não consegue devolver o profissional a uma clínica | Rota de reativação do vínculo |
| 11 | Os `PATCH` usam `COALESCE`, então campo opcional não pode ser apagado (telefone da clínica, por exemplo) | Só é possível trocar o valor, não limpar | Tratar `null` explícito como "apagar" |
| 12 | Perfil de familiar ou cuidador não existe | O front oferece "Avisar um familiar" por compartilhamento | Avaliar para a 2ª entrega |
