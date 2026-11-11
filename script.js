
/* ============================================================
   CONFIG — edit these
   ============================================================ */
const CONFIG = {
  // Nikah date/time (local time of the venue)
  weddingDate: "2026-11-18T18:30:00",

  // Opening animation
  intro: "envelope",
};

/* ---------- Countdown ---------- */
(function countdown() {
  const target = new Date(CONFIG.weddingDate).getTime();
  const units = {
    days: document.querySelector('[data-unit="days"]'),
    hours: document.querySelector('[data-unit="hours"]'),
    minutes: document.querySelector('[data-unit="minutes"]'),
    seconds: document.querySelector('[data-unit="seconds"]'),
  };

  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    const diff = Math.max(0, target - Date.now());
    units.days.textContent = Math.floor(diff / 86400000);
    units.hours.textContent = pad(Math.floor(diff / 3600000) % 24);
    units.minutes.textContent = pad(Math.floor(diff / 60000) % 60);
    units.seconds.textContent = pad(Math.floor(diff / 1000) % 60);
  }

  tick();
  setInterval(tick, 1000);
})();

/* ---------- Opening: envelope or doors ---------- */
(function intro() {
  const chosen = CONFIG.intro === "doors" ? "doors" : "envelope";

  document.querySelectorAll(".intro").forEach((el) => {
    if (el.id !== chosen) el.remove();
  });

  const overlay = document.getElementById(chosen);
  document.body.classList.add("locked");

  function enterSite() {
    document.body.classList.remove("locked");
    document.dispatchEvent(new Event("invite:open"));
  }

  if (chosen === "doors") {
    document.getElementById("open-doors").addEventListener("click", () => {
      overlay.classList.add("open");
      enterSite();
    }, { once: true });
    return;
  }

  let ready = false;
  let left = false;
  let touchY = null;

  function leave() {
    if (!ready || left) return;

    left = true;
    scrollTo(0, 0);
    overlay.classList.add("leave");
    enterSite();

    removeEventListener("wheel", onWheel);
    removeEventListener("keydown", onKey);
  }

  const onWheel = (e) => {
    if (e.deltaY > 4) leave();
  };

  const onKey = (e) => {
    if (["ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) leave();
  };

  let opened = false;

  overlay.addEventListener("click", () => {
    if (!opened) {
      opened = true;
      overlay.classList.add("open");
      setTimeout(() => {
        ready = true;
      }, 1700);
      return;
    }

    leave();
  });

  addEventListener("wheel", onWheel, { passive: true });
  addEventListener("keydown", onKey);

  overlay.addEventListener("touchstart", (e) => {
    touchY = e.touches[0].clientY;
  }, { passive: true });

  overlay.addEventListener("touchmove", (e) => {
    if (touchY !== null && touchY - e.touches[0].clientY > 30) leave();
  }, { passive: true });

  document.getElementById("env-continue").addEventListener("click", leave);
})();

/* ---------- Centre the N ♡ S monogram ---------- */
(function centerGlyphs() {
  const ctx = document.createElement("canvas").getContext("2d");

  function measure(el, text) {
    const cs = getComputedStyle(el);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;

    const m = ctx.measureText(text);

    return {
      adv: m.width,
      ink: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
      centreX: (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2,
      centreY: (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2,
    };
  }

  function run() {
    document.querySelectorAll(".mono").forEach((mono) => {
      const glyphs = [...mono.querySelectorAll(".glyph")];
      const heart = mono.querySelector(".mono-heart");
      const metrics = glyphs.map((el) => measure(el, el.textContent));

      const box = Math.max(...metrics.map((m) => m.ink));
      const shared = mono.matches('[lang="ar"]');
      const mid = metrics.reduce((sum, m) => sum + m.centreY, 0) / metrics.length;

      glyphs.forEach((el, i) => {
        const dx = metrics[i].adv / 2 - metrics[i].centreX;
        const dy = shared ? mid - metrics[i].centreY : 0;

        el.style.width = box.toFixed(1) + "px";
        el.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
      });

      if (shared && heart) {
        const h = measure(heart, heart.textContent);
        heart.style.transform = `translateY(${(mid - h.centreY).toFixed(2)}px)`;
      }
    });
  }

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(run);
  addEventListener("resize", run);
})();

/* ---------- Page: scrolling and fade-in animations ---------- */
(function page() {
  const invite = document.getElementById("story");

  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("visible");
    io.unobserve(e.target);
  }), { threshold: 0.2 });

  invite.querySelectorAll(".scene, .panel, .closing").forEach((section) => {
    section.querySelectorAll(".stage-copy > *, .panel-title")
      .forEach((el, i) => {
        el.classList.add("reveal");
        el.style.transitionDelay = Math.min(i, 4) * 0.15 + "s";
      });
  });

  document.addEventListener("invite:open", () => {
    invite.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }, { once: true });

  addEventListener("scroll", () => {
    if (scrollY > 30) invite.classList.add("hint-done");
  }, { passive: true });

  document.getElementById("next-btn").addEventListener("click", () => {
    scrollBy({ top: innerHeight, behavior: "smooth" });
  });
})();
