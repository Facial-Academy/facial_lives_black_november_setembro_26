/* =========================================================================
   Facial Academy — Black Vitalícia
   Scroll suave (Lenis) + revelação por palavra + formulário
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

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0 });
      });
    });
  }

  /* ---------------------------------------------------------------------
     2. Quebra de texto em palavras (efeito blur-in escalonado)
     --------------------------------------------------------------------- */
  var STAGGER = 40; // ms entre palavras

  function splitWords(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      if (!node.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (chunk) {
        if (!chunk) return;
        if (/^\s+$/.test(chunk)) {
          frag.appendChild(document.createTextNode(chunk));
        } else {
          var span = document.createElement('span');
          span.className = 'word';
          span.textContent = chunk;
          frag.appendChild(span);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });

    el.querySelectorAll('.word').forEach(function (w, i) {
      w.style.transitionDelay = (i * STAGGER) + 'ms';
    });
  }

  document.querySelectorAll('.anim-words').forEach(splitWords);

  /* ---------------------------------------------------------------------
     3. Revelação ao entrar na viewport
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
     4. Campo de telefone internacional (padrão Brasil +55)
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
      // utils.js só é necessário para validar o número; 260 KB que não
      // precisam entrar no carregamento inicial.
      // Caminho resolvido a partir do documento: dentro de main.js um
      // './assets/...' resolveria relativo a /assets/js/ e daria 404.
      loadUtils: function () {
        return import(new URL('assets/js/intlTelInputUtils.js', document.baseURI).href);
      }
    });
  }

  /* ---------------------------------------------------------------------
     5. Envio do formulário
     --------------------------------------------------------------------- */
  var form = document.querySelector('#fa-form');
  if (!form) return;

  var message = form.querySelector('.fa-message');
  var button = form.querySelector('.fa-submit');

  // LeadHero — endpoint público e write-only: o UUID na URL identifica a
  // empresa/pipeline. Sem header de autenticação por definição do contrato.
  var ENDPOINT = 'https://ilzpqehbbxvmogorpfma.supabase.co/functions/v1/lead-capture-api/db62a1f9-2a30-47ea-a78e-a4b97f6aad2f';

  // Página de obrigado. Em produção o Cloudflare normaliza para /obrigado;
  // com a extensão o caminho também funciona no preview local.
  var REDIRECT = 'obrigado.html';

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

    button.disabled = true;
    setMessage('Enviando…');

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; })
          .then(function (corpo) { return { ok: r.ok, corpo: corpo }; });
      })
      .then(function (res) {
        // O contrato responde 200 com {"success": true}. Um 200 sem esse
        // campo não conta como cadastro feito.
        if (!res.ok || res.corpo.success !== true) {
          throw new Error(res.corpo.error || 'falha no envio');
        }
        window.location.href = REDIRECT;
      })
      .catch(function (erro) {
        if (window.console && console.warn) console.warn('LeadHero:', erro && erro.message);
        setMessage('Não foi possível enviar agora. Confira os dados e tente de novo.', true);
        button.disabled = false;
      });
  });
})();
