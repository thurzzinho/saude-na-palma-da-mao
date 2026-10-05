// Configuração lida das variáveis de ambiente do Vite (arquivo .env).
// VITE_USAR_MOCK=true faz o front funcionar sem backend, com dados locais.

const urlBruta = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

export const API_URL = urlBruta.replace(/\/+$/, '')

export const USAR_MOCK =
  String(import.meta.env.VITE_USAR_MOCK ?? '').toLowerCase() === 'true' || API_URL === ''

// Tempo máximo de espera por resposta da API, em milissegundos.
// O plano gratuito do Render "adormece" o serviço e a primeira chamada pode demorar.
export const TEMPO_LIMITE_MS = 60000
