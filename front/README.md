# Saúde Fácil, front-end (PWA)

Aplicativo web do **Saúde Fácil**, solução do Projeto Integrador "Saúde na Palma da Mão" (ADS, Faculdade Senac Pernambuco, 2026.2). Pacientes marcam, acompanham e cancelam consultas no polo médico do Recife; profissionais abrem horários e confirmam atendimentos; a administração mantém clínicas, profissionais e especialidades.

Esta versão substitui o front anterior, que era praticamente uma cópia do protótipo do Figma Make e usava um contrato de API diferente do que a API do grupo implementa. Agora o front fala com a API real (`saude-palma-mao-api`), funciona como site e como app instalado (PWA) e segue as decisões tiradas do questionário com usuários.

- Decisões de design e de onde cada uma vem: [`docs/DECISOES.md`](docs/DECISOES.md)
- Rotas usadas, testes de integração e pendências para o back-end: [`docs/INTEGRACAO.md`](docs/INTEGRACAO.md)

## Tecnologias

- React 19, TypeScript e Vite 8
- Tailwind CSS 4
- React Router 7
- Fontes Atkinson Hyperlegible e Nunito servidas pelo próprio app (`@fontsource`), para funcionar offline
- PWA com `manifest.webmanifest` e service worker próprio (`public/sw.js`)
- Deploy na Vercel (`vercel.json` já configurado)

## Como rodar

Requisitos: Node.js 22 ou superior e pnpm 10.

```bash
pnpm install
cp .env.example .env      # ajuste VITE_API_URL se precisar
pnpm dev                  # http://localhost:5173
```

Outros comandos:

| Comando | Para que serve |
|---|---|
| `pnpm build` | Confere os tipos e gera a versão de produção em `dist/` |
| `pnpm preview` | Serve a versão de produção em `http://localhost:4173` (o service worker só funciona aqui, não no `dev`) |
| `pnpm verificar-tipos` | Só a checagem do TypeScript |

### Variável de ambiente

| Variável | Valor |
|---|---|
| `VITE_API_URL` | Endereço da API, sem barra no final. Padrão: `https://saude-palma-mao-api.onrender.com`. Para a API local: `http://localhost:3000` |

## Integração com a API: o que precisa estar configurado

1. **CORS no Render.** A API só aceita as origens listadas em `ORIGENS_PERMITIDAS`. Inclua o domínio da Vercel e o endereço local, separados por vírgula. Exemplo, trocando pelo domínio real do projeto na Vercel:
   `ORIGENS_PERMITIDAS=https://SEU-PROJETO.vercel.app,http://localhost:5173,http://localhost:4173`
   Sem isso o navegador bloqueia as chamadas e o app mostra "Não foi possível falar com o servidor".
2. **Variável na Vercel.** Em Project Settings, Environment Variables, crie `VITE_API_URL` com o endereço da API.
3. **Servidor dormindo.** No plano gratuito do Render a API hiberna depois de 15 minutos sem uso. Quando uma chamada passa de 6 segundos, o app mostra o aviso "Conectando ao servidor" em vez de parecer travado. Antes de apresentar, abra `/saude` da API.

## Contas de teste

As mesmas do Swagger da API (`/docs`), criadas pelo seed do banco. O paciente de teste precisa ser cadastrado uma vez pela tela "Criar minha conta" ou pela rota `POST /autenticacao/cadastro`.

| Perfil | Entrar com | Senha |
|---|---|---|
| Paciente | CPF `529.982.247-25` | `senhaSegura123` |
| Profissional | `carlos.lima@exemplo.test` | `senha123456` |
| Administração | `admin@exemplo.test` | `senha123456` |

Todos entram pela mesma tela. O app descobre o perfil pela resposta do login e abre a área certa.

## Estrutura

```
src/
  api/            config, cliente HTTP, mensagens de erro, tipos e uma função por rota da API
  contexto/       sessão (token JWT) e preferências (tamanho da letra)
  componentes/    layout responsivo, ficha da consulta, botões, campos, avisos, diálogo
  telas/
    publico/      entrada (login) e cadastro
    paciente/     início, agendar, ajuda para escolher, consultas, detalhe, clínicas, perfil
    profissional/ agenda e horários de atendimento
    admin/        painel, consultas, clínicas, profissionais, especialidades, pacientes
  utils/          datas no fuso do Recife, máscaras, lembrete .ics, mapa e compartilhamento
public/           manifest, service worker, ícones e imagens
```

## Telas por perfil

| Perfil | Telas |
|---|---|
| Paciente | Início, Marcar consulta (4 etapas), Ajuda para escolher o médico, Minhas consultas, Detalhe com cancelamento, Clínicas e endereços, Perfil |
| Profissional | Minha agenda (confirmar e marcar como realizada), Horários de atendimento (abrir e fechar períodos), Conta |
| Administração | Painel, Consultas (com cancelamento), Clínicas, Profissionais, Especialidades, Pacientes, Conta |

## Layout no celular e no computador

- Até 1023 px: barra superior com o botão de tamanho da letra e menu inferior fixo, respeitando a área segura do iPhone.
- A partir de 1024 px: menu lateral fixo e conteúdo com largura máxima de leitura. Não existe mais a "moldura de celular" do protótipo; no computador o app ocupa a tela como um site.
- As telas foram conferidas sem rolagem horizontal em 320, 375, 768 e 1280 px, e com a letra no tamanho "muito grande" (ver `docs/INTEGRACAO.md`).

## Testes

`testes/ponta-a-ponta.py` percorre os fluxos dos três perfis contra a API local e confere o layout em várias larguras. As instruções estão no começo do arquivo e o resultado da última execução está em [`docs/INTEGRACAO.md`](docs/INTEGRACAO.md).

## Equipe

Arthur Andrey, Ibson Gomes, Gabriel Roberto, Jean Phillip, João Santino e Layza Maria.
