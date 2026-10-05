# Saúde na Palma da Mão (Front-end PWA)

Front-end do Projeto Integrador **Saúde na Palma da Mão**, do curso de Análise e Desenvolvimento de Sistemas da Faculdade Senac Pernambuco. Corresponde à 1ª entrega (14/10/2026): PWA responsivo para pré-triagem e agendamento de consultas no polo médico do Recife.

O visual vem do protótipo feito no Figma Make. As regras de negócio seguem o documento `regras-agendamento-v3` e o banco segue o `PI_SAUDE_.sql`.

## Tecnologias

- React 19 e TypeScript
- Vite 8
- Tailwind CSS 4
- PWA com manifest e service worker próprios (`public/sw.js`)
- Deploy na Vercel

## Como rodar

Requisitos: Node.js 22 e pnpm 10. Se o grupo usa [mise](https://mise.jdx.dev/), o arquivo `.mise.toml` já fixa as versões.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Abra `http://localhost:5173`.

### Modo demonstração (sem backend)

Com `VITE_USAR_MOCK=true`, ou com `VITE_API_URL` vazio, o front usa um servidor simulado que roda no próprio navegador (`src/api/mock`). Ele aplica as mesmas regras do documento v3 e guarda os dados no `localStorage`. Isso permite desenvolver e apresentar o front antes do backend ficar pronto.

As datas dos dados de exemplo são calculadas a partir do dia atual, então as regras de 24 horas e 8 horas funcionam em qualquer dia de apresentação. Para voltar aos dados iniciais, use o link **"Modo demonstração: restaurar dados"** no rodapé da tela inicial.

Usuários de teste (somente no modo mock):

| Perfil | Login | Senha |
|---|---|---|
| Paciente | `maria.jose@email.com` | `123456` |
| Profissional | `paulo.menezes@saude.com` | `123456` |
| Administrador | `admin@saude.com` | `admin123` |

Todos os outros profissionais seguem o padrão `nome.sobrenome@saude.com` com senha `123456`.

> O modo mock não é seguro: as senhas ficam em texto puro no navegador. Ele existe apenas para desenvolvimento e demonstração.

### Ligando no backend real

No `.env`:

```env
VITE_API_URL=https://endereco-da-api.onrender.com/api
VITE_USAR_MOCK=false
```

Reinicie o `pnpm dev`. Nenhuma tela precisa mudar: todas falam com a API por `src/api/servicos.ts`.

O backend precisa seguir o contrato descrito em **[docs/CONTRATO_API.md](docs/CONTRATO_API.md)**: rotas, formato dos objetos, códigos de erro e configuração de CORS.

## Scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Verifica os tipos e gera a versão de produção em `dist/` |
| `pnpm preview` | Serve o `dist/` localmente (o service worker só funciona aqui e em produção) |
| `pnpm verificar-tipos` | Só a checagem do TypeScript |
| `pnpm testar-mock` | Testa as regras de negócio do servidor simulado contra o documento v3 |

## Estrutura

```
src/
├── api/
│   ├── config.ts        Lê VITE_API_URL e VITE_USAR_MOCK
│   ├── http.ts          Cliente HTTP único (token, timeout, formato de erro)
│   ├── erros.ts         Códigos de erro e mensagens para o usuário
│   ├── servicos.ts      Uma função por rota da API
│   ├── sessao.ts        Guarda o token no navegador
│   ├── tipos.ts         Tipos dos objetos trocados com a API
│   └── mock/            Servidor simulado e dados de exemplo
├── componentes/UI.tsx   Botões, campos, modais e estados de tela
├── contexto/Sessao.tsx  Login, cadastro e logout
├── telas/               Telas de paciente, profissional, administrador e avisos
├── utils/               Datas (fuso America/Recife), máscaras, validações, hook de carregamento
├── navegacao.ts         Nomes das telas e controle de acesso por perfil
├── App.tsx
└── main.tsx
docs/CONTRATO_API.md     Contrato que o backend precisa implementar
scripts/testar-mock.ts   Testes das regras de negócio
```

## Funcionalidades da 1ª entrega

Cada item abaixo remete ao slide de requisitos da Visão Geral do PI.

**Paciente**
- Cadastro com validação de CPF, login por e-mail ou CPF.
- Consulta e pesquisa de clínicas por nome ou bairro.
- Consulta de especialidades e de profissionais por nome, clínica ou especialidade.
- Agendamento em 4 etapas: especialidade, profissional, data e horário, revisão.
- Minhas consultas (próximas e histórico), detalhe e cancelamento com motivo opcional.
- Perfil com edição de nome, telefone e e-mail.
- Pré-triagem por regras simples, que leva direto ao agendamento da especialidade indicada. A versão com IA é da 2ª entrega.

**Profissional**
- Agenda por data, com confirmação e marcação de realizado.
- Cadastro de janelas de atendimento, com prévia de quantos horários serão gerados.
- Desativação de janela, com aviso listando as consultas que impedem a operação.

**Administrador**
- Painel com totais e consultas do dia.
- CRUD de clínicas, profissionais e especialidades, com exclusão lógica (ativar e desativar).
- Gestão de agendamentos com filtros por clínica, profissional, data e situação.

### Regras de negócio refletidas no front

As regras valem no back, que é a fonte da verdade. O front repete algumas só para orientar o usuário antes do erro:

- Horários com menos de 24 horas não aparecem.
- O botão de cancelar some quando faltam menos de 8 horas, e a tela mostra o telefone da clínica.
- Cada erro da API leva a uma reação específica. `HORARIO_INDISPONIVEL`, por exemplo, volta para a escolha de horário já com a lista atualizada. `LIMITE_AGENDAMENTOS_EXCEDIDO` abre o aviso de limite.
- Datas sempre exibidas no fuso `America/Recife`, independentemente do fuso do aparelho.

### Acessibilidade

- Fonte base de 18 px.
- Botões com no mínimo 48 a 56 px de altura.
- Contorno de foco visível.
- Mensagens de erro e de status com `role="alert"` e `role="status"`.
- Rótulos ligados aos campos.
- Respeito à preferência de reduzir animações do sistema operacional.

## Deploy na Vercel

1. Suba este repositório no GitHub.
2. Na Vercel, clique em **Add New Project** e importe o repositório. O `vercel.json` já define build e saída.
3. Em **Settings > Environment Variables**, cadastre `VITE_API_URL` e `VITE_USAR_MOCK`.
4. Avise o time do back sobre a URL final da Vercel, para ela entrar na lista de CORS da API.

Observação: o plano gratuito do Render coloca o serviço para dormir depois de um tempo sem uso, e a primeira requisição pode demorar. O front espera até 60 segundos antes de mostrar erro de conexão (`TEMPO_LIMITE_MS` em `src/api/config.ts`).

## Pendências conhecidas

- **Recuperação de senha e login com Google.** Estavam no protótipo, mas foram removidos porque não há suporte no backend da 1ª entrega.
- **Pontos de regra para o grupo decidir.** Estão na seção 5 do [contrato da API](docs/CONTRATO_API.md).
- **Navegação por estado, sem URLs próprias.** Herdada do protótipo. Uma evolução possível é adotar React Router para cada tela ter sua URL.
- **Nome da marca.** O protótipo usa "Saúde Fácil" nas telas de entrada e "Saúde na Palma da Mão" no restante. Vale o grupo padronizar.

## Equipe

Arthur Andrey, Gabriel Roberto, Ibson Gomes, Jean Phillip, João Victor Santino e Layza Maria. Turma 2025.32.185, Faculdade Senac Pernambuco.
