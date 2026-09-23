# Black Vitalícia — réplica da landing `/black-friday-2026`

Reprodução fiel, em HTML/CSS/JS puro, da página publicada em
`https://www.facialacademy.com.br/black-friday-2026` (originalmente feita no Framer).

Layout, tipografia, cores, imagens, ícones e efeitos foram medidos diretamente na
página publicada e reconstruídos aqui. A altura e a posição de todas as seções
coincidem com o original nos três breakpoints:

| Largura | Original | Réplica |
|---|---|---|
| 1440px (desktop) | 3329px | 3328px |
| 900px (tablet)   | 3372px | 3372px |
| 375px (mobile)   | 4023px | 4023px |

## Como rodar

```bash
python3 -m http.server 4173
```

Depois abra `http://localhost:4173`. (Precisa de servidor HTTP por causa das fontes
`.woff2` — abrir o `index.html` direto pelo `file://` não carrega a Silka.)

## Estrutura

```
index.html                  captura — marcação completa (hero, 3 seções e rodapé)
obrigado.html               página de obrigado (entrada no grupo de WhatsApp)
assets/css/silka.css        @font-face da Silka, compartilhado pelas duas páginas
assets/css/style.css        estilos da captura + breakpoints (≥1200 / 810–1199 / ≤809)
                            — as mesmas quebras usadas no site original
assets/css/obrigado.css     estilos da página de obrigado
assets/js/main.js           scroll suave, revelações e formulário
assets/js/lenis.min.js      scroll suave (mesma lib usada no site original)
assets/js/intlTelInputWithUtils.min.js   campo de telefone internacional
assets/css/intlTelInput.min.css
assets/fonts/Silka*.woff2   família Silka (5 pesos)
assets/img/                 imagens de fundo, logos e bandeiras do seletor de país
```

## Efeitos reproduzidos

- **Scroll suave** com Lenis, igual ao site publicado.
- **Revelação palavra a palavra**: cada palavra entra com `opacity .001 → 1`,
  `blur(10px) → 0` e `translateY(10px) → 0`, escalonada em 40ms — os mesmos valores
  medidos no original. Aplicada em qualquer elemento com a classe `anim-words`.
- **Fade-up** em blocos (`anim` + `data-delay` opcional) ao entrar na viewport.
- Hero anima no carregamento; o restante, conforme a rolagem.
- `prefers-reduced-motion` desliga todas as animações.
- Sem JS, nada fica invisível (o estado inicial depende da classe `.js` no `body`).

## Página de obrigado

`obrigado.html` reproduz o arquivo `Pagina-Obrigado-ENVIAR.html` com o mesmo layout
(conferido caixa a caixa), trocando as fontes e imagens embutidas em base64 pelos
arquivos que as duas páginas já compartilham — de 1,1 MB para ~2,5 KB de HTML.

O botão aponta para o link rotativo do Sendflow
(`https://sndflw.com/i/blackfriday2026`), que distribui as pessoas entre os
grupos conforme eles enchem. Para trocar o destino, mexa no Sendflow — não
é preciso republicar a página.

Cabe em uma dobra até em telas de 668px de altura, sem rolagem.

## Primeira dobra no celular

No celular o hero ocupa a altura da tela (`100svh`) e o conteúdo fica
centralizado, para o formulário inteiro — os três campos, o botão e a data —
caber sem rolagem. A escala é menor que a do site original: logo 128px, título
30px, campos de 44px. Há um nível extra para telas de até 680px de altura,
onde logo e espaçamentos encolhem mais; a área de toque dos campos é
preservada nos dois.

Conferido em 360x640, 375x667, 390x844 e 412x915: o formulário inteiro aparece
na primeira dobra nos quatro.

## Cache e nomes de arquivo

O `_headers` dá cache de um ano para `assets/fonts/` e `assets/img/`, e faz
`assets/css/`, `assets/js/` e os HTML revalidarem.

**Ao mudar o conteúdo de um CSS, JS ou imagem, troque o nome do arquivo**
(`style.v2.css`, `logo-fabrica-hof-612.webp`). O Cloudflare Pages sobrescreve
o `max-age` que pedimos e mantém 31 dias nos assets, então editar mantendo o
mesmo nome faz visitantes recorrentes receberem a versão antiga — foi o que
aconteceu uma vez: a página foi ao ar com o CSS anterior em cache e a lista de
244 países do campo de telefone apareceu aberta dentro do formulário.

## Desempenho

Medições do PageSpeed (mobile, Moto G Power emulado) antes dos ajustes:
desempenho 54 e 62 em duas execuções seguidas, LCP 3,8-4,5s, TBT 2.930ms e
630ms. A variação enorme entre execuções vem do stack de rastreamento, não da
página.

O que foi feito do lado da página:

- Logo do topo (elemento de LCP) em `srcset` de 394w/612w com
  `fetchpriority="high"` — eram 143 KB de imagem 1024px para exibir a 306px.
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
