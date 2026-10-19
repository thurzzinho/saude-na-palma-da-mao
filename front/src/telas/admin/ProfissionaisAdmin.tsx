import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { mensagemDeErro } from '@/api/erros'
import { profissionais } from '@/api/servicos'
import type { Profissional } from '@/api/tipos'
import { Icone } from '@/componentes/Icone'
import { Aviso, Botao, BotaoLink, Cabecalho, Carregando, Dialogo, ErroCarregar, Vazio } from '@/componentes/ui'
import { useCarregar } from '@/utils/useCarregar'
import { EtiquetaAtivo } from './comum'

export default function ProfissionaisAdmin() {
  const [texto, setTexto] = useState('')
  const [busca, setBusca] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setBusca(texto.trim()), 400)
    return () => clearTimeout(t)
  }, [texto])
  const { dados, carregando, erro, recarregar } = useCarregar(() => profissionais.listar({ busca: busca || undefined, incluirInativos: true }), [busca])
  const [alvo, setAlvo] = useState<Profissional | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erroAcao, setErroAcao] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function alternar() {
    if (!alvo) return
    setSalvando(true)
    setErroAcao(null)
    try {
      if (alvo.ativo) await profissionais.desativar(alvo.idProfissional)
      else await profissionais.atualizar(alvo.idProfissional, { ativo: true })
      setAviso(`${alvo.nome} foi ${alvo.ativo ? 'desativado(a)' : 'reativado(a)'}.`)
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
      <Cabecalho titulo="Profissionais" subtitulo="Cada profissional entra com o e-mail e a senha inicial que você cadastrar."
        acoes={<BotaoLink para="/admin/profissionais/novo" tamanho="medio" icone="mais">Novo profissional</BotaoLink>} />
      <label className="mb-5 block max-w-[30rem]">
        <span className="font-bold">Procurar</span>
        <span className="relative mt-1.5 block">
          <Icone nome="busca" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-suave" />
          <input className="campo pl-11" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nome ou número do registro" />
        </span>
      </label>
      {aviso && <Aviso tipo="sucesso" className="mb-4">{aviso}</Aviso>}
      {carregando && !dados ? <Carregando /> : erro ? <ErroCarregar mensagem={erro} tentarDeNovo={recarregar} /> : !dados?.length ? (
        <Vazio icone="estetoscopio" titulo={busca ? 'Ninguém encontrado' : 'Nenhum profissional cadastrado'} />
      ) : (
        <ul className="flex flex-col gap-3">
          {dados.map((p) => (
            <li key={p.idProfissional} className="flex flex-wrap items-start gap-4 rounded-2xl border border-linha bg-white p-4 sm:p-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/admin/profissionais/${p.idProfissional}`} className="font-titulo text-[1.2rem] font-extrabold text-azul-escuro underline-offset-4 hover:underline">{p.nome}</Link>
                  <EtiquetaAtivo ativo={p.ativo} />
                </div>
                <p className="text-tinta-suave">{p.registro}, {p.email}</p>
                <p className="mt-1">{p.especialidades.map((e) => e.nome).join(', ') || <span className="text-perigo">Sem especialidade</span>}</p>
                <p className="text-tinta-suave">{p.clinicas.filter((c) => c.ativo).map((c) => c.nome).join(', ') || 'Sem clínica'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <BotaoLink para={`/admin/profissionais/${p.idProfissional}`} variante="secundario" tamanho="medio" icone="editar">Editar</BotaoLink>
                <Botao variante="secundario" tamanho="medio" onClick={() => { setAlvo(p); setErroAcao(null) }}>{p.ativo ? 'Desativar' : 'Reativar'}</Botao>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialogo aberto={!!alvo} aoFechar={() => setAlvo(null)} titulo={alvo?.ativo ? 'Desativar profissional?' : 'Reativar profissional?'}
        acoes={<>
          <Botao variante="secundario" onClick={() => setAlvo(null)} disabled={salvando}>Voltar</Botao>
          <Botao variante={alvo?.ativo ? 'perigo' : 'confirmar'} onClick={alternar} carregando={salvando}>{alvo?.ativo ? 'Desativar' : 'Reativar'}</Botao>
        </>}>
        <p>{alvo?.ativo
          ? `${alvo?.nome} deixa de aparecer para os pacientes e não consegue mais entrar no sistema. Com consultas futuras marcadas, o sistema não deixa desativar.`
          : `${alvo?.nome} volta a aparecer para os pacientes e a entrar no sistema.`}</p>
        {erroAcao && <Aviso tipo="erro">{erroAcao}</Aviso>}
      </Dialogo>
    </>
  )
}
