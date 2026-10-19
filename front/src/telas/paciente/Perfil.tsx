import { useState, type FormEvent } from 'react'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import { pacientes } from '@/api/servicos'
import type { Paciente } from '@/api/tipos'
import { Icone } from '@/componentes/Icone'
import { InstalarApp } from '@/componentes/InstalarApp'
import { SeletorLetra } from '@/componentes/Layout'
import { Aviso, Botao, Cabecalho, Campo, Carregando, Dados, Dialogo, ErroCarregar, Secao } from '@/componentes/ui'
import { useSessao } from '@/contexto/Sessao'
import { cpfOculto, emailValido, isoParaDataBr, mascaraCpf, mascaraTelefone, somenteDigitos, telefoneLegivel } from '@/utils/formatos'
import { useCarregar } from '@/utils/useCarregar'

export function Perfil() {
  const { dados, carregando, erro, recarregar, setDados } = useCarregar(() => pacientes.meusDados())
  const [editando, setEditando] = useState(false)
  const [verCpf, setVerCpf] = useState(false)
  const [salvo, setSalvo] = useState(false)

  return (
    <>
      <Cabecalho titulo="Meu perfil" />

      {carregando && !dados ? <Carregando /> : erro || !dados ? <ErroCarregar mensagem={erro ?? ''} tentarDeNovo={recarregar} /> : (
        <section className="rounded-2xl border border-linha bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-titulo text-[1.3rem] font-extrabold text-azul-escuro">Meus dados</h2>
            {!editando && <Botao variante="secundario" tamanho="medio" icone="editar" onClick={() => { setEditando(true); setSalvo(false) }}>Alterar</Botao>}
          </div>
          {salvo && <Aviso tipo="sucesso" className="mb-4">Dados atualizados.</Aviso>}
          {editando ? (
            <FormDados paciente={dados} aoCancelar={() => setEditando(false)}
              aoSalvar={(p) => { setDados(p); setEditando(false); setSalvo(true) }} />
          ) : (
            <Dados itens={[
              { rotulo: 'Nome', valor: dados.nome },
              {
                rotulo: 'CPF', valor: (
                  <span className="flex flex-wrap items-center gap-2">
                    {verCpf ? mascaraCpf(dados.cpf) : cpfOculto(dados.cpf)}
                    <button onClick={() => setVerCpf((v) => !v)} className="min-h-10 rounded-lg px-2 text-[0.95rem] font-bold text-azul underline underline-offset-4">
                      {verCpf ? 'Esconder' : 'Mostrar'}
                    </button>
                  </span>
                ),
              },
              { rotulo: 'Data de nascimento', valor: isoParaDataBr(dados.dataNascimento) },
              { rotulo: 'Telefone', valor: telefoneLegivel(dados.telefone) || 'Não informado' },
              { rotulo: 'E-mail', valor: dados.email },
            ]} />
          )}
        </section>
      )}

      <Secao titulo="Leitura">
        <div className="rounded-2xl border border-linha bg-white p-5">
          <p className="text-tinta-suave">Escolha o tamanho que fica mais confortável. Vale para todas as telas.</p>
          <SeletorLetra />
        </div>
      </Secao>

      <Secao titulo="Instalar no celular">
        <div className="rounded-2xl border border-linha bg-white p-5"><InstalarApp /></div>
      </Secao>

      <Secao titulo="Seus dados e a LGPD">
        <div className="flex gap-3 rounded-2xl bg-agua-fundo p-5 text-[#064e46]">
          <Icone nome="escudo" className="mt-0.5" />
          <p>Usamos seus dados só para marcar e acompanhar consultas. O médico vê seu nome, telefone e data de nascimento, mas não vê seu CPF.</p>
        </div>
      </Secao>

      <BotaoSair />
    </>
  )
}

function FormDados({ paciente, aoCancelar, aoSalvar }: { paciente: Paciente; aoCancelar: () => void; aoSalvar: (p: Paciente) => void }) {
  const { atualizarNome } = useSessao()
  const [nome, setNome] = useState(paciente.nome)
  const [telefone, setTelefone] = useState(telefoneLegivel(paciente.telefone))
  const [email, setEmail] = useState(paciente.email)
  const [erros, setErros] = useState<{ nome?: string; telefone?: string; email?: string }>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const novos: typeof erros = {}
    if (nome.trim().length < 3) novos.nome = 'Escreva seu nome completo.'
    const tel = somenteDigitos(telefone)
    if (tel && (tel.length < 10 || tel.length > 11)) novos.telefone = 'Escreva o telefone com DDD.'
    if (!emailValido(email)) novos.email = 'Confira o e-mail.'
    setErros(novos)
    if (Object.keys(novos).length) return
    setSalvando(true)
    setErroGeral(null)
    try {
      const p = await pacientes.atualizarMeusDados({ nome: nome.trim(), telefone: tel || null, email: email.trim() })
      atualizarNome(p.nome)
      aoSalvar(p)
    } catch (err) {
      if (err instanceof ErroApi && err.codigo === 'EMAIL_JA_CADASTRADO') setErros({ email: 'Este e-mail já é usado por outra conta.' })
      else setErroGeral(mensagemDeErro(err))
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-4">
      <Campo rotulo="Nome completo" erro={erros.nome}>{(p) => <input {...p} className="campo" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />}</Campo>
      <Campo rotulo="Telefone com DDD" opcional erro={erros.telefone}>{(p) => <input {...p} className="campo max-w-[18rem]" value={telefone} onChange={(e) => setTelefone(mascaraTelefone(e.target.value))} inputMode="tel" autoComplete="tel-national" />}</Campo>
      <Campo rotulo="E-mail" erro={erros.email}>{(p) => <input {...p} className="campo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />}</Campo>
      <p className="text-[0.95rem] text-tinta-suave">O CPF e a data de nascimento não podem ser alterados por aqui. Se houver erro, procure a administração.</p>
      {erroGeral && <Aviso tipo="erro">{erroGeral}</Aviso>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Botao type="submit" variante="confirmar" icone="check" carregando={salvando}>Salvar</Botao>
        <Botao variante="secundario" onClick={aoCancelar} disabled={salvando}>Cancelar</Botao>
      </div>
    </form>
  )
}

export function BotaoSair() {
  const { sair } = useSessao()
  const [confirmando, setConfirmando] = useState(false)
  return (
    <>
      <div className="mt-10 border-t border-linha pt-6">
        <Botao variante="secundario" icone="sair" onClick={() => setConfirmando(true)}>Sair da conta</Botao>
      </div>
      <Dialogo aberto={confirmando} aoFechar={() => setConfirmando(false)} titulo="Sair da conta?"
        acoes={<>
          <Botao variante="secundario" onClick={() => setConfirmando(false)}>Continuar no app</Botao>
          <Botao onClick={() => sair()}>Sair</Botao>
        </>}>
        <p>Para entrar de novo você vai precisar do e-mail ou CPF e da senha.</p>
      </Dialogo>
    </>
  )
}
