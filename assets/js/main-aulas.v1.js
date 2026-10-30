/* =========================================================================
   Facial Academy · captura das aulas ao vivo (/, /v2 e /captura-google)
   Scroll suave (Lenis) + revelação por bloco + vídeo do fundo + pop-ups +
   formulário. Base: main-b.v1.js (captura B), com:
   - formulário `#aula-form` (com `#fa-form` a tag 268 do GTM assumiria o
     envio na raiz e mandaria para o /obrigado antigo);
   - `pagina_captura: 'aulas-fim-de-ano'` no corpo enviado ao LeadHero (o
     campo URL do lh-rastreio leva o caminho: /, /v2 ou /captura-google);
   - sem página de obrigado: depois do cadastro abre o pop-up do grupo, que
     conta 6 segundos e leva ao grupo Facial Ao Vivo do WhatsApp;
   - conversões pelo conversao.v2.js (`fa_black_lead` no cadastro aceito,
     `fa_black_complete_registration` na ida ao grupo).
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
     1. Scroll suave (mesmo comportamento da captura B)
     --------------------------------------------------------------------- */
  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new window.Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
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

  var pending = [].slice.call(document.querySelectorAll('.anim'));

  if (reduced) {
    pending.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    // O hero entra por CSS (regra .hero .anim) e sai daqui: revelá-lo no
    // evento load fazia o LCP esperar todo o rastreamento terminar.
    pending = pending.filter(function (el) { return !el.closest('#hero-section'); });

    // Posições medidas uma vez; a verificação no scroll vira aritmética.
    var marcas = pending.map(function (el) {
      return { el: el, topo: el.getBoundingClientRect().top + window.scrollY };
    });

    var varrer = function () {
      if (!marcas.length) return;
      var limite = window.scrollY + (window.innerHeight || 0) * 0.92;
      marcas = marcas.filter(function (m) {
        if (m.topo < limite) { reveal(m.el); return false; }
        return true;
      });
    };

    var remedir = function () {
      marcas.forEach(function (m) {
        m.topo = m.el.getBoundingClientRect().top + window.scrollY;
      });
      varrer();
    };

    // O IntersectionObserver cobre a rolagem normal; a varredura por posição
    // cobre o elemento ultrapassado de uma vez (recarregar no meio da página,
    // rolagem muito rápida), que nunca chegaria a intersectar.
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

  /* ---------------------------------------------------------------------
     3. Vídeo do fundo: só toca com o hero na tela (e nunca com movimento
     reduzido, que o script inline já parou).
     --------------------------------------------------------------------- */
  var hero = document.getElementById('hero-section');
  var video = document.getElementById('video-fundo');
  if (video && !reduced && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      if (entradas[0].isIntersecting) {
        var p = video.play();
        if (p && p.catch) p.catch(function () {});   // economia de bateria etc.: fica o pôster
      } else {
        video.pause();
      }
    }).observe(hero);
  }

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
      // Trava a digitação (e o colar) no tamanho máximo de um celular válido
      // do país escolhido: no Brasil, DDD + 9 dígitos.
      strictMode: true,
      // A lista de países abre dentro do card, também no celular (presa ao
      // <body>, ficaria atrás do pop-up e inerte).
      useFullscreenPopup: false,
      // utils.js só é necessário para validar o número; carrega sob demanda.
      loadUtils: function () {
        return import(new URL('/assets/js/intlTelInputUtils.js', document.baseURI).href);
      }
    });
  }

  /* ---------------------------------------------------------------------
     5. Interações de ponteiro (só mouse/trackpad, sem movimento reduzido):
     o vídeo e a luz do hero seguem o mouse; os cards das aulas acendem.
     --------------------------------------------------------------------- */
  var ponteiroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (ponteiroFino && !reduced) {
    // Junta os eventos de um quadro num requestAnimationFrame só.
    var noQuadro = function (fn) {
      var pendente = false, ultimoEvento;
      return function (e) {
        ultimoEvento = e;
        if (pendente) return;
        pendente = true;
        requestAnimationFrame(function () { pendente = false; fn(ultimoEvento); });
      };
    };
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

    document.querySelectorAll('.aula').forEach(function (card) {
      card.addEventListener('pointermove', noQuadro(function (e) {
        var p = relativo(card, e);
        card.style.setProperty('--x', Math.round(p.px) + 'px');
        card.style.setProperty('--y', Math.round(p.py) + 'px');
      }));
    });
  }

  /* ---------------------------------------------------------------------
     6. Pop-up do formulário
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

    // Saída animada (Esc, X ou clique fora); com movimento reduzido, fecha seco.
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
      if (origem && !document.getElementById('popup-grupo').open) origem.focus({ preventScroll: true });
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
     7. Pop-up do grupo: agradece, conta os segundos com a barra e leva ao
     WhatsApp. O botão leva na hora. Não fecha (Esc nem clique fora): é a
     passagem para o grupo.
     --------------------------------------------------------------------- */
  var SEGUNDOS = 6;
  var popGrupo = document.getElementById('popup-grupo');
  var linkGrupo = document.getElementById('link-grupo');
  var indo = false;

  function vaiProGrupo() {
    if (indo) return;
    indo = true;
    var destino = linkGrupo.href;
    var vai = function () { window.location.href = destino; };
    if (window.faConversao) window.faConversao.grupo(vai);
    else vai();
  }

  if (linkGrupo) {
    linkGrupo.addEventListener('click', function (e) {
      // Ctrl/Cmd+clique abre em outra aba normalmente; o clique simples
      // passa pela conversão antes de sair.
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button > 0) return;
      e.preventDefault();
      vaiProGrupo();
    });
  }

  function abreGrupo(nome) {
    if (!popGrupo || typeof popGrupo.showModal !== 'function') { vaiProGrupo(); return; }
    var primeiro = (nome || '').trim().split(/\s+/)[0];
    if (primeiro) {
      // Só a inicial em maiúscula: "maria" e "MARIA" viram "Maria".
      primeiro = primeiro.charAt(0).toLocaleUpperCase('pt-BR') + primeiro.slice(1).toLocaleLowerCase('pt-BR');
      document.getElementById('grupo-titulo').textContent = 'Obrigado, ' + primeiro + '!';
    }
    if (dialogo && dialogo.open) dialogo.close();
    popGrupo.addEventListener('cancel', function (e) { e.preventDefault(); });
    popGrupo.showModal();
    if (lenis) lenis.stop();

    var seg = document.getElementById('grupo-seg');
    var barra = popGrupo.querySelector('.barra');
    var caixa = popGrupo.querySelector('.grupo');
    var resta = SEGUNDOS;
    caixa.style.setProperty('--dur', SEGUNDOS + 's');
    // Dois quadros para a barra começar do zero antes de animar.
    requestAnimationFrame(function () { requestAnimationFrame(function () { caixa.classList.add('contando'); }); });

    var tique = function () {
      seg.textContent = resta > 0 ? 'em ' + resta + ' s' : 'agora';
      barra.setAttribute('aria-valuenow', String(Math.round((SEGUNDOS - resta) / SEGUNDOS * 100)));
      if (resta <= 0) { vaiProGrupo(); return; }
      resta -= 1;
      setTimeout(tique, 1000);
    };
    tique();
  }

  /* ---------------------------------------------------------------------
     8. Envio do formulário
     --------------------------------------------------------------------- */
  var form = document.querySelector('#aula-form');
  if (!form) return;

  var message = form.querySelector('.fa-message');
  var button = form.querySelector('.fa-submit');

  // LeadHero — endpoint público e write-only: o UUID na URL identifica a
  // empresa/pipeline. É a mesma lista da Black (decisão do Eddie, 30/10),
  // e o `lead-capture-rapido` é quem DECIDE a saída de cada cadastro (anti-
  // spam do SendFlow, página oficial ou pendente de aprovação) e responde
  // `{ pagina, redirect }`. Regra: `docs/triagem-captura-black.md` no repo do
  // LeadHero.
  var ENDPOINT = 'https://ilzpqehbbxvmogorpfma.supabase.co/functions/v1/lead-capture-rapido/db62a1f9-2a30-47ea-a78e-a4b97f6aad2f';

  // Teto de espera pela decisão. Estourou, segue para o grupo sem contar a
  // conversão (o cadastro continua acontecendo do lado do LeadHero).
  var TETO_MS = 4000;

  function setMessage(text, isError) {
    message.textContent = text;
    message.classList.toggle('is-error', !!isError);
  }

  function markInvalid(input, invalid) {
    input.classList.toggle('is-invalid', invalid);
    input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
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
    if (button.disabled) return;

    var name = form.querySelector('#fa-name');
    var email = form.querySelector('#fa-email');
    var ok = true;

    var nameOk = name.value.trim().length >= 2;
    markInvalid(name, !nameOk);
    ok = ok && nameOk;

    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    markInvalid(email, !emailOk);
    ok = ok && emailOk;

    // isValidNumber() só checa se o número é "possível" (aceita 00000000000);
    // isValidNumberPrecise() confere de fato.
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

    // IP, localização, pixel e id do visitante (lh-rastreio.js). Sem ele o
    // cadastro entra igual, só sem esses dados.
    var rastreio = window.lhRastreio ? window.lhRastreio.campos() : {};
    for (var campo in rastreio) {
      if (Object.prototype.hasOwnProperty.call(rastreio, campo)) payload[campo] = rastreio[campo];
    }

    // Identifica a campanha das aulas no LeadHero.
    payload.pagina_captura = 'aulas-fim-de-ano';
    if (!payload.URL) payload.URL = window.location.href;

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
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
        // vem como 4xx com `error`: a pessoa fica na página e corrige.
        if (!res.ok) throw new Error(res.corpo.error || 'falha no envio');
        return res.corpo;
      });

    var teto = new Promise(function (resolve) {
      setTimeout(function () { resolve(null); }, TETO_MS);
    });

    Promise.race([envio, teto])
      .then(function (corpo) {
        // `redirect` só vem quando a triagem manda a pessoa para outra página
        // (hoje, a de aguarde de quem está no anti-spam): vai direto para lá.
        if (corpo && typeof corpo.redirect === 'string' && /^https?:\/\//i.test(corpo.redirect)) {
          window.location.href = corpo.redirect;
          return;
        }
        setMessage('');
        var abre = function () { abreGrupo(name.value); };
        // Cadastro aceito pela triagem: conta o lead antes do pop-up. Sem
        // resposta dentro do teto, segue sem contar, como na tag 268.
        var aceito = corpo && !corpo.error && corpo.success !== false &&
          typeof corpo.pagina === 'string' && corpo.pagina.trim();
        if (aceito && window.faConversao) {
          window.faConversao.lead({
            email: payload.email, telefone: payload.telefone,
            nome: payload.nome, sobrenome: payload.sobrenome
          }, abre);
        } else {
          abre();
        }
      })
      .catch(function (erro) {
        if (window.console && console.warn) console.warn('LeadHero:', erro && erro.message);
        setMessage('Não foi possível enviar agora. Confira os dados e tente de novo.', true);
        button.disabled = false;
        button.removeAttribute('aria-busy');
      });
  });
})();
