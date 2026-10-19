import { useState } from 'react'
import { agendamentos } from '@/api/servicos'
import { Ficha } from '@/componentes/Ficha'
import { Abas, BotaoLink, Cabecalho, Carregando, ErroCarregar, Vazio } from '@/componentes/ui'
import { useCarregar } from '@/utils/useCarregar'
import { LIMITE_CONSULTAS, separarConsultas } from './comum'

export function Consultas() {
  const { dados, carregando, erro, recarregar } = useCarregar(() => agendamentos.meus())
  const [aba, setAba] = useState<'proximas' | 'anteriores'>('proximas')
  const { proximas, anteriores } = separarConsultas(dados ?? [])
  const lista = aba === 'proximas' ? proximas : anteriores

  return (
    <>
      <Cabecalho titulo="Minhas consultas"
        subtitulo={dados ? `Você tem ${proximas.length} de ${LIMITE_CONSULTAS} consultas marcadas.` : undefined}
        acoes={proximas.length < LIMITE_CONSULTAS && <BotaoLink para="/agendar" tamanho="medio" icone="calendarioMais">Marcar consulta</BotaoLink>} />

      <Abas rotulo="Filtrar consultas" valor={aba} aoMudar={setAba} opcoes={[
        { valor: 'proximas', texto: 'Marcadas', total: dados ? proximas.length : undefined },
        { valor: 'anteriores', texto: 'Anteriores', total: dados ? anteriores.length : undefined },
      ]} />

      <div className="mt-5">
        {carregando && !dados ? <Carregando texto="Buscando suas consultas…" /> : erro ? (
          <ErroCarregar mensagem={erro} tentarDeNovo={recarregar} />
        ) : lista.length === 0 ? (
          aba === 'proximas' ? (
            <Vazio titulo="Nenhuma consulta marcada" acao={<BotaoLink para="/agendar" icone="calendarioMais">Marcar consulta</BotaoLink>}>
              Os horários livres aparecem na hora, sem precisar ligar.
            </Vazio>
          ) : (
            <Vazio icone="consultas" titulo="Ainda não há consultas anteriores">
              Consultas realizadas e canceladas aparecem aqui.
            </Vazio>
          )
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {lista.map((a) => (
              <li key={a.idAgendamento}><Ficha consulta={a} para={`/consultas/${a.idAgendamento}`} /></li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
