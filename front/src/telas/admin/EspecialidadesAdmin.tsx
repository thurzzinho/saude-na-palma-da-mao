import { useState, type FormEvent } from 'react'
import { mensagemDeErro } from '@/api/erros'
import { especialidades } from '@/api/servicos'
import type { Especialidade } from '@/api/tipos'
import { Aviso, Botao, Cabecalho, Campo, Carregando, Dialogo, ErroCarregar, Secao } from '@/componentes/ui'
import { useCarregar } from '@/utils/useCarregar'
import { EtiquetaAtivo } from './comum'

export default function EspecialidadesAdmin() {
  const { dados, carregando, erro, recarregar } = useCarregar(() => especialidades.listar(true))
  const [editando, setEditando] = useState<Especialidade | null>(null)
  const [alvo, setAlvo] = useState<Especialidade | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erroAcao, setErroAcao] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function alternar() {
    if (!alvo) return
    setSalvando(true)
    setErroAcao(null)
    try {
      if (alvo.ativo) await especialidades.desativar(alvo.idEspecialidade)
      else await especialidades.atualizar(alvo.idEspecialidade, { ativo: true })
      setAviso(`${alvo.nome} foi ${alvo.ativo ? 'desativada' : 'reativada'}.`)
      setAlvo(null)
      recarregar()
    } catch (e) {
      setErroAcao(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <Cabecalho titulo="Especialidades"
        subtitulo="A descrição aparece para o paciente na hora de escolher. Use palavras do dia a dia, sem termos técnicos." />

      <FormEspecialidade key={editando?.idEspecialidade ?? 'nova'} especialidade={editando}
        aoSalvar={(nome) => { setAviso(editando ? `${nome} foi atualizada.` : `${nome} foi cadastrada.`); setEditando(null); recarregar() }}
        aoCancelar={() => setEditando(null)} />

      {aviso && <Aviso tipo="sucesso" className="mt-5">{aviso}</Aviso>}

      <Secao titulo="Cadastradas">
        {carregando && !dados ? <Carregando /> : erro ? <ErroCarregar mensagem={erro} tentarDeNovo={recarregar} /> : (
          <ul className="divide-y divide-linha rounded-2xl border border-linha bg-white">
            {(dados ?? []).map((e) => (
              <li key={e.idEspecialidade} className="flex flex-wrap items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold">{e.nome} <EtiquetaAtivo ativo={e.ativo} /></p>
                  <p className="text-tinta-suave">{e.descricao || 'Sem descrição'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Botao variante="secundario" tamanho="medio" icone="editar" onClick={() => { setEditando(e); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Editar</Botao>
                  <Botao variante="secundario" tamanho="medio" onClick={() => { setAlvo(e); setErroAcao(null) }}>{e.ativo ? 'Desativar' : 'Reativar'}</Botao>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <Dialogo aberto={!!alvo} aoFechar={() => setAlvo(null)} titulo={alvo?.ativo ? 'Desativar especialidade?' : 'Reativar especialidade?'}
        acoes={<>
          <Botao variante="secundario" onClick={() => setAlvo(null)} disabled={salvando}>Voltar</Botao>
          <Botao variante={alvo?.ativo ? 'perigo' : 'confirmar'} onClick={alternar} carregando={salvando}>{alvo?.ativo ? 'Desativar' : 'Reativar'}</Botao>
        </>}>
        <p>{alvo?.ativo ? `${alvo?.nome} deixa de aparecer para os pacientes. Com consultas futuras marcadas, o sistema não deixa desativar.` : `${alvo?.nome} volta a aparecer para os pacientes.`}</p>
        {erroAcao && <Aviso tipo="erro">{erroAcao}</Aviso>}
      </Dialogo>
    </>
  )
}

function FormEspecialidade({ especialidade, aoSalvar, aoCancelar }: { especialidade: Especialidade | null; aoSalvar: (nome: string) => void; aoCancelar: () => void }) {
  const [nome, setNome] = useState(especialidade?.nome ?? '')
  const [descricao, setDescricao] = useState(especialidade?.descricao ?? '')
  const [erroNome, setErroNome] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (nome.trim().length < 3) {
      setErroNome('O nome precisa ter pelo menos 3 letras.')
      return
    }
    setErroNome(null)
    setSalvando(true)
    setErro(null)
    try {
      if (especialidade) await especialidades.atualizar(especialidade.idEspecialidade, { nome: nome.trim(), descricao: descricao.trim() || null })
      else await especialidades.criar({ nome: nome.trim(), descricao: descricao.trim() || null })
      aoSalvar(nome.trim())
    } catch (err) {
      setErro(mensagemDeErro(err))
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-4 rounded-2xl border-2 border-azul/20 bg-white p-5">
      <h2 className="font-titulo text-[1.25rem] font-extrabold text-azul-escuro">{especialidade ? `Editar ${especialidade.nome}` : 'Nova especialidade'}</h2>
      <Campo rotulo="Nome" erro={erroNome}>{(p) => <input {...p} className="campo" value={nome} onChange={(e) => setNome(e.target.value)} />}</Campo>
      <Campo rotulo="Descrição para o paciente" opcional ajuda="Exemplo: Cuida do coração e da pressão alta.">
        {(p) => <textarea {...p} className="campo min-h-[5rem]" value={descricao} onChange={(e) => setDescricao(e.target.value)} />}
      </Campo>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Botao type="submit" variante="confirmar" icone="check" carregando={salvando}>{especialidade ? 'Salvar' : 'Cadastrar'}</Botao>
        {especialidade && <Botao variante="secundario" onClick={aoCancelar}>Cancelar edição</Botao>}
      </div>
    </form>
  )
}
