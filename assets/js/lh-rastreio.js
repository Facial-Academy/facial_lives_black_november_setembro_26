/* LeadHero — IP, localização, pixel e id do visitante no cadastro. v2. Não apagar.
 *
 * POR QUE EXISTE: o formulário desta página posta direto no LeadHero, sem passar pelo
 * porteiro (lh.<marca>). Sem isto o cadastro chega sem localização, sem o cookie do pixel
 * (`_fbp`) e sem o id do visitante — e não dá pra ligar o lead às páginas que ele viu nem
 * medir a conversão da página.
 *
 * COMO USAR (2 passos):
 *   1. <script src="/assets/lh-rastreio.js" data-porteiro="https://lh.<marca>/__lh-visitante"></script>
 *   2. no envio do formulário, junte os campos ao corpo:
 *        Object.assign(payload, window.lhRastreio ? window.lhRastreio.campos() : {});
 *
 * 🔒 O QUE ELE NUNCA FAZ: não envia nada sozinho, não mexe no formulário e engole qualquer
 * erro — o pior caso é o cadastro chegar exatamente como antes.
 *
 * Os nomes dos campos (`lh_cid`, `lh_ip`, `lh_geo`, `lh_fbp`, `lh_fbc`, `lh_ua`, `URL`,
 * `Dispositivo`) são os que o `lead-capture-api` lê do corpo. Código: repo lead-vision-buddy,
 * `docs/rastreio-nos-formularios.md`.
 */
(function () {
  if (window.lhRastreio) return;

  var script = document.currentScript;
  var PORTEIRO = (script && script.getAttribute("data-porteiro")) || "";
  // 🔴 VISITA — só em página cujo GA4 NÃO passa pelo servidor do GTM (senão a visita conta
  // DUAS vezes, com dois ids). Ex.: data-visita="https://lh.<marca>/__lh-visita". Ausente =
  // nada muda. O domínio precisa estar ligado em `LH_VISITA_EMPRESAS` do porteiro.
  var VISITA = (script && script.getAttribute("data-visita")) || "";
  var visitante = {};

  // Leitura de cookie sem regex: escape comido vira bug mudo. Decodifica, senão o valor
  // chegaria com `%2F` no lugar de `/` e passaria na validação como dado errado.
  function cookie(n) {
    try {
      var ps = document.cookie.split(";");
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i].trim(), s = p.indexOf("=");
        if (s > 0 && p.slice(0, s) === n) {
          var v = p.slice(s + 1);
          try { return decodeURIComponent(v); } catch (e2) { return v; }
        }
      }
    } catch (e) {}
    return "";
  }

  // Na 1ª visita o cookie do visitante nasce DEPOIS deste pedido (quando o GA4 passa pelo
  // servidor do GTM). Enquanto o id vier vazio, pergunta de novo — teto de 4 tentativas.
  var esperas = [1500, 4000, 9000, 20000];

  function perguntar() {
    if (!PORTEIRO) return;
    try {
      // `credentials: "include"` é o que traz o id do visitante: o cookie dele é `httpOnly`
      // e só o porteiro o lê. Seguro porque o porteiro reflete a origem (nunca `*`) e só
      // devolve o cookie de quem perguntou.
      fetch(PORTEIRO, { credentials: "include" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (!j || !j.ip) return;
          visitante.ip = String(j.ip);
          visitante.geo = JSON.stringify(j.geo || {});
          if (j.cid) visitante.cid = String(j.cid);
          if (!visitante.cid && esperas.length) setTimeout(perguntar, esperas.shift());
        })
        .catch(function () { /* sem resposta: segue só com o pixel */ });
    } catch (e) {}
  }

  function forma() {
    var w = window.innerWidth || 0;
    return w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
  }

  window.lhRastreio = {
    campos: function () {
      var o = {};
      function poe(k, v) { if (v) o[k] = v; }
      try {
        poe("lh_cid", visitante.cid);
        poe("lh_ip", visitante.ip);
        poe("lh_geo", visitante.geo);
        poe("lh_fbp", cookie("_fbp"));
        poe("lh_fbc", cookie("_fbc"));
        poe("lh_ua", navigator.userAgent);
        poe("URL", location.href);
        poe("Dispositivo", forma());
      } catch (e) {}
      return o;
    },
  };

  // Sessão no mesmo sentido do GA4: 30 min sem página nova abre outra.
  function sessao() {
    var agora = Date.now();
    try {
      var p = (localStorage.getItem("lh_sid") || "").split("|");
      var sid = p.length === 2 && agora - Number(p[1]) < 1800000 ? p[0] : String(Math.floor(agora / 1000));
      localStorage.setItem("lh_sid", sid + "|" + agora);
      return sid;
    } catch (e) { return String(Math.floor(agora / 1000)); }
  }

  // A visita vai ANTES da pergunta do id: é ela que cria o `lh_vid` de quem nunca passou pelo
  // servidor do GTM, e assim o `lh_cid` do cadastro sai com o MESMO id da visita.
  // `text/plain` evita o pré-voo do navegador.
  function registrarVisita(depois) {
    if (!VISITA) { depois(); return; }
    try {
      fetch(VISITA, {
        method: "POST",
        credentials: "include",
        keepalive: true,
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          page_url: location.href,
          page_title: document.title,
          page_referrer: document.referrer,
          session_id: sessao(),
          dispositivo: forma(),
        }),
      }).then(function () { depois(); }, function () { depois(); });
    } catch (e) { depois(); }
  }

  registrarVisita(perguntar);
})();
