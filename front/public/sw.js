// Service worker do Saúde Fácil.
//
// O que fica guardado no aparelho: a casca do aplicativo (HTML, scripts,
// estilos, fontes, ícones e imagens). Assim o app abre rápido e mostra a
// mensagem de "sem internet" mesmo offline.
//
// O que NUNCA fica guardado: as respostas da API. Horários livres e
// consultas mudam a todo momento, e dado de saúde não deve ficar em cache.
// Por isso toda requisição para outro domínio (a API no Render) passa direto.

const VERSAO = 'saude-facil-v1'
const CASCA = ['/', '/index.html', '/manifest.webmanifest', '/favicon.png',
  '/icones/icone-192.png', '/icones/icone-512.png', '/imagens/logo-saude-facil.svg',
  '/imagens/atendimento.webp']

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(VERSAO).then((cache) => cache.addAll(CASCA)))
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (evento) => {
  const req = evento.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // API e qualquer outro domínio: sem cache.
  if (url.origin !== self.location.origin) return

  // Navegação: tenta a rede primeiro, para pegar a versão nova do app.
  if (req.mode === 'navigate') {
    evento.respondWith(
      fetch(req)
        .then((resposta) => {
          const copia = resposta.clone()
          caches.open(VERSAO).then((cache) => cache.put('/index.html', copia))
          return resposta
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Arquivos com hash no nome (/assets/...) nunca mudam: cache primeiro.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icones/') || url.pathname.startsWith('/imagens/')) {
    evento.respondWith(
      caches.match(req).then((guardado) => guardado || fetch(req).then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone()
          caches.open(VERSAO).then((cache) => cache.put(req, copia))
        }
        return resposta
      }))
    )
  }
})
