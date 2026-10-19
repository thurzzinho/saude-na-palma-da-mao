import { useState } from 'react'
import { useParams } from 'react-router'
import { mensagemDeErro } from '@/api/erros'
import { agendamentos, clinicas } from '@/api/servicos'
import { Ficha } from '@/componentes/Ficha'
import { Icone } from '@/componentes/Icone'
import { Aviso, Botao, BotaoLink, Cabecalho, Carregando, Dialogo, ErroCarregar, Secao } from '@/componentes/ui'
import { baixarLembrete, compartilharConsulta, urlMapa, urlTelefone } from '@/utils/acoes'
import { dataPorExtenso, ehFuturo, hora, partes, prazoCancelamento } from '@/utils/datas'
import { telefoneLegivel } from '@/utils/formatos'
import { useCarregar } from '@/utils/useCarregar'
import { ehAtiva } from './comum'

export function DetalheConsulta() {
  const id = Number(useParams().id)
  const { dados, carregando, erro, recarregar, setDados } = useCarregar(async () => {
    const consulta = await agendamentos.obter(id)
    // A clínica traz telefone e horário de funcionamento, que o agendamento não traz.
    const clinica = await clinicas.obter(consulta.clinica.idClinica).catch(() => null)
    return { consulta, clinica }
  }, [id])
  const [confirmando, setConfirmando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [cancelando, setCancelando] = useState(false)
  const [erroCancelar, setErroCancelar] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  if (carregando && !dados) return <Carregando texto="Abrindo a consulta…" />
  if (erro || !dados) return (
    <>
      <Cabecalho titulo="Consulta" voltar={{ para: '/consultas', texto: 'Minhas consultas' }} />
      <ErroCarregar mensagem={erro ?? 'Consulta não encontrada.'} tentarDeNovo={recarregar} />
    </>
  )

  const { consulta, clinica } = dados
  const ativa = ehAtiva(consulta) && ehFuturo(consulta.dataHora)
  const prazo = prazoCancelamento(consulta.dataHora)
  const dentroDoPrazo = Date.now() < prazo.getTime()
  const p = partes(prazo)
  const telefone = urlTelefone(clinica?.telefone)

  async function cancelar() {
    setCancelando(true)
    setErroCancelar(null)
    try {
      const atualizada = await agendamentos.cancelar(consulta.idAgendamento, motivo.trim())
      setDados({ consulta: atualizada, clinica })
      setConfirmando(false)
      setAviso('Consulta cancelada. O horário ficou livre para outra pessoa.')
    } catch (e) {
      setErroCancelar(mensagemDeErro(e))
    } finally {
      setCancelando(false)
    }
  }

  return (
    <>
      <Cabecalho titulo={`Consulta de ${consulta.especialidade.nome}`} voltar={{ para: '/consultas', texto: 'Minhas consultas' }} />

      {aviso && <Aviso tipo="sucesso" className="mb-5">{aviso}</Aviso>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <Ficha consulta={consulta} />

          <ul className="mt-4 divide-y divide-linha rounded-2xl border border-linha bg-white">
            <Linha icone="calendario" rotulo="Quando" valor={`${dataPorExtenso(consulta.dataHora, true)}, às ${hora(consulta.dataHora)}`} />
            <Linha icone="estetoscopio" rotulo="Profissional" valor={`${consulta.profissional.nome} (${consulta.profissional.registro})`} />
            <Linha icone="mapa" rotulo={consulta.clinica.nome} valor={consulta.clinica.endereco}>
              <a href={urlMapa(`${consulta.clinica.nome}, ${consulta.clinica.endereco}`)} target="_blank" rel="noopener noreferrer"
                className="mt-1 inline-flex min-h-11 items-center gap-1 font-bold text-azul underline underline-offset-4">Abrir no mapa</a>
            </Linha>
            {clinica?.telefone && (
              <Linha icone="telefone" rotulo="Telefone da clínica" valor={telefoneLegivel(clinica.telefone)}>
                <a href={telefone} className="mt-1 inline-flex min-h-11 items-center gap-1 font-bold text-azul underline underline-offset-4">Ligar</a>
              </Linha>
            )}
            {clinica?.horarioFuncionamento && <Linha icone="relogio" rotulo="Funcionamento" valor={clinica.horarioFuncionamento} />}
            {consulta.observacao && <Linha icone="info" rotulo="O que você contou ao médico" valor={consulta.observacao} />}
            {consulta.status === 'CANCELADO' && (
              <Linha icone="fechar" rotulo="Cancelada" valor={consulta.canceladoEm ? `Em ${dataPorExtenso(consulta.canceladoEm)}${consulta.motivoCancelamento ? `. Motivo: ${consulta.motivoCancelamento}` : ''}` : 'Sim'} />
            )}
          </ul>
        </div>

        {ativa && (
          <aside className="flex flex-col gap-2">
            <h2 className="sr-only">Ações</h2>
            <Botao icone="sino" onClick={() => baixarLembrete(consulta)}>Pôr lembrete no celular</Botao>
            <Botao variante="secundario" icone="compartilhar" onClick={() => compartilharConsulta(consulta)}>Avisar um familiar</Botao>
            <BotaoLink para={urlMapa(`${consulta.clinica.nome}, ${consulta.clinica.endereco}`)} variante="secundario" icone="mapa">Como chegar</BotaoLink>
          </aside>
        )}
      </div>

      {ativa && (
        <Secao titulo="Não vai poder ir?">
          {dentroDoPrazo ? (
            <div className="rounded-2xl border border-linha bg-white p-5">
              <p>Você pode cancelar pelo app até <strong>{p.diaSemana}, {p.dia} de {p.mesNome}, às {p.hora}</strong>. Assim o horário fica livre para outra pessoa.</p>
              <p className="mt-1 text-tinta-suave">Não existe remarcação: depois de cancelar, é só marcar de novo no dia que preferir.</p>
              <Botao variante="perigo" icone="fechar" className="mt-4" onClick={() => setConfirmando(true)}>Cancelar esta consulta</Botao>
            </div>
          ) : (
            <Aviso tipo="alerta" titulo="O prazo para cancelar pelo app terminou"
              acao={telefone && <BotaoLink para={telefone} tamanho="medio" icone="telefone">Ligar para a clínica</BotaoLink>}>
              Faltam menos de 8 horas para a consulta. Para desmarcar agora, ligue para a clínica.
            </Aviso>
          )}
        </Secao>
      )}

      <Dialogo aberto={confirmando} aoFechar={() => setConfirmando(false)} titulo="Cancelar a consulta?"
        acoes={<>
          <Botao variante="secundario" onClick={() => setConfirmando(false)} disabled={cancelando}>Não, manter consulta</Botao>
          <Botao variante="perigo" onClick={cancelar} carregando={cancelando}>Sim, cancelar</Botao>
        </>}>
        <p>
          {consulta.especialidade.nome} com {consulta.profissional.nome}, {dataPorExtenso(consulta.dataHora)}, às {hora(consulta.dataHora)}.
        </p>
        <label className="block">
          <span className="font-bold">Quer dizer o motivo?</span> <span className="text-tinta-suave">(opcional)</span>
          <textarea className="campo mt-1.5 min-h-[5rem]" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={255} />
        </label>
        {erroCancelar && <Aviso tipo="erro">{erroCancelar}</Aviso>}
      </Dialogo>
    </>
  )
}

function Linha({ icone, rotulo, valor, children }: { icone: string; rotulo: string; valor: string; children?: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 p-4">
      <Icone nome={icone} className="mt-0.5 text-agua" />
      <span className="min-w-0">
        <span className="block text-[0.92rem] text-tinta-suave">{rotulo}</span>
        <span className="block font-bold break-words">{valor}</span>
        {children}
      </span>
    </li>
  )
}
