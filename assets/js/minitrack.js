/* =====================================================================
   MiniTrack — démo interactive de SysTrack
   ---------------------------------------------------------------------
   Réplique jouable, sans dépendance ni serveur, du poste de travail
   SysTrack : navigation, stock suivi par projet, panier de retrait,
   préparations, kits métier, mouvements, RMA, journal d'audit.

   Ce que la démo NE fait PAS (volontairement) : la génération des bons
   de livraison / bons de retrait Excel, qui reste propre à SysTrack.

   Tout l'état vit en mémoire : rien n'est envoyé nulle part, et le
   bouton « Réinitialiser » remet le jeu de données d'origine.
   ===================================================================== */
(function () {
  "use strict";

  var root = document.getElementById("minitrack-app");
  if (!root) return;

  /* =================================================================
     1. Référentiels (jeu de données figé)
     ================================================================= */

  var PROJECTS = [
    { id: "PA", name: "Projet Alpha", code: "PA", desc: "Déploiement principal — siège & agences" },
    { id: "PB", name: "Projet Beta", code: "PB", desc: "Maintenance et interventions terrain" }
  ];

  var TYPES = [
    { id: "t1", name: "Informatique" }, { id: "t2", name: "Réseau" },
    { id: "t3", name: "Électricité" }, { id: "t4", name: "Audio" },
    { id: "t5", name: "Vidéo" }, { id: "t6", name: "Sécurité" },
    { id: "t7", name: "Outillage" }, { id: "t8", name: "Consommables" }
  ];

  var CATS = [
    { id: "c1", name: "Ordinateurs portables", color: "#3b82f6" },
    { id: "c2", name: "Périphériques", color: "#8b5cf6" },
    { id: "c3", name: "Câblage", color: "#6366f1" },
    { id: "c4", name: "Alimentation", color: "#f59e0b" },
    { id: "c5", name: "Sonorisation", color: "#ec4899" },
    { id: "c6", name: "Caméra & surveillance", color: "#ef4444" },
    { id: "c7", name: "Outils à main", color: "#10b981" },
    { id: "c8", name: "Fournitures", color: "#14b8a6" },
    { id: "c9", name: "Vidéo & projection", color: "#a855f7" }
  ];

  var ACTS = [
    { id: "a1", name: "Déploiement" }, { id: "a2", name: "Maintenance" },
    { id: "a3", name: "Événementiel" }, { id: "a4", name: "Formation" },
    { id: "a5", name: "Support" }
  ];

  var LOCS = [
    { id: "l1", name: "Magasin A — Rack 1" }, { id: "l2", name: "Magasin A — Rack 2" },
    { id: "l3", name: "Magasin B — Rack 3" }, { id: "l4", name: "Local réseau" },
    { id: "l5", name: "Atelier" }, { id: "l6", name: "Zone de préparation" }
  ];

  /* Catalogue global, stock suivi PAR PROJET (comme dans SysTrack). */
  var SEED_EQUIP = [
    ["e01", "ORD-001", "Ordinateur portable Dell Latitude 5540", "t1", "c1", "a1", "l1", 12, 4, 5, 2, true],
    ["e02", "ORD-002", "Ordinateur portable HP EliteBook 840 G10", "t1", "c1", "a1", "l1", 7, 3, 3, 2, false],
    ["e03", "DOC-010", "Station d'accueil USB-C Dell WD19", "t1", "c2", "a1", "l2", 15, 5, 6, 2, false],
    ["e04", "ECR-014", "Écran 24\" Dell P2422H", "t1", "c2", "a1", "l3", 9, 4, 4, 2, true],
    ["e05", "CLA-020", "Clavier + souris sans fil Logitech MK540", "t1", "c2", "a1", "l2", 22, 6, 8, 3, false],
    ["e06", "SWI-031", "Switch réseau 24 ports Cisco Catalyst 1000", "t2", "c3", "a1", "l4", 2, 2, 2, 1, false],
    ["e07", "RJ4-040", "Câble réseau RJ45 Cat6 (3 m)", "t2", "c3", "a2", "l4", 120, 30, 45, 20, false],
    ["e08", "BAI-045", "Panneau de brassage 24 ports", "t2", "c3", "a1", "l4", 3, 2, 1, 1, false],
    ["e09", "MUL-050", "Multiprise parafoudre 8 prises", "t3", "c4", "a2", "l5", 18, 6, 5, 3, false],
    ["e10", "OND-055", "Onduleur APC Back-UPS 1400VA", "t3", "c4", "a2", "l5", 2, 3, 1, 1, false],
    ["e11", "ENC-060", "Enceinte de sonorisation portable JBL EON", "t4", "c5", "a3", "l6", 6, 2, 2, 1, false],
    ["e12", "MIC-063", "Micro HF sans fil Shure BLX24", "t4", "c5", "a3", "l6", 4, 2, 0, 1, false],
    ["e13", "VID-070", "Vidéoprojecteur Full HD Epson EB-X49", "t5", "c9", "a3", "l6", 2, 2, 1, 1, true],
    ["e14", "CAM-075", "Caméra de surveillance IP dôme Hikvision", "t6", "c6", "a1", "l3", 0, 3, 3, 2, false],
    ["e15", "PER-080", "Perceuse-visseuse sans fil 18V Makita", "t7", "c7", "a2", "l5", 5, 2, 2, 1, false],
    ["e16", "TOU-082", "Coffret de tournevis de précision (32 pièces)", "t7", "c7", "a2", "l5", 11, 4, 4, 2, false],
    ["e17", "PAP-090", "Rame de papier A4 80 g (500 feuilles)", "t8", "c8", "a4", "l2", 40, 15, 12, 6, false],
    ["e18", "ETI-092", "Rouleau d'étiquettes code-barres 57 × 32", "t8", "c8", "a1", "l2", 25, 10, 9, 4, false]
  ];

  var SEED_KITS = [
    { id: "k1", project: "PA", name: "Kit poste de travail complet", catId: "c1",
      items: [["e01", 1], ["e03", 1], ["e04", 2], ["e05", 1]] },
    { id: "k2", project: "PA", name: "Kit salle de réunion", catId: "c9",
      items: [["e13", 1], ["e11", 1], ["e12", 1], ["e07", 2]] },
    { id: "k3", project: "PA", name: "Kit brassage baie réseau", catId: "c3",
      items: [["e06", 1], ["e08", 1], ["e07", 24], ["e09", 1]] },
    { id: "k4", project: "PB", name: "Kit intervention terrain", catId: "c7",
      items: [["e15", 1], ["e16", 1], ["e09", 1], ["e17", 1]] },
    { id: "k5", project: "PB", name: "Kit renfort poste nomade", catId: "c2",
      items: [["e02", 1], ["e03", 1], ["e05", 1]] }
  ];

  var SEED_PREPS = [
    { id: "p1", project: "PA", number: "PREP-2026-018", status: "EN_COURS", owner: "A. Dramé", days: 1,
      lines: [["e01", 4, 2], ["e03", 4, 4], ["e04", 8, 3]] },
    { id: "p2", project: "PA", number: "PREP-2026-017", status: "PRETE", owner: "M. Leroy", days: 3,
      lines: [["e07", 24, 24], ["e06", 1, 1]] },
    { id: "p3", project: "PA", number: "PREP-2026-016", status: "TERMINEE", owner: "A. Dramé", days: 6,
      lines: [["e05", 6, 6]] },
    { id: "p4", project: "PA", number: "PREP-2026-015", status: "BROUILLON", owner: "S. Nour", days: 0,
      lines: [["e14", 3, 0]] },
    { id: "p5", project: "PB", number: "PREP-2026-014", status: "EN_COURS", owner: "J. Perrin", days: 2,
      lines: [["e15", 2, 1], ["e16", 2, 2]] }
  ];

  var SEED_RMA = [
    { id: "r1", project: "PA", number: "RMA-0004", eqId: "e04", qty: 1, status: "SIGNALE", days: 1, reason: "Dalle fissurée au transport" },
    { id: "r2", project: "PA", number: "RMA-0003", eqId: "e10", qty: 1, status: "ENVOYE", days: 5, reason: "Batterie HS — bip permanent" },
    { id: "r3", project: "PA", number: "RMA-0002", eqId: "e02", qty: 1, status: "RESTITUE", days: 12, reason: "Clavier défectueux (touches mortes)" },
    { id: "r4", project: "PB", number: "RMA-0001", eqId: "e06", qty: 1, status: "ENVOYE", days: 8, reason: "Port 12 muet après coupure" }
  ];

  var PREP_META = {
    BROUILLON: { label: "Brouillon", cls: "muted" },
    EN_COURS: { label: "En préparation", cls: "warning" },
    VALIDEE: { label: "Validée", cls: "primary" },
    PRETE: { label: "Prête au retrait", cls: "violet" },
    TERMINEE: { label: "Terminée", cls: "success" },
    ANNULEE: { label: "Annulée", cls: "danger" }
  };

  var RMA_META = {
    SIGNALE: { label: "Signalé", cls: "warning" },
    ENVOYE: { label: "Envoyé au SAV", cls: "primary" },
    RESTITUE: { label: "Restitué", cls: "success" }
  };

  var MOV_META = {
    WITHDRAWAL: { label: "Retrait", cls: "warning", icon: "bi-arrow-up-right" },
    RETURN: { label: "Retour", cls: "success", icon: "bi-arrow-down-right" },
    ADJUST: { label: "Ajustement", cls: "primary", icon: "bi-sliders" },
    RMA_OUT: { label: "Sortie RMA", cls: "danger", icon: "bi-wrench-adjustable" },
    RMA_IN: { label: "Retour RMA", cls: "success", icon: "bi-arrow-repeat" }
  };

  var USERS = ["A. Dramé", "M. Leroy", "S. Nour", "J. Perrin", "C. Vasseur"];
  var REASONS = [
    "Déploiement poste utilisateur", "Intervention sur site client", "Remplacement matériel défectueux",
    "Préparation salle de réunion", "Mise en service baie réseau", "Retour de mission", "Réassort atelier"
  ];

  var NAV = [
    { group: "Principal", items: [
      { id: "dashboard", label: "Tableau de bord", icon: "bi-grid-1x2" },
      { id: "equipments", label: "Équipements", icon: "bi-box-seam" },
      { id: "preparations", label: "Préparations", icon: "bi-clipboard-check" },
      { id: "kits", label: "Kits métier", icon: "bi-boxes" },
      { id: "movements", label: "Mouvements", icon: "bi-arrow-left-right" },
      { id: "rma", label: "RMA", icon: "bi-wrench-adjustable" }
    ]},
    { group: "Administration", items: [
      { id: "projects", label: "Projets", icon: "bi-kanban" },
      { id: "audit", label: "Journal d'audit", icon: "bi-journal-text" }
    ]}
  ];

  /* =================================================================
     2. Utilitaires
     ================================================================= */

  var DAY = 86400000;
  var NOW = new Date();
  NOW.setHours(16, 40, 0, 0);

  /** Générateur pseudo-aléatoire déterministe : l'historique semé est
   *  identique à chaque chargement (le graphique reste crédible). */
  function makeRng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function name(list, id) { var o = byId(list, id); return o ? o.name : "—"; }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function pad3(n) { return ("00" + n).slice(-3); }
  function fmtDate(d) { return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function fmtTime(d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function fmtDateTime(d) { return fmtDate(d) + " · " + fmtTime(d); }
  function relative(d) {
    var diff = NOW - d;
    if (diff < 60000) return "à l'instant";
    if (diff < 3600000) return "il y a " + Math.round(diff / 60000) + " min";
    if (diff < DAY) return "il y a " + Math.round(diff / 3600000) + " h";
    var days = Math.round(diff / DAY);
    return days <= 1 ? "hier" : "il y a " + days + " j";
  }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  /** Normalise pour la recherche : minuscules, sans accents. */
  function norm(v) {
    var t = String(v == null ? "" : v).toLowerCase();
    return t.normalize ? t.normalize("NFD").replace(/[̀-ͯ]/g, "") : t;
  }
  /** Tri alphabétique français (é/è/ê rangés avec e). */
  var collator = (typeof Intl !== "undefined" && Intl.Collator)
    ? new Intl.Collator("fr", { sensitivity: "base", numeric: true })
    : { compare: function (a, b) { return a < b ? -1 : a > b ? 1 : 0; } };

  /* =================================================================
     3. État applicatif
     ================================================================= */

  var S = null;

  function buildState() {
    var rnd = makeRng(20260619);

    var equipments = SEED_EQUIP.map(function (r) {
      return {
        id: r[0], ref: r[1], name: r[2], typeId: r[3], catId: r[4], actId: r[5], locId: r[6],
        status: "ACTIVE", fav: r[11],
        stock: { PA: { q: r[7], min: r[8] }, PB: { q: r[9], min: r[10] } }
      };
    });

    /* -- Historique de mouvements sur 14 jours ---------------------- */
    var movements = [];
    var mid = 0;
    for (var d = 13; d >= 0; d--) {
      var count = 2 + Math.floor(rnd() * 5);
      for (var k = 0; k < count; k++) {
        var eq = equipments[Math.floor(rnd() * equipments.length)];
        var isReturn = rnd() < 0.33;
        var date = new Date(NOW.getTime() - d * DAY);
        date.setHours(8 + Math.floor(rnd() * 9), Math.floor(rnd() * 60), 0, 0);
        movements.push({
          id: "m" + (++mid),
          date: date,
          type: isReturn ? "RETURN" : "WITHDRAWAL",
          eqId: eq.id,
          qty: 1 + Math.floor(rnd() * (eq.ref.indexOf("RJ4") === 0 ? 12 : 3)),
          project: rnd() < 0.72 ? "PA" : "PB",
          user: USERS[Math.floor(rnd() * USERS.length)],
          reason: REASONS[Math.floor(rnd() * REASONS.length)]
        });
      }
    }
    movements.sort(function (a, b) { return b.date - a.date; });

    var kits = SEED_KITS.map(function (k) {
      return { id: k.id, project: k.project, name: k.name, catId: k.catId, archived: false,
        items: k.items.map(function (i) { return { eqId: i[0], qty: i[1] }; }) };
    });

    var preps = SEED_PREPS.map(function (p) {
      var created = new Date(NOW.getTime() - p.days * DAY);
      return { id: p.id, project: p.project, number: p.number, status: p.status, owner: p.owner,
        createdAt: created, comment: "",
        lines: p.lines.map(function (l) { return { eqId: l[0], requested: l[1], prepared: l[2] }; }) };
    });

    var rmas = SEED_RMA.map(function (r) {
      return { id: r.id, project: r.project, number: r.number, eqId: r.eqId, qty: r.qty,
        status: r.status, reason: r.reason, createdAt: new Date(NOW.getTime() - r.days * DAY) };
    });

    var audit = [
      { id: "a0", at: new Date(NOW.getTime() - 40 * 60000), action: "LOGIN", detail: "Connexion via Logto (OIDC) — rôle ADMIN", user: "A. Dramé" },
      { id: "a1", at: new Date(NOW.getTime() - 3 * DAY), action: "CREATE", detail: "Kit « Kit salle de réunion » créé sur Projet Alpha", user: "A. Dramé" },
      { id: "a2", at: new Date(NOW.getTime() - 5 * DAY), action: "UPDATE", detail: "Seuil d'alerte de OND-055 porté à 3 unités", user: "M. Leroy" }
    ];

    return {
      theme: "dark",
      collapsed: false,
      full: false,
      view: "dashboard",
      project: "PA",
      equipments: equipments,
      movements: movements,
      kits: kits,
      preps: preps,
      rmas: rmas,
      audit: audit,
      cart: [],
      openPrep: null,
      seq: { prep: 18, rma: 4, mov: mid, audit: 3, eq: 18 },
      eqQ: { page: 1, search: "", typeId: "all", catId: "all", actId: "all", locId: "all",
             status: "all", low: false, fav: false, sortBy: "name", sortOrder: "asc" },
      movQ: { page: 1, search: "", type: "all" },
      prepQ: { search: "", status: "active" },
      kitQ: { search: "", catId: "all" },
      rmaQ: { search: "", status: "active" }
    };
  }

  /* --- Accès stock du projet courant -------------------------------- */
  function stockOf(eq, project) { return eq.stock[project || S.project]; }
  function qtyOf(eq) { return stockOf(eq).q; }
  function minOf(eq) { return stockOf(eq).min; }
  function stockLevel(eq) {
    var st = stockOf(eq);
    if (st.q <= 0) return "out";
    if (st.q <= st.min) return "low";
    return "ok";
  }

  function logAudit(action, detail) {
    S.audit.unshift({ id: "a" + (++S.seq.audit), at: new Date(), action: action, detail: detail, user: "A. Dramé" });
  }

  function addMovement(type, eqId, qty, reason) {
    S.movements.unshift({
      id: "m" + (++S.seq.mov), date: new Date(), type: type, eqId: eqId, qty: qty,
      project: S.project, user: "A. Dramé", reason: reason || "—"
    });
  }

  /* =================================================================
     4. Rendu — coquille
     ================================================================= */

  function shellHTML() {
    var nav = NAV.map(function (g) {
      return '<p class="mt-nav__title">' + g.group + "</p>" +
        g.items.map(function (it) {
          return '<button class="mt-nav__item" data-act="nav" data-view="' + it.id + '" title="' + esc(it.label) + '">' +
            '<i class="bi ' + it.icon + '"></i><span>' + esc(it.label) + "</span>" +
            '<em class="mt-nav__count" data-count="' + it.id + '" style="display:none;font-style:normal"></em>' +
            "</button>";
        }).join("");
    }).join("");

    return '' +
      '<div class="mt-shell">' +
        '<aside class="mt-side">' +
          '<div class="mt-side__brand">' +
            '<img class="mt-logo-light" src="assets/img/systrack-logo-white.svg" alt="SysTrack" />' +
            '<img class="mt-logo-dark" src="assets/img/systrack-logo.svg" alt="SysTrack" />' +
            '<div class="mt-side__name"><b>MiniTrack</b><span>Démo · SysTrack</span></div>' +
          "</div>" +
          '<nav class="mt-nav">' + nav + "</nav>" +
          '<div class="mt-side__foot">Démo hors-ligne · aucune donnée envoyée</div>' +
        "</aside>" +

        '<div class="mt-main">' +
          '<header class="mt-top">' +
            '<button class="mt-btn mt-btn--ghost mt-btn--icon" data-act="collapse" title="Replier la barre latérale"><i class="bi bi-layout-sidebar"></i></button>' +
            '<label class="mt-proj" title="Sélecteur de projet global">' +
              '<i class="bi bi-kanban"></i>' +
              '<select data-act="project">' + PROJECTS.map(function (p) {
                return '<option value="' + p.id + '">' + esc(p.name) + "</option>";
              }).join("") + "</select>" +
            "</label>" +
            '<span class="mt-top__spacer"></span>' +
            '<button class="mt-btn mt-btn--ghost mt-btn--icon mt-cartbtn" data-act="cart-open" title="Panier de retrait">' +
              '<i class="bi bi-cart3"></i><em class="mt-cartbtn__n" data-cart-count style="display:none;font-style:normal">0</em>' +
            "</button>" +
            '<button class="mt-btn mt-btn--ghost mt-btn--icon" data-act="theme" title="Basculer le thème"><i class="bi bi-sun"></i></button>' +
            '<button class="mt-btn mt-btn--ghost mt-btn--icon mt-hide-sm" data-act="reset" title="Réinitialiser la démo"><i class="bi bi-arrow-counterclockwise"></i></button>' +
            '<button class="mt-btn mt-btn--ghost mt-btn--icon" data-act="full" title="Plein écran"><i class="bi bi-arrows-fullscreen"></i></button>' +
            '<button class="mt-user" data-act="user" title="Compte de démonstration">' +
              '<span class="mt-avatar">AD</span>' +
              '<span class="mt-user__meta"><b>Aly-Ba Dramé</b><span>Administrateur</span></span>' +
            "</button>" +
          "</header>" +
          '<div class="mt-content" data-content></div>' +
        "</div>" +
      "</div>" +

      '<div class="mt-scrim" data-scrim></div>' +
      '<aside class="mt-drawer" data-drawer>' +
        '<div class="mt-drawer__head">' +
          '<h4><i class="bi bi-cart3"></i> Panier de retrait</h4>' +
          '<button class="mt-btn mt-btn--ghost mt-btn--icon mt-btn--sm" data-act="cart-close"><i class="bi bi-x-lg"></i></button>' +
        "</div>" +
        '<div class="mt-drawer__body" data-cart-body></div>' +
        '<div class="mt-drawer__foot" data-cart-foot></div>' +
      "</aside>" +

      '<div class="mt-modal" data-modal><div class="mt-modal__box" data-modal-box></div></div>' +
      '<div class="mt-toasts" data-toasts></div>';
  }

  /* =================================================================
     5. Briques d'interface
     ================================================================= */

  function badge(cls, label) { return '<span class="mt-badge mt-badge--' + cls + '">' + esc(label) + "</span>"; }

  function pageHead(icon, title, desc, actions) {
    return '<div class="mt-head">' +
      '<div class="mt-head__l">' +
        '<span class="mt-head__icon"><i class="bi ' + icon + '"></i></span>' +
        "<div><h3>" + esc(title) + "</h3><p>" + desc + "</p></div>" +
      "</div>" +
      '<div class="mt-head__actions">' + (actions || "") + "</div>" +
    "</div>";
  }

  function emptyState(icon, title, desc, action) {
    return '<div class="mt-empty"><div class="mt-empty__i"><i class="bi ' + icon + '"></i></div>' +
      "<b>" + esc(title) + "</b><p>" + esc(desc) + "</p>" + (action ? '<div style="margin-top:.9rem">' + action + "</div>" : "") + "</div>";
  }

  function selectHTML(act, value, options, allLabel) {
    var opts = '<option value="all">' + esc(allLabel) + "</option>" + options.map(function (o) {
      return '<option value="' + o.id + '"' + (o.id === value ? " selected" : "") + ">" + esc(o.name) + "</option>";
    }).join("");
    return '<select class="mt-select" data-act="' + act + '">' + opts + "</select>";
  }

  function stockBadge(eq) {
    var lvl = stockLevel(eq), st = stockOf(eq);
    if (lvl === "out") return badge("danger", "Rupture");
    if (lvl === "low") return badge("warning", st.q + " / seuil " + st.min);
    return badge("success", st.q + " en stock");
  }

  function pagination(total, page, perPage, act) {
    var pages = Math.max(1, Math.ceil(total / perPage));
    var from = total === 0 ? 0 : (page - 1) * perPage + 1;
    var to = Math.min(total, page * perPage);
    var nums = "";
    for (var i = 1; i <= pages; i++) {
      if (pages > 7 && i > 2 && i < pages - 1 && Math.abs(i - page) > 1) {
        if (i === 3) nums += '<span style="color:var(--mt-faint);padding:0 .2rem">…</span>';
        continue;
      }
      nums += '<button class="mt-pag__n' + (i === page ? " is-on" : "") + '" data-act="' + act + '" data-page="' + i + '">' + i + "</button>";
    }
    return '<div class="mt-pag">' +
      '<span class="mt-pag__info">' + from + "–" + to + " sur " + total + " résultat(s)</span>" +
      '<div class="mt-pag__ctl">' +
        '<button class="mt-pag__n" data-act="' + act + '" data-page="' + (page - 1) + '"' + (page <= 1 ? " disabled" : "") + '><i class="bi bi-chevron-left"></i></button>' +
        nums +
        '<button class="mt-pag__n" data-act="' + act + '" data-page="' + (page + 1) + '"' + (page >= pages ? " disabled" : "") + '><i class="bi bi-chevron-right"></i></button>' +
      "</div></div>";
  }

  /* --- Graphiques SVG maison ---------------------------------------- */

  function areaChart(points) {
    var W = 620, H = 210, PL = 34, PR = 10, PT = 12, PB = 26;
    var iw = W - PL - PR, ih = H - PT - PB;
    var max = 1;
    points.forEach(function (p) { max = Math.max(max, p.w, p.r); });
    max = Math.ceil(max / 4) * 4 || 4;

    function x(i) { return PL + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw); }
    function y(v) { return PT + ih - (v / max) * ih; }

    function path(key) {
      return points.map(function (p, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p[key]).toFixed(1); }).join(" ");
    }
    function area(key) {
      return path(key) + " L" + x(points.length - 1).toFixed(1) + " " + (PT + ih) + " L" + x(0).toFixed(1) + " " + (PT + ih) + " Z";
    }

    var grid = "", labels = "";
    for (var g = 0; g <= 4; g++) {
      var gy = PT + (g / 4) * ih;
      grid += '<line class="mt-gridline" x1="' + PL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - PR) + '" y2="' + gy.toFixed(1) + '"/>';
      labels += '<text x="' + (PL - 7) + '" y="' + (gy + 3).toFixed(1) + '" text-anchor="end">' + Math.round(max - (g / 4) * max) + "</text>";
    }
    var xlabels = points.map(function (p, i) {
      if (points.length > 8 && i % 2 !== 0) return "";
      return '<text x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + p.label + "</text>";
    }).join("");

    var dots = points.map(function (p, i) {
      return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.w).toFixed(1) + '" r="2.6" fill="#f59e0b"><title>' +
        p.label + " — " + p.w + " retrait(s)</title></circle>" +
        '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.r).toFixed(1) + '" r="2.6" fill="#10b981"><title>' +
        p.label + " — " + p.r + " retour(s)</title></circle>";
    }).join("");

    return '<svg class="mt-chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Évolution des mouvements sur 14 jours">' +
      "<defs>" +
        '<linearGradient id="mtGw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f59e0b" stop-opacity=".38"/><stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/></linearGradient>' +
        '<linearGradient id="mtGr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10b981" stop-opacity=".34"/><stop offset="100%" stop-color="#10b981" stop-opacity="0"/></linearGradient>' +
      "</defs>" + grid + labels + xlabels +
      '<path d="' + area("w") + '" fill="url(#mtGw)"/>' +
      '<path d="' + area("r") + '" fill="url(#mtGr)"/>' +
      '<path d="' + path("w") + '" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="' + path("r") + '" fill="none" stroke="#10b981" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
      dots + "</svg>";
  }

  function donutChart(items) {
    var total = items.reduce(function (s, i) { return s + i.value; }, 0) || 1;
    var R = 54, C = 2 * Math.PI * R, offset = 0;
    var arcs = items.map(function (it) {
      var frac = it.value / total;
      var len = Math.max(frac * C - 3, 0);
      var seg = '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + it.color + '" stroke-width="17" ' +
        'stroke-dasharray="' + len.toFixed(2) + " " + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-offset).toFixed(2) +
        '" transform="rotate(-90 70 70)" stroke-linecap="round"><title>' + esc(it.name) + " — " + it.value + "</title></circle>";
      offset += frac * C;
      return seg;
    }).join("");
    return '<div class="mt-donut"><div class="mt-donut__c">' +
      '<svg width="140" height="140" viewBox="0 0 140 140" class="mt-chart" style="width:140px">' + arcs + "</svg>" +
      '<div class="mt-donut__mid"><b>' + total + "</b><span>unités</span></div></div>" +
      '<div class="mt-legend" style="flex-direction:column;gap:.35rem;margin:0">' +
        items.map(function (i) {
          return '<span><i style="background:' + i.color + '"></i>' + esc(i.name) + " · <b style=\"color:var(--mt-fg)\">" + i.value + "</b></span>";
        }).join("") + "</div></div>";
  }

  function hBars(items) {
    if (!items.length) return emptyState("bi-bar-chart", "Aucun retrait", "Aucun mouvement sur la période.");
    var max = items.reduce(function (m, i) { return Math.max(m, i.value); }, 1);
    var rowH = 30, W = 560, H = items.length * rowH + 8, LW = 88;
    var rows = items.map(function (it, i) {
      var w = ((it.value / max) * (W - LW - 46)) || 0;
      var y = i * rowH + 6;
      return '<text x="0" y="' + (y + 13) + '" style="fill:var(--mt-mut)">' + esc(it.label) + "</text>" +
        '<rect class="mt-bar" x="' + LW + '" y="' + y + '" width="' + w.toFixed(1) + '" height="17" rx="5" fill="#3b82f6"><title>' +
        esc(it.full) + " — " + it.value + "</title></rect>" +
        '<text x="' + (LW + w + 7).toFixed(1) + '" y="' + (y + 13) + '" style="fill:var(--mt-fg);font-weight:700">' + it.value + "</text>";
    }).join("");
    return '<svg class="mt-chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Top équipements retirés">' + rows + "</svg>";
  }

  /* --- QR code décoratif mais déterministe --------------------------- */
  function qrSVG(text, size) {
    var N = 25, cell = (size || 190) / N;
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    var rnd = makeRng(h >>> 0);
    var m = [];
    for (var r = 0; r < N; r++) { m[r] = []; for (var c = 0; c < N; c++) m[r][c] = rnd() < 0.46 ? 1 : 0; }
    function finder(or_, oc) {
      for (var r = 0; r < 7; r++) for (var c = 0; c < 7; c++) {
        var edge = r === 0 || r === 6 || c === 0 || c === 6;
        var core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        m[or_ + r][oc + c] = edge || core ? 1 : 0;
      }
      for (var q = -1; q <= 7; q++) {
        if (or_ + q >= 0 && or_ + q < N && oc + 7 < N) m[or_ + q][oc + 7] = 0;
        if (oc + q >= 0 && oc + q < N && or_ + 7 < N) m[or_ + 7][oc + q] = 0;
      }
    }
    finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
    var rects = "";
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      if (m[y][x]) rects += '<rect x="' + (x * cell).toFixed(2) + '" y="' + (y * cell).toFixed(2) + '" width="' + cell.toFixed(2) + '" height="' + cell.toFixed(2) + '"/>';
    }
    return '<svg width="' + (size || 190) + '" height="' + (size || 190) + '" viewBox="0 0 ' + (size || 190) + " " + (size || 190) +
      '" role="img" aria-label="QR code ' + esc(text) + '"><g fill="#0a1122">' + rects + "</g></svg>";
  }

  /* =================================================================
     6. Vues
     ================================================================= */

  function currentProject() { return byId(PROJECTS, S.project); }

  /* ---------- Tableau de bord --------------------------------------- */
  function viewDashboard() {
    var P = S.project;
    var eqs = S.equipments;
    var totalUnits = eqs.reduce(function (s, e) { return s + e.stock[P].q; }, 0);
    var low = eqs.filter(function (e) { return e.stock[P].q > 0 && e.stock[P].q <= e.stock[P].min; }).length;
    var out = eqs.filter(function (e) { return e.stock[P].q <= 0; }).length;

    var today = new Date(NOW); today.setHours(0, 0, 0, 0);
    var mvProj = S.movements.filter(function (m) { return m.project === P; });
    var wToday = mvProj.filter(function (m) { return m.type === "WITHDRAWAL" && m.date >= today; })
      .reduce(function (s, m) { return s + m.qty; }, 0);
    var rToday = mvProj.filter(function (m) { return m.type === "RETURN" && m.date >= today; })
      .reduce(function (s, m) { return s + m.qty; }, 0);

    /* Évolution 14 jours */
    var points = [];
    for (var d = 13; d >= 0; d--) {
      var start = new Date(NOW.getTime() - d * DAY); start.setHours(0, 0, 0, 0);
      var end = new Date(start.getTime() + DAY);
      var day = mvProj.filter(function (m) { return m.date >= start && m.date < end; });
      points.push({
        label: pad(start.getDate()) + "/" + pad(start.getMonth() + 1),
        w: day.filter(function (m) { return m.type === "WITHDRAWAL" || m.type === "RMA_OUT"; }).reduce(function (s, m) { return s + m.qty; }, 0),
        r: day.filter(function (m) { return m.type === "RETURN" || m.type === "RMA_IN"; }).reduce(function (s, m) { return s + m.qty; }, 0)
      });
    }

    /* Répartition par catégorie */
    var dist = CATS.map(function (c) {
      return { name: c.name, color: c.color,
        value: eqs.filter(function (e) { return e.catId === c.id; }).reduce(function (s, e) { return s + e.stock[P].q; }, 0) };
    }).filter(function (c) { return c.value > 0; }).sort(function (a, b) { return b.value - a.value; }).slice(0, 6);

    /* Top équipements retirés */
    var tally = {};
    mvProj.filter(function (m) { return m.type === "WITHDRAWAL"; }).forEach(function (m) {
      tally[m.eqId] = (tally[m.eqId] || 0) + m.qty;
    });
    var top = Object.keys(tally).map(function (k) {
      var e = byId(eqs, k);
      return { label: e.ref, full: e.name, value: tally[k] };
    }).sort(function (a, b) { return b.value - a.value; }).slice(0, 6);

    var alerts = eqs.filter(function (e) { return e.stock[P].q <= e.stock[P].min; })
      .sort(function (a, b) { return a.stock[P].q - b.stock[P].q; }).slice(0, 5);

    var openPreps = S.preps.filter(function (p) { return p.project === P && p.status !== "TERMINEE" && p.status !== "ANNULEE"; }).length;
    var openRmas = S.rmas.filter(function (r) { return r.project === P && r.status !== "RESTITUE"; }).length;

    function stat(icon, value, label, sub, accent) {
      return '<div class="mt-stat"><span class="mt-stat__i"' + (accent ? ' style="background:' + accent + '22;color:' + accent + '"' : "") +
        '><i class="bi ' + icon + '"></i></span><div><div class="mt-stat__v">' + value + "</div>" +
        '<div class="mt-stat__k">' + esc(label) + "</div>" + (sub ? '<div class="mt-stat__s">' + esc(sub) + "</div>" : "") + "</div></div>";
    }

    return pageHead("bi-grid-1x2", "Tableau de bord",
      "Inventaire du projet <b>" + esc(currentProject().name) + "</b> — " + esc(currentProject().desc)) +
      '<div class="mt-stack">' +
        '<div class="mt-stats">' +
          stat("bi-box-seam", eqs.length, "Références", totalUnits + " unités en stock") +
          stat("bi-arrow-up-right", wToday, "Retraits aujourd'hui", rToday + " retour(s)", "#f59e0b") +
          stat("bi-exclamation-triangle", low, "Stock faible", "À réapprovisionner", "#f59e0b") +
          stat("bi-x-octagon", out, "Ruptures", "Stock épuisé", "#ef4444") +
        "</div>" +
        '<div class="mt-stats">' +
          stat("bi-clipboard-check", openPreps, "Préparations ouvertes", "Sur ce projet", "#8b5cf6") +
          stat("bi-boxes", S.kits.filter(function (k) { return k.project === P && !k.archived; }).length, "Kits métier", "Propres au projet", "#6366f1") +
          stat("bi-wrench-adjustable", openRmas, "Tickets RMA actifs", "En cours de traitement", "#ef4444") +
          stat("bi-arrow-left-right", mvProj.length, "Mouvements (14 j)", "Historisés", "#10b981") +
        "</div>" +

        '<div class="mt-grid2">' +
          '<div class="mt-card"><div class="mt-card__head"><h4>Évolution des mouvements (14 jours)</h4>' +
            '<div class="mt-legend" style="margin:0"><span><i style="background:#f59e0b"></i>Retraits</span><span><i style="background:#10b981"></i>Retours</span></div>' +
          '</div><div class="mt-card__body">' + areaChart(points) + "</div></div>" +
          '<div class="mt-card"><div class="mt-card__head"><h4>Répartition par catégorie</h4></div>' +
            '<div class="mt-card__body">' + (dist.length ? donutChart(dist) : emptyState("bi-pie-chart", "Aucune donnée", "Aucun équipement en stock.")) + "</div></div>" +
        "</div>" +

        '<div class="mt-grid11">' +
          '<div class="mt-card"><div class="mt-card__head"><h4>Top équipements retirés (14 j)</h4></div>' +
            '<div class="mt-card__body">' + hBars(top) + "</div></div>" +
          '<div class="mt-card"><div class="mt-card__head"><h4>Derniers mouvements</h4>' +
            '<button class="mt-btn mt-btn--ghost mt-btn--sm" data-act="nav" data-view="movements">Tout voir <i class="bi bi-arrow-right"></i></button></div>' +
            '<div class="mt-card__body"><ul class="mt-feed">' +
              (mvProj.slice(0, 6).map(function (m) {
                var e = byId(eqs, m.eqId), meta = MOV_META[m.type];
                return "<li>" +
                  '<span class="mt-feed__i mt-badge--' + meta.cls + '"><i class="bi ' + meta.icon + '"></i></span>' +
                  '<span class="mt-feed__t"><b>' + esc(e.name) + "</b><span>" + esc(meta.label) + " · " + esc(m.user) + " · " + relative(m.date) + "</span></span>" +
                  '<span class="mt-feed__q" style="color:var(--mt-' + (m.type === "RETURN" || m.type === "RMA_IN" ? "success" : "warning") + ')">' +
                  (m.type === "RETURN" || m.type === "RMA_IN" ? "+" : "−") + m.qty + "</span></li>";
              }).join("") || '<li style="border:0"><span class="mt-feed__t"><span>Aucun mouvement.</span></span></li>') +
            "</ul></div></div>" +
        "</div>" +

        '<div class="mt-card"><div class="mt-card__head"><h4>Alertes de stock</h4>' +
          '<button class="mt-btn mt-btn--outline mt-btn--sm" data-act="goto-low"><i class="bi bi-funnel"></i> Filtrer le stock faible</button></div>' +
          '<div class="mt-card__body">' +
          (alerts.length ? '<ul class="mt-feed">' + alerts.map(function (e) {
            var lvl = stockLevel(e);
            return "<li>" +
              '<span class="mt-feed__i mt-badge--' + (lvl === "out" ? "danger" : "warning") + '"><i class="bi bi-exclamation-triangle"></i></span>' +
              '<span class="mt-feed__t"><b>' + esc(e.name) + "</b><span>" + esc(e.ref) + " · " + esc(name(LOCS, e.locId)) + "</span></span>" +
              stockBadge(e) +
              '<button class="mt-btn mt-btn--outline mt-btn--sm" data-act="stock" data-id="' + e.id + '" data-mode="RETURN" style="margin-left:.5rem"><i class="bi bi-plus-lg"></i> Réappro.</button>' +
              "</li>";
          }).join("") + "</ul>" : emptyState("bi-check2-circle", "Aucune alerte", "Tous les stocks sont au-dessus de leur seuil.")) +
        "</div></div>" +
      "</div>";
  }

  /* ---------- Équipements -------------------------------------------- */
  function filteredEquipments() {
    var q = S.eqQ, s = norm(q.search.trim());
    var list = S.equipments.filter(function (e) {
      if (q.typeId !== "all" && e.typeId !== q.typeId) return false;
      if (q.catId !== "all" && e.catId !== q.catId) return false;
      if (q.actId !== "all" && e.actId !== q.actId) return false;
      if (q.locId !== "all" && e.locId !== q.locId) return false;
      if (q.status !== "all" && e.status !== q.status) return false;
      if (q.low && !(e.stock[S.project].q <= e.stock[S.project].min)) return false;
      if (q.fav && !e.fav) return false;
      if (s) {
        var hay = norm(e.name + " " + e.ref + " " + name(CATS, e.catId) + " " + name(LOCS, e.locId) + " " + name(TYPES, e.typeId));
        if (hay.indexOf(s) === -1) return false;
      }
      return true;
    });
    var dir = q.sortOrder === "asc" ? 1 : -1;
    list.sort(function (a, b) {
      if (q.sortBy === "quantity") return (a.stock[S.project].q - b.stock[S.project].q) * dir;
      var va, vb;
      if (q.sortBy === "reference") { va = a.ref; vb = b.ref; }
      else if (q.sortBy === "category") { va = name(CATS, a.catId); vb = name(CATS, b.catId); }
      else { va = a.name; vb = b.name; }
      return collator.compare(va, vb) * dir;
    });
    return list;
  }

  function sortHead(label, field, extra) {
    var on = S.eqQ.sortBy === field;
    return '<th class="mt-sortable' + (extra ? " " + extra : "") + '" data-act="eq-sort" data-field="' + field + '">' + esc(label) +
      '<i class="bi ' + (on ? (S.eqQ.sortOrder === "asc" ? "bi-sort-up" : "bi-sort-down") : "bi-arrow-down-up") +
      '" style="opacity:' + (on ? 1 : 0.35) + '"></i></th>';
  }

  function viewEquipments() {
    var q = S.eqQ, PER = 8;
    var list = filteredEquipments();
    var pages = Math.max(1, Math.ceil(list.length / PER));
    if (q.page > pages) q.page = pages;
    var slice = list.slice((q.page - 1) * PER, q.page * PER);

    var rows = slice.map(function (e) {
      var cat = byId(CATS, e.catId);
      var st = stockOf(e);
      var lvl = stockLevel(e);
      var color = lvl === "out" ? "var(--mt-danger)" : lvl === "low" ? "var(--mt-warning)" : "var(--mt-fg)";
      return "<tr>" +
        '<td style="width:30px"><button class="mt-star' + (e.fav ? " is-on" : "") + '" data-act="fav" data-id="' + e.id + '" aria-label="Favori"><i class="bi ' + (e.fav ? "bi-star-fill" : "bi-star") + '"></i></button></td>' +
        '<td><button class="mt-eq__n" data-act="eq-detail" data-id="' + e.id + '" style="text-align:left">' + esc(e.name) + "</button>" +
          '<div class="mt-eq__r">' + esc(e.ref) + "</div></td>" +
        '<td class="mt-hide-md"><span class="mt-badge" style="color:' + cat.color + ";background:" + cat.color + '1f">' + esc(cat.name) + "</span></td>" +
        '<td class="mt-hide-md" style="color:var(--mt-mut)">' + esc(name(LOCS, e.locId)) + "</td>" +
        "<td>" +
          '<div class="mt-stockcell">' +
            '<input class="mt-stockedit" type="number" min="0" value="' + st.q + '" data-act="eq-qty" data-id="' + e.id + '" style="color:' + color + '" title="Quantité — modifiable en ligne" />' +
            '<span class="mt-hide-sm" style="font-size:.68rem;color:var(--mt-faint)">seuil ' + st.min + "</span>" +
          "</div>" +
        "</td>" +
        '<td class="mt-hide-sm">' + (lvl === "out" ? badge("danger", "Rupture") : lvl === "low" ? badge("warning", "Stock faible") : badge("success", "Disponible")) + "</td>" +
        '<td><div class="mt-rowacts">' +
          '<button class="mt-btn mt-btn--ghost mt-btn--icon mt-btn--sm" data-act="cart-add" data-id="' + e.id + '" title="Ajouter au panier"' + (st.q <= 0 ? " disabled" : "") + '><i class="bi bi-cart-plus"></i></button>' +
          '<button class="mt-btn mt-btn--ghost mt-btn--icon mt-btn--sm" data-act="stock" data-id="' + e.id + '" data-mode="WITHDRAWAL" title="Retirer du stock" style="color:var(--mt-warning)"' + (st.q <= 0 ? " disabled" : "") + '><i class="bi bi-arrow-up-right"></i></button>' +
          '<button class="mt-btn mt-btn--ghost mt-btn--icon mt-btn--sm" data-act="stock" data-id="' + e.id + '" data-mode="RETURN" title="Restituer au stock" style="color:var(--mt-success)"><i class="bi bi-arrow-down-right"></i></button>' +
          '<button class="mt-btn mt-btn--ghost mt-btn--icon mt-btn--sm mt-hide-sm" data-act="qr" data-id="' + e.id + '" title="QR code"><i class="bi bi-qr-code"></i></button>' +
          '<button class="mt-btn mt-btn--ghost mt-btn--icon mt-btn--sm mt-hide-sm" data-act="rma-new" data-id="' + e.id + '" title="Déclarer un RMA" style="color:var(--mt-danger)"><i class="bi bi-tools"></i></button>' +
        "</div></td></tr>";
    }).join("");

    return pageHead("bi-box-seam", "Équipements",
      "Catalogue global · stock du projet <b>" + esc(currentProject().name) + " (" + currentProject().code + ")</b>",
      '<button class="mt-btn mt-btn--outline" data-act="scan"><i class="bi bi-upc-scan"></i> <span class="mt-hide-sm">Scanner</span></button>' +
      '<button class="mt-btn mt-btn--outline" data-act="export-eq"><i class="bi bi-download"></i> <span class="mt-hide-sm">Exporter CSV</span></button>' +
      '<button class="mt-btn mt-btn--primary" data-act="eq-new"><i class="bi bi-plus-lg"></i> <span class="mt-hide-sm">Nouvel équipement</span></button>') +

      '<div class="mt-stack">' +
        '<div class="mt-card mt-card--pad"><div class="mt-filters">' +
          '<div class="mt-field mt-span2"><label>Recherche</label><div class="mt-search"><i class="bi bi-search"></i>' +
            '<input class="mt-input" type="search" placeholder="Nom, référence, code-barres, QR…" value="' + esc(q.search) + '" data-act="eq-search" /></div></div>' +
          '<div class="mt-field"><label>Type</label>' + selectHTML("eq-type", q.typeId, TYPES, "Tous les types") + "</div>" +
          '<div class="mt-field"><label>Catégorie</label>' + selectHTML("eq-cat", q.catId, CATS, "Toutes catégories") + "</div>" +
          '<div class="mt-field"><label>Activité</label>' + selectHTML("eq-act", q.actId, ACTS, "Toutes activités") + "</div>" +
          '<div class="mt-field"><label>Emplacement</label>' + selectHTML("eq-loc", q.locId, LOCS, "Tous emplacements") + "</div>" +
          '<div class="mt-field"><label>Statut</label>' + selectHTML("eq-status", q.status, [{ id: "ACTIVE", name: "Actif" }, { id: "ARCHIVED", name: "Archivé" }], "Tous statuts") + "</div>" +
          '<div class="mt-field"><label>Raccourcis</label><div class="mt-togglerow">' +
            '<button class="mt-btn mt-btn--outline mt-btn--sm' + (q.low ? " is-on" : "") + '" data-act="eq-low">Stock faible</button>' +
            '<button class="mt-btn mt-btn--outline mt-btn--sm' + (q.fav ? " is-on" : "") + '" data-act="eq-fav"><i class="bi ' + (q.fav ? "bi-star-fill" : "bi-star") + '"></i> Favoris</button>' +
          "</div></div>" +
        "</div></div>" +

        '<div class="mt-card">' +
          (list.length === 0
            ? emptyState("bi-box-seam", "Aucun équipement", "Aucun équipement ne correspond à votre recherche dans ce projet.",
                '<button class="mt-btn mt-btn--outline mt-btn--sm" data-act="eq-clear">Réinitialiser les filtres</button>')
            : '<div class="mt-tablewrap"><table class="mt-table"><thead><tr><th></th>' +
                sortHead("Équipement", "name") +
                sortHead("Catégorie", "category", "mt-hide-md") +
                '<th class="mt-hide-md">Emplacement</th>' +
                sortHead("Stock", "quantity") +
                '<th class="mt-hide-sm">Disponibilité</th>' +
                '<th style="text-align:right">Actions</th>' +
              "</tr></thead><tbody>" + rows + "</tbody></table></div>" +
              pagination(list.length, q.page, PER, "eq-page")) +
        "</div>" +
      "</div>";
  }

  /* ---------- Préparations ------------------------------------------- */
  function viewPreparations() {
    if (S.openPrep) return viewPreparationDetail(S.openPrep);

    var q = S.prepQ, s = norm(q.search.trim());
    var list = S.preps.filter(function (p) {
      if (p.project !== S.project) return false;
      if (q.status === "active") { if (p.status === "TERMINEE" || p.status === "ANNULEE") return false; }
      else if (q.status !== "all" && p.status !== q.status) return false;
      if (s && norm(p.number + " " + p.owner).indexOf(s) === -1) return false;
      return true;
    });

    var rows = list.map(function (p) {
      var req = p.lines.reduce(function (a, l) { return a + l.requested; }, 0);
      var prep = p.lines.reduce(function (a, l) { return a + l.prepared; }, 0);
      var pct = req ? Math.round((prep / req) * 100) : 0;
      var meta = PREP_META[p.status];
      return '<tr style="cursor:pointer" data-act="prep-open" data-id="' + p.id + '">' +
        '<td class="mt-num" style="color:var(--mt-primary);font-weight:700">' + esc(p.number) + "</td>" +
        "<td>" + badge(meta.cls, meta.label) + "</td>" +
        '<td><div style="display:flex;align-items:center;gap:.5rem"><div class="mt-progress"><span style="width:' + pct + '%"></span></div>' +
          '<span class="mt-num" style="color:var(--mt-mut)">' + prep + "/" + req + "</span></div></td>" +
        '<td class="mt-hide-md" style="color:var(--mt-mut)">' + esc(p.owner) + "</td>" +
        '<td class="mt-hide-sm" style="color:var(--mt-mut)">' + fmtDate(p.createdAt) + "</td>" +
        '<td style="text-align:right"><i class="bi bi-arrow-right" style="color:var(--mt-primary)"></i></td></tr>';
    }).join("");

    return pageHead("bi-clipboard-check", "Préparations de commande",
      "Rassemblez le matériel projet par projet avant le retrait",
      '<button class="mt-btn mt-btn--primary" data-act="prep-new"><i class="bi bi-plus-lg"></i> <span class="mt-hide-sm">Nouvelle préparation</span></button>') +
      '<div class="mt-stack">' +
        '<div class="mt-card mt-card--pad"><div class="mt-filters" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
          '<div class="mt-field"><label>Recherche</label><div class="mt-search"><i class="bi bi-search"></i>' +
            '<input class="mt-input" type="search" placeholder="N° de préparation, responsable…" value="' + esc(q.search) + '" data-act="prep-search" /></div></div>' +
          '<div class="mt-field"><label>Statut</label><select class="mt-select" data-act="prep-status">' +
            '<option value="active"' + (q.status === "active" ? " selected" : "") + ">En cours (non clôturées)</option>" +
            Object.keys(PREP_META).map(function (k) {
              return '<option value="' + k + '"' + (q.status === k ? " selected" : "") + ">" + PREP_META[k].label + "</option>";
            }).join("") +
            '<option value="all"' + (q.status === "all" ? " selected" : "") + ">Toutes</option>" +
          "</select></div>" +
        "</div></div>" +
        '<div class="mt-card">' +
          (list.length === 0
            ? emptyState("bi-clipboard-check", "Aucune préparation", "Créez une préparation pour rassembler le matériel avant le retrait.",
                '<button class="mt-btn mt-btn--primary mt-btn--sm" data-act="prep-new"><i class="bi bi-plus-lg"></i> Nouvelle préparation</button>')
            : '<div class="mt-tablewrap"><table class="mt-table"><thead><tr><th>N°</th><th>Statut</th><th>Avancement</th>' +
              '<th class="mt-hide-md">Responsable</th><th class="mt-hide-sm">Créée le</th><th></th></tr></thead><tbody>' + rows + "</tbody></table></div>") +
        "</div>" +
      "</div>";
  }

  function viewPreparationDetail(id) {
    var p = byId(S.preps, id);
    if (!p) { S.openPrep = null; return viewPreparations(); }
    var meta = PREP_META[p.status];
    var req = p.lines.reduce(function (a, l) { return a + l.requested; }, 0);
    var prep = p.lines.reduce(function (a, l) { return a + l.prepared; }, 0);
    var pct = req ? Math.round((prep / req) * 100) : 0;
    var closed = p.status === "TERMINEE" || p.status === "ANNULEE";

    var rows = p.lines.map(function (l) {
      var e = byId(S.equipments, l.eqId);
      var avail = e.stock[p.project].q;
      var done = l.prepared >= l.requested;
      return "<tr>" +
        '<td><div class="mt-eq__n">' + esc(e.name) + '</div><div class="mt-eq__r">' + esc(e.ref) + "</div></td>" +
        '<td class="mt-hide-md" style="color:var(--mt-mut)">' + esc(name(LOCS, e.locId)) + "</td>" +
        '<td class="mt-num">' + l.requested + "</td>" +
        '<td><div class="mt-qty">' +
          '<button class="mt-btn mt-btn--outline mt-btn--icon mt-btn--sm" data-act="prep-dec" data-id="' + p.id + '" data-eq="' + l.eqId + '"' + (closed || l.prepared <= 0 ? " disabled" : "") + '><i class="bi bi-dash"></i></button>' +
          '<input type="number" min="0" max="' + l.requested + '" value="' + l.prepared + '" data-act="prep-set" data-id="' + p.id + '" data-eq="' + l.eqId + '"' + (closed ? " disabled" : "") + ' />' +
          '<button class="mt-btn mt-btn--outline mt-btn--icon mt-btn--sm" data-act="prep-inc" data-id="' + p.id + '" data-eq="' + l.eqId + '"' + (closed || l.prepared >= l.requested ? " disabled" : "") + '><i class="bi bi-plus"></i></button>' +
        "</div></td>" +
        '<td class="mt-hide-sm">' + (avail >= l.requested ? badge("success", avail + " dispo") : badge("warning", avail + " dispo")) + "</td>" +
        "<td>" + (done ? badge("success", "Complet") : badge("muted", "En attente")) + "</td>" +
        '<td style="text-align:right"><button class="mt-btn mt-btn--ghost mt-btn--icon mt-btn--sm" data-act="prep-line-del" data-id="' + p.id + '" data-eq="' + l.eqId + '"' + (closed ? " disabled" : "") + ' title="Retirer la ligne"><i class="bi bi-trash3"></i></button></td>' +
        "</tr>";
    }).join("");

    var actions = "";
    if (p.status === "BROUILLON") actions += '<button class="mt-btn mt-btn--primary" data-act="prep-status" data-id="' + p.id + '" data-to="EN_COURS"><i class="bi bi-play-fill"></i> Démarrer la préparation</button>';
    if (p.status === "EN_COURS") actions += '<button class="mt-btn mt-btn--outline" data-act="prep-fill" data-id="' + p.id + '"><i class="bi bi-check2-all"></i> Tout préparer</button>' +
      '<button class="mt-btn mt-btn--primary" data-act="prep-status" data-id="' + p.id + '" data-to="PRETE"' + (prep < req || req === 0 ? " disabled" : "") + '><i class="bi bi-box-seam"></i> Marquer prête</button>';
    if (p.status === "PRETE") actions += '<button class="mt-btn mt-btn--primary" data-act="prep-close" data-id="' + p.id + '"><i class="bi bi-check2-circle"></i> Clôturer &amp; sortir du stock</button>';
    if (!closed) actions += '<button class="mt-btn mt-btn--outline" data-act="prep-status" data-id="' + p.id + '" data-to="ANNULEE"><i class="bi bi-x-lg"></i> Annuler</button>';

    return '<button class="mt-btn mt-btn--ghost mt-btn--sm" data-act="prep-back" style="margin-bottom:.7rem"><i class="bi bi-arrow-left"></i> Toutes les préparations</button>' +
      pageHead("bi-clipboard-check", p.number,
        "Responsable <b>" + esc(p.owner) + "</b> · créée le " + fmtDate(p.createdAt) + " · " + badge(meta.cls, meta.label), actions) +
      '<div class="mt-stack">' +
        '<div class="mt-card mt-card--pad"><div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">' +
          '<div style="flex:1;min-width:180px"><div style="font-size:.72rem;color:var(--mt-mut);margin-bottom:.35rem">Avancement de la préparation</div>' +
          '<div class="mt-progress" style="height:8px"><span style="width:' + pct + '%"></span></div></div>' +
          '<div style="font-size:1.35rem;font-weight:800">' + pct + "%</div>" +
          '<div style="font-size:.75rem;color:var(--mt-mut)">' + prep + " / " + req + " unité(s) préparée(s)</div>" +
        "</div></div>" +
        '<div class="mt-card"><div class="mt-card__head"><h4>Lignes de la préparation</h4>' +
          '<button class="mt-btn mt-btn--outline mt-btn--sm" data-act="prep-add-line" data-id="' + p.id + '"' + (closed ? " disabled" : "") + '><i class="bi bi-plus-lg"></i> Ajouter un article</button></div>' +
          (p.lines.length === 0 ? emptyState("bi-list-check", "Préparation vide", "Ajoutez des articles ou dépliez un kit métier.")
            : '<div class="mt-tablewrap"><table class="mt-table"><thead><tr><th>Article</th><th class="mt-hide-md">Emplacement</th>' +
              "<th>Demandé</th><th>Préparé</th><th class=\"mt-hide-sm\">Stock projet</th><th>État</th><th></th></tr></thead><tbody>" + rows + "</tbody></table></div>") +
        "</div>" +
        '<div class="mt-note mt-note--warn"><i class="bi bi-info-circle"></i><div>' +
          "<b>Dans SysTrack</b>, la clôture d'une préparation génère automatiquement le <b>bon de retrait Excel</b> " +
          "(numérotation séquentielle partagée avec les bons de livraison, modèle d'entreprise conservé). " +
          "Cette génération documentaire n'est volontairement pas incluse dans MiniTrack — la clôture se contente ici de sortir le matériel du stock." +
        "</div></div>" +
      "</div>";
  }

  /* ---------- Kits métier -------------------------------------------- */
  function viewKits() {
    var q = S.kitQ, s = norm(q.search.trim());
    var list = S.kits.filter(function (k) {
      if (k.project !== S.project) return false;
      if (q.catId !== "all" && k.catId !== q.catId) return false;
      if (s && norm(k.name).indexOf(s) === -1) return false;
      return true;
    });

    var cards = list.map(function (k) {
      var cat = byId(CATS, k.catId);
      var units = k.items.reduce(function (a, i) { return a + i.qty; }, 0);
      var deployable = k.items.every(function (i) {
        var e = byId(S.equipments, i.eqId);
        return e && e.stock[S.project].q >= i.qty;
      });
      return '<div class="mt-card mt-kit"' + (k.archived ? ' style="opacity:.55"' : "") + ">" +
        '<div class="mt-kit__top">' +
          '<span class="mt-kit__i" style="background:' + cat.color + '22;color:' + cat.color + '"><i class="bi bi-boxes"></i></span>' +
          "<div style=\"min-width:0;flex:1\"><b>" + esc(k.name) + "</b><span>" + esc(cat.name) + " · " + k.items.length + " ligne(s) · " + units + " unité(s)</span></div>" +
          (k.archived ? badge("muted", "Archivé") : "") +
        "</div>" +
        '<ul class="mt-kit__list">' + k.items.map(function (i) {
          var e = byId(S.equipments, i.eqId);
          var ok = e.stock[S.project].q >= i.qty;
          return "<li><span style=\"overflow:hidden;text-overflow:ellipsis;white-space:nowrap\">" + esc(e.name) + "</span>" +
            '<b style="color:' + (ok ? "var(--mt-fg)" : "var(--mt-danger)") + '">×' + i.qty + "</b></li>";
        }).join("") + "</ul>" +
        '<div class="mt-kit__foot">' +
          '<button class="mt-btn mt-btn--primary mt-btn--sm" data-act="kit-deploy" data-id="' + k.id + '" style="flex:1"' + (deployable && !k.archived ? "" : " disabled") + '>' +
            '<i class="bi bi-cart-plus"></i> ' + (deployable ? "Déplier dans le panier" : "Stock insuffisant") + "</button>" +
          '<button class="mt-btn mt-btn--outline mt-btn--icon mt-btn--sm" data-act="kit-dup" data-id="' + k.id + '" title="Dupliquer"><i class="bi bi-copy"></i></button>' +
          '<button class="mt-btn mt-btn--outline mt-btn--icon mt-btn--sm" data-act="kit-archive" data-id="' + k.id + '" title="' + (k.archived ? "Désarchiver" : "Archiver") + '"><i class="bi ' + (k.archived ? "bi-arrow-counterclockwise" : "bi-archive") + '"></i></button>' +
        "</div></div>";
    }).join("");

    return pageHead("bi-boxes", "Kits métier",
      "Compositions propres au projet <b>" + esc(currentProject().name) + "</b> — un kit n'est visible que dans son projet",
      '<button class="mt-btn mt-btn--primary" data-act="kit-new"><i class="bi bi-plus-lg"></i> <span class="mt-hide-sm">Nouveau kit</span></button>') +
      '<div class="mt-stack">' +
        '<div class="mt-card mt-card--pad"><div class="mt-filters" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
          '<div class="mt-field"><label>Recherche</label><div class="mt-search"><i class="bi bi-search"></i>' +
            '<input class="mt-input" type="search" placeholder="Nom du kit…" value="' + esc(q.search) + '" data-act="kit-search" /></div></div>' +
          '<div class="mt-field"><label>Catégorie</label>' + selectHTML("kit-cat", q.catId, CATS, "Toutes catégories") + "</div>" +
        "</div></div>" +
        (list.length === 0
          ? '<div class="mt-card">' + emptyState("bi-boxes", "Aucun kit", "Aucun kit métier ne correspond dans ce projet.") + "</div>"
          : '<div class="mt-kits">' + cards + "</div>") +
      "</div>";
  }

  /* ---------- Mouvements ---------------------------------------------- */
  function viewMovements() {
    var q = S.movQ, PER = 12, s = norm(q.search.trim());
    var list = S.movements.filter(function (m) {
      if (m.project !== S.project) return false;
      if (q.type !== "all" && m.type !== q.type) return false;
      if (s) {
        var e = byId(S.equipments, m.eqId);
        var hay = norm((e ? e.name + " " + e.ref : "") + " " + m.user + " " + m.reason);
        if (hay.indexOf(s) === -1) return false;
      }
      return true;
    });
    var pages = Math.max(1, Math.ceil(list.length / PER));
    if (q.page > pages) q.page = pages;
    var slice = list.slice((q.page - 1) * PER, q.page * PER);

    var rows = slice.map(function (m) {
      var e = byId(S.equipments, m.eqId), meta = MOV_META[m.type];
      var pos = m.type === "RETURN" || m.type === "RMA_IN";
      return "<tr>" +
        '<td style="color:var(--mt-mut)" class="mt-num">' + fmtDateTime(m.date) + "</td>" +
        "<td>" + badge(meta.cls, meta.label) + "</td>" +
        '<td><div class="mt-eq__n">' + esc(e ? e.name : "—") + '</div><div class="mt-eq__r">' + esc(e ? e.ref : "") + "</div></td>" +
        '<td class="mt-num" style="font-weight:700;color:var(--mt-' + (pos ? "success" : "warning") + ')">' + (pos ? "+" : "−") + m.qty + "</td>" +
        '<td class="mt-hide-md" style="color:var(--mt-mut)">' + esc(m.user) + "</td>" +
        '<td class="mt-hide-sm" style="color:var(--mt-mut)">' + esc(m.reason) + "</td></tr>";
    }).join("");

    return pageHead("bi-arrow-left-right", "Mouvements de stock",
      "Historique complet et traçable du projet <b>" + esc(currentProject().name) + "</b>",
      '<button class="mt-btn mt-btn--outline" data-act="export-mov"><i class="bi bi-download"></i> <span class="mt-hide-sm">Exporter CSV</span></button>') +
      '<div class="mt-stack">' +
        '<div class="mt-card mt-card--pad"><div class="mt-filters" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
          '<div class="mt-field"><label>Recherche</label><div class="mt-search"><i class="bi bi-search"></i>' +
            '<input class="mt-input" type="search" placeholder="Équipement, utilisateur, motif…" value="' + esc(q.search) + '" data-act="mov-search" /></div></div>' +
          '<div class="mt-field"><label>Type de mouvement</label><select class="mt-select" data-act="mov-type">' +
            '<option value="all"' + (q.type === "all" ? " selected" : "") + ">Tous les types</option>" +
            Object.keys(MOV_META).map(function (k) {
              return '<option value="' + k + '"' + (q.type === k ? " selected" : "") + ">" + MOV_META[k].label + "</option>";
            }).join("") + "</select></div>" +
        "</div></div>" +
        '<div class="mt-card">' +
          (list.length === 0 ? emptyState("bi-arrow-left-right", "Aucun mouvement", "Aucun mouvement ne correspond aux filtres.")
            : '<div class="mt-tablewrap"><table class="mt-table"><thead><tr><th>Date</th><th>Type</th><th>Équipement</th>' +
              '<th>Qté</th><th class="mt-hide-md">Utilisateur</th><th class="mt-hide-sm">Motif</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
              pagination(list.length, q.page, PER, "mov-page")) +
        "</div>" +
      "</div>";
  }

  /* ---------- RMA ------------------------------------------------------ */
  function viewRma() {
    var q = S.rmaQ, s = norm(q.search.trim());
    var list = S.rmas.filter(function (r) {
      if (r.project !== S.project) return false;
      if (q.status === "active") { if (r.status === "RESTITUE") return false; }
      else if (q.status !== "all" && r.status !== q.status) return false;
      if (s) {
        var e = byId(S.equipments, r.eqId);
        if (norm(r.number + " " + (e ? e.name : "") + " " + r.reason).indexOf(s) === -1) return false;
      }
      return true;
    });

    var rows = list.map(function (r) {
      var e = byId(S.equipments, r.eqId), meta = RMA_META[r.status];
      var next = r.status === "SIGNALE" ? "ENVOYE" : r.status === "ENVOYE" ? "RESTITUE" : null;
      var nextLabel = next === "ENVOYE" ? "Envoyer au SAV" : next === "RESTITUE" ? "Réintégrer au stock" : "";
      return "<tr>" +
        '<td class="mt-num" style="font-weight:700;color:var(--mt-primary)">' + esc(r.number) + "</td>" +
        '<td><div class="mt-eq__n">' + esc(e ? e.name : "—") + '</div><div class="mt-eq__r">' + esc(e ? e.ref : "") + "</div></td>" +
        '<td class="mt-num">' + r.qty + "</td>" +
        "<td>" + badge(meta.cls, meta.label) + "</td>" +
        '<td class="mt-hide-md" style="color:var(--mt-mut)">' + esc(r.reason) + "</td>" +
        '<td class="mt-hide-sm" style="color:var(--mt-mut)">' + fmtDate(r.createdAt) + "</td>" +
        '<td style="text-align:right"><div class="mt-rowacts">' +
          (next ? '<button class="mt-btn mt-btn--outline mt-btn--sm" data-act="rma-next" data-id="' + r.id + '" data-to="' + next + '">' + nextLabel + "</button>" : badge("success", "Clôturé")) +
          '<button class="mt-btn mt-btn--ghost mt-btn--icon mt-btn--sm" data-act="rma-del" data-id="' + r.id + '" title="Supprimer"><i class="bi bi-trash3"></i></button>' +
        "</div></td></tr>";
    }).join("");

    return pageHead("bi-wrench-adjustable", "RMA — matériel défaillant",
      "Suivi des retours en réparation / remplacement du projet <b>" + esc(currentProject().name) + "</b>",
      '<button class="mt-btn mt-btn--primary" data-act="rma-new"><i class="bi bi-plus-lg"></i> <span class="mt-hide-sm">Déclarer un défaut</span></button>') +
      '<div class="mt-stack">' +
        '<div class="mt-card mt-card--pad"><div class="mt-filters" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
          '<div class="mt-field"><label>Recherche</label><div class="mt-search"><i class="bi bi-search"></i>' +
            '<input class="mt-input" type="search" placeholder="N° de ticket, équipement, motif…" value="' + esc(q.search) + '" data-act="rma-search" /></div></div>' +
          '<div class="mt-field"><label>Statut</label><select class="mt-select" data-act="rma-status">' +
            '<option value="active"' + (q.status === "active" ? " selected" : "") + ">En cours</option>" +
            Object.keys(RMA_META).map(function (k) {
              return '<option value="' + k + '"' + (q.status === k ? " selected" : "") + ">" + RMA_META[k].label + "</option>";
            }).join("") +
            '<option value="all"' + (q.status === "all" ? " selected" : "") + ">Tous</option>" +
          "</select></div>" +
        "</div></div>" +
        '<div class="mt-card">' +
          (list.length === 0 ? emptyState("bi-wrench-adjustable", "Aucun ticket RMA", "Aucun matériel défaillant n'est en cours de traitement.")
            : '<div class="mt-tablewrap"><table class="mt-table"><thead><tr><th>N°</th><th>Équipement</th><th>Qté</th><th>Statut</th>' +
              '<th class="mt-hide-md">Motif</th><th class="mt-hide-sm">Déclaré le</th><th></th></tr></thead><tbody>' + rows + "</tbody></table></div>") +
        "</div>" +
        '<div class="mt-note"><i class="bi bi-info-circle"></i><div>Le <b>signalement</b> sort immédiatement le matériel du stock du projet ; ' +
          "la <b>restitution</b> le réintègre automatiquement. Chaque changement d'état est historisé dans le journal d'audit.</div></div>" +
      "</div>";
  }

  /* ---------- Projets --------------------------------------------------- */
  function viewProjects() {
    var cards = PROJECTS.map(function (p) {
      var units = S.equipments.reduce(function (a, e) { return a + e.stock[p.id].q; }, 0);
      var low = S.equipments.filter(function (e) { return e.stock[p.id].q > 0 && e.stock[p.id].q <= e.stock[p.id].min; }).length;
      var out = S.equipments.filter(function (e) { return e.stock[p.id].q <= 0; }).length;
      var movs = S.movements.filter(function (m) { return m.project === p.id; }).length;
      var preps = S.preps.filter(function (x) { return x.project === p.id && x.status !== "TERMINEE" && x.status !== "ANNULEE"; }).length;
      var active = p.id === S.project;
      return '<div class="mt-card" style="' + (active ? "border-color:var(--mt-primary)" : "") + '">' +
        '<div class="mt-card__head"><div><h4>' + esc(p.name) + " " + (active ? badge("primary", "Projet courant") : "") + "</h4>" +
          '<p style="font-size:.74rem;color:var(--mt-mut);margin-top:.2rem">' + esc(p.desc) + "</p></div>" +
          '<span class="mt-badge mt-badge--muted mt-num">' + p.code + "</span></div>" +
        '<div class="mt-card__body">' +
          '<div class="mt-kv"><span>Unités en stock</span><b>' + units + "</b></div>" +
          '<div class="mt-kv"><span>Références en stock faible</span><b style="color:var(--mt-warning)">' + low + "</b></div>" +
          '<div class="mt-kv"><span>Références en rupture</span><b style="color:var(--mt-danger)">' + out + "</b></div>" +
          '<div class="mt-kv"><span>Mouvements enregistrés</span><b>' + movs + "</b></div>" +
          '<div class="mt-kv"><span>Préparations ouvertes</span><b>' + preps + "</b></div>" +
          '<div class="mt-kv"><span>Kits métier</span><b>' + S.kits.filter(function (k) { return k.project === p.id; }).length + "</b></div>" +
          '<button class="mt-btn ' + (active ? "mt-btn--outline" : "mt-btn--primary") + '" data-act="project-switch" data-id="' + p.id + '" style="width:100%;margin-top:.8rem"' + (active ? " disabled" : "") + ">" +
            '<i class="bi bi-arrow-left-right"></i> ' + (active ? "Projet déjà sélectionné" : "Basculer sur ce projet") + "</button>" +
        "</div></div>";
    }).join("");

    return pageHead("bi-kanban", "Projets", "Le catalogue est global, le <b>stock est suivi projet par projet</b>") +
      '<div class="mt-stack"><div class="mt-grid11">' + cards + "</div>" +
      '<div class="mt-note"><i class="bi bi-diagram-3"></i><div>Deux projets partagent la même fiche équipement mais ont des <b>quantités et seuils indépendants</b>. ' +
      "Dans SysTrack, un compte <b>USER</b> ne voit que les projets auxquels un administrateur l'a rattaché.</div></div></div>";
  }

  /* ---------- Journal d'audit -------------------------------------------- */
  function viewAudit() {
    var META = {
      LOGIN: { cls: "primary", icon: "bi-box-arrow-in-right", label: "Connexion" },
      CREATE: { cls: "success", icon: "bi-plus-circle", label: "Création" },
      UPDATE: { cls: "primary", icon: "bi-pencil", label: "Modification" },
      DELETE: { cls: "danger", icon: "bi-trash3", label: "Suppression" },
      WITHDRAWAL: { cls: "warning", icon: "bi-arrow-up-right", label: "Retrait" },
      RETURN: { cls: "success", icon: "bi-arrow-down-right", label: "Retour" },
      RMA: { cls: "danger", icon: "bi-wrench-adjustable", label: "RMA" },
      PREPARATION: { cls: "violet", icon: "bi-clipboard-check", label: "Préparation" },
      PROJECT: { cls: "muted", icon: "bi-kanban", label: "Projet" }
    };
    var rows = S.audit.slice(0, 60).map(function (a) {
      var m = META[a.action] || META.UPDATE;
      return "<li>" +
        '<span class="mt-feed__i mt-badge--' + m.cls + '"><i class="bi ' + m.icon + '"></i></span>' +
        '<span class="mt-feed__t"><b>' + esc(a.detail) + "</b><span>" + esc(m.label) + " · " + esc(a.user) + " · " + fmtDateTime(a.at) + " (" + relative(a.at) + ")</span></span>" +
        "</li>";
    }).join("");

    return pageHead("bi-journal-text", "Journal d'audit",
      "Toutes vos actions dans cette démo sont historisées en direct",
      '<button class="mt-btn mt-btn--outline" data-act="export-audit"><i class="bi bi-download"></i> <span class="mt-hide-sm">Exporter CSV</span></button>') +
      '<div class="mt-card"><div class="mt-card__body"><ul class="mt-feed">' + rows + "</ul></div></div>";
  }

  /* =================================================================
     7. Rendu principal
     ================================================================= */

  var VIEWS = {
    dashboard: viewDashboard, equipments: viewEquipments, preparations: viewPreparations,
    kits: viewKits, movements: viewMovements, rma: viewRma, projects: viewProjects, audit: viewAudit
  };

  function render() {
    var content = root.querySelector("[data-content]");
    var scrollTop = content.scrollTop;
    var wrap = document.createElement("div");
    wrap.className = "mt-view is-active";
    wrap.innerHTML = (VIEWS[S.view] || viewDashboard)();
    content.innerHTML = "";
    content.appendChild(wrap);
    if (keepScroll) { content.scrollTop = scrollTop; keepScroll = false; }

    /* Navigation active + compteurs */
    Array.prototype.forEach.call(root.querySelectorAll("[data-act='nav']"), function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-view") === S.view);
    });
    setCount("preparations", S.preps.filter(function (p) { return p.project === S.project && p.status !== "TERMINEE" && p.status !== "ANNULEE"; }).length);
    setCount("rma", S.rmas.filter(function (r) { return r.project === S.project && r.status !== "RESTITUE"; }).length);
    setCount("equipments", S.equipments.filter(function (e) { return e.stock[S.project].q <= e.stock[S.project].min; }).length);

    renderCart();
    root.setAttribute("data-theme", S.theme);
    root.classList.toggle("is-collapsed", S.collapsed);
    var themeIcon = root.querySelector("[data-act='theme'] i");
    if (themeIcon) themeIcon.className = "bi " + (S.theme === "dark" ? "bi-sun" : "bi-moon-stars");
    var projSelect = root.querySelector("[data-act='project']");
    if (projSelect) projSelect.value = S.project;
  }

  var keepScroll = false;
  function rerender(keep) { keepScroll = !!keep; render(); }

  function setCount(view, n) {
    var el = root.querySelector("[data-count='" + view + "']");
    if (!el) return;
    el.textContent = n;
    el.style.display = n > 0 ? "" : "none";
  }

  /* --- Panier -------------------------------------------------------- */
  function renderCart() {
    var body = root.querySelector("[data-cart-body]");
    var foot = root.querySelector("[data-cart-foot]");
    var count = root.querySelector("[data-cart-count]");
    var lines = S.cart.filter(function (c) { return c.project === S.project; });

    count.textContent = lines.length;
    count.style.display = lines.length ? "" : "none";

    if (!lines.length) {
      body.innerHTML = emptyState("bi-cart3", "Panier vide", "Ajoutez des équipements depuis la liste ou dépliez un kit métier pour préparer un retrait.");
      foot.innerHTML = '<div class="mt-note"><i class="bi bi-lightbulb"></i><div>Le panier est <b>lié au projet courant</b> : changer de projet change de panier.</div></div>';
      return;
    }

    body.innerHTML = lines.map(function (c) {
      var e = byId(S.equipments, c.eqId);
      return '<div class="mt-line">' +
        '<div class="mt-line__top"><div style="min-width:0"><b>' + esc(e.name) + '</b><div class="mt-eq__r">' + esc(e.ref) + "</div></div>" +
        '<button class="mt-del" data-act="cart-del" data-id="' + c.eqId + '" aria-label="Retirer"><i class="bi bi-trash3"></i></button></div>' +
        '<div class="mt-line__bot"><div class="mt-qty">' +
          '<button class="mt-btn mt-btn--outline mt-btn--icon mt-btn--sm" data-act="cart-dec" data-id="' + c.eqId + '"' + (c.qty <= 1 ? " disabled" : "") + '><i class="bi bi-dash"></i></button>' +
          '<input type="number" min="1" max="' + e.stock[S.project].q + '" value="' + c.qty + '" data-act="cart-set" data-id="' + c.eqId + '" />' +
          '<button class="mt-btn mt-btn--outline mt-btn--icon mt-btn--sm" data-act="cart-inc" data-id="' + c.eqId + '"' + (c.qty >= e.stock[S.project].q ? " disabled" : "") + '><i class="bi bi-plus"></i></button>' +
        '</div><span style="font-size:.7rem;color:var(--mt-faint)">dispo : ' + e.stock[S.project].q + "</span></div></div>";
    }).join("");

    var units = lines.reduce(function (a, c) { return a + c.qty; }, 0);
    foot.innerHTML =
      '<div style="display:flex;justify-content:space-between;font-size:.8rem">' +
        '<span style="color:var(--mt-mut)">' + lines.length + " ligne(s)</span><b>" + units + " unité(s)</b></div>" +
      '<div style="display:flex;gap:.5rem">' +
        '<button class="mt-btn mt-btn--outline" style="flex:1" data-act="cart-clear">Vider</button>' +
        '<button class="mt-btn mt-btn--primary" style="flex:1" data-act="cart-checkout"><i class="bi bi-check2-circle"></i> Valider le retrait</button>' +
      "</div>";
  }

  /* --- Toasts --------------------------------------------------------- */
  function toast(msg, kind) {
    var host = root.querySelector("[data-toasts]");
    var el = document.createElement("div");
    var icon = kind === "err" ? "bi-x-circle" : kind === "info" ? "bi-info-circle" : "bi-check-circle";
    el.className = "mt-toast mt-toast--" + (kind || "ok");
    el.innerHTML = '<i class="bi ' + icon + '"></i><div>' + msg + "</div>";
    host.appendChild(el);
    setTimeout(function () {
      el.classList.add("is-out");
      setTimeout(function () { el.remove(); }, 260);
    }, 3200);
  }

  /* --- Modale --------------------------------------------------------- */
  function openModal(html, wide) {
    var m = root.querySelector("[data-modal]");
    var box = root.querySelector("[data-modal-box]");
    box.className = "mt-modal__box" + (wide ? " mt-modal__box--wide" : "");
    box.innerHTML = html;
    m.classList.add("is-open");
    var first = box.querySelector("input,select,textarea,button");
    if (first) setTimeout(function () { try { first.focus(); } catch (e) {} }, 40);
  }
  function closeModal() {
    root.querySelector("[data-modal]").classList.remove("is-open");
    root.querySelector("[data-modal-box]").innerHTML = "";
  }
  function modalShell(title, subtitle, body, footer, wide) {
    openModal(
      '<div class="mt-modal__head"><div><h4>' + title + "</h4>" + (subtitle ? "<p>" + subtitle + "</p>" : "") + "</div>" +
        '<button class="mt-btn mt-btn--ghost mt-btn--icon mt-btn--sm" data-act="modal-close"><i class="bi bi-x-lg"></i></button></div>' +
      '<div class="mt-modal__body">' + body + "</div>" +
      '<div class="mt-modal__foot">' + footer + "</div>", wide);
  }

  /* --- Export CSV ------------------------------------------------------ */
  function downloadCSV(filename, rows) {
    var csv = rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(";");
    }).join("\r\n");
    var blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 400);
  }

  /* =================================================================
     8. Actions métier
     ================================================================= */

  function applyStock(eq, delta, type, reason) {
    var st = stockOf(eq);
    st.q = Math.max(0, st.q + delta);
    addMovement(type, eq.id, Math.abs(delta), reason);
  }

  function addToCart(eq, qty) {
    var avail = qtyOf(eq);
    if (avail <= 0) { toast("Stock indisponible pour <b>" + esc(eq.name) + "</b>", "err"); return false; }
    var line = null;
    for (var i = 0; i < S.cart.length; i++) {
      if (S.cart[i].eqId === eq.id && S.cart[i].project === S.project) { line = S.cart[i]; break; }
    }
    var want = qty || 1;
    if (line) {
      if (line.qty >= avail) { toast("Quantité maximale atteinte pour <b>" + esc(eq.ref) + "</b>", "err"); return false; }
      line.qty = Math.min(avail, line.qty + want);
    } else {
      S.cart.push({ eqId: eq.id, project: S.project, qty: Math.min(avail, want) });
    }
    return true;
  }

  function openCart(open) {
    root.querySelector("[data-drawer]").classList.toggle("is-open", open);
    root.querySelector("[data-scrim]").classList.toggle("is-open", open);
  }

  /* --- Dialogue retrait / retour ---------------------------------------- */
  function stockDialog(eq, mode) {
    var isOut = mode === "WITHDRAWAL";
    var max = isOut ? qtyOf(eq) : 999;
    modalShell(
      (isOut ? '<i class="bi bi-arrow-up-right" style="color:var(--mt-warning)"></i> Retirer du stock'
             : '<i class="bi bi-arrow-down-right" style="color:var(--mt-success)"></i> Restituer au stock'),
      esc(eq.name) + " · " + esc(eq.ref) + " — projet " + esc(currentProject().name),
      '<div class="mt-kv"><span>Stock actuel</span><b>' + qtyOf(eq) + " unité(s)</b></div>" +
      '<div class="mt-kv"><span>Seuil d\'alerte</span><b>' + minOf(eq) + "</b></div>" +
      '<div class="mt-field"><label>Quantité</label><input class="mt-input" type="number" id="mt-qty" min="1" max="' + max + '" value="1" /></div>' +
      '<div class="mt-field"><label>Motif (obligatoire)</label><textarea class="mt-input" id="mt-reason" placeholder="' +
        (isOut ? "Déploiement poste utilisateur, intervention client…" : "Retour de mission, matériel non utilisé…") + '"></textarea></div>' +
      '<div class="mt-note"><i class="bi bi-shield-check"></i><div>Chaque mouvement est <b>transactionnel</b> et historisé (utilisateur, date, quantité, motif).</div></div>',
      '<button class="mt-btn mt-btn--outline" data-act="modal-close">Annuler</button>' +
      '<button class="mt-btn mt-btn--primary" data-act="stock-confirm" data-id="' + eq.id + '" data-mode="' + mode + '">' +
        '<i class="bi bi-check2"></i> Confirmer</button>');
  }

  /* --- Fiche équipement --------------------------------------------------- */
  function equipmentDialog(eq) {
    var st = stockOf(eq), cat = byId(CATS, eq.catId);
    modalShell('<i class="bi bi-box-seam"></i> ' + esc(eq.name), esc(eq.ref) + " · " + esc(name(TYPES, eq.typeId)),
      '<div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start">' +
        '<div class="mt-qr" style="flex:0 0 auto">' + qrSVG(eq.ref + "|" + eq.id, 130) +
          '<span style="font-family:var(--mt-mono);font-size:.68rem;color:var(--mt-faint)">' + esc(eq.ref) + "</span></div>" +
        '<div style="flex:1;min-width:200px">' +
          '<div class="mt-kv"><span>Catégorie</span><b style="color:' + cat.color + '">' + esc(cat.name) + "</b></div>" +
          '<div class="mt-kv"><span>Activité</span><b>' + esc(name(ACTS, eq.actId)) + "</b></div>" +
          '<div class="mt-kv"><span>Emplacement</span><b>' + esc(name(LOCS, eq.locId)) + "</b></div>" +
          '<div class="mt-kv"><span>Stock ' + esc(currentProject().code) + "</span>" + stockBadge(eq) + "</div>" +
          '<div class="mt-kv"><span>Stock autre projet</span><b>' + eq.stock[S.project === "PA" ? "PB" : "PA"].q + " unité(s)</b></div>" +
          '<div class="mt-kv"><span>Statut</span>' + (eq.status === "ACTIVE" ? badge("success", "Actif") : badge("muted", "Archivé")) + "</div>" +
        "</div></div>" +
      '<div style="font-size:.72rem;font-weight:700;color:var(--mt-mut);margin-top:.4rem">3 derniers mouvements</div>' +
      '<ul class="mt-feed">' + (S.movements.filter(function (m) { return m.eqId === eq.id && m.project === S.project; }).slice(0, 3).map(function (m) {
        var meta = MOV_META[m.type];
        return '<li><span class="mt-feed__i mt-badge--' + meta.cls + '"><i class="bi ' + meta.icon + '"></i></span>' +
          '<span class="mt-feed__t"><b>' + meta.label + " · " + m.qty + " unité(s)</b><span>" + esc(m.user) + " · " + relative(m.date) + " · " + esc(m.reason) + "</span></span></li>";
      }).join("") || '<li style="border:0"><span class="mt-feed__t"><span style="color:var(--mt-faint)">Aucun mouvement sur ce projet.</span></span></li>') + "</ul>",
      '<button class="mt-btn mt-btn--outline" data-act="cart-add" data-id="' + eq.id + '"' + (st.q <= 0 ? " disabled" : "") + '><i class="bi bi-cart-plus"></i> Panier</button>' +
      '<button class="mt-btn mt-btn--outline" data-act="stock" data-id="' + eq.id + '" data-mode="RETURN"><i class="bi bi-arrow-down-right"></i> Restituer</button>' +
      '<button class="mt-btn mt-btn--primary" data-act="stock" data-id="' + eq.id + '" data-mode="WITHDRAWAL"' + (st.q <= 0 ? " disabled" : "") + '><i class="bi bi-arrow-up-right"></i> Retirer</button>', true);
  }

  function eqOptions(selected) {
    return S.equipments.map(function (e) {
      return '<option value="' + e.id + '"' + (e.id === selected ? " selected" : "") + ">" +
        esc(e.ref + " — " + e.name) + " (" + e.stock[S.project].q + " dispo)</option>";
    }).join("");
  }

  /* =================================================================
     9. Gestion des évènements
     ================================================================= */

  var searchTimer = null;
  function debounce(fn) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(fn, 260);
  }

  root.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-act]");
    if (!t || !root.contains(t)) return;
    var act = t.getAttribute("data-act");
    var id = t.getAttribute("data-id");
    var eq = id ? byId(S.equipments, id) : null;

    switch (act) {
      /* --- Coquille ------------------------------------------------- */
      case "nav":
        S.view = t.getAttribute("data-view");
        S.openPrep = null;
        render();
        break;

      case "collapse":
        S.collapsed = !S.collapsed;
        root.classList.toggle("is-collapsed", S.collapsed);
        break;

      case "theme":
        S.theme = S.theme === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", S.theme);
        t.querySelector("i").className = "bi " + (S.theme === "dark" ? "bi-sun" : "bi-moon-stars");
        break;

      case "full":
        S.full = !S.full;
        root.classList.toggle("is-full", S.full);
        document.body.classList.toggle("mt-locked", S.full);
        t.querySelector("i").className = "bi " + (S.full ? "bi-fullscreen-exit" : "bi-arrows-fullscreen");
        if (S.full) root.scrollIntoView({ block: "start" });
        break;

      case "reset":
        var keepUi = { theme: S.theme, collapsed: S.collapsed, full: S.full, view: S.view };
        S = buildState();
        S.theme = keepUi.theme; S.collapsed = keepUi.collapsed; S.full = keepUi.full; S.view = keepUi.view;
        render();
        toast("Démo réinitialisée — jeu de données d'origine restauré", "info");
        break;

      case "user":
        modalShell('<i class="bi bi-person-badge"></i> Compte de démonstration', "Authentification simulée",
          '<div class="mt-kv"><span>Utilisateur</span><b>Aly-Ba Dramé</b></div>' +
          '<div class="mt-kv"><span>Rôle</span>' + badge("primary", "ADMIN") + "</div>" +
          '<div class="mt-kv"><span>Projets accessibles</span><b>Projet Alpha · Projet Beta</b></div>' +
          '<div class="mt-note"><i class="bi bi-shield-lock"></i><div>Dans <b>SysTrack</b>, la connexion passe par <b>Logto (OIDC)</b> : ' +
            "redirection SSO, jeton d'accès vérifié côté serveur et rapprochement avec un compte local. " +
            "Trois rôles cohabitent — <b>ADMIN</b>, <b>MANAGER</b>, <b>USER</b> — et un compte USER ne voit " +
            "que les projets auxquels il est rattaché.</div></div>",
          '<button class="mt-btn mt-btn--primary" data-act="modal-close">Compris</button>');
        break;

      case "modal-close": closeModal(); break;

      /* --- Projet ---------------------------------------------------- */
      case "project-switch":
        S.project = id;
        S.eqQ.page = 1; S.movQ.page = 1; S.openPrep = null;
        logAudit("PROJECT", "Bascule sur le projet " + byId(PROJECTS, id).name);
        render();
        toast("Projet courant : <b>" + esc(byId(PROJECTS, id).name) + "</b>", "info");
        break;

      /* --- Équipements ------------------------------------------------ */
      case "eq-sort":
        var f = t.getAttribute("data-field");
        if (S.eqQ.sortBy === f) S.eqQ.sortOrder = S.eqQ.sortOrder === "asc" ? "desc" : "asc";
        else { S.eqQ.sortBy = f; S.eqQ.sortOrder = "asc"; }
        rerender(true);
        break;

      case "eq-page":
        if (t.hasAttribute("disabled")) break;
        S.eqQ.page = clamp(parseInt(t.getAttribute("data-page"), 10), 1, 999);
        rerender(true);
        break;

      case "mov-page":
        if (t.hasAttribute("disabled")) break;
        S.movQ.page = clamp(parseInt(t.getAttribute("data-page"), 10), 1, 999);
        rerender(true);
        break;

      case "eq-low": S.eqQ.low = !S.eqQ.low; S.eqQ.page = 1; rerender(true); break;
      case "eq-fav": S.eqQ.fav = !S.eqQ.fav; S.eqQ.page = 1; rerender(true); break;

      case "eq-clear":
        S.eqQ = { page: 1, search: "", typeId: "all", catId: "all", actId: "all", locId: "all",
                  status: "all", low: false, fav: false, sortBy: "name", sortOrder: "asc" };
        rerender(true);
        break;

      case "goto-low":
        S.view = "equipments"; S.eqQ.low = true; S.eqQ.page = 1;
        render();
        break;

      case "fav":
        eq.fav = !eq.fav;
        logAudit("UPDATE", (eq.fav ? "Ajout aux favoris : " : "Retrait des favoris : ") + eq.ref);
        rerender(true);
        break;

      case "eq-detail": equipmentDialog(eq); break;

      case "qr":
        modalShell('<i class="bi bi-qr-code"></i> QR code — ' + esc(eq.ref), esc(eq.name),
          '<div class="mt-qr">' + qrSVG(eq.ref + "|" + eq.id, 200) +
            '<span style="font-family:var(--mt-mono);font-size:.75rem">' + esc(eq.ref) + "</span></div>" +
          '<div class="mt-note"><i class="bi bi-camera"></i><div>SysTrack génère un <b>QR code</b> et un <b>code-barres</b> par équipement, ' +
            "lisibles directement <b>à la caméra</b> depuis un mobile pour ouvrir la fiche et enchaîner un retrait.</div></div>",
          '<button class="mt-btn mt-btn--outline" data-act="modal-close">Fermer</button>' +
          '<button class="mt-btn mt-btn--primary" data-act="stock" data-id="' + eq.id + '" data-mode="WITHDRAWAL"' + (qtyOf(eq) <= 0 ? " disabled" : "") + '><i class="bi bi-arrow-up-right"></i> Retirer</button>');
        break;

      case "scan":
        var pool = S.equipments.filter(function (e) { return e.stock[S.project].q > 0; });
        if (!pool.length) { toast("Aucun équipement disponible à scanner", "err"); break; }
        var picked = pool[Math.floor(Math.random() * pool.length)];
        toast('<b>Code scanné :</b> ' + esc(picked.ref) + " — fiche ouverte", "info");
        equipmentDialog(picked);
        break;

      case "eq-new":
        modalShell('<i class="bi bi-plus-circle"></i> Nouvel équipement', "Création dans le catalogue global",
          '<div class="mt-field"><label>Nom de l\'équipement *</label><input class="mt-input" id="mt-eq-name" placeholder="Ex. Écran 27&quot; Dell U2723QE" /></div>' +
          '<div class="mt-field"><label>Référence *</label><input class="mt-input" id="mt-eq-ref" placeholder="Ex. ECR-021" /></div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">' +
            '<div class="mt-field"><label>Type</label><select class="mt-select" id="mt-eq-type">' + TYPES.map(function (o) { return '<option value="' + o.id + '">' + esc(o.name) + "</option>"; }).join("") + "</select></div>" +
            '<div class="mt-field"><label>Catégorie</label><select class="mt-select" id="mt-eq-cat">' + CATS.map(function (o) { return '<option value="' + o.id + '">' + esc(o.name) + "</option>"; }).join("") + "</select></div>" +
            '<div class="mt-field"><label>Activité</label><select class="mt-select" id="mt-eq-act">' + ACTS.map(function (o) { return '<option value="' + o.id + '">' + esc(o.name) + "</option>"; }).join("") + "</select></div>" +
            '<div class="mt-field"><label>Emplacement</label><select class="mt-select" id="mt-eq-loc">' + LOCS.map(function (o) { return '<option value="' + o.id + '">' + esc(o.name) + "</option>"; }).join("") + "</select></div>" +
            '<div class="mt-field"><label>Quantité initiale (' + currentProject().code + ")</label><input class=\"mt-input\" type=\"number\" min=\"0\" id=\"mt-eq-qty\" value=\"5\" /></div>" +
            '<div class="mt-field"><label>Seuil d\'alerte</label><input class="mt-input" type="number" min="0" id="mt-eq-min" value="2" /></div>' +
          "</div>" +
          '<div class="mt-note"><i class="bi bi-diagram-3"></i><div>La fiche est <b>globale</b> ; la quantité saisie n\'alimente que le stock du projet <b>' + esc(currentProject().name) + "</b>.</div></div>",
          '<button class="mt-btn mt-btn--outline" data-act="modal-close">Annuler</button>' +
          '<button class="mt-btn mt-btn--primary" data-act="eq-create"><i class="bi bi-check2"></i> Créer l\'équipement</button>', true);
        break;

      case "eq-create":
        var nm = (root.querySelector("#mt-eq-name").value || "").trim();
        var rf = (root.querySelector("#mt-eq-ref").value || "").trim().toUpperCase();
        if (!nm || !rf) { toast("Le nom et la référence sont obligatoires", "err"); break; }
        if (S.equipments.some(function (e) { return e.ref === rf; })) { toast("Cette référence existe déjà", "err"); break; }
        var q0 = Math.max(0, parseInt(root.querySelector("#mt-eq-qty").value, 10) || 0);
        var m0 = Math.max(0, parseInt(root.querySelector("#mt-eq-min").value, 10) || 0);
        var neo = {
          id: "e" + (++S.seq.eq), ref: rf, name: nm,
          typeId: root.querySelector("#mt-eq-type").value,
          catId: root.querySelector("#mt-eq-cat").value,
          actId: root.querySelector("#mt-eq-act").value,
          locId: root.querySelector("#mt-eq-loc").value,
          status: "ACTIVE", fav: false,
          stock: { PA: { q: 0, min: m0 }, PB: { q: 0, min: m0 } }
        };
        neo.stock[S.project].q = q0;
        S.equipments.unshift(neo);
        logAudit("CREATE", "Équipement « " + nm + " » (" + rf + ") créé avec " + q0 + " unité(s) sur " + currentProject().name);
        closeModal();
        S.eqQ.page = 1; S.eqQ.sortBy = "name";
        render();
        toast("Équipement <b>" + esc(rf) + "</b> créé", "ok");
        break;

      case "export-eq":
        var rowsCsv = [["Référence", "Nom", "Type", "Catégorie", "Activité", "Emplacement", "Quantité (" + S.project + ")", "Seuil", "Statut"]];
        filteredEquipments().forEach(function (e) {
          rowsCsv.push([e.ref, e.name, name(TYPES, e.typeId), name(CATS, e.catId), name(ACTS, e.actId),
            name(LOCS, e.locId), e.stock[S.project].q, e.stock[S.project].min, e.status]);
        });
        downloadCSV("minitrack-equipements-" + S.project + ".csv", rowsCsv);
        toast("Export CSV généré (" + (rowsCsv.length - 1) + " ligne(s))", "ok");
        break;

      case "export-mov":
        var mrows = [["Date", "Type", "Référence", "Équipement", "Quantité", "Utilisateur", "Motif"]];
        S.movements.filter(function (m) { return m.project === S.project; }).forEach(function (m) {
          var e = byId(S.equipments, m.eqId);
          mrows.push([fmtDateTime(m.date), MOV_META[m.type].label, e ? e.ref : "", e ? e.name : "", m.qty, m.user, m.reason]);
        });
        downloadCSV("minitrack-mouvements-" + S.project + ".csv", mrows);
        toast("Export CSV généré (" + (mrows.length - 1) + " mouvement(s))", "ok");
        break;

      case "export-audit":
        var arows = [["Horodatage", "Action", "Détail", "Utilisateur"]];
        S.audit.forEach(function (a) { arows.push([fmtDateTime(a.at), a.action, a.detail, a.user]); });
        downloadCSV("minitrack-audit.csv", arows);
        toast("Journal d'audit exporté", "ok");
        break;

      /* --- Stock ------------------------------------------------------ */
      case "stock":
        closeModal();
        stockDialog(eq, t.getAttribute("data-mode"));
        break;

      case "stock-confirm":
        var mode = t.getAttribute("data-mode");
        var qtyInput = root.querySelector("#mt-qty");
        var reasonInput = root.querySelector("#mt-reason");
        var n = parseInt(qtyInput.value, 10);
        var reason = (reasonInput.value || "").trim();
        if (!n || n < 1) { toast("Quantité invalide", "err"); break; }
        if (!reason) { toast("Le motif est obligatoire", "err"); reasonInput.focus(); break; }
        if (mode === "WITHDRAWAL" && n > qtyOf(eq)) { toast("Stock insuffisant (" + qtyOf(eq) + " disponible)", "err"); break; }
        applyStock(eq, mode === "WITHDRAWAL" ? -n : n, mode, reason);
        logAudit(mode === "WITHDRAWAL" ? "WITHDRAWAL" : "RETURN",
          (mode === "WITHDRAWAL" ? "Retrait de " : "Retour de ") + n + " × " + eq.ref + " — " + reason);
        closeModal();
        rerender(true);
        toast((mode === "WITHDRAWAL" ? "Retrait" : "Retour") + " enregistré : <b>" + n + " × " + esc(eq.ref) + "</b>", "ok");
        break;

      /* --- Panier ------------------------------------------------------ */
      case "cart-open": openCart(true); break;
      case "cart-close": openCart(false); break;

      case "cart-add":
        if (addToCart(eq, 1)) {
          toast("<b>" + esc(eq.name) + "</b> ajouté au panier", "ok");
          renderCart();
        }
        break;

      case "cart-inc":
      case "cart-dec":
        S.cart.forEach(function (c) {
          if (c.eqId === id && c.project === S.project) {
            var e2 = byId(S.equipments, id);
            c.qty = clamp(c.qty + (act === "cart-inc" ? 1 : -1), 1, e2.stock[S.project].q);
          }
        });
        renderCart();
        break;

      case "cart-del":
        S.cart = S.cart.filter(function (c) { return !(c.eqId === id && c.project === S.project); });
        renderCart();
        break;

      case "cart-clear":
        S.cart = S.cart.filter(function (c) { return c.project !== S.project; });
        renderCart();
        toast("Panier vidé", "info");
        break;

      case "cart-checkout":
        var cLines = S.cart.filter(function (c) { return c.project === S.project; });
        if (!cLines.length) break;
        openCart(false);
        modalShell('<i class="bi bi-check2-circle"></i> Valider le retrait',
          cLines.length + " ligne(s) · " + cLines.reduce(function (a, c) { return a + c.qty; }, 0) + " unité(s) — projet " + esc(currentProject().name),
          '<div class="mt-tablewrap"><table class="mt-table"><thead><tr><th>Article</th><th>Qté</th><th>Stock après</th></tr></thead><tbody>' +
            cLines.map(function (c) {
              var e = byId(S.equipments, c.eqId);
              var after = e.stock[S.project].q - c.qty;
              return '<tr><td><div class="mt-eq__n">' + esc(e.name) + '</div><div class="mt-eq__r">' + esc(e.ref) + "</div></td>" +
                '<td class="mt-num">' + c.qty + "</td>" +
                '<td class="mt-num" style="color:' + (after <= e.stock[S.project].min ? "var(--mt-warning)" : "var(--mt-fg)") + '">' + after + "</td></tr>";
            }).join("") + "</tbody></table></div>" +
          '<div class="mt-field"><label>Destinataire</label><input class="mt-input" id="mt-dest" value="Équipe déploiement — site de Pontoise" /></div>' +
          '<div class="mt-field"><label>Motif</label><input class="mt-input" id="mt-motif" value="Déploiement poste utilisateur" /></div>' +
          '<div class="mt-note mt-note--warn"><i class="bi bi-file-earmark-excel"></i><div>' +
            "<b>Dans SysTrack</b>, cette validation génère en plus un <b>Bon de Livraison Excel</b> conforme au modèle de " +
            "l'entreprise, numéroté séquentiellement (<span style=\"font-family:var(--mt-mono)\">26-034</span>, " +
            "<span style=\"font-family:var(--mt-mono)\">26-035</span>…) et re-téléchargeable depuis l'historique. " +
            "<b>Cette génération documentaire n'est pas incluse dans MiniTrack.</b></div></div>",
          '<button class="mt-btn mt-btn--outline" data-act="modal-close">Annuler</button>' +
          '<button class="mt-btn mt-btn--primary" data-act="cart-confirm"><i class="bi bi-box-arrow-up"></i> Valider &amp; sortir du stock</button>', true);
        break;

      case "cart-confirm":
        var dest = (root.querySelector("#mt-dest") || {}).value || "—";
        var motif = (root.querySelector("#mt-motif") || {}).value || "Retrait";
        var lines = S.cart.filter(function (c) { return c.project === S.project; });
        var units = 0;
        lines.forEach(function (c) {
          var e = byId(S.equipments, c.eqId);
          var take = Math.min(c.qty, e.stock[S.project].q);
          if (take > 0) { applyStock(e, -take, "WITHDRAWAL", motif + " — " + dest); units += take; }
        });
        logAudit("WITHDRAWAL", "Validation du panier : " + lines.length + " ligne(s), " + units + " unité(s) — " + dest);
        S.cart = S.cart.filter(function (c) { return c.project !== S.project; });
        closeModal();
        render();
        toast("Retrait validé : <b>" + units + " unité(s)</b> sorties du stock", "ok");
        setTimeout(function () {
          toast("Le bon de livraison Excel n'est pas généré dans la démo", "info");
        }, 700);
        break;

      /* --- Préparations -------------------------------------------------- */
      case "prep-open": S.openPrep = id; render(); break;
      case "prep-back": S.openPrep = null; render(); break;

      case "prep-new":
        modalShell('<i class="bi bi-clipboard-plus"></i> Nouvelle préparation', "Projet " + esc(currentProject().name),
          '<div class="mt-field"><label>Responsable</label><input class="mt-input" id="mt-prep-owner" value="Aly-Ba Dramé" /></div>' +
          '<div class="mt-field"><label>Partir d\'un kit métier (optionnel)</label><select class="mt-select" id="mt-prep-kit">' +
            '<option value="">Préparation vide</option>' +
            S.kits.filter(function (k) { return k.project === S.project && !k.archived; }).map(function (k) {
              return '<option value="' + k.id + '">' + esc(k.name) + " (" + k.items.length + " ligne(s))</option>";
            }).join("") + "</select></div>" +
          '<div class="mt-note"><i class="bi bi-info-circle"></i><div>Un kit ne peut être déplié que dans une préparation de <b>son propre projet</b>.</div></div>',
          '<button class="mt-btn mt-btn--outline" data-act="modal-close">Annuler</button>' +
          '<button class="mt-btn mt-btn--primary" data-act="prep-create"><i class="bi bi-check2"></i> Créer</button>');
        break;

      case "prep-create":
        var owner = (root.querySelector("#mt-prep-owner").value || "Utilisateur").trim();
        var kitId = root.querySelector("#mt-prep-kit").value;
        var kit = kitId ? byId(S.kits, kitId) : null;
        S.seq.prep++;
        var np = {
          id: "p" + Date.now(),
          project: S.project,
          number: "PREP-2026-" + pad3(S.seq.prep),
          status: "BROUILLON",
          owner: owner,
          createdAt: new Date(),
          comment: "",
          lines: kit ? kit.items.map(function (i) { return { eqId: i.eqId, requested: i.qty, prepared: 0 }; }) : []
        };
        S.preps.unshift(np);
        logAudit("PREPARATION", "Préparation " + np.number + " créée" + (kit ? " à partir du kit « " + kit.name + " »" : ""));
        closeModal();
        S.openPrep = np.id;
        S.view = "preparations";
        render();
        toast("Préparation <b>" + esc(np.number) + "</b> créée", "ok");
        break;

      case "prep-inc":
      case "prep-dec":
        (function () {
          var p = byId(S.preps, id), eqid = t.getAttribute("data-eq");
          p.lines.forEach(function (l) {
            if (l.eqId === eqid) l.prepared = clamp(l.prepared + (act === "prep-inc" ? 1 : -1), 0, l.requested);
          });
          rerender(true);
        })();
        break;

      case "prep-fill":
        (function () {
          var p = byId(S.preps, id);
          p.lines.forEach(function (l) { l.prepared = l.requested; });
          logAudit("PREPARATION", "Toutes les lignes de " + p.number + " marquées préparées");
          rerender(true);
          toast("Toutes les lignes de <b>" + esc(p.number) + "</b> sont préparées", "ok");
        })();
        break;

      case "prep-line-del":
        (function () {
          var p = byId(S.preps, id), eqid = t.getAttribute("data-eq");
          p.lines = p.lines.filter(function (l) { return l.eqId !== eqid; });
          rerender(true);
        })();
        break;

      case "prep-add-line":
        modalShell('<i class="bi bi-plus-circle"></i> Ajouter un article', "Préparation " + esc(byId(S.preps, id).number),
          '<div class="mt-field"><label>Équipement</label><select class="mt-select" id="mt-line-eq">' + eqOptions() + "</select></div>" +
          '<div class="mt-field"><label>Quantité demandée</label><input class="mt-input" type="number" min="1" id="mt-line-qty" value="1" /></div>',
          '<button class="mt-btn mt-btn--outline" data-act="modal-close">Annuler</button>' +
          '<button class="mt-btn mt-btn--primary" data-act="prep-line-add" data-id="' + id + '"><i class="bi bi-check2"></i> Ajouter</button>');
        break;

      case "prep-line-add":
        (function () {
          var p = byId(S.preps, id);
          var eqid = root.querySelector("#mt-line-eq").value;
          var n2 = Math.max(1, parseInt(root.querySelector("#mt-line-qty").value, 10) || 1);
          var found = null;
          p.lines.forEach(function (l) { if (l.eqId === eqid) found = l; });
          if (found) found.requested += n2;
          else p.lines.push({ eqId: eqid, requested: n2, prepared: 0 });
          closeModal();
          rerender(true);
          toast("Article ajouté à <b>" + esc(p.number) + "</b>", "ok");
        })();
        break;

      case "prep-status":
        (function () {
          var p = byId(S.preps, id), to = t.getAttribute("data-to");
          p.status = to;
          logAudit("PREPARATION", "Préparation " + p.number + " → " + PREP_META[to].label);
          rerender(true);
          toast("<b>" + esc(p.number) + "</b> · " + PREP_META[to].label, "info");
        })();
        break;

      case "prep-close":
        (function () {
          var p = byId(S.preps, id);
          var short = p.lines.filter(function (l) {
            var e = byId(S.equipments, l.eqId);
            return e.stock[p.project].q < l.prepared;
          });
          if (short.length) { toast("Stock insuffisant sur " + short.length + " ligne(s)", "err"); return; }
          var total = 0;
          p.lines.forEach(function (l) {
            if (l.prepared > 0) {
              var e = byId(S.equipments, l.eqId);
              e.stock[p.project].q -= l.prepared;
              addMovement("WITHDRAWAL", e.id, l.prepared, "Clôture de la préparation " + p.number);
              total += l.prepared;
            }
          });
          p.status = "TERMINEE";
          logAudit("PREPARATION", "Préparation " + p.number + " clôturée — " + total + " unité(s) sorties du stock");
          rerender(true);
          toast("<b>" + esc(p.number) + "</b> clôturée — " + total + " unité(s) sorties", "ok");
          setTimeout(function () { toast("Le bon de retrait Excel n'est pas généré dans la démo", "info"); }, 700);
        })();
        break;

      /* --- Kits ---------------------------------------------------------- */
      case "kit-deploy":
        (function () {
          var k = byId(S.kits, id), added = 0, failed = 0;
          k.items.forEach(function (i) {
            var e = byId(S.equipments, i.eqId);
            if (addToCart(e, i.qty)) added++; else failed++;
          });
          renderCart();
          openCart(true);
          logAudit("CREATE", "Kit « " + k.name + " » déplié dans le panier (" + added + " ligne(s))");
          toast("Kit <b>" + esc(k.name) + "</b> déplié — " + added + " ligne(s) au panier" + (failed ? ", " + failed + " indisponible(s)" : ""), failed ? "info" : "ok");
        })();
        break;

      case "kit-dup":
        (function () {
          var k = byId(S.kits, id);
          var copy = { id: "k" + Date.now(), project: k.project, name: k.name + " (copie)", catId: k.catId,
            archived: false, items: k.items.map(function (i) { return { eqId: i.eqId, qty: i.qty }; }) };
          S.kits.push(copy);
          logAudit("CREATE", "Kit « " + copy.name + " » dupliqué");
          rerender(true);
          toast("Kit dupliqué : <b>" + esc(copy.name) + "</b>", "ok");
        })();
        break;

      case "kit-archive":
        (function () {
          var k = byId(S.kits, id);
          k.archived = !k.archived;
          logAudit("UPDATE", "Kit « " + k.name + " » " + (k.archived ? "archivé" : "désarchivé"));
          rerender(true);
        })();
        break;

      case "kit-new":
        modalShell('<i class="bi bi-boxes"></i> Nouveau kit métier', "Projet " + esc(currentProject().name),
          '<div class="mt-field"><label>Nom du kit *</label><input class="mt-input" id="mt-kit-name" placeholder="Ex. Kit poste nomade" /></div>' +
          '<div class="mt-field"><label>Catégorie</label><select class="mt-select" id="mt-kit-cat">' +
            CATS.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + "</option>"; }).join("") + "</select></div>" +
          '<div class="mt-field"><label>Premier article</label><select class="mt-select" id="mt-kit-eq">' + eqOptions() + "</select></div>" +
          '<div class="mt-field"><label>Quantité</label><input class="mt-input" type="number" min="1" id="mt-kit-qty" value="1" /></div>' +
          '<div class="mt-note"><i class="bi bi-info-circle"></i><div>Un kit appartient à <b>un seul projet</b>. La duplication permet de le reprendre ailleurs.</div></div>',
          '<button class="mt-btn mt-btn--outline" data-act="modal-close">Annuler</button>' +
          '<button class="mt-btn mt-btn--primary" data-act="kit-create"><i class="bi bi-check2"></i> Créer le kit</button>');
        break;

      case "kit-create":
        (function () {
          var nm2 = (root.querySelector("#mt-kit-name").value || "").trim();
          if (!nm2) { toast("Le nom du kit est obligatoire", "err"); return; }
          var k = { id: "k" + Date.now(), project: S.project, name: nm2,
            catId: root.querySelector("#mt-kit-cat").value, archived: false,
            items: [{ eqId: root.querySelector("#mt-kit-eq").value,
                      qty: Math.max(1, parseInt(root.querySelector("#mt-kit-qty").value, 10) || 1) }] };
          S.kits.push(k);
          logAudit("CREATE", "Kit « " + nm2 + " » créé sur " + currentProject().name);
          closeModal();
          render();
          toast("Kit <b>" + esc(nm2) + "</b> créé", "ok");
        })();
        break;

      /* --- RMA ------------------------------------------------------------ */
      case "rma-new":
        modalShell('<i class="bi bi-tools"></i> Déclarer un matériel défaillant', "Projet " + esc(currentProject().name),
          '<div class="mt-field"><label>Équipement</label><select class="mt-select" id="mt-rma-eq">' + eqOptions(id || null) + "</select></div>" +
          '<div class="mt-field"><label>Quantité concernée</label><input class="mt-input" type="number" min="1" id="mt-rma-qty" value="1" /></div>' +
          '<div class="mt-field"><label>Motif du défaut *</label><textarea class="mt-input" id="mt-rma-reason" placeholder="Ex. Écran ne s\'allume plus après chute"></textarea></div>' +
          '<div class="mt-note mt-note--warn"><i class="bi bi-exclamation-triangle"></i><div>Le signalement <b>sort immédiatement</b> le matériel du stock du projet.</div></div>',
          '<button class="mt-btn mt-btn--outline" data-act="modal-close">Annuler</button>' +
          '<button class="mt-btn mt-btn--primary" data-act="rma-create"><i class="bi bi-check2"></i> Créer le ticket</button>');
        break;

      case "rma-create":
        (function () {
          var eqid = root.querySelector("#mt-rma-eq").value;
          var e = byId(S.equipments, eqid);
          var n3 = Math.max(1, parseInt(root.querySelector("#mt-rma-qty").value, 10) || 1);
          var why = (root.querySelector("#mt-rma-reason").value || "").trim();
          if (!why) { toast("Le motif est obligatoire", "err"); return; }
          if (n3 > e.stock[S.project].q) { toast("Stock insuffisant (" + e.stock[S.project].q + " disponible)", "err"); return; }
          S.seq.rma++;
          var r = { id: "r" + Date.now(), project: S.project, number: "RMA-" + ("000" + S.seq.rma).slice(-4),
            eqId: eqid, qty: n3, status: "SIGNALE", reason: why, createdAt: new Date() };
          S.rmas.unshift(r);
          e.stock[S.project].q -= n3;
          addMovement("RMA_OUT", eqid, n3, "Ticket " + r.number + " — " + why);
          logAudit("RMA", "Ticket " + r.number + " ouvert sur " + e.ref + " (" + n3 + " unité(s)) — " + why);
          closeModal();
          S.view = "rma";
          render();
          toast("Ticket <b>" + esc(r.number) + "</b> créé — matériel sorti du stock", "ok");
        })();
        break;

      case "rma-next":
        (function () {
          var r = byId(S.rmas, id), to = t.getAttribute("data-to");
          var e = byId(S.equipments, r.eqId);
          r.status = to;
          if (to === "RESTITUE") {
            e.stock[r.project].q += r.qty;
            addMovement("RMA_IN", r.eqId, r.qty, "Restitution du ticket " + r.number);
            logAudit("RMA", "Ticket " + r.number + " restitué — " + r.qty + " unité(s) réintégrée(s)");
            toast("<b>" + esc(r.number) + "</b> restitué — " + r.qty + " unité(s) réintégrée(s)", "ok");
          } else {
            logAudit("RMA", "Ticket " + r.number + " envoyé au SAV");
            toast("<b>" + esc(r.number) + "</b> envoyé au SAV", "info");
          }
          rerender(true);
        })();
        break;

      case "rma-del":
        (function () {
          var r = byId(S.rmas, id);
          S.rmas = S.rmas.filter(function (x) { return x.id !== id; });
          logAudit("DELETE", "Ticket " + r.number + " supprimé");
          rerender(true);
          toast("Ticket <b>" + esc(r.number) + "</b> supprimé", "info");
        })();
        break;
    }
  });

  /* --- Scrim (fermeture) ------------------------------------------------ */
  root.addEventListener("click", function (ev) {
    if (ev.target.hasAttribute && ev.target.hasAttribute("data-scrim")) openCart(false);
    if (ev.target.hasAttribute && ev.target.hasAttribute("data-modal")) closeModal();
  });

  /* --- Saisies ---------------------------------------------------------- */
  root.addEventListener("input", function (ev) {
    var t = ev.target.closest("[data-act]");
    if (!t) return;
    var act = t.getAttribute("data-act");
    if (act === "eq-search") { S.eqQ.search = t.value; S.eqQ.page = 1; debounce(function () { rerender(true); focusBack("eq-search"); }); }
    else if (act === "mov-search") { S.movQ.search = t.value; S.movQ.page = 1; debounce(function () { rerender(true); focusBack("mov-search"); }); }
    else if (act === "prep-search") { S.prepQ.search = t.value; debounce(function () { rerender(true); focusBack("prep-search"); }); }
    else if (act === "kit-search") { S.kitQ.search = t.value; debounce(function () { rerender(true); focusBack("kit-search"); }); }
    else if (act === "rma-search") { S.rmaQ.search = t.value; debounce(function () { rerender(true); focusBack("rma-search"); }); }
  });

  function focusBack(act) {
    var el = root.querySelector("[data-act='" + act + "']");
    if (el) { el.focus(); try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {} }
  }

  root.addEventListener("change", function (ev) {
    var t = ev.target.closest("[data-act]");
    if (!t) return;
    var act = t.getAttribute("data-act");
    var id = t.getAttribute("data-id");

    switch (act) {
      case "project":
        S.project = t.value; S.eqQ.page = 1; S.movQ.page = 1; S.openPrep = null;
        logAudit("PROJECT", "Bascule sur le projet " + byId(PROJECTS, t.value).name);
        render();
        toast("Projet courant : <b>" + esc(byId(PROJECTS, t.value).name) + "</b>", "info");
        break;

      case "eq-type": S.eqQ.typeId = t.value; S.eqQ.page = 1; rerender(true); break;
      case "eq-cat": S.eqQ.catId = t.value; S.eqQ.page = 1; rerender(true); break;
      case "eq-act": S.eqQ.actId = t.value; S.eqQ.page = 1; rerender(true); break;
      case "eq-loc": S.eqQ.locId = t.value; S.eqQ.page = 1; rerender(true); break;
      case "eq-status": S.eqQ.status = t.value; S.eqQ.page = 1; rerender(true); break;

      case "eq-qty":
        (function () {
          var e = byId(S.equipments, id);
          var next = Math.max(0, parseInt(t.value, 10) || 0);
          var prev = e.stock[S.project].q;
          if (next === prev) return;
          e.stock[S.project].q = next;
          addMovement("ADJUST", e.id, Math.abs(next - prev), "Ajustement de stock en ligne");
          logAudit("UPDATE", "Stock de " + e.ref + " ajusté : " + prev + " → " + next + " (" + currentProject().name + ")");
          rerender(true);
          toast("Stock de <b>" + esc(e.ref) + "</b> : " + prev + " → " + next, "ok");
        })();
        break;

      case "mov-type": S.movQ.type = t.value; S.movQ.page = 1; rerender(true); break;
      case "prep-status": S.prepQ.status = t.value; rerender(true); break;
      case "kit-cat": S.kitQ.catId = t.value; rerender(true); break;
      case "rma-status": S.rmaQ.status = t.value; rerender(true); break;

      case "cart-set":
        (function () {
          var e = byId(S.equipments, id);
          S.cart.forEach(function (c) {
            if (c.eqId === id && c.project === S.project) c.qty = clamp(parseInt(t.value, 10) || 1, 1, e.stock[S.project].q);
          });
          renderCart();
        })();
        break;

      case "prep-set":
        (function () {
          var p = byId(S.preps, id), eqid = t.getAttribute("data-eq");
          p.lines.forEach(function (l) {
            if (l.eqId === eqid) l.prepared = clamp(parseInt(t.value, 10) || 0, 0, l.requested);
          });
          rerender(true);
        })();
        break;
    }
  });

  /* --- Clavier ---------------------------------------------------------- */
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    if (root.querySelector("[data-modal]").classList.contains("is-open")) { closeModal(); return; }
    if (root.querySelector("[data-drawer]").classList.contains("is-open")) { openCart(false); return; }
    if (S.full) {
      S.full = false;
      root.classList.remove("is-full");
      document.body.classList.remove("mt-locked");
      var fb = root.querySelector("[data-act='full'] i");
      if (fb) fb.className = "bi bi-arrows-fullscreen";
    }
  });

  /* =================================================================
     10. Démarrage
     ================================================================= */
  S = buildState();
  root.innerHTML = shellHTML();
  render();
})();
