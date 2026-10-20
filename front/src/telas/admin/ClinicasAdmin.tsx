import { useState } from 'react'
import { Link } from 'react-router'
import { mensagemDeErro } from '@/api/erros'
import { clinicas } from '@/api/servicos'
import type { Clinica } from '@/api/tipos'
import { Aviso, Botao, BotaoLink, Cabecalho, Carregando, Dialogo, ErroCarregar, Vazio } from '@/componentes/ui'
import { telefoneLegivel } from '@/utils/formatos'
import { useCarregar } from '@/utils/useCarregar'
import { EtiquetaAtivo } from './comum'

export default function ClinicasAdmin() {
  const { dados, carregando, erro, recarregar } = useCarregar(() => clinicas.listar({ incluirInativas: true }))
  const [alvo, setAlvo] = useState<Clinica | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erroAcao, setErroAcao] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function alternar() {
    if (!alvo) return
    setSalvando(true)
    setErroAcao(null)
    try {
      if (alvo.ativo) await clinicas.desativar(alvo.idClinica)
      else await clinicas.atualizar(alvo.idClinica, { ativo: true })
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
      <Cabecalho titulo="Clínicas" subtitulo="Clínica desativada some da busca do paciente, mas o histórico continua guardado."
        acoes={<BotaoLink para="/admin/clinicas/nova" tamanho="medio" icone="mais">Nova clínica</BotaoLink>} />
      {aviso && <Aviso tipo="sucesso" className="mb-4">{aviso}</Aviso>}
      {carregando && !dados ? <Carregando /> : erro ? <ErroCarregar mensagem={erro} tentarDeNovo={recarregar} /> : !dados?.length ? (
        <Vazio icone="clinica" titulo="Nenhuma clínica cadastrada" acao={<BotaoLink para="/admin/clinicas/nova" icone="mais">Cadastrar clínica</BotaoLink>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {dados.map((c) => (
            <li key={c.idClinica} className="flex flex-wrap items-start gap-4 rounded-2xl border border-linha bg-white p-4 sm:p-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/admin/clinicas/${c.idClinica}`} className="font-titulo text-[1.2rem] font-extrabold text-azul-escuro underline-offset-4 hover:underline">{c.nome}</Link>
                  <EtiquetaAtivo ativo={c.ativo} />
                </div>
                <p className="text-tinta-suave">{c.endereco.completo}</p>
                {c.telefone && <p className="text-tinta-suave">{telefoneLegivel(c.telefone)}</p>}
                <p className="mt-1">{c.especialidades.length ? c.especialidades.join(', ') : <span className="text-perigo">Sem especialidade cadastrada</span>}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <BotaoLink para={`/admin/clinicas/${c.idClinica}`} variante="secundario" tamanho="medio" icone="editar">Editar</BotaoLink>
                <Botao variante="secundario" tamanho="medio" onClick={() => { setAlvo(c); setErroAcao(null) }}>{c.ativo ? 'Desativar' : 'Reativar'}</Botao>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialogo aberto={!!alvo} aoFechar={() => setAlvo(null)} titulo={alvo?.ativo ? 'Desativar clínica?' : 'Reativar clínica?'}
        acoes={<>
          <Botao variante="secundario" onClick={() => setAlvo(null)} disabled={salvando}>Voltar</Botao>
          <Botao variante={alvo?.ativo ? 'perigo' : 'confirmar'} onClick={alternar} carregando={salvando}>{alvo?.ativo ? 'Desativar' : 'Reativar'}</Botao>
        </>}>
        <p>{alvo?.ativo
          ? `${alvo?.nome} deixa de aparecer para os pacientes. Se houver consultas futuras marcadas, o sistema não deixa desativar.`
          : `${alvo?.nome} volta a aparecer para os pacientes.`}</p>
        {erroAcao && <Aviso tipo="erro">{erroAcao}</Aviso>}
      </Dialogo>
    </>
  )
}
