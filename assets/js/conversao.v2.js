/* =========================================================================
   Facial Academy · captura das aulas ao vivo · conversões

   A página empurra para o dataLayer os mesmos eventos que a tag 268 do GTM
   (container GTM-TBM4NXBQ) empurrava na captura antiga:

   - `fa_black_lead`, quando o LeadHero aceita o cadastro: vira
     `generate_lead` no GA4 e `Lead` no Pixel;
   - `fa_black_complete_registration`, quando a pessoa vai para o grupo do
     WhatsApp (sozinha, pelo pop-up, ou clicando no botão dele): vira
     `complete_registration` no GA4 e `CompleteRegistration` no Pixel.

   As tags que respondem a esses eventos só olham o domínio e o
   `black26.event_id`, não o caminho. A tag 268 em si não age aqui: ela só
   assume o formulário com id `fa-form`, e o desta página é `aula-form`.

   O registro fica no sessionStorage com a chave e o formato da tag
   (`fa_black26_accepted_v1`, vale 1 hora). A mesma pessoa cadastrada de novo
   dentro da hora não conta outro lead, e a ida ao grupo conta uma vez só.
   Versão 1 deste arquivo: conversao-google.v1.js (páginas do Google).
   ========================================================================= */
(function () {
  'use strict';

  var CHAVE = 'fa_black26_accepted_v1';
  var VALIDADE_MS = 3600000;
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

  window.faConversao = {
    // Cadastro aceito pelo LeadHero.
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
    },

    // Ida ao grupo do WhatsApp. Sem lead contado nesta sessão (o LeadHero
    // não respondeu a tempo), segue sem contar, como na tag.
    grupo: function (depois) {
      var r = ler();
      if (!r || r.registrationSent) { depois(); return; }
      r.registrationSent = true;
      gravar(r);
      empurra('fa_black_complete_registration', r, '_whatsapp', depois);
    }
  };
})();
