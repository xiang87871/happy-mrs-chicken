(function (HMC) {
  'use strict';

  function switchMode(newMode) {
    const state = HMC.state;
    const appShellEl = document.getElementById('appShell');
    const classicFieldEl = document.getElementById('classicField');
    const classicMiniCountsEl = document.getElementById('classicMiniCounts');
    const classicFabsEl = document.getElementById('classicFabs');

    state.mode = newMode;
    const isClassic = newMode === 'classic';
    appShellEl.classList.toggle('mode-classic', isClassic);
    appShellEl.classList.toggle('mode-quiz', !isClassic);
    classicFieldEl.classList.toggle('hidden', !isClassic);
    classicMiniCountsEl.classList.toggle('hidden', !isClassic);
    classicFabsEl.classList.toggle('hidden', !isClassic);

    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === newMode);
    });

    HMC.audio.SFX.pop();
    if (HMC.modes.play && HMC.modes.play.cleanup) {
      HMC.modes.play.cleanup();
    }
    if (isClassic) {
      HMC.modes.classic.renderClassicMode(true);
    } else {
      if (HMC.modes.classic && HMC.modes.classic.stopMeadowLife) {
        HMC.modes.classic.stopMeadowLife();
      }
      if (newMode === 'colors') HMC.modes.colors.renderColorMode(true);
      else if (newMode === 'counting') HMC.modes.math.renderCountingMode(true);
      else if (newMode === 'shapes') HMC.modes.shapes.renderShapeMode(true);
      else if (newMode === 'play') HMC.modes.play.renderPlayMode(true);
    }
  }

  function setWeather(mode) {
    const valid = ['sunny', 'rain', 'rainbow'];
    const next = valid.includes(mode) ? mode : 'sunny';
    HMC.state.weather = next;

    const appShellEl = document.getElementById('appShell');
    if (appShellEl) {
      appShellEl.classList.toggle('weather-rain', next === 'rain');
      appShellEl.classList.toggle('weather-rainbow', next === 'rainbow');
    }

    const puddleBtn = document.getElementById('puddleBtn');
    if (puddleBtn) {
      puddleBtn.classList.toggle('puddle-grown', next === 'rain');
    }

    if (HMC.modes.classic && HMC.modes.classic.onWeatherChange) {
      HMC.modes.classic.onWeatherChange();
    }
    return next;
  }

  function announceWeather(zh, en) {
    if (HMC.state.mode === 'classic') {
      HMC.audio.setPrompt(zh, en);
    } else {
      HMC.audio.speak(zh, en);
    }
  }

  function bindModeDock() {
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        switchMode(tab.dataset.mode);
      });
    });

    const subModeDock = document.getElementById('subModeDock');
    if (subModeDock) {
      subModeDock.addEventListener('click', (e) => e.stopPropagation());
    }
  }

  function bindSceneryEasterEggs() {
    const sunBtn = document.getElementById('sunBtn');
    if (sunBtn) {
      sunBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const el = e.currentTarget;
        el.classList.remove('spin');
        void el.offsetWidth;
        el.classList.add('spin');

        if (HMC.state.weather === 'rain') {
          setWeather('rainbow');
          HMC.audio.SFX.magic();
          HMC.effects.spawnFloatingWord('🌈 出现彩虹啦！', e.clientX - 30, e.clientY + 24, '#FF5C8D');
          announceWeather('雨停啦！天空出现美丽的彩虹！', 'The rain stopped! Look at the beautiful rainbow!');
        } else {
          HMC.audio.SFX.success();
          HMC.effects.spawnFloatingWord('☀️ 太阳公公你好！', e.clientX - 24, e.clientY + 24, '#F59F00');
          HMC.audio.speak('太阳公公笑眯眯！', 'Hello Mr. Sun!');
        }
      });
    }

    ['cloud1', 'cloud2'].forEach(id => {
      const cloud = document.getElementById(id);
      if (!cloud) return;
      cloud.addEventListener('click', (e) => {
        e.stopPropagation();
        const el = e.currentTarget;
        el.classList.remove('puff');
        void el.offsetWidth;
        el.classList.add('puff');

        const cur = HMC.state.weather || 'sunny';
        const next = cur === 'sunny' ? 'rain' : (cur === 'rain' ? 'rainbow' : 'sunny');
        setWeather(next);

        if (next === 'rain') {
          HMC.audio.SFX.rain();
          HMC.effects.spawnFloatingWord('🌧️ 下雨啦！', e.clientX, e.clientY + 10, '#339AF0');
          announceWeather('下雨啦！小泥坑变大啦！', 'It is raining! The muddy puddle is getting bigger!');
        } else if (next === 'rainbow') {
          HMC.audio.SFX.magic();
          HMC.effects.spawnFloatingWord('🌈 美丽的彩虹！', e.clientX, e.clientY + 10, '#FF5C8D');
          announceWeather('雨停啦！天空出现美丽的彩虹！', 'The rain stopped! Look at the beautiful rainbow!');
        } else {
          HMC.audio.SFX.success();
          HMC.effects.spawnFloatingWord('☀️ 晴天啦！', e.clientX, e.clientY + 10, '#F59F00');
          announceWeather('晴天啦！太阳公公笑眯眯！', 'Sunny day! Mr. Sun is smiling!');
        }
      });
    });

    const puddleBtn = document.getElementById('puddleBtn');
    if (puddleBtn) {
      puddleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (HMC.classicToys && HMC.classicToys.wasJustDropped && HMC.classicToys.wasJustDropped()) return;
        const el = e.currentTarget;
        el.classList.remove('splash');
        void el.offsetWidth;
        el.classList.add('splash');
        HMC.audio.SFX.splash();
        HMC.effects.spawnFloatingWord('💦 咕叽！跳泥坑！', e.clientX + 20, e.clientY - 14, '#8D5524');
        HMC.audio.speak('咕叽咕叽！小猪佩奇最喜欢跳泥坑啦！', 'Splash! Jumping in muddy puddles!');
      });
    }

    document.querySelectorAll('.flower-btn').forEach(fl => {
      fl.addEventListener('click', (e) => {
        e.stopPropagation();
        const note = parseFloat(fl.dataset.note) || 523.25;
        fl.classList.remove('bloom');
        void fl.offsetWidth;
        fl.classList.add('bloom');
        HMC.audio.playTone(note, 0.25, 'triangle', 0.24);
        HMC.effects.spawnFloatingWord('🎵', e.clientX, e.clientY - 14, '#FF6B9D');
      });
    });
  }

  function bindHudControls() {
    const state = HMC.state;

    const promptBubble = document.getElementById('promptBubble');
    if (promptBubble) {
      promptBubble.addEventListener('click', (e) => {
        e.stopPropagation();
        HMC.audio.SFX.pop();
        HMC.audio.speak(state.lastPromptZh, state.lastPromptEn);
      });
    }

    const stickerTray = document.getElementById('stickerTray');
    if (stickerTray) {
      stickerTray.addEventListener('click', (e) => {
        e.stopPropagation();
        if (HMC.wardrobe && HMC.wardrobe.openWardrobe) {
          HMC.wardrobe.openWardrobe('dressup');
        } else {
          HMC.audio.SFX.pop();
          HMC.audio.speak(`你现在有 ${state.totalStars || state.stars} 颗星星啦，集齐五颗就可以开小鸡大派对！`, `You have ${state.totalStars || state.stars} stars!`);
        }
      });
    }

    const soundToggleBtn = document.getElementById('soundToggleBtn');
    if (soundToggleBtn) {
      soundToggleBtn.textContent = state.soundOn ? '🔊' : '🔇';
      soundToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.soundOn = !state.soundOn;
        e.currentTarget.textContent = state.soundOn ? '🔊' : '🔇';
        if (HMC.storage) HMC.storage.savePrefs({ soundOn: state.soundOn });
        if (!state.soundOn) {
          if (HMC.audio && HMC.audio.stopParentClip) HMC.audio.stopParentClip();
          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        } else {
          HMC.audio.SFX.pop();
        }
      });
    }
  }

  function bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      const target = e.target;
      if (
        target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        )
      ) {
        return;
      }
      const state = HMC.state;
      const sleepOverlay = document.getElementById('sleepOverlay');
      const parentModal = document.getElementById('parentModal');
      const wardrobeModal = document.getElementById('wardrobeModal');
      if (sleepOverlay && sleepOverlay.classList.contains('open')) return;
      if (parentModal && parentModal.classList.contains('open')) return;
      if (wardrobeModal && wardrobeModal.classList.contains('open')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
        document.activeElement.blur();
      }

      if (state.mode === 'classic') {
        e.preventDefault();
        if (e.key === 'Enter') {
          if (HMC.modes.classic && typeof HMC.modes.classic.hatchNormalClassicEggs === 'function') {
            HMC.modes.classic.hatchNormalClassicEggs();
          }
        } else {
          HMC.modes.classic.layClassicEggRandom();
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        HMC.audio.speak(state.lastPromptZh, state.lastPromptEn);
      } else if (state.mode === 'play' && state.playSubMode === 'piano' && ['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
        e.preventDefault();
        if (HMC.modes.play && HMC.modes.play.triggerPianoKey) {
          HMC.modes.play.triggerPianoKey(parseInt(e.key, 10));
        }
      } else if (['1', '2', '3', '4', '5'].includes(e.key) && (state.mode === 'colors' || state.mode === 'shapes' || (state.mode === 'counting' && state.mathSubMode !== 'feed'))) {
        const cards = document.querySelectorAll('.nest-card, .shape-block-btn, .size-choice-card, .math-num-btn');
        const idx = parseInt(e.key, 10) - 1;
        if (cards[idx]) cards[idx].click();
      }
    });
  }

  function bindResizeHandler() {
    window.addEventListener('resize', () => {
      HMC.modes.classic.onResize();
    });
  }

  function registerOfflineSW() {
    try {
      if (window.__HMC_SINGLE_FILE__) return;
      if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
      const proto = window.location && window.location.protocol;
      if (proto !== 'https:' && proto !== 'http:') return;
      const doRegister = () => {
        try {
          const p = navigator.serviceWorker.register('./sw.js');
          if (p && typeof p.catch === 'function') {
            p.catch(() => {});
          }
        } catch (e) {}
      };
      if (document.readyState === 'complete') {
        doRegister();
      } else {
        window.addEventListener('load', doRegister, { once: true });
      }
    } catch (e) {}
  }

  function boot() {
    if (HMC.storage && HMC.storage.getTotalStars) {
      HMC.state.totalStars = HMC.storage.getTotalStars();
      HMC.state.stars = HMC.state.totalStars % 5;
    }
    HMC.audio.initVoices();
    HMC.modes.classic.init();
    if (HMC.wardrobe && HMC.wardrobe.initWardrobe) {
      HMC.wardrobe.initWardrobe();
    }
    HMC.parent.init();
    bindModeDock();
    bindSceneryEasterEggs();
    bindHudControls();
    bindKeyboardShortcuts();
    bindResizeHandler();
    HMC.effects.renderStarsUI();
    if (HMC.wardrobe && HMC.wardrobe.updateBadge) {
      HMC.wardrobe.updateBadge();
    }
    setWeather(HMC.state.weather || 'sunny');
    HMC.modes.classic.renderClassicMode(false);
    HMC.audio.setPrompt('点草地任意地方，快乐小鸡就跑过去下蛋哦！', 'Tap anywhere on the grass to lay an egg!', false);
    registerOfflineSW();
  }

  HMC.app = {
    switchMode,
    setWeather,
    registerOfflineSW,
    boot
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.HMC = window.HMC || {});
