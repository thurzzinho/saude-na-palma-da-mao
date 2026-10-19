// Ícones em traço, desenhados para o Saúde Fácil (24 x 24, traço 2).
// Sempre acompanham um texto: a pesquisa mostrou medo de "apertar algo
// errado" (9 de 18), então nenhum botão depende só do ícone para ser entendido.

const CAMINHOS: Record<string, string> = {
  inicio: 'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9',
  calendario: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  calendarioMais: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M12 13v5M9.5 15.5h5',
  consultas: 'M8 4h8v3H8zM6 5.5H5v15h14v-15h-1M8.5 12h7M8.5 16h5',
  usuario: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5',
  clinica: 'M4 21V7l8-4 8 4v14M2 21h20M10 21v-5h4v5M12 8v4M10 10h4',
  mapa: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  telefone: 'M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z',
  relogio: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2',
  sino: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4',
  compartilhar: 'M8.5 13.5l7 4M15.5 6.5l-7 4M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  sair: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  voltar: 'M15 5l-7 7 7 7',
  avancar: 'M9 5l7 7-7 7',
  check: 'M4.5 12.5l5 5L19.5 7',
  fechar: 'M6 6l12 12M18 6 6 18',
  alerta: 'M12 3 2 20h20L12 3zM12 10v4M12 17v.5',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5',
  escudo: 'M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3zM8.5 12l2.5 2.5 4.5-5',
  olho: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  olhoFechado: 'M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
  mais: 'M12 5v14M5 12h14',
  lixeira: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  editar: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  busca: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  estetoscopio: 'M6 3v6a5 5 0 0 0 10 0V3M6 3H4M16 3h2M11 14v2a5 5 0 0 0 10 0v-2M21 14a2 2 0 1 0-4 0 2 2 0 0 0 4 0z',
  pessoas: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c2.4.6 4 2.4 4 5.2',
  letra: 'M3 19l5-13 5 13M5 14.5h6M15 19l3-8 3 8M16 16.5h4',
  baixar: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  recarregar: 'M20 11a8 8 0 1 0-2.3 6.3M20 4v7h-7',
  semInternet: 'M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14 10.3a10 10 0 0 1 5 2.7M2 9a15 15 0 0 1 4.3-2.8M10.7 5.1A15 15 0 0 1 22 9M12 20h.01',
  menu: 'M4 6h16M4 12h16M4 18h16',
  coracao: 'M12 20s-8-4.6-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.4 12 20 12 20z',
  osso: 'M7 14l7-7M5.5 17.5a2 2 0 1 1-1-3.5 2 2 0 1 1 3.5-1M18.5 6.5a2 2 0 1 1 1 3.5 2 2 0 1 1-3.5 1',
  pele: 'M12 3c3 4 6 6.5 6 10a6 6 0 0 1-12 0c0-3.5 3-6 6-10zM10 14h.01M14 12h.01M12.5 16.5h.01',
  olhoSaude: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  gota: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11zM9.5 14.5a2.5 2.5 0 0 0 2.5 2.5',
  mulher: 'M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13v8M9 18h6',
  bengala: 'M14 21V9a4 4 0 0 0-8 0M9 4.5V3M7 21h4',
  duvida: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5M12 17v.5',
  celular: 'M7 2h10v20H7zM11 18.5h2',
  painel: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
}

export type NomeIcone = keyof typeof CAMINHOS

export function Icone({ nome, tamanho = 24, className = '', espessura = 2 }: {
  nome: NomeIcone | string
  tamanho?: number | string
  className?: string
  espessura?: number
}) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={espessura}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d={CAMINHOS[nome] ?? CAMINHOS.info} />
    </svg>
  )
}

/** Marca do Saúde Fácil: o coração com cruz do ícone do app. */
export function Marca({ tamanho = 40, comFundo = true }: { tamanho?: number; comFundo?: boolean }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      {comFundo && <rect width="48" height="48" rx="12" fill="#fff" />}
      <circle cx="15" cy="12" r="3.2" fill="#2EC4B6" />
      <circle cx="24" cy="9" r="3.2" fill="#1FA79A" />
      <circle cx="33" cy="12" r="3.2" fill="#2EC4B6" />
      <path d="M24 40C11 31 8 24 8 19.5 8 15.5 11 13.5 14 14.5c2.2.7 3.9 2.3 5 3.8L24 16l5-1.7c1.1-1.5 2.8-3.1 5-3.8 3-1 6 1 6 5 0 4.5-3 11.5-16 24.5z" fill="#2EC4B6" />
      <rect x="21" y="20" width="6" height="14" rx="1.5" fill="#fff" />
      <rect x="17" y="24" width="14" height="6" rx="1.5" fill="#fff" />
    </svg>
  )
}
