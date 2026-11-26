(function (HMC) {
  'use strict';

  const MATH_SUB_ITEMS = [
    { id: 'feed',   label: '🌽 喂玉米' },
    { id: 'size',   label: '📏 大小排队' },
    { id: 'addsub', label: '➕ 小加减' }
  ];

  function getStage() {
    return document.getElementById('gameStage');
  }

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function syncSubModeDock() {
    const state = HMC.state;
    const sub = state.mathSubMode || 'feed';

    HMC.effects.renderSubModeDock(
      MATH_SUB_ITEMS,
      sub,
      (nextSub) => {
        state.mathSubMode = nextSub;
        state.mathLocked = false;
        state.feedLocked = false;
        state.mathWrongCount = 0;
        HMC.audio.SFX.pop();
        renderCountingMode(true);
      }
    );
  }

  /* ==========================================================================
     Sub-Mode 1: 🌽 喂玉米 (Progressive 1-3 -> 1-5 -> 3-8 Corn Feeding)
     ========================================================================== */
  function createFeedRound() {
    const state = HMC.state;
    const { ACCESSORIES } = HMC.data;
    const maxNum = state.feedCompletedCount < 2 ? 3 : (state.feedCompletedCount < 4 ? 5 : 8);
    const minNum = state.feedCompletedCount >= 4 ? 3 : 1;
    let target = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
    if (state.feedRound && target === state.feedRound.target) {
      target = target < maxNum ? target + 1 : minNum;
    }
    const totalCorn = Math.min(10, Math.max(5, target + 2));
    state.feedRound = {
      target,
      fed: 0,
      eatenMask: Array(totalCorn).fill(false),
      accessory: ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)],
      done: false
    };
    state.feedLocked = false;
  }

  function renderFeedSubMode(newRound = false) {
    const state = HMC.state;
    const stageEl = getStage();
    if (newRound || !state.feedRound) createFeedRound();
    const r = state.feedRound;

    syncSubModeDock();
    stageEl.classList.remove('empty');

    const dotsHtml = Array.from({ length: r.target }, (_, i) =>
      `<div class="corn-dot ${i < r.fed ? 'filled' : ''}">${i < r.fed ? '🌽' : ''}</div>`
    ).join('');

    const feedRangeLabel = state.feedCompletedCount < 2
      ? '1–3颗'
      : (state.feedCompletedCount < 4 ? '1–5颗' : '3–8颗');

    stageEl.innerHTML = `
      <div class="feed-scene">
        <div class="stage-level-note" aria-label="当前数量范围">当前范围 · ${feedRangeLabel}</div>
        <div class="feed-top-row">
          <div class="chicken-actor ${r.done ? 'celebrate' : 'idle'}" id="feedMamaChicken">
            ${HMC.svg.renderChickenSVG(112)}
          </div>

          <div class="hungry-chick-wrap" id="hungryChick">
            <div class="thought-bubble" id="feedThoughtBubble" title="点一点再听一遍">
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:14px;font-weight:800;color:#7A5E48;">${state.lang === 'en' ? 'Feed' : '想吃'}</span>
                <span class="target-num-big">${r.target}</span>
                <span style="font-size:14px;font-weight:800;color:#7A5E48;">${state.lang === 'en' ? 'corn' : '颗玉米'}</span>
              </div>
              <div class="target-dots" style="flex-wrap:wrap;max-width:220px;">${dotsHtml}</div>
            </div>
            <div style="margin-top:4px;">
              ${HMC.svg.renderChickSVG({ size: 108, bodyColor: r.done ? '#FFE066' : '#FFF0A8', accessory: r.accessory })}
            </div>
          </div>
        </div>

        <div class="corn-tray" id="cornTray"></div>
      </div>
    `;

    const tray = document.getElementById('cornTray');
    r.eatenMask.forEach((isEaten, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'corn-btn' + (isEaten ? ' eaten' : '');
      btn.innerHTML = HMC.svg.renderCornSVG(50);
      btn.addEventListener('click', (e) => handleFeedCorn(idx, e.clientX, e.clientY));
      tray.appendChild(btn);
    });

    const repeatFeedPrompt = () => {
      HMC.audio.speak(`小鸡饿啦，请喂我吃 ${r.target} 颗玉米吧！`, `Baby chick wants ${r.target} corn!`);
    };
    document.getElementById('feedThoughtBubble').addEventListener('click', repeatFeedPrompt);
    document.getElementById('feedMamaChicken').addEventListener('click', () => {
      HMC.audio.SFX.cluck();
      repeatFeedPrompt();
    });

    if (newRound) {
      HMC.audio.setPrompt(`小鸡饿啦！请喂它吃【${r.target}】颗玉米吧！`, `Feed the chick ${r.target} corn!`);
    }
  }

  function handleFeedCorn(idx, x, y) {
    const state = HMC.state;
    if (state.feedLocked || !state.feedRound) return;
    const r = state.feedRound;
    if (r.eatenMask[idx] || r.done) return;

    r.eatenMask[idx] = true;
    r.fed++;
    HMC.audio.SFX.crunch();
    HMC.effects.spawnFloatingWord(`🌽 ${r.fed}！`, x, y - 24, '#E85D04');

    if (r.fed >= r.target) {
      r.done = true;
      state.feedLocked = true;
      state.feedCompletedCount++;
      if (HMC.storage && HMC.storage.recordAttempt) {
        HMC.storage.recordAttempt('math_feed', true);
      }
      renderFeedSubMode(false);
      const chickEl = document.getElementById('hungryChick');
      if (chickEl) chickEl.classList.add('chomp');

      setTimeout(() => {
        if (state.mode !== 'counting' || state.mathSubMode !== 'feed' || state.feedRound !== r) return;
        HMC.audio.SFX.success();
        HMC.audio.SFX.cheep();
        HMC.effects.burstConfetti(30);
        HMC.effects.spawnFloatingWord(`❤️ 刚好 ${r.target} 颗！`, window.innerWidth / 2, window.innerHeight * 0.38, '#FF5D6C');
        HMC.effects.awardStar();
        HMC.audio.praiseWithPrompt(`哇！刚刚好 ${r.target} 颗玉米，真聪明！`, `Yum! Exactly ${r.target} corn!`);
      }, 180);

      setTimeout(() => {
        if (state.mode === 'counting' && state.mathSubMode === 'feed' && state.feedRound === r) {
          renderFeedSubMode(true);
        }
      }, 2200);
    } else {
      renderFeedSubMode(false);
      const chickEl = document.getElementById('hungryChick');
      if (chickEl) {
        chickEl.classList.remove('chomp');
        void chickEl.offsetWidth;
        chickEl.classList.add('chomp');
      }
      HMC.audio.speak(`${r.fed}`, `${r.fed}`);
      HMC.audio.setPrompt(`已经吃了 ${r.fed} 颗，还要再吃 ${r.target - r.fed} 颗哦！`, `${r.fed}! ${r.target - r.fed} more!`, false);
    }
  }

  /* ==========================================================================
     Sub-Mode 2: 📏 大小排队 (Lv.1 找小窝 + Lv.2 从小到大排排队)
     ========================================================================== */
  function createSizeRound() {
    const state = HMC.state;
    const { SIZE_TIERS_3, SIZE_TIERS_4, EGG_PALETTES, CHICK_COLORS, ACCESSORIES } = HMC.data;
    const palette = EGG_PALETTES[Math.floor(Math.random() * EGG_PALETTES.length)];

    if (state.sizeWins < 2) {
      let target = SIZE_TIERS_3[Math.floor(Math.random() * SIZE_TIERS_3.length)];
      if (state.sizeRound && state.sizeRound.kind === 'match' && state.sizeRound.target && target.id === state.sizeRound.target.id) {
        const idx = SIZE_TIERS_3.findIndex(t => t.id === target.id);
        target = SIZE_TIERS_3[(idx + 1) % SIZE_TIERS_3.length];
      }
      state.sizeRound = {
        kind: 'match',
        level: 1,
        target,
        choices: shuffleArray(SIZE_TIERS_3),
        palette,
        solved: false
      };
    } else {
      const count = state.sizeWins >= 4 ? 4 : 3;
      const tiers = count === 4 ? SIZE_TIERS_4 : SIZE_TIERS_3;
      const useChick = state.sizeWins % 2 === 1;
      const items = shuffleArray(tiers);
      // Guarantee items are not already in ascending order
      if (items.every((t, idx) => t.rank === idx)) {
        const tmp = items[0];
        items[0] = items[items.length - 1];
        items[items.length - 1] = tmp;
      }
      state.sizeRound = {
        kind: 'order',
        level: 2,
        count,
        tiers,
        items,
        useChick,
        palette,
        chickColor: CHICK_COLORS[Math.floor(Math.random() * CHICK_COLORS.length)],
        accessory: ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)],
        placed: [],
        lastPlacedIdx: -1,
        solved: false
      };
    }

    state.mathLocked = false;
    state.mathWrongCount = 0;
  }

  function renderSizeVisualItem(tier, round, isEggOverride = false) {
    const useChick = !isEggOverride && round.useChick;
    const w = useChick ? tier.chickSize : tier.eggSize;
    const h = useChick ? tier.chickSize : Math.round(tier.eggSize * 1.18);
    const svg = useChick
      ? HMC.svg.renderChickSVG({ size: tier.chickSize, bodyColor: round.chickColor, accessory: round.accessory })
      : HMC.svg.renderEggSVG({ size: tier.eggSize, base: round.palette.base, spot: round.palette.spot });
    return `<div class="size-item-visual" style="--item-w:${w}px;--item-h:${h}px;">${svg}</div>`;
  }

  function renderSizeSubMode(newRound = false) {
    const state = HMC.state;
    if (newRound || !state.sizeRound) createSizeRound();
    if (state.sizeRound.kind === 'match') renderSizeMatch(newRound);
    else renderSizeOrder(newRound);
  }

  function renderSizeMatch(newRound = false) {
    const state = HMC.state;
    const stageEl = getStage();
    const r = state.sizeRound;
    const { target, choices, palette, solved } = r;

    syncSubModeDock();
    stageEl.classList.remove('empty');

    const heroW = solved ? target.chickSize : target.eggSize;
    const heroH = solved ? target.chickSize : Math.round(target.eggSize * 1.18);
    const heroSvg = solved
      ? HMC.svg.renderChickSVG({ size: target.chickSize, bodyColor: palette.base, accessory: 'bow' })
      : HMC.svg.renderEggSVG({ size: target.eggSize, base: palette.base, spot: palette.spot });

    stageEl.innerHTML = `
      <div class="stage-level-note" aria-label="当前阶段">当前阶段 · Lv.1 找小窝</div>
      <div class="sorting-hero size-hero">
        <div class="chicken-actor ${solved ? 'celebrate' : 'idle'}" id="sizeChicken">
          ${HMC.svg.renderChickenSVG(116)}
        </div>
        <div class="featured-egg-wrap ${solved ? '' : 'bounce'}" id="featuredSizeEgg">
          <div class="size-hero-stage">
            <div class="size-item-visual" style="--item-w:${heroW}px;--item-h:${heroH}px;">
              ${heroSvg}
            </div>
          </div>
          <div class="count-chip" style="margin-top:4px;border-color:#F59F00;">
            📏 ${state.lang === 'en' ? `${target.en} Egg` : target.eggZh}
          </div>
        </div>
      </div>
      <div class="choice-row size-nest-row" id="sizeChoices"></div>
    `;

    const row = document.getElementById('sizeChoices');
    choices.forEach(tier => {
      const isWinner = solved && tier.id === target.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nest-card size-nest-card' + (isWinner ? ' correct-pop' : '');
      btn.dataset.sizeId = tier.id;
      btn.style.background = isWinner ? '#EBFBEE' : '#FFFDF6';
      btn.style.borderColor = isWinner ? '#51CF66' : '#E6A93C';

      const nestW = Math.round(104 * tier.nestScale);
      const nestH = Math.round(68 * tier.nestScale);
      const chickVisual = `<div class="size-item-visual" style="--item-w:${Math.round(tier.chickSize * 0.88)}px;--item-h:${Math.round(tier.chickSize * 0.88)}px;">${HMC.svg.renderChickSVG({ size: Math.round(tier.chickSize * 0.88), bodyColor: palette.base, accessory: 'bow' })}</div>`;
      const nestVisual = `<div class="size-nest-visual" style="--nest-w:${nestW}px;--nest-h:${nestH}px;">${HMC.svg.renderNestSVG('#F4BD50', '', tier.nestScale)}</div>`;

      btn.innerHTML = `
        <div class="size-nest-stage">
          ${isWinner ? chickVisual : nestVisual}
        </div>
        <div class="nest-label">${isWinner ? '⭐ ' : ''}${tier.nestZh}</div>
        <div class="nest-sublabel">${tier.en} Nest</div>
      `;
      if (state.mathWrongCount >= 2 && tier.id === target.id && !solved) {
        btn.classList.add('hint-glow');
      }
      btn.addEventListener('click', (e) => handleSizeNestPick(tier, btn, e.clientX, e.clientY));
      row.appendChild(btn);
    });

    HMC.effects.setupDragToTarget(document.getElementById('featuredSizeEgg'), '.size-nest-card', (card, cx, cy) => {
      const picked = choices.find(t => t.id === card.dataset.sizeId);
      if (picked) handleSizeNestPick(picked, card, cx, cy);
    });

    document.getElementById('sizeChicken').addEventListener('click', () => {
      HMC.audio.SFX.cluck();
      HMC.audio.speak(
        `帮这颗${target.eggZh}找到刚刚好的${target.nestZh}吧！`,
        `Put the ${target.en} egg in the ${target.en} nest!`
      );
    });

    if (!solved && newRound) {
      HMC.audio.setPrompt(
        `帮这颗【${target.eggZh}】找到刚刚好的【${target.nestZh}】吧！`,
        `Put the ${target.en} egg in the ${target.en} nest!`
      );
    }
  }

  function handleSizeNestPick(picked, cardEl, x, y) {
    const state = HMC.state;
    if (state.mathLocked || !state.sizeRound || state.sizeRound.kind !== 'match') return;
    const r = state.sizeRound;
    const { target } = r;
    const isCorrect = picked.id === target.id;
    if (HMC.storage && HMC.storage.recordAttempt) {
      HMC.storage.recordAttempt('math_size', isCorrect, `${target.zh}小窝`);
    }

    if (isCorrect) {
      state.mathLocked = true;
      r.solved = true;
      state.sizeWins++;
      HMC.audio.SFX.success();
      setTimeout(() => HMC.audio.SFX.cheep(), 200);
      HMC.effects.burstConfetti(28);
      HMC.effects.spawnFloatingWord(`⭐ 刚刚好！`, x, y - 24, '#FF922B');
      HMC.effects.awardStar();
      renderSizeMatch(false);
      HMC.audio.praiseWithPrompt(
        `太棒啦！${target.eggZh}住进${target.nestZh}里，刚刚好！`,
        `Perfect! The ${target.en} egg fits the ${target.en} nest!`
      );
      setTimeout(() => {
        if (state.mode === 'counting' && state.mathSubMode === 'size' && state.sizeRound === r) {
          HMC.audio.SFX.cluck();
          renderSizeSubMode(true);
        }
      }, 2050);
    } else {
      state.mathWrongCount++;
      HMC.audio.SFX.boing();
      cardEl.classList.remove('shake');
      void cardEl.offsetWidth;
      cardEl.classList.add('shake');
      const actor = document.getElementById('sizeChicken');
      if (actor) {
        actor.classList.add('tilt');
        setTimeout(() => actor.classList.remove('tilt'), 550);
      }

      if (target.rank > picked.rank) {
        HMC.effects.spawnFloatingWord(`装不下啦～`, x, y - 20, '#E85D04');
        HMC.audio.speak(
          `这颗${target.eggZh}太大啦，${picked.nestZh}装不下哦，试试更大的窝！`,
          `That ${target.en} egg is too big for the ${picked.en} nest! Try a bigger nest!`
        );
      } else {
        const zhCoach = target.id === 'small'
          ? '这颗小蛋蛋小小的，找一个小小的窝吧！'
          : `这颗${target.eggZh}小小的，${picked.nestZh}太大啦，找一个小一点的窝吧！`;
        HMC.effects.spawnFloatingWord(`窝太大啦～`, x, y - 20, '#8C6D56');
        HMC.audio.speak(
          zhCoach,
          `That ${target.en} egg is smaller! Find a smaller nest!`
        );
      }

      if (state.mathWrongCount >= 2) {
        const rightCard = document.querySelector(`.size-nest-card[data-size-id="${target.id}"]`);
        if (rightCard) rightCard.classList.add('hint-glow');
      }
    }
  }

  function renderSizeOrder(newRound = false) {
    const state = HMC.state;
    const stageEl = getStage();
    const r = state.sizeRound;
    const { count, items, placed, solved, useChick, lastPlacedIdx } = r;

    syncSubModeDock();
    stageEl.classList.remove('empty');

    const slotLabelsZh = count === 4
      ? ['① 最小', '② 小', '③ 大', '④ 最大']
      : ['① 最小', '② 中间', '③ 最大'];
    const slotLabelsEn = count === 4
      ? ['① Tiny', '② Small', '③ Big', '④ Giant']
      : ['① Smallest', '② Medium', '③ Biggest'];
    const slotLabels = state.lang === 'en' ? slotLabelsEn : slotLabelsZh;

    const slotsHtml = Array.from({ length: count }, (_, idx) => {
      const filledItem = placed[idx] || null;
      const isActive = !solved && idx === placed.length;
      const isJustPlaced = filledItem && idx === lastPlacedIdx;
      return `
        <div class="size-slot ${filledItem ? 'filled' : (isActive ? 'active-slot' : '')}" data-slot-idx="${idx}">
          <div class="size-slot-stage ${isJustPlaced ? 'pop-in' : ''}">
            ${filledItem
              ? renderSizeVisualItem(filledItem, r)
              : `<span class="size-slot-q">?</span>`
            }
          </div>
          <div class="size-slot-label">${slotLabels[idx]}</div>
        </div>
      `;
    }).join('');

    stageEl.innerHTML = `
      <div class="stage-level-note" aria-label="当前阶段">当前阶段 · Lv.2 从小到大排排队</div>
      <div class="size-order-wrap">
        <div class="chicken-actor ${solved ? 'celebrate' : 'idle'}" id="sizeChicken">
          ${HMC.svg.renderChickenSVG(96)}
        </div>
        <div class="size-order-board cols-${count}" id="sizeOrderBoard">
          ${slotsHtml}
        </div>
      </div>
      <div class="size-choice-row cols-${count}" id="sizeOrderChoices"></div>
    `;

    const expectedRank = placed.length;
    const choiceRow = document.getElementById('sizeOrderChoices');
    items.forEach(tier => {
      const isUsed = placed.some(p => p.id === tier.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'size-choice-card' + (isUsed ? ' used' : '');
      btn.dataset.rank = String(tier.rank);
      btn.dataset.sizeId = tier.id;
      btn.disabled = isUsed;
      btn.innerHTML = `
        <div class="size-choice-stage">
          ${renderSizeVisualItem(tier, r)}
        </div>
      `;
      if (!isUsed && !solved && state.mathWrongCount >= 2 && tier.rank === expectedRank) {
        btn.classList.add('hint-glow');
      }
      btn.addEventListener('click', (e) => handleSizeOrderPick(tier, btn, e.clientX, e.clientY));
      choiceRow.appendChild(btn);
    });

    const itemNounZh = useChick ? '小鸡' : '蛋蛋';
    const itemNounEn = useChick ? 'chicks' : 'eggs';
    document.getElementById('sizeChicken').addEventListener('click', () => {
      HMC.audio.SFX.cluck();
      HMC.audio.speak(
        `把${itemNounZh}从小到大排排队吧！先找最小的！`,
        `Line up the ${itemNounEn} from smallest to biggest!`
      );
    });

    if (!solved && newRound) {
      HMC.audio.setPrompt(
        `请把${itemNounZh}从【最小】到【最大】排排队吧！`,
        `Order the ${itemNounEn} from smallest to biggest!`
      );
    }
  }

  function handleSizeOrderPick(item, btnEl, x, y) {
    const state = HMC.state;
    if (state.mathLocked || !state.sizeRound || state.sizeRound.kind !== 'order') return;
    const r = state.sizeRound;
    if (r.solved || r.placed.some(p => p.id === item.id)) return;

    const expectedRank = r.placed.length;
    const isCorrect = item.rank === expectedRank;
    if (HMC.storage && HMC.storage.recordAttempt) {
      HMC.storage.recordAttempt('math_size', isCorrect, '从小到大排序');
    }
    if (isCorrect) {
      const step = r.placed.length;
      r.placed.push(item);
      r.lastPlacedIdx = step;
      state.mathWrongCount = 0;

      HMC.audio.playTone(523 + step * 110, 0.22, 'triangle', 0.24);
      const badges = ['① 最小！', '② 对啦！', '③ 很好！', '④ 最大！'];
      const word = step === r.tiers.length - 1 ? '⭐ 最大！' : badges[step];
      HMC.effects.spawnFloatingWord(word, x, y - 22, '#FF922B');

      if (r.placed.length >= r.tiers.length) {
        r.solved = true;
        state.mathLocked = true;
        state.sizeWins++;
        renderSizeOrder(false);

        setTimeout(() => {
          if (state.mode !== 'counting' || state.mathSubMode !== 'size' || state.sizeRound !== r) return;
          HMC.audio.SFX.success();
          HMC.audio.SFX.cheep();
          HMC.effects.burstConfetti(34);
          HMC.effects.awardStar();
          const praiseZh = r.count === 4
            ? '排得真整齐，从小到大一二三四！'
            : '排得真整齐，从小到大一二三！';
          const praiseEn = r.count === 4
            ? 'So neat! Smallest to biggest, one two three four!'
            : 'So neat! Smallest to biggest, one two three!';
          HMC.audio.praiseWithPrompt(praiseZh, praiseEn);
        }, 180);

        setTimeout(() => {
          if (state.mode === 'counting' && state.mathSubMode === 'size' && state.sizeRound === r) {
            HMC.audio.SFX.cluck();
            renderSizeSubMode(true);
          }
        }, 2350);
      } else {
        renderSizeOrder(false);
        HMC.audio.speak(
          `放好第 ${step + 1} 个啦，再找剩下的里面最小的！`,
          `Great! Now find the next smallest one!`
        );
      }
    } else {
      state.mathWrongCount++;
      HMC.audio.SFX.boing();
      btnEl.classList.remove('shake');
      void btnEl.offsetWidth;
      btnEl.classList.add('shake');
      const actor = document.getElementById('sizeChicken');
      if (actor) {
        actor.classList.add('tilt');
        setTimeout(() => actor.classList.remove('tilt'), 550);
      }
      HMC.effects.spawnFloatingWord(`还有更小的哦～`, x, y - 20, '#8C6D56');
      HMC.audio.speak(
        r.useChick
          ? '再仔细比一比，还有一只更小一点的哦！'
          : '再仔细比一比，还有一颗更小一点的哦！',
        'Look closely, there is a smaller one!'
      );
      if (state.mathWrongCount >= 2) {
        const rightCard = document.querySelector(`.size-choice-card[data-rank="${expectedRank}"]`);
        if (rightCard) rightCard.classList.add('hint-glow');
      }
    }
  }

  /* ==========================================================================
     Sub-Mode 3: ➕ 小加减 (Concrete Visual Addition & Subtraction)
     ========================================================================== */
  function buildMathChoices(ans, numChoices, maxVal) {
    const set = new Set([ans]);
    const offsets = Math.random() < 0.5
      ? [-1, 1, -2, 2, -3, 3, -4, 4]
      : [1, -1, 2, -2, 3, -3, 4, -4];
    for (let i = 0; i < offsets.length && set.size < numChoices; i++) {
      const v = ans + offsets[i];
      if (v >= 1 && v <= maxVal) set.add(v);
    }
    for (let v = 1; v <= Math.max(10, maxVal + 2) && set.size < numChoices; v++) {
      set.add(v);
    }
    return [...set].sort((x, y) => x - y);
  }

  function createAddSubRound() {
    const state = HMC.state;
    const { ACCESSORIES } = HMC.data;
    const w = state.addSubWins;
    const prev = state.addSubRound;

    let op = '+';
    let a = 1;
    let b = 1;
    let ans = 2;

    for (let attempt = 0; attempt < 16; attempt++) {
      if (w < 2) {
        // Addition within 5: a in [1..3], b in [1..2], a + b in [2..5]
        op = '+';
        a = 1 + Math.floor(Math.random() * 3);
        b = 1 + Math.floor(Math.random() * 2);
        ans = a + b;
      } else if (w < 4) {
        // Subtraction within 5: a in [3..5], b in [1..a-1], ans in [1..4]
        op = '-';
        a = 3 + Math.floor(Math.random() * 3);
        b = 1 + Math.floor(Math.random() * (a - 1));
        ans = a - b;
      } else {
        // Mixed Addition & Subtraction within 8: ans in [1..8]
        op = Math.random() < 0.5 ? '+' : '-';
        if (op === '+') {
          a = 1 + Math.floor(Math.random() * 5); // 1..5
          const maxB = Math.min(4, 8 - a);
          const minB = a === 1 ? 2 : 1;
          b = minB + Math.floor(Math.random() * (maxB - minB + 1));
          ans = a + b; // 3..8
        } else {
          a = 4 + Math.floor(Math.random() * 5); // 4..8
          const maxB = Math.min(5, a - 1);
          b = 1 + Math.floor(Math.random() * maxB);
          ans = a - b; // 1..7
        }
      }
      if (!prev || prev.op !== op || prev.a !== a || prev.b !== b) break;
    }

    const numChoices = w < 2 ? 3 : 4;
    const maxChoiceVal = w < 4 ? 6 : 8;
    const choices = buildMathChoices(ans, numChoices, maxChoiceVal);
    const accIdx = Math.floor(Math.random() * ACCESSORIES.length);

    state.addSubRound = {
      op,
      a,
      b,
      ans,
      choices,
      accessoryA: ACCESSORIES[accIdx],
      accessoryB: ACCESSORIES[(accIdx + 1) % ACCESSORIES.length],
      solved: false
    };
    state.mathLocked = false;
    state.mathWrongCount = 0;
  }

  function renderAddSubSubMode(newRound = false) {
    const state = HMC.state;
    const stageEl = getStage();
    if (newRound || !state.addSubRound) createAddSubRound();
    const r = state.addSubRound;

    syncSubModeDock();
    stageEl.classList.remove('empty');

    let boardHtml = '';
    if (r.op === '+') {
      const groupAChicks = Array.from({ length: r.a }, () =>
        `<div class="math-chick-sprite">${HMC.svg.renderChickSVG({ size: 54, bodyColor: '#FFE066', accessory: r.accessoryA })}</div>`
      ).join('');
      const groupBChicks = Array.from({ length: r.b }, (_, i) =>
        `<div class="math-chick-sprite chick-arriving" style="animation-delay:${(i * 0.1).toFixed(2)}s;">${HMC.svg.renderChickSVG({ size: 54, bodyColor: '#FFE8A3', accessory: r.accessoryB })}</div>`
      ).join('');

      boardHtml = `
        <div class="math-story-board math-story-add" id="mathStoryBoard" title="点一点再听一遍">
          <div class="math-groups-row">
            <div class="math-group math-group-a">
              <div class="math-chicks-cluster count-${r.a}">${groupAChicks}</div>
              <div class="math-group-tag">${r.a}${state.lang === 'en' ? '' : ' 只'}</div>
            </div>

            <div class="math-op-pill" aria-hidden="true">+</div>

            <div class="math-group math-group-b">
              <div class="math-arriving-tag">${state.lang === 'en' ? '+ More' : '✨ 又来了'}</div>
              <div class="math-chicks-cluster count-${r.b}">${groupBChicks}</div>
              <div class="math-group-tag">${r.b}${state.lang === 'en' ? '' : ' 只'}</div>
            </div>
          </div>

          <div class="math-eq-row">
            <span class="math-eq-sign">=</span>
            <div class="math-ans-slot ${r.solved ? 'solved' : ''}">
              ${r.solved ? r.ans : '?'}
            </div>
          </div>
        </div>
      `;
    } else {
      const stayCount = r.a - r.b;
      const tilesHtml = Array.from({ length: r.a }, (_, i) => {
        const isLeaving = i >= stayCount;
        if (isLeaving) {
          return `
            <div class="math-chick-tile chick-leaving">
              <div class="math-chick-sprite">${HMC.svg.renderChickSVG({ size: 52, bodyColor: '#FFF0B8', accessory: r.accessoryA })}</div>
              <span class="leaving-tag">${state.lang === 'en' ? '👋 Home' : '👋 回家'}</span>
            </div>
          `;
        }
        return `
          <div class="math-chick-tile chick-staying">
            <div class="math-chick-sprite">${HMC.svg.renderChickSVG({ size: 52, bodyColor: '#FFE066', accessory: r.accessoryA })}</div>
          </div>
        `;
      }).join('');

      boardHtml = `
        <div class="math-story-board math-story-sub" id="mathStoryBoard" title="点一点再听一遍">
          <div class="math-sub-field count-${r.a}">
            ${tilesHtml}
          </div>
          <div class="math-eq-chip ${r.solved ? 'solved' : ''}">
            <span>${r.a}</span>
            <span class="math-op-inline">−</span>
            <span>${r.b}</span>
            <span class="math-op-inline">=</span>
            <span class="math-ans-inline">${r.solved ? r.ans : '?'}</span>
          </div>
        </div>
      `;
    }

    const addSubStageLabel = state.addSubWins < 2
      ? '5以内加法'
      : (state.addSubWins < 4 ? '5以内减法' : '8以内混合');

    stageEl.innerHTML = `
      <div class="math-scene">
        <div class="stage-level-note" aria-label="当前阶段">当前阶段 · ${addSubStageLabel}</div>
        ${boardHtml}
        <div class="math-choices cols-${r.choices.length}" id="mathChoices"></div>
      </div>
    `;

    const choicesEl = document.getElementById('mathChoices');
    r.choices.forEach(val => {
      const isWinner = r.solved && val === r.ans;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'math-num-btn' + (isWinner ? ' correct-pop' : '');
      btn.dataset.val = String(val);
      const dotsHtml = Array.from({ length: val }, () => `<span class="math-dot"></span>`).join('');
      btn.innerHTML = `
        <span class="math-num-val">${val}</span>
        <div class="math-dots count-${val}" data-count="${val}" aria-hidden="true">${dotsHtml}</div>
      `;
      if (!r.solved && state.mathWrongCount >= 2 && val === r.ans) {
        btn.classList.add('hint-glow');
      }
      btn.addEventListener('click', (e) => handleAddSubPick(val, btn, e.clientX, e.clientY));
      choicesEl.appendChild(btn);
    });

    const promptZh = r.op === '+'
      ? `草地上有 ${r.a} 只小鸡，又孵出 ${r.b} 只，现在一共有几只？`
      : `草地上有 ${r.a} 只小鸡，${r.b} 只回家睡觉了，还剩几只？`;
    const promptEn = r.op === '+'
      ? `${r.a} chicks plus ${r.b} more — how many now?`
      : `${r.a} chicks, ${r.b} go home — how many left?`;

    document.getElementById('mathStoryBoard').addEventListener('click', () => {
      HMC.audio.SFX.pop();
      HMC.audio.speak(promptZh, promptEn);
    });

    if (!r.solved && newRound) {
      HMC.audio.setPrompt(promptZh, promptEn);
    }
  }

  function handleAddSubPick(val, btnEl, x, y) {
    const state = HMC.state;
    if (state.mathLocked || !state.addSubRound) return;
    const r = state.addSubRound;
    if (r.solved) return;
    const isCorrect = val === r.ans;
    if (HMC.storage && HMC.storage.recordAttempt) {
      HMC.storage.recordAttempt('math_addsub', isCorrect, r.op === '+' ? '小加法' : '小减法');
    }

    if (isCorrect) {
      state.mathLocked = true;
      r.solved = true;
      state.addSubWins++;
      HMC.audio.SFX.success();
      setTimeout(() => HMC.audio.SFX.cheep(), 200);
      HMC.effects.burstConfetti(32);
      HMC.effects.spawnFloatingWord(`⭐ 等于 ${r.ans}！`, x, y - 24, '#51CF66');
      HMC.effects.awardStar();
      renderAddSubSubMode(false);
      HMC.audio.praiseWithPrompt(
        `答对啦！${r.a} ${r.op === '+' ? '加' : '减'} ${r.b} 等于 ${r.ans}！`,
        `Correct! ${r.a} ${r.op === '+' ? 'plus' : 'minus'} ${r.b} equals ${r.ans}!`
      );
      setTimeout(() => {
        if (state.mode === 'counting' && state.mathSubMode === 'addsub' && state.addSubRound === r) {
          HMC.audio.SFX.cluck();
          renderAddSubSubMode(true);
        }
      }, 2200);
    } else {
      state.mathWrongCount++;
      HMC.audio.SFX.boing();
      btnEl.classList.remove('shake');
      void btnEl.offsetWidth;
      btnEl.classList.add('shake');
      HMC.effects.spawnFloatingWord(`再数一数哦～`, x, y - 20, '#8C6D56');
      HMC.audio.speak(
        '没关系，我们一起数一数草地上现在有几只小鸡吧！',
        'No worries, let us count the chicks on the grass together!'
      );
      if (state.mathWrongCount >= 2) {
        const rightBtn = document.querySelector(`.math-num-btn[data-val="${r.ans}"]`);
        if (rightBtn) rightBtn.classList.add('hint-glow');
      }
    }
  }

  /* ==========================================================================
     Main Math Mode Router (Compatible with HMC.modes.math.renderCountingMode)
     ========================================================================== */
  function renderCountingMode(newRound = false) {
    const stageEl = getStage();
    stageEl.classList.remove('empty');
    const sub = HMC.state.mathSubMode || 'feed';
    if (sub === 'size') renderSizeSubMode(newRound);
    else if (sub === 'addsub') renderAddSubSubMode(newRound);
    else renderFeedSubMode(newRound);
  }

  HMC.modes = HMC.modes || {};
  HMC.modes.math = {
    syncSubModeDock,
    createFeedRound,
    renderFeedSubMode,
    handleFeedCorn,
    createSizeRound,
    renderSizeSubMode,
    renderSizeMatch,
    handleSizeNestPick,
    renderSizeOrder,
    handleSizeOrderPick,
    createAddSubRound,
    renderAddSubSubMode,
    handleAddSubPick,
    renderCountingMode,
    renderMathMode: renderCountingMode
  };
  HMC.modes.counting = HMC.modes.math;
})(window.HMC = window.HMC || {});
