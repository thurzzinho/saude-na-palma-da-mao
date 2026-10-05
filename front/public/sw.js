// Service worker do PWA.
// Estratégia: arquivos do app ficam em cache para abrir mais rápido e funcionar sem internet.
// Chamadas à API NUNCA são guardadas em cache, para não mostrar horários desatualizados.
const VERSAO = 'spm-v1'
const BASICOS = ['/', '/index.html', '/manifest.webmanifest', '/favicon.png', '/icones/icone-192.png', '/icones/icone-512.png']

self.addEventListener('install', evento => {
  evento.waitUntil(caches.open(VERSAO).then(c => c.addAll(BASICOS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(chaves.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', evento => {
  const req = evento.request
  const url = new URL(req.url)
  // Só cuida de GET do próprio site. API (outro domínio) e fontes passam direto.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return

  // Navegação: tenta a rede e cai para o index.html em cache se estiver offline
  if (req.mode === 'navigate') {
    evento.respondWith(fetch(req).catch(() => caches.match('/index.html')))
    return
  }

  // Arquivos estáticos (JS, CSS, imagens): cache primeiro, depois rede
  evento.respondWith(
    caches.match(req).then(emCache => emCache || fetch(req).then(resp => {
      if (resp.ok) {
        const copia = resp.clone()
        caches.open(VERSAO).then(c => c.put(req, copia))
      }
      return resp
    })),
  )
})
