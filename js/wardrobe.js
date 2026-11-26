(function (HMC) {
  'use strict';

  let activeTab = 'dressup';
  let activeCategory = 'head';
  let activeAlbumCategory = 'animals';
  let previewAnimTimer = null;
  let savedCatBarScrollLeft = 0;
  let savedAlbumCatBarScrollLeft = 0;

  function getEls() {
    return {
      modal: document.getElementById('wardrobeModal'),
      tabsEl: document.getElementById('wardrobeTabs'),
      bodyEl: document.getElementById('wardrobeBody'),
      starsBadge: document.getElementById('totalStarsBadge'),
      wardrobeBtn: document.getElementById('wardrobeBtn'),
      wardrobeDot: document.getElementById('wardrobeDot')
    };
  }

  function isModalOpen() {
    const { modal } = getEls();
    return !!(modal && modal.classList.contains('open'));
  }

  function getCategories() {
    const cats = (HMC.data && Array.isArray(HMC.data.WARDROBE_CATEGORIES))
      ? HMC.data.WARDROBE_CATEGORIES
      : [];
    return cats;
  }

  function ensureValidCategory(categories) {
    if (!categories.length) return activeCategory;
    if (!categories.some(c => c.id === activeCategory)) {
      activeCategory = categories[0].id;
    }
    return activeCategory;
  }

  function getAlbumCategories() {
    const cats = (HMC.data && Array.isArray(HMC.data.RARE_CATEGORIES))
      ? HMC.data.RARE_CATEGORIES
      : [];
    return cats;
  }

  function ensureValidAlbumCategory(categories) {
    if (!categories.length) return activeAlbumCategory;
    if (!categories.some(c => c.id === activeAlbumCategory)) {
      activeAlbumCategory = categories[0].id;
    }
    return activeAlbumCategory;
  }

  function triggerPreviewDance(durationMs = 1350) {
    const actor = document.getElementById('wardrobePreviewChicken');
    if (!actor) return;
    if (previewAnimTimer) {
      clearTimeout(previewAnimTimer);
      previewAnimTimer = null;
    }
    actor.classList.remove('idle', 'celebrate');
    void actor.offsetWidth;
    actor.classList.add('celebrate');
    previewAnimTimer = setTimeout(() => {
      const current = document.getElementById('wardrobePreviewChicken');
      if (current) {
        current.classList.remove('celebrate');
        current.classList.add('idle');
      }
      previewAnimTimer = null;
    }, durationMs);
  }

  function updateBadge() {
    const { wardrobeBtn, wardrobeDot } = getEls();
    const claimable = !!(
      HMC.storage &&
      HMC.storage.hasClaimableWardrobeItem &&
      HMC.storage.hasClaimableWardrobeItem()
    );
    if (wardrobeDot) {
      wardrobeDot.classList.toggle('hidden', !claimable);
    }
    if (wardrobeBtn) {
      wardrobeBtn.classList.toggle('has-claimable', claimable);
    }
    return claimable;
  }

  function refreshLiveChickens() {
    if (!HMC.svg || !HMC.svg.renderChickenSVG) return;

    const actors = new Set();
    document.querySelectorAll('.chicken-actor').forEach(el => {
      if (el.id !== 'wardrobePreviewChicken') actors.add(el);
    });
    const classicActor = document.getElementById('classicChicken');
    if (classicActor) actors.add(classicActor);

    actors.forEach(actor => {
      const prevSvg = actor.querySelector('svg');
      const fallbackSize = actor.id === 'classicChicken' ? 136 : 126;
      const size = prevSvg ? (parseInt(prevSvg.getAttribute('width'), 10) || fallbackSize) : fallbackSize;
      actor.innerHTML = HMC.svg.renderChickenSVG(size, false);
    });

    const previewActor = document.getElementById('wardrobePreviewChicken');
    if (previewActor) {
      previewActor.innerHTML = HMC.svg.renderChickenSVG(116, false);
    }

    const sleepSlot = document.getElementById('sleepingChickenSlot');
    if (sleepSlot) {
      const prevSvg = sleepSlot.querySelector('svg');
      const size = prevSvg ? (parseInt(prevSvg.getAttribute('width'), 10) || 160) : 160;
      sleepSlot.innerHTML = HMC.svg.renderChickenSVG(size, true);
    }
  }

  function pickRandomOutfit(items, unlockedSet, currentEquipped) {
    const bySlot = new Map();
    items.forEach(item => {
      if (!unlockedSet.has(item.id)) return;
      if (!bySlot.has(item.slot)) bySlot.set(item.slot, []);
      bySlot.get(item.slot).push(item.id);
    });

    const slots = Array.from(bySlot.keys());
    if (slots.length === 0) return [];
    if (slots.length === 1 && bySlot.get(slots[0]).length === 1) {
      return [bySlot.get(slots[0])[0]];
    }

    const currentKey = (currentEquipped || []).slice().sort().join('|');
    const hasMultiInAnySlot = slots.some(s => bySlot.get(s).length > 1);
    let picked = [];

    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = [];
      const includeAll = attempt < 4 && hasMultiInAnySlot;
      slots.forEach(slot => {
        const pool = bySlot.get(slot);
        if (includeAll || Math.random() < 0.78) {
          const idx = Math.floor(Math.random() * pool.length);
          candidate.push(pool[idx]);
        }
      });
      if (candidate.length === 0) {
        const randSlot = slots[Math.floor(Math.random() * slots.length)];
        const pool = bySlot.get(randSlot);
        candidate.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      picked = candidate;
      if (candidate.slice().sort().join('|') !== currentKey) {
        break;
      }
    }
    return picked;
  }

  function captureCatBarScroll() {
    const catBar = document.getElementById('wardrobeCatBar');
    if (catBar) {
      savedCatBarScrollLeft = catBar.scrollLeft || 0;
    }
  }

  function captureAlbumCatBarScroll() {
    const albumBar = document.getElementById('albumCatBar');
    if (albumBar) {
      savedAlbumCatBarScrollLeft = albumBar.scrollLeft || 0;
    }
  }

  function renderDressupTab(bodyEl, totalStars, wardrobe) {
    const categories = getCategories();
    const currentCatId = ensureValidCategory(categories);
    const items = (HMC.data && HMC.data.WARDROBE_ITEMS) || [];
    const itemById = (HMC.data && HMC.data.WARDROBE_BY_ID) || {};
    const equippedList = Array.isArray(wardrobe.equipped) ? wardrobe.equipped : [];
    const equippedSet = new Set(equippedList);
    const unlockedSet = new Set(wardrobe.unlocked || []);

    // Order currently worn items cleanly by category order
    const catOrder = new Map(categories.map((c, idx) => [c.id, idx]));
    const equippedItems = equippedList
      .map(id => itemById[id])
      .filter(Boolean)
      .sort((a, b) => (catOrder.get(a.slot) ?? 99) - (catOrder.get(b.slot) ?? 99));

    const wornChipsHtml = equippedItems.length > 0
      ? equippedItems.map(it => (
        `<button type="button" class="wardrobe-worn-chip" data-slot="${it.slot}" title="查看${it.zh}">` +
          `<span class="wardrobe-worn-chip-icon">${it.icon}</span>` +
          `<span class="wardrobe-worn-chip-name">${it.zh}</span>` +
        `</button>`
      )).join('')
      : '<span class="wardrobe-worn-empty">点下面挑漂亮装扮吧 ✨</span>';

    // 1. Compact Live Preview Banner
    const previewWrap = document.createElement('div');
    previewWrap.className = 'wardrobe-preview';
    previewWrap.innerHTML = `
      <div class="wardrobe-preview-stage" id="wardrobePreviewStage" role="button" tabindex="0" title="点一点快乐小鸡！">
        <div class="chicken-actor idle" id="wardrobePreviewChicken">
          ${HMC.svg.renderChickenSVG(116, false)}
        </div>
      </div>
      <div class="wardrobe-preview-info">
        <div class="wardrobe-preview-headrow">
          <div class="wardrobe-preview-headline">快乐小鸡试衣镜 ✨</div>
          <span class="wardrobe-worn-count">${equippedItems.length}/${categories.length || 7}</span>
        </div>
        <div class="wardrobe-worn-chips" id="wardrobeWornChips">${wornChipsHtml}</div>
        <div class="wardrobe-preview-actions">
          <button type="button" class="wardrobe-action-pill wardrobe-random-btn" id="wardrobeRandomBtn">🎲 随机穿搭</button>
          <button type="button" class="wardrobe-action-pill wardrobe-clear-btn" id="wardrobeClearBtn" ${equippedItems.length === 0 ? 'disabled' : ''}>🧹 全部脱下</button>
        </div>
      </div>
    `;

    const previewStage = previewWrap.querySelector('#wardrobePreviewStage');
    if (previewStage) {
      const dancePraise = (e) => {
        if (e) e.stopPropagation();
        triggerPreviewDance(1400);
        if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.cluck();
        if (HMC.audio && HMC.audio.speak) {
          HMC.audio.speak('咯咯哒！快乐小鸡今天的装扮真漂亮呀！', 'Cluck cluck! Happy Chicken looks so pretty today!');
        }
        if (HMC.effects && HMC.effects.spawnFloatingWord) {
          const rect = previewStage.getBoundingClientRect();
          HMC.effects.spawnFloatingWord('✨ 真漂亮！', rect.left + rect.width / 2, rect.top + 12, '#FF5C8D');
        }
      };
      previewStage.addEventListener('click', dancePraise);
      previewStage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          dancePraise(e);
        }
      });
    }

    previewWrap.querySelectorAll('.wardrobe-worn-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const slot = chip.dataset.slot;
        if (!slot || slot === activeCategory) return;
        captureCatBarScroll();
        activeCategory = slot;
        if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
        renderWardrobeContent(true);
      });
    });

    const randomBtn = previewWrap.querySelector('#wardrobeRandomBtn');
    if (randomBtn) {
      randomBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        captureCatBarScroll();
        const picked = pickRandomOutfit(items, unlockedSet, equippedList);
        if (HMC.storage && HMC.storage.setEquippedWardrobe) {
          HMC.storage.setEquippedWardrobe(picked);
        }
        if (HMC.audio && HMC.audio.SFX) {
          if (typeof HMC.audio.SFX.magic === 'function') HMC.audio.SFX.magic();
          else HMC.audio.SFX.success();
        }
        if (HMC.audio && HMC.audio.speak) {
          HMC.audio.speak('哇！换上新造型啦，快乐小鸡真漂亮！', 'Ta-da! A brand new outfit for Happy Chicken!');
        }
        if (HMC.effects && HMC.effects.spawnFloatingWord) {
          const stageEl = document.getElementById('wardrobePreviewStage');
          const rect = stageEl ? stageEl.getBoundingClientRect() : null;
          const fx = rect ? rect.left + rect.width / 2 : (window.innerWidth || 390) / 2;
          const fy = rect ? rect.top + 12 : (window.innerHeight || 844) * 0.25;
          HMC.effects.spawnFloatingWord('🎲 新造型！', fx, fy, '#FF5C8D');
        }
        refreshLiveChickens();
        updateBadge();
        renderWardrobeContent();
        triggerPreviewDance(1400);
      });
    }

    const clearBtn = previewWrap.querySelector('#wardrobeClearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (equippedItems.length === 0) return;
        captureCatBarScroll();
        if (HMC.storage && HMC.storage.clearEquippedWardrobe) {
          HMC.storage.clearEquippedWardrobe();
        }
        if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
        if (HMC.audio && HMC.audio.speak) {
          HMC.audio.speak('全部脱下啦，干干净净的快乐小鸡！', 'All off! Fresh and clean Happy Chicken!');
        }
        refreshLiveChickens();
        updateBadge();
        renderWardrobeContent();
      });
    }

    // 2. Pure Single-Row Category Filter Bar (7 Categories)
    const catBar = document.createElement('div');
    catBar.className = 'wardrobe-cat-bar';
    catBar.id = 'wardrobeCatBar';
    catBar.setAttribute('role', 'tablist');
    catBar.setAttribute('aria-label', '装扮品类筛选');

    categories.forEach(cat => {
      const catItems = items.filter(it => it.slot === cat.id);
      const hasCatClaimable = catItems.some(it => it.cost <= totalStars && !unlockedSet.has(it.id));
      const isActive = cat.id === currentCatId;

      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'wardrobe-cat-pill' + (isActive ? ' active' : '');
      pill.dataset.category = cat.id;
      pill.setAttribute('role', 'tab');
      pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
      pill.innerHTML =
        `<span class="wardrobe-cat-icon">${cat.icon}</span>` +
        `<span class="wardrobe-cat-label">${cat.zh}</span>` +
        (hasCatClaimable ? '<span class="wardrobe-cat-dot" aria-label="有可解锁装扮"></span>' : '');

      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeCategory === cat.id) return;
        captureCatBarScroll();
        activeCategory = cat.id;
        if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
        renderWardrobeContent(true);
      });

      catBar.appendChild(pill);
    });

    // 3. Subtle Non-Interactive Category Eyebrow Note
    const activeCatObj = categories.find(c => c.id === currentCatId) || { id: currentCatId, icon: '👑', zh: '头饰' };
    const activeCatItems = items.filter(it => it.slot === currentCatId);
    const unlockedInCat = activeCatItems.filter(it => unlockedSet.has(it.id)).length;

    const catNote = document.createElement('div');
    catNote.className = 'wardrobe-cat-note';
    catNote.textContent = `当前品类：${activeCatObj.icon} ${activeCatObj.zh} · 已解锁 ${unlockedInCat}/${activeCatItems.length}`;

    // 4. 6-Item Category Grid
    const grid = document.createElement('div');
    grid.className = 'wardrobe-grid';

    activeCatItems.forEach(item => {
      const isUnlocked = unlockedSet.has(item.id);
      const isEquipped = isUnlocked && equippedSet.has(item.id);
      const canClaim = !isUnlocked && totalStars >= item.cost;
      const starsNeeded = Math.max(0, item.cost - totalStars);

      let stateClass = 'state-locked';
      let actionLabel = `🔒 还差 ${starsNeeded}⭐`;
      if (isEquipped) {
        stateClass = 'state-equipped';
        actionLabel = '✅ 穿着呢';
      } else if (isUnlocked) {
        stateClass = 'state-owned';
        actionLabel = '👗 穿上它';
      } else if (canClaim) {
        stateClass = 'state-claimable';
        actionLabel = '🎁 解锁！';
      }

      const thumbHtml = (HMC.svgWardrobe && typeof HMC.svgWardrobe.renderItemThumbnail === 'function')
        ? (HMC.svgWardrobe.renderItemThumbnail(item.id, 46) || `<span class="wardrobe-item-emoji">${item.icon}</span>`)
        : `<span class="wardrobe-item-emoji">${item.icon}</span>`;

      const card = document.createElement('button');
      card.type = 'button';
      card.className = `wardrobe-item-card ${stateClass}`;
      card.dataset.itemId = item.id;
      card.dataset.slot = item.slot;
      card.innerHTML = `
        <div class="wardrobe-item-thumb">${thumbHtml}</div>
        <div class="wardrobe-item-name">${item.zh}</div>
        <div class="wardrobe-item-en">${item.en}</div>
        <div class="wardrobe-item-action">${actionLabel}</div>
      `;

      card.addEventListener('click', (e) => {
        e.stopPropagation();
        captureCatBarScroll();

        if (isUnlocked) {
          const res = HMC.storage.toggleEquipWardrobeItem(item.id);
          if (res.equipped) {
            if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.success();
            if (HMC.audio && HMC.audio.speak) {
              HMC.audio.speak(`穿上${item.zh}啦！真好看！`, `Wearing ${item.en}!`);
            }
          } else {
            if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
            if (HMC.audio && HMC.audio.speak) {
              HMC.audio.speak(`脱下${item.zh}啦！`, `Took off ${item.en}!`);
            }
          }
          refreshLiveChickens();
          updateBadge();
          renderWardrobeContent();
          if (res.equipped) triggerPreviewDance(1100);
          return;
        }

        if (canClaim) {
          HMC.storage.unlockWardrobeItem(item.id);
          if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.fanfare();
          if (HMC.effects && HMC.effects.burstConfetti) HMC.effects.burstConfetti(30);
          if (HMC.effects && HMC.effects.spawnFloatingWord) {
            HMC.effects.spawnFloatingWord(
              `🎉 解锁${item.zh}！`,
              (window.innerWidth || 390) / 2,
              (window.innerHeight || 844) * 0.28,
              '#FF5C8D'
            );
          }
          if (HMC.audio && HMC.audio.speak) {
            HMC.audio.speak(`太棒啦！解锁了${item.zh}！`, `Awesome! Unlocked ${item.en}!`);
          }
          refreshLiveChickens();
          updateBadge();
          renderWardrobeContent();
          triggerPreviewDance(1500);
          return;
        }

        // Locked & not enough stars yet
        card.classList.remove('locked-shake');
        void card.offsetWidth;
        card.classList.add('locked-shake');
        if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.boing();
        if (HMC.audio && HMC.audio.speak) {
          HMC.audio.speak(
            `再收集 ${starsNeeded} 颗星星就能解锁${item.zh}啦！`,
            `Collect ${starsNeeded} more stars to unlock ${item.en}!`
          );
        }
      });

      grid.appendChild(card);
    });

    bodyEl.appendChild(previewWrap);
    bodyEl.appendChild(catBar);
    bodyEl.appendChild(catNote);
    bodyEl.appendChild(grid);

    // Restore category bar scroll position cleanly
    if (savedCatBarScrollLeft > 0) {
      catBar.scrollLeft = savedCatBarScrollLeft;
    }
  }

  function renderAlbumTab(bodyEl, album, buddies) {
    const categories = getAlbumCategories();
    const currentCatId = ensureValidAlbumCategory(categories);
    const totalRare = buddies.length;
    const collectedCount = buddies.filter(b => (Number(album[b.id]) || 0) > 0).length;
    const pct = totalRare > 0 ? Math.round((collectedCount / totalRare) * 100) : 0;
    const isAllCollected = totalRare > 0 && collectedCount >= totalRare;

    // 1. Overall Collection Progress Banner
    const summaryBar = document.createElement('div');
    summaryBar.className = 'album-summary-bar' + (isAllCollected ? ' complete' : '');
    summaryBar.innerHTML = `
      <div class="album-summary-head">
        <div class="album-summary-title">${isAllCollected ? '🏆' : '🌟'} 已收集 ${collectedCount} / ${totalRare} 位稀有小伙伴</div>
        <span class="album-summary-pct">${isAllCollected ? '🎉 全集齐！' : `${pct}%`}</span>
      </div>
      <div class="album-progress-track" role="progressbar" aria-label="图鉴收集进度" aria-valuemin="0" aria-valuemax="${totalRare}" aria-valuenow="${collectedCount}">
        <div class="album-progress-fill" style="width: ${pct}%"></div>
      </div>
      <div class="album-summary-sub">${isAllCollected
        ? `太厉害啦！全部 ${totalRare} 位神奇小伙伴都和你成为好朋友咯！`
        : `在【下蛋】模式敲开彩虹金蛋，盲盒收集全部 ${totalRare} 位小伙伴！`
      }</div>
    `;
    bodyEl.appendChild(summaryBar);

    // 2. 4-Category Pure Filter Pill Bar
    let activeCatObj = null;
    let activeCatBuddies = buddies;

    if (categories.length > 0) {
      const catBar = document.createElement('div');
      catBar.className = 'album-cat-bar';
      catBar.id = 'albumCatBar';
      catBar.setAttribute('role', 'tablist');
      catBar.setAttribute('aria-label', '图鉴主题筛选');

      categories.forEach(cat => {
        const catBuddies = buddies.filter(b => b.category === cat.id);
        const catCollected = catBuddies.filter(b => (Number(album[b.id]) || 0) > 0).length;
        const catComplete = catBuddies.length > 0 && catCollected >= catBuddies.length;
        const isActive = cat.id === currentCatId;

        if (isActive) {
          activeCatObj = cat;
          activeCatBuddies = catBuddies;
        }

        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'album-cat-pill' + (isActive ? ' active' : '') + (catComplete ? ' cat-complete' : '');
        pill.dataset.albumCategory = cat.id;
        pill.setAttribute('role', 'tab');
        pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
        pill.innerHTML =
          `<span class="album-cat-icon">${cat.icon}</span>` +
          `<span class="album-cat-label">${cat.zh}</span>` +
          `<span class="album-cat-count">(${catCollected}/${catBuddies.length})</span>`;

        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          if (activeAlbumCategory === cat.id) return;
          captureAlbumCatBarScroll();
          activeAlbumCategory = cat.id;
          if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
          renderWardrobeContent(true);
        });

        catBar.appendChild(pill);
      });

      bodyEl.appendChild(catBar);

      // 3. Category Eyebrow Note (plain non-button text)
      const catCollectedCount = activeCatBuddies.filter(b => (Number(album[b.id]) || 0) > 0).length;
      const catNote = document.createElement('div');
      catNote.className = 'wardrobe-cat-note';
      catNote.textContent = `当前主题：${activeCatObj.icon} ${activeCatObj.zh} · 已遇见 ${catCollectedCount}/${activeCatBuddies.length}`;
      bodyEl.appendChild(catNote);

      if (savedAlbumCatBarScrollLeft > 0) {
        catBar.scrollLeft = savedAlbumCatBarScrollLeft;
      }
    }

    // 4. 6-Buddy Responsive Grid
    const grid = document.createElement('div');
    grid.className = 'album-grid';

    activeCatBuddies.forEach(buddy => {
      const count = Number(album[buddy.id]) || 0;
      const collected = count > 0;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `album-card ${collected ? 'collected' : 'locked'}`;
      card.dataset.buddyId = buddy.id;
      if (buddy.category) card.dataset.category = buddy.category;

      if (collected) {
        card.innerHTML = `
          <div class="album-sprite">${HMC.svg.renderRareBuddySVG({ size: 78, buddyId: buddy.id })}</div>
          <div class="album-name">${buddy.icon} ${buddy.zh}</div>
          <div class="album-en">${buddy.en}</div>
          <div class="album-count-pill">已遇见 ×${count}</div>
        `;
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          const sprite = card.querySelector('.album-sprite');
          if (sprite) {
            sprite.classList.remove('album-hop');
            void sprite.offsetWidth;
            sprite.classList.add('album-hop');
          }
          if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.cheep();
          if (HMC.audio && HMC.audio.speak) {
            HMC.audio.speak(buddy.praiseZh, buddy.praiseEn);
          }
        });
      } else {
        card.innerHTML = `
          <div class="album-sprite album-silhouette">${HMC.svg.renderRareBuddySVG({ size: 78, buddyId: buddy.id })}</div>
          <div class="album-name">？？？</div>
          <div class="album-tip">敲开彩虹金蛋遇见它！</div>
        `;
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
          if (HMC.audio && HMC.audio.speak) {
            HMC.audio.speak('敲开草地上的彩虹金蛋来遇见它吧！', 'Tap the rainbow golden egg on the grass to meet it!');
          }
        });
      }

      grid.appendChild(card);
    });

    bodyEl.appendChild(grid);
  }

  function renderWardrobeContent(scrollActiveCatIntoView = false) {
    const { tabsEl, bodyEl, starsBadge } = getEls();
    const totalStars = HMC.storage && HMC.storage.getTotalStars
      ? HMC.storage.getTotalStars()
      : Math.max(0, Number(HMC.state && HMC.state.totalStars) || 0);
    const wardrobe = HMC.storage && HMC.storage.getWardrobe
      ? HMC.storage.getWardrobe()
      : { unlocked: ['bow'], equipped: ['bow'] };
    const album = HMC.storage && HMC.storage.getAlbum ? HMC.storage.getAlbum() : {};
    const buddies = (HMC.data && HMC.data.RARE_BUDDIES) || [];
    const collectedCount = buddies.filter(b => (Number(album[b.id]) || 0) > 0).length;
    const hasClaimable = !!(
      HMC.storage &&
      HMC.storage.hasClaimableWardrobeItem &&
      HMC.storage.hasClaimableWardrobeItem()
    );

    if (starsBadge) {
      starsBadge.textContent = `⭐ ${totalStars}`;
    }

    if (tabsEl) {
      tabsEl.innerHTML = '';
      const tabs = [
        { id: 'dressup', label: '👗 小鸡换装间', dot: hasClaimable },
        { id: 'album',   label: `📖 神奇小鸡图鉴 (${collectedCount}/${buddies.length})`, dot: false }
      ];
      tabs.forEach(tab => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'wardrobe-tab-btn' + (activeTab === tab.id ? ' active' : '');
        btn.dataset.tab = tab.id;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', activeTab === tab.id ? 'true' : 'false');
        btn.innerHTML = tab.dot
          ? `${tab.label}<span class="wardrobe-tab-dot"></span>`
          : tab.label;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (activeTab === tab.id) return;
          activeTab = tab.id;
          if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
          renderWardrobeContent();
        });
        tabsEl.appendChild(btn);
      });
    }

    if (!bodyEl) return;
    bodyEl.innerHTML = '';

    if (activeTab === 'album') {
      renderAlbumTab(bodyEl, album, buddies);
      if (scrollActiveCatIntoView) {
        const activeAlbumPill = bodyEl.querySelector('.album-cat-pill.active');
        if (activeAlbumPill && typeof activeAlbumPill.scrollIntoView === 'function') {
          try {
            activeAlbumPill.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
          } catch (e) {
            activeAlbumPill.scrollIntoView();
          }
        }
      }
    } else {
      renderDressupTab(bodyEl, totalStars, wardrobe);
      if (scrollActiveCatIntoView) {
        const activePill = bodyEl.querySelector('.wardrobe-cat-pill.active');
        if (activePill && typeof activePill.scrollIntoView === 'function') {
          try {
            activePill.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
          } catch (e) {
            activePill.scrollIntoView();
          }
        }
      }
    }
  }

  function openWardrobe(initialTab = 'dressup') {
    activeTab = (initialTab === 'album') ? 'album' : 'dressup';
    if (HMC.parent && typeof HMC.parent.closeParentMenu === 'function') {
      HMC.parent.closeParentMenu();
    } else {
      const parentModal = document.getElementById('parentModal');
      if (parentModal) parentModal.classList.remove('open');
    }

    const { modal } = getEls();
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
    renderWardrobeContent();
    updateBadge();
    if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
  }

  function closeWardrobe() {
    const { modal } = getEls();
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
    if (previewAnimTimer) {
      clearTimeout(previewAnimTimer);
      previewAnimTimer = null;
    }
  }

  function initWardrobe() {
    const { modal, wardrobeBtn } = getEls();
    if (wardrobeBtn) {
      wardrobeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openWardrobe('dressup');
      });
    }

    const closeBtn = document.getElementById('wardrobeCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
        closeWardrobe();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeWardrobe();
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isModalOpen()) {
        e.preventDefault();
        closeWardrobe();
      }
    });

    updateBadge();
  }

  HMC.wardrobe = {
    openWardrobe,
    closeWardrobe,
    renderWardrobeContent,
    updateBadge,
    refreshLiveChickens,
    initWardrobe,
    init: initWardrobe
  };
})(window.HMC = window.HMC || {});
