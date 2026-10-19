"""Teste ponta a ponta do Saúde Fácil (front + API + banco).

Percorre os fluxos de paciente, profissional e administração, tira prints de
cada tela e confere se alguma tela tem rolagem horizontal em 320, 375, 768 e
1280 px e com a letra no tamanho "muito grande".

Como rodar:
  1. API local em http://localhost:3000 com o seed do banco e o paciente de
     teste cadastrado (CPF 529.982.247-25, senha senhaSegura123).
  2. No front: VITE_API_URL=http://localhost:3000 pnpm build && pnpm preview
  3. pip install playwright && playwright install chromium
  4. python testes/ponta-a-ponta.py pasta-dos-prints

O teste cria consultas, uma especialidade, uma clínica e um período de
atendimento. Use só em banco de desenvolvimento.
"""
import json, os, sys, time, random

def gerar_cnpj():
    n=[random.randint(0,9) for _ in range(8)]+[0,0,0,1]
    for pesos in ([5,4,3,2,9,8,7,6,5,4,3,2],[6,5,4,3,2,9,8,7,6,5,4,3,2]):
        r=sum(a*b for a,b in zip(n,pesos))%11; n.append(0 if r<2 else 11-r)
    return ''.join(map(str,n))

def gerar_cpf():
    n=[random.randint(0,9) for _ in range(9)]
    for t in (9,10):
        soma=sum(n[i]*(t+1-i) for i in range(t)); r=(soma*10)%11; n.append(0 if r==10 else r)
    return ''.join(map(str,n))

from playwright.sync_api import sync_playwright, expect

BASE = 'http://localhost:4173'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots'
os.makedirs(OUT, exist_ok=True)
problemas = []

CHECA_OVERFLOW = """
() => {
  const w = document.documentElement.clientWidth
  const res = { scroll: document.documentElement.scrollWidth, largura: w, fora: [] }
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    const cs = getComputedStyle(el)
    if (cs.position === 'fixed' && el.closest('dialog') === null && r.right <= w + 1) continue
    if (r.right > w + 1 || r.left < -1) {
      // ignora filhos de quem já está fora
      if (![...res.fora].some(f => f.el.contains(el))) res.fora.push({ el, tag: el.tagName, cls: (el.className && el.className.baseVal === undefined ? el.className : '').slice(0, 80), txt: (el.innerText || '').slice(0, 40), right: Math.round(r.right), left: Math.round(r.left) })
    }
  }
  res.fora = res.fora.slice(0, 8).map(({ el, ...x }) => x)
  return res
}
"""

def checar(page, nome):
    page.wait_for_timeout(250)
    r = page.evaluate(CHECA_OVERFLOW)
    if r['scroll'] > r['largura'] + 1 or r['fora']:
        problemas.append({'tela': nome, **r})
    return r

def foto(page, nome, inteira=True):
    checar(page, nome)
    page.screenshot(path=f'{OUT}/{nome}.png', full_page=inteira)

def entrar(page, ident, senha):
    page.goto(BASE + '/')
    page.get_by_label('E-mail ou CPF').fill(ident)
    page.get_by_label('Senha', exact=True).fill(senha)
    page.get_by_role('button', name='Entrar', exact=True).click()
    page.wait_for_url(lambda u: not u.endswith(':4173/'), timeout=15000)
    page.wait_for_load_state('networkidle')

def sair(page):
    page.evaluate("localStorage.clear(); sessionStorage.clear()")

