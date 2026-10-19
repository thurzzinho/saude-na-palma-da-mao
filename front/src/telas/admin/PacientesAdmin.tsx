import { useState, type FormEvent } from 'react'
import { mensagemDeErro } from '@/api/erros'
import { pacientes } from '@/api/servicos'
import type { Paciente } from '@/api/tipos'
import { Aviso, Botao, Cabecalho, Carregando, Vazio } from '@/componentes/ui'
import { idade } from '@/utils/datas'
import { cpfOculto, isoParaDataBr, mascaraCpf, somenteDigitos, telefoneLegivel } from '@/utils/formatos'

export default function PacientesAdmin() {
  const [texto, setTexto] = useState('')
  const [lista, setLista] = useState<Paciente[] | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [verCpf, setVerCpf] = useState<number | null>(null)

  async function buscar(e?: FormEvent) {
    e?.preventDefault()
    const digitos = somenteDigitos(texto)
    const ehCpf = digitos.length === 11 && /^[\d.\-\s]+$/.test(texto)
    if (!ehCpf && texto.trim().length > 0 && texto.trim().length < 2) {
      setErro('Digite pelo menos 2 letras do nome.')
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      setLista(await pacientes.buscar(ehCpf ? { cpf: digitos } : { nome: texto.trim() || undefined }))
    } catch (err) {
      setErro(mensagemDeErro(err))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <>
      <Cabecalho titulo="Pacientes" subtitulo="Consulta de cadastro. O CPF fica escondido até você pedir para ver." />
      <form onSubmit={buscar} className="flex max-w-[40rem] flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="font-bold">Nome ou CPF</span>
          <input className="campo" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Deixe vazio para ver os primeiros 50" />
        </label>
        <Botao type="submit" icone="busca" carregando={carregando}>Buscar</Botao>
      </form>

      <div className="mt-6">
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {carregando && !lista && <Carregando />}
        {lista && lista.length === 0 && <Vazio icone="pessoas" titulo="Nenhum paciente encontrado" />}
        {lista && lista.length > 0 && (
          <ul className="divide-y divide-linha rounded-2xl border border-linha bg-white">
            {lista.map((p) => (
              <li key={p.idPaciente} className="grid gap-1 p-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <div className="min-w-0">
                  <p className="font-bold">{p.nome}</p>
                  <p className="text-tinta-suave">{isoParaDataBr(p.dataNascimento)}{idade(p.dataNascimento) !== null && `, ${idade(p.dataNascimento)} anos`}</p>
                </div>
                <div className="min-w-0 text-tinta-suave">
                  <p className="break-words">{p.email}</p>
                  <p>{telefoneLegivel(p.telefone) || 'Sem telefone'}</p>
                  <p className="flex flex-wrap items-center gap-2">
                    CPF {verCpf === p.idPaciente ? mascaraCpf(p.cpf) : cpfOculto(p.cpf)}
                    <button className="min-h-10 rounded-lg px-1 font-bold text-azul underline underline-offset-4" onClick={() => setVerCpf(verCpf === p.idPaciente ? null : p.idPaciente)}>
                      {verCpf === p.idPaciente ? 'Esconder' : 'Ver'}
                    </button>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
