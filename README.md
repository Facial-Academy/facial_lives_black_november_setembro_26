# Facial Academy · captura das aulas ao vivo

Página de captura da campanha das **aulas ao vivo e gratuitas de fim de ano**
(16 e 23 de novembro de 2026, 19h), em HTML/CSS/JS puro, publicada no
Cloudflare Pages. Os leads entram na lista da Black (mesmo LeadHero) e vão para o
grupo **Facial Ao Vivo** no WhatsApp.

- Briefing: Google Doc "Página de captura 3_Campanha Lives".
- Estrutura: a prévia do briefing (`LP_Captura_Aulas-Fim-de-Ano.html`, no Drive),
  com a linguagem visual da captura B da Black Vitalícia (ver "Histórico").
- No ar desde 30/10/2026.

## Endereços

Domínio: `https://www.lives.black.vitalicia.facialacademy.com.br` (sem `www` não
resolve).

| Caminho | O que mostra |
|---|---|
| `/` | a página (`index.html`) |
| `/v2` | a mesma página (regra 200 no `_redirects`; a URL não muda) |
| `/captura-google` | a mesma página (idem) |
| `/obrigado`, `/obrigado-google` | redirecionam (302) para https://blackvitalicia.facialacademy.com.br/ |

Os três links de captura existem porque já estavam nos anúncios (Meta A, Meta B
e Google). O LeadHero recebe o caminho de cada cadastro no campo `URL`.

## Como publicar

O projeto do Cloudflare Pages (`facial-lives-black-november-setembro-26`) é ligado
a este repositório:

- **push na `main` publica sozinho** em produção, em cerca de 1 minuto;
- push em outro branch gera uma prévia em
  `https://<branch>.facial-lives-black-november-setembro-26.pages.dev`.

Fluxo recomendado: branch, prévia, conferir, PR e merge na `main`. Não há build:
a raiz do repositório é a pasta publicada (por isso `README.md` também sai no
domínio; não coloque nada sigiloso aqui).

**Cache.** A zona `facialacademy.com.br` entrega CSS e JS com 31 dias de cache,
apesar do `_headers`. **Ao mudar um CSS, JS, imagem ou vídeo, troque o nome do
arquivo** (`style-aulas.v1.css` vira `style-aulas.v2.css`) e atualize o
`index.html`. Editar mantendo o nome faz quem já visitou ver a versão antiga.

## Como rodar local

```bash
python3 -m http.server 4173
```

Abra `http://localhost:4173`. Precisa de servidor por causa das fontes e do
vídeo. As regras do `_redirects` (o `/v2` e o `/captura-google`) só valem no
Pages, não no servidor local.

**Não envie o formulário na prévia local nem na prévia de branch.** Ele posta no
LeadHero de verdade: um e-mail novo vindo de um host fora das origens oficiais
cai na fila de aprovação e dispara WhatsApp para o aprovador. Para testar o
fluxo, responda o LeadHero no próprio teste (ex.: `page.route` do Playwright).

## Arquivos da página

```
index.html                       a página (as três capturas)
_redirects                       /v2 e /captura-google mostram a página; obrigados → vendas
_headers                         política de cache
assets/css/style-aulas.v1.css    estilos (base da captura B + layout das aulas)
assets/js/main-aulas.v1.js       rolagem, vídeo, pop-ups e envio do formulário
assets/js/conversao.v2.js        eventos de conversão (Lead e CompleteRegistration)
assets/js/lh-rastreio.v2.js      IP, localização, pixel e id do visitante no cadastro
assets/js/lh-interacoes.v2-1.js  formulário começado/enviado/abandonado e cliques
assets/js/lenis.min.js           scroll suave
assets/js/intlTelInput.min.js    campo de telefone internacional
assets/js/intlTelInputUtils.js   validação do número, carregada sob demanda
assets/video/live-fundo.mp4      vídeo do fundo do hero (20 s, 960x800, sem som, 670 KB)
assets/img/live-fundo-poster.webp primeiro quadro do vídeo (aparece antes dele carregar)
assets/img/aula-labio-*.webp     foto do card da aula 1 (720/1200w)
assets/img/aula-planejamento-*.webp foto do card da aula 2 (720/1200w)
assets/img/logo-facialacademy.svg logo do topo e do rodapé
assets/fonts/                    Silka (5 pesos) e Poppins de reserva
```

