import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { mensagemDeErro } from '@/api/erros'
import { clinicas, especialidades, profissionais } from '@/api/servicos'
import { Aviso, Botao, Cabecalho, Campo, Carregando, Dialogo, ErroCarregar, Secao } from '@/componentes/ui'
import { cpfOculto, cpfValido, emailValido, mascaraCpf, mascaraTelefone, somenteDigitos, telefoneLegivel } from '@/utils/formatos'
import { useCarregar } from '@/utils/useCarregar'
import { CONSELHOS, EtiquetaAtivo, Marcadores, UFS } from './comum'

export default function FormProfissional() {
  const idTexto = useParams().id
  const id = idTexto ? Number(idTexto) : null
  const navegar = useNavigate()
  const { dados, carregando, erro, recarregar, setDados } = useCarregar(async () => {
    const [esps, cls, prof] = await Promise.all([
      especialidades.listar(true),
      clinicas.listar({ incluirInativas: true }),
      id ? profissionais.obter(id) : Promise.resolve(null),
    ])
    return { esps, cls, prof }
  }, [id])

  const [v, setV] = useState({ nome: '', email: '', telefone: '', cpf: '', conselho: 'CRM', registro: '', uf: 'PE', senha: '' })
  const [esps, setEsps] = useState<number[]>([])
  const [cls, setCls] = useState<number[]>([])
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    const p = dados?.prof
    if (!p) return
    setV({ nome: p.nome, email: p.email, telefone: telefoneLegivel(p.telefone), cpf: '', conselho: p.conselho, registro: p.registroProfissional, uf: p.ufRegistro, senha: '' })
    setEsps(p.especialidades.map((e) => e.idEspecialidade))
  }, [dados?.prof])

  const mudar = (k: keyof typeof v, mascara?: (s: string) => string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((a) => ({ ...a, [k]: mascara ? mascara(e.target.value) : e.target.value }))

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const n: Record<string, string> = {}
    if (v.nome.trim().length < 3) n.nome = 'Informe o nome completo.'
    if (!emailValido(v.email)) n.email = 'E-mail inválido.'
    if (!id && !cpfValido(v.cpf)) n.cpf = 'CPF inválido.'
    if (!v.registro.trim()) n.registro = 'Informe o número do registro.'
    if (!id && v.senha.length < 8) n.senha = 'A senha inicial precisa ter pelo menos 8 caracteres.'
    if (!esps.length) n.esps = 'Marque pelo menos uma especialidade. Sem ela o profissional não aparece na busca do paciente.'
    setErros(n)
    if (Object.keys(n).length) return
    setSalvando(true)
    setErroGeral(null)
    setAviso(null)
    try {
      const comum = {
        nome: v.nome.trim(), email: v.email.trim(), telefone: somenteDigitos(v.telefone) || undefined,
        conselho: v.conselho, registroProfissional: v.registro.trim(), ufRegistro: v.uf,
      }
      if (id) {
        await profissionais.atualizar(id, comum)
        const atual = await profissionais.definirEspecialidades(id, esps)
        setDados((d) => (d ? { ...d, prof: atual } : d))
        setAviso('Alterações salvas.')
      } else {
        await profissionais.criar({ ...comum, cpf: somenteDigitos(v.cpf), senha: v.senha, idsEspecialidades: esps, idsClinicas: cls })
        navegar('/admin/profissionais')
        return
      }
    } catch (err) {
      setErroGeral(mensagemDeErro(err))
    }
    setSalvando(false)
  }

  if (carregando && !dados) return <Carregando />
  if (erro || !dados) return <ErroCarregar mensagem={erro ?? ''} tentarDeNovo={recarregar} />

  const p = dados.prof
  const opcoesEsp = dados.esps.filter((x) => x.ativo || esps.includes(x.idEspecialidade)).map((x) => ({ id: x.idEspecialidade, nome: x.nome }))

  return (
    <>
      <Cabecalho titulo={p ? p.nome : 'Novo profissional'} voltar={{ para: '/admin/profissionais', texto: 'Profissionais' }}
        subtitulo={p ? <span className="flex flex-wrap items-center gap-2">{p.registro} <EtiquetaAtivo ativo={p.ativo} /></span> : 'O profissional entra com o e-mail e a senha inicial. Passe a senha para ele por fora do sistema.'} />

      <form onSubmit={salvar} noValidate className="flex flex-col gap-6">
        <div className="grid gap-4 rounded-2xl border border-linha bg-white p-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><Campo rotulo="Nome completo" erro={erros.nome}>{(pr) => <input {...pr} className="campo" value={v.nome} onChange={mudar('nome')} />}</Campo></div>
          <Campo rotulo="E-mail (usado para entrar)" erro={erros.email}>{(pr) => <input {...pr} className="campo" type="email" value={v.email} onChange={mudar('email')} autoCapitalize="none" />}</Campo>
          <Campo rotulo="Telefone" opcional>{(pr) => <input {...pr} className="campo" value={v.telefone} onChange={mudar('telefone', mascaraTelefone)} inputMode="tel" />}</Campo>
          {p ? (
            <div><p className="font-bold">CPF</p><p className="mt-2">{cpfOculto(p.cpf)}</p></div>
          ) : (
            <Campo rotulo="CPF" erro={erros.cpf}>{(pr) => <input {...pr} className="campo" value={v.cpf} onChange={mudar('cpf', mascaraCpf)} inputMode="numeric" />}</Campo>
          )}
          <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-3 sm:col-span-2">
            <Campo rotulo="Conselho">{(pr) => <select {...pr} className="campo" value={v.conselho} onChange={mudar('conselho')}>{CONSELHOS.map((c) => <option key={c}>{c}</option>)}</select>}</Campo>
            <Campo rotulo="Número" erro={erros.registro}>{(pr) => <input {...pr} className="campo" value={v.registro} onChange={mudar('registro')} inputMode="numeric" />}</Campo>
            <Campo rotulo="UF">{(pr) => <select {...pr} className="campo" value={v.uf} onChange={mudar('uf')}>{UFS.map((u) => <option key={u}>{u}</option>)}</select>}</Campo>
          </div>
          {!p && (
            <div className="sm:col-span-2">
              <Campo rotulo="Senha inicial" ajuda="Pelo menos 8 caracteres." erro={erros.senha}>{(pr) => <input {...pr} className="campo max-w-[20rem]" value={v.senha} onChange={mudar('senha')} autoComplete="new-password" />}</Campo>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-linha bg-white p-5">
          <Marcadores legenda="Especialidades" opcoes={opcoesEsp} marcados={esps} aoMudar={setEsps} />
          {erros.esps && <p className="mt-2 font-bold text-perigo">{erros.esps}</p>}
        </div>

        {!p && (
          <div className="rounded-2xl border border-linha bg-white p-5">
            <Marcadores legenda="Clínicas onde atende" ajuda="Cada clínica marcada vira uma agenda separada."
              opcoes={dados.cls.filter((c) => c.ativo).map((c) => ({ id: c.idClinica, nome: c.nome }))} marcados={cls} aoMudar={setCls} />
          </div>
        )}

        {aviso && <Aviso tipo="sucesso">{aviso}</Aviso>}
        {erroGeral && <Aviso tipo="erro">{erroGeral}</Aviso>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Botao type="submit" variante="confirmar" icone="check" carregando={salvando}>{p ? 'Salvar alterações' : 'Cadastrar profissional'}</Botao>
          <Botao variante="secundario" onClick={() => navegar('/admin/profissionais')} disabled={salvando}>{p ? 'Voltar' : 'Cancelar'}</Botao>
        </div>
      </form>

      {p && <ClinicasDoProfissional idProfissional={p.idProfissional} vinculos={p.clinicas} todas={dados.cls}
        aoMudar={(atual) => setDados((d) => (d ? { ...d, prof: atual ?? d.prof } : d))} recarregar={recarregar} />}
    </>
  )
}

function ClinicasDoProfissional({ idProfissional, vinculos, todas, aoMudar, recarregar }: {
  idProfissional: number
  vinculos: { idProfissionalClinica: number; idClinica: number; nome: string; ativo: boolean }[]
  todas: { idClinica: number; nome: string; ativo: boolean }[]
  aoMudar: (p: Awaited<ReturnType<typeof profissionais.obter>> | null) => void
  recarregar: () => void
}) {
  const disponiveis = todas.filter((c) => c.ativo && !vinculos.some((v) => v.idClinica === c.idClinica))
  const [nova, setNova] = useState('')
  const [removendo, setRemovendo] = useState<{ idClinica: number; nome: string } | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function adicionar() {
    if (!nova) return
    setOcupado(true)
    setErro(null)
    try {
      aoMudar(await profissionais.vincularClinica(idProfissional, Number(nova)))
      setNova('')
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setOcupado(false)
    }
  }

  async function remover() {
    if (!removendo) return
    setOcupado(true)
    setErro(null)
    try {
      await profissionais.desvincularClinica(idProfissional, removendo.idClinica)
      setRemovendo(null)
      recarregar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Secao titulo="Clínicas onde atende">
      <ul className="divide-y divide-linha rounded-2xl border border-linha bg-white">
        {vinculos.length === 0 && <li className="p-4 text-tinta-suave">Ainda não atende em nenhuma clínica.</li>}
        {vinculos.map((v) => (
          <li key={v.idProfissionalClinica} className="flex flex-wrap items-center gap-3 p-4">
            <span className="min-w-0 flex-1 font-bold">{v.nome}</span>
            <EtiquetaAtivo ativo={v.ativo} />
            {v.ativo && <Botao variante="secundario" tamanho="medio" onClick={() => setRemovendo({ idClinica: v.idClinica, nome: v.nome })}>Tirar desta clínica</Botao>}
          </li>
        ))}
      </ul>
      {disponiveis.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="font-bold">Adicionar clínica</span>
            <select className="campo" value={nova} onChange={(e) => setNova(e.target.value)}>
              <option value="">Escolha a clínica</option>
              {disponiveis.map((c) => <option key={c.idClinica} value={c.idClinica}>{c.nome}</option>)}
            </select>
          </label>
          <Botao icone="mais" onClick={adicionar} disabled={!nova} carregando={ocupado && !removendo}>Adicionar</Botao>
        </div>
      )}
      {erro && <Aviso tipo="erro" className="mt-3">{erro}</Aviso>}
      <Dialogo aberto={!!removendo} aoFechar={() => setRemovendo(null)} titulo="Tirar desta clínica?"
        acoes={<>
          <Botao variante="secundario" onClick={() => setRemovendo(null)} disabled={ocupado}>Voltar</Botao>
          <Botao variante="perigo" onClick={remover} carregando={ocupado}>Tirar da clínica</Botao>
        </>}>
        <p>A agenda deste profissional em {removendo?.nome} deixa de aparecer para os pacientes. Com consultas futuras marcadas lá, o sistema não deixa.</p>
      </Dialogo>
    </Secao>
  )
}
