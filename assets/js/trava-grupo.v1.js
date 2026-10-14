/* =========================================================================
   Facial Academy · Black Vitalícia · trava do grupo do SendFlow (obrigado)

   Pedido de 14/10/2026, a partir do script do dev do LeadHero: quem clica
   em "Entrar no grupo" cai sempre no MESMO grupo, mesmo se voltar depois.
   O link sndflw.com/i/<slug> sorteia um grupo a cada clique; o redirect
   sendflow-grupo-redirect, com o telefone do cadastro, devolve sempre o
   grupo em que a pessoa já está travada (ou trava agora). Sem telefone na
   sessão, o link continua o de sempre (rodízio normal).

   Duas diferenças do script original:
   - o slug vem do próprio link, então o /obrigado-google continua no grupo
     do Google (ads-blackfridayfacial) e o /obrigado no da campanha;
   - a conversão continua contando. A tag 268 do GTM (/obrigado) e o
     conversao-google.v1.js (/obrigado-google) só contam o clique quando o
     link é o do sndflw. Com o link trocado, a mesma lógica deles roda aqui:
     mesmo evento (fa_black_complete_registration), mesmo formato e mesmo
     registro de sessão. Quem marcar registrationSent primeiro conta; o
     outro não repete.
   ========================================================================= */
(function () {
  'use strict';

  var REDIRECT_BASE = 'https://ilzpqehbbxvmogorpfma.supabase.co/functions/v1/sendflow-grupo-redirect';
  var CHAVE = 'fa_black26_accepted_v1';
  var VALIDADE_MS = 3600000;

  // Telefone do cadastro, como no script original: qualquer chave da sessão
  // com user_data.phone_number, phone_number ou telefone (aqui é o registro
  // fa_black26_accepted_v1, gravado pela tag 268 ou pelo conversao-google).
  function telefoneDaSessao() {
    try {
      for (var i = 0; i < sessionStorage.length; i++) {
        var raw = sessionStorage.getItem(sessionStorage.key(i));
        if (!raw || raw.charAt(0) !== '{') continue;
        try {
          var obj = JSON.parse(raw);
          var tel = (obj.user_data && obj.user_data.phone_number) || obj.phone_number || obj.telefone;
          if (tel) return String(tel).replace(/\D/g, '');
        } catch (e) {}
      }
    } catch (e) {}
    return '';
  }

  // Registro de sessão da tag 268, com a mesma validação dela.
  function ler() {
    var r = null;
    try { r = JSON.parse(sessionStorage.getItem(CHAVE) || 'null'); } catch (e) {}
    var agora = Date.now();
    if (!r || typeof r.acceptedAt !== 'number' || !isFinite(r.acceptedAt) || r.acceptedAt <= 0 ||
        r.acceptedAt > agora || agora - r.acceptedAt > VALIDADE_MS ||
        typeof r.id !== 'string' || !/^fb26_[a-zA-Z0-9_]+$/.test(r.id) ||
        !r.user_data || typeof r.user_data.email !== 'string' ||
        typeof r.user_data.phone_number !== 'string' || r.leadSent !== true) return null;
    return r;
  }

  function gravar(r) {
    try { sessionStorage.setItem(CHAVE, JSON.stringify(r)); } catch (e) {}
  }

  // O mesmo push da tag 268 (e do conversao-google.v1.js).
  function empurra(evento, r, sufixo, depois) {
    var dados = {};
    Object.keys(r.attribution || {}).forEach(function (k) { dados[k] = r.attribution[k]; });
    dados.event_id = r.id + sufixo;
    dados.user_data = r.user_data;
    dados.funnel_id = 'black_facial_2026';
    dados.registration_status = 'api_accepted';
    var feito = false;
    function fim() { if (!feito) { feito = true; if (depois) depois(); } }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ black26: null });
    window.dataLayer.push({ event: evento, black26: dados, eventCallback: fim, eventTimeout: 1500 });
    // Sem GTM (bloqueador de anúncio), o eventCallback nunca chega.
    if (depois) setTimeout(fim, 1600);
  }

  var link = document.getElementById('link-grupo');
  var slug = link && /^https:\/\/sndflw\.com\/i\/([A-Za-z0-9_-]+)/.exec(link.href);
  var tel = telefoneDaSessao();
  if (!slug || tel.length < 10) return;

  var destino = REDIRECT_BASE + '?slug=' + encodeURIComponent(slug[1]) + '&telefone=' + encodeURIComponent(tel);
  link.setAttribute('href', destino);

  link.addEventListener('click', function (e) {
    var r = ler();
    if (!r || r.registrationSent) return;
    var alvo = link.getAttribute('target') || '';
    var mesmaAba = !e.defaultPrevented && (e.button === undefined || e.button === 0) &&
      !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && (!alvo || alvo === '_self');
    if (mesmaAba) e.preventDefault();
    r.registrationSent = true;
    gravar(r);
    empurra('fa_black_complete_registration', r, '_whatsapp',
      mesmaAba ? function () { location.href = destino; } : null);
  });
})();
