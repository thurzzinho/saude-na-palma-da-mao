import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { mensagemDeErro } from '@/api/erros'
import { clinicas, especialidades } from '@/api/servicos'
import type { DadosClinica } from '@/api/tipos'
import { Aviso, Botao, Cabecalho, Campo, Carregando, ErroCarregar } from '@/componentes/ui'
import { emailValido, mascaraCep, mascaraCnpj, mascaraTelefone, normalizar, somenteDigitos, telefoneLegivel } from '@/utils/formatos'
import { useCarregar } from '@/utils/useCarregar'
import { cnpjValido, Marcadores, UFS } from './comum'

type Valores = {
  nome: string; cnpj: string; telefone: string; email: string; cep: string; logradouro: string
  numero: string; bairro: string; cidade: string; uf: string; horario: string; especialidades: number[]
}

const INICIAL: Valores = { nome: '', cnpj: '', telefone: '', email: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: 'Recife', uf: 'PE', horario: '', especialidades: [] }

export default function FormClinica() {
  const idTexto = useParams().id
  const id = idTexto ? Number(idTexto) : null
  const navegar = useNavigate()
  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const [lista, clinica] = await Promise.all([especialidades.listar(true), id ? clinicas.obter(id) : Promise.resolve(null)])
    return { lista, clinica }
  }, [id])
  const [v, setV] = useState<Valores>(INICIAL)
  const [erros, setErros] = useState<Partial<Record<keyof Valores, string>>>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!dados?.clinica) return
    const c = dados.clinica
    const nomes = new Set(c.especialidades.map(normalizar))
    setV({
      nome: c.nome, cnpj: '', telefone: telefoneLegivel(c.telefone), email: c.email ?? '', cep: mascaraCep(c.endereco.cep ?? ''),
      logradouro: c.endereco.logradouro ?? '', numero: c.endereco.numero ?? '', bairro: c.endereco.bairro ?? '',
      cidade: c.endereco.cidade ?? 'Recife', uf: c.endereco.uf ?? 'PE', horario: c.horarioFuncionamento ?? '',
      especialidades: dados.lista.filter((e) => nomes.has(normalizar(e.nome))).map((e) => e.idEspecialidade),
    })
  }, [dados])

  const mudar = (k: keyof Valores, mascara?: (s: string) => string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((a) => ({ ...a, [k]: mascara ? mascara(e.target.value) : e.target.value }))

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const n: typeof erros = {}
    if (v.nome.trim().length < 3) n.nome = 'Informe o nome da clínica.'
    if (!id && !cnpjValido(v.cnpj)) n.cnpj = 'CNPJ inválido. Confira os 14 números.'
    if (v.email && !emailValido(v.email)) n.email = 'E-mail inválido.'
    if (v.cep && somenteDigitos(v.cep).length !== 8) n.cep = 'O CEP tem 8 números.'
    if (v.logradouro.trim().length < 3) n.logradouro = 'Informe a rua ou avenida.'
    setErros(n)
    if (Object.keys(n).length) return

    const corpo: DadosClinica = {
      nome: v.nome.trim(), telefone: somenteDigitos(v.telefone) || undefined, email: v.email.trim() || undefined,
      cep: somenteDigitos(v.cep) || undefined, logradouro: v.logradouro.trim(), numero: v.numero.trim() || undefined,
      bairro: v.bairro.trim() || undefined, cidade: v.cidade.trim() || undefined, uf: v.uf || undefined,
      horarioFuncionamento: v.horario.trim() || undefined,
    }
    setSalvando(true)
    setErroGeral(null)
    try {
      if (id) {
        await clinicas.atualizar(id, corpo)
        await clinicas.definirEspecialidades(id, v.especialidades)
      } else {
        await clinicas.criar({ ...corpo, cnpj: somenteDigitos(v.cnpj), idsEspecialidades: v.especialidades })
      }
      navegar('/admin/clinicas')
    } catch (err) {
      setErroGeral(mensagemDeErro(err))
      setSalvando(false)
    }
  }

  if (carregando && !dados) return <Carregando />
  if (erro || !dados) return <ErroCarregar mensagem={erro ?? ''} tentarDeNovo={recarregar} />

  return (
    <>
      <Cabecalho titulo={id ? `Editar ${dados.clinica?.nome ?? 'clínica'}` : 'Nova clínica'} voltar={{ para: '/admin/clinicas', texto: 'Clínicas' }} />
      <form onSubmit={salvar} noValidate className="flex flex-col gap-6">
        <div className="grid gap-4 rounded-2xl border border-linha bg-white p-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><Campo rotulo="Nome da clínica" erro={erros.nome}>{(p) => <input {...p} className="campo" value={v.nome} onChange={mudar('nome')} />}</Campo></div>
          {!id && <Campo rotulo="CNPJ" erro={erros.cnpj}>{(p) => <input {...p} className="campo" value={v.cnpj} onChange={mudar('cnpj', mascaraCnpj)} inputMode="numeric" placeholder="00.000.000/0000-00" />}</Campo>}
          <Campo rotulo="Telefone" opcional>{(p) => <input {...p} className="campo" value={v.telefone} onChange={mudar('telefone', mascaraTelefone)} inputMode="tel" />}</Campo>
          <Campo rotulo="E-mail" opcional erro={erros.email}>{(p) => <input {...p} className="campo" type="email" value={v.email} onChange={mudar('email')} />}</Campo>
          <Campo rotulo="Horário de funcionamento" opcional ajuda="Como o paciente vai ler. Exemplo: Segunda a sexta, 7h às 19h.">{(p) => <input {...p} className="campo" value={v.horario} onChange={mudar('horario')} />}</Campo>
        </div>

        <div className="grid gap-4 rounded-2xl border border-linha bg-white p-5 sm:grid-cols-6">
          <p className="font-titulo text-[1.2rem] font-extrabold text-azul-escuro sm:col-span-6">Endereço</p>
          <div className="sm:col-span-2"><Campo rotulo="CEP" opcional erro={erros.cep}>{(p) => <input {...p} className="campo" value={v.cep} onChange={mudar('cep', mascaraCep)} inputMode="numeric" />}</Campo></div>
          <div className="sm:col-span-4"><Campo rotulo="Rua ou avenida" erro={erros.logradouro}>{(p) => <input {...p} className="campo" value={v.logradouro} onChange={mudar('logradouro')} />}</Campo></div>
          <div className="sm:col-span-2"><Campo rotulo="Número" opcional>{(p) => <input {...p} className="campo" value={v.numero} onChange={mudar('numero')} />}</Campo></div>
          <div className="sm:col-span-4"><Campo rotulo="Bairro" opcional>{(p) => <input {...p} className="campo" value={v.bairro} onChange={mudar('bairro')} />}</Campo></div>
          <div className="sm:col-span-4"><Campo rotulo="Cidade">{(p) => <input {...p} className="campo" value={v.cidade} onChange={mudar('cidade')} />}</Campo></div>
          <div className="sm:col-span-2"><Campo rotulo="UF">{(p) => (
            <select {...p} className="campo" value={v.uf} onChange={mudar('uf')}>{UFS.map((u) => <option key={u}>{u}</option>)}</select>
          )}</Campo></div>
        </div>

        <div className="rounded-2xl border border-linha bg-white p-5">
          <Marcadores legenda="Especialidades atendidas" ajuda="O paciente que escolhe esta clínica vê só estas especialidades."
            opcoes={dados.lista.filter((e) => e.ativo || v.especialidades.includes(e.idEspecialidade)).map((e) => ({ id: e.idEspecialidade, nome: e.nome }))}
            marcados={v.especialidades} aoMudar={(ids) => setV((a) => ({ ...a, especialidades: ids }))} />
        </div>

        {erroGeral && <Aviso tipo="erro">{erroGeral}</Aviso>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Botao type="submit" variante="confirmar" icone="check" carregando={salvando}>{id ? 'Salvar alterações' : 'Cadastrar clínica'}</Botao>
          <Botao variante="secundario" onClick={() => navegar('/admin/clinicas')} disabled={salvando}>Cancelar</Botao>
        </div>
      </form>
    </>
  )
}
