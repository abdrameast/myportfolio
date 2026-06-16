/* =====================================================================
   Aly-Ba Dramé — Project detail pages (lightweight, no dependencies)
   Reveals · windowed gallery · nav state · scroll progress · scroll-top
   ===================================================================== */
(function () {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* Year ----------------------------------------------------------- */
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();

  /* Nav state + scroll progress + scroll-top ----------------------- */
  const nav = $("#nav");
  const progress = $(".scroll-progress");
  const toTop = $("#scroll-top");

  function onScroll() {
    const sy = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("scrolled", sy > 40);
    if (toTop) toTop.classList.toggle("show", sy > 600);
    if (progress) {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (docH > 0 ? sy / docH : 0) + ")";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* Scroll reveals ------------------------------------------------- */
  const revealEls = $$("[data-reveal]");
  if (revealEls.length && "IntersectionObserver" in window && !reduced) {
    document.documentElement.classList.add("pd-anim");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* Windowed gallery ----------------------------------------------- */
  const gallery = $("[data-gallery]");
  if (gallery) {
    const slides = $$(".pd-window__body img", gallery);
    const thumbs = $$(".pd-thumb", gallery);
    const title = $(".pd-window__title", gallery);
    let idx = 0;
    let timer = null;

    function show(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle("active", n === idx));
      thumbs.forEach((t, n) => t.classList.toggle("active", n === idx));
      const active = thumbs[idx];
      if (title && active) title.textContent = active.dataset.title || title.textContent;
    }

    thumbs.forEach((t, i) =>
      t.addEventListener("click", () => {
        show(i);
        restart();
      })
    );

    function restart() {
      if (reduced || slides.length < 2) return;
      clearInterval(timer);
      timer = setInterval(() => show(idx + 1), 6000);
    }

    show(0);
    restart();
    gallery.addEventListener("mouseenter", () => clearInterval(timer));
    gallery.addEventListener("mouseleave", restart);
  }
})();
