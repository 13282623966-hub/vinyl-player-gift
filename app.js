/* =============================================
   FOLIOWALL — app.js
   ============================================= */

const $  = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];

// ─── State ───────────────────────────
const state = {
  covers: [],
  view: "wall",               // wall | orbit | gallery
  // Wall View
  wallCards: [],              // DOM elements on track
  wallDataIdx: [],            // data index for each slot
  wallCardX: [],              // cached x position (px) per card — avoids regex parsing
  wallBlur: [],               // cached blur value per card — avoids filter repaints
  wallScroll: 0,              // track translateX offset (px)
  wallVelocity: 0,            // px/s
  wallDragging: false,
  wallDragStart: { x: 0, sx: 0, time: 0 },
  wallFocusIdx: 0,
  wallAutoSpeed: 0,           // auto-scroll speed (0 = idle)
  // Orbit View
  orbitRX: 0,                 // rotation angles (rad)
  orbitRY: 0,
  orbitVX: 0, orbitVY: 0,
  orbitDragging: false,
  orbitScale: 1,
  // Timing
  lastTime: 0,
  rafId: null,
  // Player
  isTransitioning: false,
  playerTrack: null,
  isPlaying: false,
  audioLoaded: false,
  audioError: false,
  vinylAngle: 0,
  vinylRaf: null,
};

// ─── Constants ───────────────────────
const CARD_W = 220, STEP = 260;  // card width & horizontal spacing
const WALL_CARDS_VISIBLE = 8;    // estimate visible slots
const FOCUS_RATIO = 0.62;        // focus zone = 62% from left of wall-scene

// ─── Init ───────────────────────────
(async function init() {
  try {
    const res = await fetch("./data.json?v=18");
    state.covers = await res.json();
  } catch (e) {
    state.covers = [];
  }
  if (state.covers.length === 0) {
    console.error("No cover data");
    return hideLoader();
  }

  buildWall();
  buildOrbit();
  buildGallery();
  setupViewButtons();
  setupWallInteraction();
  setupOrbitInteraction();
  setupGalleryClick();
  setupGlobalClick();

  // Start loop
  state.lastTime = performance.now();
  loop(state.lastTime);

  // Fix: DOM layout may not be complete when buildWall computes dimensions.
  // Re-run updateWallPositions after two frames to guarantee correct positions.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateWallPositions();
    });
  });

  // Wait for first wallpaper image, then hide loader
  preloadThenShow();
})();

function hideLoader() {
  const l = document.getElementById("loader");
  if (l) { l.classList.add("hidden"); setTimeout(() => l.remove(), 700); }
}
function preloadThenShow() {
  const img = new Image();
  img.onload  = () => { showDetail(0); hideLoader(); };
  img.onerror = hideLoader;
  img.src = state.covers[0].image;
  setTimeout(hideLoader, 4000);
}

// ═══════════════════════════════════════
//  WALL VIEW
// ═══════════════════════════════════════

function buildWall() {
  const track = document.getElementById("wall-track");
  // 2× copies for seamless looping
  const total = state.covers.length * 2;
  const frag = document.createDocumentFragment();

  for (let i = 0; i < total; i++) {
    const dataIdx = i % state.covers.length;
    const card = document.createElement("div");
    card.className = "cover-card";
    card.dataset.dataIdx = dataIdx;

    const img = document.createElement("img");
    img.src = state.covers[dataIdx].image;
    img.loading = "lazy";
    img.onload = () => img.classList.add("loaded");
    img.classList.add("loaded");

    const sheen = document.createElement("div");
    sheen.className = "card-sheen";
    card.appendChild(img);
    card.appendChild(sheen);

    state.wallCards.push(card);
    state.wallDataIdx.push(dataIdx);
    frag.appendChild(card);
  }
  track.appendChild(frag);
  updateWallPositions();
}

