(function (HMC) {
  'use strict';

  const COLOR_SUB_ITEMS = [
    { id: 'basic',   label: '🥚 基础配对' },
    { id: 'mix',     label: '🎨 调色魔法' },
    { id: 'pattern', label: '🚂 规律火车' }
  ];

  function getStage() {
    return document.getElementById('gameStage');
  }

  function syncSubModeDock() {
    const state = HMC.state;
    const sub = state.colorSubMode;

    HMC.effects.renderSubModeDock(
      COLOR_SUB_ITEMS,
      sub,
      (nextSub) => {
        state.colorSubMode = nextSub;
        state.colorLocked = false;
        HMC.audio.SFX.pop();
        renderColorMode(true);
      }
    );
  }

  function createBasicColorRound() {
    const { BASIC_COLOR_IDS, COLOR_BY_ID } = HMC.data;
    const state = HMC.state;
    const pool = BASIC_COLOR_IDS.map(id => COLOR_BY_ID[id]).sort(() => Math.random() - 0.5);
    const choices = pool.slice(0, 3);
    const target = choices[Math.floor(Math.random() * choices.length)];
    state.colorBasicRound = { target, choices, hatched: false };
    state.colorLocked = false;
    state.colorWrongCount = 0;
  }

  function createColorMixRound() {
    const { MIX_RECIPES, COLOR_BY_ID } = HMC.data;
    const state = HMC.state;
    let recipe = MIX_RECIPES[Math.floor(Math.random() * MIX_RECIPES.length)];
    if (state.colorMixRound && recipe.result === state.colorMixRound.recipe.result) {
      recipe = MIX_RECIPES[(MIX_RECIPES.indexOf(recipe) + 1) % MIX_RECIPES.length];
    }
    const level = state.colorMixWins >= 2 ? 2 : 1;
    const givenIdx = Math.floor(Math.random() * 2);
    const slot1 = level === 1 ? recipe.pair[givenIdx] : null;
    state.colorMixRound = {
      recipe,
      target: COLOR_BY_ID[recipe.result],
      level,
      slot1,
      slot2: null,
      previewMix: null,
      solved: false
    };
    state.colorLocked = false;
    state.colorWrongCount = 0;
  }

  function createColorPatternRound() {
    const { COLOR_BY_ID } = HMC.data;
    const state = HMC.state;
    const pool = ['red', 'yellow', 'blue', 'green', 'pink', 'purple', 'orange'].sort(() => Math.random() - 0.5);
    const [a, b, c] = pool;
    const w = state.colorPatternWins;
    let seq, missingIdx, kind;
    if (w < 2) {
      seq = [a, b, a, b, a];
      missingIdx = 4;
      kind = 'ABAB';
    } else if (w < 4) {
      seq = [a, b, c, a, b, c];
      missingIdx = 5;
      kind = 'ABC';
    } else if (w < 6) {
      seq = [a, a, b, b, a, a];
      missingIdx = 4;
      kind = 'AABB';
    } else {
      // Missing middle car!
      if (Math.random() < 0.5) {
        seq = [a, b, a, b, a];
        missingIdx = 3;
        kind = 'MID_AB';
      } else {
        seq = [a, b, c, a, b, c];
        missingIdx = 3;
        kind = 'MID_ABC';
      }
    }
    const answerId = seq[missingIdx];
    const usedUnique = [...new Set(seq)];
    const extraPool = pool.filter(id => !usedUnique.includes(id));
    const choiceIds = [...usedUnique];
    while (choiceIds.length < Math.min(4, Math.max(3, usedUnique.length + 1)) && extraPool.length) {
      choiceIds.push(extraPool.shift());
    }
    choiceIds.sort(() => Math.random() - 0.5);

    state.colorPatternRound = {
      seq,
      missingIdx,
      answer: COLOR_BY_ID[answerId],
      choices: choiceIds.map(id => COLOR_BY_ID[id]),
      kind,
      solved: false
    };
    state.colorLocked = false;
    state.colorWrongCount = 0;
  }

  function renderColorMode(newRound = false) {
    const stageEl = getStage();
    stageEl.classList.remove('empty');
    if (HMC.state.colorSubMode === 'basic') renderBasicColorSubMode(newRound);
    else if (HMC.state.colorSubMode === 'mix') renderColorMixSubMode(newRound);
    else renderColorPatternSubMode(newRound);
  }

  function renderBasicColorSubMode(newRound = false) {
    const state = HMC.state;
    const stageEl = getStage();
    if (newRound || !state.colorBasicRound) createBasicColorRound();
    const { target, choices, hatched } = state.colorBasicRound;

    syncSubModeDock();

    stageEl.innerHTML = `
      <div class="sorting-hero">
        <div class="chicken-actor ${hatched ? 'celebrate' : 'idle'}" id="colorChicken">
          ${HMC.svg.renderChickenSVG(126)}
        </div>
        <div class="featured-egg-wrap ${hatched ? '' : 'bounce'}" id="featuredColorEgg">
          ${hatched
            ? HMC.svg.renderChickSVG({ size: 102, bodyColor: target.light, accessory: 'bow' })
            : HMC.svg.renderEggSVG({ size: 88, base: target.fill, spot: target.light })
          }
          <div class="count-chip" style="margin-top:4px;border-color:${target.fill};">
            ${target.icon} ${state.lang === 'en' ? target.en : target.zh}
          </div>
        </div>
      </div>
      <div class="choice-row" id="colorChoices"></div>
    `;

    const row = document.getElementById('colorChoices');
    choices.forEach(c => {
      const isWinner = hatched && c.id === target.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nest-card' + (isWinner ? ' correct-pop' : '');
      btn.dataset.colorId = c.id;
      btn.style.background = c.nestBg;
      btn.style.borderColor = c.fill;
      btn.innerHTML = `
        ${isWinner
          ? HMC.svg.renderChickSVG({ size: 78, bodyColor: target.light, accessory: 'bow' })
          : HMC.svg.renderNestSVG(c.fill, c.icon)
        }
        <div class="nest-label">${isWinner ? '⭐ ' : ''}${c.zh}</div>
        <div class="nest-sublabel">${c.en}</div>
      `;
      btn.addEventListener('click', (e) => handleBasicColorPick(c, btn, e.clientX, e.clientY));
      row.appendChild(btn);
    });

    HMC.effects.setupDragToTarget(document.getElementById('featuredColorEgg'), '.nest-card', (card, cx, cy) => {
      const picked = choices.find(c => c.id === card.dataset.colorId);
      if (picked) handleBasicColorPick(picked, card, cx, cy);
    });

    document.getElementById('colorChicken').addEventListener('click', () => {
      HMC.audio.SFX.cluck();
      HMC.audio.speak(`把${target.zh}的蛋，放到${target.zh}的窝里吧！`, `Put the ${target.en} egg in the ${target.en} nest!`);
    });

    if (!hatched && newRound) {
      HMC.audio.setPrompt(`把【${target.zh}】的蛋，放到${target.zh}的窝里吧！`, `Find the ${target.en} nest!`);
    }
  }

  function handleBasicColorPick(picked, cardEl, x, y) {
    const state = HMC.state;
    if (state.colorLocked || !state.colorBasicRound) return;
    const { target } = state.colorBasicRound;
    const isCorrect = picked.id === target.id;
    if (HMC.storage && HMC.storage.recordAttempt) {
      HMC.storage.recordAttempt('color_basic', isCorrect, target.zh);
    }
    if (isCorrect) {
      state.colorLocked = true;
      state.colorBasicRound.hatched = true;
      HMC.audio.SFX.success();
      setTimeout(() => HMC.audio.SFX.cheep(), 200);
      HMC.effects.burstConfetti(26);
      HMC.effects.spawnFloatingWord(`⭐ 答对啦！${target.zh}`, x, y - 24, target.fill);
      HMC.effects.awardStar();
      renderBasicColorSubMode(false);
      HMC.audio.praiseWithPrompt(`真棒！这就是【${target.zh}】！`, `Great job! ${target.en}!`);
      setTimeout(() => {
        if (state.mode === 'colors' && state.colorSubMode === 'basic') {
          HMC.audio.SFX.cluck();
          renderBasicColorSubMode(true);
        }
      }, 1950);
    } else {
      state.colorWrongCount++;
      HMC.audio.SFX.boing();
      cardEl.classList.remove('shake');
      void cardEl.offsetWidth;
      cardEl.classList.add('shake');
      const actor = document.getElementById('colorChicken');
      if (actor) { actor.classList.add('tilt'); setTimeout(() => actor.classList.remove('tilt'), 550); }
      HMC.effects.spawnFloatingWord(`这是${picked.zh}哦`, x, y - 20, '#8C6D56');
      HMC.audio.speak(`这是${picked.zh}的窝哦，再找找${target.zh}吧！`, `That is ${picked.en}. Find ${target.en}!`);
      if (state.colorWrongCount >= 2) {
        const rightCard = document.querySelector(`.nest-card[data-color-id="${target.id}"]`);
        if (rightCard) rightCard.classList.add('hint-glow');
      }
    }
  }

  function renderColorMixSubMode(newRound = false) {
    const { COLOR_BY_ID, BASE_PAINTS } = HMC.data;
    const state = HMC.state;
    const stageEl = getStage();
    if (newRound || !state.colorMixRound) createColorMixRound();
    const r = state.colorMixRound;
    const c1 = r.slot1 ? COLOR_BY_ID[r.slot1] : null;
    const c2 = r.slot2 ? COLOR_BY_ID[r.slot2] : null;

    syncSubModeDock();

    const mixLevelLabel = state.colorMixWins >= 2 ? 'Lv.2 自由调色' : 'Lv.1 配色进阶';

    stageEl.innerHTML = `
      <div class="stage-level-note" aria-label="当前难度">当前难度 · ${mixLevelLabel}</div>
      <div class="sorting-hero" style="gap:12px;">
        <div class="chicken-actor ${r.solved ? 'celebrate' : 'idle'}" id="colorChicken">
          ${HMC.svg.renderChickenSVG(108)}
        </div>
        <div class="mix-board">
          <div class="mix-slot ${c1 ? 'filled' : 'pulse-slot'}" id="mixSlot1" title="${r.level === 2 && c1 ? '点一下可重新选' : ''}">
            ${c1 ? HMC.svg.renderEggSVG({ size: 46, base: c1.fill, spot: c1.light }) : '?'}
          </div>
          <div class="mix-op">+</div>
          <div class="mix-slot ${c2 ? 'filled' : (!c1 ? '' : 'pulse-slot')}" id="mixSlot2">
            ${c2 ? HMC.svg.renderEggSVG({ size: 46, base: c2.fill, spot: c2.light }) : '?'}
          </div>
          <div class="mix-op">=</div>
          <div style="display:flex;flex-direction:column;align-items:center;">
            ${r.solved
              ? HMC.svg.renderChickSVG({ size: 78, bodyColor: r.target.fill, accessory: 'crown' })
              : HMC.svg.renderEggSVG({ size: 60, base: r.target.fill, spot: r.target.light })
            }
            <div class="count-chip" style="font-size:13px;padding:2px 10px;border-color:${r.target.fill};">
              ${r.target.icon} ${state.lang === 'en' ? r.target.en : r.target.zh}
            </div>
          </div>
        </div>
      </div>

      ${r.previewMix ? `<div class="mix-preview-toast">✨ ${COLOR_BY_ID[r.previewMix.a].zh} + ${COLOR_BY_ID[r.previewMix.b].zh} = ${r.previewMix.res.icon} ${r.previewMix.res.zh}！再试试变出${r.target.zh}吧</div>` : ''}

      <div class="choice-grid-4" id="mixPaintChoices"></div>
    `;

    const slot1El = document.getElementById('mixSlot1');
    if (slot1El && r.level === 2 && r.slot1 && !r.solved && !state.colorLocked) {
      slot1El.addEventListener('click', () => {
        HMC.audio.SFX.pop();
        r.slot1 = null;
        r.slot2 = null;
        renderColorMixSubMode(false);
      });
    }

    const grid = document.getElementById('mixPaintChoices');
    BASE_PAINTS.forEach(pid => {
      const c = COLOR_BY_ID[pid];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nest-card card-compact';
      btn.dataset.paintId = pid;
      btn.style.background = c.nestBg;
      btn.style.borderColor = pid === 'white' ? '#ADB5BD' : c.fill;
      btn.innerHTML = `
        ${HMC.svg.renderEggSVG({ size: 54, base: c.fill, spot: c.light })}
        <div class="nest-label" style="font-size:16px;">${c.zh}</div>
        <div class="nest-sublabel">${c.en}</div>
      `;
      if (state.colorWrongCount >= 2 && r.recipe.pair.includes(pid) && pid !== r.slot1) {
        btn.classList.add('hint-glow');
      }
      btn.addEventListener('click', (e) => handleMixPaintPick(pid, btn, e.clientX, e.clientY));
      grid.appendChild(btn);
    });

    document.getElementById('colorChicken').addEventListener('click', () => {
      HMC.audio.SFX.cluck();
      HMC.audio.speak(state.lastPromptZh, state.lastPromptEn);
    });

    if (newRound) {
      if (r.level === 1) {
        const c1Obj = COLOR_BY_ID[r.slot1];
        HMC.audio.setPrompt(
          `调色魔法：${c1Obj.zh}加什么颜色，能变出【${r.target.zh}】蛋？`,
          `${c1Obj.en} plus what color makes ${r.target.en}?`
        );
      } else {
        HMC.audio.setPrompt(
          `魔法挑战！选两种颜色合在一起，变出【${r.target.zh}】蛋吧！`,
          `Pick 2 colors to mix ${r.target.en}!`
        );
      }
    }
  }

  function handleMixPaintPick(paintId, btnEl, x, y) {
    const { COLOR_BY_ID, getMixResult } = HMC.data;
    const state = HMC.state;
    if (state.colorLocked || !state.colorMixRound) return;
    const r = state.colorMixRound;
    r.previewMix = null;

    if (!r.slot1) {
      r.slot1 = paintId;
      HMC.audio.SFX.pop();
      const c = COLOR_BY_ID[paintId];
      HMC.effects.spawnFloatingWord(`+${c.zh}`, x, y - 20, paintId === 'white' ? '#6C757D' : c.fill);
      renderColorMixSubMode(false);
      HMC.audio.speak(`放进了${c.zh}，再选第二种颜色吧！`, `${c.en}! Pick one more color!`);
      return;
    }

    r.slot2 = paintId;
    const mixed = getMixResult(r.slot1, r.slot2);
    const cA = COLOR_BY_ID[r.slot1];
    const cB = COLOR_BY_ID[r.slot2];
    const isCorrect = mixed.id === r.target.id;
    if (HMC.storage && HMC.storage.recordAttempt) {
      HMC.storage.recordAttempt('color_mix', isCorrect, `${r.target.zh}调配`);
    }

    if (isCorrect) {
      state.colorLocked = true;
      r.solved = true;
      state.colorMixWins++;
      HMC.audio.SFX.success();
      setTimeout(() => HMC.audio.SFX.cheep(), 200);
      HMC.effects.burstConfetti(32);
      HMC.effects.spawnFloatingWord(`✨ 变出${r.target.zh}啦！`, x, y - 24, r.target.fill);
      HMC.effects.awardStar();
      renderColorMixSubMode(false);
      HMC.audio.praiseWithPrompt(
        `太厉害啦！${cA.zh}加${cB.zh}，真的变出了【${r.target.zh}】！`,
        `Magic! ${cA.en} and ${cB.en} make ${r.target.en}!`
      );
      setTimeout(() => {
        if (state.mode === 'colors' && state.colorSubMode === 'mix') {
          HMC.audio.SFX.cluck();
          renderColorMixSubMode(true);
        }
      }, 2350);
    } else {
      state.colorLocked = true;
      state.colorWrongCount++;
      r.previewMix = { a: r.slot1, b: r.slot2, res: mixed };
      HMC.audio.SFX.boing();
      renderColorMixSubMode(false);
      const actor = document.getElementById('colorChicken');
      if (actor) { actor.classList.add('tilt'); setTimeout(() => actor.classList.remove('tilt'), 550); }
      HMC.effects.spawnFloatingWord(`变成${mixed.zh}啦！`, x, y - 22, mixed.id === 'white' ? '#6C757D' : mixed.fill);
      HMC.audio.speak(
        `哇，${cA.zh}加${cB.zh}变成了${mixed.zh}哦！我们要变出${r.target.zh}，再试一次吧！`,
        `${cA.en} and ${cB.en} make ${mixed.en}! Let us try to make ${r.target.en}!`
      );
      setTimeout(() => {
        if (state.mode === 'colors' && state.colorSubMode === 'mix' && !r.solved) {
          if (r.level === 2) r.slot1 = null;
          r.slot2 = null;
          state.colorLocked = false;
          renderColorMixSubMode(false);
        }
      }, 1450);
    }
  }

  function renderColorPatternSubMode(newRound = false) {
    const { COLOR_BY_ID } = HMC.data;
    const state = HMC.state;
    const stageEl = getStage();
    if (newRound || !state.colorPatternRound) createColorPatternRound();
    const r = state.colorPatternRound;

    syncSubModeDock();

    const carsHtml = r.seq.map((cid, idx) => {
      const isMiss = idx === r.missingIdx;
      const col = COLOR_BY_ID[cid];
      if (isMiss && !r.solved) {
        return `<div class="train-car missing">?</div>`;
      }
      return `
        <div class="train-car ${r.solved ? 'solved' : ''}">
          ${HMC.svg.renderEggSVG({ size: 40, base: col.fill, spot: col.light })}
        </div>
      `;
    }).join('');

    const patternLevelLabel = state.colorPatternWins >= 4
      ? 'Lv.3 推理挑战'
      : (state.colorPatternWins >= 2 ? 'Lv.2 进阶' : 'Lv.1 入门');

    stageEl.innerHTML = `
      <div class="stage-level-note" aria-label="当前难度">当前难度 · ${patternLevelLabel}</div>
      <div class="sorting-hero" style="gap:10px;">
        <div class="chicken-actor ${r.solved ? 'celebrate' : 'idle'}" id="colorChicken">
          ${HMC.svg.renderChickenSVG(98)}
        </div>
        <div class="pattern-train">${carsHtml}</div>
      </div>
      <div class="${r.choices.length === 4 ? 'choice-grid-4' : 'choice-row'}" id="patternChoices"></div>
    `;

    const grid = document.getElementById('patternChoices');
    r.choices.forEach(c => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nest-card card-compact' + (r.solved && c.id === r.answer.id ? ' correct-pop' : '');
      btn.dataset.colorId = c.id;
      btn.style.background = c.nestBg;
      btn.style.borderColor = c.fill;
      btn.innerHTML = `
        ${HMC.svg.renderEggSVG({ size: 54, base: c.fill, spot: c.light })}
        <div class="nest-label" style="font-size:16px;">${c.zh}</div>
        <div class="nest-sublabel">${c.en}</div>
      `;
      if (state.colorWrongCount >= 2 && c.id === r.answer.id) btn.classList.add('hint-glow');
      btn.addEventListener('click', (e) => handlePatternPick(c, btn, e.clientX, e.clientY));
      grid.appendChild(btn);
    });

    const seqZh = r.seq.map((cid, i) => i === r.missingIdx ? '什么呀' : COLOR_BY_ID[cid].zh.replace('色', '')).join('、');
    const seqEn = r.seq.map((cid, i) => i === r.missingIdx ? 'what' : COLOR_BY_ID[cid].en).join(', ');
    document.getElementById('colorChicken').addEventListener('click', () => {
      HMC.audio.SFX.cluck();
      HMC.audio.speak(`听规律哦：${seqZh}？`, `Look at the pattern: ${seqEn}?`);
    });

    if (newRound) {
      HMC.audio.setPrompt(`找规律：${seqZh}？问号该放什么颜色？`, `Pattern: ${seqEn}?`);
    }
  }

  function handlePatternPick(picked, btnEl, x, y) {
    const { COLOR_BY_ID } = HMC.data;
    const state = HMC.state;
    if (state.colorLocked || !state.colorPatternRound) return;
    const r = state.colorPatternRound;
    const isCorrect = picked.id === r.answer.id;
    if (HMC.storage && HMC.storage.recordAttempt) {
      HMC.storage.recordAttempt('color_pattern', isCorrect, `规律推理(${r.answer.zh})`);
    }

    if (isCorrect) {
      state.colorLocked = true;
      r.solved = true;
      state.colorPatternWins++;
      HMC.audio.SFX.success();
      setTimeout(() => HMC.audio.SFX.cheep(), 200);
      HMC.effects.burstConfetti(30);
      HMC.effects.spawnFloatingWord(`🚂 对啦！${r.answer.zh}`, x, y - 24, r.answer.fill);
      HMC.effects.awardStar();
      renderColorPatternSubMode(false);
      HMC.audio.praiseWithPrompt(`真聪明！规律接龙成功，问号就是【${r.answer.zh}】！`, `Awesome! The missing color is ${r.answer.en}!`);
      setTimeout(() => {
        if (state.mode === 'colors' && state.colorSubMode === 'pattern') {
          HMC.audio.SFX.cluck();
          renderColorPatternSubMode(true);
        }
      }, 2200);
    } else {
      state.colorWrongCount++;
      HMC.audio.SFX.boing();
      btnEl.classList.remove('shake');
      void btnEl.offsetWidth;
      btnEl.classList.add('shake');
      const actor = document.getElementById('colorChicken');
      if (actor) { actor.classList.add('tilt'); setTimeout(() => actor.classList.remove('tilt'), 550); }
      HMC.effects.spawnFloatingWord(`再看看规律～`, x, y - 20, '#8C6D56');
      const seqZh = r.seq.map((cid, i) => i === r.missingIdx ? '空着' : COLOR_BY_ID[cid].zh.replace('色', '')).join('、');
      HMC.audio.speak(`不是${picked.zh}哦，再一起念一遍：${seqZh}！`, `Not ${picked.en}. Look at the pattern again!`);
      if (state.colorWrongCount >= 2) {
        const rightCard = document.querySelector(`.nest-card[data-color-id="${r.answer.id}"]`);
        if (rightCard) rightCard.classList.add('hint-glow');
      }
    }
  }

  HMC.modes = HMC.modes || {};
  HMC.modes.colors = {
    syncSubModeDock,
    createBasicColorRound,
    createColorMixRound,
    createColorPatternRound,
    renderColorMode,
    renderBasicColorSubMode,
    handleBasicColorPick,
    renderColorMixSubMode,
    handleMixPaintPick,
    renderColorPatternSubMode,
    handlePatternPick
  };
})(window.HMC = window.HMC || {});