Os demais arquivos de `assets/` e as páginas `obrigado*.html` são da campanha
anterior (ver "Histórico") e não aparecem nesta página.

## Onde mudar cada coisa

| O quê | Onde |
|---|---|
| Textos, títulos, itens das aulas | `index.html` |
| Datas | `index.html`: tarja do topo, os dois cards e o cronômetro (script logo abaixo do `.timer`, lista `T` em UTC: 19h de Brasília = 22h UTC) |
| Link do grupo | `index.html`, `href` do `#link-grupo` (hoje `https://sndflw.com/i/facialacademyaovivo`) |
| Tempo até abrir o grupo | `main-aulas`, `SEGUNDOS` (hoje 6) |
| Lista do LeadHero | `main-aulas`, `ENDPOINT` (hoje a mesma da Black) |
| Marca da campanha no lead | `main-aulas`, `pagina_captura` (hoje `aulas-fim-de-ano`) |
| Política de Privacidade e Termos | links no card do formulário e no rodapé |

## O formulário e o que acontece depois

1. A pessoa preenche nome completo, e-mail e WhatsApp. A validação é local: nome
   com 2 ou mais letras, e-mail com formato válido e WhatsApp conferido pelo
   intl-tel-input. Campo errado fica marcado e nada é enviado.
2. `POST` para o LeadHero (`lead-capture-rapido`, lista da Black), com `nome`,
   `sobrenome`, `email`, `telefone` (E.164), todos os `utm_*` da URL, os dados do
   `lh-rastreio`, `pagina_captura: "aulas-fim-de-ano"` e `URL`.
3. A resposta decide:
   - `redirect` preenchido (triagem anti-spam): a pessoa vai direto para esse
     endereço, sem pop-up;
   - cadastro aceito: conta o lead (`fa_black_lead`) e abre o pop-up do grupo;
   - erro 4xx: a pessoa fica na página, com mensagem, e pode tentar de novo;
   - sem resposta em 4 s (`TETO_MS`): abre o pop-up mesmo assim, sem contar o
     lead (o cadastro segue do lado do LeadHero).
