// Endereço da API. Vem da variável VITE_API_URL (arquivo .env ou painel da
// Vercel). Sem ela, o front usa a API publicada no Render.
const URL_PADRAO = 'https://saude-palma-mao-api.onrender.com'

export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) || URL_PADRAO).replace(/\/+$/, '')

// No plano gratuito do Render a API hiberna depois de 15 minutos sem uso, e a
// primeira chamada pode levar cerca de um minuto (README da API).
export const TEMPO_LIMITE_MS = 75_000

// A partir deste tempo de espera o app avisa que o servidor está acordando.
export const AVISO_LENTIDAO_MS = 6_000
