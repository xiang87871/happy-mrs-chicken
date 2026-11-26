(function (HMC) {
  'use strict';

  const PLAY_SUB_ITEMS = [
    { id: 'piano',  label: '🎹 小鸡琴' },
    { id: 'habits', label: '🛁 好习惯' }
  ];

  const HABIT_STORIES = {
    bath: {
      id: 'bath',
      tabLabel: '🛁 洗泡泡澡',
      enTitle: 'Bubble Bath'
    },
    bedtime: {
      id: 'bedtime',
      tabLabel: '🪥 刷牙盖被子',
      enTitle: 'Brush & Bedtime'
    }
  };

  let demoTimer = null;
  let songCelebrateTimer = null;
  let songResetHandle = null;
  let isDemoPlaying = false;
  let demoStepIdx = -1;
  let songLocked = false;

  function getStage() {
    return document.getElementById('gameStage');
  }

  function getActiveSong() {
    const id = HMC.state.pianoSongId;
    if (!id || id === 'free') return null;
    return HMC.data.NURSERY_SONG_BY_ID[id] || null;
  }

  function stopPianoDemo(updateUi = true) {
    if (demoTimer) {
      clearTimeout(demoTimer);
      demoTimer = null;
    }
    const wasPlaying = isDemoPlaying;
    isDemoPlaying = false;
    demoStepIdx = -1;
    if (updateUi && wasPlaying) {
      updatePianoDemoButtonUI();
      updatePianoCueAndProgress();
    }
  }

  function unmountActiveHabits() {
    if (HMC.habits && HMC.habits.bath && typeof HMC.habits.bath.unmount === 'function') {
      HMC.habits.bath.unmount();
    }
    if (HMC.habits && HMC.habits.bedtime && typeof HMC.habits.bedtime.unmount === 'function') {
      HMC.habits.bedtime.unmount();
    }
  }

  function cleanup() {
    stopPianoDemo(false);
    unmountActiveHabits();
    if (songCelebrateTimer) {
      clearTimeout(songCelebrateTimer);
      songCelebrateTimer = null;
    }
    if (songResetHandle) {
      if (typeof songResetHandle.cancel === 'function') songResetHandle.cancel();
      songResetHandle = null;
      HMC.state.pianoStep = 0;
    }
    if (HMC.audio && typeof HMC.audio.cancelPendingTransitions === 'function') {
      HMC.audio.cancelPendingTransitions();
    }
    songLocked = false;
  }

  function syncSubModeDock() {
    const state = HMC.state;
    const sub = state.playSubMode || 'piano';

    HMC.effects.renderSubModeDock(
      PLAY_SUB_ITEMS,
      sub,
      (nextSub) => {
        cleanup();
        state.playSubMode = nextSub;
        HMC.audio.SFX.pop();
        renderPlayMode(true);
      }
    );
  }

  function renderPlayMode(isFresh = false) {
    const stageEl = getStage();
    if (stageEl) stageEl.classList.remove('empty');
    const sub = HMC.state.playSubMode || 'piano';
    if (sub === 'habits') {
      stopPianoDemo(false);
      renderHabitsSubMode(isFresh);
    } else {
      renderPianoSubMode(isFresh);
    }
  }

  /* ========================================================================
     SUB-MODE A: 🎹 音乐小鸡琴 (Musical Chick Piano)
     ======================================================================== */

  function updatePianoDemoButtonUI() {
    const demoBtn = document.getElementById('pianoDemoBtn');
    if (!demoBtn) return;
    demoBtn.classList.toggle('playing', isDemoPlaying);
    demoBtn.setAttribute('aria-label', isDemoPlaying ? '停止示范' : '播放示范');
    demoBtn.title = isDemoPlaying ? '停止示范' : '听小鸡示范弹一遍';
    const iconEl = demoBtn.querySelector('.demo-btn-icon');
    const labelEl = demoBtn.querySelector('.demo-btn-label');
    if (iconEl) iconEl.textContent = isDemoPlaying ? '⏹️' : '▶️';
    if (labelEl) labelEl.textContent = isDemoPlaying ? '停' : '示范';
  }

  function updatePianoCueAndProgress() {
    const state = HMC.state;
    const song = getActiveSong();
    const expectedNote = (song && !isDemoPlaying && !songLocked && state.pianoStep < song.notes.length)
      ? song.notes[state.pianoStep]
      : -1;

    document.querySelectorAll('.piano-chick-key').forEach(btn => {
      const n = parseInt(btn.dataset.noteNum, 10);
      btn.classList.toggle('next-cue', n === expectedNote);
    });

    if (song) {
      const dots = document.querySelectorAll('#songProgressBar .song-note-dot');
      dots.forEach((dot, idx) => {
        if (isDemoPlaying) {
          dot.classList.toggle('done', idx < demoStepIdx);
          dot.classList.toggle('current', idx === demoStepIdx);
          dot.classList.toggle('upcoming', idx > demoStepIdx);
        } else {
          dot.classList.toggle('done', idx < state.pianoStep);
          dot.classList.toggle('current', !songLocked && idx === state.pianoStep);
          dot.classList.toggle('upcoming', idx > state.pianoStep);
        }
      });
    }
  }

  function animatePianoKey(btnEl) {
    if (!btnEl) return;
    btnEl.classList.remove('singing');
    void btnEl.offsetWidth;
    btnEl.classList.add('singing');
  }

  function getElCenter(el) {
    if (el && typeof el.getBoundingClientRect === 'function') {
      const r = el.getBoundingClientRect();
      if (r && (r.width > 0 || r.height > 0)) {
        return { x: r.left + r.width / 2, y: r.top + r.height * 0.25 };
      }
    }
    return { x: (window.innerWidth || 390) / 2, y: (window.innerHeight || 844) * 0.45 };
  }

  function startPianoDemo() {
    const song = getActiveSong();
    if (!song) return;
    if (isDemoPlaying) {
      stopPianoDemo(true);
      return;
    }
    if (songCelebrateTimer) {
      clearTimeout(songCelebrateTimer);
      songCelebrateTimer = null;
    }
    if (songResetHandle) {
      if (typeof songResetHandle.cancel === 'function') songResetHandle.cancel();
      songResetHandle = null;
      HMC.state.pianoStep = 0;
      songLocked = false;
    }

    isDemoPlaying = true;
    demoStepIdx = 0;
    updatePianoDemoButtonUI();

    const playNextDemoNote = () => {
      if (!isDemoPlaying || HMC.state.mode !== 'play' || HMC.state.playSubMode !== 'piano') {
        stopPianoDemo(false);
        return;
      }
      if (demoStepIdx >= song.notes.length) {
        stopPianoDemo(true);
        HMC.audio.speak(`听完《${song.zh}》示范啦，现在轮到你来弹哦！`, `Now it's your turn to play ${song.en}!`);
        return;
      }
      const noteNum = song.notes[demoStepIdx];
      const note = HMC.data.PIANO_NOTES[noteNum - 1];
      updatePianoCueAndProgress();
      if (note) {
        HMC.audio.SFX.marimba(note.freq);
        const keyBtn = document.querySelector(`.piano-chick-key[data-note-num="${noteNum}"]`);
        animatePianoKey(keyBtn);
        const pos = getElCenter(keyBtn);
        HMC.effects.spawnFloatingWord(`🎵 ${note.solfege}`, pos.x, pos.y - 10, note.dark);
      }
      demoStepIdx++;
      demoTimer = setTimeout(playNextDemoNote, 420);
    };

    playNextDemoNote();
  }

  function handlePianoKeyTap(noteNum, btnEl = null, clientX = null, clientY = null) {
    const state = HMC.state;
    const note = HMC.data.PIANO_NOTES[noteNum - 1];
    if (!note) return;

    if (isDemoPlaying) {
      stopPianoDemo(true);
    }

    const keyEl = btnEl || document.querySelector(`.piano-chick-key[data-note-num="${noteNum}"]`);
    HMC.audio.SFX.marimba(note.freq);
    animatePianoKey(keyEl);

    const fallbackPos = getElCenter(keyEl);
    const fxX = (typeof clientX === 'number' && clientX > 0) ? clientX : fallbackPos.x;
    const fxY = (typeof clientY === 'number' && clientY > 0) ? clientY : fallbackPos.y;
    HMC.effects.spawnFloatingWord(`🎵 ${note.solfege}!`, fxX, fxY - 22, note.dark);

    const song = getActiveSong();
    if (!song || songLocked) return;

    const expected = song.notes[state.pianoStep];
    if (noteNum === expected) {
      state.pianoStep++;
      updatePianoCueAndProgress();

      if (state.pianoStep >= song.notes.length) {
        songLocked = true;
        if (HMC.storage && HMC.storage.recordAttempt) {
          HMC.storage.recordAttempt('play_music', true);
        }
        updatePianoCueAndProgress();
        songCelebrateTimer = setTimeout(() => {
          songCelebrateTimer = null;
          if (state.mode !== 'play' || state.playSubMode !== 'piano' || state.pianoSongId !== song.id) return;
          HMC.audio.SFX.fanfare();
          HMC.effects.burstConfetti(42);
          const isParty = HMC.effects.awardStar();
          const praiseZh = `太棒啦！你弹完了一整首《${song.zh}》！`;
          const praiseEn = `Bravo! You played the whole ${song.en} song!`;
          if (isParty) HMC.audio.setPrompt(praiseZh, praiseEn, false);
          else HMC.audio.praiseWithPrompt(praiseZh, praiseEn);
          document.querySelectorAll('.piano-chick-key').forEach((k, idx) => {
            setTimeout(() => animatePianoKey(k), idx * 65);
          });
          songResetHandle = HMC.audio.waitForSpeechThen(
            1400,
            () => {
              songResetHandle = null;
              state.pianoStep = 0;
              songLocked = false;
              updatePianoCueAndProgress();
            },
            () => state.mode === 'play' && state.playSubMode === 'piano' && state.pianoSongId === song.id
          );
        }, 160);
      }
    }
    // Note: tapping a non-target note in guided mode still plays joyfully with ZERO punishment!
  }

  function triggerPianoKey(noteNum) {
    if (noteNum < 1 || noteNum > 7) return;
    const btn = document.querySelector(`.piano-chick-key[data-note-num="${noteNum}"]`);
    handlePianoKeyTap(noteNum, btn, null, null);
  }

  function renderPianoSubMode(isFresh = false) {
    unmountActiveHabits();
    const state = HMC.state;
    const stageEl = getStage();
    const { PIANO_NOTES, NURSERY_SONGS } = HMC.data;
    const song = getActiveSong();
    if (song && !songLocked && state.pianoStep >= song.notes.length) {
      state.pianoStep = 0;
    }

    syncSubModeDock();

    const controlsHtml = `
      <div class="piano-controls" id="pianoControls" role="tablist" aria-label="选择弹奏模式或儿歌">
        <button class="piano-song-pill ${state.pianoSongId === 'free' ? 'active' : ''}" data-song-id="free" role="tab" aria-selected="${state.pianoSongId === 'free' ? 'true' : 'false'}" type="button">
          ✨ 自由弹
        </button>
        ${NURSERY_SONGS.map(s => `
          <button class="piano-song-pill ${state.pianoSongId === s.id ? 'active' : ''}" data-song-id="${s.id}" role="tab" aria-selected="${state.pianoSongId === s.id ? 'true' : 'false'}" type="button">
            ${s.icon} ${state.lang === 'en' ? s.en : s.zh}
          </button>
        `).join('')}
      </div>
    `;

    const progressHtml = song ? `
      <div class="song-progress-bar" id="songProgressBar" aria-label="歌曲乐谱与示范播放">
        <button class="piano-sheet-play-btn ${isDemoPlaying ? 'playing' : ''}" id="pianoDemoBtn" type="button" title="${isDemoPlaying ? '停止示范' : '听小鸡示范弹一遍'}" aria-label="${isDemoPlaying ? '停止示范' : '播放示范'}">
          <span class="demo-btn-icon" aria-hidden="true">${isDemoPlaying ? '⏹️' : '▶️'}</span>
          <span class="demo-btn-label">${isDemoPlaying ? '停' : '示范'}</span>
        </button>
        <span class="song-sheet-divider" aria-hidden="true"></span>
        <div class="song-notes-track">
          ${song.notes.map((n, idx) => {
            const noteObj = PIANO_NOTES[n - 1];
            const cls = idx < state.pianoStep ? 'done' : (!songLocked && idx === state.pianoStep ? 'current' : 'upcoming');
            return `
              <span class="song-note-dot ${cls}" style="--dot-color:${noteObj.color};--dot-light:${noteObj.light};--dot-dark:${noteObj.dark};">
                ${n}
              </span>
            `;
          }).join('')}
        </div>
      </div>
    ` : `
      <div class="piano-free-banner">
        🎵 彩虹小鸡合唱团 · 点一点任意小鸡唱歌吧！
      </div>
    `;

    const expectedNote = (song && !isDemoPlaying && !songLocked && state.pianoStep < song.notes.length)
      ? song.notes[state.pianoStep]
      : -1;

    const keysHtml = PIANO_NOTES.map(note => `
      <button
        class="piano-chick-key ${note.num === expectedNote ? 'next-cue' : ''}"
        type="button"
        data-note-num="${note.num}"
        style="--key-color:${note.color};--key-light:${note.light};--key-dark:${note.dark};"
        aria-label="${note.num} ${note.solfege}"
      >
        <span class="piano-cue-star" aria-hidden="true">⭐</span>
        <div class="piano-chick-svg">
          ${HMC.svg.renderChickSVG({ size: 58, bodyColor: note.color, accessory: note.accessory })}
        </div>
        <span class="piano-num">${note.num}</span>
        <span class="piano-solfege">${note.solfege}</span>
      </button>
    `).join('');

    stageEl.innerHTML = `
      <div class="piano-stage">
        ${controlsHtml}
        ${progressHtml}
        <div class="piano-row" id="pianoRow">
          ${keysHtml}
        </div>
      </div>
    `;

    document.querySelectorAll('.piano-song-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const nextId = pill.dataset.songId;
        cleanup();
        state.pianoSongId = nextId;
        state.pianoStep = 0;
        HMC.audio.SFX.pop();
        renderPianoSubMode(true);
      });
    });

    const demoBtn = document.getElementById('pianoDemoBtn');
    if (demoBtn) {
      demoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startPianoDemo();
      });
    }

    document.querySelectorAll('.piano-chick-key').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const n = parseInt(btn.dataset.noteNum, 10);
        handlePianoKeyTap(n, btn, e.clientX, e.clientY);
      });
    });

    if (isFresh) {
      if (song) {
        HMC.audio.setPrompt(
          `跟着发光的小星星，一起弹《${song.zh}》吧！`,
          `Follow the glowing star to play ${song.en}!`
        );
      } else {
        HMC.audio.setPrompt(
          `自由弹琴时间！点一点彩虹小鸡唱歌吧！`,
          `Free play! Tap any rainbow chick to make music!`
        );
      }
    }
  }

  /* ========================================================================
     SUB-MODE B: 🛁 生活好习惯剧场 (Good Habits Theater — Bath & Bedtime)
     ======================================================================== */

  function selectHabitStory(storyId, isFresh = true) {
    unmountActiveHabits();
    const state = HMC.state;
    state.habitStory = HABIT_STORIES[storyId] ? storyId : 'bath';
    state.habitStep = 0;
    state.habitSubProgress = 0;
    renderHabitsSubMode(isFresh);
  }

  function renderHabitsSubMode(isFresh = false) {
    const state = HMC.state;
    const stageEl = getStage();
    const storyId = HABIT_STORIES[state.habitStory] ? state.habitStory : 'bath';
    state.habitStory = storyId;

    syncSubModeDock();
    unmountActiveHabits();

    const storyOpts = {
      isFresh,
      onSwitchStory: (nextStory) => {
        HMC.audio.SFX.pop();
        selectHabitStory(nextStory, true);
      }
    };

    if (storyId === 'bedtime' && HMC.habits && HMC.habits.bedtime && typeof HMC.habits.bedtime.mount === 'function') {
      HMC.habits.bedtime.mount(stageEl, storyOpts);
      return;
    }

    if (HMC.habits && HMC.habits.bath && typeof HMC.habits.bath.mount === 'function') {
      HMC.habits.bath.mount(stageEl, storyOpts);
    }
  }

  HMC.modes = HMC.modes || {};
  HMC.modes.play = {
    PLAY_SUB_ITEMS,
    HABIT_STORIES,
    syncSubModeDock,
    renderPlayMode,
    renderPianoSubMode,
    renderHabitsSubMode,
    handlePianoKeyTap,
    triggerPianoKey,
    startPianoDemo,
    stopPianoDemo,
    selectHabitStory,
    cleanup
  };
})(window.HMC = window.HMC || {});
