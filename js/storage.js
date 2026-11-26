(function (HMC) {
  'use strict';

  const PREFIX = 'hmc_v1_';
  const VOICE_KEY = 'hmc_v2_voices';
  const DEFAULT_NICKNAME = '宝贝';
  const VALID_LANGS = ['zh', 'bi', 'en'];
  const DEFAULT_VOICE_SLOTS = ['praise', 'lay', 'party', 'sleep'];
  const FALLBACK_INSIGHT_SKILLS = [
    { id: 'color_basic',   icon: '🥚', name: '颜色基础配对', group: '颜色启蒙' },
    { id: 'color_mix',     icon: '🎨', name: '调色魔法',     group: '颜色启蒙' },
    { id: 'color_pattern', icon: '🚂', name: '规律小火车',   group: '逻辑推理' },
    { id: 'math_feed',     icon: '🌽', name: '数玉米计数',   group: '数学启蒙' },
    { id: 'math_size',     icon: '📏', name: '大小排排队',   group: '比较与序数' },
    { id: 'math_addsub',   icon: '➕', name: '具象小加减',   group: '数学启蒙' },
    { id: 'shape_basic',   icon: '🥚', name: '形状基础配对', group: '几何认知' },
    { id: 'shape_clue',    icon: '🕵️', name: '多维线索寻蛋', group: '观察与逻辑' },
    { id: 'shape_build',   icon: '🧩', name: '图形拼图',     group: '空间几何' },
    { id: 'shape_odd',     icon: '🔎', name: '形状找不同',   group: '分类辨别' },
    { id: 'play_music',    icon: '🎹', name: '音乐小鸡琴',   group: '听觉节奏' },
    { id: 'play_habits',   icon: '🛁', name: '生活好习惯',   group: '自理习惯' }
  ];
  const FALLBACK_INSIGHT_MAP = Object.fromEntries(FALLBACK_INSIGHT_SKILLS.map(s => [s.id, s]));
  const FALLBACK_RARE_IDS = [
    'dino', 'duck', 'bunny', 'bear', 'cat', 'panda',
    'wizard', 'rainbow', 'unicorn', 'fairy', 'princess', 'mermaid',
    'strawberry', 'cupcake', 'donut', 'icecream', 'peach', 'pudding',
    'astronaut', 'doctor', 'chef', 'firefighter', 'pirate', 'painter'
  ];
  const FALLBACK_LEGACY_SLOTS = {
    bow: 'neck',
    crown: 'head',
    boots: 'feet',
    sunglasses: 'eyes',
    tutu: 'body',
    wings: 'back',
    wand: 'hand'
  };

  function getWardrobeItemSlot(id) {
    if (typeof id !== 'string' || !id) return null;
    const catalog = HMC.data && HMC.data.WARDROBE_BY_ID;
    if (catalog && catalog[id] && catalog[id].slot) {
      return catalog[id].slot;
    }
    if (FALLBACK_LEGACY_SLOTS[id]) {
      return FALLBACK_LEGACY_SLOTS[id];
    }
    const match = id.match(/^(head|body|neck|eyes|feet|back|hand)_/);
    return match ? match[1] : null;
  }

  function enforceSinglePerSlot(ids) {
    const list = Array.isArray(ids) ? ids : [];
    const seen = new Set();
    const slotToId = new Map();
    const ordered = [];
    list.forEach(id => {
      if (typeof id !== 'string' || !id || id === 'none' || seen.has(id)) return;
      seen.add(id);
      const slot = getWardrobeItemSlot(id);
      if (slot) {
        if (slotToId.has(slot)) {
          const prevId = slotToId.get(slot);
          const prevIdx = ordered.indexOf(prevId);
          if (prevIdx >= 0) ordered.splice(prevIdx, 1);
        }
        slotToId.set(slot, id);
      }
      ordered.push(id);
    });
    return ordered;
  }

  function getInsightSkills() {
    if (HMC.data && Array.isArray(HMC.data.INSIGHT_SKILLS) && HMC.data.INSIGHT_SKILLS.length > 0) {
      return HMC.data.INSIGHT_SKILLS;
    }
    return FALLBACK_INSIGHT_SKILLS;
  }

  function getInsightSkillMap() {
    if (HMC.data && HMC.data.INSIGHT_SKILL_BY_ID && typeof HMC.data.INSIGHT_SKILL_BY_ID === 'object') {
      return HMC.data.INSIGHT_SKILL_BY_ID;
    }
    return FALLBACK_INSIGHT_MAP;
  }

  function createDefaultInsights() {
    return {
      skills: {},
      misses: {},
      totalAttempts: 0,
      totalCorrect: 0,
      updatedAt: 0
    };
  }

  function normalizeInsights(rawInsights) {
    const base = createDefaultInsights();
    if (!rawInsights || typeof rawInsights !== 'object') return base;

    const skillMap = getInsightSkillMap();
    const skills = {};
    let sumAttempts = 0;
    let sumCorrect = 0;

    if (rawInsights.skills && typeof rawInsights.skills === 'object') {
      Object.keys(rawInsights.skills).forEach(skillId => {
        if (!skillMap[skillId]) return;
        const rawEntry = rawInsights.skills[skillId];
        if (!rawEntry || typeof rawEntry !== 'object') return;
        const attempts = Math.max(0, Math.floor(Number(rawEntry.attempts) || 0));
        const correct = Math.min(attempts, Math.max(0, Math.floor(Number(rawEntry.correct) || 0)));
        if (attempts > 0 || correct > 0) {
          skills[skillId] = { attempts, correct };
          sumAttempts += attempts;
          sumCorrect += correct;
        }
      });
    }

    const misses = {};
    if (rawInsights.misses && typeof rawInsights.misses === 'object') {
      Object.keys(rawInsights.misses).forEach(label => {
        const cleanLabel = typeof label === 'string' ? label.replace(/[<>]/g, '').trim() : '';
        if (!cleanLabel) return;
        const count = Math.max(0, Math.floor(Number(rawInsights.misses[label]) || 0));
        if (count > 0) {
          misses[cleanLabel] = count;
        }
      });
    }

    const rawTotalAttempts = Math.max(0, Math.floor(Number(rawInsights.totalAttempts) || 0));
    const totalAttempts = Math.max(sumAttempts, rawTotalAttempts);
    const rawTotalCorrect = Math.max(0, Math.floor(Number(rawInsights.totalCorrect) || 0));
    const totalCorrect = Math.min(totalAttempts, Math.max(sumCorrect, rawTotalCorrect));
    const updatedAt = Math.max(0, Math.floor(Number(rawInsights.updatedAt) || 0));

    return {
      skills,
      misses,
      totalAttempts,
      totalCorrect,
      updatedAt
    };
  }

  function get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function set(key, value) {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function remove(key) {
    try {
      window.localStorage.removeItem(PREFIX + key);
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadPrefs() {
    const saved = get('prefs', null);
    const lang = saved && VALID_LANGS.includes(saved.lang) ? saved.lang : 'zh';
    const soundOn = saved && typeof saved.soundOn === 'boolean' ? saved.soundOn : true;
    return { lang, soundOn };
  }

  function savePrefs(partial) {
    const next = Object.assign(loadPrefs(), partial || {});
    return set('prefs', next);
  }

  let memoryProfile = null;

  function createDefaultProfile() {
    return {
      nickname: '',
      totalStars: 0,
      album: {},
      wardrobe: {
        unlocked: ['bow'],
        equipped: ['bow']
      },
      insights: createDefaultInsights()
    };
  }

  function normalizeWardrobe(rawWardrobe) {
    const rawW = (rawWardrobe && typeof rawWardrobe === 'object') ? rawWardrobe : null;
    let unlocked = rawW && Array.isArray(rawW.unlocked)
      ? rawW.unlocked.slice().filter(id => typeof id === 'string' && id && id !== 'none')
      : ['bow'];

    // Deduplicate and guarantee default starter 'bow' (cost 0) is always unlocked
    unlocked = Array.from(new Set(unlocked));
    if (!unlocked.includes('bow')) {
      unlocked.unshift('bow');
    }

    let equipped;
    if (rawW && Array.isArray(rawW.equipped)) {
      equipped = enforceSinglePerSlot(
        rawW.equipped.slice().filter(id => typeof id === 'string' && id && id !== 'none' && unlocked.includes(id))
      );
    } else if (rawW && rawW.equipped && typeof rawW.equipped === 'object') {
      // Support map-shaped equipped objects gracefully if ever encountered
      const clonedMap = Object.assign({}, rawW.equipped);
      equipped = enforceSinglePerSlot(
        Object.keys(clonedMap).filter(id => clonedMap[id] && unlocked.includes(id))
      );
    } else {
      equipped = ['bow'];
    }

    return { unlocked: unlocked.slice(), equipped: equipped.slice() };
  }

  function sanitizeNickname(name) {
    if (typeof name !== 'string') return DEFAULT_NICKNAME;
    const stripped = name.replace(/[<>]/g, '').trim();
    const capped = Array.from(stripped).slice(0, 12).join('').trim();
    return capped || DEFAULT_NICKNAME;
  }

  function normalizeProfile(raw) {
    const base = createDefaultProfile();
    if (!raw || typeof raw !== 'object') return base;
    const totalStars = Math.max(0, Math.floor(Number(raw.totalStars) || 0));
    const nickname = typeof raw.nickname === 'string'
      ? Array.from(raw.nickname.replace(/[<>]/g, '').trim()).slice(0, 12).join('').trim()
      : '';
    return Object.assign({}, base, raw, {
      nickname,
      totalStars,
      album: (raw.album && typeof raw.album === 'object') ? Object.assign({}, raw.album) : {},
      wardrobe: normalizeWardrobe(raw.wardrobe),
      insights: normalizeInsights(raw.insights)
    });
  }

  function getProfile() {
    try {
      const saved = get('profile', null);
      if (saved && typeof saved === 'object') {
        memoryProfile = normalizeProfile(saved);
        return normalizeProfile(memoryProfile);
      }
    } catch (e) {}
    if (!memoryProfile) memoryProfile = createDefaultProfile();
    return normalizeProfile(memoryProfile);
  }

  function saveProfile(p) {
    try {
      const current = getProfile();
      const merged = normalizeProfile(Object.assign({}, current, p || {}));
      memoryProfile = merged;
      return set('profile', merged);
    } catch (e) {
      return false;
    }
  }

  function getTotalStars() {
    try {
      const profile = getProfile();
      return Math.max(0, Math.floor(Number(profile.totalStars) || 0));
    } catch (e) {
      return 0;
    }
  }

  function addStar() {
    try {
      const profile = getProfile();
      const nextTotal = Math.max(0, Math.floor(Number(profile.totalStars) || 0)) + 1;
      profile.totalStars = nextTotal;
      saveProfile(profile);
      return nextTotal;
    } catch (e) {
      return 0;
    }
  }

  function getWardrobe() {
    try {
      const profile = getProfile();
      return {
        unlocked: profile.wardrobe.unlocked.slice(),
        equipped: profile.wardrobe.equipped.slice()
      };
    } catch (e) {
      return { unlocked: ['bow'], equipped: ['bow'] };
    }
  }

  function unlockWardrobeItem(id) {
    try {
      const profile = getProfile();
      const catalog = HMC.data && HMC.data.WARDROBE_BY_ID;
      const item = catalog && id ? catalog[id] : null;
      const totalStars = Math.max(0, Math.floor(Number(profile.totalStars) || 0));
      if (!item || totalStars < item.cost) {
        return {
          unlocked: profile.wardrobe.unlocked.slice(),
          equipped: profile.wardrobe.equipped.slice()
        };
      }
      if (!profile.wardrobe.unlocked.includes(id)) {
        profile.wardrobe.unlocked.push(id);
      }
      const slot = item.slot || getWardrobeItemSlot(id);
      if (slot) {
        profile.wardrobe.equipped = profile.wardrobe.equipped.filter(
          otherId => otherId !== id && getWardrobeItemSlot(otherId) !== slot
        );
      }
      if (!profile.wardrobe.equipped.includes(id)) {
        profile.wardrobe.equipped.push(id);
      }
      saveProfile(profile);
      return {
        unlocked: profile.wardrobe.unlocked.slice(),
        equipped: profile.wardrobe.equipped.slice()
      };
    } catch (e) {
      return getWardrobe();
    }
  }

  function toggleEquipWardrobeItem(id) {
    try {
      const profile = getProfile();
      if (!id || !profile.wardrobe.unlocked.includes(id)) {
        return {
          equipped: false,
          wardrobe: {
            unlocked: profile.wardrobe.unlocked.slice(),
            equipped: profile.wardrobe.equipped.slice()
          }
        };
      }
      const idx = profile.wardrobe.equipped.indexOf(id);
      let isEquipped;
      if (idx >= 0) {
        profile.wardrobe.equipped.splice(idx, 1);
        isEquipped = false;
      } else {
        const slot = getWardrobeItemSlot(id);
        if (slot) {
          profile.wardrobe.equipped = profile.wardrobe.equipped.filter(
            otherId => getWardrobeItemSlot(otherId) !== slot
          );
        }
        profile.wardrobe.equipped.push(id);
        isEquipped = true;
      }
      saveProfile(profile);
      return {
        equipped: isEquipped,
        wardrobe: {
          unlocked: profile.wardrobe.unlocked.slice(),
          equipped: profile.wardrobe.equipped.slice()
        }
      };
    } catch (e) {
      return { equipped: false, wardrobe: getWardrobe() };
    }
  }

  function setEquippedWardrobe(idsArray) {
    try {
      const profile = getProfile();
      const unlockedSet = new Set(profile.wardrobe.unlocked);
      const list = Array.isArray(idsArray) ? idsArray : [];
      const validIds = list.filter(id => typeof id === 'string' && id && unlockedSet.has(id));
      profile.wardrobe.equipped = enforceSinglePerSlot(validIds);
      saveProfile(profile);
      return {
        unlocked: profile.wardrobe.unlocked.slice(),
        equipped: profile.wardrobe.equipped.slice()
      };
    } catch (e) {
      return getWardrobe();
    }
  }

  function clearEquippedWardrobe() {
    try {
      const profile = getProfile();
      profile.wardrobe.equipped = [];
      saveProfile(profile);
      return {
        unlocked: profile.wardrobe.unlocked.slice(),
        equipped: []
      };
    } catch (e) {
      return getWardrobe();
    }
  }

  function hasClaimableWardrobeItem() {
    try {
      const items = (HMC.data && HMC.data.WARDROBE_ITEMS) || [];
      const profile = getProfile();
      const totalStars = Math.max(0, Math.floor(Number(profile.totalStars) || 0));
      return items.some(item => item.cost <= totalStars && !profile.wardrobe.unlocked.includes(item.id));
    } catch (e) {
      return false;
    }
  }

  function unlockRareBuddy(id) {
    if (!id) return 0;
    try {
      const profile = getProfile();
      const prev = Number(profile.album[id]) || 0;
      const nextCount = prev + 1;
      profile.album[id] = nextCount;
      saveProfile(profile);
      return nextCount;
    } catch (e) {
      return 0;
    }
  }

  function getAlbum() {
    try {
      const profile = getProfile();
      return Object.assign({}, profile.album);
    } catch (e) {
      return {};
    }
  }

  function getNickname() {
    try {
      const profile = getProfile();
      return sanitizeNickname(profile.nickname);
    } catch (e) {
      return DEFAULT_NICKNAME;
    }
  }

  function setNickname(name) {
    const clean = sanitizeNickname(name);
    try {
      const profile = getProfile();
      profile.nickname = clean;
      saveProfile(profile);
    } catch (e) {
      if (!memoryProfile) memoryProfile = createDefaultProfile();
      memoryProfile.nickname = clean;
    }
    return clean;
  }

  let memoryVoices = {};
  let voiceStorageFallback = false;

  function getValidVoiceSlots() {
    if (HMC.data && Array.isArray(HMC.data.VOICE_SLOTS) && HMC.data.VOICE_SLOTS.length > 0) {
      return HMC.data.VOICE_SLOTS.map(s => s.id);
    }
    return DEFAULT_VOICE_SLOTS;
  }

  function isValidVoiceSlot(slotId) {
    return typeof slotId === 'string' && getValidVoiceSlots().includes(slotId);
  }

  function isQuotaError(err) {
    if (!err) return false;
    return !!(
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 ||
      err.code === 1014 ||
      /quota/i.test(String(err.message || ''))
    );
  }

  function readVoiceStore() {
    const validSlots = getValidVoiceSlots();
    try {
      const raw = window.localStorage.getItem(VOICE_KEY);
      if (raw !== null && raw !== undefined) {
        const parsed = JSON.parse(raw);
        const cleaned = {};
        if (parsed && typeof parsed === 'object') {
          validSlots.forEach(id => {
            if (typeof parsed[id] === 'string' && parsed[id].startsWith('data:audio')) {
              cleaned[id] = parsed[id];
            }
          });
        }
        memoryVoices = cleaned;
        voiceStorageFallback = false;
        return Object.assign({}, cleaned);
      }
      if (!voiceStorageFallback) {
        memoryVoices = {};
      }
      return Object.assign({}, memoryVoices);
    } catch (e) {
      voiceStorageFallback = true;
      return Object.assign({}, memoryVoices || {});
    }
  }

  function getVoiceClips() {
    return readVoiceStore();
  }

  function getVoiceClip(slotId) {
    if (!isValidVoiceSlot(slotId)) return null;
    const clips = readVoiceStore();
    return clips[slotId] || null;
  }

  function hasVoiceClip(slotId) {
    return Boolean(getVoiceClip(slotId));
  }

  function saveVoiceClip(slotId, dataUrl) {
    if (!isValidVoiceSlot(slotId)) {
      return { ok: false, reason: 'invalid_slot' };
    }
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:audio')) {
      return { ok: false, reason: 'invalid_data' };
    }
    const next = readVoiceStore();
    next[slotId] = dataUrl;
    try {
      window.localStorage.setItem(VOICE_KEY, JSON.stringify(next));
      memoryVoices = next;
      voiceStorageFallback = false;
      return { ok: true };
    } catch (err) {
      if (isQuotaError(err)) {
        return { ok: false, reason: 'quota' };
      }
      // Sandboxed iframe / localStorage unavailable -> graceful in-memory fallback
      memoryVoices = next;
      voiceStorageFallback = true;
      return { ok: true, memoryOnly: true };
    }
  }

  function deleteVoiceClip(slotId) {
    if (!isValidVoiceSlot(slotId)) return false;
    const next = readVoiceStore();
    delete next[slotId];
    memoryVoices = next;
    try {
      if (Object.keys(next).length === 0) {
        window.localStorage.removeItem(VOICE_KEY);
      } else {
        window.localStorage.setItem(VOICE_KEY, JSON.stringify(next));
      }
      voiceStorageFallback = false;
      return true;
    } catch (e) {
      voiceStorageFallback = true;
      return true;
    }
  }

  function recordAttempt(skillId, isCorrect, topicLabel = '') {
    try {
      const skillMap = getInsightSkillMap();
      if (typeof skillId !== 'string' || !skillMap[skillId]) {
        return false;
      }
      const profile = getProfile();
      const insights = normalizeInsights(profile.insights);
      const entry = insights.skills[skillId] || { attempts: 0, correct: 0 };

      entry.attempts += 1;
      insights.totalAttempts += 1;

      if (isCorrect) {
        entry.correct += 1;
        insights.totalCorrect += 1;
      } else if (topicLabel) {
        const cleanLabel = String(topicLabel).replace(/[<>]/g, '').trim();
        if (cleanLabel) {
          insights.misses[cleanLabel] = (Number(insights.misses[cleanLabel]) || 0) + 1;
        }
      }

      insights.skills[skillId] = entry;
      insights.updatedAt = Date.now();
      profile.insights = insights;
      saveProfile(profile);
      return true;
    } catch (e) {
      return false;
    }
  }

  function getInsightsSummary() {
    try {
      const profile = getProfile();
      const insights = normalizeInsights(profile.insights);
      const catalog = getInsightSkills();
      const totalAttempts = insights.totalAttempts;
      const totalCorrect = insights.totalCorrect;
      const overallRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

      const playedSkills = [];
      catalog.forEach((skill, orderIdx) => {
        const stat = insights.skills[skill.id];
        if (!stat || stat.attempts <= 0) return;
        const rate = Math.round((stat.correct / stat.attempts) * 100);
        playedSkills.push({
          id: skill.id,
          icon: skill.icon,
          name: skill.name,
          group: skill.group,
          attempts: stat.attempts,
          correct: stat.correct,
          rate,
          _order: orderIdx
        });
      });

      playedSkills.sort((a, b) => {
        if (b.attempts !== a.attempts) return b.attempts - a.attempts;
        if (b.rate !== a.rate) return b.rate - a.rate;
        return a._order - b._order;
      });

      const cleanPlayed = playedSkills.map(({ _order, ...rest }) => rest);

      const strengths = cleanPlayed
        .filter(s => s.attempts >= 1 && s.rate >= 75)
        .sort((a, b) => {
          if (b.rate !== a.rate) return b.rate - a.rate;
          return b.attempts - a.attempts;
        })
        .slice(0, 3);

      let focusTopics = Object.entries(insights.misses)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([label]) => label);

      if (focusTopics.length === 0) {
        focusTopics = cleanPlayed
          .filter(s => s.attempts >= 2 && s.rate < 75)
          .sort((a, b) => {
            if (a.rate !== b.rate) return a.rate - b.rate;
            return b.attempts - a.attempts;
          })
          .slice(0, 4)
          .map(s => s.name);
      }

      const rareList = (HMC.data && Array.isArray(HMC.data.RARE_BUDDIES) && HMC.data.RARE_BUDDIES.length > 0)
        ? HMC.data.RARE_BUDDIES.map(b => b.id)
        : FALLBACK_RARE_IDS;
      const totalRare = rareList.length;
      const album = profile.album && typeof profile.album === 'object' ? profile.album : {};
      const rareCount = rareList.filter(id => (Number(album[id]) || 0) > 0).length;

      return {
        totalAttempts,
        totalCorrect,
        overallRate,
        playedSkills: cleanPlayed,
        strengths,
        focusTopics,
        totalStars: Math.max(0, Math.floor(Number(profile.totalStars) || 0)),
        rareCount,
        totalRare
      };
    } catch (e) {
      return {
        totalAttempts: 0,
        totalCorrect: 0,
        overallRate: 0,
        playedSkills: [],
        strengths: [],
        focusTopics: [],
        totalStars: 0,
        rareCount: 0,
        totalRare: FALLBACK_RARE_IDS.length
      };
    }
  }

  function resetInsights() {
    try {
      const profile = getProfile();
      profile.insights = createDefaultInsights();
      saveProfile(profile);
      return true;
    } catch (e) {
      if (!memoryProfile) memoryProfile = createDefaultProfile();
      memoryProfile.insights = createDefaultInsights();
      return false;
    }
  }

  HMC.storage = {
    PREFIX,
    VOICE_KEY,
    DEFAULT_NICKNAME,
    get,
    set,
    remove,
    loadPrefs,
    savePrefs,
    getProfile,
    saveProfile,
    getTotalStars,
    addStar,
    getWardrobe,
    unlockWardrobeItem,
    toggleEquipWardrobeItem,
    setEquippedWardrobe,
    clearEquippedWardrobe,
    hasClaimableWardrobeItem,
    unlockRareBuddy,
    getAlbum,
    getNickname,
    setNickname,
    getVoiceClips,
    getVoiceClip,
    hasVoiceClip,
    saveVoiceClip,
    deleteVoiceClip,
    recordAttempt,
    getInsightsSummary,
    resetInsights
  };
})(window.HMC = window.HMC || {});
