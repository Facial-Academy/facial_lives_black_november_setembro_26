/* =========================================================================
   Facial Academy · Black Vitalícia · conversão das páginas do Google Ads

   POR QUE EXISTE: na captura `/` e no `/obrigado`, quem gera a conversão é a
   tag 268 do GTM (container GTM-TBM4NXBQ). Ela só roda nesses dois caminhos,
   e a conta do Eddie não tem acesso ao container. Este arquivo empurra para
   o dataLayer os MESMOS eventos, no mesmo formato, nas páginas do Google:

   - `fa_black_lead`, quando o LeadHero aceita o cadastro (chamado pelo
     main-google.v7-1.js): vira `generate_lead` no GA4 e `Lead` no Pixel;
   - `fa_black_complete_registration`, no clique do botão do grupo no
     /obrigado-google, só para quem se cadastrou nesta sessão: vira
     `complete_registration` no GA4 e `CompleteRegistration` no Pixel.

   As tags do GTM que respondem a esses eventos não olham o caminho, só o
   domínio e o `black26.event_id`.

   O registro fica no sessionStorage com a mesma chave e o mesmo formato da
   tag (`fa_black26_accepted_v1`, vale 1 hora). Se a tag 268 também passar a
   rodar nestas páginas, na captura ela intercepta o envio antes do
   main-google, e no obrigado quem clicar primeiro marca o evento como
   enviado nesse registro e o outro não repete.
   ========================================================================= */
(function () {
  'use strict';

  var CHAVE = 'fa_black26_accepted_v1';
  var VALIDADE_MS = 3600000;
  var GRUPO = /^https:\/\/sndflw\.com\/i\/ads-blackfridayfacial(?:[?#]|$)/;
  var memoria = null;

  // Mesma validação da tag: registro vencido, malformado ou sem o lead
  // enviado não vale.
  function ler() {
    var r = memoria;
    try { if (!r) r = JSON.parse(sessionStorage.getItem(CHAVE) || 'null'); } catch (e) {}
    var agora = Date.now();
    if (!r || typeof r.acceptedAt !== 'number' || !isFinite(r.acceptedAt) || r.acceptedAt <= 0 ||
        r.acceptedAt > agora || agora - r.acceptedAt > VALIDADE_MS ||
        typeof r.id !== 'string' || !/^fb26_[a-zA-Z0-9_]+$/.test(r.id) ||
        !r.user_data || typeof r.user_data.email !== 'string' ||
        typeof r.user_data.phone_number !== 'string' || r.leadSent !== true) {
      try { sessionStorage.removeItem(CHAVE); } catch (e) {}
      memoria = null;
      return null;
    }
    return r;
  }

  function gravar(r) {
    memoria = r;
    try { sessionStorage.setItem(CHAVE, JSON.stringify(r)); } catch (e) {}
  }

  function novoId() {
    var n = new Uint32Array(4);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(n);
      return 'fb26_' + Array.prototype.map.call(n, function (x) { return x.toString(16); }).join('_');
    }
    return 'fb26_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  }

  // utm_* e os ids de campanha, como a tag faz.
  function atribuicao() {
    var o = {};
    try {
      new URLSearchParams(location.search).forEach(function (v, k) {
        k = k.toLowerCase();
        if ((/^utm_/.test(k) || /^(campaign_id|adset_id|ad_id)$/.test(k)) && v) o[k] = v;
      });
    } catch (e) {}
    return o;
  }

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

  window.faConversaoGoogle = {
    // Chamado pelo main-google quando o LeadHero aceita o cadastro.
    lead: function (p, depois) {
      var email = String(p.email || '').trim().toLowerCase();
      var telefone = String(p.telefone || '');
      var r = ler();
      // Mesma pessoa de novo dentro da hora: o lead já foi contado.
      if (r && r.user_data.email === email && r.user_data.phone_number === telefone) { depois(); return; }
      r = {
        id: novoId(), acceptedAt: Date.now(), leadSent: true, registrationSent: false,
        attribution: atribuicao(),
        user_data: { email: email, phone_number: telefone,
                     address: { first_name: p.nome || '', last_name: p.sobrenome || '' } }
      };
      gravar(r);
      empurra('fa_black_lead', r, '_lead', depois);
    }
  };

  // Clique no botão do grupo (só existe no /obrigado-google).
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a#link-grupo') : null;
    if (!a || !GRUPO.test(a.href)) return;
    var r = ler();
    if (!r || r.registrationSent) return;
    var alvo = a.getAttribute('target') || '';
    var mesmaAba = !e.defaultPrevented && (e.button === undefined || e.button === 0) &&
      !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && (!alvo || alvo === '_self');
    var destino = a.href;
    if (mesmaAba) e.preventDefault();
    r.registrationSent = true;
    gravar(r);
    empurra('fa_black_complete_registration', r, '_whatsapp',
      mesmaAba ? function () { location.href = destino; } : null);
  }, false);
})();
