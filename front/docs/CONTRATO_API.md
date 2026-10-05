# Contrato da API (front ↔ back)

Este documento descreve exatamente o que o front espera do backend. O servidor simulado em `src/api/mock/servidor.ts` implementa este contrato e serve como referência executável: na dúvida sobre um comportamento, rode o front em modo mock e observe.

Legenda da coluna **Origem**:

- **v3**: rota prevista na seção 6 do documento `regras-agendamento-v3`.
- **Proposta**: rota necessária para as telas, mas que ainda não está na v3. Precisa ser validada pelo grupo.

## 1. Convenções gerais

| Item | Definição |
|---|---|
| Formato | JSON em UTF-8. Campos em camelCase, seguindo os nomes do `PI_SAUDE_.sql` (ex.: `id_clinica` vira `idClinica`). |
| Autenticação | Header `Authorization: Bearer <token>`. Todas as rotas exigem token, exceto `POST /autenticacao/login` e `POST /pacientes`. |
| Data e hora | ISO 8601 com fuso explícito, ex.: `2026-10-20T08:00:00-03:00` (regras v3, seção 0). |
| Data pura | `AAAA-MM-DD`, ex.: `2026-10-20`. |
| Hora pura | `HH:MM`, ex.: `08:00`. |
| CPF, CNPJ, CEP | Enviados e devolvidos **somente com dígitos**. A máscara é feita no front. |
| Exclusão | Lógica, via campo `ativo`. Não há DELETE físico, exceto `DELETE /disponibilidades/:id`, que apenas desativa. |
| Sucesso sem corpo | HTTP 204. |
| CORS | O back precisa liberar a origem do front na Vercel (ex.: `https://saude-na-palma.vercel.app`) e `http://localhost:5173` em desenvolvimento, incluindo o header `Authorization`. |

### Formato de erro

Todo erro segue o formato da seção 5 das regras v3:

```json
{ "erro": { "codigo": "HORARIO_INDISPONIVEL", "mensagem": "Texto para o usuário", "detalhes": {} } }
```

O campo `detalhes` é opcional. Hoje só é usado em `DISPONIBILIDADE_COM_AGENDAMENTOS`. Se a `mensagem` vier vazia, o front usa um texto padrão (`src/api/erros.ts`).

## 2. Códigos de erro

### 2.1 Códigos da v3 (seção 5)

`HORARIO_INDISPONIVEL` (409), `HORARIO_INVALIDO` (400), `HORARIO_NO_PASSADO` (400), `ANTECEDENCIA_INSUFICIENTE` (400), `PACIENTE_JA_AGENDADO` (409), `LIMITE_AGENDAMENTOS_EXCEDIDO` (409), `ESPECIALIDADE_NAO_ATENDIDA` (400), `PROFISSIONAL_CLINICA_INATIVO` (400), `CANCELAMENTO_FORA_DO_PRAZO` (400), `TRANSICAO_STATUS_INVALIDA` (409), `AGENDAMENTO_NAO_ENCONTRADO` (404), `DISPONIBILIDADE_NAO_ENCONTRADA` (404), `DISPONIBILIDADE_COM_AGENDAMENTOS` (409).

### 2.2 Códigos propostos pelo front

| Código | HTTP | Quando |
|---|---|---|
| `CREDENCIAIS_INVALIDAS` | 401 | Login ou senha incorretos, ou usuário inativo |
| `NAO_AUTENTICADO` | 401 | Token ausente, inválido ou expirado. O front desloga e volta ao login. |
| `ACESSO_NEGADO` | 403 | Perfil sem permissão para a rota |
| `DADOS_INVALIDOS` | 400 | Validação de campos. A `mensagem` deve dizer qual campo. |
| `CPF_JA_CADASTRADO` | 409 | Violação de `uq_paciente_cpf` ou `uq_profissional_cpf` |
| `EMAIL_JA_CADASTRADO` | 409 | Violação de `uq_usuario_email` |
| `CNPJ_JA_CADASTRADO` | 409 | Violação de `uq_clinica_cnpj` |
| `REGISTRO_JA_CADASTRADO` | 409 | Violação de `uq_profissional_registro` |
| `NOME_JA_CADASTRADO` | 409 | Violação de `uq_especialidade_nome` |
| `DISPONIBILIDADE_SOBREPOSTA` | 409 | Nova janela sobrepõe outra ativa do mesmo vínculo, ou viola `uq_disponibilidade_janela` |
| `RECURSO_NAO_ENCONTRADO` | 404 | Clínica, profissional ou especialidade inexistente |

## 3. Objetos