function updateWallPositions() {
  const scene = document.getElementById("wall-scene");
  const sw = scene ? scene.clientWidth : window.innerWidth;
  const sh = scene ? scene.clientHeight : window.innerHeight;
  const focusX = sw * FOCUS_RATIO;
  const cardY = (sh - 300) / 2;  // vertically center 300px card

  const tw = state.covers.length * 2 * STEP;

  for (let i = 0; i < state.wallCards.length; i++) {
    let rawX = i * STEP - state.wallScroll;
    rawX = ((rawX % tw) + tw) % tw;
    const distFromFocus = rawX - focusX;

    // Z depth: near focus = close; far = recede
    const absDist = Math.abs(distFromFocus);
    const z = -clamp(absDist * 0.55, 0, 800);

    // Depth of field
    let blur = 0, opacity = 1;
    if (absDist < 200) {
      blur = remap(absDist, 0, 200, 0, 2);
      opacity = remap(absDist, 0, 200, 1, 0.7);
    } else if (absDist < 500) {
      blur = remap(absDist, 200, 500, 2, 8);
      opacity = remap(absDist, 200, 500, 0.7, 0.3);
    } else {
      blur = remap(absDist, 500, 900, 8, 14);
      opacity = remap(absDist, 500, 900, 0.3, 0.1);
    }

    state.wallCards[i].style.transform =
      `translate3d(${rawX}px, ${cardY}px, ${z}px)`;
    // Cache x so updateFocus doesn't need to regex-parse transform each frame
    state.wallCardX[i] = rawX;
    // Only touch filter when blur changed noticeably (0.5px) to avoid filter repaints
    const prevBlur = state.wallBlur[i] || 0;
    if (Math.abs(blur - prevBlur) >= 0.5) {
      state.wallCards[i].style.filter = `blur(${blur.toFixed(1)}px)`;
      state.wallBlur[i] = blur;
    }
    state.wallCards[i].style.opacity = opacity.toFixed(2);
  }

  // Highlight focus
  updateFocus();
}

function updateFocus() {
  const scene = document.getElementById("wall-scene");
  const sw = scene ? scene.clientWidth : window.innerWidth;
  const focusX = sw * FOCUS_RATIO;
  let bestI = 0, bestDist = Infinity;

  for (let i = 0; i < state.wallCards.length; i++) {
    const card = state.wallCards[i];
    const cx = state.wallCardX[i] || 0;
    const d = Math.abs(cx - focusX);
    if (d < bestDist) { bestDist = d; bestI = i; }
    card.classList.toggle("highlight", false);
  }

  if (state.wallFocusIdx !== parseInt(state.wallCards[bestI].dataset.dataIdx)) {
    state.wallFocusIdx = parseInt(state.wallCards[bestI].dataset.dataIdx);
    showDetail(state.wallFocusIdx);
  }
  state.wallCards[bestI].classList.add("highlight");
}

function showDetail(idx) {
  const c = state.covers[idx % state.covers.length];
  document.getElementById("detail-date").textContent = c.date;
  document.getElementById("detail-desc").textContent = c.description;
  document.getElementById("detail-panel").classList.add("visible");
}

function snapToFocus(dataIdx) {
  const scene = document.getElementById("wall-scene");
  const sw = scene ? scene.clientWidth : window.innerWidth;
  const focusX = sw * FOCUS_RATIO;
  let targetCard = null, bestDist = Infinity;
  for (let i = 0; i < state.wallCards.length; i++) {
    const card = state.wallCards[i];
    if (parseInt(card.dataset.dataIdx) !== dataIdx) continue;
    const cx = state.wallCardX[i] || 0;
    const d = Math.abs(cx - focusX);
    if (d < bestDist) { bestDist = d; targetCard = card; }
  }
  if (!targetCard) return;

  const idx = state.wallCards.indexOf(targetCard);
  state.wallScroll = idx * STEP - focusX;
  state.wallVelocity = 0;
  state.wallAutoSpeed = 0;
  updateWallPositions();
}

