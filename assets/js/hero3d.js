/* =====================================================================
   Aly-Ba Dramé — Hero 3D
   A subtle, editorial floating object (Three.js).
   Degrades gracefully: no WebGL / reduced-motion / errors → CSS fallback.
   ===================================================================== */
import * as THREE from "three";

const canvas = document.getElementById("hero-canvas");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 760px)").matches;

function fail() {
  if (canvas) canvas.classList.add("failed");
  document.body.classList.add("no-webgl");
}

if (!canvas) {
  // nothing to do
} else {
  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !isMobile,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    // ---- Object: an elegant, glossy torus knot -------------------
    const geo = new THREE.TorusKnotGeometry(
      1.15, 0.36,
      isMobile ? 140 : 260,
      isMobile ? 24 : 40,
      2, 3
    );
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#ff4a1c"),
      roughness: 0.28,
      metalness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.25,
      sheen: 0.6,
      sheenColor: new THREE.Color("#ffd9c9"),
    });
    const knot = new THREE.Mesh(geo, mat);
    scene.add(knot);

    // A faint wireframe halo for editorial detail
    const halo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.4, 1),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#15141a"),
        wireframe: true,
        transparent: true,
        opacity: 0.06,
      })
    );
    scene.add(halo);

    // ---- Lighting: soft studio --------------------------------------
    scene.add(new THREE.HemisphereLight(0xfff6ef, 0xdcd6c8, 1.1));

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 5, 5);
    scene.add(key);

    const fill = new THREE.PointLight(0xffb59a, 30, 30);
    fill.position.set(-4, -2, 3);
    scene.add(fill);

    const rim = new THREE.PointLight(0xffffff, 22, 30);
    rim.position.set(-2, 4, -4);
    scene.add(rim);

    // ---- Resize -----------------------------------------------------
    function resize() {
      const w = canvas.clientWidth || canvas.offsetWidth || 1;
      const h = canvas.clientHeight || canvas.offsetHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(canvas);
    } else {
      window.addEventListener("resize", resize);
    }
    resize();

    // ---- Pointer parallax ------------------------------------------
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    if (!reduced) {
      window.addEventListener(
        "pointermove",
        (e) => {
          target.x = (e.clientX / window.innerWidth - 0.5) * 2;
          target.y = (e.clientY / window.innerHeight - 0.5) * 2;
        },
        { passive: true }
      );
    }

    // ---- Visibility gate (perf) ------------------------------------
    let visible = true;
    const hero = document.getElementById("hero");
    if (hero && window.IntersectionObserver) {
      new IntersectionObserver(
        (entries) => entries.forEach((en) => (visible = en.isIntersecting)),
        { threshold: 0.01 }
      ).observe(hero);
    }

    // ---- Render loop -----------------------------------------------
    const clock = new THREE.Clock();

    function renderOnce() {
      renderer.render(scene, camera);
    }

    function animate() {
      requestAnimationFrame(animate);
      if (!visible) return;
      const t = clock.getElapsedTime();

      // smooth pointer follow
      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;

      knot.rotation.x = t * 0.18 + current.y * 0.4;
      knot.rotation.y = t * 0.26 + current.x * 0.5;
      knot.position.y = Math.sin(t * 0.8) * 0.12;

      halo.rotation.x = -t * 0.05;
      halo.rotation.y = t * 0.07;

      camera.position.x += (current.x * 0.4 - camera.position.x) * 0.04;
      camera.position.y += (-current.y * 0.3 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderOnce();
    }

    if (reduced) {
      // Static, pleasant pose — no animation loop.
      knot.rotation.set(0.5, 0.8, 0);
      renderOnce();
    } else {
      animate();
    }

    // Fade the canvas in once the first frame is drawn
    canvas.style.opacity = "0";
    canvas.style.transition = "opacity 1s ease 0.2s";
    requestAnimationFrame(() => {
      renderOnce();
      canvas.style.opacity = "";
    });
  } catch (err) {
    console.warn("Hero 3D disabled:", err);
    fail();
  }
}
