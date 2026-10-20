import { useEffect, useState } from 'react'
import { clinicas } from '@/api/servicos'
import { Icone } from '@/componentes/Icone'
import { BotaoLink, Cabecalho, Carregando, ErroCarregar, Vazio } from '@/componentes/ui'
import { urlMapa, urlTelefone } from '@/utils/acoes'
import { telefoneLegivel } from '@/utils/formatos'
import { useCarregar } from '@/utils/useCarregar'

// "Ver o endereço e como chegar" foi pedido por 9 de 18 participantes.
export function Clinicas() {
  const [texto, setTexto] = useState('')
  const [busca, setBusca] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setBusca(texto.trim()), 400)
    return () => clearTimeout(t)
  }, [texto])
  const { dados, carregando, erro, recarregar } = useCarregar(() => clinicas.listar({ busca: busca || undefined }), [busca])

  return (
    <>
      <Cabecalho titulo="Clínicas e endereços" voltar={{ para: '/inicio', texto: 'Início' }}
        subtitulo="Onde ficam, quando funcionam e como falar com cada clínica." />

      <label className="block max-w-[30rem]">
        <span className="font-bold">Procurar por nome ou bairro</span>
        <span className="relative mt-1.5 block">
          <Icone nome="busca" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-suave" />
          <input className="campo pl-11" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Exemplo: Derby, Ilha do Leite" />
        </span>
      </label>

      <div className="mt-6">
        {carregando && !dados ? <Carregando texto="Buscando clínicas…" /> : erro ? (
          <ErroCarregar mensagem={erro} tentarDeNovo={recarregar} />
        ) : !dados?.length ? (
          <Vazio icone="clinica" titulo="Nenhuma clínica encontrada">{busca ? `Nada com "${busca}". Tente outro nome ou bairro.` : 'Ainda não há clínicas cadastradas.'}</Vazio>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {dados.map((c) => (
              <li key={c.idClinica} className="flex flex-col rounded-2xl border border-linha bg-white">
                <div className="flex-1 p-5">
                  <h2 className="font-titulo text-[1.3rem] font-extrabold text-azul-escuro">{c.nome}</h2>
                  {c.endereco.bairro && <p className="font-bold text-agua">{c.endereco.bairro}</p>}
                  <ul className="mt-3 flex flex-col gap-2">
                    <li className="flex items-start gap-2"><Icone nome="mapa" className="mt-0.5 text-tinta-suave" />{c.endereco.completo}</li>
                    {c.horarioFuncionamento && <li className="flex items-start gap-2"><Icone nome="relogio" className="mt-0.5 text-tinta-suave" />{c.horarioFuncionamento}</li>}
                    {c.telefone && <li className="flex items-start gap-2"><Icone nome="telefone" className="mt-0.5 text-tinta-suave" />{telefoneLegivel(c.telefone)}</li>}
                  </ul>
                  {c.especialidades.length > 0 && (
                    <>
                      <p className="mt-4 text-[0.92rem] text-tinta-suave">Especialidades</p>
                      <ul className="mt-1 flex flex-wrap gap-1.5">
                        {c.especialidades.map((e) => <li key={e} className="rounded-full bg-azul-claro px-3 py-1 text-[0.92rem] font-bold text-azul">{e}</li>)}
                      </ul>
                    </>
                  )}
                </div>
                <div className="grid gap-2 border-t border-linha p-4 min-[25rem]:grid-cols-2">
                  <BotaoLink para={urlMapa(`${c.nome}, ${c.endereco.completo}`)} variante="secundario" tamanho="medio" icone="mapa">Como chegar</BotaoLink>
                  {c.telefone
                    ? <BotaoLink para={urlTelefone(c.telefone)} variante="secundario" tamanho="medio" icone="telefone">Ligar</BotaoLink>
                    : null}
                  <BotaoLink para={`/agendar?clinica=${c.idClinica}`} tamanho="medio" icone="calendarioMais" className="min-[25rem]:col-span-2">Marcar nesta clínica</BotaoLink>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