/* ── Wall Interaction ───────────────── */
function setupWallInteraction() {
  const scene = document.getElementById("wall-scene");
  let dragMoved = false;

  scene.addEventListener("pointerdown", (e) => {
    dragMoved = false;
    state.wallDragging = true;
    state.wallDragStart = { x: e.clientX, sx: state.wallScroll, time: performance.now() };
    state.wallVelocity = 0;
    state.wallAutoSpeed = 0;
    scene.style.cursor = "grabbing";
    scene.setPointerCapture(e.pointerId);
  });

  scene.addEventListener("pointermove", (e) => {
    if (!state.wallDragging) return;
    const dx = e.clientX - state.wallDragStart.x;
    if (Math.abs(dx) > 4) dragMoved = true;
    state.wallScroll = state.wallDragStart.sx - dx;
    const dt = Math.max(performance.now() - state.wallDragStart.time, 1);
    state.wallVelocity = -dx / (dt / 1000);
    state.wallDragStart = { x: e.clientX, sx: state.wallScroll, time: performance.now() };
    updateWallPositions();
  });

  scene.addEventListener("pointerup", (e) => {
    state.wallDragging = false;
    scene.style.cursor = "";
    scene.releasePointerCapture(e.pointerId);

    // If didn't drag much, treat as click — find nearest card via hit-test
    if (!dragMoved) {
      const card = getCardAtPoint(e.clientX, e.clientY);
      if (card) {
        const di = parseInt(card.dataset.dataIdx);
        flyToCenter(di, card);
      }
    }
  });

  // Wheel
  scene.addEventListener("wheel", (e) => {
    e.preventDefault();
    state.wallScroll += e.deltaY * 1.2;
    state.wallVelocity = e.deltaY * 30;
    state.wallAutoSpeed = 0;
    updateWallPositions();
  }, { passive: false });
}

/* Find card at screen coordinates via real bounding rects */
function getCardAtPoint(sx, sy) {
  let best = null, bestDist = Infinity;
  for (const card of state.wallCards) {
    const r = card.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const d2 = (sx - cx) * (sx - cx) + (sy - cy) * (sy - cy);
    // Within card diagonal radius (~ 370px) and closest center wins
    if (d2 < CARD_W * CARD_W + 300 * 300 && d2 < bestDist) {
      bestDist = d2;
      best = card;
    }
  }
  return best;
}

// ═══════════════════════════════════════
//  ORBIT VIEW
// ═══════════════════════════════════════

function buildOrbit() {
  const sphere = document.getElementById("orbit-sphere");
  const N = Math.min(state.covers.length * 4, 44);
  const R = Math.min(window.innerWidth * 0.28, 380);

  for (let i = 0; i < N; i++) {
    // Fibonacci sphere distribution
    const phi   = Math.acos(1 - 2 * (i + 0.5) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    const x = R * Math.sin(phi) * Math.cos(theta);
    const y = R * Math.sin(phi) * Math.sin(theta);
    const z = R * Math.cos(phi);

    // Angles to make face tangent to sphere
    const ry = Math.atan2(x, Math.abs(z) + 0.001) * (180 / Math.PI);
    const rx = -Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);

    const face = document.createElement("div");
    face.className = "orbit-face";
    face.style.transform =
      `translate3d(${x}px,${y}px,${z}px) rotateY(${ry}deg) rotateX(${rx}deg)`;

    const img = document.createElement("img");
    img.src = state.covers[i % state.covers.length].image;

    face.appendChild(img);
    sphere.appendChild(face);
  }
}

