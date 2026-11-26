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

  /* ==========================================================================
     3-Tier Voice & Speech Engine (Tier 1 Parent Clip -> Tier 2 Offline MP3
     Pack via HMC.voicePack -> Tier 3 Web Speech API Fallback + Watchdog)
     ========================================================================== */

  let speechGen = 0;
  let currentSpeechPromise = Promise.resolve();
  let isActiveSpeaking = false;
  let activeClipAudio = null;
  let activeClipCancel = null;
  let activeUtterance = null;
  let pendingTransitions = new Set();
  let pendingTimers = new Set();

  function getNick() {
    return '';
  }

  function personalizeZh(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/^宝贝[，,]\s*/, '')
      .replace(/[，,]宝贝([！!？?。])/g, '$1');
  }

  function withNick(text) {
    return personalizeZh(text);
  }

  function stripSpeechDecorations(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/[【】]/g, '')
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\uFE0E\uFE0F\u200D\u20E3]/gu, '')
      .replace(/[\u00A0\u3000\s]+/g, ' ')
      .trim();
  }

  function normalizeVoiceKey(text) {
    if (!text || typeof text !== 'string') return '';
    let s = stripSpeechDecorations(text)
      .replace(/\.{3,}/g, '…')
      .replace(/~+/g, '～')
      .trim();
    // Collapse spaces adjacent to CJK characters or CJK punctuation so keys match identically
    s = s
      .replace(/([\u4E00-\u9FFF\u3001-\u303F\uFF00-\uFFEF])\s+/g, '$1')
      .replace(/\s+([\u4E00-\u9FFF\u3001-\u303F\uFF00-\uFFEF])/g, '$1')
      .replace(/\s+([,.;:!?])/g, '$1')
      .trim();
    return s;
  }

  function stopActiveClipPlayback() {
    if (typeof activeClipCancel === 'function') {
      const cancel = activeClipCancel;
      activeClipCancel = null;
      try { cancel(); } catch (e) {}
    }
    if (activeClipAudio) {
      const a = activeClipAudio;
      activeClipAudio = null;
      try {
        a.onended = null;
        a.onerror = null;
        if (typeof a.pause === 'function') a.pause();
        try { a.currentTime = 0; } catch (e) {}
      } catch (e) {}
    }
    activeUtterance = null;
  }

  function stopParentClip() {
    stopActiveClipPlayback();
  }

  function stopAllSpeech() {
    speechGen++;
    isActiveSpeaking = false;
    stopActiveClipPlayback();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    currentSpeechPromise = Promise.resolve();
  }

  function cancelPendingTransitions() {
    pendingTransitions.forEach(entry => {
      try { entry.cancel(); } catch (e) {}
    });
    pendingTransitions.clear();
    pendingTimers.forEach(t => {
      try { clearTimeout(t); } catch (e) {}
    });
    pendingTimers.clear();
  }

  function isSpeaking() {
    return isActiveSpeaking;
  }

  function getSpeechGen() {
    return speechGen;
  }

  function getCurrentSpeechPromise() {
    return currentSpeechPromise;
  }

  function pickVoice(langPrefix) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    return (
      voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix) && /ting|mei|sin|xiaoxiao|samantha|victoria|google/i.test(v.name)) ||
      voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix)) ||
      null
    );
  }

  function playAudioUrl(url, myGen) {
    return new Promise((resolve) => {
      if (myGen !== speechGen) {
        resolve('cancelled');
        return;
      }
      if (!url || typeof window === 'undefined' || typeof window.Audio !== 'function') {
        resolve('error');
        return;
      }

      let audio;
      try {
        audio = new window.Audio(url);
        audio.preload = 'auto';
      } catch (e) {
        resolve('error');
        return;
      }

      let settled = false;
      let watchdog = null;

      const cleanup = () => {
        if (watchdog) {
          clearTimeout(watchdog);
          watchdog = null;
        }
        try {
          audio.onended = null;
          audio.onerror = null;
        } catch (e) {}
        if (activeClipAudio === audio) activeClipAudio = null;
        if (activeClipCancel === cancelFn) activeClipCancel = null;
      };

      const finish = (status) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(status);
      };

      const cancelFn = () => {
        if (settled) return;
        settled = true;
        cleanup();
        try {
          if (typeof audio.pause === 'function') audio.pause();
          try { audio.currentTime = 0; } catch (e) {}
        } catch (e) {}
        resolve('cancelled');
      };

      activeClipAudio = audio;
      activeClipCancel = cancelFn;

      audio.onended = () => finish('ended');
      audio.onerror = () => finish('error');

      // Safety watchdog in case a media stream stalls without firing ended/error
      watchdog = setTimeout(() => {
        try {
          if (typeof audio.pause === 'function') audio.pause();
        } catch (e) {}
        finish('error');
      }, 15000);

      try {
        const playResult = audio.play();
        if (playResult && typeof playResult.then === 'function') {
          playResult.catch(() => finish('error'));
        }
      } catch (e) {
        finish('error');
      }
    });
  }

  function speakViaWebSpeech(seg, voiceStyle, myGen) {
    return new Promise((resolve) => {
      if (myGen !== speechGen) {
        resolve('cancelled');
        return;
      }
      if (
        !HMC.state ||
        !HMC.state.soundOn ||
        typeof window === 'undefined' ||
        !('speechSynthesis' in window) ||
        typeof window.SpeechSynthesisUtterance !== 'function'
      ) {
        resolve('skipped');
        return;
      }

      const cleanText = stripSpeechDecorations(seg.text);
      if (!cleanText) {
        resolve('ended');
        return;
      }

      let settled = false;
      let watchdog = null;
      let u = null;

      const cleanup = () => {
        if (watchdog) {
          clearTimeout(watchdog);
          watchdog = null;
        }
        if (u) {
          try {
            u.onend = null;
            u.onerror = null;
          } catch (e) {}
        }
        if (activeClipCancel === cancelFn) activeClipCancel = null;
        if (activeUtterance === u) activeUtterance = null;
      };

      const finish = (status) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(status);
      };

      const cancelFn = () => {
        if (settled) return;
        settled = true;
        cleanup();
        try {
          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        } catch (e) {}
        resolve('cancelled');
      };

      try {
        u = new window.SpeechSynthesisUtterance(cleanText);
        u.lang = seg.bcp47;
        u.pitch = 1.0;
        u.rate = voiceStyle === 'bedtime' ? 0.88 : 0.96;
        const voice = pickVoice(seg.lang);
        if (voice) u.voice = voice;

        activeUtterance = u;
        activeClipCancel = cancelFn;

        u.onend = () => finish('ended');
        u.onerror = () => finish('error');

        const watchdogMs = Math.max(1600, cleanText.length * 320 + 1200);
        watchdog = setTimeout(() => {
          finish('timeout');
        }, watchdogMs);

        window.speechSynthesis.speak(u);
      } catch (e) {
        finish('error');
      }
    });
  }

  async function speakInternal(zhText, enText, opts, myGen) {
    const state = HMC.state;
    if (!state || !state.soundOn || myGen !== speechGen) return;

    const finalZh = personalizeZh(zhText || '');
    const finalEn = typeof enText === 'string' ? enText : '';
    const voiceStyle = (opts && opts.voiceStyle) || 'daily';

    const segments = [];
    if (state.lang === 'zh') {
      if (finalZh) segments.push({ text: finalZh, lang: 'zh', bcp47: 'zh-CN' });
    } else if (state.lang === 'en') {
      if (finalEn || finalZh) segments.push({ text: finalEn || finalZh, lang: 'en', bcp47: 'en-US' });
    } else if (state.lang === 'bi') {
      if (finalZh) segments.push({ text: finalZh, lang: 'zh', bcp47: 'zh-CN' });
      if (finalEn) segments.push({ text: finalEn, lang: 'en', bcp47: 'en-US' });
    } else {
      if (finalZh) segments.push({ text: finalZh, lang: 'zh', bcp47: 'zh-CN' });
    }

    for (let i = 0; i < segments.length; i++) {
      if (myGen !== speechGen || !state.soundOn) return;
      const seg = segments[i];

      // Tier 2: Offline pre-generated MP3 pack via HMC.voicePack.resolve(text, lang, voiceStyle)
      let mp3Urls = null;
      if (HMC.voicePack && typeof HMC.voicePack.resolve === 'function') {
        try {
          const resolved = HMC.voicePack.resolve(seg.text, seg.lang, voiceStyle);
          if (Array.isArray(resolved) && resolved.length > 0) {
            mp3Urls = resolved.filter(u => typeof u === 'string' && u.length > 0);
          } else if (typeof resolved === 'string' && resolved.length > 0) {
            mp3Urls = [resolved];
          }
        } catch (e) {
          mp3Urls = null;
        }
      }

      let mp3Succeeded = false;
      if (mp3Urls && mp3Urls.length > 0 && typeof window !== 'undefined' && typeof window.Audio === 'function') {
        mp3Succeeded = true;
        for (let j = 0; j < mp3Urls.length; j++) {
          if (myGen !== speechGen || !state.soundOn) return;
          const res = await playAudioUrl(mp3Urls[j], myGen);
          if (res === 'cancelled' || myGen !== speechGen) return;
          if (res === 'error') {
            mp3Succeeded = false;
            break;
          }
        }
      }

      // Tier 3: Web Speech API fallback (natural pitch=1.0 + safety watchdog)
      if (!mp3Succeeded && myGen === speechGen && state.soundOn) {
        await speakViaWebSpeech(seg, voiceStyle, myGen);
      }
    }
  }

  function speak(zhText, enText = '', opts = {}) {
    stopAllSpeech();
    if (!HMC.state || !HMC.state.soundOn) {
      currentSpeechPromise = Promise.resolve();
      return currentSpeechPromise;
    }

    const myGen = speechGen;
    isActiveSpeaking = true;
    const p = speakInternal(zhText, enText, opts, myGen).finally(() => {
      if (myGen === speechGen) {
        isActiveSpeaking = false;
      }
    });
    currentSpeechPromise = p;
    return p;
  }

  function playParentClip(slotId, fallbackZh = '', fallbackEn = '', onDone = null, opts = {}) {
    stopAllSpeech();
    if (!HMC.state || !HMC.state.soundOn) {
      if (typeof onDone === 'function') {
        try { onDone(false); } catch (e) {}
      }
      currentSpeechPromise = Promise.resolve();
      return currentSpeechPromise;
    }

    const hasClip = !!(
      HMC.storage &&
      typeof HMC.storage.hasVoiceClip === 'function' &&
      HMC.storage.hasVoiceClip(slotId)
    );
    const dataUrl = hasClip && typeof HMC.storage.getVoiceClip === 'function'
      ? HMC.storage.getVoiceClip(slotId)
      : null;

    if (!dataUrl || typeof window === 'undefined' || typeof window.Audio !== 'function') {
      const p = (fallbackZh || fallbackEn)
        ? speak(fallbackZh, fallbackEn, opts)
        : Promise.resolve();
      if (typeof onDone === 'function') {
        p.then(() => {
          try { onDone(false); } catch (e) {}
        });
      }
      return p;
    }

    const myGen = speechGen;
    isActiveSpeaking = true;
    const p = (async () => {
      try {
        const res = await playAudioUrl(dataUrl, myGen);
        if (myGen !== speechGen) {
          if (typeof onDone === 'function') {
            try { onDone(false); } catch (e) {}
          }
          return;
        }
        if (res === 'ended') {
          if (typeof onDone === 'function') {
            try { onDone(true); } catch (e) {}
          }
          return;
        }
        if (fallbackZh || fallbackEn) {
          await speakInternal(fallbackZh, fallbackEn, opts, myGen);
        }
        if (typeof onDone === 'function') {
          try { onDone(false); } catch (e) {}
        }
      } finally {
        if (myGen === speechGen) {
          isActiveSpeaking = false;
        }
      }
    })();

    currentSpeechPromise = p;
    return p;
  }

  function delayTracked(ms, entry) {
    return new Promise((resolve) => {
      const t = setTimeout(() => {
        pendingTimers.delete(t);
        if (entry) entry.timers.delete(t);
        resolve();
      }, Math.max(0, ms));
      pendingTimers.add(t);
      if (entry) entry.timers.add(t);
    });
  }

  function raceWithTimeoutTracked(promise, ms, entry) {
    if (!promise || typeof promise.then !== 'function') return Promise.resolve();
    return new Promise((resolve) => {
      let done = false;
      let t = null;
      const finish = () => {
        if (done) return;
        done = true;
        if (t) {
          clearTimeout(t);
          pendingTimers.delete(t);
          if (entry) entry.timers.delete(t);
          t = null;
        }
        resolve();
      };
      t = setTimeout(finish, Math.max(0, ms));
      pendingTimers.add(t);
      if (entry) entry.timers.add(t);
      promise.then(finish, finish);
    });
  }

  function waitForSpeechThen(minDelayMs, callback, guardFn = null, maxWaitMs = 9000) {
    const minMs = Math.max(0, Number(minDelayMs) || 0);
    const maxMs = Math.max(minMs, Number(maxWaitMs) || 9000);
    const startTime = Date.now();
    const entry = {
      cancelled: false,
      timers: new Set(),
      cancel() {
        this.cancelled = true;
        this.timers.forEach(t => {
          clearTimeout(t);
          pendingTimers.delete(t);
        });
        this.timers.clear();
      }
    };
    pendingTransitions.add(entry);

    const finalize = () => {
      pendingTransitions.delete(entry);
      if (entry.cancelled) return;
      if (typeof guardFn === 'function') {
        try {
          if (!guardFn()) return;
        } catch (e) {
          return;
        }
      }
      if (typeof callback === 'function') {
        callback();
      }
    };

    const soundOn = !!(HMC.state && HMC.state.soundOn);
    if (!soundOn) {
      delayTracked(minMs, entry).then(finalize);
      return entry;
    }

    const activeSpeech = currentSpeechPromise;
    Promise.all([
      delayTracked(minMs, entry),
      raceWithTimeoutTracked(activeSpeech, maxMs, entry)
    ]).then(() => {
      if (entry.cancelled) return;
      const latestSpeech = currentSpeechPromise;
      const elapsed = Date.now() - startTime;
      const remainingMs = Math.max(0, maxMs - elapsed);
      if (latestSpeech && latestSpeech !== activeSpeech && remainingMs > 50) {
        return raceWithTimeoutTracked(latestSpeech, remainingMs, entry);
      }
    }).then(() => {
      if (entry.cancelled) return;
      return delayTracked(260, entry);
    }).then(finalize);

    return entry;
  }

  function setPrompt(zh, en, shouldSpeak = true, opts = {}) {
    const state = HMC.state;
    const finalZh = personalizeZh(zh || '');
    const finalEn = typeof en === 'string' ? en : '';
    const voiceStyle = (opts && opts.voiceStyle) || 'daily';
    state.lastPromptZh = finalZh;
    state.lastPromptEn = finalEn;
    state.lastPromptVoiceStyle = voiceStyle;
    const promptTextEl = document.getElementById('promptText');
    if (promptTextEl) {
      if (state.lang === 'en') promptTextEl.textContent = finalEn || finalZh;
      else if (state.lang === 'bi') promptTextEl.textContent = finalEn ? `${finalZh} · ${finalEn}` : finalZh;
      else promptTextEl.textContent = finalZh;
    }
    if (shouldSpeak) return speak(finalZh, finalEn, opts);
    return currentSpeechPromise;
  }

  function praiseWithPrompt(zhText, enText = '', opts = {}) {
    const cleanZh = withNick(zhText);
    setPrompt(cleanZh, enText, false, opts);
    return playParentClip('praise', cleanZh, enText, null, opts);
  }

  function initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
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
    normalizeVoiceKey,
    stopParentClip,
    stopAllSpeech,
    cancelPendingTransitions,
    isSpeaking,
    getSpeechGen,
    getCurrentSpeechPromise,
    playParentClip,
    pickVoice,
    speak,
    waitForSpeechThen,
    setPrompt,
    praiseWithPrompt,
    initVoices
  };
})(window.HMC = window.HMC || {});
