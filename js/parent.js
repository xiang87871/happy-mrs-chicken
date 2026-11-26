(function (HMC) {
  'use strict';

  const MAX_RECORD_MS = 4500;

  let activeTab = 'settings';
  let activeRecSession = null;
  let activeRecAutoStopTimer = null;
  let activeRecCountdownTimer = null;
  let pendingMicRequest = false;
  let micRequestToken = 0;
  let voiceBannerNotice = null;
  let resetInsightsConfirmPending = false;
  let resetInsightsConfirmTimer = null;

  function getEls() {
    return {
      parentModal: document.getElementById('parentModal'),
      parentTabs: document.getElementById('parentTabs'),
      panelSettings: document.getElementById('parentPanelSettings'),
      panelVoices: document.getElementById('parentPanelVoices'),
      panelInsights: document.getElementById('parentTabInsights'),
      insightsContent: document.getElementById('insightsContent'),
      voiceSupportBanner: document.getElementById('voiceSupportBanner'),
      voiceSlotsList: document.getElementById('voiceSlotsList'),
      voiceCountBadge: document.getElementById('voiceCountBadge'),
      timerStatusLine: document.getElementById('timerStatusLine'),
      timerBadgeBtn: document.getElementById('timerBadgeBtn'),
      sleepOverlay: document.getElementById('sleepOverlay'),
      sleepGreetingText: document.getElementById('sleepGreetingText')
    };
  }

  function isParentModalOpen() {
    const { parentModal } = getEls();
    return !!(parentModal && parentModal.classList.contains('open'));
  }

  function getVoiceSlots() {
    if (HMC.data && Array.isArray(HMC.data.VOICE_SLOTS) && HMC.data.VOICE_SLOTS.length > 0) {
      return HMC.data.VOICE_SLOTS;
    }
    return [
      { id: 'praise', icon: '🌟', title: '答对夸奖',   hintTpl: '例：“你真棒！答对啦！”' },
      { id: 'lay',    icon: '🥚', title: '下蛋咯咯哒', hintTpl: '例：“咯咯哒！快乐小鸡下蛋啦！”' },
      { id: 'party',  icon: '🎉', title: '集星开派对', hintTpl: '例：“太厉害啦，开派对咯！”' },
      { id: 'sleep',  icon: '🌙', title: '护眼说晚安', hintTpl: '例：“小鸡睡觉咯，晚安哟！”' }
    ];
  }

  function isRecordingSupported() {
    return !!(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof window.MediaRecorder !== 'undefined'
    );
  }

  function pickSupportedMimeType() {
    if (typeof window.MediaRecorder === 'undefined' || typeof window.MediaRecorder.isTypeSupported !== 'function') {
      return '';
    }
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    for (let i = 0; i < candidates.length; i++) {
      try {
        if (window.MediaRecorder.isTypeSupported(candidates[i])) {
          return candidates[i];
        }
      } catch (e) {}
    }
    return '';
  }

  /* ==========================================================================
     Recording Lifecycle Management (Zero Mic Track Leaks!)
     ========================================================================== */
  function clearRecTimers() {
    if (activeRecAutoStopTimer) {
      clearTimeout(activeRecAutoStopTimer);
      activeRecAutoStopTimer = null;
    }
    if (activeRecCountdownTimer) {
      clearInterval(activeRecCountdownTimer);
      activeRecCountdownTimer = null;
    }
  }

  function releaseMicStream(streamOverride = null) {
    const target = streamOverride || (activeRecSession && activeRecSession.stream);
    if (target) {
      try {
        const tracks = typeof target.getTracks === 'function' ? target.getTracks() : [];
        tracks.forEach(track => {
          try { track.stop(); } catch (e) {}
        });
      } catch (e) {}
    }
    if (activeRecSession && (!streamOverride || streamOverride === activeRecSession.stream)) {
      activeRecSession.stream = null;
    }
  }

  function stopActiveRecording(discard = false) {
    clearRecTimers();
    const session = activeRecSession;
    if (!session) return;

    session.cancelled = session.cancelled || !!discard;
    const recorder = session.recorder;

    if (discard) {
      activeRecSession = null;
      releaseMicStream(session.stream);
      session.stream = null;
      session.chunks = [];
    }

    if (recorder && recorder.state && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch (e) {}
    }
  }

  function getRemainingRecSec() {
    if (!activeRecSession || !activeRecSession.startAt) return Math.ceil(MAX_RECORD_MS / 1000);
    const elapsed = Date.now() - activeRecSession.startAt;
    const remMs = Math.max(0, MAX_RECORD_MS - elapsed);
    return Math.max(1, Math.ceil(remMs / 1000));
  }

  function updateRecordingCountdownLabel() {
    if (!activeRecSession) return;
    const btn = document.querySelector(`.voice-rec-btn[data-slot-id="${activeRecSession.slotId}"]`);
    if (btn) {
      btn.textContent = `⏹️ 停止 (${getRemainingRecSec()}s)`;
    }
  }

  function getSlotPreviewTexts(slotId) {
    if (slotId === 'praise') {
      return {
        zh: '你真棒！答对啦！',
        en: 'Great job! You got it right!'
      };
    }
    if (slotId === 'lay') {
      return {
        zh: '咯咯哒！快乐小鸡下蛋啦！',
        en: 'Cluck cluck! Happy Mrs. Chicken laid an egg!'
      };
    }
    if (slotId === 'party') {
      return {
        zh: '哇！集齐五颗星啦！快乐小鸡大派对！',
        en: 'Five stars! Happy Mrs. Chicken party!'
      };
    }
    return {
      zh: '快乐小鸡困啦，要睡觉咯。今天玩得真棒，让眼睛和小鸡一起休息一下吧，晚安哟！',
      en: 'Happy Mrs. Chicken is sleepy. Good night!',
      voiceStyle: 'bedtime'
    };
  }

  function startRecordingSlot(slotId) {
    // Clicking the currently recording slot stops & saves it immediately
    if (activeRecSession && activeRecSession.slotId === slotId) {
      stopActiveRecording(false);
      return;
    }

    // Prevent overlapping getUserMedia() requests on rapid double-clicks
    if (pendingMicRequest) {
      return;
    }

    // Cancel any other active recording before starting a new one
    if (activeRecSession) {
      stopActiveRecording(true);
    }

    if (HMC.audio && typeof HMC.audio.stopAllSpeech === 'function') {
      HMC.audio.stopAllSpeech();
    } else if (HMC.audio && typeof HMC.audio.stopParentClip === 'function') {
      HMC.audio.stopParentClip();
    }

    if (!isRecordingSupported()) {
      voiceBannerNotice = {
        type: 'warn',
        text: 'ℹ️ 当前浏览器或环境暂不支持麦克风录音，已自动使用默认语音。'
      };
      renderVoicesPanel();
      return;
    }

    voiceBannerNotice = null;
    pendingMicRequest = true;
    const reqToken = ++micRequestToken;

    let micPromise;
    try {
      micPromise = navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      pendingMicRequest = false;
      voiceBannerNotice = {
        type: 'warn',
        text: '🎤 暂时无法开启麦克风，游戏会自动使用默认语音。'
      };
      renderVoicesPanel();
      return;
    }

    Promise.resolve(micPromise).then((stream) => {
      pendingMicRequest = false;
      // Guard against modal closed or tab switched while waiting for mic permission
      if (reqToken !== micRequestToken || !isParentModalOpen() || activeTab !== 'voices') {
        releaseMicStream(stream);
        return;
      }

      const mimeType = pickSupportedMimeType();
      let recorder;
      try {
        recorder = mimeType
          ? new window.MediaRecorder(stream, { mimeType })
          : new window.MediaRecorder(stream);
      } catch (e) {
        try {
          recorder = new window.MediaRecorder(stream);
        } catch (err2) {
          releaseMicStream(stream);
          voiceBannerNotice = {
            type: 'warn',
            text: '🎤 当前浏览器暂无法初始化录音器，已自动使用默认语音。'
          };
          renderVoicesPanel();
          return;
        }
      }

      const session = {
        slotId,
        stream,
        recorder,
        mimeType,
        chunks: [],
        startAt: Date.now(),
        cancelled: false
      };
      activeRecSession = session;

      recorder.ondataavailable = (ev) => {
        if (ev && ev.data && ev.data.size > 0) {
          session.chunks.push(ev.data);
        }
      };

      recorder.onerror = () => {
        if (activeRecSession === session) {
          clearRecTimers();
          activeRecSession = null;
        }
        releaseMicStream(stream);
        voiceBannerNotice = {
          type: 'warn',
          text: '🎤 录音过程遇到一点小问题，请再试一次哦！'
        };
        if (isParentModalOpen() && activeTab === 'voices') {
          renderVoicesPanel();
        }
      };

      recorder.onstop = () => {
        if (activeRecSession === session) {
          clearRecTimers();
          activeRecSession = null;
        }
        releaseMicStream(stream);

        if (session.cancelled) {
          if (isParentModalOpen() && activeTab === 'voices') {
            renderVoicesPanel();
          }
          return;
        }

        const chunks = session.chunks.slice();
        session.chunks = [];

        if (chunks.length === 0) {
          voiceBannerNotice = {
            type: 'warn',
            text: '🎤 没有录到声音哦，请靠近麦克风再试一次吧！'
          };
          renderVoicesPanel();
          return;
        }

        const chunkType = chunks[0] && typeof chunks[0].type === 'string' && chunks[0].type.startsWith('audio/')
          ? chunks[0].type
          : '';
        const blobType = chunkType || session.mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: blobType });

        if (typeof FileReader === 'undefined') {
          voiceBannerNotice = {
            type: 'warn',
            text: '⚠️ 当前环境不支持保存录音，已自动使用默认语音。'
          };
          renderVoicesPanel();
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : '';
          const res = (HMC.storage && typeof HMC.storage.saveVoiceClip === 'function')
            ? HMC.storage.saveVoiceClip(session.slotId, dataUrl)
            : { ok: false, reason: 'unavailable' };

          if (res && res.ok) {
            voiceBannerNotice = {
              type: 'success',
              text: '✅ 爸妈原声已保存在本机！点「试听」立即听听效果吧！'
            };
            if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.success();
          } else if (res && res.reason === 'quota') {
            voiceBannerNotice = {
              type: 'warn',
              text: '⚠️ 本机存储空间已满，可先删除一条旧录音后再试，或继续使用默认语音。'
            };
          } else {
            voiceBannerNotice = {
              type: 'warn',
              text: '⚠️ 录音保存失败，请再试一次，游戏会自动使用默认语音。'
            };
          }
          updateVoiceCountBadge();
          if (isParentModalOpen() && activeTab === 'voices') {
            renderVoicesPanel();
          }
        };
        reader.onerror = () => {
          voiceBannerNotice = {
            type: 'warn',
            text: '⚠️ 录音读取失败，请再试一次哦！'
          };
          renderVoicesPanel();
        };
        reader.readAsDataURL(blob);
      };

      try {
        recorder.start();
      } catch (e) {
        if (activeRecSession === session) activeRecSession = null;
        releaseMicStream(stream);
        voiceBannerNotice = {
          type: 'warn',
          text: '🎤 无法开始录音，请检查麦克风权限后重试。'
        };
        renderVoicesPanel();
        return;
      }

      renderVoicesPanel();
      activeRecCountdownTimer = setInterval(updateRecordingCountdownLabel, 250);
      activeRecAutoStopTimer = setTimeout(() => {
        if (activeRecSession === session) {
          stopActiveRecording(false);
        }
      }, MAX_RECORD_MS);
    }).catch((err) => {
      pendingMicRequest = false;
      releaseMicStream();
      const errName = err && err.name ? err.name : '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        voiceBannerNotice = {
          type: 'warn',
          text: '🎤 未获得麦克风权限，请在浏览器设置中允许麦克风；未录制时会自动使用默认语音。'
        };
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        voiceBannerNotice = {
          type: 'warn',
          text: '🎤 未检测到可用麦克风，游戏会自动使用温柔默认语音。'
        };
      } else {
        voiceBannerNotice = {
          type: 'warn',
          text: '🎤 麦克风暂不可用，游戏会自动使用温柔默认语音。'
        };
      }
      renderVoicesPanel();
    });
  }

  /* ==========================================================================
     Voice Pack UI Rendering
     ========================================================================== */
  function updateVoiceCountBadge() {
    const { voiceCountBadge } = getEls();
    if (!voiceCountBadge) return;
    const slots = getVoiceSlots();
    const clips = (HMC.storage && typeof HMC.storage.getVoiceClips === 'function')
      ? HMC.storage.getVoiceClips()
      : {};
    const count = slots.filter(s => Boolean(clips[s.id])).length;
    voiceCountBadge.textContent = `${count}/${slots.length}`;
  }

  function renderVoiceBanner() {
    const { voiceSupportBanner } = getEls();
    if (!voiceSupportBanner) return;

    const supported = isRecordingSupported();
    voiceSupportBanner.classList.remove('is-warn', 'is-success');

    if (voiceBannerNotice && voiceBannerNotice.text) {
      if (voiceBannerNotice.type === 'warn') voiceSupportBanner.classList.add('is-warn');
      else if (voiceBannerNotice.type === 'success') voiceSupportBanner.classList.add('is-success');
      voiceSupportBanner.textContent = voiceBannerNotice.text;
      return;
    }

    if (supported) {
      voiceSupportBanner.textContent = '🔒 录音 100% 保存在本机（不上传网络），单条最长自动停于 4.5 秒；未录制或静音时无缝使用内置语音。';
    } else {
      voiceSupportBanner.classList.add('is-warn');
      voiceSupportBanner.textContent = 'ℹ️ 当前浏览器或环境暂不支持麦克风录音，已自动使用内置默认语音；使用 Safari / Chrome 即可录下爸妈原声（仅存本机）。';
    }
  }

  function renderVoicesPanel() {
    const { voiceSlotsList } = getEls();
    updateVoiceCountBadge();
    renderVoiceBanner();
    if (!voiceSlotsList) return;

    const slots = getVoiceSlots();
    const clips = (HMC.storage && typeof HMC.storage.getVoiceClips === 'function')
      ? HMC.storage.getVoiceClips()
      : {};
    const supported = isRecordingSupported();

    voiceSlotsList.innerHTML = '';

    slots.forEach(slot => {
      const hasClip = Boolean(clips[slot.id]);
      const currentRecId = activeRecSession ? activeRecSession.slotId : null;
      const isRecThis = currentRecId === slot.id;
      const isRecOther = Boolean(currentRecId && currentRecId !== slot.id);
      const hintText = String(slot.hintTpl || '').replace(/\{nick\}/g, '');

      const card = document.createElement('div');
      card.className = 'voice-slot-card' + (isRecThis ? ' is-recording' : (hasClip ? ' is-recorded' : ''));
      card.dataset.slotId = slot.id;

      const topRow = document.createElement('div');
      topRow.className = 'voice-slot-top';

      const heading = document.createElement('div');
      heading.className = 'voice-slot-heading';
      heading.textContent = `${slot.icon} ${slot.title}`;

      const statusPill = document.createElement('span');
      statusPill.className = 'voice-status-pill' + (isRecThis ? ' recording' : (hasClip ? ' recorded' : ''));
      statusPill.textContent = isRecThis
        ? '🎙️ 录音中…'
        : (hasClip ? '✅ 已录爸妈原声' : '🔊 默认语音');

      topRow.appendChild(heading);
      topRow.appendChild(statusPill);

      const hintEl = document.createElement('div');
      hintEl.className = 'voice-slot-hint';
      hintEl.textContent = hintText;

      const actionsRow = document.createElement('div');
      actionsRow.className = 'voice-slot-actions';

      // Record / Stop button
      const recBtn = document.createElement('button');
      recBtn.type = 'button';
      recBtn.className = 'ctrl-btn voice-action-btn voice-rec-btn' + (isRecThis ? ' recording' : '');
      recBtn.dataset.slotId = slot.id;
      if (isRecThis) {
        recBtn.textContent = `⏹️ 停止 (${getRemainingRecSec()}s)`;
      } else {
        recBtn.textContent = hasClip ? '🎙️ 重录' : '🎙️ 录制';
      }
      if (!supported || isRecOther) {
        recBtn.disabled = true;
        if (!supported) recBtn.title = '当前环境暂不支持麦克风录音';
      }
      recBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startRecordingSlot(slot.id);
      });
      actionsRow.appendChild(recBtn);

      // Preview button
      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'ctrl-btn voice-action-btn voice-play-btn';
      playBtn.dataset.slotId = slot.id;
      playBtn.textContent = '▶️ 试听';
      if (isRecThis || isRecOther) {
        playBtn.disabled = true;
      }
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!HMC.state.soundOn) {
          voiceBannerNotice = {
            type: 'warn',
            text: '🔇 当前处于静音状态，点击右上角喇叭开启声音即可试听哦！'
          };
          renderVoiceBanner();
          return;
        }
        const preview = getSlotPreviewTexts(slot.id);
        HMC.audio.playParentClip(
          slot.id,
          preview.zh,
          preview.en,
          null,
          preview.voiceStyle ? { voiceStyle: preview.voiceStyle } : {}
        );
      });
      actionsRow.appendChild(playBtn);

      // Delete button (only when recorded)
      if (hasClip) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'ctrl-btn voice-action-btn voice-del-btn';
        delBtn.dataset.slotId = slot.id;
        delBtn.textContent = '🗑️ 删除';
        if (isRecThis || isRecOther) {
          delBtn.disabled = true;
        }
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (HMC.audio && typeof HMC.audio.stopParentClip === 'function') {
            HMC.audio.stopParentClip();
          }
          if (HMC.storage && typeof HMC.storage.deleteVoiceClip === 'function') {
            HMC.storage.deleteVoiceClip(slot.id);
          }
          if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
          voiceBannerNotice = {
            type: 'info',
            text: `已删除「${slot.title}」录音，已恢复为默认语音。`
          };
          renderVoicesPanel();
        });
        actionsRow.appendChild(delBtn);
      }

      card.appendChild(topRow);
      card.appendChild(hintEl);
      card.appendChild(actionsRow);
      voiceSlotsList.appendChild(card);
    });
  }

  /* ==========================================================================
     Universal Sleep Greeting Sync
     ========================================================================== */
  function syncSleepGreetingText() {
    const { sleepGreetingText } = getEls();
    if (!sleepGreetingText) return;
    sleepGreetingText.textContent = '今天玩得真棒！我们让眼睛和小鸡一起休息一下吧，晚安哟！';
  }

  /* ==========================================================================
     Local Parent Learning Insights Panel (Tab 3: 📊 成长记录)
     ========================================================================== */
  function clearResetInsightsConfirm() {
    resetInsightsConfirmPending = false;
    if (resetInsightsConfirmTimer) {
      clearTimeout(resetInsightsConfirmTimer);
      resetInsightsConfirmTimer = null;
    }
    const btn = document.getElementById('resetInsightsBtn');
    if (btn) {
      btn.classList.remove('confirming');
      btn.textContent = '🧹 清空学习记录';
    }
  }

  function renderInsightsPanel() {
    const { insightsContent } = getEls();
    clearResetInsightsConfirm();
    if (!insightsContent) return;

    const summary = (HMC.storage && typeof HMC.storage.getInsightsSummary === 'function')
      ? HMC.storage.getInsightsSummary()
      : {
          totalAttempts: 0,
          totalCorrect: 0,
          overallRate: 0,
          playedSkills: [],
          strengths: [],
          focusTopics: [],
          totalStars: 0,
          rareCount: 0,
          totalRare: (HMC.data && Array.isArray(HMC.data.RARE_BUDDIES) && HMC.data.RARE_BUDDIES.length > 0)
            ? HMC.data.RARE_BUDDIES.length
            : 24
        };

    insightsContent.innerHTML = '';

    // 1. Privacy reassurance pill
    const privacyPill = document.createElement('div');
    privacyPill.className = 'insights-privacy-pill';
    privacyPill.textContent = '🔒 纯本地记录，仅保存在本设备，不联网、不上传';
    insightsContent.appendChild(privacyPill);

    // 2. 3 Summary KPI cards
    const kpiRow = document.createElement('div');
    kpiRow.className = 'insights-kpi-row';

    const kpiDefs = [
      {
        cls: 'kpi-stars',
        label: '⭐ 累计星星',
        value: String(summary.totalStars),
        sub: summary.totalStars > 0 ? '闪亮进步中' : '等待收集'
      },
      {
        cls: 'kpi-attempts',
        label: '🎯 闯关互动',
        value: String(summary.totalAttempts),
        sub: summary.totalAttempts > 0 ? `正确率 ${summary.overallRate}%` : '暂未开始'
      },
      {
        cls: 'kpi-rare',
        label: '🥚 稀有彩蛋',
        value: `${summary.rareCount}/${summary.totalRare}`,
        sub: summary.rareCount >= summary.totalRare ? '已全收集！' : '草地彩蛋惊喜'
      }
    ];

    kpiDefs.forEach(item => {
      const card = document.createElement('div');
      card.className = `insights-kpi-card ${item.cls}`;

      const lbl = document.createElement('div');
      lbl.className = 'insights-kpi-label';
      lbl.textContent = item.label;

      const val = document.createElement('div');
      val.className = 'insights-kpi-value';
      val.textContent = item.value;

      const sub = document.createElement('div');
      sub.className = 'insights-kpi-sub';
      sub.textContent = item.sub;

      card.appendChild(lbl);
      card.appendChild(val);
      card.appendChild(sub);
      kpiRow.appendChild(card);
    });
    insightsContent.appendChild(kpiRow);

    // 3. Empty state vs Populated report
    if (summary.totalAttempts === 0) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'insights-empty-card';

      const emoji = document.createElement('div');
      emoji.className = 'insights-empty-emoji';
      emoji.textContent = '🐣🌱';

      const title = document.createElement('div');
      title.className = 'insights-empty-title';
      title.textContent = '成长小档案准备就绪！';

      const desc = document.createElement('p');
      desc.className = 'insights-empty-desc';
      desc.textContent = '去颜色、数学、形状或乐园玩几关，这里就会自动生成专属强项与陪玩小建议哦～';

      emptyCard.appendChild(emoji);
      emptyCard.appendChild(title);
      emptyCard.appendChild(desc);
      insightsContent.appendChild(emptyCard);
      return;
    }

    // 3a. Strengths green pastel card
    const strengthCard = document.createElement('div');
    strengthCard.className = 'insights-card insights-card-strengths';

    const strengthTitle = document.createElement('div');
    strengthTitle.className = 'insights-card-title';
    strengthTitle.textContent = '🌟 最拿手的强项';
    strengthCard.appendChild(strengthTitle);

    if (summary.strengths.length > 0) {
      const chipRow = document.createElement('div');
      chipRow.className = 'insights-chip-row';
      summary.strengths.forEach(s => {
        const chip = document.createElement('span');
        chip.className = 'insights-skill-chip';
        chip.textContent = `${s.icon} ${s.name} · ${s.rate}%`;
        chipRow.appendChild(chip);
      });
      strengthCard.appendChild(chipRow);
    } else {
      const warmNote = document.createElement('p');
      warmNote.className = 'insights-card-note';
      warmNote.textContent = '正在认真探索热身中，多试几次很快就能发现拿手强项啦！';
      strengthCard.appendChild(warmNote);
    }
    insightsContent.appendChild(strengthCard);

    // 3b. Gentle parenting focus topics warm amber card
    const focusCard = document.createElement('div');
    focusCard.className = 'insights-card insights-card-focus';

    const focusTitle = document.createElement('div');
    focusTitle.className = 'insights-card-title';
    focusTitle.textContent = '💬 日常陪玩可以顺便多聊一聊';
    focusCard.appendChild(focusTitle);

    if (summary.focusTopics.length > 0) {
      const focusNote = document.createElement('p');
      focusNote.className = 'insights-card-note';
      focusNote.textContent = '这几个小知识点最近偶尔卡壳，散步或绘本时间可以顺便轻松聊一聊：';
      focusCard.appendChild(focusNote);

      const topicRow = document.createElement('div');
      topicRow.className = 'insights-chip-row';
      summary.focusTopics.forEach(topic => {
        const chip = document.createElement('span');
        chip.className = 'insights-topic-chip';
        chip.textContent = `💡 ${topic}`;
        topicRow.appendChild(chip);
      });
      focusCard.appendChild(topicRow);
    } else {
      const allGoodNote = document.createElement('p');
      allGoodNote.className = 'insights-card-note';
      allGoodNote.textContent = '太棒啦！目前所有玩过的关卡都掌握得非常扎实！';
      focusCard.appendChild(allGoodNote);
    }
    insightsContent.appendChild(focusCard);

    // 3c. Skill mastery progress bars
    const skillsCard = document.createElement('div');
    skillsCard.className = 'insights-card insights-card-skills';

    const skillsTitle = document.createElement('div');
    skillsTitle.className = 'insights-card-title';
    skillsTitle.textContent = '📈 各能力熟练度';
    skillsCard.appendChild(skillsTitle);

    const skillList = document.createElement('div');
    skillList.className = 'insights-skill-list';

    summary.playedSkills.forEach(s => {
      const row = document.createElement('div');
      row.className = 'insights-skill-row';

      const head = document.createElement('div');
      head.className = 'insights-skill-head';

      const nameWrap = document.createElement('div');
      nameWrap.className = 'insights-skill-name-wrap';

      const nameEl = document.createElement('span');
      nameEl.className = 'insights-skill-name';
      nameEl.textContent = `${s.icon} ${s.name}`;

      const groupEl = document.createElement('span');
      groupEl.className = 'insights-skill-group';
      groupEl.textContent = s.group;

      nameWrap.appendChild(nameEl);
      nameWrap.appendChild(groupEl);

      const statEl = document.createElement('span');
      statEl.className = 'insights-skill-stat';
      statEl.textContent = `${s.correct}/${s.attempts} · ${s.rate}%`;

      head.appendChild(nameWrap);
      head.appendChild(statEl);

      const track = document.createElement('div');
      track.className = 'insights-bar-track';

      const fill = document.createElement('div');
      const levelCls = s.rate >= 75 ? 'level-high' : (s.rate >= 50 ? 'level-mid' : 'level-low');
      fill.className = `insights-bar-fill ${levelCls}`;
      fill.style.width = `${Math.max(4, Math.min(100, s.rate))}%`;
      if (s.rate === 0) fill.style.width = '0%';

      track.appendChild(fill);
      row.appendChild(head);
      row.appendChild(track);
      skillList.appendChild(row);
    });

    skillsCard.appendChild(skillList);
    insightsContent.appendChild(skillsCard);

    // 3d. Safe 2-tap reset button
    const resetRow = document.createElement('div');
    resetRow.className = 'insights-reset-row';

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.id = 'resetInsightsBtn';
    resetBtn.className = 'ctrl-btn insights-reset-btn';
    resetBtn.textContent = '🧹 清空学习记录';
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!resetInsightsConfirmPending) {
        resetInsightsConfirmPending = true;
        resetBtn.classList.add('confirming');
        resetBtn.textContent = '⚠️ 确认清空记录？再点一次';
        if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
        if (resetInsightsConfirmTimer) clearTimeout(resetInsightsConfirmTimer);
        resetInsightsConfirmTimer = setTimeout(() => {
          clearResetInsightsConfirm();
        }, 4000);
        return;
      }

      clearResetInsightsConfirm();
      if (HMC.storage && typeof HMC.storage.resetInsights === 'function') {
        HMC.storage.resetInsights();
      }
      if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
      renderInsightsPanel();
    });

    resetRow.appendChild(resetBtn);
    insightsContent.appendChild(resetRow);
  }

  /* ==========================================================================
     Tab Switching, Timer & Sleep Mode
     ========================================================================== */
  function switchParentTab(tabId) {
    const nextTab = (tabId === 'voices' || tabId === 'insights') ? tabId : 'settings';
    if (activeRecSession) {
      stopActiveRecording(true);
    }
    if (nextTab !== 'voices') {
      micRequestToken++;
    }
    if (nextTab !== 'insights') {
      clearResetInsightsConfirm();
    }
    if (HMC.audio && typeof HMC.audio.stopAllSpeech === 'function') {
      HMC.audio.stopAllSpeech();
    } else if (HMC.audio && typeof HMC.audio.stopParentClip === 'function') {
      HMC.audio.stopParentClip();
    }

    activeTab = nextTab;
    const { parentTabs, panelSettings, panelVoices, panelInsights } = getEls();
    if (parentTabs) {
      parentTabs.querySelectorAll('[data-tab]').forEach(btn => {
        const isSelected = btn.dataset.tab === activeTab;
        btn.classList.toggle('active', isSelected);
        btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      });
    }
    if (panelSettings) {
      panelSettings.classList.toggle('hidden', activeTab !== 'settings');
    }
    if (panelVoices) {
      panelVoices.classList.toggle('hidden', activeTab !== 'voices');
    }
    if (panelInsights) {
      panelInsights.classList.toggle('hidden', activeTab !== 'insights');
    }

    if (activeTab === 'voices') {
      renderVoicesPanel();
    } else if (activeTab === 'insights') {
      renderInsightsPanel();
    } else {
      syncSleepGreetingText();
      updateTimerUI();
    }
  }

  function updateTimerUI() {
    const state = HMC.state;
    const { timerStatusLine, timerBadgeBtn } = getEls();
    if (!state.timerEndAt) {
      if (timerBadgeBtn) timerBadgeBtn.classList.add('hidden');
      if (timerStatusLine) timerStatusLine.textContent = '当前状态：未开启定时';
      return;
    }
    const remMs = state.timerEndAt - Date.now();
    if (remMs <= 0) {
      clearInterval(state.timerInterval);
      state.timerEndAt = null;
      activateSleepMode();
      return;
    }
    const mins = Math.floor(remMs / 60000);
    const secs = Math.floor((remMs % 60000) / 1000);
    const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    if (timerBadgeBtn) {
      timerBadgeBtn.textContent = `🌙 ${formatted}`;
      timerBadgeBtn.classList.remove('hidden');
    }
    if (timerStatusLine) {
      timerStatusLine.textContent = `护眼倒计时进行中：还剩 ${formatted}`;
    }
  }

  function setPlayTimer(minutes) {
    const state = HMC.state;
    if (state.timerInterval) clearInterval(state.timerInterval);
    if (minutes <= 0) {
      state.timerEndAt = null;
      updateTimerUI();
    } else {
      state.timerEndAt = Date.now() + minutes * 60 * 1000;
      updateTimerUI();
      state.timerInterval = setInterval(updateTimerUI, 1000);
    }
    closeParentMenu();
  }

  function activateSleepMode() {
    closeParentMenu();
    if (HMC.audio && typeof HMC.audio.cancelPendingTransitions === 'function') {
      HMC.audio.cancelPendingTransitions();
    }
    if (HMC.wardrobe && HMC.wardrobe.closeWardrobe) HMC.wardrobe.closeWardrobe();
    const { sleepOverlay } = getEls();
    syncSleepGreetingText();
    const slot = document.getElementById('sleepingChickenSlot');
    if (slot) slot.innerHTML = HMC.svg.renderChickenSVG(160, true);
    if (sleepOverlay) sleepOverlay.classList.add('open');
    if (HMC.modes.classic && HMC.modes.classic.stopMeadowLife) {
      HMC.modes.classic.stopMeadowLife();
    }
    if (HMC.modes.play && HMC.modes.play.cleanup) {
      HMC.modes.play.cleanup();
    }
    HMC.audio.SFX.lullaby();
    setTimeout(() => {
      HMC.audio.playParentClip(
        'sleep',
        '快乐小鸡困啦，要睡觉咯。今天玩得真棒，让眼睛和小鸡一起休息一下吧，晚安哟！',
        'Happy Mrs. Chicken is sleepy. Good night!',
        null,
        { voiceStyle: 'bedtime' }
      );
    }, 650);
  }

  function openParentMenu(e, initialTab = null) {
    if (e) e.stopPropagation();
    if (HMC.wardrobe && HMC.wardrobe.closeWardrobe) HMC.wardrobe.closeWardrobe();
    const { parentModal } = getEls();
    voiceBannerNotice = null;
    updateTimerUI();
    syncSleepGreetingText();
    updateVoiceCountBadge();
    if (parentModal) {
      parentModal.classList.add('open');
      parentModal.setAttribute('aria-hidden', 'false');
    }
    switchParentTab(initialTab || activeTab || 'settings');
  }

  function closeParentMenu() {
    micRequestToken++;
    clearResetInsightsConfirm();
    stopActiveRecording(true);
    if (HMC.audio && typeof HMC.audio.stopAllSpeech === 'function') {
      HMC.audio.stopAllSpeech();
    } else if (HMC.audio && typeof HMC.audio.stopParentClip === 'function') {
      HMC.audio.stopParentClip();
    }
    const { parentModal } = getEls();
    if (parentModal) {
      parentModal.classList.remove('open');
      parentModal.setAttribute('aria-hidden', 'true');
    }
  }

  function syncLangButtons() {
    document.querySelectorAll('#langChoices [data-lang]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === HMC.state.lang);
    });
  }

  function init() {
    const state = HMC.state;
    const {
      parentModal,
      parentTabs,
      timerBadgeBtn,
      sleepOverlay
    } = getEls();

    syncLangButtons();
    syncSleepGreetingText();
    updateVoiceCountBadge();

    const parentMenuBtn = document.getElementById('parentMenuBtn');
    if (parentMenuBtn) parentMenuBtn.addEventListener('click', (e) => openParentMenu(e, 'settings'));
    if (timerBadgeBtn) timerBadgeBtn.addEventListener('click', (e) => openParentMenu(e, 'settings'));

    const parentCloseBtn = document.getElementById('parentCloseBtn');
    if (parentCloseBtn) {
      parentCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeParentMenu();
      });
    }
    if (parentModal) {
      parentModal.addEventListener('click', (e) => {
        if (e.target === parentModal) closeParentMenu();
      });
    }

    if (parentTabs) {
      parentTabs.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetTab = btn.dataset.tab;
          if (targetTab === activeTab) return;
          if (HMC.audio && HMC.audio.SFX) HMC.audio.SFX.pop();
          switchParentTab(targetTab);
        });
      });
    }

    // Language switcher (preserved 100%)
    document.querySelectorAll('#langChoices [data-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.lang = btn.dataset.lang;
        syncLangButtons();
        if (HMC.storage) HMC.storage.savePrefs({ lang: state.lang });
        HMC.audio.SFX.pop();
        if (state.mode === 'colors') HMC.modes.colors.renderColorMode(false);
        else if (state.mode === 'shapes') HMC.modes.shapes.renderShapeMode(false);
        else if (state.mode === 'counting') HMC.modes.math.renderCountingMode(false);
        else if (state.mode === 'play' && HMC.modes.play) HMC.modes.play.renderPlayMode(false);
        HMC.audio.setPrompt(state.lastPromptZh, state.lastPromptEn, true, {
          voiceStyle: state.lastPromptVoiceStyle || 'daily'
        });
      });
    });

    // Eye-Care Timer controls (preserved 100%)
    if (parentModal) {
      parentModal.querySelectorAll('[data-mins]').forEach(btn => {
        btn.addEventListener('click', () => {
          HMC.audio.SFX.pop();
          setPlayTimer(parseInt(btn.dataset.mins, 10));
        });
      });
    }

    const previewSleepBtn = document.getElementById('previewSleepBtn');
    if (previewSleepBtn) {
      previewSleepBtn.addEventListener('click', () => activateSleepMode());
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isParentModalOpen()) {
        e.preventDefault();
        closeParentMenu();
      }
    });

    // Long-press 2 seconds to unlock Sleep Mode
    const unlockBtn = document.getElementById('unlockSleepBtn');
    if (unlockBtn) {
      let holdTimer = null;
      const startHold = () => {
        unlockBtn.textContent = '正在唤醒小鸡… 请按住 2 秒';
        holdTimer = setTimeout(() => {
          if (sleepOverlay) sleepOverlay.classList.remove('open');
          unlockBtn.textContent = '家长长按 2 秒可唤醒小鸡';
          state.timerEndAt = null;
          updateTimerUI();
          if (state.mode === 'classic' && HMC.modes.classic && HMC.modes.classic.startMeadowLife) {
            HMC.modes.classic.startMeadowLife();
          }
          HMC.audio.SFX.cluck();
          HMC.audio.speak('早上好！快乐小鸡睡醒啦！', 'Good morning! Happy Chicken is awake!');
        }, 1800);
      };
      const cancelHold = () => {
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
          unlockBtn.textContent = '家长长按 2 秒可唤醒小鸡';
        }
      };
      unlockBtn.addEventListener('pointerdown', startHold);
      unlockBtn.addEventListener('pointerup', cancelHold);
      unlockBtn.addEventListener('pointerleave', cancelHold);
      unlockBtn.addEventListener('pointercancel', cancelHold);
    }
  }

  HMC.parent = {
    updateTimerUI,
    setPlayTimer,
    activateSleepMode,
    openParentMenu,
    closeParentMenu,
    switchParentTab,
    syncLangButtons,
    syncSleepGreetingText,
    renderVoicesPanel,
    renderInsightsPanel,
    updateVoiceCountBadge,
    isRecordingSupported,
    startRecordingSlot,
    stopActiveRecording,
    init
  };
})(window.HMC = window.HMC || {});