4. **Pop-up do grupo:** "Obrigado, <primeiro nome>!", o andamento ("Cadastro
   recebido" e "Abrindo o grupo no WhatsApp" com a barra e os segundos), o aviso
   vermelho de que a Facial Academy não envia ofertas por mensagem privada (o
   mesmo do obrigado antigo) e o botão "Entrar no grupo agora". Em 6 s a pessoa
   vai sozinha para o grupo; o botão leva na hora. O pop-up não fecha (é a
   passagem para o grupo).
5. Na ida ao grupo, conta `fa_black_complete_registration` (uma vez por pessoa).

Não há mais página de obrigado nesta campanha.

## Conversões e GTM

- O GTM é o mesmo da Black (snippet no `<head>`, container GTM-TBM4NXBQ via
  tracker da Jornada).
- `conversao.v2.js` empurra `fa_black_lead` e `fa_black_complete_registration`
  no formato da tag 268 do container. As tags de GA4 (`generate_lead`,
  `complete_registration`) e Pixel (`Lead`, `CompleteRegistration`) que
  respondem a esses eventos olham só o domínio e o `black26.event_id`, então
  funcionam nos três caminhos sem mexer no GTM.
- **O formulário se chama `aula-form`, nunca `fa-form`.** A tag 268 assume o
  envio do formulário `fa-form` na raiz e manda a pessoa para o `/obrigado`
  antigo, que hoje redireciona para a página de vendas.
- O registro da sessão fica no `sessionStorage` (`fa_black26_accepted_v1`, 1 hora):
  a mesma pessoa cadastrada de novo dentro da hora não conta outro lead.

## Layout e movimento

- **Tarja** com as datas; **hero** com a marca e o cronômetro até a próxima aula
  (nas duas horas de cada aula mostra "A aula está ao vivo agora"), título,
  texto, quem dá as aulas e o formulário em vidro; **as duas aulas** em cards
  com foto em quadro arredondado, data, título e itens; botão que abre o
  formulário num pop-up (o mesmo formulário do hero, movido para o `<dialog>`);
  **rodapé**.
- Fundo preto contínuo com luzes por seção, Silka, ícones Phosphor, dourado
  (`--gold`) em datas e rótulos, verde só nas ações: a linguagem da captura B.
- **Vídeo do hero** (sem som, em loop): três trechos das lives do Dr. Wagner,
  com o chat do monitor desfocado (aparecem nomes de alunos). Só toca com o hero
  na tela; com `prefers-reduced-motion` fica parado no pôster.
- Hero entra por CSS (só deslocamento, por causa do LCP); o resto revela pela
  rolagem (`animation-timeline: view()`), terminando no meio da tela. No
  Firefox a revelação é por bloco (JS). Mouse/trackpad: o vídeo e a luz do hero
  seguem o ponteiro, os cards acendem. `prefers-reduced-motion` desliga tudo.
- No celular a tarja substitui o selo "Aulas ao vivo e gratuitas" do hero, para
  o botão de envio caber na primeira tela (conferido em 360x640 e 390x844).

## Origem das imagens e do vídeo

Drive compartilhado `FA 004 - BANCO DE IMAGENS/Fotos`:

- **Vídeo:** `4. LIVES/LIVE WAGNER/Vídeos`: `DD-5349.MP4` (3,4 a 9,5 s),
  `DD-5367.MP4` (0,5 a 8 s) e `IMG_2130.MOV` (3 a 11 s, chat desfocado).
  Gravações verticais em 4K recortadas na horizontal:

  ```bash
  ffmpeg -ss 3.4 -t 6.1 -i DD-5349.MP4 -ss 0.5 -t 7.5 -i DD-5367.MP4 -ss 3 -t 8 -i IMG_2130.MOV \
    -filter_complex "[0:v]crop=2160:1800:0:1018,scale=960:800,fps=24,setsar=1,format=yuv420p[a];[1:v]crop=2160:1800:0:100,scale=960:800,fps=24,setsar=1,format=yuv420p[b];[2:v]split[c0][c1];[c1]crop=780:1240:820:1645,boxblur=22:2[cb];[c0][cb]overlay=820:1645,crop=2160:1800:0:1150,scale=960:800,fps=24,setsar=1,format=yuv420p[c];[a][b]xfade=transition=fade:duration=0.7:offset=5.4[ab];[ab][c]xfade=transition=fade:duration=0.7:offset=12.2,format=yuv420p[v]" \
    -map "[v]" -an -c:v libx264 -preset slow -crf 31 -profile:v high -movflags +faststart live-fundo.mp4
  ```

- **Aula 1:** `4. LIVES/LIVE WAGNER/IMG_5079.JPG`, recorte 16:10.
- **Aula 2:** `4. LIVES/LIVE WAGNER/.com.apple.Foundation.NSItemProvider.vTrlX7.JPG`,
  recorte 16:10.

## Testes feitos (30/10/2026)

Sem rede, com o LeadHero respondido pelo próprio teste:
- cadastro aceito: lead contado, pop-up com o nome e ida ao grupo novo depois da contagem;
- clique no botão do pop-up: leva ao grupo na hora;
- triagem com `redirect`: segue para o endereço da triagem;
- LeadHero sem resposta: pop-up em 4 s, sem conversão;
- erro 400: fica na página, com mensagem e botão liberado;
- validação: nada é enviado.

Capturas em 1920x1080, 1440x900, 1366x768, 390x844 e 360x640, sem rolagem
lateral; movimento reduzido.

---

# Histórico: captura da Black Vitalícia (05/10 a 23/10/2026)

Antes desta página, o domínio tinha a captura da Black Vitalícia (revelação ao
vivo em 19/10/2026, 19h), suas cópias para o Google Ads e o teste A/B (`/v2`),
mais as páginas de obrigado. Em 23/10 as capturas passaram a redirecionar para
a página de vendas; em 26/10 os obrigados também; em 30/10 as capturas viraram
esta página. `v2.html` e `captura-google.html` saíram do repositório (estão no
histórico do git); o `index.html` antigo está no commit `b127e43`. O texto abaixo
é o registro daquela campanha.

Começou como réplica fiel da página `/black-friday-2026` feita no Framer (altura
e posição das seções batiam com o original nos três breakpoints). Em 05/10/2026
ganhou layout próprio no tema da campanha, **A Fantástica Fábrica da HOF**: roxo e
dourado do Wonka, a Dra. Camila Dias e o Dr. Wagner Baseggio de cartola no hero e
o bilhete dourado no fechamento. Ver "Layout" abaixo.

## Estrutura (na época)

```
index.html                         captura: hero, 3 seções e rodapé
obrigado.html                      página de obrigado (entrada no grupo de WhatsApp)
captura-google.html                cópia da captura para o Google Ads (/captura-google)
obrigado-google.html               cópia do obrigado para o Google Ads (/obrigado-google)
v2.html                            captura B do teste A/B por anúncio (/v2, ver abaixo)
_headers                           política de cache (ver "Cache e nomes de arquivo")
assets/css/style.v12.css           estilos da captura, @font-face (Silka e Poppins),
                                   intl-tel-input e breakpoints (≥1200 / 810-1199 / ≤809)
assets/css/obrigado.v7.css         estilos da página de obrigado
assets/js/main.v7.js               scroll suave, revelação de fallback e formulário
assets/js/main-google.v7-1.js      main.v7.js da captura-google: manda para /obrigado-google
assets/css/style-b.v1.css          estilos da v2 (base da A + layout próprio)
assets/js/main-b.v1.js             main da v2: pop-up do formulário e pagina_captura B
assets/js/conversao-google.v1.js   Lead e CompleteRegistration nas páginas do Google (ver abaixo)
assets/js/lh-rastreio.v2.js        IP, localização, pixel e id do visitante no cadastro
assets/js/lh-interacoes.v2-1.js    formulário começado/enviado/abandonado e cliques
assets/js/lenis.min.js             scroll suave
assets/js/intlTelInput.min.js      campo de telefone internacional (build base)
assets/js/intlTelInputUtils.js     validação do número, carregada sob demanda
assets/fonts/Silka*.woff2          família Silka (5 pesos)
assets/fonts/Poppins*.woff2        reserva da Silka (5 pesos, latin)
assets/img/fa-bfriday26-*.webp     marca do topo das duas páginas (320/480/740w)
assets/img/professores-*.webp      recorte da Dra. Camila e do Dr. Wagner (399/664w)
assets/img/bilhete-recorte-*.webp  bilhete dourado recortado (sem o veludo), fechamento (480/860w)
assets/img/camila-bilhetes-*.webp  Dra. Camila com os bilhetes, seção da frase (640/1100w)
assets/img/cinema-*.webp           professores no cinema, seção "A sessão" (720/1200w)
assets/img/                        luz do hero, logo do rodapé e bandeiras do seletor de país
```

## Layout

Ordem: hero com formulário, "Black Friday acontece uma vez por ano", "Vitalícia
não é força de expressão", "A sessão", "Seu bilhete dourado" e rodapé.

- **Fundo contínuo.** Não há faixas nem imagens de fundo por seção. A página
  tem um preto só (`--black`) e cada seção acende uma luz radial (`::before`,
  `z-index: -1` no contexto do `<main>`, então nenhuma luz passa por cima de
  texto). A luz ocupa sempre a largura inteira da tela (`width: 100vw`): presa
  à caixa da seção (máx. 1440px), a borda aparecia como corte vertical em tela
  larga. Só o hero tem imagem (`hero-bg.webp`), que se dissolve ao longo de 70%
  da altura dele, com uma ponte de luz roxa (platô longo) cobrindo a passagem
  para a lista. `main` tem `overflow-x: clip`. Conferido por medição (sem
  costuras verticais e sem vales de luminosidade) em 2560, 1920, 1440, 1080 e
  390px.
- **Hero.** Marca, linha dourada "A Fantástica Fábrica da HOF · 19 de outubro,
  às 19h", título, lead com o que a live revela, formulário "Entre na lista" e
  uma linha sobre o que acontece depois do cadastro. Os professores (recorte com
  fundo transparente): a partir de 1360px entre o texto e o card; abaixo disso,
  logo depois do formulário.
- **Uma vez por ano.** Título à esquerda; à direita "12 meses" uma vez só,
  grande em dourado, e as três frases em branco com fio fino entre elas.
- **Vitalícia não é força de expressão.** Em camadas: a foto da Dra. Camila com
  os bilhetes fica atrás, entre as duas metades da frase, sem caixa (bordas em
  fade) e sem escurecer. A frase cruza só as bordas já esmaecidas ("força de
  expressão." começa na coluna 8; em uma coluna, o fade de baixo começa em 60%),
  então os bilhetes ficam inteiros e a leitura não depende de véu: fundo real
  sob as letras com os 2% piores acima de 6:1 de 360 a 1440px. O texto termina
  com "O que você aprende, não." em destaque e o que "vitalícia" quer dizer.
- **A sessão.** Foto no cinema sem moldura e o passo a passo: lista, grupo do
  WhatsApp (silencioso, só avisos), live de segunda-feira, 19/10, às 19h em
  ponto, no YouTube.
- **Seu bilhete dourado está aqui.** O bilhete recortado, com sombra, sob a luz
  dourada; no celular vem primeiro. Convite para entrar na lista e acessar o
  grupo (o bilhete não é enviado pelo WhatsApp). Botão no mesmo verde do
  formulário (`#cadastro`).
- **Cores.** Roxo e ameixa nas luzes, dourado do selo da marca (`--gold:
  #ecc485`) em data, número e rótulos, verde só nas ações. Contraste AA medido
  em pixel (celular e desktop), placeholder em 6,9:1.
- **Fontes.** Silka, com Poppins de reserva e depois `system-ui`, igual ao design
  system do Workshops Facial. A Poppins é local e só baixa se a Silka falhar.

## Movimento

- **Scroll suave** com Lenis.
- **Hero** entra no carregamento, por CSS (só deslocamento: a opacidade fica em 1
  para não atrasar o LCP).
- **Demais blocos** revelam pela rolagem com `animation-timeline: view()`,
  terminando no centro da tela (`animation-range: entry 0% cover 50%`). Curva
  linear de propósito: ali ela mapeia a posição da rolagem, e com ease-out o bloco
  ficava 98% visível ainda no terço de baixo.
- Navegador sem suporte (Firefox): entrada por bloco disparada pelo JS
  (`IntersectionObserver` com varredura por posição de reserva).
- Saiu a revelação palavra a palavra com desfoque: cada palavra virava uma camada
  com `filter` e um parágrafo longo levava mais de 2 s para terminar.
- O bilhete dourado entra girando de leve e fica reto quando chega ao centro
  da tela (mesma linha do tempo da rolagem).
- `prefers-reduced-motion` desliga tudo, inclusive a pulsação do botão.
- Sem JS, nada fica invisível (o estado inicial depende da classe `.js` no `body`).

## Página de obrigado

`obrigado.html` partiu do arquivo `Pagina-Obrigado-ENVIAR.html`, trocando fontes e
imagens embutidas em base64 pelos arquivos que as duas páginas compartilham (de
1,1 MB para ~2,5 KB de HTML).

O botão aponta para o link rotativo do Sendflow
(`https://sndflw.com/i/blackfriday2026`), que distribui as pessoas entre os
grupos conforme eles enchem. Para trocar o destino, mexa no Sendflow, sem
republicar a página.

Cabe em uma dobra sem rolagem (conferido em 360x640, 375x667, 390x844 e 1440x900).

## Primeira dobra no celular

No celular o hero ocupa ao menos a altura da tela (`100svh`) e o formulário
inteiro (data, três campos e botão) cabe sem rolagem. Marca com 94px de altura
(75px em telas de até 680px de altura), título 36px, campos de 44px.

Conferido em 05/10/2026 (página reformulada): o botão termina em 548px em
360x640, 604px em 390x844 e 513px em 1440x900. Abaixo dele, no celular, aparecem
os professores.

## Cache e nomes de arquivo

O `_headers` pede cache de um ano para `assets/fonts/` e `assets/img/`, e
revalidação para `assets/css/`, `assets/js/` e os HTML.

Na prática, CSS e JS saem com `max-age=2678400` (31 dias, medido em
05/10/2026); só os HTML respeitam o `max-age=0`. 31 dias é exatamente a opção
"1 mês" do Browser Cache TTL, que é configuração da zona facialacademy.com.br
inteira. Essa é a causa provável, e não o Pages. Mudar a zona afeta todos os
subdomínios, então a regra continua sendo:

**Ao mudar o conteúdo de um CSS, JS ou imagem, troque o nome do arquivo**
(`style.v12.css`, `lh-rastreio.v2.js`). Editar mantendo o mesmo nome faz
visitantes recorrentes receberem a versão antiga por até 31 dias. Foi o que
aconteceu uma vez: a página foi ao ar com o CSS anterior em cache e a lista de
244 países do campo de telefone apareceu aberta dentro do formulário.

Os scripts `lh-rastreio` e `lh-interacoes` vêm do repo lead-vision-buddy. Ao
atualizar, entre com a versão nova no nome em vez de sobrescrever o arquivo.

## Desempenho

Medições do PageSpeed (mobile, Moto G Power emulado) antes dos ajustes:
desempenho 54 e 62 em duas execuções seguidas, LCP 3,8-4,5s, TBT 2.930ms e
630ms. A variação enorme entre execuções vem do stack de rastreamento, não da
página.

O que foi feito do lado da página:

- Logo do topo (elemento de LCP) com preload e `fetchpriority="high"`. Desde
  05/10/2026 é a marca `fa-bfriday26`, gerada do PNG de 857px em WebP de 256
  cores sem perda, em `srcset` de 320w/480w/740w (16, 27 e 46 KB). Ficou mais
  leve e mais fiel que WebP com perda na qualidade 90 (32, 55 e 92 KB), que
  borrava as bordas finas da marca. Antes era um webp em `srcset` de 394w/612w
  (eram 143 KB de imagem 1024px para exibir a 306px).
- Um único CSS por página: as três folhas em série somavam 790ms bloqueando
  a renderização.
- `intl-tel-input` no build base (40 KB), com `utils.js` sob demanda em vez do
  bundle de 309 KB no carregamento inicial.
- O hero entra por animação CSS. Ele era revelado pelo JS no evento `load`,
  que só dispara depois de todo o rastreamento carregar — e como o LCP ignora
  elemento invisível, o LCP ficava preso a isso (10,2s numa medição).
- As demais seções revelam por `IntersectionObserver`, com uma varredura por
  posição como rede de segurança: o observer não avisa quando um elemento é
  ultrapassado de uma vez (recarregar no meio da página, rolagem rápida) e o
  bloco ficaria invisível para sempre. As posições são medidas uma vez, então
  a checagem no scroll não lê layout nem força reflow.
- `preconnect` para as duas origens de rastreamento que o Lighthouse aponta
  como as que mais atrasam o LCP.

O teto, porém, é o rastreamento: no relatório, GTM, Facebook Pixel, o
`capiParamBuilder` da AWS e o loader do tracker somavam cerca de 5s de trabalho
na thread principal e 388 KiB de JavaScript não usado. O container também
carrega duas vezes (o evento `gtm.js` dispara duplicado), o que vale conferir
no painel do GTM.

## Formulário

Os leads vão direto do navegador para o LeadHero, sem intermediário:

```
POST https://ilzpqehbbxvmogorpfma.supabase.co/functions/v1/lead-capture-rapido/<uuid>
```

O endpoint é público e write-only — o UUID na URL identifica empresa e pipeline,
e o CORS é liberado, então não existe backend nem chave de API no meio. A
configuração fica em `ENDPOINT`, em `assets/js/main.v7.js` e na cópia
`main-google.v7-1.js`.

É o `lead-capture-rapido`, não o `lead-capture-api`: ele decide a saída do
cadastro (anti-spam do SendFlow, quem já recebeu o link, página oficial ou
pendente de aprovação), responde `{ pagina, redirect }` e só então cadastra,
repassando ao `lead-capture-api` — que segue sendo o dono da captura. Regra
completa em `docs/triagem-captura-black.md`, no repo do LeadHero.

Corpo enviado: `nome`, `sobrenome`, `email`, `telefone` (E.164, ex.
`+5545999998888`) e **todos** os parâmetros `utm_*` que estiverem na URL —
inclusive os fora da lista padrão, como `utm_id`. O campo "Nome completo" é
dividido: primeira palavra em `nome`, o resto em `sobrenome`.

Validação antes de enviar: nome com ao menos 2 caracteres, e-mail com formato
válido e WhatsApp conferido de verdade pelo intl-tel-input. O contrato só exige
o e-mail; os outros dois são exigência da campanha, cujo funil termina no
WhatsApp.

Resposta 4xx (e-mail inválido, integração inativa) mantém a pessoa na página,
com mensagem e o botão liberado para tentar de novo. Em caso de sucesso, o
destino vem da resposta: `redirect` preenchido leva para lá (hoje, a página de
aguarde de quem está no anti-spam); sem `redirect`, vai para o obrigado.

A espera pela decisão tem teto de 4s (`TETO_MS`): estourou, a pessoa vai para o
obrigado do mesmo jeito — o cadastro continua acontecendo do lado do LeadHero.

**Origem oficial:** a triagem só trata como "página oficial" o host do `Origin`
do POST que estiver em `regra_triagem.origens_oficiais` da integração. Teste com
e-mail NOVO fora desses hosts (preview de branch, localhost) cai em **aprovação**
— não cadastra, e o aprovador recebe um WhatsApp.

## Páginas do Google Ads

`/captura-google` e `/obrigado-google` são cópias integrais da captura e do
obrigado para o tráfego do Google Ads (05/10/2026). Diferenças:

- `captura-google.html` carrega `main-google.v7-1.js`, que muda o destino depois
  do cadastro para `/obrigado-google` e conta a conversão (abaixo).
- `obrigado-google.html` leva ao Sendflow `https://sndflw.com/i/ads-blackfridayfacial`.

Qualquer mudança na captura ou no obrigado precisa ser repetida nas cópias.

**GTM:** na captura `/`, quem envia o formulário é a tag 268 do container
GTM-TBM4NXBQ (HTML personalizado com `fa_black26_accepted_v1` no código). Ela
intercepta o envio, posta no LeadHero, empurra `fa_black_lead` (que vira
`generate_lead` no GA4 e `Lead` no Pixel) e manda para `/obrigado`. O
`main.v7.js` só envia quando o GTM não carrega. No obrigado, a mesma tag empurra
`fa_black_complete_registration` no clique do link `blackfriday2026`. Ela só roda
em `/` e `/obrigado`, e a conta do Eddie não tem acesso ao container. Por isso as
páginas do Google empurram os mesmos dois eventos, no mesmo formato, pelo
`conversao-google.v1.js`: as tags de GA4 e Pixel que respondem a eles só olham o
domínio e o `black26.event_id`, não o caminho. O registro da sessão é o mesmo da
tag (`fa_black26_accepted_v1`): se um dia ela também rodar nessas páginas, na
captura ela intercepta o envio antes do `main-google`, e no obrigado o primeiro a
tratar o clique marca o evento como enviado e o outro não repete.

## Captura B (/v2)

Teste A/B de captura, dividido por anúncio (08/10/2026). Mesmo formulário, mesmo
LeadHero e mesmo `/obrigado` da página A; muda o conteúdo (copy dos slides) e o
layout. Fica fora do índice (`noindex`).

- O corpo enviado ao LeadHero leva `pagina_captura: "B"`; o campo `URL` (do
  `lh-rastreio`) também traz o `/v2`.
- A conversão `fa_black_lead` sai pelo `conversao-google.v1.js` (a tag 268 não
  roda em `/v2`). O registro de sessão é o mesmo da tag, então no `/obrigado` a
  tag 268 conta o clique no grupo como em qualquer cadastro da A.
- Cronômetro até 19/10/2026, 19h de Brasília (22h UTC), só horas, minutos e
  segundos; o script fica inline logo depois dele.
- Os botões "Garantir acesso vitalício" fora do hero têm `data-abre-cadastro`:
  o `main-b` move o card do hero para um `<dialog>` e devolve ao fechar (um
  formulário só). Sem JS, o link leva ao `#cadastro`.
- A lista de países do telefone abre dentro do card (`useFullscreenPopup:
  false`): no padrão do celular ela abriria presa ao `<body>`, atrás do pop-up.
- Fotos: originais da pasta `Design - Eddie/Framer/Pagina Facial Academy/assets`,
  só recortadas no procedimento e convertidas para WebP: IMG-65 no fundo do
  hero (`aplicacao-fundo-*`), IMG-106 na Vitalícia, IMG-62 nos cursos, IMG-11
  na sessão. Capas: as 13 de `Black Vitalicia - Framer/assets/capas`, em 360x480.
- Movimento: entrada do hero por tempo (só deslocamento, por causa do LCP);
  o resto ligado à rolagem (`animation-timeline`), terminando no meio da
  tela. A foto do hero tem parallax (rolagem e mouse); a "esteira" de capas
  logo abaixo do hero anda sozinha só na tela e depois do load. Mouse/trackpad:
  luz nos grupos de cursos, capas e bilhete inclinam. Tudo para com
  `prefers-reduced-motion`; no Firefox, a revelação é por bloco (main-b).
- Luzes de fundo: cada degradê apaga antes da borda da própria caixa (72% do
  raio). Se a luz encostar na borda, aparece uma linha seca entre seções.

Mudança no formulário ou no rastreio da A precisa ser repetida aqui.

## Observações

- As imagens de fundo, os logos e os ícones foram baixados do CDN do site original
  e estão em `assets/img/` — o conteúdo é da Facial Academy.
- A Silka é uma fonte comercial; os arquivos aqui são os mesmos servidos pela
  página publicada. Confirme o licenciamento antes de publicar em outro domínio.
- Datas, textos e links (Termos de Uso, Política de Privacidade) foram copiados do
  original e devem ser atualizados para a campanha nova.
