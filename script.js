/* ==========================================================
   YaBeto Event — scripts
   ========================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Année du pied de page ---------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- En-tête : ombre au défilement + menu mobile ---------- */
  var header = $(".site-header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var toggle = $("#navToggle");
  var navLinks = $("#navLinks");
  function closeMenu() {
    navLinks.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
  toggle.addEventListener("click", function () {
    var open = navLinks.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  $$("a", navLinks).forEach(function (a) { a.addEventListener("click", closeMenu); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  /* ---------- Lien actif selon la section visible ---------- */
  var sections = $$("main section[id]");
  var links = $$("a:not(.btn)", navLinks);
  if ("IntersectionObserver" in window) {
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (l) {
            l.classList.toggle("is-active", l.getAttribute("href") === "#" + entry.target.id);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { navObs.observe(s); });
  }

  /* ---------- Bandeau de catégories : duplication pour la boucle ---------- */
  var track = $("#marqueeTrack");
  if (track) track.innerHTML += track.innerHTML;

  /* ---------- Générateur de QR décoratif (illustration uniquement) ---------- */
  function hashSeed(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var s = seed;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function qrSvg(seedText) {
    var n = 21, rand = rng(hashSeed(seedText)), cells = [], x, y;
    function inFinder(px, py) {
      return (px < 8 && py < 8) || (px > n - 9 && py < 8) || (px < 8 && py > n - 9);
    }
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) {
        if (!inFinder(x, y) && rand() > 0.52) cells.push('<rect x="' + x + '" y="' + y + '" width="1" height="1"/>');
      }
    }
    function finder(ox, oy) {
      return '<rect x="' + ox + '" y="' + oy + '" width="7" height="7" fill="none" stroke="#121212" stroke-width="1"/>' +
             '<rect x="' + (ox + 2) + '" y="' + (oy + 2) + '" width="3" height="3"/>';
    }
    return '<svg viewBox="-0.5 -0.5 22 22" fill="#121212" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">' +
           cells.join("") + finder(0.5, 0.5).replace(/x="0.5"/g, 'x="0.5"') +
           finder(n - 7.5, 0.5) + finder(0.5, n - 7.5) + "</svg>";
  }
  var heroQr = $("#heroQr");
  if (heroQr) heroQr.innerHTML = qrSvg("YABETO-DEMO-001");
  var scanQr = $("#scanQr");
  if (scanQr) scanQr.innerHTML = qrSvg("YABETO-SCAN-OK");

  /* ---------- Billet du hero : un scan au chargement ---------- */
  var heroScan = $("#heroScan");
  var heroStatus = $("#heroStatus");
  function validateHero() {
    heroStatus.classList.add("is-valid");
    heroStatus.innerHTML = '<svg class="ic" style="width:16px;height:16px"><use href="#i-check"/></svg><span>Valide</span>';
  }
  if (heroScan && heroStatus) {
    if (reduceMotion) {
      validateHero();
    } else {
      setTimeout(function () { heroScan.classList.add("is-run"); }, 1200);
      setTimeout(validateHero, 2800);
    }
  }

  /* ---------- Compteurs des chiffres ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var duration = 1200, start = null;
    function format(v) { return v.toFixed(decimals).replace(".", ","); }
    if (reduceMotion) { el.textContent = format(target); return; }
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$("[data-count]");
  if ("IntersectionObserver" in window) {
    var countObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { countObs.observe(c); });
  }

  /* ---------- Événements : données d'exemple, rendu et filtres ---------- */
  var events = [
    { cat: "Musique",   icon: "i-music",     art: "art-a", title: "Soirée rumba live",              date: "2026-11-28", place: "Gombe",          price: "10 $" },
    { cat: "Business",  icon: "i-briefcase", art: "art-b", title: "Forum des entrepreneurs de Kinshasa", date: "2026-12-05", place: "Gombe",     price: "15 $" },
    { cat: "Tech",      icon: "i-chip",      art: "art-c", title: "Hackathon IA et paiement mobile", date: "2026-12-12", place: "Limete",         price: "Gratuit" },
    { cat: "Culture",   icon: "i-palette",   art: "art-d", title: "Salon de l'art et de la photographie", date: "2026-12-19", place: "Ngaliema",  price: "5 $" },
    { cat: "Sport",     icon: "i-run",       art: "art-e", title: "Course populaire au bord du fleuve", date: "2027-01-16", place: "Kinshasa",    price: "8 $" },
    { cat: "Formation", icon: "i-book",      art: "art-b", title: "Masterclass marketing digital",   date: "2027-01-23", place: "Gombe",          price: "20 $" },
    { cat: "Tourisme",  icon: "i-compass",   art: "art-a", title: "Visite guidée des sites culturels", date: "2027-02-06", place: "Kinshasa",     price: "12 $" },
    { cat: "Culture",   icon: "i-palette",   art: "art-c", title: "Festival de la gastronomie locale", date: "2027-02-20", place: "Lingwala",     price: "6 $" }
  ];
  var months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  var grid = $("#eventsGrid");

  function renderEvents(filter) {
    var list = events.filter(function (e) { return filter === "all" || e.cat === filter; });
    grid.innerHTML = list.map(function (e) {
      var d = new Date(e.date + "T12:00:00");
      var hasFrom = e.price !== "Gratuit";
      return '<article class="event-card">' +
        '<div class="event-art ' + e.art + '">' +
          '<svg class="ic" aria-hidden="true"><use href="#' + e.icon + '"/></svg>' +
          '<div class="event-date"><small>' + months[d.getMonth()] + " " + d.getFullYear() + "</small>" + d.getDate() + "</div>" +
        "</div>" +
        '<div class="event-body">' +
          '<span class="event-cat">' + e.cat + "</span>" +
          "<h3>" + e.title + "</h3>" +
          '<span class="event-place"><svg class="ic" style="width:16px;height:16px"><use href="#i-pin"/></svg>' + e.place + ", Kinshasa</span>" +
          '<div class="event-foot">' +
            '<span class="event-price">' + (hasFrom ? "<small>dès </small>" : "") + e.price + "</span>" +
            '<button class="link-btn" data-notify="' + e.title.replace(/"/g, "&quot;") + '">Me prévenir</button>' +
          "</div>" +
        "</div>" +
      "</article>";
    }).join("");
  }
  renderEvents("all");

  $$("#filters .chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      $$("#filters .chip").forEach(function (c) { c.classList.remove("is-active"); });
      chip.classList.add("is-active");
      renderEvents(chip.getAttribute("data-filter"));
    });
  });

  var messageField = $("#message");
  grid.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-notify]");
    if (!btn) return;
    messageField.value = "Je souhaite être prévenu(e) pour : " + btn.getAttribute("data-notify") + ".";
    $("#contact").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    setTimeout(function () { $("#nom").focus({ preventScroll: true }); }, 500);
  });

  /* ---------- Onglets « Je participe / J'organise » ---------- */
  $$(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      $$(".tab").forEach(function (t) { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
      $$(".steps").forEach(function (s) { s.classList.remove("is-active"); });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      $("#tab-" + tab.getAttribute("data-tab")).classList.add("is-active");
    });
  });

  /* ---------- Simulation du scanner de contrôle ---------- */
  var scanLine = $("#scanLine");
  var scanResult = $("#scanResult");
  var simButtons = $$("#simButtons button");
  var busy = false;

  function hhmm(date) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
  }
  function showResult(kind) {
    var now = new Date();
    var cases = {
      ok:   { cls: "is-ok",   icon: "i-check", title: "Billet valide",   text: "Entrée autorisée. Contrôle enregistré à " + hhmm(now) + "." },
      used: { cls: "is-warn", icon: "i-alert", title: "Déjà utilisé",    text: "Premier passage à " + hhmm(new Date(now.getTime() - 12 * 60000)) + ". Entrée refusée." },
      bad:  { cls: "is-bad",  icon: "i-x",     title: "Billet invalide", text: "QR inconnu ou lié à un autre événement." }
    };
    var c = cases[kind];
    scanResult.className = "result " + c.cls;
    scanResult.innerHTML = '<svg class="ic"><use href="#' + c.icon + '"/></svg><div><strong>' + c.title + "</strong><span>" + c.text + "</span></div>";
  }

  simButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (busy) return;
      busy = true;
      var kind = btn.getAttribute("data-case");
      simButtons.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      scanQr.innerHTML = qrSvg(kind === "bad" ? "FAUX-QR-" + Date.now() : kind === "used" ? "YABETO-SCAN-USED" : "YABETO-SCAN-OK");
      scanResult.className = "result";
      scanResult.innerHTML = '<svg class="ic"><use href="#i-qr"/></svg><div><strong>Lecture…</strong><span>Vérification du billet.</span></div>';

      if (reduceMotion) { showResult(kind); busy = false; return; }
      scanLine.classList.remove("is-run");
      void scanLine.offsetWidth; // relance l'animation
      scanLine.classList.add("is-run");
      setTimeout(function () { showResult(kind); busy = false; }, 1500);
    });
  });

  /* ---------- Formulaire de contact ---------- */
  var form = $("#contactForm");
  var ok = $("#formOk");

  function setError(input, hasError) {
    input.closest(".field").classList.toggle("has-error", hasError);
    input.setAttribute("aria-invalid", String(hasError));
  }
  function validContact(v) {
    var email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var phone = /^\+?[0-9\s().-]{8,}$/;
    return email.test(v) || phone.test(v);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var nom = $("#nom"), profil = $("#profil"), contact = $("#contactInfo");
    var vNom = nom.value.trim().length >= 2;
    var vProfil = profil.value !== "";
    var vContact = validContact(contact.value.trim());

    setError(nom, !vNom);
    setError(profil, !vProfil);
    setError(contact, !vContact);
    if (!(vNom && vProfil && vContact)) {
      (!vNom ? nom : !vProfil ? profil : contact).focus();
      return;
    }

    var subject = "Demande YaBeto Event — " + profil.value;
    var body = "Nom : " + nom.value.trim() + "\n" +
               "Profil : " + profil.value + "\n" +
               "Contact : " + contact.value.trim() + "\n\n" +
               ($("#message").value.trim() || "(aucun message)");
    ok.classList.add("is-visible");
    window.location.href = "mailto:oxygenholding01@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    form.reset();
  });

  $$("#contactForm input, #contactForm select").forEach(function (el) {
    el.addEventListener("input", function () { setError(el, false); });
  });
})();
