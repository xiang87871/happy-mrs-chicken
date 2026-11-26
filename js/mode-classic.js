(function (HMC) {
  'use strict';

  const itemNodeMap = new Map();
  const eggIncubationTimers = new Map();
  let nextItemSeq = 1;
  let meadowRafId = null;
  let lastFrameTs = 0;
  let nextPuddleVisitAt = 0;
  let cachedBounds = null;
  let cachedBoundsTs = 0;
  let activeDrag = null;
  let justDraggedChickUntil = 0;
  let suppressNextClickItemId = null;
  let suppressNextClickUntil = 0;

  let hammerActive = false;
  let activeHammerDrag = null;
  let suppressNextHammerClickUntil = 0;
  let justUsedHammerUntil = 0;
  let hammerHintTimer = null;

  function nowMs() {
    return (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();
  }

  function getItemNode(itemId) {
    return itemNodeMap.get(itemId) || null;
  }

  function getEls() {
    return {
      appShellEl: document.getElementById('appShell'),
      stageEl: document.getElementById('gameStage'),
      classicFieldEl: document.getElementById('classicField'),
      classicMiniCountsEl: document.getElementById('classicMiniCounts'),
      classicFabsEl: document.getElementById('classicFabs')
    };
  }

  function isSleeping() {
    const sleepOverlay = document.getElementById('sleepOverlay');
    return !!(sleepOverlay && sleepOverlay.classList.contains('open'));
  }

  function getClassicBounds(forceFresh = true) {
    const now = performance.now();
    if (!forceFresh && cachedBounds && (now - cachedBoundsTs) < 550) {
      return cachedBounds;
    }
    const { appShellEl } = getEls();
    const shellRect = appShellEl.getBoundingClientRect();
    const hudRect = document.querySelector('.hud-top').getBoundingClientRect();
    const dockRect = document.getElementById('modeDock').getBoundingClientRect();
    const isLeftDock = dockRect.height > dockRect.width;

    const minY = Math.max(16, ((hudRect.bottom - shellRect.top + 30) / shellRect.height) * 100);
    const maxY = isLeftDock
      ? 89
      : Math.min(82, ((dockRect.top - shellRect.top - 36) / shellRect.height) * 100);

    const minX = isLeftDock
      ? Math.max(12, ((dockRect.right - shellRect.left + 36) / shellRect.width) * 100)
      : 9;
    const maxX = 91;

    cachedBounds = { shellRect, minX, maxX, minY, maxY: Math.max(minY + 18, maxY) };
    cachedBoundsTs = now;
    return cachedBounds;
  }

  function pickRandomGrassSpot() {
    const { minX, maxX, minY, maxY } = getClassicBounds();
    const grassMinY = Math.min(maxY - 10, Math.max(minY + 8, 36));
    const toyRects = (HMC.classicToys && typeof HMC.classicToys.getToyObstacleRects === 'function')
      ? HMC.classicToys.getToyObstacleRects()
      : [];
    let best = { xPct: (minX + maxX) / 2, yPct: (grassMinY + maxY) / 2 };
    let bestScore = -9999;

    for (let attempt = 0; attempt < 22; attempt++) {
      const cx = minX + 4 + Math.random() * Math.max(10, maxX - minX - 8);
      const cy = grassMinY + Math.random() * Math.max(8, maxY - grassMinY);
      let minDist = 999;
      HMC.state.classicItems.forEach(item => {
        const d = Math.hypot(cx - item.xPct, (cy - item.yPct) * 1.35);
        if (d < minDist) minDist = d;
      });
      const hitsToy = toyRects.some(tr => (
        cx >= tr.leftPct && cx <= tr.rightPct && cy >= tr.topPct && cy <= tr.bottomPct
      ));
      const score = hitsToy ? (minDist - 80) : minDist;
      if (score > bestScore) {
        bestScore = score;
        best = { xPct: cx, yPct: cy };
      }
      if (!hitsToy && minDist > 15) break;
    }
    return best;
  }

  function pickRareBuddyId() {
    const buddies = (HMC.data && HMC.data.RARE_BUDDIES) || [];
    if (!buddies.length) return 'dino';
    const album = HMC.storage && HMC.storage.getAlbum ? HMC.storage.getAlbum() : {};
    const onMeadow = new Set(
      HMC.state.classicItems.filter(i => i.rareId).map(i => i.rareId)
    );
    const uncollected = buddies.filter(b => !(Number(album[b.id]) > 0));
    const collected = buddies.filter(b => (Number(album[b.id]) > 0));

    if (uncollected.length > 0) {
      // Strongly prefer uncollected buddies (85% chance when some are already collected,
      // 100% when none are collected yet) so kids keep discovering brand-new friends!
      const preferNew = collected.length === 0 || Math.random() < 0.85;
      if (preferNew) {
        const freshUncollected = uncollected.filter(b => !onMeadow.has(b.id));
        const pool = freshUncollected.length > 0 ? freshUncollected : uncollected;
        return pool[Math.floor(Math.random() * pool.length)].id;
      }
      const freshCollected = collected.filter(b => !onMeadow.has(b.id));
      const pool = freshCollected.length > 0 ? freshCollected : collected;
      return pool[Math.floor(Math.random() * pool.length)].id;
    }

    const freshOnMeadow = buddies.filter(b => !onMeadow.has(b.id));
    const pool = freshOnMeadow.length > 0 ? freshOnMeadow : buddies;
    return pool[Math.floor(Math.random() * pool.length)].id;
  }

  function initChickMotion(item, pauseMs = 750) {
    item.speed = item.speed || (4.4 + Math.random() * 2.1);
    item.facingRight = typeof item.facingRight === 'boolean' ? item.facingRight : (Math.random() < 0.5);
    item.targetX = null;
    item.targetY = null;
    item.visitingPuddle = false;
    item.dragging = false;
    item.playingToy = null;
    item.invitedToy = null;
    item.pauseUntil = nowMs() + pauseMs;
  }

  function scheduleNextPuddleVisit(now) {
    const isRain = HMC.state.weather === 'rain';
    const delay = isRain
      ? (3800 + Math.random() * 3200)
      : (7000 + Math.random() * 5000);
    nextPuddleVisitAt = now + delay;
  }

  function getPuddleTarget(bounds) {
    const puddleBtn = document.getElementById('puddleBtn');
    const { shellRect, minX, maxX, minY, maxY } = bounds;
    if (!puddleBtn || !shellRect || shellRect.width <= 0 || shellRect.height <= 0) {
      return { xPct: minX + 6, yPct: maxY - 4 };
    }
    const pr = puddleBtn.getBoundingClientRect();
    const px = ((pr.left + pr.width * 0.52 - shellRect.left) / shellRect.width) * 100;
    const py = ((pr.top + pr.height * 0.35 - shellRect.top) / shellRect.height) * 100;
    return {
      xPct: Math.max(minX + 1, Math.min(maxX - 2, px)),
      yPct: Math.max(minY + 6, Math.min(maxY, py))
    };
  }

  function triggerPuddleSplashFromChick(el) {
    const puddleBtn = document.getElementById('puddleBtn');
    if (el && el._innerEl) {
      el._innerEl.classList.remove('hop', 'pop-in', 'egg-shake');
      void el._innerEl.offsetWidth;
      el._innerEl.classList.add('hop');
    }
    if (puddleBtn) {
      puddleBtn.classList.remove('splash');
      void puddleBtn.offsetWidth;
      puddleBtn.classList.add('splash');
      const rect = puddleBtn.getBoundingClientRect();
      HMC.effects.spawnFloatingWord('咕叽！💦', rect.left + rect.width * 0.5, rect.top - 8, '#8D5524');
    }
    HMC.audio.SFX.splash();
  }

  function assignParadeTargets(bounds) {
    const state = HMC.state;
    const chicks = state.classicItems.filter(i => i.type === 'chick' && !i.dragging && !i.playingToy && !i.invitedToy);
    if (chicks.length === 0) return;

    const now = nowMs();
    const { minX, maxX, minY, maxY } = bounds;
    const grassMinY = Math.min(maxY - 6, Math.max(minY + 4, 34));
    // Trail gently behind happy Mrs. Chicken in a loose adorable fan
    const behindDir = state.chickenFlip ? -1 : 1;

    chicks.forEach((chick, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const jitterX = (Math.random() - 0.5) * 3.2;
      const jitterY = (Math.random() - 0.5) * 2.6;
      const offsetX = behindDir * (8.5 + col * 6.4) + jitterX;
      const offsetY = (row * 5.6) + (col % 2 === 0 ? 3.0 : -2.6) + jitterY;

      let tx = state.chickenX + offsetX;
      let ty = state.chickenY + offsetY;
      // If behind Mama hits the viewport edge, wrap loosely to the open side
      if (tx < minX + 2 || tx > maxX - 2) {
        tx = state.chickenX - offsetX * 0.85;
      }
      chick.targetX = Math.max(minX + 2, Math.min(maxX - 2, tx));
      chick.targetY = Math.max(grassMinY, Math.min(maxY - 2, ty));
      chick.visitingPuddle = false;

      // Respect tap-pause if the child just tapped this chick; otherwise stagger parade wave
      const waveStart = now + 180 + idx * 135;
      if (!chick.pauseUntil || chick.pauseUntil < waveStart) {
        chick.pauseUntil = waveStart;
      }
    });
  }

  function meadowTick(now) {
    if (HMC.state.mode !== 'classic' || isSleeping()) {
      stopMeadowLife();
      return;
    }
    if (document.hidden) {
      lastFrameTs = now;
      meadowRafId = requestAnimationFrame(meadowTick);
      return;
    }

    const dt = lastFrameTs ? Math.min(0.05, Math.max(0, (now - lastFrameTs) / 1000)) : 0.016;
    lastFrameTs = now;

    const state = HMC.state;
    const hatched = state.classicItems.filter(i => i.type === 'chick');

    if (hatched.length > 0) {
      const bounds = getClassicBounds(false);
      const { minX, maxX, minY, maxY } = bounds;
      const grassMinY = Math.min(maxY - 6, Math.max(minY + 6, 36));

      // Schedule playful muddy puddle visits
      if (!nextPuddleVisitAt) {
        scheduleNextPuddleVisit(now);
      } else if (now >= nextPuddleVisitAt) {
        scheduleNextPuddleVisit(now);
        const eligible = hatched.filter(c => (
          !c.visitingPuddle &&
          !c.dragging &&
          !c.playingToy &&
          !c.invitedToy &&
          (!c.pauseUntil || now >= c.pauseUntil)
        ));
        if (eligible.length > 0) {
          const duckBuddy = eligible.find(c => c.isRare && c.rareId === 'duck');
          const visitor = (duckBuddy && Math.random() < 0.65)
            ? duckBuddy
            : eligible[Math.floor(Math.random() * eligible.length)];
          const puddleSpot = getPuddleTarget(bounds);
          visitor.targetX = puddleSpot.xPct;
          visitor.targetY = puddleSpot.yPct;
          visitor.visitingPuddle = true;
          visitor.pauseUntil = 0;
        }
      }

      for (let i = 0; i < hatched.length; i++) {
        const item = hatched[i];
        const el = itemNodeMap.get(item.id);
        if (!el) continue;

        if (item.dragging || item.playingToy) {
          if (el._waddleEl && el._waddleEl.classList.contains('waddling')) {
            el._waddleEl.classList.remove('waddling');
          }
          continue;
        }

        if (item.pauseUntil && now < item.pauseUntil) {
          if (el._waddleEl && el._waddleEl.classList.contains('waddling')) {
            el._waddleEl.classList.remove('waddling');
          }
          continue;
        }

        if (item.targetX === null || item.targetX === undefined || item.targetY === null || item.targetY === undefined) {
          const spanX = Math.max(10, maxX - minX - 6);
          const spanY = Math.max(8, maxY - grassMinY - 2);
          const wanderX = Math.max(minX + 3, Math.min(maxX - 3, item.xPct + (Math.random() - 0.5) * 30));
          const wanderY = Math.max(grassMinY, Math.min(maxY - 2, item.yPct + (Math.random() - 0.5) * 18));
          item.targetX = Math.random() < 0.35 ? (minX + 3 + Math.random() * spanX) : wanderX;
          item.targetY = Math.random() < 0.35 ? (grassMinY + Math.random() * spanY) : wanderY;
        }

        const dx = item.targetX - item.xPct;
        const dy = item.targetY - item.yPct;
        const dist = Math.hypot(dx, dy);
        const moveSpeed = item.invitedToy ? Math.max(item.speed || 5.2, 24) : (item.speed || 5.2);
        const step = moveSpeed * dt;

        if (dist <= step + 0.35) {
          item.xPct = Math.max(minX, Math.min(maxX, item.targetX));
          item.yPct = Math.max(minY, Math.min(maxY, item.targetY));
          el.style.left = `${item.xPct.toFixed(2)}%`;
          el.style.top = `${item.yPct.toFixed(2)}%`;
          el.style.zIndex = String(Math.max(15, Math.round(item.yPct * 10)));
          if (el._waddleEl && el._waddleEl.classList.contains('waddling')) {
            el._waddleEl.classList.remove('waddling');
          }

          if (item.invitedToy) {
            const toyId = item.invitedToy;
            item.invitedToy = null;
            item.targetX = null;
            item.targetY = null;
            if (HMC.classicToys && typeof HMC.classicToys.playToyById === 'function') {
              HMC.classicToys.playToyById(toyId, item, el);
            }
          } else if (item.visitingPuddle) {
            item.visitingPuddle = false;
            item.targetX = null;
            item.targetY = null;
            item.pauseUntil = now + 2000;
            triggerPuddleSplashFromChick(el);
          } else {
            item.targetX = null;
            item.targetY = null;
            item.pauseUntil = now + 1300 + Math.random() * 2100;
          }
        } else {
          item.xPct = Math.max(minX, Math.min(maxX, item.xPct + (dx / dist) * step));
          item.yPct = Math.max(minY, Math.min(maxY, item.yPct + (dy / dist) * step));
          if (Math.abs(dx) > 0.35) {
            item.facingRight = dx > 0;
          }
          el.style.left = `${item.xPct.toFixed(2)}%`;
          el.style.top = `${item.yPct.toFixed(2)}%`;
          el.style.zIndex = String(Math.max(15, Math.round(item.yPct * 10)));
          if (el._facingEl) {
            el._facingEl.classList.toggle('flip', !!item.facingRight);
          }
          if (el._waddleEl && !el._waddleEl.classList.contains('waddling')) {
            el._waddleEl.classList.add('waddling');
          }
        }
      }
    }

    meadowRafId = requestAnimationFrame(meadowTick);
  }

  function startMeadowLife() {
    if (HMC.state.mode !== 'classic' || isSleeping()) return;
    rescheduleNormalEggs();
    if (meadowRafId !== null) return;
    lastFrameTs = 0;
    if (!nextPuddleVisitAt) scheduleNextPuddleVisit(nowMs());
    meadowRafId = requestAnimationFrame(meadowTick);
  }

  function detachActiveDragListeners() {
    if (!activeDrag) return;
    window.removeEventListener('pointermove', activeDrag.onMove);
    window.removeEventListener('pointerup', activeDrag.onUp);
    window.removeEventListener('pointercancel', activeDrag.onCancel);
  }

  function cancelActiveDrag(restorePos = true) {
    if (!activeDrag) return;
    const drag = activeDrag;
    detachActiveDragListeners();
    activeDrag = null;

    if (drag.item) {
      drag.item.dragging = false;
      drag.item.pauseUntil = nowMs() + 500;
    }
    if (drag.el) {
      drag.el.classList.remove('is-dragging');
    }
    if (HMC.classicToys && typeof HMC.classicToys.setDragHighlights === 'function') {
      HMC.classicToys.setDragHighlights(false, null);
    }

    if (restorePos && drag.moved && drag.item && drag.el) {
      const { minX, maxX, minY, maxY } = getClassicBounds(true);
      drag.item.xPct = Math.max(minX, Math.min(maxX, drag.item.xPct));
      drag.item.yPct = Math.max(minY, Math.min(maxY, drag.item.yPct));
      drag.el.style.left = `${drag.item.xPct.toFixed(2)}%`;
      drag.el.style.top = `${drag.item.yPct.toFixed(2)}%`;
      drag.el.style.zIndex = String(Math.max(15, Math.round(drag.item.yPct * 10)));
    } else if (drag.item && drag.el) {
      drag.el.style.zIndex = String(Math.max(15, Math.round(drag.item.yPct * 10)));
    }
  }

  function getItemClientCenter(item, el) {
    if (el && typeof el.getBoundingClientRect === 'function') {
      const r = el.getBoundingClientRect();
      if (r && r.width > 0 && r.height > 0) {
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
    }
    const { shellRect } = getClassicBounds(false);
    const sw = shellRect && shellRect.width > 0 ? shellRect.width : (window.innerWidth || 390);
    const sh = shellRect && shellRect.height > 0 ? shellRect.height : (window.innerHeight || 844);
    const left = shellRect ? shellRect.left : 0;
    const top = shellRect ? shellRect.top : 0;
    return {
      x: left + ((item && typeof item.xPct === 'number' ? item.xPct : 50) / 100) * sw,
      y: top + ((item && typeof item.yPct === 'number' ? item.yPct : 50) / 100) * sh
    };
  }

  function cancelEggIncubation(itemId) {
    const entry = eggIncubationTimers.get(itemId);
    if (!entry) return;
    if (entry.wobbleTimer) clearTimeout(entry.wobbleTimer);
    if (entry.hatchTimer) clearTimeout(entry.hatchTimer);
    eggIncubationTimers.delete(itemId);
  }

  function clearAllIncubationTimers() {
    eggIncubationTimers.forEach(entry => {
      if (entry.wobbleTimer) clearTimeout(entry.wobbleTimer);
      if (entry.hatchTimer) clearTimeout(entry.hatchTimer);
    });
    eggIncubationTimers.clear();
  }

  function autoHatchNormalEgg(item) {
    if (!item) return false;
    cancelEggIncubation(item.id);
    if (HMC.state.mode !== 'classic' || isSleeping()) return false;
    if (item.type !== 'egg' || item.isGolden || item.hatched) return false;
    const exists = HMC.state.classicItems.some(i => i.id === item.id);
    if (!exists) return false;

    const { classicFieldEl } = getEls();
    item.type = 'chick';
    item.hatched = true;
    item.justAdded = false;
    initChickMotion(item, 800);

    const existingNode = itemNodeMap.get(item.id);
    if (existingNode) {
      refreshMeadowItemNode(item, existingNode, 'pop-in');
    } else if (classicFieldEl) {
      classicFieldEl.appendChild(buildFreeMeadowItemNode(item));
    }

    const pos = getItemClientCenter(item, itemNodeMap.get(item.id));
    HMC.audio.SFX.cheep();
    HMC.effects.spawnFloatingWord('🐣 孵出来啦！', pos.x, pos.y - 22, '#F59F00');
    updateClassicCounts();
    startMeadowLife();
    return true;
  }

  function scheduleNormalEggAutoHatch(item) {
    if (!item || item.type !== 'egg' || item.isGolden || item.hatched) return;
    cancelEggIncubation(item.id);

    const entry = { wobbleTimer: null, hatchTimer: null };
    entry.wobbleTimer = setTimeout(() => {
      entry.wobbleTimer = null;
      if (HMC.state.mode !== 'classic' || isSleeping()) return;
      if (item.type !== 'egg' || item.isGolden || item.hatched) return;
      if (!HMC.state.classicItems.some(i => i.id === item.id)) return;
      const node = itemNodeMap.get(item.id);
      if (node && node._innerEl) {
        node._innerEl.classList.remove('pop-in', 'hop', 'egg-shake');
        node._innerEl.classList.add('egg-incubating');
      }
      HMC.audio.SFX.crack();
    }, 1600);

    entry.hatchTimer = setTimeout(() => {
      entry.hatchTimer = null;
      autoHatchNormalEgg(item);
    }, 2800);

    eggIncubationTimers.set(item.id, entry);
  }

  function rescheduleNormalEggs() {
    if (HMC.state.mode !== 'classic' || isSleeping()) return;
    HMC.state.classicItems.forEach(item => {
      if (item.type === 'egg' && !item.isGolden && !item.hatched && !eggIncubationTimers.has(item.id)) {
        scheduleNormalEggAutoHatch(item);
      }
    });
  }

  function getUncrackedGoldenEggs() {
    return HMC.state.classicItems.filter(i => i.type === 'egg' && i.isGolden && !i.hatched);
  }

  function clearHammerHint() {
    if (hammerHintTimer !== null) {
      clearTimeout(hammerHintTimer);
      hammerHintTimer = null;
    }
    const hammerFab = document.getElementById('hammerFab');
    if (hammerFab) hammerFab.classList.remove('hammer-hint');
  }

  function pulseHammerHint(ms = 2200) {
    clearHammerHint();
    const hammerFab = document.getElementById('hammerFab');
    if (!hammerFab) return;
    hammerFab.classList.add('hammer-hint');
    hammerHintTimer = setTimeout(() => {
      hammerHintTimer = null;
      const btn = document.getElementById('hammerFab');
      if (btn) btn.classList.remove('hammer-hint');
    }, ms);
  }

  function setHammerHoverTarget(targetItemId) {
    itemNodeMap.forEach((el, id) => {
      if (el) el.classList.toggle('hammer-target-hot', targetItemId !== null && id === targetItemId);
    });
  }

  function setHammerMode(active, announce = false) {
    const goldenCount = getUncrackedGoldenEggs().length;
    const next = !!active && goldenCount > 0;
    hammerActive = next;
    if (next) clearHammerHint();

    const { classicFieldEl } = getEls();
    if (classicFieldEl) {
      classicFieldEl.classList.toggle('hammer-mode', next);
    }
    const hammerFab = document.getElementById('hammerFab');
    if (hammerFab) {
      hammerFab.classList.toggle('active', next);
      hammerFab.classList.toggle('hammer-ready', goldenCount > 0 && !next);
      hammerFab.setAttribute('aria-pressed', next ? 'true' : 'false');
    }

    if (announce && next) {
      HMC.audio.setPrompt(
        '🔨 小锤子拿好啦！点一下彩虹金蛋砸开它吧！',
        '🔨 Toy hammer ready! Tap the rainbow golden egg to crack it open!'
      );
    }
    return next;
  }

  function detachActiveHammerDragListeners() {
    if (!activeHammerDrag) return;
    window.removeEventListener('pointermove', activeHammerDrag.onMove);
    window.removeEventListener('pointerup', activeHammerDrag.onUp);
    window.removeEventListener('pointercancel', activeHammerDrag.onCancel);
  }

  function cancelActiveHammerDrag() {
    if (!activeHammerDrag) return;
    const drag = activeHammerDrag;
    detachActiveHammerDragListeners();
    activeHammerDrag = null;
    if (drag.ghostEl && drag.ghostEl.parentNode) {
      drag.ghostEl.remove();
    }
    setHammerHoverTarget(null);
  }

  function findGoldenEggNear(clientX, clientY, radiusPx = 58) {
    if (typeof clientX !== 'number' || typeof clientY !== 'number') return null;
    const goldenEggs = getUncrackedGoldenEggs();
    let bestItem = null;
    let bestDist = Infinity;

    for (let i = 0; i < goldenEggs.length; i++) {
      const item = goldenEggs[i];
      const node = itemNodeMap.get(item.id);
      const center = getItemClientCenter(item, node);
      const dPointer = Math.hypot(clientX - center.x, clientY - center.y);
      const dVisual = Math.hypot(clientX - center.x, (clientY - 28) - center.y);
      const d = Math.min(dPointer, dVisual);
      if (d <= radiusPx && d < bestDist) {
        bestDist = d;
        bestItem = item;
      }
    }
    return bestItem;
  }

  function stopMeadowLife() {
    clearAllIncubationTimers();
    cancelActiveDrag(true);
    cancelActiveHammerDrag();
    clearHammerHint();
    setHammerMode(false, false);
    if (HMC.classicToys && typeof HMC.classicToys.cancelAllAnimations === 'function') {
      HMC.classicToys.cancelAllAnimations();
    }
    if (meadowRafId !== null) {
      cancelAnimationFrame(meadowRafId);
      meadowRafId = null;
    }
    lastFrameTs = 0;
    itemNodeMap.forEach(el => {
      if (el && el._waddleEl) el._waddleEl.classList.remove('waddling');
    });
  }

  function onWeatherChange() {
    if (HMC.state.weather === 'rain') {
      const now = performance.now();
      const soon = now + 2200 + Math.random() * 1800;
      if (!nextPuddleVisitAt || nextPuddleVisitAt > soon) {
        nextPuddleVisitAt = soon;
      }
    }
  }

  function updateClassicCounts() {
    const eggsCount = HMC.state.classicItems.filter(i => i.type === 'egg').length;
    const chicksCount = HMC.state.classicItems.filter(i => i.type === 'chick').length;
    const goldenCount = getUncrackedGoldenEggs().length;
    const eggCountEl = document.getElementById('classicEggCount');
    const chickCountEl = document.getElementById('classicChickCount');
    const hammerFab = document.getElementById('hammerFab');

    if (eggCountEl) eggCountEl.textContent = `🥚 ${eggsCount}`;
    if (chickCountEl) chickCountEl.textContent = `🐣 ${chicksCount}`;

    if (goldenCount === 0 && hammerActive) {
      setHammerMode(false, false);
    } else if (hammerFab) {
      hammerFab.classList.toggle('hammer-ready', goldenCount > 0 && !hammerActive);
      hammerFab.classList.toggle('active', !!hammerActive);
      hammerFab.setAttribute('aria-pressed', hammerActive ? 'true' : 'false');
    }
  }

  function ensureFreeChickenNode() {
    const { classicFieldEl } = getEls();
    const state = HMC.state;
    let wrap = document.getElementById('freeChickenWrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'freeChickenWrap';
      wrap.className = 'free-chicken-wrap';
      wrap.innerHTML = `
        <div class="chicken-facing" id="freeChickenFacing">
          <div class="chicken-actor idle" id="classicChicken" title="点一点快乐小鸡下蛋！">
            ${HMC.svg.renderChickenSVG(136)}
          </div>
        </div>
      `;
      wrap.addEventListener('click', (e) => {
        e.stopPropagation();
        if (hammerActive) {
          HMC.audio.SFX.boing();
          HMC.effects.spawnFloatingWord('咚！去敲发光的彩虹金蛋吧 🔨', e.clientX, e.clientY - 20, '#FF922B');
          HMC.audio.setPrompt(
            '🔨 小锤子拿在手里呢！去点发光的彩虹金蛋，或再点右下角 🔨 放下小锤子！',
            '🔨 Tap the glowing rainbow golden egg, or tap 🔨 again to put the hammer down!'
          );
          return;
        }
        const { shellRect } = getClassicBounds();
        const cx = shellRect.left + (state.chickenX / 100) * shellRect.width;
        const cy = shellRect.top + (state.chickenY / 100) * shellRect.height;
        layClassicEggAt(cx, cy);
      });
      classicFieldEl.appendChild(wrap);
    }
    wrap.style.left = `${state.chickenX}%`;
    wrap.style.top = `${state.chickenY}%`;
    wrap.style.zIndex = String(Math.max(20, Math.round(state.chickenY * 10) + 15));
    const facing = document.getElementById('freeChickenFacing');
    if (facing) facing.classList.toggle('flip', state.chickenFlip);
    return wrap;
  }

  function getItemVisualParts(item) {
    if (item.type === 'egg') {
      if (item.isGolden) {
        return {
          svgHtml: HMC.svg.renderGoldenEggSVG({ size: 78, cracks: item.cracks || 0 }),
          tagText: '🔨 敲一敲',
          tagClass: 'item-num-tag golden-tag',
          shimmer: true
        };
      }
      return {
        svgHtml: HMC.svg.renderEggSVG({ size: 68, base: item.palette.base, spot: item.palette.spot }),
        tagText: String(item.num),
        tagClass: 'item-num-tag',
        shimmer: false
      };
    }

    if (item.isRare) {
      const buddy = (HMC.data.RARE_BUDDY_BY_ID && HMC.data.RARE_BUDDY_BY_ID[item.rareId]) || HMC.data.RARE_BUDDIES[0];
      const isEn = HMC.state && HMC.state.lang === 'en';
      return {
        svgHtml: HMC.svg.renderRareBuddySVG({ size: 88, buddyId: buddy.id }),
        tagText: isEn ? buddy.en : (buddy.shortZh || buddy.zh),
        tagClass: 'item-num-tag rare-tag',
        shimmer: false
      };
    }

    return {
      svgHtml: HMC.svg.renderChickSVG({ size: 80, bodyColor: item.chickColor, accessory: item.accessory }),
      tagText: String(item.num),
      tagClass: 'item-num-tag',
      shimmer: false
    };
  }

  function showRareIntroBubble(el, buddy, durationMs = 2800) {
    if (!el || !buddy) return;
    if (el._introTimer) {
      clearTimeout(el._introTimer);
      el._introTimer = null;
    }
    if (el._introFadeTimer) {
      clearTimeout(el._introFadeTimer);
      el._introFadeTimer = null;
    }
    let bubble = el.querySelector('.rare-intro-bubble');
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.className = 'rare-intro-bubble';
      el.appendChild(bubble);
    }
    const isEn = HMC.state && HMC.state.lang === 'en';
    bubble.textContent = isEn ? `Hi! I'm ${buddy.en}!` : `我是${buddy.zh}！`;
    bubble.classList.remove('fade-out');
    void bubble.offsetWidth;

    el._introTimer = setTimeout(() => {
      el._introTimer = null;
      if (bubble && bubble.parentNode) {
        bubble.classList.add('fade-out');
        el._introFadeTimer = setTimeout(() => {
          el._introFadeTimer = null;
          if (bubble && bubble.parentNode) bubble.remove();
        }, 360);
      }
    }, Math.max(900, durationMs));
  }

  function refreshMeadowItemNode(item, el, animClass = '') {
    if (!el) return;
    const parts = getItemVisualParts(item);
    el.classList.toggle('is-chick', item.type === 'chick');
    el.classList.toggle('is-golden-egg', item.type === 'egg' && !!item.isGolden);
    if (item.type !== 'egg' || !item.isGolden) {
      el.classList.remove('hammer-target-hot');
    }
    if (el._waddleEl) {
      el._waddleEl.innerHTML = parts.svgHtml;
      el._waddleEl.classList.remove('waddling');
    }
    if (el._tagEl) {
      el._tagEl.className = parts.tagClass;
      el._tagEl.textContent = parts.tagText;
    }
    if (el._facingEl) {
      el._facingEl.classList.toggle('flip', item.type === 'chick' && !!item.facingRight);
    }
    if (el._innerEl) {
      el._innerEl.classList.remove('egg-incubating');
      el._innerEl.classList.toggle('golden-shimmer', parts.shimmer);
      if (animClass) {
        el._innerEl.classList.remove('pop-in', 'hop', 'egg-shake');
        void el._innerEl.offsetWidth;
        el._innerEl.classList.add(animClass);
      }
    }
  }

  function bounceGoldenEggBareHand(item, el, clientX, clientY) {
    if (!item || item.type !== 'egg' || !item.isGolden || item.hatched) return false;
    const node = el || itemNodeMap.get(item.id);
    const fallbackPos = getItemClientCenter(item, node);
    const x = typeof clientX === 'number' && clientX > 0 ? clientX : fallbackPos.x;
    const y = typeof clientY === 'number' && clientY > 0 ? clientY : fallbackPos.y;

    if (node && node._innerEl) {
      node._innerEl.classList.remove('pop-in', 'hop', 'egg-shake');
      void node._innerEl.offsetWidth;
      node._innerEl.classList.add('egg-shake');
    }

    HMC.audio.SFX.hardKnock();
    HMC.effects.spawnFloatingWord('硬邦邦！用小锤子砸开 🔨', x, y - 24, '#F59F00');
    HMC.audio.setPrompt(
      '这颗彩虹金蛋硬邦邦的！抓起或点一下右下角的 🔨 小锤子砸开它吧！',
      'This rainbow golden egg is super hard! Grab or tap the 🔨 toy hammer to crack it open!'
    );
    pulseHammerHint(2200);
    return true;
  }

  function strikeGoldenEgg(item, clientX, clientY) {
    if (!item || item.type !== 'egg' || !item.isGolden || item.hatched) return false;
    const { classicFieldEl } = getEls();
    const el = itemNodeMap.get(item.id) || (classicFieldEl && classicFieldEl.querySelector(`.free-meadow-item[data-item-id="${item.id}"]`));
    const fallbackPos = getItemClientCenter(item, el);
    const x = typeof clientX === 'number' && clientX > 0 ? clientX : fallbackPos.x;
    const y = typeof clientY === 'number' && clientY > 0 ? clientY : fallbackPos.y;

    if (HMC.classicToys && typeof HMC.classicToys.playHammerStrikeAt === 'function') {
      HMC.classicToys.playHammerStrikeAt(x, y);
    }
    HMC.audio.SFX.hammer();
    HMC.audio.SFX.crack();

    // 1 hammer whack -> Rare Buddy Hatches immediately from the 24-buddy blind box!
    item.type = 'chick';
    item.hatched = true;
    item.isRare = true;
    item.cracks = 2;
    item.tapsLeft = 0;
    initChickMotion(item, 950);

    const buddy = (HMC.data.RARE_BUDDY_BY_ID && HMC.data.RARE_BUDDY_BY_ID[item.rareId]) || HMC.data.RARE_BUDDIES[0];
    refreshMeadowItemNode(item, el, 'pop-in');
    showRareIntroBubble(el, buddy, 3200);

    HMC.audio.SFX.fanfare();
    HMC.effects.burstConfetti(42);
    if (HMC.storage && HMC.storage.unlockRareBuddy) {
      HMC.storage.unlockRareBuddy(buddy.id);
    }
    HMC.effects.awardStar();
    HMC.effects.spawnFloatingWord(`${buddy.icon} ${buddy.zh}！`, x, y - 24, buddy.color);
    HMC.audio.setPrompt(buddy.praiseZh, buddy.praiseEn);

    updateClassicCounts();
    startMeadowLife();
    return true;
  }

  function handleHammerFabTap(clientX, clientY) {
    if (HMC.state.mode !== 'classic' || isSleeping()) return;
    const hammerFab = document.getElementById('hammerFab');
    const r = hammerFab && typeof hammerFab.getBoundingClientRect === 'function'
      ? hammerFab.getBoundingClientRect()
      : null;
    const fx = (typeof clientX === 'number' && clientX > 0)
      ? clientX
      : (r && r.width > 0 ? r.left + r.width / 2 : (window.innerWidth || 390) - 42);
    const fy = (typeof clientY === 'number' && clientY > 0)
      ? clientY
      : (r && r.height > 0 ? r.top + r.height / 2 : (window.innerHeight || 844) - 180);

    const goldenEggs = getUncrackedGoldenEggs();
    if (goldenEggs.length === 0) {
      setHammerMode(false, false);
      HMC.audio.SFX.hammer();
      HMC.effects.spawnFloatingWord('咚咚！等下出彩虹金蛋再用小锤子砸开哦！', fx - 72, fy - 28, '#FF922B');
      HMC.audio.setPrompt(
        '等快乐小鸡下出闪亮的彩虹金蛋，再用小锤子砸开它吧！',
        'Wait for a sparkling rainbow golden egg, then crack it open with the toy hammer!'
      );
      return;
    }

    if (!hammerActive) {
      HMC.audio.SFX.pop();
      setHammerMode(true, true);
      HMC.effects.spawnFloatingWord('🔨 拿好小锤子啦！', fx - 44, fy - 24, '#FF5C8D');
    } else {
      HMC.audio.SFX.pop();
      setHammerMode(false, false);
      HMC.effects.spawnFloatingWord('放下小锤子啦！', fx - 44, fy - 24, '#5C4332');
      HMC.audio.setPrompt('小锤子收好啦！点草地任意地方继续下蛋哦！', 'Hammer put away! Tap anywhere on the grass to lay an egg!');
    }
  }

  function startHammerFabPointerSession(e) {
    if (HMC.state.mode !== 'classic' || isSleeping()) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (activeHammerDrag || activeDrag) return;

    e.stopPropagation();

    const pointerId = e.pointerId;
    const drag = {
      pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false,
      ghostEl: null,
      hoveredGoldenId: null,
      onMove: null,
      onUp: null,
      onCancel: null
    };

    const matchesPointer = (ev) => (
      pointerId === undefined || ev.pointerId === undefined || ev.pointerId === pointerId
    );

    const onMove = (ev) => {
      if (!activeHammerDrag || activeHammerDrag !== drag || !matchesPointer(ev)) return;

      const dist = Math.hypot(ev.clientX - drag.startClientX, ev.clientY - drag.startClientY);
      if (!drag.moved) {
        if (dist < 8) return;
        drag.moved = true;
        clearHammerHint();
        const ghost = document.createElement('div');
        ghost.className = 'floating-hammer-tool';
        ghost.setAttribute('aria-hidden', 'true');
        ghost.innerHTML = (HMC.classicToys && typeof HMC.classicToys.renderToyHammerSVG === 'function')
          ? HMC.classicToys.renderToyHammerSVG(74)
          : '🔨';
        const host = document.getElementById('fxLayer') || document.body;
        host.appendChild(ghost);
        drag.ghostEl = ghost;
        HMC.audio.SFX.pop();
      }

      if (ev.cancelable) ev.preventDefault();

      if (drag.ghostEl) {
        drag.ghostEl.style.transform = `translate3d(${ev.clientX}px, ${ev.clientY - 28}px, 0)`;
      }

      const hit = findGoldenEggNear(ev.clientX, ev.clientY, 58);
      drag.hoveredGoldenId = hit ? hit.id : null;
      if (drag.ghostEl) {
        drag.ghostEl.classList.toggle('over-target', !!hit);
      }
      setHammerHoverTarget(drag.hoveredGoldenId);
    };

    const onUp = (ev) => {
      if (!activeHammerDrag || activeHammerDrag !== drag || !matchesPointer(ev)) return;
      detachActiveHammerDragListeners();
      activeHammerDrag = null;
      if (drag.ghostEl && drag.ghostEl.parentNode) {
        drag.ghostEl.remove();
      }
      setHammerHoverTarget(null);
      suppressNextHammerClickUntil = nowMs() + 380;

      if (!drag.moved) {
        handleHammerFabTap(ev.clientX, ev.clientY);
        return;
      }

      justUsedHammerUntil = nowMs() + 420;
      const hit = findGoldenEggNear(ev.clientX, ev.clientY, 58);
      if (hit) {
        const hitNode = itemNodeMap.get(hit.id);
        const center = getItemClientCenter(hit, hitNode);
        strikeGoldenEgg(hit, center.x, center.y);
        if (hit.tapsLeft > 0) {
          setHammerMode(true, false);
        }
        return;
      }

      HMC.audio.SFX.boing();
      HMC.effects.spawnFloatingWord('咚！拖到彩虹金蛋上砸一砸！', ev.clientX, ev.clientY - 24, '#FF922B');
      if (getUncrackedGoldenEggs().length === 0) {
        HMC.audio.setPrompt(
          '等快乐小鸡下出闪亮的彩虹金蛋，再用小锤子砸开它吧！',
          'Wait for a sparkling rainbow golden egg, then crack it open with the toy hammer!'
        );
      } else {
        HMC.audio.setPrompt(
          '拖到发光的彩虹金蛋上砸一砸，或者点一下右下角 🔨 小锤子再敲金蛋吧！',
          'Drop the hammer onto a rainbow golden egg, or tap 🔨 then tap the egg!'
        );
      }
    };

    const onCancel = (ev) => {
      if (!activeHammerDrag || activeHammerDrag !== drag || !matchesPointer(ev)) return;
      justUsedHammerUntil = nowMs() + 260;
      cancelActiveHammerDrag();
    };

    drag.onMove = onMove;
    drag.onUp = onUp;
    drag.onCancel = onCancel;
    activeHammerDrag = drag;

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  }

  function handleChickTap(cur, el, clientX, clientY) {
    if (!cur || cur.type !== 'chick' || cur.playingToy) return;
    // Hatched chick or rare buddy tapped -> pause so toddler can enjoy & giggle!
    cur.pauseUntil = nowMs() + 2200;
    cur.visitingPuddle = false;
    cur.invitedToy = null;
    if (el && el._waddleEl) el._waddleEl.classList.remove('waddling');
    if (el && el._innerEl) {
      el._innerEl.classList.remove('hop', 'pop-in', 'egg-shake');
      void el._innerEl.offsetWidth;
      el._innerEl.classList.add('hop');
    }

    if (cur.isRare) {
      const buddy = (HMC.data.RARE_BUDDY_BY_ID && HMC.data.RARE_BUDDY_BY_ID[cur.rareId]) || HMC.data.RARE_BUDDIES[0];
      if (buddy.id === 'duck' || buddy.id === 'mermaid') HMC.audio.SFX.splash();
      else if (buddy.category === 'magic' || buddy.id === 'wizard' || buddy.id === 'rainbow') HMC.audio.SFX.magic();
      else HMC.audio.SFX.success();
      showRareIntroBubble(el, buddy, 2600);
      HMC.audio.speak(buddy.praiseZh, buddy.praiseEn);
    } else {
      HMC.audio.SFX.cheep();
      HMC.effects.spawnFloatingWord(`叽叽！${cur.num}`, clientX, clientY - 14, '#F59F00');
      HMC.audio.speak(`第${cur.num}只小鸡，叽叽叽！`, `Chick number ${cur.num}! Cheep cheep!`);
    }
  }

  function startChickPointerSession(e, item, el) {
    const state = HMC.state;
    if (state.mode !== 'classic' || isSleeping()) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (activeDrag) return;

    const idx = state.classicItems.findIndex(x => x.id === item.id);
    if (idx === -1) return;
    const cur = state.classicItems[idx];
    if (cur.type !== 'chick' || cur.playingToy) return;

    e.stopPropagation();

    const pointerId = e.pointerId;
    const drag = {
      itemId: cur.id,
      item: cur,
      el,
      pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      lastClientX: e.clientX,
      lastClientY: e.clientY,
      moved: false,
      hoveredToy: null,
      onMove: null,
      onUp: null,
      onCancel: null
    };

    const matchesPointer = (ev) => (
      pointerId === undefined || ev.pointerId === undefined || ev.pointerId === pointerId
    );

    const onMove = (ev) => {
      if (!activeDrag || activeDrag !== drag || !matchesPointer(ev)) return;

      const dist = Math.hypot(ev.clientX - drag.startClientX, ev.clientY - drag.startClientY);
      if (!drag.moved) {
        if (dist < 8) return;
        drag.moved = true;
        cur.dragging = true;
        cur.visitingPuddle = false;
        cur.invitedToy = null;
        cur.targetX = null;
        cur.targetY = null;
        if (el._waddleEl) el._waddleEl.classList.remove('waddling');
        el.classList.add('is-dragging');
        HMC.audio.SFX.pop();
        if (cur.isRare) {
          const buddy = (HMC.data.RARE_BUDDY_BY_ID && HMC.data.RARE_BUDDY_BY_ID[cur.rareId]) || HMC.data.RARE_BUDDIES[0];
          showRareIntroBubble(el, buddy, 1900);
        } else {
          HMC.effects.spawnFloatingWord('抓到我啦！', ev.clientX, ev.clientY - 34, '#FF6B9D');
        }
      }

      if (ev.cancelable) ev.preventDefault();

      const { shellRect } = getClassicBounds(false);
      const sw = shellRect.width > 0 ? shellRect.width : (window.innerWidth || 390);
      const sh = shellRect.height > 0 ? shellRect.height : (window.innerHeight || 844);
      const xPct = Math.max(4, Math.min(96, ((ev.clientX - shellRect.left) / sw) * 100));
      const yPct = Math.max(8, Math.min(96, ((ev.clientY - shellRect.top) / sh) * 100));

      const dxClient = ev.clientX - drag.lastClientX;
      if (Math.abs(dxClient) > 2) {
        cur.facingRight = dxClient > 0;
        if (el._facingEl) el._facingEl.classList.toggle('flip', !!cur.facingRight);
      }
      drag.lastClientX = ev.clientX;
      drag.lastClientY = ev.clientY;

      cur.xPct = xPct;
      cur.yPct = yPct;
      el.style.left = `${xPct.toFixed(2)}%`;
      el.style.top = `${yPct.toFixed(2)}%`;

      const hovered = (HMC.classicToys && typeof HMC.classicToys.findDropTarget === 'function')
        ? HMC.classicToys.findDropTarget(ev.clientX, ev.clientY)
        : null;
      drag.hoveredToy = hovered;
      if (HMC.classicToys && typeof HMC.classicToys.setDragHighlights === 'function') {
        HMC.classicToys.setDragHighlights(true, hovered);
      }
    };

    const onUp = (ev) => {
      if (!activeDrag || activeDrag !== drag || !matchesPointer(ev)) return;
      detachActiveDragListeners();
      activeDrag = null;

      if (!drag.moved) {
        // Movement < 8px -> preserve classic cheerful tap behavior!
        suppressNextClickItemId = cur.id;
        suppressNextClickUntil = nowMs() + 360;
        handleChickTap(cur, el, ev.clientX, ev.clientY);
        return;
      }

      cur.dragging = false;
      el.classList.remove('is-dragging');
      justDraggedChickUntil = nowMs() + 420;
      suppressNextClickItemId = cur.id;
      suppressNextClickUntil = nowMs() + 420;
      if (HMC.classicToys && typeof HMC.classicToys.markJustDropped === 'function') {
        HMC.classicToys.markJustDropped(420);
      }

      const dropToy = (HMC.classicToys && typeof HMC.classicToys.findDropTarget === 'function')
        ? HMC.classicToys.findDropTarget(ev.clientX, ev.clientY)
        : null;
      if (HMC.classicToys && typeof HMC.classicToys.setDragHighlights === 'function') {
        HMC.classicToys.setDragHighlights(false, null);
      }

      if (dropToy && HMC.classicToys && typeof HMC.classicToys.playToyById === 'function') {
        HMC.classicToys.playToyById(dropToy, cur, el);
        return;
      }

      // Open grass drop -> gently settle chick & resume waddling!
      const { minX, maxX, minY, maxY } = getClassicBounds(true);
      cur.xPct = Math.max(minX, Math.min(maxX, cur.xPct));
      cur.yPct = Math.max(minY, Math.min(maxY, cur.yPct));
      el.style.left = `${cur.xPct.toFixed(2)}%`;
      el.style.top = `${cur.yPct.toFixed(2)}%`;
      el.style.zIndex = String(Math.max(15, Math.round(cur.yPct * 10)));

      if (el._innerEl) {
        el._innerEl.classList.remove('hop', 'pop-in', 'egg-shake');
        void el._innerEl.offsetWidth;
        el._innerEl.classList.add('hop');
      }
      HMC.audio.SFX.pop();

      const spanX = Math.max(8, (maxX - minX) * 0.16);
      const spanY = Math.max(6, (maxY - minY) * 0.12);
      cur.targetX = Math.max(minX + 2, Math.min(maxX - 2, cur.xPct + (Math.random() - 0.5) * spanX));
      cur.targetY = Math.max(minY + 6, Math.min(maxY - 2, cur.yPct + (Math.random() - 0.5) * spanY));
      cur.pauseUntil = nowMs() + 850;
      startMeadowLife();
    };

    const onCancel = (ev) => {
      if (!activeDrag || activeDrag !== drag || !matchesPointer(ev)) return;
      justDraggedChickUntil = nowMs() + 260;
      cancelActiveDrag(true);
    };

    drag.onMove = onMove;
    drag.onUp = onUp;
    drag.onCancel = onCancel;
    activeDrag = drag;

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  }

  function buildFreeMeadowItemNode(item) {
    const state = HMC.state;
    const parts = getItemVisualParts(item);
    const el = document.createElement('div');
    el.className = 'free-meadow-item'
      + (item.type === 'chick' ? ' is-chick' : '')
      + (item.type === 'egg' && item.isGolden ? ' is-golden-egg' : '');
    el.dataset.itemId = String(item.id);
    el.style.left = `${item.xPct}%`;
    el.style.top = `${item.yPct}%`;
    el.style.zIndex = String(Math.max(15, Math.round(item.yPct * 10)));

    const innerClasses = ['meadow-item-inner'];
    if (item.justAdded) innerClasses.push('pop-in');
    if (parts.shimmer) innerClasses.push('golden-shimmer');

    el.innerHTML = `
      <div class="${innerClasses.join(' ')}">
        <div class="meadow-sprite-wrap">
          <div class="chick-facing${item.type === 'chick' && item.facingRight ? ' flip' : ''}">
            <div class="chick-waddle">
              ${parts.svgHtml}
            </div>
          </div>
        </div>
        <div class="${parts.tagClass}">${parts.tagText}</div>
      </div>
    `;
    item.justAdded = false;

    el._innerEl = el.querySelector('.meadow-item-inner');
    el._facingEl = el.querySelector('.chick-facing');
    el._waddleEl = el.querySelector('.chick-waddle');
    el._tagEl = el.querySelector('.item-num-tag');

    el.addEventListener('pointerdown', (e) => {
      startChickPointerSession(e, item, el);
    });

    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const idx = state.classicItems.findIndex(x => x.id === item.id);
      if (idx === -1) return;
      const cur = state.classicItems[idx];

      if (cur.type === 'egg') {
        if (cur.isGolden) {
          if (hammerActive) {
            strikeGoldenEgg(cur, ev.clientX, ev.clientY);
          } else {
            bounceGoldenEggBareHand(cur, el, ev.clientX, ev.clientY);
          }
        } else {
          hatchSingleClassicEgg(idx, ev.clientX, ev.clientY);
        }
        return;
      }

      if (cur.id === suppressNextClickItemId && nowMs() < suppressNextClickUntil) {
        suppressNextClickItemId = null;
        return;
      }
      if (cur.dragging || cur.playingToy) return;
      handleChickTap(cur, el, ev.clientX, ev.clientY);
    });

    itemNodeMap.set(item.id, el);
    return el;
  }

  function syncClassicFieldDOM() {
    const { classicFieldEl } = getEls();
    classicFieldEl.classList.remove('hidden');
    itemNodeMap.clear();
    classicFieldEl.querySelectorAll('.free-meadow-item').forEach(n => n.remove());
    ensureFreeChickenNode();
    HMC.state.classicItems.forEach(item => {
      if (item.type === 'chick' && !item.speed) initChickMotion(item, 400);
      classicFieldEl.appendChild(buildFreeMeadowItemNode(item));
    });
    updateClassicCounts();
  }

  function renderClassicMode(announce = true) {
    const { stageEl, classicMiniCountsEl, classicFabsEl } = getEls();
    HMC.effects.clearSubModeDock();
    stageEl.innerHTML = '';
    stageEl.classList.add('empty');
    classicMiniCountsEl.classList.remove('hidden');
    classicFabsEl.classList.remove('hidden');
    syncClassicFieldDOM();
    rescheduleNormalEggs();
    startMeadowLife();
    if (announce) {
      HMC.audio.setPrompt('点草地任意地方，快乐小鸡就跑过去下蛋哦！', 'Tap anywhere on the grass to lay an egg!');
    }
  }

  function spawnTapRipple(xPct, yPct) {
    const { classicFieldEl } = getEls();
    const rip = document.createElement('div');
    rip.className = 'tap-ripple';
    rip.style.left = `${xPct}%`;
    rip.style.top = `${yPct}%`;
    classicFieldEl.appendChild(rip);
    setTimeout(() => rip.remove(), 600);
  }

  function layClassicEggRandom() {
    const { shellRect } = getClassicBounds();
    const spot = pickRandomGrassSpot();
    layClassicEggAt(
      shellRect.left + (spot.xPct / 100) * shellRect.width,
      shellRect.top + (spot.yPct / 100) * shellRect.height
    );
  }

  function layClassicEggAt(clientX, clientY) {
    const state = HMC.state;
    const { MAX_CLASSIC_ITEMS, EGG_PALETTES, ACCESSORIES, CHICK_COLORS } = HMC.data;
    const { classicFieldEl } = getEls();

    if (state.mode !== 'classic') return;
    const now = Date.now();
    if (now - state.lastLayTs < 240) return;
    state.lastLayTs = now;

    const bounds = getClassicBounds();
    const { shellRect, minX, maxX, minY, maxY } = bounds;
    let xPct = ((clientX - shellRect.left) / shellRect.width) * 100;
    let yPct = ((clientY - shellRect.top) / shellRect.height) * 100;
    xPct = Math.max(minX, Math.min(maxX, xPct));
    yPct = Math.max(minY, Math.min(maxY, yPct));

    if (state.classicItems.length >= MAX_CLASSIC_ITEMS) {
      clearAllIncubationTimers();
      cancelActiveDrag(false);
      cancelActiveHammerDrag();
      clearHammerHint();
      setHammerMode(false, false);
      if (HMC.classicToys && typeof HMC.classicToys.cancelAllAnimations === 'function') {
        HMC.classicToys.cancelAllAnimations();
      }
      HMC.audio.SFX.fanfare();
      HMC.effects.burstConfetti(36);
      HMC.effects.spawnFloatingWord(`🎉 哇！${MAX_CLASSIC_ITEMS}个满啦！`, clientX, clientY - 20, '#FF6B6B');
      HMC.audio.speak(`哇，草地上已经摆满${MAX_CLASSIC_ITEMS}个啦！我们收进篮子重新玩吧！`, `Wow, ${MAX_CLASSIC_ITEMS}! Let us start a fresh meadow!`);
      state.classicItems = [];
      syncClassicFieldDOM();
      return;
    }

    state.classicLayCount = (state.classicLayCount || 0) + 1;
    const num = state.classicItems.length + 1;
    const palette = EGG_PALETTES[(num - 1) % EGG_PALETTES.length];
    const accessory = ACCESSORIES[(num - 1) % ACCESSORIES.length];

    const hasUnhatchedGolden = state.classicItems.some(i => i.type === 'egg' && i.isGolden);
    const isGolden = (state.classicLayCount % 4 === 0) ||
      (state.classicLayCount >= 3 && !hasUnhatchedGolden && Math.random() < 0.2);

    const newItem = {
      id: nextItemSeq++,
      type: 'egg',
      num,
      palette,
      accessory,
      chickColor: CHICK_COLORS[(num - 1) % CHICK_COLORS.length],
      xPct,
      yPct,
      justAdded: true,
      hatched: false,
      isGolden
    };

    if (isGolden) {
      newItem.tapsLeft = 1;
      newItem.cracks = 0;
      newItem.rareId = pickRareBuddyId();
    }

    state.classicItems.push(newItem);

    const sideStepPct = (xPct > maxX - 10 ? -8.5 : (xPct < minX + 10 ? 8.5 : (xPct >= state.chickenX ? -7.5 : 7.5)));
    const nextChickenX = Math.max(minX, Math.min(maxX, xPct + sideStepPct));
    const nextChickenY = Math.max(minY, Math.min(maxY, yPct - 2.5));
    if (Math.abs(nextChickenX - state.chickenX) > 1.5) {
      state.chickenFlip = nextChickenX > state.chickenX;
    }
    state.chickenX = nextChickenX;
    state.chickenY = nextChickenY;

    spawnTapRipple(xPct, yPct);
    ensureFreeChickenNode();
    assignParadeTargets(bounds);

    const actor = document.getElementById('classicChicken');
    if (actor) {
      actor.classList.remove('idle', 'lay');
      void actor.offsetWidth;
      actor.classList.add('lay');
      setTimeout(() => {
        actor.classList.remove('lay');
        actor.classList.add('idle');
      }, 600);
    }

    classicFieldEl.appendChild(buildFreeMeadowItemNode(newItem));
    if (!isGolden) {
      scheduleNormalEggAutoHatch(newItem);
    }
    updateClassicCounts();
    startMeadowLife();

    const fxX = shellRect.left + (xPct / 100) * shellRect.width;
    const fxY = shellRect.top + (yPct / 100) * shellRect.height;

    if (isGolden) {
      HMC.audio.SFX.magic();
      HMC.effects.spawnFloatingWord('🌈 彩虹金蛋！', fxX, fxY - 34, '#F59F00');
      if (num === 5 || num === 10 || num === 15) {
        HMC.effects.burstConfetti(30);
        HMC.effects.awardStar();
      }
      HMC.audio.setPrompt(
        '哇！下了一颗闪闪发光的彩虹金蛋！用右下角的 🔨 小锤子砸一下看看里面是谁！',
        'Wow! A rainbow golden egg! Crack it open with the 🔨 toy hammer!'
      );
    } else {
      const hasParentLay = !!(HMC.storage && HMC.storage.hasVoiceClip && HMC.storage.hasVoiceClip('lay'));
      if (hasParentLay) {
        HMC.audio.SFX.pop();
      } else {
        HMC.audio.SFX.cluck();
        setTimeout(() => HMC.audio.SFX.pop(), 150);
      }
      HMC.effects.spawnFloatingWord(`咯咯哒！${num}`, fxX, fxY - 34, '#FF5D6C');

      const promptZh = (num === 5 || num === 10 || num === 15)
        ? `哇！下了 ${num} 个蛋啦！等一会儿自己就会孵出小鸡哦！`
        : `咯咯哒！第 ${num} 个蛋，等一会儿自己就会孵出小鸡哦！`;
      const promptEn = (num === 5 || num === 10 || num === 15)
        ? `Yay! ${num} eggs! They will hatch by themselves soon!`
        : `Cluck cluck! Egg number ${num}! It will hatch by itself soon!`;

      if (num === 5 || num === 10 || num === 15) {
        HMC.audio.SFX.success();
        HMC.effects.burstConfetti(30);
        HMC.effects.awardStar();
      }

      if (hasParentLay) {
        HMC.audio.setPrompt(promptZh, promptEn, false);
        HMC.audio.playParentClip('lay', promptZh, promptEn);
      } else {
        HMC.audio.setPrompt(promptZh, promptEn);
      }
    }
  }

  function hatchSingleClassicEgg(idx, x, y) {
    const state = HMC.state;
    const { classicFieldEl } = getEls();
    const item = state.classicItems[idx];
    if (!item || item.type !== 'egg' || item.hatched) return;

    if (item.isGolden) {
      const existingNode = itemNodeMap.get(item.id) || classicFieldEl.querySelector(`.free-meadow-item[data-item-id="${item.id}"]`);
      if (hammerActive) {
        strikeGoldenEgg(item, x, y);
      } else {
        bounceGoldenEggBareHand(item, existingNode, x, y);
      }
      return;
    }

    cancelEggIncubation(item.id);
    item.type = 'chick';
    item.hatched = true;
    item.justAdded = true;
    initChickMotion(item, 800);

    HMC.audio.SFX.crack();
    setTimeout(() => {
      if (HMC.state.mode === 'classic' && !isSleeping()) HMC.audio.SFX.cheep();
    }, 110);
    HMC.effects.spawnFloatingWord(`🐣 叽叽！${item.num}`, x, y - 20, '#F59F00');

    const existingNode = itemNodeMap.get(item.id);
    if (existingNode) {
      refreshMeadowItemNode(item, existingNode, 'pop-in');
    } else {
      classicFieldEl.appendChild(buildFreeMeadowItemNode(item));
    }

    updateClassicCounts();
    startMeadowLife();
    HMC.audio.setPrompt(`哇！孵出了第 ${item.num} 只小鸡！叽叽叽！`, `Pop! Baby chick number ${item.num}!`);
  }

  function hatchNormalClassicEggs() {
    const state = HMC.state;
    const { classicFieldEl } = getEls();
    const normalEggs = state.classicItems.filter(i => i.type === 'egg' && !i.isGolden && !i.hatched);
    if (normalEggs.length === 0) {
      if (getUncrackedGoldenEggs().length > 0) {
        HMC.audio.SFX.hardKnock();
        pulseHammerHint(2200);
        HMC.audio.setPrompt(
          '这颗彩虹金蛋硬邦邦的！抓起或点一下右下角的 🔨 小锤子砸开它吧！',
          'This rainbow golden egg is super hard! Grab or tap the 🔨 toy hammer to crack it open!'
        );
        return false;
      }
      layClassicEggRandom();
      return false;
    }

    normalEggs.forEach((item, idx) => {
      cancelEggIncubation(item.id);
      item.type = 'chick';
      item.hatched = true;
      item.justAdded = true;
      initChickMotion(item, 700 + idx * 140);

      const existingNode = itemNodeMap.get(item.id);
      if (existingNode) {
        refreshMeadowItemNode(item, existingNode, 'pop-in');
      } else if (classicFieldEl) {
        classicFieldEl.appendChild(buildFreeMeadowItemNode(item));
      }
    });

    updateClassicCounts();
    startMeadowLife();

    const chicksTotal = state.classicItems.filter(i => i.type === 'chick').length;
    HMC.audio.SFX.crack();
    setTimeout(() => {
      if (HMC.state.mode === 'classic' && !isSleeping()) HMC.audio.SFX.cheep();
    }, 140);
    setTimeout(() => {
      if (HMC.state.mode === 'classic' && !isSleeping()) HMC.audio.SFX.success();
    }, 280);
    HMC.effects.burstConfetti(26);
    HMC.audio.setPrompt(`哇！小鸡都孵出来啦，草地上有 ${chicksTotal} 位小伙伴！`, `Hooray! ${chicksTotal} cute friends on the meadow!`);
    return true;
  }

  function clearMeadow() {
    const state = HMC.state;
    clearAllIncubationTimers();
    cancelActiveDrag(false);
    cancelActiveHammerDrag();
    clearHammerHint();
    setHammerMode(false, false);
    if (HMC.classicToys && typeof HMC.classicToys.cancelAllAnimations === 'function') {
      HMC.classicToys.cancelAllAnimations();
    }
    HMC.audio.SFX.pop();
    state.classicItems = [];
    state.chickenX = 50;
    state.chickenY = 56;
    syncClassicFieldDOM();
    HMC.audio.setPrompt('草地收干净啦！点草地任意地方继续下蛋吧！', 'All tidy! Tap anywhere on the grass!');
  }

  function onResize() {
    const state = HMC.state;
    cachedBounds = null;
    if (state.mode === 'classic') {
      const { minX, maxX, minY, maxY } = getClassicBounds(true);
      state.chickenX = Math.max(minX, Math.min(maxX, state.chickenX));
      state.chickenY = Math.max(minY, Math.min(maxY, state.chickenY));
      ensureFreeChickenNode();

      state.classicItems.forEach(item => {
        if (item.dragging || item.playingToy) return;
        item.xPct = Math.max(minX, Math.min(maxX, item.xPct));
        item.yPct = Math.max(minY, Math.min(maxY, item.yPct));
        const el = itemNodeMap.get(item.id);
        if (el) {
          el.style.left = `${item.xPct.toFixed(2)}%`;
          el.style.top = `${item.yPct.toFixed(2)}%`;
          el.style.zIndex = String(Math.max(15, Math.round(item.yPct * 10)));
        }
      });
    }
  }

  function init() {
    const { classicFieldEl } = getEls();
    if (classicFieldEl) {
      classicFieldEl.addEventListener('click', (e) => {
        if (HMC.state.mode !== 'classic') return;
        if (nowMs() < justDraggedChickUntil || nowMs() < justUsedHammerUntil) return;
        if (hammerActive) {
          HMC.audio.SFX.boing();
          HMC.effects.spawnFloatingWord('咚！去敲发光的彩虹金蛋吧 🔨', e.clientX, e.clientY - 20, '#FF922B');
          HMC.audio.setPrompt(
            '🔨 小锤子拿在手里呢！去点发光的彩虹金蛋，或再点右下角 🔨 放下小锤子！',
            '🔨 Tap the glowing rainbow golden egg, or tap 🔨 again to put the hammer down!'
          );
          return;
        }
        layClassicEggAt(e.clientX, e.clientY);
      });
    }

    const hammerFab = document.getElementById('hammerFab');
    if (hammerFab) {
      hammerFab.addEventListener('pointerdown', (e) => {
        startHammerFabPointerSession(e);
      });
      hammerFab.addEventListener('click', (e) => {
        e.stopPropagation();
        if (nowMs() < suppressNextHammerClickUntil) return;
        handleHammerFabTap(e.clientX, e.clientY);
      });
    }

    const clearMeadowBtn = document.getElementById('clearMeadowBtn');
    if (clearMeadowBtn) {
      clearMeadowBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearMeadow();
      });
    }

    if (HMC.classicToys && typeof HMC.classicToys.init === 'function') {
      HMC.classicToys.init();
    }
    updateClassicCounts();
  }

  HMC.modes = HMC.modes || {};
  HMC.modes.classic = {
    getClassicBounds,
    getItemNode,
    pickRandomGrassSpot,
    updateClassicCounts,
    ensureFreeChickenNode,
    buildFreeMeadowItemNode,
    syncClassicFieldDOM,
    renderClassicMode,
    startMeadowLife,
    stopMeadowLife,
    cancelActiveDrag,
    cancelActiveHammerDrag,
    isDraggingChick: () => !!activeDrag,
    isHammerActive: () => hammerActive,
    setHammerMode,
    strikeGoldenEgg,
    rescheduleNormalEggs,
    getIncubationTimerCount: () => eggIncubationTimers.size,
    onWeatherChange,
    spawnTapRipple,
    layClassicEggRandom,
    layClassicEggAt,
    hatchSingleClassicEgg,
    hatchNormalClassicEggs,
    clearMeadow,
    onResize,
    init
  };
})(window.HMC = window.HMC || {});