function setupOrbitInteraction() {
  const scene = document.getElementById("orbit-scene");
  const sphere = document.getElementById("orbit-sphere");
  let dragStart = { x: 0, y: 0, rx: 0, ry: 0 };

  scene.addEventListener("mousedown", (e) => {
    state.orbitDragging = true;
    dragStart = { x: e.clientX, y: e.clientY, rx: state.orbitRX, ry: state.orbitRY };
    state.orbitVX = 0; state.orbitVY = 0;
    scene.style.cursor = "grabbing";
  });
  window.addEventListener("mousemove", (e) => {
    if (!state.orbitDragging) return;
    const dx = (e.clientX - dragStart.x) * 0.005;
    const dy = (e.clientY - dragStart.y) * 0.005;
    state.orbitRY = dragStart.ry + dx;
    state.orbitRX = dragStart.rx + dy;
    state.orbitVY = dx * 60;
    state.orbitVX = dy * 60;
  });
  window.addEventListener("mouseup", () => {
    state.orbitDragging = false;
    scene.style.cursor = "";
  });

  // Touch
  scene.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    state.orbitDragging = true;
    dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY,
                  rx: state.orbitRX, ry: state.orbitRY };
    state.orbitVX = 0; state.orbitVY = 0;
  });
  window.addEventListener("touchmove", (e) => {
    if (!state.orbitDragging || e.touches.length !== 1) return;
    const dx = (e.touches[0].clientX - dragStart.x) * 0.005;
    const dy = (e.touches[0].clientY - dragStart.y) * 0.005;
    state.orbitRY = dragStart.ry + dx;
    state.orbitRX = dragStart.rx + dy;
    state.orbitVY = dx * 60;
    state.orbitVX = dy * 60;
  });
  window.addEventListener("touchend", () => { state.orbitDragging = false; });

  // Wheel → zoom
  scene.addEventListener("wheel", (e) => {
    e.preventDefault();
    state.orbitScale = clamp(state.orbitScale + e.deltaY * -0.001, 0.5, 1.5);
  }, { passive: false });
}

function updateOrbit(dt) {
  const sec = dt / 1000;
  if (!state.orbitDragging) {
    state.orbitRX += state.orbitVX * sec;
    state.orbitRY += state.orbitVY * sec;
    // Apply damping
    state.orbitVX *= 0.95;
    state.orbitVY *= 0.95;
    if (Math.abs(state.orbitVX) < 0.5) state.orbitVX = 0;
    if (Math.abs(state.orbitVY) < 0.5) state.orbitVY = 0;

    // Auto-rotate when idle
    state.orbitRY += 0.15 * sec;
  }
  const sphere = document.getElementById("orbit-sphere");
  if (!sphere) return;
  sphere.style.transform =
    `translate(-50%,-50%) scale(${state.orbitScale}) rotateX(${state.orbitRX}rad) rotateY(${state.orbitRY}rad)`;
}

// ═══════════════════════════════════════
//  GALLERY VIEW
// ═══════════════════════════════════════

function buildGallery() {
  const grid = document.getElementById("gallery-grid");
  const frag = document.createDocumentFragment();
  state.covers.forEach((c, i) => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.dataset.dataIdx = i;
    const img = document.createElement("img");
    img.src = c.image;
    img.loading = "lazy";
    item.appendChild(img);
    frag.appendChild(item);
  });
  grid.appendChild(frag);
}

/* ── Gallery Click (event delegation on grid) ── */
function setupGalleryClick() {
  const grid = document.getElementById("gallery-grid");
  grid.addEventListener("click", (e) => {
    if (state.view !== "gallery" || state.isTransitioning) return;
    const item = e.target.closest(".gallery-item");
    if (!item) return;
    const di = parseInt(item.dataset.dataIdx);
    const img = item.querySelector("img");
    flyToCenter(di, item, img);
  });
  grid.addEventListener("mouseover", (e) => {
    if (state.view !== "gallery" || state.isTransitioning) return;
    const item = e.target.closest(".gallery-item");
    if (!item) return;
    showDetail(parseInt(item.dataset.dataIdx));
  });
}

/* ── Global Click for Orbit faces (delegation on orbit-sphere) ── */
function setupGlobalClick() {
  const sphere = document.getElementById("orbit-sphere");
  sphere.addEventListener("click", (e) => {
    if (state.view !== "orbit" || state.isTransitioning) return;
    const face = e.target.closest(".orbit-face");
    if (!face) return;
    // Find which data index this face maps to
    const faces = $$(".orbit-face");
    const idx = faces.indexOf(face);
    if (idx < 0) return;
    const di = idx % state.covers.length;
    flyToCenter(di, face, face.querySelector("img"));
  });
  sphere.addEventListener("mouseover", (e) => {
    if (state.view !== "orbit" || state.isTransitioning) return;
    const face = e.target.closest(".orbit-face");
    if (!face) return;
    const faces = $$(".orbit-face");
    const idx = faces.indexOf(face);
    if (idx < 0) return;
    showDetail(idx % state.covers.length);
  });
}

