/* =====================================================================
   Aly-Ba Dramé — Portfolio interactions
   Vanilla JS + GSAP/ScrollTrigger + Lenis (all optional / guarded)
   ===================================================================== */
(function () {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ------------------------------------------------------------ */
  /*  Preloader                                                    */
  /* ------------------------------------------------------------ */
  const preloader = $("#preloader");
  const bar = $("#preloader .preloader__bar span");
  let progress = 0;
  const tick = setInterval(() => {
    progress = Math.min(progress + Math.random() * 18, 100);
    if (bar) bar.style.width = progress + "%";
    if (progress >= 100) clearInterval(tick);
  }, 120);

  function hidePreloader() {
    if (bar) bar.style.width = "100%";
    setTimeout(() => preloader && preloader.classList.add("done"), 350);
  }
  window.addEventListener("load", hidePreloader);
  // Safety net: never let the preloader trap the page.
  setTimeout(hidePreloader, 3500);

  /* ------------------------------------------------------------ */
  /*  Year                                                         */
  /* ------------------------------------------------------------ */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------ */
  /*  Smooth scroll (Lenis) + GSAP ScrollTrigger sync             */
  /* ------------------------------------------------------------ */
  let lenis = null;
  if (typeof window.Lenis !== "undefined" && !reduced) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    if (hasGSAP && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
    }
  }

  function scrollToTarget(target) {
    const el = typeof target === "string" ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -10 });
    else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }

  // Intercept in-page anchor links
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(el);
    });
  });

  /* ------------------------------------------------------------ */
  /*  Navigation: scrolled state + active link + progress bar     */
  /* ------------------------------------------------------------ */
  const nav = $("#nav");
  const progressBar = $(".scroll-progress");
  const scrollTopBtn = $("#scroll-top");
  const sections = $$("main section[id]");
  const navLinks = $$(".nav__links a");

  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("scrolled", y > 40);
    if (scrollTopBtn) scrollTopBtn.classList.toggle("show", y > 600);

    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = docH > 0 ? y / docH : 0;
    if (progressBar) progressBar.style.transform = "scaleX(" + ratio + ")";

    // active link via scroll position
    let current = "";
    sections.forEach((s) => {
      if (y >= s.offsetTop - 140) current = s.id;
    });
    navLinks.forEach((l) => {
      l.classList.toggle("active", l.getAttribute("href") === "#" + current);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------ */
  /*  Mobile menu                                                  */
  /* ------------------------------------------------------------ */
  const burger = $("#burger");
  const menu = $("#menu");
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("open");
    if (burger) burger.innerHTML = '<i class="bi bi-list"></i>';
    if (lenis) lenis.start();
  }
  if (burger && menu) {
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      burger.innerHTML = open ? '<i class="bi bi-x-lg"></i>' : '<i class="bi bi-list"></i>';
      if (lenis) open ? lenis.stop() : lenis.start();
    });
  }

  /* ------------------------------------------------------------ */
  /*  Typed role effect                                            */
  /* ------------------------------------------------------------ */
  const typed = $("#typed");
  if (typed) {
    const words = [
      "Développeur full-stack",
      "Ingénieur logiciel en apprentissage",
      "Étudiant en BTS SIO",
      "Créateur de solutions numériques",
    ];
    let wi = 0, ci = 0, deleting = false;
    function type() {
      const word = words[wi];
      typed.textContent = word.slice(0, ci);
      if (!deleting && ci < word.length) {
        ci++;
        setTimeout(type, 55 + Math.random() * 50);
      } else if (deleting && ci > 0) {
        ci--;
        setTimeout(type, 30);
      } else if (!deleting && ci === word.length) {
        deleting = true;
        setTimeout(type, 1700);
      } else {
        deleting = false;
        wi = (wi + 1) % words.length;
        setTimeout(type, 320);
      }
    }
    type();
  }

  /* ------------------------------------------------------------ */
  /*  Custom cursor                                                */
  /* ------------------------------------------------------------ */
  if (!isTouch) {
    const dot = $(".cursor:not(.cursor--ring)");
    const ring = $(".cursor--ring");
    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (dot) { dot.style.left = mx + "px"; dot.style.top = my + "px"; }
    });
    function ringLoop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ring) { ring.style.left = rx + "px"; ring.style.top = ry + "px"; }
      requestAnimationFrame(ringLoop);
    }
    ringLoop();
    $$("[data-cursor], a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
      el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
    });
  }

  /* ------------------------------------------------------------ */
  /*  Parcours tabs                                                */
  /* ------------------------------------------------------------ */
  const tabs = $$(".parcours__tab");
  const timelines = $$("[data-timeline]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      timelines.forEach((tl) => tl.classList.toggle("active", tl.dataset.timeline === target));
      if (hasGSAP && window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* ------------------------------------------------------------ */
  /*  Project filters                                              */
  /* ------------------------------------------------------------ */
  const filters = $$(".proj__filter");
  const cards = $$(".proj-card");
  filters.forEach((f) => {
    f.addEventListener("click", () => {
      const val = f.dataset.filter;
      filters.forEach((x) => x.classList.toggle("active", x === f));
      cards.forEach((card) => {
        const show = val === "all" || card.dataset.cat === val;
        card.classList.toggle("hide", !show);
      });
      if (hasGSAP && window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* ------------------------------------------------------------ */
  /*  Scroll reveals + manifesto + skill bars (GSAP)              */
  /* ------------------------------------------------------------ */
  if (hasGSAP && window.ScrollTrigger && !reduced) {
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("anim");

    // generic reveals
    $$("[data-reveal]").forEach((el) => {
      gsap.to(el, {
        opacity: 1, x: 0, y: 0, scale: 1,
        duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" },
      });
    });

    // hero intro timeline (data-hero)
    const heroEls = $$("[data-hero]");
    if (heroEls.length) {
      gsap.set(heroEls, { opacity: 0, y: 30 });
      gsap.to(heroEls, {
        opacity: 1, y: 0, duration: 1, ease: "power3.out",
        stagger: 0.12, delay: 0.35,
      });
    }

    // skill bars fill on scroll
    $$(".bar__fill").forEach((fill) => {
      ScrollTrigger.create({
        trigger: fill, start: "top 92%", once: true,
        onEnter: () => { fill.style.width = (fill.dataset.pct || 0) + "%"; },
      });
    });

    // section heading parallax (subtle)
    $$(".section-head__title").forEach((t) => {
      gsap.to(t, {
        yPercent: -8, ease: "none",
        scrollTrigger: { trigger: t, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // manifesto word highlight (pinned)
    setupManifesto(true);
  } else {
    // No GSAP / reduced motion → fill bars immediately, plain manifesto
    $$(".bar__fill").forEach((f) => (f.style.width = (f.dataset.pct || 0) + "%"));
    setupManifesto(false);
  }

  function setupManifesto(animate) {
    const el = $("#manifesto-text");
    if (!el) return;
    // Split into word spans (preserve the .accent marker)
    const html = el.innerHTML;
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const words = [];
    tmp.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach((t) => {
          if (t.trim()) words.push({ text: t, accent: false });
          else if (t.length) words.push({ space: true });
        });
      } else if (node.nodeType === 1) {
        words.push({ text: node.textContent, accent: node.classList.contains("accent") });
      }
    });
    el.innerHTML = "";
    const spans = [];
    words.forEach((w) => {
      if (w.space) { el.appendChild(document.createTextNode(" ")); return; }
      const s = document.createElement("span");
      s.className = "w" + (w.accent ? " accent" : "");
      s.textContent = w.text;
      el.appendChild(s);
      spans.push(s);
    });

    if (!animate) { spans.forEach((s) => s.classList.add("lit")); return; }

    ScrollTrigger.create({
      trigger: el,
      start: "top 75%",
      end: "bottom 55%",
      scrub: true,
      onUpdate: (self) => {
        const lit = Math.round(self.progress * spans.length);
        spans.forEach((s, i) => s.classList.toggle("lit", i < lit));
      },
    });
  }

  /* ------------------------------------------------------------ */
  /*  Magnetic buttons (subtle)                                    */
  /* ------------------------------------------------------------ */
  if (!isTouch && !reduced) {
    $$(".btn, .icon-btn").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + x * 0.25 + "px," + y * 0.35 + "px)";
      });
      btn.addEventListener("mouseleave", () => (btn.style.transform = ""));
    });
  }

  /* ------------------------------------------------------------ */
  /*  Contact form (Formspree, async)                              */
  /* ------------------------------------------------------------ */
  const form = $("#contact-form");
  if (form) {
    const loading = $(".form__msg.loading", form);
    const errorMsg = $(".form__msg.error", form);
    const successMsg = $(".form__msg.success", form);
    const submitBtn = $('button[type="submit"]', form);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      [loading, errorMsg, successMsg].forEach((m) => m && (m.style.display = "none"));
      if (loading) loading.style.display = "block";
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (loading) loading.style.display = "none";
        if (res.ok) {
          if (successMsg) successMsg.style.display = "block";
          form.reset();
        } else {
          const data = await res.json().catch(() => ({}));
          if (errorMsg) {
            errorMsg.textContent = data.errors
              ? data.errors.map((x) => x.message).join(", ")
              : "Une erreur est survenue. Veuillez réessayer.";
            errorMsg.style.display = "block";
          }
        }
      } catch (err) {
        if (loading) loading.style.display = "none";
        if (errorMsg) {
          errorMsg.textContent = "Erreur de connexion. Vérifiez votre connexion internet.";
          errorMsg.style.display = "block";
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
})();
