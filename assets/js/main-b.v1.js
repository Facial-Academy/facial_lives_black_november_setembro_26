/* =========================================================================
   Facial Academy — Black Vitalícia
   Scroll suave (Lenis) + revelação por bloco + formulário
   Captura B (/v2, teste A/B por anúncio). Cópia do main-google.v7-1.js com:
   - REDIRECT para o mesmo /obrigado da página A;
   - `pagina_captura: 'B'` no corpo enviado ao LeadHero (o campo URL do
     lh-rastreio também leva o /v2);
   - pop-up: os botões com data-abre-cadastro abrem o card do hero num
     <dialog>, com entrada e saída animadas;
   - esteira de capas (pausa fora da tela) e interações de ponteiro: a foto
     e a luz do hero seguem o mouse, os grupos de cursos acendem sob ele, as
     capas e o bilhete inclinam. Só com mouse/trackpad e sem movimento
     reduzido.
   A conversão (`fa_black_lead`) sai pelo conversao-google.v1.js: a tag 268
   do GTM só roda em / e /obrigado. No /obrigado ela lê o mesmo registro de
   sessão e conta o clique no grupo.
   ========================================================================= */
(function () {
  'use strict';

  document.body.classList.add('js');

  // Marca o fim do carregamento: a pulsação do botão de envio só começa
  // depois disso, para não competir com a renderização inicial.
  function marcaCarregada() { document.body.classList.add('carregada'); }
  if (document.readyState === 'complete') marcaCarregada();
  else window.addEventListener('load', marcaCarregada);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     1. Scroll suave (mesmo comportamento do site publicado)
     --------------------------------------------------------------------- */
  if (window.Lenis && !reduced) {
    var lenis = new window.Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    document.querySelectorAll('a[href^="#"]:not([data-abre-cadastro])').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0 });
      });
    });
  }

  /* ---------------------------------------------------------------------
     2. Revelação ao entrar na viewport
     Onde o navegador suporta animation-timeline, o CSS faz a revelação pela
     rolagem e este bloco só adiciona .is-in, sem efeito visual.
     --------------------------------------------------------------------- */
  function reveal(el) {
    if (el.classList.contains('is-in')) return;
    var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
    if (delay) el.style.transitionDelay = delay + 'ms';
    el.classList.add('is-in');
  }

  var pending = [].slice.call(document.querySelectorAll('.anim, .anim-words'));

  if (reduced) {
    pending.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    // O hero entra por CSS (regra .hero .anim) e sai daqui: revelá-lo no
    // evento load fazia o LCP esperar todo o rastreamento terminar.
    pending = pending.filter(function (el) { return !el.closest('#hero-section'); });

    // Posições medidas uma vez. A verificação no scroll vira aritmética
    // pura — sem getBoundingClientRect, sem forçar reflow.
    var marcas = pending.map(function (el) {
      return { el: el, topo: el.getBoundingClientRect().top + window.scrollY };
    });

    function varrer() {
      if (!marcas.length) return;
      var limite = window.scrollY + (window.innerHeight || 0) * 0.92;
      marcas = marcas.filter(function (m) {
        if (m.topo < limite) { reveal(m.el); return false; }
        return true;
      });
    }

    function remedir() {
      marcas.forEach(function (m) {
        m.topo = m.el.getBoundingClientRect().top + window.scrollY;
      });
      varrer();
    }

    // O IntersectionObserver cobre a rolagem normal. Ele não avisa quando um
    // elemento é ultrapassado de uma vez (recarregar no meio da página,
    // rolagem muito rápida): nesse caso o elemento nunca chega a intersectar
    // e ficaria invisível para sempre. Daí a varredura por posição também.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          marcas = marcas.filter(function (m) { return m.el !== entry.target; });
          io.unobserve(entry.target);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
      pending.forEach(function (el) { io.observe(el); });
    }

    var ultimo = 0;
    window.addEventListener('scroll', function () {
      var agora = Date.now();
      if (agora - ultimo < 100) return;
      ultimo = agora;
      varrer();
    }, { passive: true });

    window.addEventListener('resize', remedir, { passive: true });
    window.addEventListener('load', remedir);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') varrer();
    });
    varrer();
  }

  window.__revealAll = function () {
    document.querySelectorAll('.anim, .anim-words').forEach(function (el) {
      el.classList.add('is-in');
    });
  };

  /* ---------------------------------------------------------------------
     3. Campo de telefone internacional (padrão Brasil +55)
     --------------------------------------------------------------------- */
  var phone = document.querySelector('#fa-phone');
  var iti = null;

  if (phone && window.intlTelInput) {
    iti = window.intlTelInput(phone, {
      initialCountry: 'br',
      separateDialCode: true,
      countrySearch: true,
      nationalMode: true,
      i18n: { searchPlaceholder: 'Buscar' },
      // Trava a digitação (e o colar) no tamanho máximo de um celular válido
      // do país escolhido: no Brasil, DDD + 9 dígitos.
      strictMode: true,
      // A lista de países abre dentro do card, também no celular. Por padrão
      // ela abre presa ao <body>, que fica atrás do pop-up e inerte enquanto
      // ele está aberto.
      useFullscreenPopup: false,
      // utils.js só é necessário para validar o número; 260 KB que não
      // precisam entrar no carregamento inicial.
      // Caminho resolvido a partir do documento: dentro de main.js um
      // './assets/...' resolveria relativo a /assets/js/ e daria 404.
      loadUtils: function () {
        return import(new URL('/assets/js/intlTelInputUtils.js', document.baseURI).href);
      }
    });
  }

  /* ---------------------------------------------------------------------
     4. Esteira de capas e interações de ponteiro
     --------------------------------------------------------------------- */
  var hero = document.getElementById('hero-section');
  var esteira = document.querySelector('.esteira');
  // A esteira só anda com a faixa na tela (o CSS ainda espera o load).
  if (esteira && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      esteira.classList.toggle('em-tela', entradas[0].isIntersecting);
    }).observe(esteira);
  } else if (esteira) {
    esteira.classList.add('em-tela');
  }

  var ponteiroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (ponteiroFino && !reduced) {
    // Junta os eventos de um quadro num requestAnimationFrame só.
    var noQuadro = function (fn) {
      var pendente = false, ultimo;
      return function (e) {
        ultimo = e;
        if (pendente) return;
        pendente = true;
        requestAnimationFrame(function () { pendente = false; fn(ultimo); });
      };
    };
    // Ponteiro dentro do elemento: x e y de -1 a 1, e em px.
    var relativo = function (el, e) {
      var r = el.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) / r.width * 2 - 1,
        y: (e.clientY - r.top) / r.height * 2 - 1,
        px: e.clientX - r.left,
        py: e.clientY - r.top
      };
    };

    if (hero) {
      hero.addEventListener('pointermove', noQuadro(function (e) {
        var p = relativo(hero, e);
        hero.style.setProperty('--px', p.x.toFixed(3));
        hero.style.setProperty('--py', p.y.toFixed(3));
        hero.style.setProperty('--lx', Math.round(p.px) + 'px');
        hero.style.setProperty('--ly', Math.round(p.py) + 'px');
      }));
      hero.addEventListener('pointerenter', function () { hero.classList.add('com-ponteiro'); });
      hero.addEventListener('pointerleave', function () {
        hero.classList.remove('com-ponteiro');
        hero.style.setProperty('--px', '0');
        hero.style.setProperty('--py', '0');
      });
    }

    document.querySelectorAll('.grupo').forEach(function (g) {
      g.addEventListener('pointermove', noQuadro(function (e) {
        var p = relativo(g, e);
        g.style.setProperty('--x', Math.round(p.px) + 'px');
        g.style.setProperty('--y', Math.round(p.py) + 'px');
      }));
    });

    var inclina = function (el, max) {
      el.addEventListener('pointermove', noQuadro(function (e) {
        var p = relativo(el, e);
        el.style.setProperty('--rx', (-p.y * max).toFixed(2) + 'deg');
        el.style.setProperty('--ry', (p.x * max).toFixed(2) + 'deg');
      }));
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    };
    document.querySelectorAll('.mosaico li').forEach(function (li) { inclina(li, 10); });
    var bilhete = document.querySelector('.fecho__bilhete');
    if (bilhete) inclina(bilhete, 8);
  }

  /* ---------------------------------------------------------------------
     5. Pop-up do formulário
     O card do hero vai para dentro do <dialog> e volta ao fechar. Sem
     showModal (navegador antigo), o link segue para #cadastro.
     --------------------------------------------------------------------- */
  var dialogo = document.getElementById('popup-cadastro');
  var card = document.getElementById('cadastro');
  if (dialogo && card && typeof dialogo.showModal === 'function') {
    var vagaHero = card.parentNode;
    var vagaPopup = dialogo.querySelector('.popup__vaga');
    var origem = null;
    var saida = null;

    // Saída animada (Esc, X ou clique fora); sem movimento reduzido, fecha seco.
    var fecha = function () {
      if (!dialogo.open || dialogo.classList.contains('saindo')) return;
      if (reduced) { dialogo.close(); return; }
      dialogo.classList.add('saindo');
      saida = setTimeout(function () { dialogo.close(); }, 200);
    };

    document.querySelectorAll('[data-abre-cadastro]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        clearTimeout(saida);
        dialogo.classList.remove('saindo');
        origem = a;
        // Segura a altura do hero: sem o card, o layout de trás pularia.
        vagaHero.style.minHeight = card.offsetHeight + 'px';
        vagaPopup.appendChild(card);
        dialogo.showModal();
        if (lenis) lenis.stop();
      });
    });

    dialogo.addEventListener('close', function () {
      clearTimeout(saida);
      dialogo.classList.remove('saindo');
      vagaHero.appendChild(card);
      vagaHero.style.minHeight = '';
      if (lenis) lenis.start();
      if (origem) origem.focus({ preventScroll: true });
    });

    // Esc dispara 'cancel': segura o fechamento seco e anima a saída.
    dialogo.addEventListener('cancel', function (e) {
      e.preventDefault();
      fecha();
    });
    // Clique fora do card (no fundo escurecido) fecha.
    dialogo.addEventListener('click', function (e) {
      if (e.target === dialogo) fecha();
    });
    dialogo.querySelector('.popup__fechar').addEventListener('click', fecha);
  }

  /* ---------------------------------------------------------------------
     6. Envio do formulário
     --------------------------------------------------------------------- */
  var form = document.querySelector('#fa-form');
  if (!form) return;

  var message = form.querySelector('.fa-message');
  var button = form.querySelector('.fa-submit');

  // LeadHero — endpoint público e write-only: o UUID na URL identifica a
  // empresa/pipeline. Sem header de autenticação por definição do contrato.
  //
  // `lead-capture-rapido` (e não `lead-capture-api`) porque é ele que DECIDE a
  // saída de cada cadastro — anti-spam do SendFlow, quem já recebeu o link,
  // página oficial ou pendente de aprovação — e responde `{ pagina, redirect }`
  // antes de cadastrar. Regra completa: `docs/triagem-captura-black.md` no repo
  // do LeadHero.
  var ENDPOINT = 'https://ilzpqehbbxvmogorpfma.supabase.co/functions/v1/lead-capture-rapido/db62a1f9-2a30-47ea-a78e-a4b97f6aad2f';

  // Mesmo obrigado da página A. Em produção o Cloudflare normaliza para
  // /obrigado; com a extensão o caminho também funciona no preview local. A
  // barra inicial mantém o destino certo se a página for aberta como /v2/.
  var REDIRECT = '/obrigado.html';

  // Teto de espera pela decisão. A pessoa não pode ficar olhando o botão por
  // causa de uma resposta que demora: estourou, vai pro obrigado de sempre (o
  // cadastro segue acontecendo do lado do LeadHero).
  var TETO_MS = 4000;

  function setMessage(text, isError) {
    message.textContent = text;
    message.classList.toggle('is-error', !!isError);
  }

  function markInvalid(input, invalid) {
    input.classList.toggle('is-invalid', invalid);
  }

  // Todos os utm_* da URL, inclusive os que não estão na lista do contrato
  // (utm_placement vem do {{placement}} do Meta: feed, stories, reels).
  function utmsDaUrl() {
    var out = {};
    try {
      new URLSearchParams(window.location.search).forEach(function (valor, chave) {
        if (/^utm_/i.test(chave) && valor) out[chave.toLowerCase()] = valor;
      });
    } catch (e) {}
    return out;
  }

  // O CRM tem nome e sobrenome separados; o formulário pede o nome completo.
  function separaNome(completo) {
    var partes = completo.trim().split(/\s+/);
    return { nome: partes.shift() || '', sobrenome: partes.join(' ') };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = form.querySelector('#fa-name');
    var email = form.querySelector('#fa-email');
    var ok = true;

    var nameOk = name.value.trim().length >= 2;
    markInvalid(name, !nameOk);
    ok = ok && nameOk;

    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    markInvalid(email, !emailOk);
    ok = ok && emailOk;

    // isValidNumber() só checa se o número é "possível" — aceita 00000000000.
    // isValidNumberPrecise() confere de fato, que é o que interessa num
    // cadastro cujo objetivo é falar com a pessoa no WhatsApp.
    var valid = null;
    if (iti) {
      valid = iti.isValidNumberPrecise ? iti.isValidNumberPrecise() : iti.isValidNumber();
    }
    var phoneOk = (valid === null || valid === undefined)
      ? phone.value.replace(/\D/g, '').length >= 10   // utils ainda carregando
      : valid;
    markInvalid(phone, !phoneOk);
    ok = ok && phoneOk;

    if (!ok) {
      setMessage('Confira os campos destacados para continuar.', true);
      return;
    }

    var partesDoNome = separaNome(name.value);
    var payload = {
      nome: partesDoNome.nome,
      sobrenome: partesDoNome.sobrenome,
      email: email.value.trim(),
      telefone: iti ? iti.getNumber() : phone.value.trim()
    };
    var utms = utmsDaUrl();
    for (var chave in utms) {
      if (Object.prototype.hasOwnProperty.call(utms, chave)) payload[chave] = utms[chave];
    }

    // IP, localização, pixel e id do visitante (script lh-rastreio.js). Sem ele o cadastro
    // entra igual, só sem esses dados.
    var rastreio = window.lhRastreio ? window.lhRastreio.campos() : {};
    for (var campo in rastreio) {
      if (Object.prototype.hasOwnProperty.call(rastreio, campo)) payload[campo] = rastreio[campo];
    }

    // Teste A/B: identifica a captura B no LeadHero.
    payload.pagina_captura = 'B';
    if (!payload.URL) payload.URL = window.location.href;

    button.disabled = true;
    setMessage('Enviando…');

    var envio = fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; })
          .then(function (corpo) { return { ok: r.ok, corpo: corpo }; });
      })
      .then(function (res) {
        // Erro de validação do contrato (e-mail inválido, integração inativa)
        // vem como 4xx com `error` — aí a pessoa fica na página e corrige.
        if (!res.ok) throw new Error(res.corpo.error || 'falha no envio');
        return res.corpo;
      });

    var teto = new Promise(function (resolve) {
      setTimeout(function () { resolve(null); }, TETO_MS);
    });

    Promise.race([envio, teto])
      .then(function (corpo) {
        // `redirect` só vem preenchido quando a triagem manda a pessoa pra
        // outra página (hoje, a de aguarde de quem está no anti-spam).
        var destino = corpo && typeof corpo.redirect === 'string' && /^https?:\/\//i.test(corpo.redirect)
          ? corpo.redirect
          : REDIRECT;
        function vai() { window.location.href = destino; }
        // Cadastro aceito pela triagem: conta a conversão antes de sair. Sem
        // resposta dentro do teto, sai sem contar: a conversão só vale para
        // cadastro confirmado, como na tag 268.
        var aceito = corpo && !corpo.error && corpo.success !== false &&
          typeof corpo.pagina === 'string' && corpo.pagina.trim();
        if (aceito && window.faConversaoGoogle) {
          window.faConversaoGoogle.lead({
            email: payload.email, telefone: payload.telefone,
            nome: payload.nome, sobrenome: payload.sobrenome
          }, vai);
        } else {
          vai();
        }
      })
      .catch(function (erro) {
        if (window.console && console.warn) console.warn('LeadHero:', erro && erro.message);
        setMessage('Não foi possível enviar agora. Confira os dados e tente de novo.', true);
        button.disabled = false;
      });
  });
})();
