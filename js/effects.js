(function (HMC) {
  'use strict';

  function getFxLayer() {
    return document.getElementById('fxLayer');
  }

  function spawnFloatingWord(text, x, y, color = '#FF5C8D') {
    const fxLayerEl = getFxLayer();
    if (!fxLayerEl) return;
    const vw = window.innerWidth || 390;
    const vh = window.innerHeight || 844;
    const padX = Math.min(115, Math.max(76, text.length * 10));
    const safeX = Math.max(padX, Math.min(vw - padX, x));
    const safeY = Math.max(82, Math.min(vh - 70, y));
    const el = document.createElement('div');
    el.className = 'float-word';
    el.textContent = text;
    el.style.left = `${safeX}px`;
    el.style.top = `${safeY}px`;
    el.style.color = color;
    fxLayerEl.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  function burstConfetti(count = 32) {
    const fxLayerEl = getFxLayer();
    if (!fxLayerEl) return;
    const palette = ['#FF5D6C', '#FFD43B', '#4DABF7', '#51CF66', '#FF85C0', '#B197FC', '#FF922B'];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${8 + Math.random() * 84}%`;
      piece.style.top = `${-10 - Math.random() * 40}px`;
      piece.style.background = palette[i % palette.length];
      piece.style.animationDelay = `${Math.random() * 0.45}s`;
      piece.style.borderRadius = i % 2 === 0 ? '50%' : '3px';
      fxLayerEl.appendChild(piece);
      setTimeout(() => piece.remove(), 2400);
    }
  }

  function renderStarsUI() {
    const slots = document.querySelectorAll('#stickerTray .sticker-slot');
    slots.forEach((slot, idx) => {
      slot.classList.toggle('empty', idx >= HMC.state.stars);
      slot.classList.toggle('earned', idx < HMC.state.stars);
    });
    const total = Math.max(0, Number(HMC.state.totalStars) || 0);
    const tray = document.getElementById('stickerTray');
    if (tray) {
      tray.title = `累计 ${total} 颗星星 · 点一点打开换装间与图鉴！`;
      tray.setAttribute('aria-label', `累计 ${total} 颗星星，打开换装间与图鉴`);
    }
    const badge = document.getElementById('totalStarsBadge');
    if (badge) {
      badge.textContent = `⭐ ${total}`;
    }
  }

  let partyTimer = null;

  function awardStar() {
    const state = HMC.state;
    const newTotal = (HMC.storage && HMC.storage.addStar)
      ? HMC.storage.addStar()
      : (Number(state.totalStars) || 0) + 1;
    state.totalStars = newTotal;
    state.stars = Math.min(5, (Number(state.stars) || 0) + 1);
    renderStarsUI();

    if (HMC.wardrobe && HMC.wardrobe.updateBadge) {
      HMC.wardrobe.updateBadge();
    }

    const items = (HMC.data && HMC.data.WARDROBE_ITEMS) || [];
    const unlocked = (HMC.storage && HMC.storage.getWardrobe) ? HMC.storage.getWardrobe().unlocked : [];
    const newlyUnlockable = items.find(item => item.cost > 0 && item.cost === newTotal && !unlocked.includes(item.id));
    if (newlyUnlockable) {
      const toastDelay = state.stars >= 5 ? 1250 : 260;
      setTimeout(() => {
        spawnFloatingWord('🎁 新装扮可解锁！', (window.innerWidth || 390) / 2, (window.innerHeight || 844) * 0.24, '#FF5C8D');
      }, toastDelay);
    }

    const isParty = state.stars >= 5;
    if (isParty) {
      if (partyTimer) clearTimeout(partyTimer);
      partyTimer = setTimeout(() => {
        partyTimer = null;
        const sleepOverlay = document.getElementById('sleepOverlay');
        if (sleepOverlay && sleepOverlay.classList.contains('open')) return;

        HMC.audio.SFX.fanfare();
        burstConfetti(48);
        spawnFloatingWord('🎉 小鸡大派对！', (window.innerWidth || 390) / 2, (window.innerHeight || 844) * 0.36, '#FF8C00');

        const playPartyVoice = () => {
          const sleepEl = document.getElementById('sleepOverlay');
          if (sleepEl && sleepEl.classList.contains('open')) return;
          HMC.audio.playParentClip(
            'party',
            '哇！集齐五颗星啦！快乐小鸡大派对！',
            'Five stars! Happy Mrs. Chicken party!'
          );
        };

        if (
          HMC.audio &&
          typeof HMC.audio.isSpeaking === 'function' &&
          HMC.audio.isSpeaking() &&
          typeof HMC.audio.getCurrentSpeechPromise === 'function'
        ) {
          const genBefore = typeof HMC.audio.getSpeechGen === 'function' ? HMC.audio.getSpeechGen() : -1;
          const activeP = HMC.audio.getCurrentSpeechPromise();
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            const curGen = typeof HMC.audio.getSpeechGen === 'function' ? HMC.audio.getSpeechGen() : -1;
            if (curGen === genBefore) playPartyVoice();
          };
          setTimeout(finish, 4500);
          Promise.resolve(activeP).then(finish, finish);
        } else {
          playPartyVoice();
        }

        const actor = document.querySelector('.chicken-actor');
        if (actor) {
          actor.classList.remove('idle');
          actor.classList.add('celebrate');
          setTimeout(() => {
            actor.classList.remove('celebrate');
            actor.classList.add('idle');
          }, 1600);
        }
        setTimeout(() => {
          state.stars = (Number(state.totalStars) || 0) % 5;
          renderStarsUI();
        }, 2200);
      }, 500);
    }
    return isParty;
  }

  function setupDragToTarget(dragEl, targetSelector, onDrop) {
    if (!dragEl) return;
    let dragging = false;
    let startX = 0;
    let startY = 0;

    dragEl.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      dragEl.classList.remove('bounce');
      dragEl.style.zIndex = '50';
      if (dragEl.setPointerCapture) {
        try { dragEl.setPointerCapture(e.pointerId); } catch (err) {}
      }
    });

    dragEl.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      dragEl.style.transform = `translate(${e.clientX - startX}px, ${e.clientY - startY}px) scale(1.08)`;
    });

    const finish = (e) => {
      if (!dragging) return;
      dragging = false;
      dragEl.style.transform = '';
      dragEl.style.zIndex = '';
      let matched = null;
      document.querySelectorAll(targetSelector).forEach(t => {
        const rect = t.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          matched = t;
        }
      });
      if (matched) onDrop(matched, e.clientX, e.clientY);
      else dragEl.classList.add('bounce');
    };

    dragEl.addEventListener('pointerup', finish);
    dragEl.addEventListener('pointercancel', finish);
  }

  function renderSubModeDock(items, activeId, onSelect) {
    const dockEl = document.getElementById('subModeDock');
    const appShellEl = document.getElementById('appShell');
    if (!dockEl || !appShellEl) return;

    dockEl.innerHTML = '';
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'submode-pill' + (item.id === activeId ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', item.id === activeId ? 'true' : 'false');
      btn.dataset.subId = item.id;
      btn.textContent = item.label;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (item.id === activeId) return;
        if (typeof onSelect === 'function') onSelect(item.id);
      });
      dockEl.appendChild(btn);
    });

    dockEl.classList.remove('hidden');
    appShellEl.classList.add('has-subdock');
  }

  function clearSubModeDock() {
    const dockEl = document.getElementById('subModeDock');
    const appShellEl = document.getElementById('appShell');
    if (dockEl) {
      dockEl.innerHTML = '';
      dockEl.classList.add('hidden');
    }
    if (appShellEl) {
      appShellEl.classList.remove('has-subdock');
    }
  }

  HMC.effects = {
    spawnFloatingWord,
    burstConfetti,
    renderStarsUI,
    awardStar,
    setupDragToTarget,
    renderSubModeDock,
    clearSubModeDock
  };
})(window.HMC = window.HMC || {});
