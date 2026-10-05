# Black Vitalícia · captura e obrigado

Landing de captura da Black Vitalícia da Facial Academy (revelação ao vivo em
19/10/2026, 19h) e a página de obrigado, em HTML/CSS/JS puro, publicadas no
Cloudflare Pages.

Começou como réplica fiel da página `/black-friday-2026` feita no Framer (altura
e posição das seções batiam com o original nos três breakpoints). Em 05/10/2026
ganhou layout próprio no tema da campanha, **A Fantástica Fábrica da HOF**: roxo e
dourado do Wonka, a Dra. Camila Dias e o Dr. Wagner Baseggio de cartola no hero e
o bilhete dourado no fechamento. Ver "Layout" abaixo.

## Como rodar

```bash
python3 -m http.server 4173
```

Depois abra `http://localhost:4173`. Precisa de servidor HTTP por causa das fontes
`.woff2`: abrindo o `index.html` direto pelo `file://` a Silka não carrega.

**Não envie o formulário na prévia local**: ele posta no LeadHero de verdade, e
um e-mail novo vindo de um host fora das origens oficiais cai na fila de
aprovação e dispara WhatsApp para o aprovador (ver "Formulário").

## Estrutura

```
index.html                         captura: hero, 3 seções e rodapé
obrigado.html                      página de obrigado (entrada no grupo de WhatsApp)
_headers                           política de cache (ver "Cache e nomes de arquivo")
assets/css/style.v12.css           estilos da captura, @font-face (Silka e Poppins),
                                   intl-tel-input e breakpoints (≥1200 / 810-1199 / ≤809)
assets/css/obrigado.v7.css         estilos da página de obrigado
assets/js/main.v7.js               scroll suave, revelação de fallback e formulário
assets/js/lh-rastreio.v2.js        IP, localização, pixel e id do visitante no cadastro
assets/js/lh-interacoes.v2-1.js    formulário começado/enviado/abandonado e cliques
assets/js/lenis.min.js             scroll suave
assets/js/intlTelInput.min.js      campo de telefone internacional (build base)
assets/js/intlTelInputUtils.js     validação do número, carregada sob demanda
assets/fonts/Silka*.woff2          família Silka (5 pesos)
assets/fonts/Poppins*.woff2        reserva da Silka (5 pesos, latin)
assets/img/fa-bfriday26-*.webp     marca do topo das duas páginas (320/480/740w)
assets/img/professores-*.webp      recorte da Dra. Camila e do Dr. Wagner (399/664w)
assets/img/bilhete-dourado-*.webp  bilhete dourado do fechamento (560/1000w)
assets/img/cinema-*.webp           professores no cinema, seção "A sessão" (720/1200w)
assets/img/                        luz do hero, logo do rodapé e bandeiras do seletor de país
```

## Layout

Ordem: hero com formulário, "Black Friday acontece uma vez por ano", "Vitalícia
não é força de expressão", "A sessão" e "Pra sempre com você", rodapé.

- **Fundo contínuo.** Não há faixas nem imagens de fundo por seção. A página
  tem um preto só (`--black`) e cada seção acende uma luz radial maior do que
  ela (`::before`, `z-index: -1` no contexto do `<main>`, então nenhuma luz passa
  por cima de texto). As luzes se sobrepõem na passagem de uma seção para outra:
  não existe borda que vire corte. Só o hero tem imagem (`hero-bg.webp`), que se
  dissolve no fundo ao longo de 60% da altura dele. `main` tem `overflow-x:
  clip` para as luzes não abrirem rolagem lateral. Degradê conferido sem faixas
  (banding), por isso não há textura de ruído.
- **Hero.** Marca, data em dourado, título, texto e formulário ("Entre na
  lista"), com uma linha abaixo do botão dizendo o que acontece depois do
  cadastro. Os professores (recorte com fundo transparente, com legenda):
  - a partir de 1360px: entre o texto e o card, com a largura calculada pelo vão
    para os dois rostos ficarem inteiros;
  - de 810 a 1359px (inclui monitor vertical de 1080px) e no celular: logo
    abaixo do formulário, centralizados.
- **Uma vez por ano.** Título à esquerda e lista editorial à direita: "12 meses"
  grande em dourado, frase ao lado, fio fino entre os itens.
- **Vitalícia não é força de expressão.** Tipografia em escada no desktop; no
  celular, um bloco só com a mesma entrelinha.
- **A sessão.** Foto dos professores no cinema, sem moldura (some no fundo pelas
  bordas), e o passo a passo: lista, grupo do WhatsApp, live de segunda-feira,
  19/10, às 19h em ponto, no YouTube (dados do bilhete e da página de obrigado).
- **Pra sempre com você.** Texto à esquerda e bilhete dourado à direita; no
  celular, o bilhete vem primeiro. Botão no mesmo verde do formulário, levando
  ao formulário (`#cadastro`).
- **Cores.** Roxo e ameixa nas luzes, dourado do selo da marca (`--gold:
  #ecc485`) para data, números e rótulos, verde só nas ações. Contraste AA
  medido em pixel em 05/10/2026: 36 medições no celular e no desktop.
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
(75px em telas de até 680px de altura), título 30px, campos de 44px.

Conferido em 05/10/2026 (página reformulada, marca menor): o botão termina em
531px em 360x640, 579px em 390x844 e 524px em 1440x900. Abaixo dele, no celular, aparecem
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
configuração fica em `ENDPOINT`, em `assets/js/main.v6.js`.

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

## Observações

- As imagens de fundo, os logos e os ícones foram baixados do CDN do site original
  e estão em `assets/img/` — o conteúdo é da Facial Academy.
- A Silka é uma fonte comercial; os arquivos aqui são os mesmos servidos pela
  página publicada. Confirme o licenciamento antes de publicar em outro domínio.
- Datas, textos e links (Termos de Uso, Política de Privacidade) foram copiados do
  original e devem ser atualizados para a campanha nova.
