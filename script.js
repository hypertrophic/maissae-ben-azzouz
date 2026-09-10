const NOTES = {
  numerique:
    "Installations interactives : le mouvement du spectateur déstabilise l'ordre mécanique. TouchDesigner, Kinect, mapping.",
  design:
    "Du rebut à l'objet. Ressorts, bielles et disques de frein deviennent assises, lampes, horloges.",
  peinture:
    "Empreinte, encre et papier. Une pratique picturale parallèle — les toiles pourront s'ajouter ici.",
};

const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"]);

function isSafeYoutube(href) {
  try {
    const u = new URL(href, window.location.href);
    return u.protocol === "https:" && YT_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

const gallery = document.getElementById("gallery");
const tiles = [...gallery.querySelectorAll(".tile")];
const cards = [...document.querySelectorAll(".card")];
const note = document.getElementById("practice-note");
const reset = document.getElementById("filter-reset");
const lightbox = document.getElementById("lightbox");
const lbImg = lightbox.querySelector("img");
const lbTitle = lightbox.querySelector(".lb-title");
const lbMeta = lightbox.querySelector(".lb-meta");
const lbLink = lightbox.querySelector(".lb-link");
const nav = document.getElementById("nav");

let active = null;

function applyFilter(key) {
  active = key;
  gallery.classList.toggle("is-filtering", Boolean(active));

  cards.forEach((c) => {
    const on = c.dataset.filter === active;
    c.classList.toggle("is-active", on);
    c.setAttribute("aria-pressed", on ? "true" : "false");
  });

  tiles.forEach((t) => {
    t.classList.toggle("is-match", Boolean(active) && t.dataset.cat === active);
  });

  if (active) {
    note.hidden = false;
    note.querySelector("p").textContent = NOTES[active];
    reset.hidden = false;
    const first = tiles.find((t) => t.dataset.cat === active);
    if (first) first.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  } else {
    note.hidden = true;
    reset.hidden = true;
  }
}

cards.forEach((card) => {
  card.addEventListener("click", () => {
    const next = active === card.dataset.filter ? null : card.dataset.filter;
    applyFilter(next);
    document.getElementById("galerie").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

reset.addEventListener("click", () => applyFilter(null));

tiles.forEach((tile) => {
  tile.addEventListener("click", () => {
    const img = tile.querySelector("img");
    const cap = tile.querySelector("figcaption");
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt || "";
    lbTitle.textContent = cap.querySelector("strong").textContent;
    lbMeta.textContent = cap.querySelector("span").textContent;
    const video = tile.getAttribute("data-video");
    if (video && isSafeYoutube(video)) {
      lbLink.hidden = false;
      lbLink.href = video;
    } else {
      lbLink.hidden = true;
      lbLink.removeAttribute("href");
    }
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add("is-open"));
    document.documentElement.classList.add("is-locked");
    document.body.classList.add("is-locked");
  });
});

function closeLightbox() {
  lightbox.classList.remove("is-open");
  document.documentElement.classList.remove("is-locked");
  document.body.classList.remove("is-locked");
  setTimeout(() => {
    if (!lightbox.classList.contains("is-open")) {
      lightbox.hidden = true;
      lbImg.removeAttribute("src");
    }
  }, 320);
}

lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
});

window.addEventListener("scroll", () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 24);
}, { passive: true });

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
}

function bindSwipeHint(scroller, hint) {
  if (!scroller || !hint) return;
  const hide = () => hint.classList.add("is-gone");
  scroller.addEventListener("scroll", hide, { passive: true, once: true });
  scroller.addEventListener("pointerdown", hide, { once: true });
}
bindSwipeHint(document.getElementById("cards"), document.getElementById("hint-cards"));
bindSwipeHint(gallery, document.getElementById("hint-gallery"));

const brushToggle = document.getElementById("brush-toggle");
const brush = document.getElementById("brush");
const canvas = document.getElementById("paint-trail");
const wantFinePointer =
  window.matchMedia("(pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
  window.innerWidth > 980;

let brushOn = false;
let paintApi = null;

function setBrush(on) {
  brushOn = on;
  try { localStorage.setItem("brush", on ? "on" : "off"); } catch (_) { /* ignore */ }
  brushToggle.setAttribute("aria-pressed", on ? "true" : "false");
  document.body.classList.toggle("has-native-cursor", !on);
  brush.style.display = on ? "" : "none";
  canvas.style.display = on ? "" : "none";
  if (paintApi) paintApi.setEnabled(on);
}

if (!wantFinePointer) {
  document.body.classList.add("has-native-cursor");
  brush.style.display = "none";
  canvas.style.display = "none";
} else {
  brushToggle.hidden = false;
  const ctx = canvas.getContext("2d", { alpha: true });
  let w, h, lastX, lastY, midX, midY, raf = 0, idle = 0, enabled = true;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  function tick() {
    raf = 0;
    if (!enabled) {
      ctx.clearRect(0, 0, w, h);
      return;
    }
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
    idle += 1;
    if (idle < 55) raf = requestAnimationFrame(tick);
  }

  document.addEventListener("mousemove", (e) => {
    if (!enabled) return;
    brush.style.opacity = "1";
    brush.style.transform = `translate(${e.clientX - 2}px, ${e.clientY - 8}px)`;
    const x = e.clientX;
    const y = e.clientY;
    if (lastX != null) {
      const mx = (lastX + x) / 2;
      const my = (lastY + y) / 2;
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(232, 185, 35, 0.4)";
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      if (midX == null) {
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(mx, my);
      } else {
        ctx.moveTo(midX, midY);
        ctx.quadraticCurveTo(lastX, lastY, mx, my);
      }
      ctx.stroke();
      midX = mx;
      midY = my;
      idle = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    }
    lastX = x;
    lastY = y;
  });

  document.addEventListener("mouseleave", () => {
    brush.style.opacity = "0";
    lastX = lastY = midX = midY = null;
  });

  paintApi = {
    setEnabled(on) {
      enabled = on;
      lastX = lastY = midX = midY = null;
      if (!on) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        ctx.clearRect(0, 0, w, h);
      }
    },
  };

  let stored = "on";
  try { stored = localStorage.getItem("brush") || "on"; } catch (_) { /* ignore */ }
  setBrush(stored !== "off");
  brushToggle.addEventListener("click", () => setBrush(!brushOn));
}