```ts
UsuarioSessao   { idUsuario, nome, email, tipoUsuario: 'PACIENTE'|'PROFISSIONAL'|'ADMINISTRADOR', idPaciente|null, idProfissional|null }
RespostaLogin   { token, usuario: UsuarioSessao }

Paciente        { idPaciente, idUsuario, nome, email, telefone|null, cpf, dataNascimento, sexo|null }
Especialidade   { idEspecialidade, nome, descricao|null, ativo }
Clinica         { idClinica, nome, cnpj, telefone|null, email|null, logradouro|null, numero|null, bairro|null,
                  cidade, uf, cep|null, horarioFuncionamento|null, ativo, idsEspecialidades: number[] }
Profissional    { idProfissional, idUsuario, nome, email, telefone|null, cpf, conselho, registroProfissional,
                  ufRegistro, ativo, idsEspecialidades: number[],
                  clinicas: [{ idProfissionalClinica, idClinica, nomeClinica, ativo }] }

ProfissionalClinica {
  idProfissionalClinica,
  profissional: { idProfissional, nome, conselho, registroProfissional, ufRegistro },
  clinica:      { idClinica, nome, bairro|null, endereco },
  especialidades: [{ idEspecialidade, nome }]
}

Disponibilidade { idDisponibilidade, idProfissionalClinica, nomeClinica, dataAtendimento, horaInicio, horaFim,
                  duracaoMinutos, ativo, totalHorarios }

Agendamento {
  idAgendamento, idProfissionalClinica, dataHora, status, observacao|null, canceladoEm|null, motivoCancelamento|null,
  paciente:      { idPaciente, nome, telefone|null },
  profissional:  { idProfissional, nome, conselho, registroProfissional, ufRegistro },
  clinica:       { idClinica, nome, bairro|null, endereco, telefone|null },
  especialidade: { idEspecialidade, nome }
}
```

`endereco` é um texto já montado pelo back, por exemplo `Av. Boa Viagem, 2340, Boa Viagem, Recife - PE`.

## 4. Rotas

### 4.1 Autenticação e pacientes

| Método e rota | Perfil | Origem | Corpo ou consulta | Resposta |
|---|---|---|---|---|
| `POST /autenticacao/login` | público | Proposta | `{ login, senha }`. `login` aceita e-mail ou CPF (com ou sem máscara). | `RespostaLogin` |
| `POST /pacientes` | público | Proposta | `{ nome, cpf, dataNascimento, telefone, email, senha }` | `RespostaLogin` (já entra logado) |
| `GET /pacientes/me` | paciente | Proposta | | `Paciente` |
| `PUT /pacientes/me` | paciente | Proposta | `{ nome, telefone, email }` | `Paciente` |

A senha deve ser gravada com bcrypt ou Argon2, como diz o comentário do `senha_hash` no SQL. O mock guarda em texto puro só porque roda no navegador para testes.

### 4.2 Especialidades

| Método e rota | Perfil | Origem | Corpo ou consulta | Resposta |
|---|---|---|---|---|
| `GET /especialidades` | autenticado | v3 | `?todas=true` (só admin) inclui as inativas | `Especialidade[]` ordenado por nome |
| `POST /especialidades` | admin | Proposta | `{ nome, descricao }` | `Especialidade` |
| `PUT /especialidades/:id` | admin | Proposta | `{ nome, descricao }` | `Especialidade` |
| `PATCH /especialidades/:id/ativacao` | admin | Proposta | `{ ativo: boolean }` | `Especialidade` |

### 4.3 Clínicas

| Método e rota | Perfil | Origem | Corpo ou consulta | Resposta |
|---|---|---|---|---|
| `GET /clinicas` | autenticado | Proposta | `?todas=true` (só admin), `?busca=` (nome ou bairro) | `Clinica[]` |
| `GET /clinicas/:id` | autenticado | Proposta | | `Clinica` (inativa só para admin) |
| `POST /clinicas` | admin | Proposta | `Clinica` sem `idClinica` e `ativo` | `Clinica` |
| `PUT /clinicas/:id` | admin | Proposta | idem | `Clinica` |
| `PATCH /clinicas/:id/ativacao` | admin | Proposta | `{ ativo: boolean }` | `Clinica` |

`idsEspecialidades` substitui por completo as linhas de `clinica_especialidade` da clínica.

### 4.4 Profissionais

| Método e rota | Perfil | Origem | Corpo ou consulta | Resposta |
|---|---|---|---|---|
| `GET /profissionais` | admin | Proposta | | `Profissional[]` |
| `GET /profissionais/me` | profissional | Proposta | | `Profissional` (usado para listar as clínicas ao criar janela) |
| `GET /profissionais/:id` | admin | Proposta | | `Profissional` |
| `POST /profissionais` | admin | Proposta | `{ nome, email, telefone, cpf, conselho, registroProfissional, ufRegistro, idsEspecialidades, idsClinicas, senha }` | `Profissional` |
| `PUT /profissionais/:id` | admin | Proposta | mesmo corpo, sem `senha` | `Profissional` |
| `PATCH /profissionais/:id/ativacao` | admin | Proposta | `{ ativo: boolean }` | `Profissional` |
| `GET /profissionais-clinicas` | autenticado | v3 | `?idEspecialidade=&idClinica=` | `ProfissionalClinica[]` |

Regras do POST e PUT:

- Cria ou atualiza `usuario` (tipo `PROFISSIONAL`) e `profissional` na mesma transação.
- `idsEspecialidades` substitui `profissional_especialidade`.
- `idsClinicas` sincroniza `profissional_clinica`. Uma clínica removida tem o vínculo **desativado**, não apagado, porque há agendamentos que referenciam o vínculo. Uma clínica readicionada reativa o vínculo existente.
- Desativar o profissional também desativa o `usuario`, bloqueando o login.

