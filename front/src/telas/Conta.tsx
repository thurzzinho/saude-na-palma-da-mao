import { autenticacao } from '@/api/servicos'
import { InstalarApp } from '@/componentes/InstalarApp'
import { SeletorLetra } from '@/componentes/Layout'
import { Cabecalho, Carregando, Dados, ErroCarregar, Secao } from '@/componentes/ui'
import { telefoneLegivel } from '@/utils/formatos'
import { useCarregar } from '@/utils/useCarregar'
import { BotaoSair } from './paciente/Perfil'

const PERFIS = { PACIENTE: 'Paciente', PROFISSIONAL: 'Profissional de saúde', ADMINISTRADOR: 'Administração' }

export function Conta() {
  const { dados, carregando, erro, recarregar } = useCarregar(() => autenticacao.eu())
  return (
    <>
      <Cabecalho titulo="Minha conta" />
      {carregando && !dados ? <Carregando /> : erro || !dados ? <ErroCarregar mensagem={erro ?? ''} tentarDeNovo={recarregar} /> : (
        <section className="rounded-2xl border border-linha bg-white p-5">
          <Dados itens={[
            { rotulo: 'Nome', valor: dados.nome },
            { rotulo: 'Perfil', valor: PERFIS[dados.tipoUsuario] },
            { rotulo: 'E-mail', valor: dados.email },
            { rotulo: 'Telefone', valor: telefoneLegivel(dados.telefone) || 'Não informado' },
          ]} />
          <p className="mt-4 text-[0.95rem] text-tinta-suave">Para alterar esses dados, fale com a administração do sistema.</p>
        </section>
      )}
      <Secao titulo="Leitura">
        <div className="rounded-2xl border border-linha bg-white p-5"><SeletorLetra /></div>
      </Secao>
      <Secao titulo="Instalar no celular ou computador">
        <div className="rounded-2xl border border-linha bg-white p-5"><InstalarApp /></div>
      </Secao>
      <BotaoSair />
    </>
  )
}
