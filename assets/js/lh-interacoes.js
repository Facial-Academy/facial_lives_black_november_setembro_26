/* LeadHero — interações na página. v2.1. Não apagar.
 *
 * O QUE MEDE: formulário COMEÇADO (primeiro campo tocado), ENVIADO e ABANDONADO (começou,
 * preencheu algo e saiu da página sem enviar), e CLIQUE EM LINK que sai do site (checkout,
 * WhatsApp, outro domínio). O GA4 não nos manda nada disso (medido 01/10/2026).
 * v2 (01/10/2026): CLIQUE DE RAIVA (3+ cliques em 0,8 s no mesmo lugar) e CLIQUE SEM EFEITO
 * (clique em algo que não é link/botão/campo e não muda nada na página em 1 s) — por PESSOA,
 * que é o que o Clarity não entrega (a API dele só dá totais, e cortados em 1.000 URLs).
 * E, onde o Clarity está instalado, marca a sessão dele com o nosso id do visitante
 * (`clarity("identify")` + tag `lh_cid`), pra achar a gravação de um lead pelo LeadHero.
 *
 * PARA ONDE VAI: direto ao porteiro da marca (`https://lh.<marca>/__lh-evento`), que repassa ao
 * LeadHero (`track-event` → tabela `web_interacoes`). Não passa pelo GA4 nem pelo servidor do GTM.
 *
 * ONDE VIVE: tag "HTML personalizado" do GTM, em Todas as páginas, nos containers de site; e
 * dentro do `lh-rastreio.js` das páginas em código próprio. Fonte: repo lead-vision-buddy,
 * `scripts/rastreio/lh-interacoes.js`.
 *
 * 🔒 O QUE ELE NUNCA FAZ: não lê o que foi digitado (manda só QUANTOS campos estão
 * preenchidos e o nome/id do formulário); não manda query string do link (é onde mora e-mail e
 * telefone — o servidor corta de novo); não impede envio nem navegação; engole qualquer erro.
 * No clique, manda só o TIPO do elemento e até 40 letras do texto da PÁGINA, nunca do que foi digitado.
 * Carregar duas vezes não duplica nada.
 */
