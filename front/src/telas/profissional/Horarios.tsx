import { useMemo, useState, type FormEvent } from 'react'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import { disponibilidades, vinculos } from '@/api/servicos'
import type { Janela } from '@/api/tipos'
import { Icone } from '@/componentes/Icone'
import { Aviso, Botao, Cabecalho, Campo, Carregando, Dialogo, ErroCarregar, Secao, Vazio } from '@/componentes/ui'
import { useSessao } from '@/contexto/Sessao'
import { dataPorExtenso, hojeRecife, somarDias } from '@/utils/datas'
import { plural } from '@/utils/formatos'
import { useCarregar } from '@/utils/useCarregar'

const minutos = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5))
const paraHora = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** Mesmo cálculo da API: horários contíguos, sobra descartada (regras v3, seção 1). */
function horariosGerados(inicio: string, fim: string, duracao: number) {
  if (!inicio || !fim || minutos(fim) <= minutos(inicio)) return []
  const lista: string[] = []
  for (let m = minutos(inicio); m + duracao <= minutos(fim); m += duracao) lista.push(paraHora(m))
  return lista
}

export default function Horarios() {
  const { usuario } = useSessao()
  const hoje = hojeRecife()
  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const [todos, janelas] = await Promise.all([
      vinculos.buscar(),
      disponibilidades.janelas({ de: hoje, ate: somarDias(hoje, 90) }),
    ])
    // A busca devolve todos os vínculos; aqui ficam só os do profissional logado.
    const meus = todos.filter((v) => v.idProfissional === usuario?.idProfissional)
    return { meus, janelas }
  }, [usuario?.idProfissional])

  const [mostrarFechados, setMostrarFechados] = useState(false)
  const [diasVisiveis, setDiasVisiveis] = useState(7)
  const [fechando, setFechando] = useState<Janela | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erroFechar, setErroFechar] = useState<string | null>(null)

  const janelas = (dados?.janelas ?? []).filter((j) => mostrarFechados || j.ativo)
  const porDia = useMemo(() => {
    const m = new Map<string, Janela[]>()
    janelas.forEach((j) => m.set(j.dataAtendimento, [...(m.get(j.dataAtendimento) ?? []), j]))
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [janelas])

  async function fechar() {
    if (!fechando) return
    setSalvando(true)
    setErroFechar(null)
    try {
      await disponibilidades.desativar(fechando.idDisponibilidade)
      setFechando(null)
      recarregar()
    } catch (e) {
      setErroFechar(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <Cabecalho titulo="Meus horários de atendimento" subtitulo="Os pacientes só conseguem marcar nos horários que você abrir aqui." />

      {carregando && !dados ? <Carregando /> : erro || !dados ? <ErroCarregar mensagem={erro ?? ''} tentarDeNovo={recarregar} /> : (
        <>
          {dados.meus.length === 0 ? (
            <Aviso tipo="alerta" titulo="Você ainda não está ligado a nenhuma clínica">
              Peça à administração para cadastrar a clínica e a especialidade em que você atende.
            </Aviso>
          ) : (
            <NovoPeriodo locais={dados.meus.map((v) => ({ id: v.idProfissionalClinica, nome: v.clinica.nome }))} aoCriar={recarregar} />
          )}

          <Secao titulo="Períodos abertos" acao={
            <label className="flex min-h-11 items-center gap-2 font-bold">
              <input type="checkbox" className="h-5 w-5 accent-azul" checked={mostrarFechados} onChange={(e) => setMostrarFechados(e.target.checked)} />
              Mostrar fechados
            </label>
          }>
            {porDia.length === 0 ? (
              <Vazio icone="relogio" titulo="Nenhum período aberto">Abra um período acima para os pacientes verem seus horários.</Vazio>
            ) : (
              <div className="flex flex-col gap-6">
                {porDia.slice(0, diasVisiveis).map(([dia, lista]) => (
                  <div key={dia}>
                    <h3 className="mb-2 font-bold first-letter:uppercase">{dataPorExtenso(dia)}</h3>
                    <ul className="flex flex-col gap-2">
                      {lista.map((j) => (
                        <li key={j.idDisponibilidade} className={`flex flex-wrap items-center gap-3 rounded-2xl border border-linha bg-white p-4 ${j.ativo ? '' : 'opacity-70'}`}>
                          <div className="min-w-0 flex-1">
                            <p className="font-titulo text-[1.3rem] font-black text-azul-escuro">{j.horaInicio} às {j.horaFim}</p>
                            <p className="text-tinta-suave">{j.clinica}, consultas de {j.duracaoMinutos} minutos</p>
                            <p className={j.agendamentosAtivos ? 'font-bold text-agua' : 'text-tinta-suave'}>
                              {j.ativo ? (j.agendamentosAtivos ? `${plural(j.agendamentosAtivos, 'consulta marcada', 'consultas marcadas')}` : 'Nenhuma consulta marcada ainda') : 'Fechado'}
                            </p>
                          </div>
                          {j.ativo && (
                            <Botao tamanho="medio" variante="secundario" icone="fechar" onClick={() => setFechando(j)}>Fechar período</Botao>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {porDia.length > diasVisiveis && (
                  <Botao variante="secundario" icone="avancar" onClick={() => setDiasVisiveis((n) => n + 7)}>
                    Mostrar mais dias ({porDia.length - diasVisiveis} restantes)
                  </Botao>
                )}
              </div>
            )}
          </Secao>
        </>
      )}

      <Dialogo aberto={!!fechando} aoFechar={() => { setFechando(null); setErroFechar(null) }} titulo="Fechar este período?"
        acoes={<>
          <Botao variante="secundario" onClick={() => setFechando(null)} disabled={salvando}>Voltar</Botao>
          <Botao variante="perigo" onClick={fechar} carregando={salvando} disabled={!!fechando?.agendamentosAtivos}>Fechar período</Botao>
        </>}>
        {fechando && (
          <>
            <p>{dataPorExtenso(fechando.dataAtendimento)}, das {fechando.horaInicio} às {fechando.horaFim}, em {fechando.clinica}.</p>
            {fechando.agendamentosAtivos > 0 ? (
              <Aviso tipo="alerta">
                Há {plural(fechando.agendamentosAtivos, 'consulta marcada', 'consultas marcadas')} neste período. Peça à administração para cancelá-las antes de fechar.
              </Aviso>
            ) : <p className="text-tinta-suave">Os horários livres deixam de aparecer para os pacientes na hora.</p>}
          </>
        )}
        {erroFechar && <Aviso tipo="erro">{erroFechar}</Aviso>}
      </Dialogo>
    </>
  )
}

function NovoPeriodo({ locais, aoCriar }: { locais: { id: number; nome: string }[]; aoCriar: () => void }) {
  const hoje = hojeRecife()
  const [local, setLocal] = useState(String(locais[0]?.id ?? ''))
  const [dia, setDia] = useState(somarDias(hoje, 1))
  const [inicio, setInicio] = useState('08:00')
  const [fim, setFim] = useState('12:00')
  const [duracao, setDuracao] = useState(30)
  const [semanas, setSemanas] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: string[]; falhas: { dia: string; motivo: string }[] } | null>(null)

  const previa = horariosGerados(inicio, fim, duracao)
  const dias = Array.from({ length: semanas }, (_, i) => somarDias(dia, i * 7))

  async function criar(e: FormEvent) {
    e.preventDefault()
    if (!previa.length) return
    setSalvando(true)
    setResultado(null)
    const ok: string[] = []
    const falhas: { dia: string; motivo: string }[] = []
    // Uma requisição por dia: a API cadastra uma janela por vez.
    for (const d of dias) {
      try {
        await disponibilidades.criar({ idProfissionalClinica: Number(local), dataAtendimento: d, horaInicio: inicio, horaFim: fim, duracaoMinutos: duracao })
        ok.push(d)
      } catch (err) {
        falhas.push({ dia: d, motivo: err instanceof ErroApi ? err.message : mensagemDeErro(err) })
      }
    }
    setResultado({ ok, falhas })
    setSalvando(false)
    if (ok.length) aoCriar()
  }

  return (
    <form onSubmit={criar} className="rounded-2xl border-2 border-azul/20 bg-white p-5">
      <h2 className="font-titulo text-[1.3rem] font-extrabold text-azul-escuro">Abrir horários</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {locais.length > 1 && (
          <Campo rotulo="Clínica">{(p) => (
            <select {...p} className="campo" value={local} onChange={(e) => setLocal(e.target.value)}>
              {locais.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          )}</Campo>
        )}
        <Campo rotulo="Dia">{(p) => <input {...p} type="date" className="campo" min={hoje} value={dia} onChange={(e) => e.target.value && setDia(e.target.value)} />}</Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Das">{(p) => <input {...p} type="time" className="campo" step={300} value={inicio} onChange={(e) => setInicio(e.target.value)} />}</Campo>
          <Campo rotulo="Até">{(p) => <input {...p} type="time" className="campo" step={300} value={fim} onChange={(e) => setFim(e.target.value)} />}</Campo>
        </div>
        <Campo rotulo="Duração de cada consulta">{(p) => (
          <select {...p} className="campo" value={duracao} onChange={(e) => setDuracao(Number(e.target.value))}>
            {[15, 20, 30, 40, 45, 60].map((m) => <option key={m} value={m}>{m} minutos</option>)}
          </select>
        )}</Campo>
        <Campo rotulo="Repetir">{(p) => (
          <select {...p} className="campo" value={semanas} onChange={(e) => setSemanas(Number(e.target.value))}>
            <option value={1}>Só neste dia</option>
            {[2, 3, 4, 6, 8].map((n) => <option key={n} value={n}>No mesmo dia da semana, por {n} semanas</option>)}
          </select>
        )}</Campo>
      </div>

      <div className="mt-4 rounded-xl bg-papel p-4" aria-live="polite">
        {previa.length ? (
          <>
            <p className="font-bold">{plural(previa.length, 'horário', 'horários')} por dia{semanas > 1 ? `, em ${semanas} dias` : ''}:</p>
            <p className="mt-1 text-tinta-suave">{previa.join(', ')}</p>
          </>
        ) : <p className="font-bold text-perigo">O horário final precisa ser depois do inicial e caber pelo menos uma consulta.</p>}
      </div>

      {resultado && (
        <div className="mt-4 flex flex-col gap-2">
          {resultado.ok.length > 0 && <Aviso tipo="sucesso">Horários abertos em {resultado.ok.map((d) => dataPorExtenso(d)).join('; ')}.</Aviso>}
          {resultado.falhas.map((f) => (
            <Aviso key={f.dia} tipo="erro"><strong className="first-letter:uppercase">{dataPorExtenso(f.dia)}:</strong> {f.motivo}</Aviso>
          ))}
        </div>
      )}

      <Botao type="submit" className="mt-4" icone="mais" carregando={salvando} disabled={!previa.length || !local}>
        {salvando ? 'Abrindo horários…' : 'Abrir horários'}
      </Botao>
      <p className="mt-3 flex items-start gap-2 text-[0.95rem] text-tinta-suave">
        <Icone nome="info" className="mt-0.5" /> Os pacientes podem marcar com pelo menos 24 horas de antecedência e até 60 dias à frente.
      </p>
    </form>
  )
}
