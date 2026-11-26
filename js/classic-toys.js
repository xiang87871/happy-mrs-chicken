(function (HMC) {
  'use strict';

  const TOYS = [
    { id: 'puddle',     elId: 'puddleBtn',        hint: '松手跳泥坑！💦' },
    { id: 'slide',      elId: 'meadowSlide',      hint: '松手滑滑梯！🛝' },
    { id: 'trampoline', elId: 'meadowTrampoline', hint: '松手跳蹦床！🍄' }
  ];

  const TOY_BY_ID = Object.fromEntries(TOYS.map(t => [t.id, t]));
  const DROP_PAD_PX = 18;

  const activeRuns = new Map();
  const mudTimers = new Map();
  const fxTimers = new Set();
  let justDroppedUntil = 0;
  let initialized = false;

  function nowMs() {
    return (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();
  }

  function getShellRect() {
    const appShell = document.getElementById('appShell');
    if (appShell && typeof appShell.getBoundingClientRect === 'function') {
      const r = appShell.getBoundingClientRect();
      if (r && r.width > 0 && r.height > 0) return r;
    }
    return {
      left: 0,
      top: 0,
      width: window.innerWidth || 390,
      height: window.innerHeight || 844,
      right: window.innerWidth || 390,
      bottom: window.innerHeight || 844
    };
  }

  function getBounds() {
    if (HMC.modes && HMC.modes.classic && typeof HMC.modes.classic.getClassicBounds === 'function') {
      return HMC.modes.classic.getClassicBounds(false);
    }
    return {
      shellRect: getShellRect(),
      minX: 9,
      maxX: 91,
      minY: 18,
      maxY: 84
    };
  }

  function clampToBounds(spot, boundsOverride = null) {
    const b = boundsOverride || getBounds();
    return {
      xPct: Math.max(b.minX + 1, Math.min(b.maxX - 1, spot.xPct)),
      yPct: Math.max(b.minY + 4, Math.min(b.maxY - 1, spot.yPct))
    };
  }

  function clientToPct(clientX, clientY, shellRect) {
    const r = shellRect || getShellRect();
    const w = r.width > 0 ? r.width : (window.innerWidth || 390);
    const h = r.height > 0 ? r.height : (window.innerHeight || 844);
    return {
      xPct: ((clientX - r.left) / w) * 100,
      yPct: ((clientY - r.top) / h) * 100
    };
  }

  function pctToClient(xPct, yPct, shellRect) {
    const r = shellRect || getShellRect();
    const w = r.width > 0 ? r.width : (window.innerWidth || 390);
    const h = r.height > 0 ? r.height : (window.innerHeight || 844);
    return {
      x: r.left + (xPct / 100) * w,
      y: r.top + (yPct / 100) * h
    };
  }

  function getToyEl(toyId) {
    const meta = TOY_BY_ID[toyId];
    return meta ? document.getElementById(meta.elId) : null;
  }

  function getItemNode(itemId) {
    if (HMC.modes && HMC.modes.classic && typeof HMC.modes.classic.getItemNode === 'function') {
      return HMC.modes.classic.getItemNode(itemId);
    }
    return document.querySelector(`.free-meadow-item[data-item-id="${itemId}"]`);
  }

  function retriggerClass(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function triggerHop(el) {
    if (!el || !el._innerEl) return;
    el._innerEl.classList.remove('hop', 'pop-in', 'egg-shake');
    void el._innerEl.offsetWidth;
    el._innerEl.classList.add('hop');
  }

  function triggerTrampolineBoing() {
    const el = getToyEl('trampoline');
    if (el) retriggerClass(el, 'trampoline-boing');
  }

  function triggerSlideCheer() {
    const el = getToyEl('slide');
    if (el) retriggerClass(el, 'slide-cheer');
  }

  function triggerPuddleSplash() {
    const el = getToyEl('puddle');
    if (el) retriggerClass(el, 'splash');
  }

  function markJustDropped(ms = 400) {
    justDroppedUntil = nowMs() + ms;
  }

  function wasJustDropped() {
    return nowMs() < justDroppedUntil;
  }

  function trackFxTimer(fn, ms) {
    const id = setTimeout(() => {
      fxTimers.delete(id);
      fn();
    }, ms);
    fxTimers.add(id);
    return id;
  }

  function spawnMudDroplets(cx, cy) {
    const fxLayer = document.getElementById('fxLayer');
    if (!fxLayer) return;
    const dirs = [
      { dx: -44, dy: -46, s: 11 },
      { dx: -24, dy: -62, s: 9 },
      { dx: -6,  dy: -54, s: 12 },
      { dx: 14,  dy: -64, s: 10 },
      { dx: 36,  dy: -48, s: 11 },
      { dx: -36, dy: -26, s: 8 },
      { dx: 42,  dy: -24, s: 8 }
    ];
    dirs.forEach((d, idx) => {
      const dot = document.createElement('div');
      dot.className = 'mud-droplet';
      dot.style.left = `${cx}px`;
      dot.style.top = `${cy}px`;
      dot.style.width = `${d.s}px`;
      dot.style.height = `${d.s}px`;
      dot.style.setProperty('--dx', `${d.dx}px`);
      dot.style.setProperty('--dy', `${d.dy}px`);
      dot.style.animationDelay = `${idx * 24}ms`;
      fxLayer.appendChild(dot);
      trackFxTimer(() => {
        if (dot.parentNode) dot.remove();
      }, 720);
    });
  }

  function spawnToySparkles(cx, cy, symbols = ['✨', '⭐', '🌟', '💫', '🎉', '✨']) {
    const fxLayer = document.getElementById('fxLayer');
    if (!fxLayer) return;
    const offsets = [
      { dx: -46, dy: -42 },
      { dx: 0,   dy: -58 },
      { dx: 48,  dy: -40 },
      { dx: -34, dy: -16 },
      { dx: 36,  dy: -18 },
      { dx: 4,   dy: -36 }
    ];
    offsets.forEach((o, idx) => {
      const sp = document.createElement('div');
      sp.className = 'toy-sparkle';
      sp.textContent = symbols[idx % symbols.length];
      sp.style.left = `${cx}px`;
      sp.style.top = `${cy}px`;
      sp.style.setProperty('--dx', `${o.dx}px`);
      sp.style.setProperty('--dy', `${o.dy}px`);
      sp.style.animationDelay = `${idx * 35}ms`;
      fxLayer.appendChild(sp);
      trackFxTimer(() => {
        if (sp.parentNode) sp.remove();
      }, 860);
    });
  }

  function clearMudOverlay(itemId, removeNode = true) {
    const entry = mudTimers.get(itemId);
    if (entry) {
      if (entry.fadeTimer) clearTimeout(entry.fadeTimer);
      if (entry.removeTimer) clearTimeout(entry.removeTimer);
      if (removeNode && entry.overlayEl && entry.overlayEl.parentNode) {
        entry.overlayEl.remove();
      }
      mudTimers.delete(itemId);
    }
  }

  function applyMudOverlay(item, el) {
    if (!item || !el) return;
    clearMudOverlay(item.id, true);
    const host = el.querySelector('.meadow-sprite-wrap') || el._innerEl || el;
    const existing = host.querySelector('.muddy-splatter');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'muddy-splatter';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <svg viewBox="0 0 80 80" fill="none">
        <ellipse cx="29" cy="54" rx="5.5" ry="3.8" transform="rotate(-14 29 54)" fill="#7A4924" opacity="0.88"/>
        <circle cx="48" cy="58" r="4.2" fill="#8D5524" opacity="0.85"/>
        <ellipse cx="42" cy="46" rx="3.4" ry="2.4" transform="rotate(18 42 46)" fill="#6B3F1D" opacity="0.82"/>
        <circle cx="54" cy="47" r="2.6" fill="#8D5524" opacity="0.8"/>
        <circle cx="24" cy="46" r="2.4" fill="#6B3F1D" opacity="0.78"/>
      </svg>
    `;
    host.appendChild(overlay);

    const entry = { overlayEl: overlay, fadeTimer: null, removeTimer: null };
    entry.fadeTimer = setTimeout(() => {
      if (overlay) overlay.classList.add('fading');
      entry.removeTimer = setTimeout(() => {
        if (overlay && overlay.parentNode) overlay.remove();
        mudTimers.delete(item.id);
      }, 650);
    }, 5800);
    mudTimers.set(item.id, entry);
  }

  function findDropTarget(clientX, clientY) {
    if (HMC.state && HMC.state.mode && HMC.state.mode !== 'classic') return null;
    if (typeof clientX !== 'number' || typeof clientY !== 'number') return null;

    let bestId = null;
    let bestDist = Infinity;

    for (let i = 0; i < TOYS.length; i++) {
      const toy = TOYS[i];
      const el = document.getElementById(toy.elId);
      if (!el || typeof el.getBoundingClientRect !== 'function') continue;
      const r = el.getBoundingClientRect();
      if (!r || r.width <= 0 || r.height <= 0) continue;

      if (
        clientX >= r.left - DROP_PAD_PX &&
        clientX <= r.right + DROP_PAD_PX &&
        clientY >= r.top - DROP_PAD_PX &&
        clientY <= r.bottom + DROP_PAD_PX
      ) {
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const d = Math.hypot(clientX - cx, clientY - cy);
        if (d < bestDist) {
          bestDist = d;
          bestId = toy.id;
        }
      }
    }
    return bestId;
  }

  function setDragHighlights(active, hoveredId = null) {
    TOYS.forEach(toy => {
      const el = document.getElementById(toy.elId);
      if (!el) return;
      const isHot = !!active && hoveredId === toy.id;
      el.classList.toggle('drop-ready', !!active);
      el.classList.toggle('drop-hot', isHot);

      const hintEl = el.querySelector('.toy-drop-hint');
      if (hintEl) {
        if (isHot) {
          hintEl.textContent = toy.hint;
          hintEl.classList.add('visible');
        } else {
          hintEl.classList.remove('visible');
        }
      }
    });
  }

  function getToyObstacleRects() {
    const shellRect = getShellRect();
    const w = shellRect.width > 0 ? shellRect.width : 1;
    const h = shellRect.height > 0 ? shellRect.height : 1;
    const pad = 16;
    const rects = [];

    TOYS.forEach(toy => {
      const el = document.getElementById(toy.elId);
      if (!el || typeof el.getBoundingClientRect !== 'function') return;
      const r = el.getBoundingClientRect();
      if (!r || r.width <= 0 || r.height <= 0) return;
      rects.push({
        id: toy.id,
        leftPct: ((r.left - pad - shellRect.left) / w) * 100,
        rightPct: ((r.right + pad - shellRect.left) / w) * 100,
        topPct: ((r.top - pad - shellRect.top) / h) * 100,
        bottomPct: ((r.bottom + pad - shellRect.top) / h) * 100
      });
    });
    return rects;
  }

  function getToyInviteSpot(toyId) {
    const bounds = getBounds();
    const { shellRect } = bounds;
    const el = getToyEl(toyId);
    const r = el && typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null;

    if (r && r.width > 0 && r.height > 0) {
      if (toyId === 'puddle') {
        return clampToBounds(clientToPct(r.left + r.width * 0.52, r.top + r.height * 0.42, shellRect), bounds);
      }
      if (toyId === 'slide') {
        return clampToBounds(clientToPct(r.left + r.width * 0.65, r.top + r.height * 0.85, shellRect), bounds);
      }
      if (toyId === 'trampoline') {
        return clampToBounds(clientToPct(r.left + r.width * 0.52, r.top + r.height * 0.55, shellRect), bounds);
      }
    }

    if (toyId === 'puddle') return clampToBounds({ xPct: 20, yPct: 80 }, bounds);
    if (toyId === 'slide') return clampToBounds({ xPct: 82, yPct: 44 }, bounds);
    return clampToBounds({ xPct: 18, yPct: 52 }, bounds);
  }

  function createRun(item, el, toyId) {
    cancelItemRun(item.id);

    const run = {
      itemId: item.id,
      item,
      el,
      toyId,
      timers: new Set(),
      rafId: null,
      cancelled: false
    };

    item.playingToy = toyId;
    item.visitingPuddle = false;
    item.invitedToy = null;
    item.targetX = null;
    item.targetY = null;

    if (el) {
      el.classList.add('is-playing-toy');
      if (el._waddleEl) el._waddleEl.classList.remove('waddling');
    }

    activeRuns.set(item.id, run);
    return run;
  }

  function runTimer(run, fn, ms) {
    const id = setTimeout(() => {
      run.timers.delete(id);
      if (run.cancelled) return;
      fn();
    }, ms);
    run.timers.add(id);
    return id;
  }

  function finishRun(run, onDone) {
    if (!run || run.cancelled) return;
    run.cancelled = true;
    run.timers.forEach(id => clearTimeout(id));
    run.timers.clear();
    if (run.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(run.rafId);
      run.rafId = null;
    }
    if (activeRuns.get(run.itemId) === run) {
      activeRuns.delete(run.itemId);
    }

    const { item, el } = run;
    if (item) {
      item.playingToy = null;
      item.invitedToy = null;
      item.targetX = null;
      item.targetY = null;
      item.pauseUntil = nowMs() + 900;
    }
    if (el) {
      el.classList.remove('is-playing-toy');
      if (el._innerEl) el._innerEl.style.transform = '';
      if (item && typeof item.yPct === 'number') {
        el.style.zIndex = String(Math.max(15, Math.round(item.yPct * 10)));
      }
    }

    if (typeof onDone === 'function') {
      onDone();
    }
  }

  function cancelItemRun(itemId) {
    const run = activeRuns.get(itemId);
    if (!run) return;
    run.cancelled = true;
    run.timers.forEach(id => clearTimeout(id));
    run.timers.clear();
    if (run.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(run.rafId);
      run.rafId = null;
    }
    activeRuns.delete(itemId);

    if (run.item) {
      run.item.playingToy = null;
      run.item.invitedToy = null;
    }
    if (run.el) {
      run.el.classList.remove('is-playing-toy');
      if (run.el._innerEl) run.el._innerEl.style.transform = '';
      if (run.item && typeof run.item.yPct === 'number') {
        run.el.style.zIndex = String(Math.max(15, Math.round(run.item.yPct * 10)));
      }
    }
  }

  function renderToyHammerSVG(size = 76) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 96 96" fill="none" aria-hidden="true">
        <g transform="translate(44 36) rotate(-32)">
          <!-- Warm Wooden Handle -->
          <rect x="-7" y="10" width="14" height="44" rx="7" fill="#F4B860" stroke="#4A3728" stroke-width="4"/>
          <path d="M-2 17 V45" stroke="#FFE2A8" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
          <!-- Pink Grip Cap -->
          <path d="M-7 38 H7 V47 C7 51 4 54 0 54 C-4 54 -7 51 -7 47 Z" fill="#FF6B9D" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
          <!-- Sunshine Yellow Wooden Mallet Head -->
          <rect x="-24" y="-15" width="48" height="30" rx="9" fill="#FFD43B" stroke="#4A3728" stroke-width="4.2"/>
          <!-- Bouncy Pink Rubber Strike Caps -->
          <rect x="-32" y="-16" width="14" height="32" rx="7" fill="#FF6B9D" stroke="#4A3728" stroke-width="4"/>
          <rect x="18" y="-16" width="14" height="32" rx="7" fill="#FF6B9D" stroke="#4A3728" stroke-width="4"/>
          <!-- Glossy Highlights -->
          <path d="M-13 -9 H13" stroke="#FFF6BF" stroke-width="3.4" stroke-linecap="round" opacity="0.92"/>
          <path d="M-27 -8 V4" stroke="#FFC2DC" stroke-width="2.8" stroke-linecap="round" opacity="0.88"/>
          <path d="M23 -8 V4" stroke="#FFC2DC" stroke-width="2.8" stroke-linecap="round" opacity="0.88"/>
          <!-- Cheerful Star Emblem -->
          <path d="M0 -8 L2.4 -2.8 L8 -2.1 L3.9 1.7 L4.9 7.3 L0 4.6 L-4.9 7.3 L-3.9 1.7 L-8 -2.1 L-2.4 -2.8 Z" fill="#FFF9DB" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
        </g>
        <circle cx="20" cy="14" r="3.2" fill="#FFF3B0" stroke="#4A3728" stroke-width="2"/>
      </svg>
    `;
  }

  function playHammerStrikeAt(clientX, clientY) {
    const fxLayer = document.getElementById('fxLayer');
    if (!fxLayer) return null;
    const x = typeof clientX === 'number' ? clientX : (window.innerWidth || 390) * 0.5;
    const y = typeof clientY === 'number' ? clientY : (window.innerHeight || 844) * 0.5;

    const fx = document.createElement('div');
    fx.className = 'hammer-strike-fx';
    fx.setAttribute('aria-hidden', 'true');
    fx.style.left = `${x}px`;
    fx.style.top = `${y}px`;
    fx.innerHTML = renderToyHammerSVG(76);
    fxLayer.appendChild(fx);

    trackFxTimer(() => {
      spawnToySparkles(x, y - 14, ['⭐', '✨', '💥', '🌟', '💫', '✨']);
    }, 150);

    trackFxTimer(() => {
      if (fx.parentNode) fx.remove();
    }, 460);

    return fx;
  }

  function cancelAllAnimations() {
    Array.from(activeRuns.keys()).forEach(id => cancelItemRun(id));
    Array.from(mudTimers.keys()).forEach(id => clearMudOverlay(id, true));
    fxTimers.forEach(id => clearTimeout(id));
    fxTimers.clear();
    const fxLayer = document.getElementById('fxLayer');
    if (fxLayer && typeof fxLayer.querySelectorAll === 'function') {
      fxLayer.querySelectorAll('.hammer-strike-fx').forEach(n => n.remove());
    }
    setDragHighlights(false, null);
  }

  function setItemPos(item, el, xPct, yPct) {
    item.xPct = xPct;
    item.yPct = yPct;
    if (el) {
      el.style.left = `${xPct.toFixed(2)}%`;
      el.style.top = `${yPct.toFixed(2)}%`;
    }
  }

  /* ==========================================================================
     1. Muddy Puddle Jump Routine (~1.7s)
     ========================================================================== */
  function playPuddleJump(item, el, onDone = null) {
    const node = el || (item && getItemNode(item.id));
    if (!item || !node) {
      if (typeof onDone === 'function') onDone();
      return false;
    }

    const run = createRun(item, node, 'puddle');
    const bounds = getBounds();
    const { shellRect } = bounds;
    const puddleEl = getToyEl('puddle');
    const pr = puddleEl && typeof puddleEl.getBoundingClientRect === 'function'
      ? puddleEl.getBoundingClientRect()
      : null;

    let centerSpot;
    let landingSpot;
    let splashClientX;
    let splashClientY;

    if (pr && pr.width > 0 && pr.height > 0) {
      centerSpot = clientToPct(pr.left + pr.width * 0.50, pr.top + pr.height * 0.44, shellRect);
      landingSpot = clampToBounds(clientToPct(pr.right + 28, pr.top + pr.height * 0.15, shellRect), bounds);
      splashClientX = pr.left + pr.width * 0.50;
      splashClientY = pr.top + pr.height * 0.35;
    } else {
      centerSpot = { xPct: 20, yPct: 80 };
      landingSpot = clampToBounds({ xPct: 34, yPct: 76 }, bounds);
      const pt = pctToClient(centerSpot.xPct, centerSpot.yPct, shellRect);
      splashClientX = pt.x;
      splashClientY = pt.y;
    }

    setItemPos(item, node, centerSpot.xPct, centerSpot.yPct);

    const doJump = (withSplashSound) => {
      triggerHop(node);
      triggerPuddleSplash();
      spawnMudDroplets(splashClientX, splashClientY);
      if (withSplashSound && HMC.audio && HMC.audio.SFX) {
        HMC.audio.SFX.splash();
      }
    };

    // Jump 1
    doJump(true);

    runTimer(run, () => {
      if (HMC.effects) {
        HMC.effects.spawnFloatingWord('咕叽咕叽！真好玩！💦', splashClientX, splashClientY - 26, '#8D5524');
      }
      if (HMC.audio) {
        if (typeof HMC.audio.setPrompt === 'function') {
          HMC.audio.setPrompt('哈哈！小鸡跳进大泥坑啦，咕叽咕叽！', 'Haha! Splashing in the big muddy puddle!');
        } else if (typeof HMC.audio.speak === 'function') {
          HMC.audio.speak('哈哈！小鸡跳进大泥坑啦，咕叽咕叽！', 'Haha! Splashing in the big muddy puddle!');
        }
      }
    }, 100);

    // Jump 2 + cute mud splatter freckles
    runTimer(run, () => {
      doJump(true);
      applyMudOverlay(item, node);
    }, 480);

    // Jump 3 + cheerful cheep
    runTimer(run, () => {
      doJump(false);
      if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.cheep();
    }, 980);

    // Soft hop back onto grass & resume walking
    runTimer(run, () => {
      setItemPos(item, node, landingSpot.xPct, landingSpot.yPct);
      triggerHop(node);
      if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
      finishRun(run, onDone);
    }, 1660);

    return true;
  }

  /* ==========================================================================
     2. Rainbow Slide Ride Routine (~1.9s)
     ========================================================================== */
  function playSlideRide(item, el, onDone = null) {
    const node = el || (item && getItemNode(item.id));
    if (!item || !node) {
      if (typeof onDone === 'function') onDone();
      return false;
    }

    const run = createRun(item, node, 'slide');
    const bounds = getBounds();
    const { shellRect } = bounds;
    const slideEl = getToyEl('slide');
    const sr = slideEl && typeof slideEl.getBoundingClientRect === 'function'
      ? slideEl.getBoundingClientRect()
      : null;

    let p0, p1, p2, pLand;
    let topClientX, topClientY;

    if (sr && sr.width > 0 && sr.height > 0) {
      p0 = clientToPct(sr.left + sr.width * 0.72, sr.top + sr.height * 0.25, shellRect);
      p1 = clientToPct(sr.left + sr.width * 0.44, sr.top + sr.height * 0.66, shellRect);
      p2 = clientToPct(sr.left + sr.width * 0.14, sr.top + sr.height * 0.86, shellRect);
      pLand = clampToBounds(clientToPct(sr.left - sr.width * 0.12, sr.top + sr.height * 0.96, shellRect), bounds);
      topClientX = sr.left + sr.width * 0.62;
      topClientY = sr.top - 10;
    } else {
      p0 = { xPct: 86, yPct: 36 };
      p1 = { xPct: 79, yPct: 44 };
      p2 = { xPct: 71, yPct: 49 };
      pLand = clampToBounds({ xPct: 65, yPct: 52 }, bounds);
      const pt = pctToClient(p0.xPct, p0.yPct, shellRect);
      topClientX = pt.x;
      topClientY = pt.y - 16;
    }

    // Step 1: Hop cleanly to the top lookout platform
    item.facingRight = false;
    if (node._facingEl) node._facingEl.classList.remove('flip');
    setItemPos(item, node, p0.xPct, p0.yPct);
    triggerHop(node);
    triggerSlideCheer();
    if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
    if (HMC.effects) {
      HMC.effects.spawnFloatingWord('爬上滑滑梯！', topClientX, topClientY, '#FF922B');
    }

    let landed = false;
    const triggerLanding = () => {
      if (landed || run.cancelled) return;
      landed = true;
      if (run.rafId !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(run.rafId);
        run.rafId = null;
      }
      if (node._innerEl) node._innerEl.style.transform = '';
      setItemPos(item, node, pLand.xPct, pLand.yPct);
      triggerHop(node);
      if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.cheep();

      const landPt = pctToClient(pLand.xPct, pLand.yPct, shellRect);
      spawnToySparkles(landPt.x, landPt.y - 16, ['⭐', '✨', '🌈', '🌟', '💫', '✨']);
      if (HMC.effects) {
        HMC.effects.spawnFloatingWord('咻——好好玩呀！🛝', landPt.x, landPt.y - 30, '#FF5C8D');
      }

      runTimer(run, () => {
        finishRun(run, onDone);
      }, 620);
    };

    // Step 2: Glide smoothly along curved quadratic Bezier chute
    runTimer(run, () => {
      if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.slide();

      runTimer(run, () => {
        if (HMC.audio) {
          if (typeof HMC.audio.setPrompt === 'function') {
            HMC.audio.setPrompt('咻！小鸡滑滑梯下来啦！', 'Wheee! Down the rainbow slide!');
          } else if (typeof HMC.audio.speak === 'function') {
            HMC.audio.speak('咻！小鸡滑滑梯下来啦！', 'Wheee! Down the rainbow slide!');
          }
        }
      }, 110);

      const duration = 960;
      const startTs = nowMs();

      const stepSlide = () => {
        if (run.cancelled || landed) return;
        const elapsed = nowMs() - startTs;
        const u = Math.min(1, Math.max(0, elapsed / duration));
        const t = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        const inv = 1 - t;

        const x = inv * inv * p0.xPct + 2 * inv * t * p1.xPct + t * t * p2.xPct;
        const y = inv * inv * p0.yPct + 2 * inv * t * p1.yPct + t * t * p2.yPct;
        setItemPos(item, node, x, y);

        if (node._innerEl) {
          const tilt = -22 * Math.sin(Math.PI * t);
          const scale = 1 + 0.06 * Math.sin(Math.PI * t);
          node._innerEl.style.transform = `rotate(${tilt.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        }

        if (u >= 1) {
          triggerLanding();
          return;
        }
        if (typeof requestAnimationFrame === 'function') {
          run.rafId = requestAnimationFrame(stepSlide);
        }
      };

      if (typeof requestAnimationFrame === 'function') {
        run.rafId = requestAnimationFrame(stepSlide);
      }
      // Fallback guarantee in case rAF is throttled/unscheduled
      runTimer(run, triggerLanding, duration + 60);
    }, 260);

    return true;
  }

  /* ==========================================================================
     3. Mushroom Trampoline 3-Bounce Routine (~1.8s)
     ========================================================================== */
  function playTrampolineBounce(item, el, onDone = null) {
    const node = el || (item && getItemNode(item.id));
    if (!item || !node) {
      if (typeof onDone === 'function') onDone();
      return false;
    }

    const run = createRun(item, node, 'trampoline');
    const bounds = getBounds();
    const { shellRect } = bounds;
    const trampEl = getToyEl('trampoline');
    const tr = trampEl && typeof trampEl.getBoundingClientRect === 'function'
      ? trampEl.getBoundingClientRect()
      : null;

    let padSpot, landSpot, padClientX, padClientY;

    if (tr && tr.width > 0 && tr.height > 0) {
      padSpot = clientToPct(tr.left + tr.width * 0.50, tr.top + tr.height * 0.30, shellRect);
      landSpot = clampToBounds(clientToPct(tr.right + 28, tr.top + tr.height * 0.84, shellRect), bounds);
      padClientX = tr.left + tr.width * 0.50;
      padClientY = tr.top;
    } else {
      padSpot = { xPct: 16, yPct: 50 };
      landSpot = clampToBounds({ xPct: 28, yPct: 54 }, bounds);
      const pt = pctToClient(padSpot.xPct, padSpot.yPct, shellRect);
      padClientX = pt.x;
      padClientY = pt.y;
    }

    setItemPos(item, node, padSpot.xPct, padSpot.yPct);

    const vhScale = Math.min(1, Math.max(0.66, (window.innerHeight || 720) / 700));
    const bounces = [
      { start: 0,   dur: 440, height: 44 * vhScale,  pitch: 0.96, tilt: -8  },
      { start: 440, dur: 500, height: 78 * vhScale,  pitch: 1.14, tilt: 12  },
      { start: 940, dur: 580, height: 116 * vhScale, pitch: 1.32, tilt: 360 }
    ];
    const totalBounceMs = 1520;

    // Trigger bounce sound & pad squash on each takeoff
    bounces.forEach((b, idx) => {
      runTimer(run, () => {
        triggerTrampolineBoing();
        if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.trampoline(b.pitch);
        if (idx === 2) {
          // Apex celebration on bounce #3!
          runTimer(run, () => {
            spawnToySparkles(padClientX, Math.max(72, padClientY - b.height * 0.7), ['🌟', '✨', '⭐', '💫', '🍄', '🌟']);
            if (HMC.effects) {
              HMC.effects.spawnFloatingWord('蹦蹦蹦！飞高高啦！🌟', padClientX + 18, Math.max(82, padClientY - b.height * 0.6), '#FF922B');
            }
            if (HMC.audio) {
              if (typeof HMC.audio.setPrompt === 'function') {
                HMC.audio.setPrompt('哇！小鸡在蹦蹦床上飞高高啦！', 'Whoa! Bouncing super high on the trampoline!');
              } else if (typeof HMC.audio.speak === 'function') {
                HMC.audio.speak('哇！小鸡在蹦蹦床上飞高高啦！', 'Whoa! Bouncing super high on the trampoline!');
              }
            }
          }, Math.round(b.dur * 0.42));
        }
      }, b.start);
    });

    const startTs = nowMs();
    const animateBounces = () => {
      if (run.cancelled) return;
      const elapsed = nowMs() - startTs;
      if (elapsed >= totalBounceMs) {
        if (node._innerEl) node._innerEl.style.transform = '';
        return;
      }

      let cur = bounces[bounces.length - 1];
      for (let i = 0; i < bounces.length; i++) {
        if (elapsed >= bounces[i].start && elapsed < bounces[i].start + bounces[i].dur) {
          cur = bounces[i];
          break;
        }
      }

      const u = Math.min(1, Math.max(0, (elapsed - cur.start) / cur.dur));
      const arc = Math.sin(Math.PI * u);
      const liftY = -arc * cur.height;

      let sx = 1;
      let sy = 1;
      if (u < 0.12 || u > 0.88) {
        sx = 1.14;
        sy = 0.86;
      } else {
        sx = 0.94;
        sy = 1.09;
      }

      const rot = cur.tilt === 360
        ? (u * 360)
        : (cur.tilt * arc);

      if (node._innerEl) {
        node._innerEl.style.transform = `translateY(${liftY.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${sx.toFixed(2)}, ${sy.toFixed(2)})`;
      }

      if (typeof requestAnimationFrame === 'function') {
        run.rafId = requestAnimationFrame(animateBounces);
      }
    };

    if (typeof requestAnimationFrame === 'function') {
      run.rafId = requestAnimationFrame(animateBounces);
    }

    // Gentle landing hop onto grass beside trampoline
    runTimer(run, () => {
      if (run.rafId !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(run.rafId);
        run.rafId = null;
      }
      if (node._innerEl) node._innerEl.style.transform = '';
      setItemPos(item, node, landSpot.xPct, landSpot.yPct);
      triggerHop(node);
      if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
    }, 1540);

    runTimer(run, () => {
      finishRun(run, onDone);
    }, 1820);

    return true;
  }

  /* ==========================================================================
     4. Direct Toy Click -> Invite Nearest Idle Chick
     ========================================================================== */
  function playToyById(toyId, item, el, onDone = null) {
    if (toyId === 'puddle') return playPuddleJump(item, el, onDone);
    if (toyId === 'slide') return playSlideRide(item, el, onDone);
    if (toyId === 'trampoline') return playTrampolineBounce(item, el, onDone);
    return false;
  }

  function inviteNearestChickTo(toyId) {
    if (!TOY_BY_ID[toyId]) return null;
    if (HMC.state && HMC.state.mode && HMC.state.mode !== 'classic') return null;

    const toyEl = getToyEl(toyId);
    const r = toyEl && typeof toyEl.getBoundingClientRect === 'function' ? toyEl.getBoundingClientRect() : null;
    const cx = r && r.width > 0 ? (r.left + r.width * 0.5) : (window.innerWidth || 390) * 0.5;
    const cy = r && r.height > 0 ? (r.top + r.height * 0.35) : (window.innerHeight || 844) * 0.45;

    if (toyId === 'trampoline') {
      triggerTrampolineBoing();
      if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.trampoline(1);
    } else if (toyId === 'slide') {
      triggerSlideCheer();
      if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
    } else if (toyId === 'puddle') {
      triggerPuddleSplash();
      if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.splash();
    }

    const items = (HMC.state && Array.isArray(HMC.state.classicItems)) ? HMC.state.classicItems : [];
    const chicks = items.filter(i => i.type === 'chick');

    if (chicks.length === 0) {
      spawnToySparkles(cx, cy, ['✨', '⭐', '🌟', '💫']);
      if (toyId === 'slide') {
        if (HMC.effects) HMC.effects.spawnFloatingWord('🌈 彩虹滑滑梯！', cx, cy - 12, '#FF5C8D');
        if (HMC.audio) {
          HMC.audio.setPrompt('先在草地上孵出小鸡，就可以抓小鸡来滑滑梯啦！', 'Hatch a chick on the grass first to ride the slide!');
        }
      } else if (toyId === 'trampoline') {
        if (HMC.effects) HMC.effects.spawnFloatingWord('🍄 弹性蹦蹦床！', cx, cy - 12, '#FF5D6C');
        if (HMC.audio) {
          HMC.audio.setPrompt('先在草地上孵出小鸡，就可以抓小鸡来跳蹦蹦床啦！', 'Hatch a chick on the grass first to jump on the trampoline!');
        }
      } else {
        if (HMC.effects) HMC.effects.spawnFloatingWord('💦 大泥坑！', cx, cy - 12, '#8D5524');
        if (HMC.audio) {
          HMC.audio.setPrompt('先在草地上孵出小鸡，就可以抓小鸡来跳泥坑啦！', 'Hatch a chick on the grass first to jump in the puddle!');
        }
      }
      return null;
    }

    const idleChicks = chicks.filter(c => !c.dragging && !c.playingToy && !c.invitedToy);
    const pool = idleChicks.length > 0
      ? idleChicks
      : chicks.filter(c => !c.dragging && !c.playingToy);

    if (pool.length === 0) {
      spawnToySparkles(cx, cy, ['✨', '⭐', '🌟']);
      return null;
    }

    const spot = getToyInviteSpot(toyId);
    let nearest = pool[0];
    let nearestDist = Infinity;
    pool.forEach(c => {
      const d = Math.hypot((c.xPct || 50) - spot.xPct, (c.yPct || 50) - spot.yPct);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = c;
      }
    });

    const node = getItemNode(nearest.id);
    if (nearestDist <= 6.5 && node) {
      playToyById(toyId, nearest, node);
      return nearest;
    }

    nearest.invitedToy = toyId;
    nearest.visitingPuddle = false;
    nearest.pauseUntil = 0;
    nearest.targetX = spot.xPct;
    nearest.targetY = spot.yPct;

    if (HMC.effects) {
      const callText = toyId === 'slide' ? '滑滑梯来咯！🌈' : (toyId === 'trampoline' ? '跳蹦床来咯！🍄' : '跳泥坑来咯！💦');
      HMC.effects.spawnFloatingWord(callText, cx, cy - 14, toyId === 'trampoline' ? '#FF5D6C' : '#FF922B');
    }

    if (HMC.modes && HMC.modes.classic && typeof HMC.modes.classic.startMeadowLife === 'function') {
      HMC.modes.classic.startMeadowLife();
    }

    return nearest;
  }

  function init() {
    if (initialized) return;
    initialized = true;

    const slideEl = document.getElementById('meadowSlide');
    if (slideEl) {
      slideEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (wasJustDropped()) return;
        inviteNearestChickTo('slide');
      });
    }

    const trampEl = document.getElementById('meadowTrampoline');
    if (trampEl) {
      trampEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (wasJustDropped()) return;
        inviteNearestChickTo('trampoline');
      });
    }
  }

  HMC.classicToys = {
    TOYS,
    findDropTarget,
    setDragHighlights,
    renderToyHammerSVG,
    playHammerStrikeAt,
    playPuddleJump,
    playSlideRide,
    playTrampolineBounce,
    playToyById,
    inviteNearestChickTo,
    getToyObstacleRects,
    getToyInviteSpot,
    markJustDropped,
    wasJustDropped,
    cancelItemRun,
    cancelAllAnimations,
    init
  };
})(window.HMC = window.HMC || {});