`GET /profissionais-clinicas` devolve só vínculos ativos de profissional ativo em clínica ativa (regras v3, item 2).

### 4.5 Disponibilidades

| Método e rota | Perfil | Origem | Corpo ou consulta | Resposta |
|---|---|---|---|---|
| `GET /disponibilidades` | autenticado | v3 | `?idProfissionalClinica=&data=AAAA-MM-DD` | `{ data, horarios: [{ dataHora, hora, disponivel }] }` |
| `GET /disponibilidades/datas` | autenticado | Proposta | `?idProfissionalClinica=` | `{ datas: string[] }` |
| `GET /disponibilidades/minhas` | profissional | Proposta | | `Disponibilidade[]`, incluindo inativas |
| `POST /disponibilidades` | profissional, admin | v3 | `{ idProfissionalClinica, dataAtendimento, horaInicio, horaFim, duracaoMinutos }` | `Disponibilidade` |
| `DELETE /disponibilidades/:id` | profissional, admin | v3 | | 204 |

Detalhes que o front depende:

- **`GET /disponibilidades`** devolve **todos** os slots da janela de listagem (item 1.1), com `disponivel: false` para os ocupados. O front mostra os ocupados riscados, como no protótipo. Se o grupo preferir devolver só os livres, o front continua funcionando, apenas sem a marcação de "Ocupado".
- **`GET /disponibilidades/datas`** lista as datas, dentro da janela de 60 dias, que têm ao menos um slot livre. Sem ela, o paciente teria que testar data por data.
- **`DELETE` com agendamentos** responde 409 `DISPONIBILIDADE_COM_AGENDAMENTOS` com:

```json
{ "erro": { "codigo": "DISPONIBILIDADE_COM_AGENDAMENTOS", "mensagem": "...",
  "detalhes": { "agendamentos": [ { "idAgendamento": 12, "dataHora": "2026-10-20T08:00:00-03:00", "nomePaciente": "Maria José da Silva", "status": "AGENDADO" } ] } } }
```

### 4.6 Agendamentos

| Método e rota | Perfil | Origem | Corpo ou consulta | Resposta |
|---|---|---|---|---|
| `GET /agendamentos` | todos | v3 (ampliada) | `?data=&idClinica=&idProfissional=&status=` | `Agendamento[]` |
| `GET /agendamentos/:id` | todos | v3 | | `Agendamento` |
| `POST /agendamentos` | paciente | v3 | `{ idProfissionalClinica, idEspecialidade, dataHora, observacao? }` | `Agendamento` |
| `PATCH /agendamentos/:id/confirmacao` | profissional, admin | v3 | | `Agendamento` |
| `PATCH /agendamentos/:id/realizacao` | profissional, admin | v3 | | `Agendamento` |
| `PATCH /agendamentos/:id/cancelamento` | paciente, admin | v3 | `{ motivo: string \| null }` | `Agendamento` |

Ampliação proposta para `GET /agendamentos`. A v3 prevê a rota só para o paciente. O front usa a mesma rota para os três perfis, e o back filtra pelo token:

- **Paciente:** só os dele.
- **Profissional:** os dos seus vínculos (agenda do dia com `?data=`).
- **Administrador:** todos, com os filtros opcionais.

`GET /agendamentos/:id` também é chamado pelo profissional. Um agendamento de outro paciente ou profissional deve responder 404 `AGENDAMENTO_NAO_ENCONTRADO`, como diz a v3.

## 5. Pontos em aberto para o grupo

1. **Quem cancela para liberar uma janela.** O item 1.3 diz que o profissional cancela os agendamentos um a um para desativar a janela. As seções 3 e 4 dizem que só paciente e administrador cancelam. O front e o mock seguem as seções 3 e 4. O profissional vê a lista do 409 e precisa pedir ao administrador. Se o grupo decidir que o profissional também cancela, basta liberar o perfil em `PATCH /agendamentos/:id/cancelamento` e adicionar o botão na agenda do profissional.
2. **`uq_disponibilidade_janela` sem filtro.** A constraint não tem `WHERE ativo = TRUE`. Uma janela desativada impede criar outra no mesmo vínculo, data e hora de início. Sugestão: trocar por índice único parcial `WHERE ativo = TRUE`, no mesmo estilo de `uq_agendamento_slot`.
3. **Divergência de status entre SQL e regras.** O SQL usa `WHERE status <> 'CANCELADO'` nos índices únicos de agendamento, e a v3 (item 7.1) usa `WHERE status IN ('AGENDADO', 'CONFIRMADO')`. Na prática, a diferença está nos agendamentos `REALIZADO`. Pelo SQL, um realizado continua bloqueando o slot, o que não muda nada porque o slot já passou. Vale alinhar os dois textos.
4. **Sobreposição de janelas.** A v3 não trata duas janelas ativas que se sobrepõem no mesmo dia. O mock recusa com `DISPONIBILIDADE_SOBREPOSTA`, para não gerar slots duplicados.
