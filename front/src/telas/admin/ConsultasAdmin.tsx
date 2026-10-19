import { useState } from 'react'
import { vinculos } from '@/api/servicos'
import { Cabecalho } from '@/componentes/ui'
import { useCarregar } from '@/utils/useCarregar'
import { ListaAgenda } from '../profissional/Agenda'

export default function ConsultasAdmin() {
  const { dados } = useCarregar(() => vinculos.buscar())
  const [idPc, setIdPc] = useState<number | undefined>(undefined)

  return (
    <>
      <Cabecalho titulo="Consultas" subtitulo="Todas as consultas marcadas. A administração pode cancelar a qualquer momento, por exemplo quando o profissional falta." />
      <label className="mb-4 flex max-w-[34rem] flex-col gap-1.5">
        <span className="font-bold">Profissional</span>
        <select className="campo" value={idPc ?? ''} onChange={(e) => setIdPc(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">Todos os profissionais</option>
          {(dados ?? []).map((v) => <option key={v.idProfissionalClinica} value={v.idProfissionalClinica}>{v.nome}, {v.clinica.nome}</option>)}
        </select>
      </label>
      <ListaAgenda modoAdmin idProfissionalClinica={idPc} />
    </>
  )
}
