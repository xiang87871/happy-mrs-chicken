(function (HMC) {
  'use strict';

  let audioCtx = null;

  function getAudio() {
    if (!HMC.state.soundOn) return null;
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone(freq, duration, type = 'sine', volume = 0.22, delay = 0, slideTo = null) {
    const ctx = getAudio();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  const SFX = {
    cluck() {
      playTone(420, 0.08, 'triangle', 0.24, 0, 580);
      playTone(460, 0.08, 'triangle', 0.24, 0.1, 630);
      playTone(540, 0.18, 'triangle', 0.28, 0.21, 780);
      playTone(300, 0.12, 'sine', 0.2, 0.24, 620);
    },
    pop() {
      playTone(320, 0.11, 'sine', 0.26, 0, 740);
    },
    crack() {
      playTone(900, 0.04, 'square', 0.1, 0, 420);
      playTone(1150, 0.05, 'triangle', 0.14, 0.05, 620);
    },
    cheep() {
      playTone(1150, 0.09, 'sine', 0.2, 0, 1680);
      playTone(1250, 0.11, 'sine', 0.2, 0.11, 1820);
    },
    crunch() {
      playTone(340, 0.06, 'triangle', 0.24, 0, 520);
      playTone(640, 0.09, 'sine', 0.22, 0.06, 860);
    },
    success() {
      [523.25, 659.25, 783.99, 1046.5].forEach((n, i) => playTone(n, 0.2, 'triangle', 0.22, i * 0.09));
    },
    fanfare() {
      const notes = [523.25, 659.25, 783.99, 659.25, 1046.5, 1174.66, 1046.5];
      const times = [0, 0.1, 0.2, 0.3, 0.42, 0.56, 0.72];
      notes.forEach((n, i) => playTone(n, 0.24, 'triangle', 0.24, times[i]));
    },
    boing() {
      playTone(320, 0.18, 'sine', 0.2, 0, 210);
      playTone(220, 0.16, 'sine', 0.16, 0.15, 290);
    },
    splash() {
      playTone(260, 0.12, 'sine', 0.22, 0, 560);
      playTone(420, 0.1, 'sine', 0.18, 0.08, 780);
      playTone(300, 0.14, 'triangle', 0.16, 0.14, 200);
    },
    rain() {
      const drops = [
        { f: 1174.66, d: 0.08, t: 0.00, v: 0.11 },
        { f: 1396.91, d: 0.07, t: 0.08, v: 0.09 },
        { f: 1046.50, d: 0.09, t: 0.15, v: 0.12 },
        { f: 1567.98, d: 0.07, t: 0.23, v: 0.10 },
        { f: 1318.51, d: 0.08, t: 0.31, v: 0.11 },
        { f: 1760.00, d: 0.08, t: 0.39, v: 0.09 },
        { f: 1174.66, d: 0.10, t: 0.48, v: 0.11 },
        { f: 1567.98, d: 0.11, t: 0.57, v: 0.09 }
      ];
      drops.forEach(p => playTone(p.f, p.d, 'sine', p.v, p.t, p.f * 0.86));
    },
    magic() {
      const notes = [659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98, 2093.0];
      notes.forEach((n, i) => {
        playTone(n, 0.22, i % 2 === 0 ? 'sine' : 'triangle', 0.16, i * 0.065);
      });
    },
    lullaby() {
      [523.25, 493.88, 440, 392, 440, 392, 329.63].forEach((n, i) => playTone(n, 0.45, 'sine', 0.16, i * 0.38));
    },
    marimba(freq = 523.25) {
      const ctx = getAudio();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.28, now + 0.008);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.linearRampToValueAtTime(0.11, now + 0.006);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.14);
    },
    bubble() {
      playTone(420, 0.09, 'sine', 0.22, 0, 920);
      playTone(680, 0.07, 'sine', 0.16, 0.075, 1340);
    },
    brush() {
      playTone(660, 0.06, 'triangle', 0.14, 0, 1180);
      playTone(1040, 0.06, 'triangle', 0.12, 0.07, 680);
      playTone(880, 0.06, 'triangle', 0.14, 0.14, 1420);
      playTone(1567.98, 0.12, 'sine', 0.14, 0.20, 1975.53);
    },
    quack() {
      const ctx = getAudio();
      if (!ctx) return;
      const playSqueak = (offset, baseFreq) => {
        try {
          const now = ctx.currentTime + offset;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.38, now + 0.04);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.78, now + 0.12);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.2, now + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

          if (typeof ctx.createBiquadFilter === 'function') {
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1150, now);
            filter.frequency.exponentialRampToValueAtTime(820, now + 0.12);
            filter.Q.setValueAtTime(3.2, now);
            osc.connect(filter);
            filter.connect(gain);
          } else {
            osc.connect(gain);
          }
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.145);
        } catch (e) {
          playTone(baseFreq, 0.11, 'triangle', 0.2, offset, baseFreq * 0.78);
        }
      };
      playSqueak(0, 560);
      playSqueak(0.14, 620);
    },
    blow() {
      const ctx = getAudio();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const dur = 0.36;
        if (typeof ctx.createBuffer === 'function' && typeof ctx.createBufferSource === 'function') {
          const sr = ctx.sampleRate || 44100;
          const len = Math.max(1, Math.floor(sr * dur));
          const buf = ctx.createBuffer(1, len, sr);
          const data = buf.getChannelData(0);
          let last = 0;
          for (let i = 0; i < len; i++) {
            const white = Math.random() * 2 - 1;
            last = (last + 0.12 * white) / 1.12;
            data[i] = last * 2.2;
          }
          const src = ctx.createBufferSource();
          src.buffer = buf;

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.11, now + 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

          if (typeof ctx.createBiquadFilter === 'function') {
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(460, now);
            filter.frequency.linearRampToValueAtTime(620, now + dur * 0.6);
            filter.frequency.linearRampToValueAtTime(420, now + dur);
            filter.Q.setValueAtTime(1.1, now);
            src.connect(filter);
            filter.connect(gain);
          } else {
            src.connect(gain);
          }
          gain.connect(ctx.destination);
          src.start(now);
          src.stop(now + dur + 0.02);
        }
        playTone(195, 0.3, 'sine', 0.055, 0, 225);
      } catch (e) {
        playTone(210, 0.28, 'sine', 0.08, 0, 240);
      }
    },
    gargle() {
      // Playful bubbly rapid-pitch water gargle ("咕噜咕噜") + bright rinse splash ("噗!")
      const bubs = [
        { f: 350, to: 620, d: 0.065, t: 0.00, v: 0.18 },
        { f: 560, to: 390, d: 0.060, t: 0.06, v: 0.16 },
        { f: 410, to: 720, d: 0.065, t: 0.12, v: 0.19 },
        { f: 640, to: 430, d: 0.060, t: 0.18, v: 0.16 },
        { f: 460, to: 780, d: 0.065, t: 0.24, v: 0.19 },
        { f: 680, to: 460, d: 0.060, t: 0.30, v: 0.15 }
      ];
      bubs.forEach(b => playTone(b.f, b.d, 'sine', b.v, b.t, b.to));
      // Playful clean splash finish
      playTone(500, 0.11, 'sine', 0.20, 0.38, 1080);
      playTone(860, 0.12, 'triangle', 0.15, 0.45, 520);
      playTone(1174.66, 0.10, 'sine', 0.12, 0.50, 1567.98);
    },
    clickSwitch() {
      // Crisp tactile "咔哒!" pull-cord light switch click
      playTone(1750, 0.028, 'square', 0.11, 0, 680);
      playTone(980, 0.036, 'triangle', 0.18, 0.032, 340);
      playTone(1320, 0.03, 'sine', 0.09, 0.055, 880);
    },
    yawn() {
      // Gentle warm descending sleepy yawn chime ("啊～")
      const ctx = getAudio();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const dur = 0.62;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(510, now);
        osc.frequency.exponentialRampToValueAtTime(595, now + 0.16);
        osc.frequency.exponentialRampToValueAtTime(300, now + dur);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.17, now + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.03);

        // Warm soft harmonic glow
        playTone(392, 0.52, 'triangle', 0.08, 0.08, 246.94);
      } catch (e) {
        playTone(540, 0.52, 'sine', 0.16, 0, 300);
      }
    },
    slide() {
      // Playful descending slide whistle glissando ("咻——！") + cute landing chime!
      playTone(1040, 0.06, 'sine', 0.16, 0, 1340);
      playTone(1320, 0.54, 'sine', 0.23, 0.05, 390);
      playTone(1960, 0.46, 'triangle', 0.09, 0.06, 585);
      // Cute bouncy landing chime
      playTone(783.99, 0.13, 'triangle', 0.21, 0.56, 880);
      playTone(1046.5, 0.22, 'sine', 0.22, 0.65);
    },
    trampoline(pitchMult = 1) {
      // Springy ascending rubbery boing-boing!
      const m = Math.max(0.75, Math.min(1.6, Number(pitchMult) || 1));
      playTone(195 * m, 0.18, 'sine', 0.25, 0, 540 * m);
      playTone(290 * m, 0.16, 'triangle', 0.18, 0.035, 690 * m);
      playTone(520 * m, 0.13, 'sine', 0.15, 0.11, 860 * m);
    },
    hammer() {
      // Punchy comical cartoon toy-mallet "咚！咣！" wooden knock + bright sparkling chime!
      playTone(235, 0.10, 'triangle', 0.30, 0, 118);
      playTone(540, 0.075, 'square', 0.11, 0.015, 290);
      playTone(360, 0.09, 'sine', 0.22, 0.045, 760);
      playTone(1046.5, 0.14, 'triangle', 0.18, 0.08, 1318.51);
      playTone(1567.98, 0.19, 'sine', 0.16, 0.13);
    },
    hardKnock() {
      // Funny hollow "叩叩！" hard-shell bonk when tapping a Golden Egg bare-handed
      playTone(480, 0.055, 'triangle', 0.24, 0, 290);
      playTone(860, 0.035, 'sine', 0.12, 0, 620);
      playTone(560, 0.06, 'triangle', 0.24, 0.105, 330);
      playTone(960, 0.04, 'sine', 0.11, 0.105, 700);
    }
  };

  let activeParentAudio = null;

  function getNick() {
    if (HMC.storage && typeof HMC.storage.getNickname === 'function') {
      return HMC.storage.getNickname() || '宝贝';
    }
    return '宝贝';
  }

  function personalizeZh(text) {
    if (!text || typeof text !== 'string') return '';
    const nick = getNick();
    if (!nick || nick === '宝贝') return text;
    return text.replace(/宝贝/g, nick);
  }

  function withNick(text) {
    const base = personalizeZh(text);
    if (!base) return '';
    const nick = getNick();
    if (base.includes(nick)) return base;
    return `${nick}，${base}`;
  }

  function stopParentClip() {
    if (activeParentAudio) {
      try {
        activeParentAudio.onended = null;
        activeParentAudio.onerror = null;
        if (typeof activeParentAudio.pause === 'function') activeParentAudio.pause();
        try { activeParentAudio.currentTime = 0; } catch (e) {}
      } catch (e) {}
      activeParentAudio = null;
    }
  }

  function pickVoice(langPrefix) {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    return (
      voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix) && /ting|mei|sin|xiaoxiao|samantha|victoria|google/i.test(v.name)) ||
      voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix)) ||
      null
    );
  }

  function speak(zhText, enText = '') {
    const state = HMC.state;
    stopParentClip();
    if (!state.soundOn || !('speechSynthesis' in window)) return;
    const finalZh = personalizeZh(zhText || '');
    try {
      window.speechSynthesis.cancel();
      const queue = [];
      if (state.lang === 'zh' && finalZh) queue.push({ text: finalZh, lang: 'zh-CN', prefix: 'zh' });
      else if (state.lang === 'en' && (enText || finalZh)) queue.push({ text: enText || finalZh, lang: 'en-US', prefix: 'en' });
      else if (state.lang === 'bi') {
        if (finalZh) queue.push({ text: finalZh, lang: 'zh-CN', prefix: 'zh' });
        if (enText) queue.push({ text: enText, lang: 'en-US', prefix: 'en' });
      }

      queue.forEach(item => {
        const u = new SpeechSynthesisUtterance(item.text);
        u.lang = item.lang;
        u.rate = item.prefix === 'zh' ? 0.94 : 0.88;
        u.pitch = 1.18;
        const voice = pickVoice(item.prefix);
        if (voice) u.voice = voice;
        window.speechSynthesis.speak(u);
      });
    } catch (e) {}
  }

  function playParentClip(slotId, fallbackZh = '', fallbackEn = '', onDone = null) {
    stopParentClip();
    if (!HMC.state || !HMC.state.soundOn) {
      if (typeof onDone === 'function') onDone(false);
      return false;
    }

    const hasClip = !!(
      HMC.storage &&
      typeof HMC.storage.hasVoiceClip === 'function' &&
      HMC.storage.hasVoiceClip(slotId)
    );
    const dataUrl = hasClip && typeof HMC.storage.getVoiceClip === 'function'
      ? HMC.storage.getVoiceClip(slotId)
      : null;

    if (!dataUrl || typeof window.Audio !== 'function') {
      if (fallbackZh || fallbackEn) speak(fallbackZh, fallbackEn);
      if (typeof onDone === 'function') onDone(false);
      return false;
    }

    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }

    let audio;
    try {
      audio = new window.Audio(dataUrl);
    } catch (e) {
      if (fallbackZh || fallbackEn) speak(fallbackZh, fallbackEn);
      if (typeof onDone === 'function') onDone(false);
      return false;
    }

    let settled = false;
    const handleFallback = () => {
      if (settled) return;
      settled = true;
      if (activeParentAudio === audio) activeParentAudio = null;
      if (fallbackZh || fallbackEn) speak(fallbackZh, fallbackEn);
      if (typeof onDone === 'function') onDone(false);
    };
    const handleEnded = () => {
      if (settled) return;
      settled = true;
      if (activeParentAudio === audio) activeParentAudio = null;
      if (typeof onDone === 'function') onDone(true);
    };

    activeParentAudio = audio;
    audio.onended = handleEnded;
    audio.onerror = handleFallback;

    try {
      const playResult = audio.play();
      if (playResult && typeof playResult.then === 'function') {
        playResult.catch(() => handleFallback());
      }
      return true;
    } catch (e) {
      handleFallback();
      return false;
    }
  }

  function setPrompt(zh, en, shouldSpeak = true) {
    const state = HMC.state;
    const finalZh = personalizeZh(zh || '');
    state.lastPromptZh = finalZh;
    state.lastPromptEn = en || '';
    const promptTextEl = document.getElementById('promptText');
    if (promptTextEl) {
      if (state.lang === 'en') promptTextEl.textContent = en || finalZh;
      else if (state.lang === 'bi') promptTextEl.textContent = en ? `${finalZh} · ${en}` : finalZh;
      else promptTextEl.textContent = finalZh;
    }
    if (shouldSpeak) speak(finalZh, en);
  }

  function praiseWithPrompt(zhText, enText = '') {
    const personalizedZh = withNick(zhText);
    setPrompt(personalizedZh, enText, false);
    return playParentClip('praise', personalizedZh, enText);
  }

  function initVoices() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }

  HMC.audio = {
    getAudio,
    playTone,
    SFX,
    getNick,
    personalizeZh,
    withNick,
    stopParentClip,
    playParentClip,
    pickVoice,
    speak,
    setPrompt,
    praiseWithPrompt,
    initVoices
  };
})(window.HMC = window.HMC || {});
