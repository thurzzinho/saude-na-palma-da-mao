import { BotaoLink } from '@/componentes/ui'
import { rotaInicial, useSessao } from '@/contexto/Sessao'

export function NaoEncontrada() {
  const { usuario } = useSessao()
  return (
    <div className="mx-auto max-w-[36rem] px-4 py-16">
      <h1 className="font-titulo text-[2rem] font-extrabold text-azul-escuro">Esta página não existe</h1>
      <p className="mt-2 text-tinta-suave">O endereço pode ter sido digitado errado ou a página mudou de lugar.</p>
      <BotaoLink para={rotaInicial(usuario?.tipoUsuario)} className="mt-6" icone="inicio">Ir para o início</BotaoLink>
    </div>
  )
}