// ═══════════════════════════════════════
//  VIEW SWITCHING
// ═══════════════════════════════════════

function setupViewButtons() {
  const btns = $$(".view-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.view;
      if (state.view === v) return;
      switchView(v);
    });
  });
}

function switchView(view) {
  // Deactivate all
  $$(".view-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector(`.view-btn[data-view="${view}"]`)?.classList.add("active");

  document.getElementById("wall-scene").classList.toggle("active", view === "wall");
  document.getElementById("orbit-scene").classList.toggle("active", view === "orbit");
  document.getElementById("gallery-scene").classList.toggle("active", view === "gallery");

  state.view = view;
  document.querySelector(".info-panel").classList.toggle("gallery-view", view === "gallery");
  if (view === "wall") updateWallPositions();
}

// ═══════════════════════════════════════
//  MAIN LOOP
// ═══════════════════════════════════════

function loop(now) {
  const dt = Math.min(now - state.lastTime, 50); // cap at 50ms
  state.lastTime = now;

  if (state.view === "wall") {
    if (!state.wallDragging && Math.abs(state.wallVelocity) > 5) {
      // Inertia
      state.wallScroll += state.wallVelocity * (dt / 1000);
      state.wallVelocity *= 0.92;
      updateWallPositions();
    }
    // Wrap within the duplicated range
    const wrapW = state.covers.length * STEP;
    state.wallScroll = ((state.wallScroll % wrapW) + wrapW) % wrapW;
  }

  if (state.view === "orbit") {
    updateOrbit(dt);
  }

  state.rafId = requestAnimationFrame(loop);
}

// ═══════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function remap(v, inLo, inHi, outLo, outHi) {
  const t = clamp((v - inLo) / (inHi - inLo || 1), 0, 1);
  return outLo + t * (outHi - outLo);
}

// ═══════════════════════════════════════
//  FLY-TO-CENTER → PLAYER
// ═══════════════════════════════════════

function flyToCenter(dataIdx, card, fallbackImg) {
  if (state.isTransitioning) return;
  try {
    state.isTransitioning = true;
    state.wallVelocity = 0;
    state.wallAutoSpeed = 0;

    const track = state.covers[dataIdx % state.covers.length];
    if (!track) { state.isTransitioning = false; return; }

    const img = (card && card.querySelector("img")) || fallbackImg || document.createElement("img");
    if (!img) { state.isTransitioning = false; return; }

    const imgRect = img.getBoundingClientRect();
    const size = imgRect.width || 220;
    if (size < 10) { state.isTransitioning = false; return; }

    const cx = imgRect.left + imgRect.width / 2;
    const cy = imgRect.top + imgRect.height / 2;

    const clone = document.createElement("img");
    clone.className = "flying-cover";
    clone.src = track.image;
    clone.alt = track.title;
    clone.style.cssText = `
      position:fixed;z-index:10000;
      left:${cx - size/2}px;top:${cy - size/2}px;
      width:${size}px;height:${size}px;
      transition:all 500ms cubic-bezier(0.22,1,0.36,1);
    `;
    document.body.appendChild(clone);

    // Force reflow, then animate
    clone.getBoundingClientRect();

    const vw = window.innerWidth, vh = window.innerHeight;
    const targetSize = Math.min(vw * 0.48, vh * 0.6, 420);
    clone.style.left   = ((vw - targetSize) / 2) + "px";
    clone.style.top    = ((vh - targetSize) / 2) + "px";
    clone.style.width  = targetSize + "px";
    clone.style.height = targetSize + "px";
    clone.style.borderRadius = "8px";

    let done = false;
    function onTransitionEnd() {
      if (done) return; done = true;
      clone.removeEventListener("transitionend", onTransitionEnd);

      const overlay = document.createElement("div");
      overlay.className = "cover-overlay";
      document.body.appendChild(overlay);

      let advanced = false;
      const advance = () => {
        if (advanced) return; advanced = true;
        clone.style.transition = "all 350ms cubic-bezier(0.22,1,0.36,1)";
        clone.style.transform = "scale(1.1)";
        clone.style.opacity = "0";
        const removeAfter = () => {
          clone.removeEventListener("transitionend", removeAfter);
          clone.remove(); overlay.remove();
          enterPlayer(track);
        };
        clone.addEventListener("transitionend", removeAfter);
        setTimeout(removeAfter, 400);
      };
      clone.addEventListener("click", advance);
      overlay.addEventListener("click", () => {
        if (advanced) return;
        // Click outside the cover → dismiss, go back to wall
        clone.style.transition = "all 250ms cubic-bezier(0.22,1,0.36,1)";
        clone.style.transform = "scale(0.9)";
        clone.style.opacity = "0";
        const remove = () => {
          clone.removeEventListener("transitionend", remove);
          clone.remove(); overlay.remove();
          state.isTransitioning = false;
        };
        clone.addEventListener("transitionend", remove);
        setTimeout(remove, 300);
      });
    }
    clone.addEventListener("transitionend", onTransitionEnd);
    setTimeout(onTransitionEnd, 600); // fallback
  } catch (e) {
    state.isTransitioning = false;
  }
}

