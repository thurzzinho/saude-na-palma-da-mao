import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { mensagemDeErro } from '@/api/erros'
import { Icone, Marca } from '@/componentes/Icone'
import { Aviso, Botao, BotaoLink, Campo } from '@/componentes/ui'
import { rotaInicial, useSessao } from '@/contexto/Sessao'
import { mascaraCpf, somenteDigitos } from '@/utils/formatos'

export function Entrada() {
  const { entrar, aviso, limparAviso } = useSessao()
  const navegar = useNavigate()
  const local = useLocation()
  const [identificador, setIdentificador] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Se a pessoa digita só números, formata como CPF enquanto digita.
  function aoDigitarIdentificador(v: string) {
    const pareceCpf = /^[\d.\-\s]*$/.test(v) && v.length > 0
    setIdentificador(pareceCpf ? mascaraCpf(v) : v)
  }

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    limparAviso()
    if (!identificador.trim() || !senha) {
      setErro('Preencha o e-mail ou CPF e a senha.')
      return
    }
    const valor = identificador.includes('@') ? identificador.trim() : somenteDigitos(identificador)
    setEnviando(true)
    try {
      const u = await entrar(valor, senha)
      const destino = (local.state as { de?: string } | null)?.de
      navegar(destino && destino !== '/' ? destino : rotaInicial(u.tipoUsuario), { replace: true })
    } catch (e) {
      setErro(mensagemDeErro(e))
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-dvh bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
      {/* Apresentação */}
      <section className="sobre-escuro relative overflow-hidden bg-azul-escuro px-5 pb-10 pt-8 text-white sm:px-10 lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-14">
        <div className="relative z-10 flex items-center gap-3">
          <Marca tamanho={48} />
          <span className="font-titulo text-[1.6rem] font-black">Saúde Fácil</span>
        </div>
        <div className="relative z-10 mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 lg:mt-0 lg:block">
          <div>
            <h1 className="font-titulo text-[1.9rem] font-black leading-[1.1] sm:text-[2.6rem] lg:max-w-[16ch] lg:text-[3.2rem]">
              O caminho mais curto até o cuidado.
            </h1>
            <p className="mt-4 max-w-[32rem] text-[1.05rem] text-white/85">
              Veja os horários livres, marque e acompanhe suas consultas no polo médico do Recife sem sair de casa.
            </p>
          </div>
          <img src="/imagens/atendimento.webp" alt="" width={140} height={155}
            className="w-[6.5rem] sm:w-[9rem] lg:hidden" />
        </div>
        <div className="relative z-10 mt-8 hidden grid-cols-[minmax(0,1fr)_auto] items-end gap-6 lg:grid">
          <ul className="grid gap-4">
            {[
              ['calendario', 'Horários livres na hora, sem fila e sem telefone'],
              ['sino', 'Lembrete no calendário do seu celular'],
              ['escudo', 'Seus dados protegidos conforme a LGPD'],
            ].map(([icone, texto]) => (
              <li key={texto} className="flex items-center gap-3 text-[1.05rem]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-sol"><Icone nome={icone} /></span>
                {texto}
              </li>
            ))}
          </ul>
          <img src="/imagens/atendimento.webp" alt="" width={240} height={267} className="pointer-events-none -mb-14 w-[12rem] xl:w-[15rem]" />
        </div>
      </section>

      {/* Formulário */}
      <section className="-mt-5 rounded-t-[1.75rem] bg-white px-5 pb-12 pt-8 sm:px-10 lg:mt-0 lg:flex lg:flex-col lg:justify-center lg:rounded-none lg:px-12">
        <div className="mx-auto w-full max-w-[28rem]">
          <h2 className="font-titulo text-[1.75rem] font-extrabold text-azul-escuro">Entre na sua conta</h2>
          <p className="mt-1 text-tinta-suave">Pacientes, profissionais e administração entram por aqui.</p>

          {aviso && <Aviso tipo="alerta" className="mt-5">{aviso}</Aviso>}

          <form onSubmit={aoEnviar} noValidate className="mt-6 flex flex-col gap-5">
            <Campo rotulo="E-mail ou CPF" ajuda="Use o mesmo que você informou no cadastro.">
              {(p) => (
                <input {...p} className="campo" value={identificador} onChange={(e) => aoDigitarIdentificador(e.target.value)}
                  autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Seu e-mail ou CPF" />
              )}
            </Campo>
            <Campo rotulo="Senha">
              {(p) => (
                <div className="flex gap-2">
                  <input {...p} className="campo min-w-0 flex-1" type={verSenha ? 'text' : 'password'} value={senha}
                    onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
                  <button type="button" onClick={() => setVerSenha((v) => !v)} aria-pressed={verSenha}
                    className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-xl border-2 border-linha px-3 font-bold text-azul">
                    <Icone nome={verSenha ? 'olhoFechado' : 'olho'} tamanho={22} />
                    {verSenha ? 'Esconder' : 'Mostrar'}
                  </button>
                </div>
              )}
            </Campo>

            {erro && <Aviso tipo="erro">{erro}</Aviso>}

            <Botao type="submit" largo carregando={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</Botao>
          </form>

          <div className="mt-8 border-t border-linha pt-6">
            <p className="font-bold">Ainda não tem conta?</p>
            <BotaoLink para="/cadastro" variante="secundario" largo className="mt-3" icone="usuario">Criar minha conta</BotaoLink>
          </div>

          <p className="mt-8 flex items-start gap-2 text-[0.95rem] text-tinta-suave">
            <Icone nome="escudo" className="mt-0.5 text-agua" />
            Seus dados são usados só para marcar e acompanhar suas consultas, conforme a Lei Geral de Proteção de Dados.
          </p>
        </div>
      </section>
    </div>
  )
}
