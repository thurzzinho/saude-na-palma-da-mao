# Decisões de design

Este documento liga cada decisão do front a um dado. As fontes são três:

1. **Questionário da equipe**: 18 respostas, coletadas de 28/09 a 01/10/2026, com termo de consentimento. 16 pessoas tinham 60 anos ou mais (8 de 60 a 69 e 8 com 70 ou mais). Nas perguntas de múltipla escolha cada pessoa podia marcar até três opções, então as somas passam de 18. A amostra é pequena e por conveniência: os números indicam direção, não representam a população.
2. **Protótipo do Figma Make** do grupo, usado como base visual.
3. **Regras de negócio v3** e a API do repositório `saude-palma-mao-api`.

As personas Maria José (68 anos) e Seu Antônio (74 anos) são fictícias, construídas a partir das respostas. Quando uma decisão se apoia só na persona, isso está indicado.

## Achados do questionário e o que mudou na interface

| Achado | Resposta no front |
|---|---|
| Ver horários livres na hora foi o recurso mais pedido (14 de 18) | "Marcar consulta" é a ação principal do Início. Na etapa de horário, o app procura sozinho o primeiro dia com vaga e mostra só horários livres, agrupados em manhã e tarde. Dias sem vaga aparecem como "sem vaga", não somem |
| Letra pequena (10 de 18) e "letra maior e tela simples" (7 de 18) | Texto base de 18 px. Botão "Letra" sempre visível, com três tamanhos (18, 20 e 22 px de base). Todo o layout usa `rem`, então botões e espaços crescem junto. Fonte Atkinson Hyperlegible, criada pelo Braille Institute para leitores com baixa visão |
| Muitas etapas até concluir (10 de 18) | Agendamento em 4 etapas com uma pergunta por tela e indicação "Etapa 2 de 4". Nada é gravado antes da revisão. Uma única tela de entrada serve para os três perfis |
| Medo de errar ou apertar algo errado (9 de 18) | Tela de revisão antes de confirmar, com "Alterar" em cada item. Cancelar consulta, sair da conta e ações administrativas pedem confirmação. Todo botão tem texto, nunca só ícone |
| Botões pequenos (7 de 18) | Botões principais com no mínimo 58 px de altura e campos com 54 px no tamanho normal, acima dos 44 px do critério 2.5.5 da WCAG 2.2 |
| Lembrar senha (6 de 18) | A sessão fica guardada no aparelho até o token expirar. Botão "Mostrar" na senha. Login aceita CPF ou e-mail no mesmo campo, com máscara automática quando a pessoa digita números. A senha pede só 8 caracteres, sem símbolo, como a API já define |
| Lembrete antes da consulta (10 de 18) e esquecimento (8 de 18) | "Pôr lembrete no celular" gera um arquivo de calendário (.ics, padrão RFC 5545) com alarmes na véspera e duas horas antes. Funciona sem servidor de notificação |
| Ver o endereço e como chegar (9 de 18) | A consulta e a lista de clínicas têm "Como chegar" (Google Maps) e "Ligar" para a clínica, com horário de funcionamento |
| Cancelar pelo celular sem precisar ligar (7 de 18) | Cancelamento no detalhe da consulta, mostrando a data e hora limite exatas (8 horas antes). Passado o prazo, o app mostra o telefone da clínica em vez de um erro |
| Dependem de outra pessoa para marcar (7 de 18) e "um familiar poder marcar por mim" (6 de 18) | "Avisar um familiar" envia os dados da consulta pelo menu de compartilhar do celular ou pelo WhatsApp. Um perfil de familiar ou cuidador não existe na API e fica como sugestão para a 2ª entrega |
| Nem sempre sabem qual médico procurar (8 de 18) | "Não sei qual médico procurar": uma pergunta em linguagem do dia a dia leva a uma sugestão de especialidade, com o motivo, o aviso de que é só uma sugestão e a opção de escolher outra. Há um aviso de emergência com o 192 (SAMU) |
| Receio de informar CPF e telefone (16 de 18 marcaram 4 ou 5 numa escala de 1 a 5) | No cadastro, um quadro explica por que o CPF é pedido e quem o vê. Nas telas o CPF aparece escondido (`***.982.247-**`) e só é mostrado quando a pessoa pede. Telefone é opcional |
| Desistência é comum (14 de 18 já desistiram ou esqueceram) | O Início mostra a próxima consulta como uma "ficha", com dia e hora grandes, e o contador "1 marcada de 5 possíveis" |