with sync_playwright() as p:
    nav = p.chromium.launch()

    # ── Paciente no celular (375 px) ─────────────────────────────────────
    ctx = nav.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=2, locale='pt-BR', timezone_id='America/Recife', has_touch=True, is_mobile=True)
    page = ctx.new_page()
    erros_console = []
    page.on('console', lambda m: erros_console.append(m.text) if m.type == 'error' else None)
    page.goto(BASE + '/')
    page.wait_for_load_state('networkidle')
    foto(page, 'm01-entrada')

    # login com erro
    page.get_by_label('E-mail ou CPF').fill('52998224725')
    page.get_by_label('Senha', exact=True).fill('errada123')
    page.get_by_role('button', name='Entrar', exact=True).click()
    page.get_by_text('não conferem').wait_for(timeout=10000)
    foto(page, 'm02-entrada-erro', inteira=False)

    entrar(page, '529.982.247-25', 'senhaSegura123')
    foto(page, 'm03-inicio')

    # agendamento
    page.get_by_role('link', name='Marcar consulta').first.click()
    page.get_by_text('Etapa 1 de 4').wait_for()
    page.wait_for_load_state('networkidle')
    foto(page, 'm04-agendar-1')
    page.get_by_role('button', name='Ortopedia').click()
    page.get_by_text('Etapa 2 de 4').wait_for()
    page.wait_for_load_state('networkidle')
    foto(page, 'm05-agendar-2')
    page.locator('button[aria-pressed]').filter(has_text='Carlos').first.click()
    page.get_by_text('Etapa 3 de 4').wait_for()
    page.get_by_text('Manhã').wait_for(timeout=20000)
    foto(page, 'm06-agendar-3')
    page.locator('main fieldset button').nth(1).click()
    foto(page, 'm07-agendar-3-escolhido', inteira=False)
    page.get_by_role('button', name='Continuar com').click()
    page.get_by_text('Etapa 4 de 4').wait_for()
    page.get_by_placeholder('Exemplo: dor no joelho').fill('Dor no joelho direito ao subir escada.')
    foto(page, 'm08-agendar-4')
    page.get_by_role('button', name='Confirmar consulta').click()
    page.get_by_role('heading', name='Consulta marcada').wait_for(timeout=15000)
    page.wait_for_timeout(700)
    foto(page, 'm09-marcada')

    # lembrete .ics
    with page.expect_download() as d:
        page.get_by_role('button', name='Pôr lembrete no celular').click()
    ics = d.value.path()
    conteudo = open(ics, encoding='utf-8').read()
    assert 'BEGIN:VEVENT' in conteudo and 'TRIGGER:-P1D' in conteudo, 'ics inválido'

    page.get_by_role('link', name='Ver minhas consultas').click()
    page.wait_for_load_state('networkidle')
    foto(page, 'm10-consultas')
    page.locator('a.ficha').first.click()
    page.wait_for_load_state('networkidle')
    page.get_by_text('Não vai poder ir?').wait_for()
    foto(page, 'm11-detalhe')
    page.get_by_role('button', name='Cancelar esta consulta').click()
    page.wait_for_timeout(300)
    foto(page, 'm12-cancelar-dialogo', inteira=False)
    page.get_by_role('button', name='Não, manter consulta').click()
    page.get_by_role('button', name='Cancelar esta consulta').click()
    page.get_by_role('button', name='Sim, cancelar').click()
    page.get_by_text('Consulta cancelada. O horário ficou livre').wait_for(timeout=10000)
    foto(page, 'm12b-cancelada')

    page.goto(BASE + '/guia')
    page.wait_for_load_state('networkidle')
    page.get_by_role('button', name='Coração ou pressão alta').click()
    page.get_by_role('link', name='Marcar com').wait_for()
    foto(page, 'm13-guia')
    page.get_by_role('link', name='Marcar com').click()
    page.get_by_text('Sugestão da ajuda para escolher').wait_for()
    foto(page, 'm14-agendar-sugerido', inteira=False)

    page.goto(BASE + '/clinicas')
    page.wait_for_load_state('networkidle')
    page.get_by_role('heading', name='Hospital Portugues').wait_for()
    foto(page, 'm15-clinicas')
    page.goto(BASE + '/perfil')
    page.wait_for_load_state('networkidle')
    page.get_by_text('Meus dados').wait_for()
    foto(page, 'm16-perfil')

    # tamanho de letra "muito grande" em 375 e 320
    page.evaluate("localStorage.setItem('saude-facil:letra','maior')")
    for tela in ['/inicio', '/agendar', '/consultas', '/perfil', '/clinicas']:
        page.goto(BASE + tela)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(600)
        checar(page, f'letra-maior-375{tela}')
    page.goto(BASE + '/inicio'); page.wait_for_load_state('networkidle')
    foto(page, 'm17-inicio-letra-maior')
    page.evaluate("localStorage.setItem('saude-facil:letra','normal')")
    print('console errors (paciente):', erros_console[:5])
    ctx.close()

    # ── Larguras extremas e desktop ──────────────────────────────────────
    for largura, altura, prefixo in [(320, 640, 'p320'), (768, 1024, 't768'), (1280, 800, 'd1280')]:
        ctx = nav.new_context(viewport={'width': largura, 'height': altura}, locale='pt-BR', timezone_id='America/Recife')
        page = ctx.new_page()
        page.goto(BASE + '/'); page.wait_for_load_state('networkidle')
        foto(page, f'{prefixo}-entrada', inteira=largura != 1280)
        page.goto(BASE + '/cadastro'); page.wait_for_load_state('networkidle')
        checar(page, f'{prefixo}-cadastro')
        if largura == 1280: foto(page, f'{prefixo}-cadastro')
        entrar(page, 'maria.silva@exemplo.test', 'senhaSegura123')
        for tela in ['/inicio', '/agendar', '/consultas', '/clinicas', '/perfil', '/guia']:
            page.goto(BASE + tela); page.wait_for_load_state('networkidle'); page.wait_for_timeout(500)
            if largura == 1280 or tela in ('/inicio', '/agendar'):
                foto(page, f'{prefixo}{tela.replace("/", "-")}')
            else:
                checar(page, f'{prefixo}{tela}')
        if largura == 320:
            page.goto(BASE + '/agendar'); page.wait_for_load_state('networkidle')
            page.get_by_role('button', name='Ortopedia').click()
            page.locator('button[aria-pressed]').filter(has_text='Carlos').first.click()
            page.get_by_text('Manhã').wait_for(timeout=20000)
            foto(page, 'p320-agendar-3')
        sair(page)
        ctx.close()

    # ── Cadastro de novo paciente ────────────────────────────────────────
    ctx = nav.new_context(viewport={'width': 390, 'height': 844}, locale='pt-BR', timezone_id='America/Recife')
    page = ctx.new_page()
    page.goto(BASE + '/cadastro'); page.wait_for_load_state('networkidle')
    page.get_by_role('button', name='Criar minha conta').click()
    page.wait_for_timeout(300)
    foto(page, 'c01-cadastro-erros')
    page.get_by_label('Nome completo').fill('Antônio Ferreira')
    page.get_by_label('CPF').fill(gerar_cpf())
    page.get_by_label('Data de nascimento').fill('05061952')
    page.get_by_label('Telefone com DDD').fill('81988887777')
    page.get_by_label('E-mail').fill(f'antonio{int(time.time())}@exemplo.test')
    page.get_by_label('Crie uma senha').fill('antonio2026')
    page.get_by_role('button', name='Criar minha conta').click()
    page.wait_for_url('**/inicio', timeout=15000)
    page.get_by_text('Sua conta foi criada').wait_for()
    foto(page, 'c02-cadastro-ok')
    ctx.close()

    # ── Profissional ─────────────────────────────────────────────────────
    for largura, prefixo in [(375, 'rm'), (1280, 'rd')]:
        ctx = nav.new_context(viewport={'width': largura, 'height': 900}, locale='pt-BR', timezone_id='America/Recife')
        page = ctx.new_page()
        entrar(page, 'carlos.lima@exemplo.test', 'senha123456')
        page.get_by_role('heading', name='Minha agenda').wait_for()
        page.wait_for_load_state('networkidle')
        foto(page, f'{prefixo}01-agenda')
        page.goto(BASE + '/profissional/horarios'); page.wait_for_load_state('networkidle')
        page.get_by_text('Abrir horários').first.wait_for()
        foto(page, f'{prefixo}02-horarios')
        if largura == 375:
            page.get_by_label('Dia').fill('2026-12-26')  # sábado, sem janela no seed
            page.get_by_label('Das').fill('09:00')
            page.get_by_label('Até').fill('11:00')
            page.get_by_role('button', name='Abrir horários').click()
            page.get_by_text('Horários abertos em').wait_for(timeout=10000)
            foto(page, f'{prefixo}03-horarios-criado')
        page.goto(BASE + '/conta'); page.wait_for_load_state('networkidle')
        checar(page, f'{prefixo}-conta')
        ctx.close()

    # ── Administração ────────────────────────────────────────────────────
    for largura, prefixo in [(375, 'am'), (1280, 'ad')]:
        ctx = nav.new_context(viewport={'width': largura, 'height': 900}, locale='pt-BR', timezone_id='America/Recife')
        page = ctx.new_page()
        entrar(page, 'admin@exemplo.test', 'senha123456')
        page.get_by_role('heading', name='Painel da administração').wait_for()
        page.wait_for_load_state('networkidle')
        foto(page, f'{prefixo}01-painel')
        for tela in ['/admin/consultas', '/admin/clinicas', '/admin/clinicas/nova', '/admin/clinicas/1', '/admin/profissionais', '/admin/profissionais/novo', '/admin/profissionais/2', '/admin/especialidades', '/admin/pacientes']:
            page.goto(BASE + tela); page.wait_for_load_state('networkidle'); page.wait_for_timeout(400)
            foto(page, f'{prefixo}{tela.replace("/", "-")}') if largura == 1280 or tela in ('/admin/consultas', '/admin/clinicas/nova') else checar(page, f'{prefixo}{tela}')
        if largura == 375:
            page.goto(BASE + '/admin')
            page.get_by_role('button', name='Mais').click()
            page.wait_for_timeout(300)
            foto(page, f'{prefixo}02-menu', inteira=False)
            page.keyboard.press('Escape')
            page.goto(BASE + '/admin/pacientes'); page.wait_for_load_state('networkidle')
            page.get_by_role('button', name='Buscar').click()
            page.get_by_text('Maria José da Silva').wait_for()
            foto(page, f'{prefixo}03-pacientes')
        ctx.close()

    nav.close()

