(function (HMC) {
  'use strict';

  const SHAPE_SUB_ITEMS = [
    { id: 'basic', label: '🥚 基础' },
    { id: 'clue',  label: '🕵️ 线索' },
    { id: 'build', label: '🧩 拼图' },
    { id: 'odd',   label: '🔎 找不同' }
  ];

  function getStage() {
    return document.getElementById('gameStage');
  }

  function syncSubModeDock() {
    const state = HMC.state;
    const sub = state.shapeSubMode;

    HMC.effects.renderSubModeDock(
      SHAPE_SUB_ITEMS,
      sub,
      (nextSub) => {
        if (HMC.audio && typeof HMC.audio.cancelPendingTransitions === 'function') {
          HMC.audio.cancelPendingTransitions();
        }
        state.shapeSubMode = nextSub;
        state.shapeLocked = false;
        HMC.audio.SFX.pop();
        renderShapeMode(true);
      }
    );
  }

  function createBasicShapeRound() {
    const { BASIC_SHAPE_IDS, SHAPE_BY_ID } = HMC.data;
    const state = HMC.state;
    const pool = BASIC_SHAPE_IDS.map(id => SHAPE_BY_ID[id]).sort(() => Math.random() - 0.5);
    const choices = pool.slice(0, 3);
    const target = choices[Math.floor(Math.random() * choices.length)];
    state.shapeBasicRound = { target, choices, hatched: false };
    state.shapeLocked = false;
    state.shapeWrongCount = 0;
  }

  function createShapeClueRound() {
    const { ADV_SHAPE_IDS, COLOR_BY_ID, SHAPE_BY_ID } = HMC.data;
    const state = HMC.state;
    const colorPool = ['red', 'yellow', 'blue', 'green', 'pink', 'purple'].sort(() => Math.random() - 0.5);
    const shapePool = [...ADV_SHAPE_IDS].sort(() => Math.random() - 0.5);
    const useSize = state.shapeClueWins >= 2;
    const targetColor = COLOR_BY_ID[colorPool[0]];
    const wrongColor = COLOR_BY_ID[colorPool[1]];
    const wrongColor2 = COLOR_BY_ID[colorPool[2]];
    const targetShape = SHAPE_BY_ID[shapePool[0]];
    const wrongShape = SHAPE_BY_ID[shapePool[1]];
    const wrongShape2 = SHAPE_BY_ID[shapePool[2]];
    const targetSize = useSize ? (Math.random() < 0.5 ? 'big' : 'small') : 'big';
    const otherSize = targetSize === 'big' ? 'small' : 'big';

    const candidates = [
      { id: 'hit', color: targetColor, shape: targetShape, size: targetSize, correct: true },
      { id: 'w-col', color: wrongColor, shape: targetShape, size: targetSize, correct: false },
      { id: 'w-shp', color: targetColor, shape: wrongShape, size: targetSize, correct: false },
      useSize
        ? { id: 'w-siz', color: targetColor, shape: targetShape, size: otherSize, correct: false }
        : { id: 'w-both', color: wrongColor2, shape: wrongShape2, size: targetSize, correct: false }
    ].sort(() => Math.random() - 0.5);

    state.shapeClueRound = {
      useSize,
      targetColor,
      targetShape,
      targetSize,
      candidates,
      solved: false
    };
    state.shapeLocked = false;
    state.shapeWrongCount = 0;
  }

  function createShapeBuildRound() {
    const { BLUEPRINTS, SHAPES, SHAPE_BY_ID } = HMC.data;
    const state = HMC.state;
    let bp = BLUEPRINTS[Math.floor(Math.random() * BLUEPRINTS.length)];
    if (state.shapeBuildRound && bp.id === state.shapeBuildRound.bp.id) {
      bp = BLUEPRINTS[(BLUEPRINTS.indexOf(bp) + 1) % BLUEPRINTS.length];
    }
    const neededIds = [...new Set(bp.parts.map(p => p.shape))];
    const distractorPool = SHAPES.map(s => s.id).filter(id => !neededIds.includes(id)).sort(() => Math.random() - 0.5);
    const choiceIds = [...neededIds];
    while (choiceIds.length < Math.min(5, neededIds.length + 2) && distractorPool.length) {
      choiceIds.push(distractorPool.shift());
    }
    choiceIds.sort(() => Math.random() - 0.5);

    state.shapeBuildRound = {
      bp,
      filledMask: bp.parts.map(() => false),
      choices: choiceIds.map(id => SHAPE_BY_ID[id]),
      solved: false
    };
    state.shapeLocked = false;
    state.shapeWrongCount = 0;
  }

  function createShapeOddRound() {
    const { ADV_SHAPE_IDS, SHAPE_BY_ID, COLOR_BY_ID } = HMC.data;
    const state = HMC.state;
    const shapePool = [...ADV_SHAPE_IDS].sort(() => Math.random() - 0.5);
    const commonShape = SHAPE_BY_ID[shapePool[0]];
    const oddShape = SHAPE_BY_ID[shapePool[1]];
    const colPool = ['red', 'yellow', 'blue', 'green', 'pink', 'purple', 'orange'].sort(() => Math.random() - 0.5);
    // Deliberately give the 3 matching shapes 3 DIFFERENT colors, and give the odd shape one of those same colors!
    const items = [
      { id: 'c1', shape: commonShape, color: COLOR_BY_ID[colPool[0]], isOdd: false },
      { id: 'c2', shape: commonShape, color: COLOR_BY_ID[colPool[1]], isOdd: false },
      { id: 'c3', shape: commonShape, color: COLOR_BY_ID[colPool[2]], isOdd: false },
      { id: 'odd', shape: oddShape, color: COLOR_BY_ID[colPool[0]], isOdd: true }
    ].sort(() => Math.random() - 0.5);

    state.shapeOddRound = { commonShape, oddShape, items, solved: false };
    state.shapeLocked = false;
    state.shapeWrongCount = 0;
  }

  function renderShapeMode(newRound = false) {
    const stageEl = getStage();
    stageEl.classList.remove('empty');
    const sub = HMC.state.shapeSubMode;
    if (sub === 'basic') renderBasicShapeSubMode(newRound);
    else if (sub === 'clue') renderShapeClueSubMode(newRound);
    else if (sub === 'build') renderShapeBuildSubMode(newRound);
    else renderShapeOddSubMode(newRound);
  }

  function renderBasicShapeSubMode(newRound = false) {
    const state = HMC.state;
    const stageEl = getStage();
    if (newRound || !state.shapeBasicRound) createBasicShapeRound();
    const { target, choices, hatched } = state.shapeBasicRound;

    syncSubModeDock();

    stageEl.innerHTML = `
      <div class="sorting-hero">
        <div class="chicken-actor ${hatched ? 'celebrate' : 'idle'}" id="shapeChicken">
          ${HMC.svg.renderChickenSVG(126)}
        </div>
        <div class="featured-egg-wrap ${hatched ? '' : 'bounce'}" id="featuredShapeEgg">
          ${hatched
            ? HMC.svg.renderChickSVG({ size: 106, bodyColor: '#FFE066', accessory: 'crown', balloonShape: target.id, balloonColor: target.color })
            : HMC.svg.renderEggSVG({ size: 88, base: '#FFFDF5', shape: target.id, shapeColor: target.color })
          }
          <div class="count-chip" style="margin-top:4px;border-color:${target.color};">
            ${state.lang === 'en' ? target.en : target.zh}
          </div>
        </div>
      </div>
      <div class="choice-row" id="shapeChoices"></div>
    `;

    const row = document.getElementById('shapeChoices');
    choices.forEach(s => {
      const isWinner = hatched && s.id === target.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nest-card' + (isWinner ? ' correct-pop' : '');
      btn.dataset.shapeId = s.id;
      btn.style.background = s.bg;
      btn.style.borderColor = s.color;
      btn.innerHTML = `
        ${isWinner
          ? HMC.svg.renderChickSVG({ size: 78, bodyColor: '#FFE066', accessory: 'crown', balloonShape: s.id, balloonColor: s.color })
          : `<svg width="76" height="68" viewBox="0 0 90 80" fill="none">${HMC.svg.renderShapePath(s.id, 45, 40, 48, s.color)}</svg>`
        }
        <div class="nest-label">${isWinner ? '⭐ ' : ''}${s.zh}</div>
        <div class="nest-sublabel">${s.en}</div>
      `;
      btn.addEventListener('click', (e) => handleBasicShapePick(s, btn, e.clientX, e.clientY));
      row.appendChild(btn);
    });

    HMC.effects.setupDragToTarget(document.getElementById('featuredShapeEgg'), '.nest-card', (card, cx, cy) => {
      const picked = choices.find(s => s.id === card.dataset.shapeId);
      if (picked) handleBasicShapePick(picked, card, cx, cy);
    });

    document.getElementById('shapeChicken').addEventListener('click', () => {
      HMC.audio.SFX.cluck();
      HMC.audio.speak(`找一找一样的${target.zh}吧！`, `Find the matching ${target.en}!`);
    });

    if (!hatched && newRound) {
      HMC.audio.setPrompt(`找找一样的【${target.zh}】在哪里？`, `Can you find the ${target.en}?`);
    }
  }

  function handleBasicShapePick(picked, cardEl, x, y) {
    const state = HMC.state;
    if (state.shapeLocked || !state.shapeBasicRound) return;
    const { target } = state.shapeBasicRound;
    const isCorrect = picked.id === target.id;
    if (HMC.storage && HMC.storage.recordAttempt) {
      HMC.storage.recordAttempt('shape_basic', isCorrect, target.zh);
    }
    if (isCorrect) {
      const roundRef = state.shapeBasicRound;
      state.shapeLocked = true;
      roundRef.hatched = true;
      HMC.audio.SFX.success();
      setTimeout(() => HMC.audio.SFX.cheep(), 200);
      HMC.effects.burstConfetti(26);
      HMC.effects.spawnFloatingWord(`⭐ 是${target.zh}！`, x, y - 24, target.color);
      const isParty = HMC.effects.awardStar();
      renderBasicShapeSubMode(false);
      const praiseZh = `答对啦！这是【${target.zh}】！`;
      const praiseEn = `Yes! It is a ${target.en}!`;
      if (isParty) HMC.audio.setPrompt(praiseZh, praiseEn, false);
      else HMC.audio.praiseWithPrompt(praiseZh, praiseEn);
      HMC.audio.waitForSpeechThen(
        1200,
        () => {
          HMC.audio.SFX.cluck();
          renderBasicShapeSubMode(true);
        },
        () => state.mode === 'shapes' && state.shapeSubMode === 'basic' && state.shapeBasicRound === roundRef
      );
    } else {
      state.shapeWrongCount++;
      HMC.audio.SFX.boing();
      cardEl.classList.remove('shake');
      void cardEl.offsetWidth;
      cardEl.classList.add('shake');
      const actor = document.getElementById('shapeChicken');
      if (actor) { actor.classList.add('tilt'); setTimeout(() => actor.classList.remove('tilt'), 550); }
      HMC.effects.spawnFloatingWord(`这是${picked.zh}哦`, x, y - 20, '#8C6D56');
      HMC.audio.speak(`这是${picked.zh}哦，再找找${target.zh}吧！`, `That is a ${picked.en}. Find the ${target.en}!`);
      if (state.shapeWrongCount >= 2) {
        const rightCard = document.querySelector(`.nest-card[data-shape-id="${target.id}"]`);
        if (rightCard) rightCard.classList.add('hint-glow');
      }
    }
  }

  function renderShapeClueSubMode(newRound = false) {
    const state = HMC.state;
    const stageEl = getStage();
    if (newRound || !state.shapeClueRound) createShapeClueRound();
    const r = state.shapeClueRound;
    const sizeZh = r.targetSize === 'big' ? '大大' : '小小';
    const sizeEn = r.targetSize === 'big' ? 'Big' : 'Small';

    syncSubModeDock();

    const clueLevelLabel = state.shapeClueWins >= 2 ? 'Lv.2 三重线索' : 'Lv.1 双重线索';

    stageEl.innerHTML = `
      <div class="stage-level-note" aria-label="当前难度">当前难度 · ${clueLevelLabel}</div>
      <div class="sorting-hero" style="gap:12px;">
        <div class="chicken-actor ${r.solved ? 'celebrate' : 'idle'}" id="shapeChicken">
          ${HMC.svg.renderChickenSVG(106)}
        </div>
        <div class="clue-panel" id="cluePanel">
          ${r.useSize ? `
            <div class="clue-badge">
              <span style="font-size:${r.targetSize === 'big' ? '26px' : '16px'};line-height:34px;">${r.targetSize === 'big' ? '🐘' : '🐜'}</span>
              <span>${state.lang === 'en' ? sizeEn : sizeZh}</span>
            </div>
            <span style="font-size:20px;font-weight:900;">+</span>
          ` : ''}
          <div class="clue-badge">
            <div class="clue-swatch" style="background:${r.targetColor.fill};"></div>
            <span>${state.lang === 'en' ? r.targetColor.en : r.targetColor.zh}</span>
          </div>
          <span style="font-size:20px;font-weight:900;">+</span>
          <div class="clue-badge">
            <svg width="38" height="34" viewBox="0 0 60 54" fill="none">
              ${HMC.svg.renderShapePath(r.targetShape.id, 30, 27, 34, '#ECE4D8')}
            </svg>
            <span>${state.lang === 'en' ? r.targetShape.en : r.targetShape.zh}</span>
          </div>
        </div>
      </div>
      <div class="choice-grid-4" id="clueChoices"></div>
    `;

    const grid = document.getElementById('clueChoices');
    r.candidates.forEach(cand => {
      const isWin = r.solved && cand.correct;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nest-card card-clue' + (isWin ? ' correct-pop' : '');
      btn.dataset.candId = cand.id;
      btn.style.background = '#FFFDF9';
      btn.style.borderColor = isWin ? '#51CF66' : '#4A3728';
      const eggSize = r.useSize ? (cand.size === 'big' ? 76 : 44) : 66;
      btn.innerHTML = isWin
        ? `${HMC.svg.renderChickSVG({ size: 80, bodyColor: cand.color.light, accessory: 'crown', balloonShape: cand.shape.id, balloonColor: cand.color.fill })}<div class="nest-label" style="font-size:15px;">⭐ 找到了！</div>`
        : `${HMC.svg.renderEggSVG({ size: eggSize, base: cand.color.fill, shape: cand.shape.id, shapeColor: '#FFFFFF' })}`;
      if (state.shapeWrongCount >= 2 && cand.correct) btn.classList.add('hint-glow');
      btn.addEventListener('click', (e) => handleShapeCluePick(cand, btn, e.clientX, e.clientY));
      grid.appendChild(btn);
    });

    const zhClue = r.useSize ? `【${sizeZh}的】【${r.targetColor.zh}】【${r.targetShape.zh}】蛋` : `【${r.targetColor.zh}】的【${r.targetShape.zh}】蛋`;
    const enClue = r.useSize ? `${sizeEn} ${r.targetColor.en} ${r.targetShape.en} egg` : `${r.targetColor.en} ${r.targetShape.en} egg`;

    document.getElementById('shapeChicken').addEventListener('click', () => {
      HMC.audio.SFX.cluck();
      HMC.audio.speak(`小侦探，找出${zhClue}吧！`, `Find the ${enClue}!`);
    });

    if (newRound) {
      HMC.audio.setPrompt(`小侦探：找出${zhClue}！`, `Find the ${enClue}!`);
    }
  }

  function handleShapeCluePick(cand, btnEl, x, y) {
    const state = HMC.state;
    if (state.shapeLocked || !state.shapeClueRound) return;
    const r = state.shapeClueRound;
    const isCorrect = Boolean(cand.correct);
    if (HMC.storage && HMC.storage.recordAttempt) {
      HMC.storage.recordAttempt('shape_clue', isCorrect, `${r.targetShape.zh}多维线索`);
    }
    if (isCorrect) {
      state.shapeLocked = true;
      r.solved = true;
      state.shapeClueWins++;
      HMC.audio.SFX.success();
      setTimeout(() => HMC.audio.SFX.cheep(), 200);
      HMC.effects.burstConfetti(32);
      HMC.effects.spawnFloatingWord(`🕵️ 找对啦！`, x, y - 24, r.targetColor.fill);
      const isParty = HMC.effects.awardStar();
      renderShapeClueSubMode(false);
      const praiseZh = '太棒啦！所有线索全都答对，小侦探真厉害！';
      const praiseEn = 'Super detective! You matched every clue!';
      if (isParty) HMC.audio.setPrompt(praiseZh, praiseEn, false);
      else HMC.audio.praiseWithPrompt(praiseZh, praiseEn);
      HMC.audio.waitForSpeechThen(
        1300,
        () => {
          HMC.audio.SFX.cluck();
          renderShapeClueSubMode(true);
        },
        () => state.mode === 'shapes' && state.shapeSubMode === 'clue' && state.shapeClueRound === r
      );
    } else {
      state.shapeWrongCount++;
      HMC.audio.SFX.boing();
      btnEl.classList.remove('shake');
      void btnEl.offsetWidth;
      btnEl.classList.add('shake');
      const actor = document.getElementById('shapeChicken');
      if (actor) { actor.classList.add('tilt'); setTimeout(() => actor.classList.remove('tilt'), 550); }
      // Specific diagnostic coaching!
      let msgZh = '';
      let msgEn = '';
      if (cand.color.id !== r.targetColor.id && cand.shape.id === r.targetShape.id) {
        msgZh = `形状是${r.targetShape.zh}没错，但颜色是${cand.color.zh}哦，我们要找${r.targetColor.zh}的！`;
        msgEn = `Right shape, wrong color! Find ${r.targetColor.en}!`;
      } else if (cand.color.id === r.targetColor.id && cand.shape.id !== r.targetShape.id) {
        msgZh = `颜色对了，可是上面的形状是${cand.shape.zh}哦，我们要找${r.targetShape.zh}！`;
        msgEn = `Right color, but that is a ${cand.shape.en}! Find ${r.targetShape.en}!`;
      } else if (r.useSize && cand.size !== r.targetSize) {
        const wantSize = r.targetSize === 'big' ? '大大的' : '小小的';
        msgZh = `颜色和形状都对啦，可是大小不对哦，我们要找${wantSize}那个！`;
        msgEn = `Right color and shape, check the size!`;
      } else {
        msgZh = `这个是${cand.color.zh}的${cand.shape.zh}哦，再核对一下线索吧！`;
        msgEn = `Check the clues again!`;
      }
      HMC.effects.spawnFloatingWord(`再核对线索～`, x, y - 20, '#8C6D56');
      HMC.audio.speak(msgZh, msgEn);
      if (state.shapeWrongCount >= 2) {
        const rightCard = document.querySelector(`.nest-card[data-cand-id="hit"]`);
        if (rightCard) rightCard.classList.add('hint-glow');
      }
    }
  }

  function renderShapeBuildSubMode(newRound = false) {
    const state = HMC.state;
    const stageEl = getStage();
    if (newRound || !state.shapeBuildRound) createShapeBuildRound();
    const r = state.shapeBuildRound;
    const { bp, filledMask, choices, solved } = r;

    syncSubModeDock();

    const partsSvg = bp.parts.map((p, idx) => {
      const filled = filledMask[idx];
      return HMC.svg.renderShapePath(p.shape, p.cx, p.cy, p.size, filled ? p.fill : 'rgba(255, 244, 214, 0.55)', {
        dashed: !filled,
        stroke: filled ? '#4A3728' : '#F59F00',
        strokeWidth: filled ? 4 : 3.2,
        rotate: p.rotate || 0
      });
    }).join('');

    stageEl.innerHTML = `
      <div class="blueprint-card">
        <div class="chicken-actor ${solved ? 'celebrate' : 'idle'}" id="shapeChicken">
          ${HMC.svg.renderChickenSVG(100)}
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;">
          <svg width="176" height="156" viewBox="0 0 200 176" fill="none">
            ${partsSvg}
            ${solved ? bp.extras : ''}
          </svg>
          <div class="count-chip" style="font-size:13px;padding:2px 11px;">
            ${bp.emoji} ${state.lang === 'en' ? bp.en : bp.zh} (${filledMask.filter(Boolean).length}/${bp.parts.length})
          </div>
        </div>
      </div>
      <div class="choice-grid-5" id="buildShapeChoices"></div>
    `;

    const remainingShapes = bp.parts.filter((_, i) => !filledMask[i]).map(p => p.shape);
    const tray = document.getElementById('buildShapeChoices');
    choices.forEach(s => {
      const stillNeeded = remainingShapes.includes(s.id);
      const wasInBlueprint = bp.parts.some(p => p.shape === s.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shape-block-btn' + (wasInBlueprint && !stillNeeded ? ' used' : '');
      btn.dataset.shapeId = s.id;
      btn.style.background = s.bg;
      btn.style.borderColor = s.color;
      btn.innerHTML = `
        <svg width="56" height="46" viewBox="0 0 80 68" fill="none">
          ${HMC.svg.renderShapePath(s.id, 40, 34, 40, s.color)}
        </svg>
        <div style="font-size:13px;font-weight:900;color:#4A3728;">${s.zh}</div>
      `;
      if (state.shapeWrongCount >= 2 && stillNeeded) btn.classList.add('hint-glow');
      btn.addEventListener('click', (e) => handleShapeBuildPick(s, btn, e.clientX, e.clientY));
      tray.appendChild(btn);
    });

    document.getElementById('shapeChicken').addEventListener('click', () => {
      HMC.audio.SFX.cluck();
      HMC.audio.speak(state.lastPromptZh, state.lastPromptEn);
    });

    if (newRound) {
      HMC.audio.setPrompt(`用下面的形状积木，帮小鸡拼出一座【${bp.zh}】吧！`, `Build the ${bp.en} using the shapes below!`);
    }
  }

  function handleShapeBuildPick(picked, btnEl, x, y) {
    const { SHAPE_BY_ID } = HMC.data;
    const state = HMC.state;
    if (state.shapeLocked || !state.shapeBuildRound) return;
    const r = state.shapeBuildRound;
    const slotIdx = r.bp.parts.findIndex((p, i) => !r.filledMask[i] && p.shape === picked.id);
    const isCorrect = slotIdx !== -1;
    const expectedPart = isCorrect
      ? r.bp.parts[slotIdx]
      : r.bp.parts.find((_, i) => !r.filledMask[i]);
    const expectedShape = expectedPart ? SHAPE_BY_ID[expectedPart.shape] : picked;
    if (HMC.storage && HMC.storage.recordAttempt) {
      HMC.storage.recordAttempt('shape_build', isCorrect, `${expectedShape.zh}拼图`);
    }

    if (isCorrect) {
      r.filledMask[slotIdx] = true;
      state.shapeWrongCount = 0;
      HMC.audio.SFX.pop();
      HMC.effects.spawnFloatingWord(`🧩 拼上${picked.zh}！`, x, y - 22, picked.color);

      if (r.filledMask.every(Boolean)) {
        r.solved = true;
        state.shapeLocked = true;
        state.shapeBuildWins++;
        renderShapeBuildSubMode(false);
        setTimeout(() => {
          if (state.mode !== 'shapes' || state.shapeSubMode !== 'build' || state.shapeBuildRound !== r) return;
          HMC.audio.SFX.success();
          HMC.audio.SFX.cheep();
          HMC.effects.burstConfetti(34);
          const isParty = HMC.effects.awardStar();
          const praiseZh = `哇！拼出了完整的【${r.bp.zh}】，你是小小建筑师！`;
          const praiseEn = `Hooray! You built the ${r.bp.en}!`;
          if (isParty) HMC.audio.setPrompt(praiseZh, praiseEn, false);
          else HMC.audio.praiseWithPrompt(praiseZh, praiseEn);
          HMC.audio.waitForSpeechThen(
            1400,
            () => {
              HMC.audio.SFX.cluck();
              renderShapeBuildSubMode(true);
            },
            () => state.mode === 'shapes' && state.shapeSubMode === 'build' && state.shapeBuildRound === r
          );
        }, 160);
      } else {
        renderShapeBuildSubMode(false);
        const leftNames = [...new Set(r.bp.parts.filter((_, i) => !r.filledMask[i]).map(p => SHAPE_BY_ID[p.shape].zh))];
        HMC.audio.speak(`拼上${picked.zh}啦！还需要${leftNames.join('和')}哦！`, `Nice ${picked.en}! Keep building!`);
      }
    } else {
      state.shapeWrongCount++;
      HMC.audio.SFX.boing();
      btnEl.classList.remove('shake');
      void btnEl.offsetWidth;
      btnEl.classList.add('shake');
      const actor = document.getElementById('shapeChicken');
      if (actor) { actor.classList.add('tilt'); setTimeout(() => actor.classList.remove('tilt'), 550); }
      HMC.effects.spawnFloatingWord(`虚线框里没有${picked.zh}`, x, y - 20, '#8C6D56');
      const nextNeeded = r.bp.parts.find((_, i) => !r.filledMask[i]);
      const hintShape = nextNeeded ? SHAPE_BY_ID[nextNeeded.shape] : null;
      HMC.audio.speak(
        hintShape ? `图上虚线框里不需要${picked.zh}哦，看看哪里像${hintShape.zh}？` : `再看看图里的虚线形状哦！`,
        `Look closely at the dashed outline!`
      );
      if (state.shapeWrongCount >= 2 && hintShape) {
        const rightBtn = document.querySelector(`.shape-block-btn[data-shape-id="${hintShape.id}"]`);
        if (rightBtn) rightBtn.classList.add('hint-glow');
      }
    }
  }

  function renderShapeOddSubMode(newRound = false) {
    const state = HMC.state;
    const stageEl = getStage();
    if (newRound || !state.shapeOddRound) createShapeOddRound();
    const r = state.shapeOddRound;

    syncSubModeDock();

    stageEl.innerHTML = `
      <div class="sorting-hero" style="gap:12px;">
        <div class="chicken-actor ${r.solved ? 'celebrate' : 'idle'}" id="shapeChicken">
          ${HMC.svg.renderChickenSVG(106)}
        </div>
        <div class="count-chip" style="padding:8px 16px;font-size:15px;border-color:#9775FA;background:#FFFFFF;">
          🔎 别被颜色骗啦！找【形状】不一样的蛋
        </div>
      </div>
      <div class="choice-grid-4" id="oddChoices"></div>
    `;

    const grid = document.getElementById('oddChoices');
    r.items.forEach(item => {
      const isWin = r.solved && item.isOdd;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nest-card card-clue' + (isWin ? ' correct-pop' : '');
      btn.dataset.oddId = item.id;
      btn.style.background = '#FFFDF9';
      btn.style.borderColor = isWin ? '#51CF66' : item.color.fill;
      btn.innerHTML = isWin
        ? `${HMC.svg.renderChickSVG({ size: 80, bodyColor: '#FFE066', accessory: 'crown', balloonShape: item.shape.id, balloonColor: item.color.fill })}<div class="nest-label" style="font-size:15px;">⭐ ${item.shape.zh}</div>`
        : `${HMC.svg.renderEggSVG({ size: 70, base: item.color.fill, shape: item.shape.id, shapeColor: '#FFFFFF' })}`;
      if (state.shapeWrongCount >= 2 && item.isOdd) btn.classList.add('hint-glow');
      btn.addEventListener('click', (e) => handleShapeOddPick(item, btn, e.clientX, e.clientY));
      grid.appendChild(btn);
    });

    document.getElementById('shapeChicken').addEventListener('click', () => {
      HMC.audio.SFX.cluck();
      HMC.audio.speak(`仔细看四个蛋上的形状，哪一个和大家不一样？`, `Which egg has a different shape?`);
    });

    if (newRound) {
      HMC.audio.setPrompt(`火眼金睛！哪一个蛋的【形状】和大家不一样？`, `Which egg has a different shape?`);
    }
  }

  function handleShapeOddPick(item, btnEl, x, y) {
    const state = HMC.state;
    if (state.shapeLocked || !state.shapeOddRound) return;
    const r = state.shapeOddRound;
    const isCorrect = Boolean(item.isOdd);
    if (HMC.storage && HMC.storage.recordAttempt) {
      HMC.storage.recordAttempt('shape_odd', isCorrect, `${r.oddShape.zh}找不同`);
    }
    if (isCorrect) {
      state.shapeLocked = true;
      r.solved = true;
      state.shapeOddWins++;
      HMC.audio.SFX.success();
      setTimeout(() => HMC.audio.SFX.cheep(), 200);
      HMC.effects.burstConfetti(30);
      HMC.effects.spawnFloatingWord(`🔎 找到了！${r.oddShape.zh}`, x, y - 24, r.oddShape.color);
      const isParty = HMC.effects.awardStar();
      renderShapeOddSubMode(false);
      const praiseZh = `太厉害啦！其他三个都是${r.commonShape.zh}，只有这个是【${r.oddShape.zh}】！`;
      const praiseEn = `Brilliant! Three are ${r.commonShape.en}, this one is ${r.oddShape.en}!`;
      if (isParty) HMC.audio.setPrompt(praiseZh, praiseEn, false);
      else HMC.audio.praiseWithPrompt(praiseZh, praiseEn);
      HMC.audio.waitForSpeechThen(
        1300,
        () => {
          HMC.audio.SFX.cluck();
          renderShapeOddSubMode(true);
        },
        () => state.mode === 'shapes' && state.shapeSubMode === 'odd' && state.shapeOddRound === r
      );
    } else {
      state.shapeWrongCount++;
      HMC.audio.SFX.boing();
      btnEl.classList.remove('shake');
      void btnEl.offsetWidth;
      btnEl.classList.add('shake');
      const actor = document.getElementById('shapeChicken');
      if (actor) { actor.classList.add('tilt'); setTimeout(() => actor.classList.remove('tilt'), 550); }
      HMC.effects.spawnFloatingWord(`有3个${r.commonShape.zh}哦`, x, y - 20, '#8C6D56');
      HMC.audio.speak(
        `这个是${r.commonShape.zh}，另外还有两个也是${r.commonShape.zh}哦，不要看颜色，再找形状不一样的！`,
        `Three eggs have a ${r.commonShape.en}. Ignore color and find the different shape!`
      );
      if (state.shapeWrongCount >= 2) {
        const rightCard = document.querySelector(`.nest-card[data-odd-id="odd"]`);
        if (rightCard) rightCard.classList.add('hint-glow');
      }
    }
  }

  HMC.modes = HMC.modes || {};
  HMC.modes.shapes = {
    syncSubModeDock,
    createBasicShapeRound,
    createShapeClueRound,
    createShapeBuildRound,
    createShapeOddRound,
    renderShapeMode,
    renderBasicShapeSubMode,
    handleBasicShapePick,
    renderShapeClueSubMode,
    handleShapeCluePick,
    renderShapeBuildSubMode,
    handleShapeBuildPick,
    renderShapeOddSubMode,
    handleShapeOddPick
  };
})(window.HMC = window.HMC || {});
