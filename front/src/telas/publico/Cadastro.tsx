import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import { Icone, Marca } from '@/componentes/Icone'
import { Aviso, Botao, Campo } from '@/componentes/ui'
import { useSessao } from '@/contexto/Sessao'
import {
  cpfValido, dataBrParaIso, emailValido, mascaraCpf, mascaraData, mascaraTelefone, somenteDigitos,
} from '@/utils/formatos'

type Campos = 'nome' | 'cpf' | 'nascimento' | 'telefone' | 'email' | 'senha'

export function Cadastro() {
  const { cadastrar } = useSessao()
  const navegar = useNavigate()
  const formulario = useRef<HTMLFormElement>(null)
  const [v, setV] = useState<Record<Campos, string>>({ nome: '', cpf: '', nascimento: '', telefone: '', email: '', senha: '' })
  const [erros, setErros] = useState<Partial<Record<Campos, string>>>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [verSenha, setVerSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const mudar = (campo: Campos, mascara?: (s: string) => string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = mascara ? mascara(e.target.value) : e.target.value
    setV((atual) => ({ ...atual, [campo]: valor }))
    if (erros[campo]) setErros((atual) => ({ ...atual, [campo]: undefined }))
  }

  function validar() {
    const e: Partial<Record<Campos, string>> = {}
    if (v.nome.trim().length < 3 || !v.nome.trim().includes(' ')) e.nome = 'Escreva seu nome e sobrenome.'
    if (!cpfValido(v.cpf)) e.cpf = 'Este CPF não é válido. Confira os 11 números.'
    if (!dataBrParaIso(v.nascimento)) e.nascimento = 'Escreva a data como dia, mês e ano. Exemplo: 12/03/1958.'
    const tel = somenteDigitos(v.telefone)
    if (tel && (tel.length < 10 || tel.length > 11)) e.telefone = 'Escreva o telefone com DDD. Exemplo: (81) 99999-0000.'
    if (!emailValido(v.email)) e.email = 'Confira o e-mail. Ele precisa ter @ e um ponto, como maria@email.com.'
    if (v.senha.length < 8) e.senha = 'A senha precisa ter pelo menos 8 letras ou números.'
    return e
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    setErroGeral(null)
    const encontrados = validar()
    setErros(encontrados)
    if (Object.keys(encontrados).length) {
      // Leva o foco ao primeiro campo com problema.
      requestAnimationFrame(() => formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    setEnviando(true)
    try {
      await cadastrar({
        nome: v.nome.trim(),
        cpf: somenteDigitos(v.cpf),
        dataNascimento: dataBrParaIso(v.nascimento)!,
        telefone: somenteDigitos(v.telefone) || undefined,
        email: v.email.trim().toLowerCase(),
        senha: v.senha,
      })
      navegar('/inicio', { replace: true, state: { boasVindas: true } })
    } catch (e) {
      if (e instanceof ErroApi && e.codigo === 'CPF_JA_CADASTRADO') setErros({ cpf: e.message })
      else if (e instanceof ErroApi && e.codigo === 'EMAIL_JA_CADASTRADO') setErros({ email: e.message })
      else setErroGeral(mensagemDeErro(e))
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-dvh bg-papel">
      <header className="sobre-escuro bg-azul-escuro px-5 pb-16 pt-6 text-white sm:px-10">
        <div className="mx-auto max-w-[40rem]">
          <Link to="/" className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-lg pr-3 font-bold text-white/90 hover:text-white">
            <Icone nome="voltar" /> Voltar para entrar
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <Marca tamanho={40} />
            <h1 className="font-titulo text-[1.9rem] font-black">Criar minha conta</h1>
          </div>
          <p className="mt-2 text-white/85">Leva uns 2 minutos. Depois disso você já pode marcar sua consulta.</p>
        </div>
      </header>

      <form ref={formulario} onSubmit={aoEnviar} noValidate className="mx-auto -mt-10 flex max-w-[40rem] flex-col gap-6 px-4 pb-16 sm:px-6">
        <fieldset className="flex flex-col gap-5 rounded-2xl border border-linha bg-white p-5 sm:p-6">
          <legend className="sr-only">Seus dados</legend>
          <p className="font-titulo text-[1.25rem] font-extrabold text-azul-escuro">Seus dados</p>
          <Campo rotulo="Nome completo" erro={erros.nome}>
            {(p) => <input {...p} className="campo" value={v.nome} onChange={mudar('nome')} autoComplete="name" autoCapitalize="words" />}
          </Campo>

          <Campo rotulo="CPF" erro={erros.cpf}>
            {(p) => <input {...p} className="campo" value={v.cpf} onChange={mudar('cpf', mascaraCpf)} inputMode="numeric" placeholder="000.000.000-00" autoComplete="off" />}
          </Campo>
          <div className="flex gap-3 rounded-xl bg-agua-fundo p-4 text-[#064e46]">
            <Icone nome="escudo" className="mt-0.5" />
            <p className="text-[0.95rem]">
              <strong>Por que pedimos o CPF?</strong> Ele identifica você no sistema e evita contas repetidas.
              Nas telas o CPF aparece escondido, e o médico não vê o número. Só a administração do sistema tem acesso a ele.
            </p>
          </div>

          <Campo rotulo="Data de nascimento" ajuda="Dia, mês e ano. Exemplo: 12/03/1958." erro={erros.nascimento}>
            {(p) => <input {...p} className="campo max-w-[14rem]" value={v.nascimento} onChange={mudar('nascimento', mascaraData)} inputMode="numeric" placeholder="dd/mm/aaaa" autoComplete="bday" />}
          </Campo>

          <Campo rotulo="Telefone com DDD" opcional ajuda="A clínica pode ligar se precisar mudar algo na consulta." erro={erros.telefone}>
            {(p) => <input {...p} className="campo max-w-[18rem]" value={v.telefone} onChange={mudar('telefone', mascaraTelefone)} inputMode="tel" placeholder="(81) 99999-0000" autoComplete="tel-national" />}
          </Campo>
        </fieldset>

        <fieldset className="flex flex-col gap-5 rounded-2xl border border-linha bg-white p-5 sm:p-6">
          <legend className="sr-only">Acesso</legend>
          <p className="font-titulo text-[1.25rem] font-extrabold text-azul-escuro">Para entrar no app</p>
          <Campo rotulo="E-mail" erro={erros.email}>
            {(p) => <input {...p} className="campo" type="email" value={v.email} onChange={mudar('email')} autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="maria@email.com" />}
          </Campo>
          <Campo rotulo="Crie uma senha" ajuda="Pelo menos 8 letras ou números. Não precisa de símbolo." erro={erros.senha}>
            {(p) => (
              <div className="flex gap-2">
                <input {...p} className="campo min-w-0 flex-1" type={verSenha ? 'text' : 'password'} value={v.senha} onChange={mudar('senha')} autoComplete="new-password" />
                <button type="button" onClick={() => setVerSenha((s) => !s)} aria-pressed={verSenha}
                  className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-xl border-2 border-linha px-3 font-bold text-azul">
                  <Icone nome={verSenha ? 'olhoFechado' : 'olho'} tamanho={22} />
                  {verSenha ? 'Esconder' : 'Mostrar'}
                </button>
              </div>
            )}
          </Campo>
          <p className="text-[0.95rem] text-tinta-suave">Você também poderá entrar usando o CPF no lugar do e-mail.</p>
        </fieldset>

        {Object.values(erros).some(Boolean) && (
          <Aviso tipo="erro">Confira os campos marcados em vermelho.</Aviso>
        )}
        {erroGeral && <Aviso tipo="erro">{erroGeral}</Aviso>}

        <Botao type="submit" largo carregando={enviando} icone="check">{enviando ? 'Criando sua conta…' : 'Criar minha conta'}</Botao>
        <p className="text-center">
          Já tem conta? <Link to="/" className="font-bold text-azul underline underline-offset-4">Entrar</Link>
        </p>
      </form>
    </div>
  )
}
