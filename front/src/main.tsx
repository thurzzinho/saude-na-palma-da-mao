import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ProvedorSessao } from './contexto/Sessao'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProvedorSessao>
      <App />
    </ProvedorSessao>
  </React.StrictMode>,
)

// Registro do service worker do PWA (somente no build de produção)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Sem service worker o app continua funcionando, apenas sem cache offline
    })
  })
}