print(json.dumps(problemas, ensure_ascii=False, indent=1))
print('TOTAL PROBLEMAS', len(problemas))

# ── CRUD administrativo e ações do profissional ──────────────────────────
with sync_playwright() as p:
    nav = p.chromium.launch()
    ctx = nav.new_context(viewport={'width': 1280, 'height': 900}, locale='pt-BR', timezone_id='America/Recife')
    page = ctx.new_page()
    entrar(page, 'admin@exemplo.test', 'senha123456')
    sufixo = str(int(time.time()))[-5:]
    page.goto(BASE + '/admin/especialidades'); page.wait_for_load_state('networkidle')
    page.get_by_label('Nome', exact=True).fill(f'Pneumologia {sufixo}')
    page.get_by_label('Descrição para o paciente').fill('Cuida dos pulmões, da respiração e da asma.')
    page.get_by_role('button', name='Cadastrar').click()
    page.get_by_text(f'Pneumologia {sufixo} foi cadastrada').wait_for(timeout=10000)
    page.goto(BASE + '/admin/clinicas/nova'); page.wait_for_load_state('networkidle')
    page.get_by_label('Nome da clínica').fill(f'Clínica Teste {sufixo}')
    page.get_by_label('CNPJ').fill(gerar_cnpj())
    page.get_by_label('Rua ou avenida').fill('Rua da Aurora')
    page.get_by_label('Número').fill('10')
    page.get_by_label('Bairro').fill('Boa Vista')
    page.get_by_label(f'Pneumologia {sufixo}').check()
    page.get_by_role('button', name='Cadastrar clínica').click()
    page.wait_for_url('**/admin/clinicas', timeout=10000)
    page.get_by_text(f'Clínica Teste {sufixo}').wait_for()
    page.get_by_role('link', name=f'Clínica Teste {sufixo}').click()
    page.wait_for_load_state('networkidle')
    page.get_by_label('Telefone').fill('8133334444')
    page.get_by_role('button', name='Salvar alterações').click()
    page.wait_for_url('**/admin/clinicas', timeout=10000)
    page.get_by_text('(81) 3333-4444').first.wait_for(timeout=10000)
    # cancelar uma consulta como administração
    page.goto(BASE + '/admin/consultas'); page.wait_for_load_state('networkidle')
    page.get_by_role('button', name='Cancelar', exact=True).first.click()
    page.get_by_label('Motivo').fill('Profissional em congresso.')
    page.get_by_role('button', name='Cancelar consulta').click()
    page.get_by_text('Consulta cancelada.').wait_for(timeout=10000)
    foto(page, 'ad02-cancelou')
    ctx.close()

    ctx = nav.new_context(viewport={'width': 1280, 'height': 900}, locale='pt-BR', timezone_id='America/Recife')
    page = ctx.new_page()
    entrar(page, 'carlos.lima@exemplo.test', 'senha123456')
    page.wait_for_load_state('networkidle')
    botoes = page.get_by_role('button', name='Confirmar', exact=True)
    if botoes.count():
        botoes.first.click()
        page.locator('dialog').get_by_role('button', name='Confirmar', exact=True).click()
        page.get_by_text('Consulta confirmada.').wait_for(timeout=10000)
        foto(page, 'rd03-confirmou')
    else:
        print('AVISO: nenhuma consulta para o profissional confirmar')
    ctx.close()

    # sessão inválida volta para a entrada com aviso
    ctx = nav.new_context(viewport={'width': 375, 'height': 800}, locale='pt-BR')
    page = ctx.new_page()
    page.goto(BASE + '/')
    page.evaluate("""localStorage.setItem('saude-facil:sessao', JSON.stringify({token: 'a.' + btoa(JSON.stringify({exp: 9999999999})) + '.b', usuario: {idUsuario: 8, nome: 'Maria', email: 'x', tipoUsuario: 'PACIENTE', idPaciente: 1}}))""")
    page.goto(BASE + '/consultas')
    page.get_by_text('sua sessão terminou').wait_for(timeout=10000)
    foto(page, 'x01-sessao-expirada', inteira=False)
    ctx.close()
    nav.close()

print(json.dumps(problemas, ensure_ascii=False, indent=1))
print('TOTAL PROBLEMAS FINAL', len(problemas))
