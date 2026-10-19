import { useEffect, useState } from 'react'
import { Icone } from './Icone'
import { Botao } from './ui'

// Evento do Chrome e do Edge que permite mostrar o convite de instalação
// do PWA com um botão nosso. O Safari do iPhone não tem esse evento: lá a
// instalação é pelo menu Compartilhar, então mostramos o passo a passo.
interface EventoInstalacao extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let eventoGuardado: EventoInstalacao | null = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    eventoGuardado = e as EventoInstalacao
  })
}

const instalado = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
const ehIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalacao | null>(eventoGuardado)
  const [jaInstalado, setJaInstalado] = useState(instalado)

  useEffect(() => {
    const aoOferecer = (e: Event) => {
      e.preventDefault()
      eventoGuardado = e as EventoInstalacao
      setEvento(eventoGuardado)
    }
    const aoInstalar = () => setJaInstalado(true)
    window.addEventListener('beforeinstallprompt', aoOferecer)
    window.addEventListener('appinstalled', aoInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', aoOferecer)
      window.removeEventListener('appinstalled', aoInstalar)
    }
  }, [])

  if (jaInstalado) {
    return <p className="flex items-center gap-2 text-agua"><Icone nome="check" /> O Saúde Fácil já está instalado neste aparelho.</p>
  }

  if (evento) {
    return (
      <div>
        <p className="text-tinta-suave">Ele fica na tela inicial do celular, como os outros aplicativos, e abre sem precisar do navegador.</p>
        <Botao className="mt-3" icone="celular" onClick={async () => {
          await evento.prompt()
          const escolha = await evento.userChoice
          if (escolha.outcome === 'accepted') setJaInstalado(true)
          eventoGuardado = null
          setEvento(null)
        }}>Instalar o app</Botao>
      </div>
    )
  }

  if (ehIphone()) {
    return (
      <ol className="list-decimal space-y-1 pl-6">
        <li>No Safari, toque no botão Compartilhar (o quadrado com uma seta para cima).</li>
        <li>Escolha <strong>Adicionar à Tela de Início</strong>.</li>
        <li>Toque em <strong>Adicionar</strong>.</li>
      </ol>
    )
  }

  return (
    <p className="text-tinta-suave">
      No menu do navegador, procure a opção <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.
    </p>
  )
}
