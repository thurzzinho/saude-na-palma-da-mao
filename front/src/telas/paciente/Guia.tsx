import { useState } from 'react'
import { especialidades } from '@/api/servicos'
import type { Especialidade } from '@/api/tipos'
import { Icone } from '@/componentes/Icone'
import { Aviso, BotaoLink, Cabecalho, Carregando, ErroCarregar } from '@/componentes/ui'
import { normalizar } from '@/utils/formatos'
import { useCarregar } from '@/utils/useCarregar'

// Ajuda para escolher a especialidade (pré-triagem da 1ª entrega).
//
// Na pesquisa, 8 de 18 participantes disseram que nem sempre sabem qual
// médico procurar. Ao mesmo tempo, a persona Seu Antônio (construída a partir
// das respostas) desconfia de um app que "diz qual médico procurar" e tem
// dificuldade com palavras técnicas. Por isso a ajuda é uma pergunta só, em
// linguagem do dia a dia, mostra o motivo da sugestão, avisa que é só uma
// sugestão e sempre deixa escolher outra. A IA de pré-triagem fica para a
// 2ª entrega, como previsto no cronograma do grupo.

interface Opcao {
  icone: string
  titulo: string
  exemplos: string
  especialidade: string // nome como está no banco, comparado sem acento
}

const OPCOES: Opcao[] = [
  { icone: 'coracao', titulo: 'Coração ou pressão alta', exemplos: 'Palpitação, pressão alta, cansaço ao fazer esforço', especialidade: 'Cardiologia' },
  { icone: 'osso', titulo: 'Ossos, juntas ou costas', exemplos: 'Dor no joelho, no ombro, na coluna, depois de uma queda', especialidade: 'Ortopedia' },
  { icone: 'pele', titulo: 'Pele, cabelo ou unhas', exemplos: 'Manchas, coceira, ferida que não sara', especialidade: 'Dermatologia' },
  { icone: 'olhoSaude', titulo: 'Olhos e visão', exemplos: 'Vista embaçada, óculos, catarata', especialidade: 'Oftalmologia' },
  { icone: 'gota', titulo: 'Diabetes, tireoide ou hormônios', exemplos: 'Açúcar no sangue, tireoide, controle de peso', especialidade: 'Endocrinologia' },
  { icone: 'mulher', titulo: 'Saúde da mulher', exemplos: 'Exame preventivo, menopausa', especialidade: 'Ginecologia' },
  { icone: 'bengala', titulo: 'Acompanhamento da pessoa idosa', exemplos: 'Muitos remédios, memória, quedas, cuidado geral', especialidade: 'Geriatria' },
  { icone: 'duvida', titulo: 'Não sei ou é outra coisa', exemplos: 'Uma primeira avaliação, que encaminha se precisar', especialidade: 'Clinica Geral' },
]

export function Guia() {
  const { dados, carregando, erro, recarregar } = useCarregar(() => especialidades.listar())
  const [escolha, setEscolha] = useState<Opcao | null>(null)

  const achar = (nome: string) => dados?.find((e) => normalizar(e.nome) === normalizar(nome)) ?? null
  const sugerida: Especialidade | null = escolha ? achar(escolha.especialidade) ?? achar('Clinica Geral') : null
  // Mostra só as opções cuja especialidade existe no cadastro atual.
  const opcoes = dados ? OPCOES.filter((o) => achar(o.especialidade)) : []

  return (
    <>
      <Cabecalho titulo="Ajuda para escolher o médico" voltar={{ para: '/inicio', texto: 'Início' }}
        subtitulo="Responda uma pergunta e mostramos qual especialidade costuma cuidar disso." />

      <Aviso tipo="erro" titulo="É uma emergência?" className="mb-6">
        Dor forte no peito, falta de ar, fraqueza de um lado do corpo ou desmaio: não espere consulta.
        Ligue <a href="tel:192" className="font-bold underline underline-offset-4">192 (SAMU)</a> ou vá a uma emergência.
      </Aviso>

      {carregando && !dados ? <Carregando /> : erro ? <ErroCarregar mensagem={erro} tentarDeNovo={recarregar} /> : (
        <fieldset>
          <legend className="mb-3 font-titulo text-[1.4rem] font-extrabold">O que você quer cuidar?</legend>
          <ul className="grid gap-3 md:grid-cols-2">
            {opcoes.map((o) => {
              const sel = escolha?.titulo === o.titulo
              return (
                <li key={o.titulo}>
                  <button type="button" onClick={() => setEscolha(o)} aria-pressed={sel}
                    className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors ${sel ? 'border-azul bg-azul-claro' : 'border-linha bg-white hover:border-azul'}`}>
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${sel ? 'bg-azul text-white' : 'bg-agua-fundo text-agua'}`}>
                      <Icone nome={o.icone} tamanho={26} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold text-[1.1rem]">{o.titulo}</span>
                      <span className="block text-tinta-suave">{o.exemplos}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </fieldset>
      )}

      {escolha && sugerida && (
        <section aria-live="polite" className="mt-8 overflow-hidden rounded-2xl border-2 border-azul bg-white">
          <div className="sobre-escuro bg-azul p-5 text-white">
            <p className="text-white/85">Sugestão</p>
            <h2 className="font-titulo text-[1.8rem] font-black">{sugerida.nome}</h2>
            {sugerida.descricao && <p className="mt-1 text-white/90">{sugerida.descricao}</p>}
          </div>
          <div className="flex flex-col gap-4 p-5">
            <p><span className="text-tinta-suave">Por que esta sugestão:</span> você escolheu <strong>{escolha.titulo.toLowerCase()}</strong>.</p>
            <p className="flex items-start gap-2 rounded-xl bg-sol-fundo p-3 text-aviso">
              <Icone nome="info" className="mt-0.5" />
              É só uma ajuda para escolher. Quem avalia o seu caso é o médico, na consulta.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <BotaoLink para={`/agendar?especialidade=${sugerida.idEspecialidade}`} icone="calendarioMais" className="sm:flex-1">
                Marcar com {sugerida.nome}
              </BotaoLink>
              <BotaoLink para="/agendar" variante="secundario">Escolher outra</BotaoLink>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