function enterPlayer(track) {
  state.playerTrack = track;

  // Hide FOLIOWALL UI
  document.getElementById("wall-scene").classList.remove("active");
  document.getElementById("orbit-scene").classList.remove("active");
  document.getElementById("gallery-scene").classList.remove("active");

  // Show player
  const pv = document.getElementById("player-view");
  pv.classList.add("active");
  document.querySelector(".info-panel").classList.add("in-player");

  renderPlayer(track);
  setupPlayerAudio();
  setupPlayerControls();

  state.isTransitioning = false;
}

// ═══════════════════════════════════════
//  PLAYER RENDER & CONTROLS
// ═══════════════════════════════════════

function renderPlayer(track) {
  document.getElementById("track-title").textContent = track.title;
  document.getElementById("track-artist").textContent = track.subtitle;
  document.getElementById("track-meta").textContent = `${track.date}  ·  ${track.year}`;

  // Vinyl label
  const lbl = document.getElementById("vinyl-label-img");
  lbl.src = track.image;
  lbl.classList.remove("loaded");
  lbl.onload = () => lbl.classList.add("loaded");
  // Also try immediately
  if (lbl.complete && lbl.naturalWidth) lbl.classList.add("loaded");

  // Color glow
  const labelEl = document.getElementById("vinyl-label");
  const color = track.themeColor || track.color_palette[0] || "#999";
  labelEl.style.setProperty("--labelColor", color);
  labelEl.style.background = color;
  labelEl.style.boxShadow = `0 0 20px ${color}, 0 0 60px ${color}`;
  document.querySelector(".progress-fill").style.setProperty("--labelColor", color);

  // Audio setup
  const audio = document.getElementById("audio");
  audio.src = track.audio;
  audio.load();
  state.audioLoaded = false;
  state.audioError = false;
  state.isPlaying = false;

  // Reset tonearm
  document.getElementById("tonearm-wrapper").classList.remove("placed");
  document.getElementById("stylus-hint").classList.remove("hidden");

  // Reset vinyl
  stopVinylSpin();
  document.getElementById("vinyl").style.animation = "none";
  document.getElementById("vinyl").style.setProperty("--vinyl-angle", "0deg");

  // Reset progress
  document.getElementById("progress-fill").style.width = "0%";
  document.getElementById("time-current").textContent = "0:00";
  document.getElementById("time-total").textContent = "0:00";
}

function setupPlayerAudio() {
  const audio = document.getElementById("audio");
  audio.removeEventListener("loadedmetadata", onAudioMeta);
  audio.removeEventListener("timeupdate", onTimeUpdate);
  audio.removeEventListener("ended", onAudioEnded);
  audio.removeEventListener("error", onAudioError);

  audio.addEventListener("loadedmetadata", onAudioMeta);
  audio.addEventListener("timeupdate", onTimeUpdate);
  audio.addEventListener("ended", onAudioEnded);
  audio.addEventListener("error", onAudioError);
}

