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

**Antes de publicar:** troque o `href` do botão pelo convite real do grupo:

```html
<a class="btn" id="link-grupo" href="#COLAR-LINK-DO-GRUPO">
```

Cabe em uma dobra até em telas de 668px de altura, sem rolagem.

## Formulário

Validação de nome, e-mail e WhatsApp (via intl-tel-input, Brasil +55 por padrão).

Para enviar os leads a um destino real, preencha a constante `ENDPOINT` em
`assets/js/main.js`:

```js
var ENDPOINT = 'https://seu-endpoint/leads';
```

O envio é um `POST` JSON com `{ name, email, phone }` (telefone em formato E.164).
Depois do sucesso o lead é levado para a página definida em `REDIRECT`
(`obrigado.html`). Com `ENDPOINT` vazio o formulário só valida e já redireciona —
útil para testar o fluxo antes de ligar o back-end.

## Observações

- As imagens de fundo, os logos e os ícones foram baixados do CDN do site original
  e estão em `assets/img/` — o conteúdo é da Facial Academy.
- A Silka é uma fonte comercial; os arquivos aqui são os mesmos servidos pela
  página publicada. Confirme o licenciamento antes de publicar em outro domínio.
- Datas, textos e links (Termos de Uso, Política de Privacidade) foram copiados do
  original e devem ser atualizados para a campanha nova.
