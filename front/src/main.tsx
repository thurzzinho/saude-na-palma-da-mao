import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fontes servidas pelo próprio app (sem depender do Google Fonts), para
// funcionarem também com o PWA instalado e sem internet.
import '@fontsource/atkinson-hyperlegible/latin-400.css'
import '@fontsource/atkinson-hyperlegible/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import '@fontsource/nunito/latin-900.css'
import './estilos.css'
import App from './App'
import { ProvedorPreferencias } from './contexto/Preferencias'
import { ProvedorSessao } from './contexto/Sessao'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProvedorPreferencias>
      <ProvedorSessao>
        <App />
      </ProvedorSessao>
    </ProvedorPreferencias>
  </StrictMode>,
)

// O service worker só entra no build de produção, para não guardar em cache
// arquivos que mudam a cada salvamento durante o desenvolvimento.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Sem service worker o app continua funcionando, só não fica disponível offline.
    })
  })
}