Ponto de atenção da própria pesquisa: nas respostas abertas, a dor mais citada foi falta de vaga e demora. O app melhora o processo de marcar, mas não cria vagas. Isso deve aparecer na apresentação como limitação.

## O que veio do Figma e o que mudou

**Mantido como base:** azul-marinho como cor principal, verde-água do logotipo, ilustração da tela de entrada, Nunito nos títulos, cantos arredondados, agendamento em 4 etapas com tela de revisão, separação de áreas por perfil, slogan e textos de boas-vindas da marca.

**Mudou:**

| No protótipo | Agora | Motivo |
|---|---|---|
| Moldura de celular fixa de 390 px também no computador | Layout responsivo de verdade: menu inferior no celular e menu lateral no computador | O app precisa funcionar como site e como PWA |
| Nome misturado: "Saúde Fácil" na entrada e "Saúde na Palma da Mão" no início, carteirinha e rodapé | "Saúde Fácil" em todas as telas, no título da página, no manifest e no logotipo | Pedido do grupo |
| Carteirinha de plano de saúde, número de carteirinha e plano "Amil 500" | Removidos | Não existem no banco nem na API; eram dados inventados |
| "Entrar com Google" e "Esqueci minha senha" | Removidos | A API não tem essas rotas. Um botão que não funciona aumenta o medo de errar |
| "Confirmaremos por e-mail e SMS" | Removido | Não existe envio de e-mail ou SMS. No lugar, o lembrete no calendário do celular |
| Pré-triagem por chat com Pediatria e Psiquiatria | Uma pergunta só, ligada às especialidades que existem no banco | As especialidades do protótipo não estão no cadastro; o chat completo com IA é da 2ª entrega |
| Textos de 11 a 13 px em rótulos e atalhos | Nenhum texto abaixo de 16 px, com uma exceção: os rótulos do menu inferior usam 15 px em telas menores que 360 px, para "Consultas" caber inteiro | Letra pequena foi a principal barreira |
| Carrosséis com "deslize e explore" | Conteúdo sempre visível, sem rolagem lateral | Conteúdo escondido de lado é fácil de não ver |
| Portais de login separados para paciente, profissional e administrador | Uma entrada só | A API já identifica o perfil no login; menos telas |
| Data fixa em setembro e horários simulados | Datas e horários reais da API, no fuso do Recife | Integração |

## Identidade visual

| Elemento | Valor |
|---|---|
| Azul (principal) | `#17375E`, e `#0F2742` no menu lateral |
| Verde-água (confirmar, ícones de apoio) | `#0B7468` para texto e `#2EC4B6` no logotipo |
| Amarelo-sol (destaque) | `#F5B921`, usado só no item ativo do menu, no horário escolhido e no canhoto da ficha |
| Fundo | `#F2F5F8` |
| Texto | `#13202F`, e `#475569` no texto de apoio |
| Erro | `#B42318` |

A "ficha" da consulta lembra a ficha de papel que a pessoa recebe na recepção, com o canhoto amarelo destacado. É o único elemento decorativo do app; o resto é deliberadamente simples.

## Referências

- Braille Institute, Atkinson Hyperlegible: https://www.brailleinstitute.org/freefont/ (resumo em https://en.wikipedia.org/wiki/Atkinson_Hyperlegible)
- W3C, WCAG 2.2, Understanding SC 2.5.5 Target Size (Enhanced): https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html
- IETF, RFC 5545, iCalendar: https://www.rfc-editor.org/rfc/rfc5545
- Google, Maps URLs: https://developers.google.com/maps/documentation/urls/get-started
- MDN, Navigator.share (Web Share API): https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- Lei nº 13.709/2018 (LGPD): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- Render, Deploy for Free (hibernação após 15 minutos): https://render.com/docs/free