(function () {
  if (window.__lhInteracoes) return;
  window.__lhInteracoes = 1;

  // Só nos domínios onde o porteiro tem a rota ligada. Fora deles, nada roda.
  var MARCAS = ["facialacademy.com.br", "corporalacademy.com.br", "facialacademyespanol.com"];
  function raiz(host) {
    var p = String(host || "").toLowerCase().split(".");
    var duplo = p.length >= 3 && /^(com|net|org|gov|edu)$/.test(p[p.length - 2]) && p[p.length - 1].length === 2;
    return p.slice(duplo ? -3 : -2).join(".");
  }
  var marca = raiz(location.hostname);
  if (MARCAS.indexOf(marca) < 0) return;
  var ENDPOINT = "https://lh." + marca + "/__lh-evento";

  var enviados = 0, TETO = 40;
  function sessao() {
    try { return (localStorage.getItem("lh_sid") || "").split("|")[0] || null; } catch (e) { return null; }
  }
  function mandar(evento, alvo, campos) {
    if (enviados >= TETO) return;
    enviados++;
    try {
      fetch(ENDPOINT, {
        method: "POST",
        credentials: "include",
        keepalive: true,
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ evento: evento, alvo: alvo || null, campos: campos, page_url: location.href, session_id: sessao() }),
      }).catch(function () {});
    } catch (e) {}
  }

  // ---- formulários -------------------------------------------------------
  var forms = []; // { el, chave, comecou, enviou, abandonou }
  function chaveDo(form) {
    try {
      var bloco = form.closest && form.closest('[id^="e_"]');
      return form.id || form.getAttribute("name") || (bloco && bloco.id) || ("form#" + Array.prototype.indexOf.call(document.forms, form));
    } catch (e) { return "form"; }
  }
  function registro(form) {
    for (var i = 0; i < forms.length; i++) if (forms[i].el === form) return forms[i];
    var r = { el: form, chave: chaveDo(form), comecou: false, enviou: false, abandonou: false };
    forms.push(r);
    return r;
  }
  function campoDeVerdade(el) {
    if (!el || !el.tagName) return false;
    var t = (el.type || "").toLowerCase();
    return /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && ["hidden", "submit", "button", "image", "reset"].indexOf(t) < 0;
  }
  function preenchidos(form) {
    var n = 0;
    try {
      var els = form.querySelectorAll("input, textarea, select");
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (!campoDeVerdade(el)) continue;
        var t = (el.type || "").toLowerCase();
        if (t === "checkbox" || t === "radio") { if (el.checked) n++; }
        else if (String(el.value || "").trim()) n++;
      }
    } catch (e) {}
    return n;
  }
  function aoMexer(ev) {
    var el = ev.target;
    if (!campoDeVerdade(el) || !el.form) return;
    var r = registro(el.form);
    if (r.comecou) return;
    r.comecou = true;
    mandar("form_iniciado", r.chave, null);
  }
  document.addEventListener("input", aoMexer, true);
  document.addEventListener("change", aoMexer, true);
  document.addEventListener("submit", function (ev) {
    var form = ev.target;
    if (!form || form.tagName !== "FORM") return;
    var r = registro(form);
    if (r.enviou) return;
    r.enviou = true;
    mandar("form_enviado", r.chave, preenchidos(form));
  }, true);

  function aoSair() {
    for (var i = 0; i < forms.length; i++) {
      var r = forms[i];
      if (!r.comecou || r.enviou || r.abandonou) continue;
      var n = preenchidos(r.el);
      if (n < 1) continue;
      r.abandonou = true;
      mandar("form_abandonado", r.chave, n);
    }
  }
  window.addEventListener("pagehide", aoSair);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") aoSair(); });

  // ---- links que saem do site ----------------------------------------------
  document.addEventListener("click", function (ev) {
    try {
      var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
      if (!a) return;
      var href = a.href || "";
      if (/^(tel|mailto|sms):/i.test(href)) { mandar("link_clicado", href.split(":")[0] + ":", null); return; }
      var u = new URL(href, location.href);
      if (!/^https?:$/.test(u.protocol)) return;
      if (u.host === location.host) return; // navegação interna já vira visita
      mandar("link_clicado", u.protocol + "//" + u.host + u.pathname, null);
    } catch (e) {}
  }, true);

  // ---- cliques de raiva e cliques sem efeito ---------------------------------
  var INTERATIVO = "a[href],button,input,select,textarea,label,summary,video,audio,iframe,[role=button],[role=link],[role=tab],[role=checkbox],[role=menuitem],[onclick],[contenteditable=true]";
  function descreve(el) {
    try {
      var tag = (el.tagName || "").toLowerCase();
      var txt = String(el.innerText || el.alt || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 40);
      return tag + (el.id ? "#" + String(el.id).slice(0, 30) : "") + (txt ? " \"" + txt + "\"" : "");
    } catch (e) { return null; }
  }
  var rajada = [], raivaJa = [], mortoJa = [], mortos = 0, raivas = 0;
  var mudou = 0;
  try { new MutationObserver(function () { mudou = Date.now(); }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true }); } catch (e) {}
  document.addEventListener("click", function (ev) {
    try {
      var agora = Date.now(), x = ev.clientX, y = ev.clientY, el = ev.target;
      if (!el || !el.tagName) return;
      // raiva: 3+ cliques em 0,8 s a até 30 px um do outro
      rajada = rajada.filter(function (c) { return agora - c.t < 800 && Math.abs(c.x - x) < 30 && Math.abs(c.y - y) < 30; });
      rajada.push({ t: agora, x: x, y: y });
      if (rajada.length >= 3 && raivas < 5 && raivaJa.indexOf(el) < 0) {
        raivaJa.push(el); raivas++;
        mandar("clique_raiva", descreve(el), rajada.length);
      }
      // sem efeito: não é nada clicável, o cursor não é de mãozinha, e nada mudou em 1 s
      // (1x por elemento, e nunca no meio de uma rajada — essa já conta como raiva)
      if (mortos >= 5 || rajada.length > 1 || mortoJa.indexOf(el) >= 0 || (el.closest && el.closest(INTERATIVO))) return;
      var cursor = "";
      try { cursor = getComputedStyle(el).cursor; } catch (e) {}
      if (cursor === "pointer") return;
      var url = location.href, antes = mudou;
      setTimeout(function () {
        if (mudou !== antes || location.href !== url || document.visibilityState === "hidden") return;
        if (mortos >= 5 || mortoJa.indexOf(el) >= 0 || rajada.length > 1) return;
        mortoJa.push(el); mortos++;
        mandar("clique_morto", descreve(el), null);
      }, 1000);
    } catch (e) {}
  }, true);

  // ---- Clarity: marca a sessão com o nosso id do visitante ------------------
  // Só onde o Clarity já está na página; espera até 20 s ele carregar. O id vem do porteiro
  // (o cookie é httpOnly: o JavaScript da página não o lê).
  var tentativas = 0;
  (function esperaClarity() {
    if (typeof window.clarity !== "function") { if (++tentativas < 20) setTimeout(esperaClarity, 1000); return; }
    try {
      fetch("https://lh." + marca + "/__lh-visitante", { credentials: "include" })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || !j.cid) return;
          window.clarity("identify", j.cid);
          window.clarity("set", "lh_cid", j.cid);
        }).catch(function () {});
    } catch (e) {}
  })();
})();