function onAudioMeta() {
  state.audioLoaded = true;
  const a = document.getElementById("audio");
  document.getElementById("time-total").textContent = formatTime(a.duration || 0);
}
function onTimeUpdate() {
  const a = document.getElementById("audio");
  const pct = a.duration ? (a.currentTime / a.duration) * 100 : 0;
  document.getElementById("progress-fill").style.width = pct + "%";
  document.getElementById("time-current").textContent = formatTime(a.currentTime);
}
function onAudioEnded() {
  pausePlayback();
  // Loop: reset to 0 and toggle as if user clicked again
  document.getElementById("audio").currentTime = 0;
  document.getElementById("progress-fill").style.width = "0%";
  document.getElementById("time-current").textContent = "0:00";
}
function onAudioError() {
  const a = document.getElementById("audio");
  if (a.error && a.error.code === 1) return;
  state.audioError = true;
  document.getElementById("stylus-hint").textContent = "Unable to load audio";
  document.getElementById("stylus-hint").classList.remove("hidden");
  pausePlayback();
}

/* ── Player Controls ────────────── */
function setupPlayerControls() {
  const vw = document.getElementById("vinyl-wrapper");
  const tw = document.getElementById("tonearm-wrapper");
  const bb = document.getElementById("back-btn");
  const pb = document.getElementById("progress-bar");

  vw.onclick = () => { if (!state.audioError) togglePlayback(); };
  tw.onclick = () => { if (!state.audioError) togglePlayback(); };
  bb.onclick = goBackToWall;
  pb.onclick = (e) => {
    const a = document.getElementById("audio");
    if (!a.duration) return;
    a.currentTime = (e.offsetX / pb.clientWidth) * a.duration;
  };
}

function togglePlayback() {
  const a = document.getElementById("audio");
  if (state.isPlaying) {
    pausePlayback();
  } else {
    document.getElementById("tonearm-wrapper").classList.add("placed");
    startPlayback();
  }
}

function startPlayback() {
  if (state.isPlaying) return;
  state.isPlaying = true;
  document.getElementById("stylus-hint").classList.add("hidden");
  const a = document.getElementById("audio");
  a.play().catch(() => {
    document.getElementById("stylus-hint").textContent = "Unable to play audio";
    document.getElementById("stylus-hint").classList.remove("hidden");
    pausePlayback();
  });
  startVinylSpin();
}

function pausePlayback() {
  state.isPlaying = false;
  document.getElementById("audio").pause();
  stopVinylSpin();
  document.getElementById("tonearm-wrapper").classList.remove("placed");
}

function startVinylSpin() {
  if (state.vinylRaf) return;
  const vinyl = document.getElementById("vinyl");
  let last = performance.now();
  function step(now) {
    const dt = Math.min(now - last, 50); last = now;
    state.vinylAngle = (state.vinylAngle + dt * 0.12) % 360;
    vinyl.style.transform = `rotate(${state.vinylAngle}deg)`;
    state.vinylRaf = requestAnimationFrame(step);
  }
  state.vinylRaf = requestAnimationFrame(step);
}

function stopVinylSpin() {
  if (state.vinylRaf) { cancelAnimationFrame(state.vinylRaf); state.vinylRaf = null; }
}

function goBackToWall() {
  pausePlayback();
  const pv = document.getElementById("player-view");
  pv.classList.remove("active");
  document.querySelector(".info-panel").classList.remove("in-player");
  document.querySelector(".info-panel").classList.remove("gallery-view");
  document.getElementById("audio").src = "";

  document.getElementById("wall-scene").classList.add("active");
  state.view = "wall";
  $$(".view-btn").forEach(b => b.classList.remove("active"));
  document.querySelector('.view-btn[data-view="wall"]')?.classList.add("active");
  updateWallPositions();
  showDetail(state.wallFocusIdx);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return m + ":" + (s < 10 ? "0" : "") + s;
}

/* Handle resize */
window.addEventListener("resize", () => {
  if (state.view === "wall") updateWallPositions();
});
