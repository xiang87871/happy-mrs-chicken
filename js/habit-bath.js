(function (HMC) {
  'use strict';

  const SVG_W = 420;
  const SVG_H = 260;

  const STEPS = [
    { id: 'flavor', num: 1, zh: '选泡泡', en: 'Bubbles', icon: '🧴' },
    { id: 'scrub',  num: 2, zh: '搓泥巴', en: 'Scrub',   icon: '🧽' },
    { id: 'rinse',  num: 3, zh: '冲冲水', en: 'Rinse',   icon: '🚿' },
    { id: 'dry',    num: 4, zh: '吹蓬松', en: 'Dry',     icon: '💨' }
  ];

  const FLAVORS = [
    {
      id: 'strawberry',
      icon: '🍓',
      zh: '草莓粉泡泡',
      shortZh: '草莓粉',
      en: 'Strawberry',
      water: '#FFD6E8',
      waterDeep: '#FFB5D6',
      foam: '#FFF0F7',
      stroke: '#FF85B8',
      sparkle: '#FF5C9D',
      bottleBody: '#FF9EC7',
      bottleCap: '#FF5C9D',
      pourZh: '哇！香甜的草莓粉泡泡来啦！抓住海绵搓掉小泥点吧！',
      pourEn: 'Yum! Strawberry pink bubbles! Grab the sponge and scrub the mud!'
    },
    {
      id: 'lemon',
      icon: '🍋',
      zh: '柠檬黄泡泡',
      shortZh: '柠檬黄',
      en: 'Lemon',
      water: '#FFF2B2',
      waterDeep: '#FFE066',
      foam: '#FFFBE0',
      stroke: '#F5B700',
      sparkle: '#FF9F1C',
      bottleBody: '#FFE066',
      bottleCap: '#F59F00',
      pourZh: '哇！清爽的柠檬黄泡泡来啦！抓住海绵搓掉小泥点吧！',
      pourEn: 'Yay! Lemon yellow bubbles! Grab the sponge and scrub the mud!'
    },
    {
      id: 'blueberry',
      icon: '🫐',
      zh: '蓝莓蓝泡泡',
      shortZh: '蓝莓蓝',
      en: 'Blueberry',
      water: '#CBEBFF',
      waterDeep: '#94D4FF',
      foam: '#EEF9FF',
      stroke: '#4DABF7',
      sparkle: '#339AF0',
      bottleBody: '#74C0FC',
      bottleCap: '#339AF0',
      pourZh: '哇！梦幻的蓝莓蓝泡泡来啦！抓住海绵搓掉小泥点吧！',
      pourEn: 'Ooh! Blueberry blue bubbles! Grab the sponge and scrub the mud!'
    }
  ];
  const FLAVOR_BY_ID = Object.fromEntries(FLAVORS.map(f => [f.id, f]));

  // 5 distinct individual spots mapped directly on the baby chick in 420x260 SVG space
  const MUD_SPOTS = [
    { id: 'forehead',  zh: '额头',   x: 214, y: 74,  r: 15, rot: -8,  isTickle: false },
    { id: 'leftCheek', zh: '小脸蛋', x: 181, y: 112, r: 14, rot: 14,  isTickle: false },
    { id: 'tummy',     zh: '小肚皮', x: 214, y: 146, r: 19, rot: 0,   isTickle: true  },
    { id: 'leftWing',  zh: '左翅膀', x: 148, y: 136, r: 14, rot: 20,  isTickle: false },
    { id: 'rightWing', zh: '右翅膀', x: 280, y: 136, r: 14, rot: -20, isTickle: false }
  ];

  // Runtime instance state
  let mountContainer = null;
  let mountOpts = {};
  let mountToken = 0;
  let timers = new Set();
  let rafId = null;
  let lastRafTs = 0;

  let bathState = null;

  // Drag runtime state
  let dragActive = false;
  let dragPointerId = null;
  let dragPointerType = 'mouse';
  let dragTool = null; // 'sponge' | 'shower' | 'dryer'
  let dragLastX = 0;
  let dragLastY = 0;
  let dragCurX = 0;
  let dragCurY = 0;
  let dragFromStageSpot = null;
  let dragMoved = false;
  let dragStartX = 0;
  let dragStartY = 0;

  // Throttling timestamps
  let lastBubbleSfxTs = 0;
  let lastBubbleSpawnTs = 0;
  let lastTickleToastTs = 0;
  let lastRainSfxTs = 0;
  let lastBlowSfxTs = 0;
  let lastSparkleTs = 0;
  let bubbleUid = 0;
  let activeBubbleCount = 0;
  let tickleResetTimer = null;
  let activeToolEffectTimer = null;

  function createFreshState() {
    return {
      phase: 'flavor', // 'flavor' | 'pouring' | 'scrub' | 'rinse' | 'shake' | 'dry' | 'done'
      flavor: null,
      expression: 'muddy', // 'muddy' | 'tickle' | 'rinse' | 'fluff' | 'done'
      completed: false,
      duckyQuacks: 0,
      bubblesPopped: 0,
      tickleCount: 0,
      spots: MUD_SPOTS.map(s => ({
        id: s.id,
        zh: s.zh,
        x: s.x,
        y: s.y,
        r: s.r,
        rot: s.rot,
        isTickle: s.isTickle,
        scrubProgress: 0, // 0 -> 100 during scrub
        foamLevel: 0,     // 100 -> 0 during rinse
        wetLevel: 0       // 100 -> 0 during dry
      }))
    };
  }

  function schedule(fn, ms) {
    const token = mountToken;
    const id = setTimeout(() => {
      timers.delete(id);
      if (token !== mountToken) return;
      fn();
    }, ms);
    timers.add(id);
    return id;
  }

  function clearAllTimers() {
    timers.forEach(id => clearTimeout(id));
    timers.clear();
    if (tickleResetTimer) {
      clearTimeout(tickleResetTimer);
      tickleResetTimer = null;
    }
    if (activeToolEffectTimer) {
      clearTimeout(activeToolEffectTimer);
      activeToolEffectTimer = null;
    }
    if (rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function getFlavorPalette() {
    if (bathState && bathState.flavor) return bathState.flavor;
    return {
      water: '#B4E9FF',
      waterDeep: '#84D6FF',
      foam: '#FFFFFF',
      stroke: '#74C0FC',
      sparkle: '#38B6FF',
      bottleBody: '#74C0FC',
      bottleCap: '#339AF0'
    };
  }

  function syncHabitStepIndex() {
    if (!HMC.state || !bathState) return;
    const map = { flavor: 0, pouring: 0, scrub: 1, rinse: 2, shake: 2, dry: 3, done: 4 };
    HMC.state.habitStep = map[bathState.phase] != null ? map[bathState.phase] : 0;
  }

  /* ========================================================================
     Storybook Tool & Bottle SVG Renderers
     ======================================================================== */

  function renderBottleSVG(flavor, size = 46) {
    return `
      <svg width="${size}" height="${Math.round(size * 1.18)}" viewBox="0 0 56 66" fill="none" aria-hidden="true">
        <path d="M23 11H33V16H23Z" fill="#FFFDF8" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M20 7C20 4.5 23 3 28 3C33 3 36 4.5 36 7V11H20V7Z" fill="${flavor.bottleCap}" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M28 5H39C41 5 42 7 41 9" stroke="${flavor.bottleCap}" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M16 21C16 17 20 15 28 15C36 15 40 17 40 21L44 31C46 38 45 55 41 60C38 63 18 63 15 60C11 55 10 38 12 31L16 21Z" fill="${flavor.bottleBody}" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
        <ellipse cx="28" cy="40" rx="11" ry="12" fill="#FFFFFF" opacity="0.88" stroke="${flavor.stroke}" stroke-width="1.8"/>
        <text x="28" y="46" text-anchor="middle" font-size="16">${flavor.icon}</text>
        <path d="M16 29C15 36 15 45 17 52" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" opacity="0.65"/>
        <circle cx="43" cy="17" r="4" fill="${flavor.foam}" stroke="${flavor.stroke}" stroke-width="1.6"/>
        <circle cx="48" cy="11" r="2.6" fill="${flavor.foam}" stroke="${flavor.stroke}" stroke-width="1.4"/>
      </svg>
    `;
  }

  function renderSpongeSVG(size = 58) {
    const pal = getFlavorPalette();
    return `
      <svg width="${size}" height="${Math.round(size * 0.82)}" viewBox="0 0 80 66" fill="none" aria-hidden="true">
        <path d="M15 20C15 12 24 10 31 12C37 8 47 8 53 12C61 10 69 14 68 23C73 29 72 41 66 47C66 55 57 59 49 56C43 60 33 60 27 56C18 59 10 53 12 44C7 37 8 26 15 20Z" fill="#FFE066" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M16 42C24 49 55 50 66 42C66 51 58 56 49 54C43 58 33 58 27 54C19 56 13 51 16 42Z" fill="#FFD43B" opacity="0.85"/>
        <ellipse cx="28" cy="27" rx="4.5" ry="3.2" transform="rotate(-14 28 27)" fill="#F59F00" opacity="0.72"/>
        <ellipse cx="47" cy="24" rx="5" ry="3.4" transform="rotate(10 47 24)" fill="#F59F00" opacity="0.72"/>
        <ellipse cx="38" cy="39" rx="5.2" ry="3.4" fill="#F59F00" opacity="0.68"/>
        <ellipse cx="56" cy="38" rx="3.8" ry="2.8" transform="rotate(-12 56 38)" fill="#F59F00" opacity="0.68"/>
        <circle cx="22" cy="40" r="2.8" fill="#F59F00" opacity="0.65"/>
        <path d="M22 18Q32 14 42 16" stroke="#FFF9DB" stroke-width="3" stroke-linecap="round"/>
        <circle cx="62" cy="16" r="6.5" fill="${pal.foam}" stroke="${pal.stroke}" stroke-width="2"/>
        <circle cx="70" cy="24" r="4.5" fill="${pal.foam}" stroke="${pal.stroke}" stroke-width="1.8"/>
        <circle cx="13" cy="20" r="4.5" fill="${pal.foam}" stroke="${pal.stroke}" stroke-width="1.8"/>
      </svg>
    `;
  }

  function renderShowerheadSVG(size = 58) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 76 76" fill="none" aria-hidden="true">
        <path d="M62 12C50 12 43 18 37 26" stroke="#ADB5BD" stroke-width="9" stroke-linecap="round"/>
        <path d="M62 12C50 12 43 18 37 26" stroke="#4A3728" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M23 21L47 37L38 49C31 53 20 50 14 43C9 36 14 25 23 21Z" fill="#74C0FC" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
        <ellipse cx="28" cy="43" rx="16" ry="8" transform="rotate(34 28 43)" fill="#E7F5FF" stroke="#4A3728" stroke-width="3.4"/>
        <circle cx="21" cy="39" r="2.1" fill="#339AF0"/>
        <circle cx="28" cy="43" r="2.1" fill="#339AF0"/>
        <circle cx="35" cy="47" r="2.1" fill="#339AF0"/>
        <circle cx="25" cy="46" r="1.9" fill="#339AF0"/>
        <circle cx="31" cy="40" r="1.9" fill="#339AF0"/>
        <path d="M26 27Q34 31 39 36" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" opacity="0.8"/>
      </svg>
    `;
  }

  function renderHairdryerSVG(size = 62) {
    return `
      <svg width="${size}" height="${Math.round(size * 0.9)}" viewBox="0 0 82 74" fill="none" aria-hidden="true">
        <!-- Handle -->
        <path d="M44 38L54 63C55.5 67 52 70 47 69L39 67C36 66 35 63 34 60L28 41Z" fill="#FF85C0" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
        <!-- Power Button -->
        <circle cx="41" cy="52" r="4.2" fill="#FFD43B" stroke="#4A3728" stroke-width="2.2"/>
        <!-- Nozzle Cone (faces left by default) -->
        <path d="M24 22L8 18C6 18 5 20 5 23V37C5 40 6 42 8 42L24 38Z" fill="#FFE066" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <line x1="11" y1="22" x2="11" y2="38" stroke="#F59F00" stroke-width="2.4" stroke-linecap="round"/>
        <!-- Main Rounded Pink Barrel -->
        <path d="M22 20C22 14 34 11 49 12C63 13 73 20 73 30C73 40 63 47 49 48C34 49 22 46 22 40Z" fill="#FF9EC7" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <!-- Back Vent Cap -->
        <ellipse cx="66" cy="30" rx="6" ry="11" fill="#FFD6E8" stroke="#4A3728" stroke-width="2.6"/>
        <circle cx="66" cy="25" r="1.5" fill="#4A3728"/>
        <circle cx="66" cy="30" r="1.5" fill="#4A3728"/>
        <circle cx="66" cy="35" r="1.5" fill="#4A3728"/>
        <!-- Glossy Highlight & Cute Heart -->
        <path d="M30 19Q44 16 56 19" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" opacity="0.82"/>
        <path d="M43 35C38 31 38 26 43 29C48 26 48 31 43 35Z" fill="#FFF0F7" stroke="#E64980" stroke-width="1.6" stroke-linejoin="round"/>
      </svg>
    `;
  }

  /* ========================================================================
     Full Interactive Bathtub Scene SVG
     ======================================================================== */

  function renderSpotSVG(spot, pal) {
    const r = spot.r;
    return `
      <g class="bath-spot" data-spot-id="${spot.id}" transform="translate(${spot.x}, ${spot.y})">
        <!-- Mud Blob (shrinks during scrub) -->
        <g class="spot-mud" transform="rotate(${spot.rot})">
          <ellipse cx="0" cy="0" rx="${r}" ry="${Math.round(r * 0.72)}" fill="#9C6B43" stroke="#6B4423" stroke-width="2.4"/>
          <circle cx="${Math.round(r * 0.62)}" cy="${Math.round(-r * 0.45)}" r="${Math.max(3.5, Math.round(r * 0.28))}" fill="#9C6B43" stroke="#6B4423" stroke-width="1.8"/>
          <circle cx="${Math.round(-r * 0.65)}" cy="${Math.round(r * 0.42)}" r="${Math.max(3, Math.round(r * 0.24))}" fill="#8A5A32"/>
          <ellipse cx="${Math.round(-r * 0.22)}" cy="${Math.round(-r * 0.18)}" rx="${Math.round(r * 0.34)}" ry="${Math.round(r * 0.16)}" fill="#B88356" opacity="0.65"/>
        </g>

        <!-- Flavored Foam Cloud (grows during scrub, shrinks during rinse) -->
        <g class="spot-foam" opacity="0" transform="scale(0.2)">
          <circle cx="-8" cy="2" r="${Math.round(r * 0.72)}" fill="${pal.foam}" stroke="${pal.stroke}" stroke-width="2.2"/>
          <circle cx="8" cy="3" r="${Math.round(r * 0.68)}" fill="${pal.foam}" stroke="${pal.stroke}" stroke-width="2.2"/>
          <circle cx="0" cy="-6" r="${Math.round(r * 0.78)}" fill="#FFFFFF" stroke="${pal.stroke}" stroke-width="2.2"/>
          <circle cx="0" cy="6" r="${Math.round(r * 0.56)}" fill="${pal.foam}" stroke="${pal.stroke}" stroke-width="1.8"/>
          <path d="M-5 -9A6 6 0 0 1 5 -9" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>
        </g>

        <!-- Glistening Wet Droplets (appears after shake-off, evaporates during dry) -->
        <g class="spot-wet" opacity="0" transform="scale(0.2)">
          <path d="M-4 -10C-8 -2 -11 3 -7 8C-3 12 4 9 3 2C2 -2 -1 -6 -4 -10Z" fill="#4DABF7" stroke="#1C7ED6" stroke-width="2" stroke-linejoin="round"/>
          <ellipse cx="-6" cy="2" rx="1.8" ry="3.2" transform="rotate(-14 -6 2)" fill="#FFFFFF" opacity="0.82"/>
          <path d="M9 -4C6 1 5 5 8 8C11 10 15 8 14 3C13 0 11 -2 9 -4Z" fill="#74C0FC" stroke="#1C7ED6" stroke-width="1.8" stroke-linejoin="round"/>
          <circle cx="8" cy="3" r="1.3" fill="#FFFFFF" opacity="0.85"/>
        </g>

        <!-- Generous Tap-Assist Hit Target -->
        <circle class="spot-hit" cx="0" cy="0" r="${Math.max(24, r + 9)}" fill="transparent"/>
      </g>
    `;
  }

  function renderBathtubSceneSVG() {
    const pal = getFlavorPalette();
    return `
      <svg class="bath-scene-svg" id="bathSceneSvg" viewBox="0 0 ${SVG_W} ${SVG_H}" preserveAspectRatio="xMidYMid meet" fill="none">
        <defs>
          <linearGradient id="bathWallGrad" x1="0" y1="0" x2="0" y2="165" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#DCF9F5"/>
            <stop offset="100%" stop-color="#EDFDFB"/>
          </linearGradient>
          <linearGradient id="bathFloorGrad" x1="0" y1="220" x2="0" y2="260" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFF5E4"/>
            <stop offset="100%" stop-color="#FFE8CC"/>
          </linearGradient>
          <pattern id="bathTilePattern" width="36" height="30" patternUnits="userSpaceOnUse">
            <rect width="36" height="30" fill="none" stroke="#BEEBE4" stroke-width="1.2" opacity="0.7"/>
          </pattern>
        </defs>

        <!-- Pastel Sky-Mint Tiled Bathroom Wall -->
        <rect x="0" y="0" width="420" height="224" fill="url(#bathWallGrad)"/>
        <rect x="0" y="0" width="420" height="156" fill="url(#bathTilePattern)"/>
        <!-- Wainscoting Trim -->
        <rect x="0" y="154" width="420" height="8" fill="#B2ECE4"/>
        <rect x="0" y="162" width="420" height="62" fill="#D5F4F0" opacity="0.7"/>
        <!-- Bathroom Floor & Cozy Bathmat -->
        <rect x="0" y="224" width="420" height="36" fill="url(#bathFloorGrad)"/>
        <line x1="0" y1="224" x2="420" y2="224" stroke="#E8C9A0" stroke-width="2.5"/>
        <ellipse cx="210" cy="244" rx="146" ry="12" fill="#FFD6E8" stroke="#FF9EC7" stroke-width="2.5"/>
        <ellipse cx="210" cy="244" rx="122" ry="7" fill="#FFF0F7" opacity="0.72"/>

        <!-- Cute Wall Shelf on Upper-Left -->
        <g opacity="0.95">
          <rect x="20" y="64" width="76" height="9" rx="4.5" fill="#FFE0A3" stroke="#C59052" stroke-width="2.2"/>
          <rect x="30" y="42" width="16" height="22" rx="5" fill="#B2F2BB" stroke="#4A3728" stroke-width="2"/>
          <rect x="34" y="37" width="8" height="5" rx="2" fill="#51CF66" stroke="#4A3728" stroke-width="1.8"/>
          <rect x="52" y="48" width="34" height="16" rx="7" fill="#FFC9E3" stroke="#4A3728" stroke-width="2"/>
          <line x1="57" y1="54" x2="81" y2="54" stroke="#FF85C0" stroke-width="2" stroke-linecap="round"/>
        </g>

        <!-- Sunny Round Porthole Window on Upper-Right -->
        <g>
          <circle cx="368" cy="48" r="26" fill="#A5E2FF" stroke="#FFFFFF" stroke-width="5"/>
          <circle cx="368" cy="48" r="28" fill="none" stroke="#85D0C7" stroke-width="2.4"/>
          <circle cx="358" cy="39" r="7" fill="#FFE066"/>
          <path d="M358 59H383C387 59 389 56 389 53C389 50 387 48 384 48C383 44 379 41 374 41C370 41 367 43 365 46C361 46 357 49 357 53C355 54 355 59 358 59Z" fill="#FFFFFF" opacity="0.92"/>
          <line x1="368" y1="22" x2="368" y2="74" stroke="#FFFFFF" stroke-width="2.6" opacity="0.8"/>
          <line x1="342" y1="48" x2="394" y2="48" stroke="#FFFFFF" stroke-width="2.6" opacity="0.8"/>
        </g>

        <!-- Chrome Tub Faucet (Right Side) -->
        <g>
          <path d="M342 164V133C342 120 364 120 364 133V140" stroke="#CBD4DC" stroke-width="10" stroke-linecap="round"/>
          <path d="M342 164V133C342 120 364 120 364 133V140" stroke="#4A3728" stroke-width="3.2" stroke-linecap="round"/>
          <circle cx="342" cy="149" r="6.5" fill="#74C0FC" stroke="#4A3728" stroke-width="2.4"/>
          <circle cx="342" cy="149" r="2.2" fill="#FFFFFF"/>
        </g>

        <!-- Back Bathtub Rim & Tinted Bathwater -->
        <ellipse cx="210" cy="168" rx="140" ry="25" fill="#E3F4FF" stroke="#4A3728" stroke-width="4.2"/>
        <ellipse id="bathWaterFill" cx="210" cy="171" rx="129" ry="20" fill="${pal.water}"/>
        <path id="bathWaterWave" d="M108 172Q156 164 210 172T312 170" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" opacity="0.58"/>

        <!-- Animated Bottle Pour Splash FX (Step 1 -> Step 2) -->
        <g id="bathPourFx" class="bath-pour-fx" opacity="0">
          <path id="bathPourStream" d="M276 88C262 118 254 146 250 174" stroke="${pal.stroke}" stroke-width="11" stroke-linecap="round" opacity="0.85"/>
          <path d="M276 88C262 118 254 146 250 174" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" opacity="0.7"/>
          <circle cx="238" cy="168" r="7" fill="${pal.foam}" stroke="${pal.stroke}" stroke-width="2"/>
          <circle cx="262" cy="166" r="8" fill="${pal.foam}" stroke="${pal.stroke}" stroke-width="2"/>
          <circle cx="249" cy="158" r="6" fill="#FFFFFF" stroke="${pal.stroke}" stroke-width="1.8"/>
          <g transform="translate(274, 48) rotate(-52)">
            <rect id="bathPourBottleBody" x="0" y="10" width="24" height="32" rx="8" fill="${pal.bottleBody}" stroke="#4A3728" stroke-width="2.8"/>
            <rect id="bathPourBottleCap" x="6" y="2" width="12" height="9" rx="3" fill="${pal.bottleCap}" stroke="#4A3728" stroke-width="2.4"/>
          </g>
        </g>

        <!-- Happy Baby Chick Sitting in Tub -->
        <g id="bathChickGroup" class="bath-chick-actor">
          <!-- Back Glow Halo (visible when clean & done) -->
          <circle id="bathCleanHalo" cx="214" cy="116" r="78" fill="#FFF9DB" opacity="0"/>

          <!-- Left & Right Wings -->
          <ellipse cx="148" cy="136" rx="18" ry="23" transform="rotate(26 148 136)" fill="#FFE066" stroke="#4A3728" stroke-width="4.2"/>
          <ellipse cx="280" cy="136" rx="18" ry="23" transform="rotate(-26 280 136)" fill="#FFE066" stroke="#4A3728" stroke-width="4.2"/>

          <!-- Plump Chick Body -->
          <ellipse cx="214" cy="146" rx="58" ry="40" fill="#FFE066" stroke="#4A3728" stroke-width="4.5"/>
          <ellipse cx="214" cy="152" rx="35" ry="22" fill="#FFF7CC" opacity="0.88"/>

          <!-- Big Round Chick Head -->
          <circle cx="214" cy="99" r="46" fill="#FFE066" stroke="#4A3728" stroke-width="4.5"/>

          <!-- Fluffy Head Tuft (sways gently when blow-drying!) -->
          <g id="bathChickTuft" class="bath-chick-tuft">
            <path d="M204 54C200 39 212 37 214 50C219 38 230 42 222 54" fill="#FFE066" stroke="#4A3728" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>
          </g>

          <!-- Rosy Cheeks -->
          <ellipse cx="180" cy="108" rx="8.5" ry="5.2" fill="#FF85B3" opacity="0.72"/>
          <ellipse cx="248" cy="108" rx="8.5" ry="5.2" fill="#FF85B3" opacity="0.72"/>

          <!-- Live Facial Expression 1: MUDDY (sheepish cute blush) -->
          <g class="chick-expr expr-muddy">
            <path d="M189 84Q196 80 202 84" stroke="#4A3728" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M226 84Q232 80 239 84" stroke="#4A3728" stroke-width="2.6" stroke-linecap="round"/>
            <circle cx="196" cy="96" r="6" fill="#4A3728"/>
            <circle cx="198" cy="94" r="2.1" fill="#FFFFFF"/>
            <circle cx="232" cy="96" r="6" fill="#4A3728"/>
            <circle cx="234" cy="94" r="2.1" fill="#FFFFFF"/>
            <path d="M206 104L222 104L214 115Z" fill="#FF922B" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
            <path d="M209 116Q214 119 219 116" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round"/>
          </g>

          <!-- Live Facial Expression 2: TICKLE (^ ◡ ^ laughing giggle!) -->
          <g class="chick-expr expr-tickle" style="display:none">
            <path d="M187 98Q196 86 205 98" stroke="#4A3728" stroke-width="4.2" stroke-linecap="round" fill="none"/>
            <path d="M223 98Q232 86 241 98" stroke="#4A3728" stroke-width="4.2" stroke-linecap="round" fill="none"/>
            <ellipse cx="180" cy="109" rx="10" ry="6" fill="#FF6B9D" opacity="0.82"/>
            <ellipse cx="248" cy="109" rx="10" ry="6" fill="#FF6B9D" opacity="0.82"/>
            <path d="M205 103L223 103L214 114Z" fill="#FF922B" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
            <path d="M206 112Q214 126 222 112Z" fill="#FF5D6C" stroke="#4A3728" stroke-width="2.8" stroke-linejoin="round"/>
            <path d="M162 92L168 96M160 101L167 102" stroke="#FF6B9D" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M266 92L260 96M268 101L261 102" stroke="#FF6B9D" stroke-width="2.6" stroke-linecap="round"/>
          </g>

          <!-- Live Facial Expression 3: RINSE (> ◡ < tightly scrunched cute eyes!) -->
          <g class="chick-expr expr-rinse" style="display:none">
            <path d="M188 90L202 96L188 102" stroke="#4A3728" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M240 90L226 96L240 102" stroke="#4A3728" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M206 104L222 104L214 114Z" fill="#FF922B" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
            <path d="M207 115Q214 122 221 115" stroke="#4A3728" stroke-width="3" stroke-linecap="round" fill="none"/>
          </g>

          <!-- Live Facial Expression 4: FLUFF (happy wide smile & sparkling eyes!) -->
          <g class="chick-expr expr-fluff" style="display:none">
            <circle cx="196" cy="95" r="6.4" fill="#4A3728"/>
            <circle cx="198.2" cy="92.8" r="2.3" fill="#FFFFFF"/>
            <circle cx="194" cy="97.5" r="1.1" fill="#FFFFFF"/>
            <circle cx="232" cy="95" r="6.4" fill="#4A3728"/>
            <circle cx="234.2" cy="92.8" r="2.3" fill="#FFFFFF"/>
            <circle cx="230" cy="97.5" r="1.1" fill="#FFFFFF"/>
            <path d="M205 103L223 103L214 114Z" fill="#FF922B" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
            <path d="M206 113Q214 124 222 113Z" fill="#FF6B9D" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
          </g>

          <!-- Live Facial Expression 5: DONE (radiant clean chick + towel wrap / ducky shower cap!) -->
          <g class="chick-expr expr-done" style="display:none">
            <path d="M187 96Q196 86 205 96" stroke="#4A3728" stroke-width="4.2" stroke-linecap="round" fill="none"/>
            <path d="M223 96Q232 86 241 96" stroke="#4A3728" stroke-width="4.2" stroke-linecap="round" fill="none"/>
            <path d="M205 103L223 103L214 114Z" fill="#FF922B" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
            <path d="M205 113Q214 125 223 113Z" fill="#FF6B9D" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
            <!-- Adorable Yellow Ducky Shower Cap / Plush Towel Wrap -->
            <path d="M170 77C173 46 255 46 258 77Q214 64 170 77Z" fill="#FFB8DC" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
            <path d="M167 77Q176 70 186 75Q198 69 214 72Q230 69 242 75Q252 70 261 77" stroke="#FFF0F7" stroke-width="5.5" stroke-linecap="round"/>
            <path d="M167 77Q176 70 186 75Q198 69 214 72Q230 69 242 75Q252 70 261 77" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round"/>
            <!-- Cute Mini Ducky Crest Badge on Cap -->
            <circle cx="214" cy="54" r="10.5" fill="#FFD43B" stroke="#4A3728" stroke-width="2.8"/>
            <circle cx="210.5" cy="52.5" r="1.8" fill="#4A3728"/>
            <circle cx="217.5" cy="52.5" r="1.8" fill="#4A3728"/>
            <ellipse cx="214" cy="57" rx="4.2" ry="2.4" fill="#FF922B" stroke="#4A3728" stroke-width="1.6"/>
          </g>

          <!-- 5 Individual Interactive Mud / Foam / Wet Spots directly on Chick -->
          <g id="bathSpotsLayer">
            ${bathState.spots.map(s => renderSpotSVG(s, pal)).join('')}
          </g>
        </g>

        <!-- Ambient Flavor-Tinted Bath Foam Cushion along Tub Water Rim -->
        <g id="bathTubFoam" opacity="0">
          <circle cx="136" cy="171" r="15" fill="${pal.foam}" stroke="${pal.stroke}" stroke-width="2.4"/>
          <circle cx="158" cy="175" r="14" fill="#FFFFFF" stroke="${pal.stroke}" stroke-width="2.2"/>
          <circle cx="182" cy="177" r="13" fill="${pal.foam}" stroke="${pal.stroke}" stroke-width="2.2"/>
          <circle cx="246" cy="176" r="14" fill="${pal.foam}" stroke="${pal.stroke}" stroke-width="2.2"/>
          <circle cx="272" cy="174" r="15" fill="#FFFFFF" stroke="${pal.stroke}" stroke-width="2.4"/>
          <circle cx="298" cy="170" r="14" fill="${pal.foam}" stroke="${pal.stroke}" stroke-width="2.4"/>
          <circle cx="322" cy="167" r="11" fill="${pal.foam}" stroke="${pal.stroke}" stroke-width="2.2"/>
        </g>

        <!-- Squeaking Floating Rubber Ducky (Interactive at ANY step!) -->
        <g id="bathDucky" class="bath-ducky" role="button" tabindex="0" aria-label="点一点会嘎嘎叫的小黄鸭">
          <g class="bath-ducky-inner">
            <ellipse cx="102" cy="170" rx="22" ry="6" fill="#FFFFFF" opacity="0.55"/>
            <path d="M84 159C83 149 92 146 105 147C116 147 122 153 120 162C118 168 92 170 84 159Z" fill="#FFD43B" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
            <path d="M85 153L78 147L88 150Z" fill="#FFD43B" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
            <path d="M94 156Q102 162 109 156" stroke="#F59F00" stroke-width="2.6" stroke-linecap="round" fill="none"/>
            <circle cx="111" cy="140" r="11" fill="#FFD43B" stroke="#4A3728" stroke-width="3.2"/>
            <path d="M108 129C107 124 112 124 113 129" fill="#FFD43B" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round"/>
            <circle cx="114.5" cy="138" r="2.2" fill="#4A3728"/>
            <circle cx="115.2" cy="137.2" r="0.8" fill="#FFFFFF"/>
            <circle cx="108" cy="143" r="2.8" fill="#FF85B3" opacity="0.72"/>
            <path d="M120 140L130 142.5L120 146Z" fill="#FF922B" stroke="#4A3728" stroke-width="2.4" stroke-linejoin="round"/>
          </g>
          <circle cx="104" cy="150" r="30" fill="transparent"/>
        </g>

        <!-- Front Glossy White Bathtub Shell & Golden Claw Feet -->
        <g>
          <path d="M112 232L101 246H122L125 234Z" fill="#FFD43B" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M308 232L319 246H298L295 234Z" fill="#FFD43B" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
          <path d="M72 168C77 218 116 236 210 236C304 236 343 218 348 168Q210 190 72 168Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="4.5" stroke-linejoin="round"/>
          <path d="M84 196C98 220 134 229 210 229C286 229 322 220 336 196Q210 214 84 196Z" fill="#E8F6FF"/>
          <path d="M95 186C106 202 126 210 146 213" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
          <path d="M62 166Q210 190 358 166" stroke="#FFFFFF" stroke-width="13" stroke-linecap="round"/>
          <path d="M62 166Q210 190 358 166" stroke="#4A3728" stroke-width="4.5" stroke-linecap="round"/>
          <!-- Pastel Heart Emblem on Tub Front -->
          <path d="M210 218C197 208 199 195 210 203C221 195 223 208 210 218Z" fill="#FFAED0" stroke="#4A3728" stroke-width="2.4" stroke-linejoin="round"/>
        </g>

        <!-- Water Shake-Off Radial Spray Layer -->
        <g id="bathShakeSpray" class="bath-shake-spray" opacity="0">
          <path d="M142 74L126 62" stroke="#38B6FF" stroke-width="4" stroke-linecap="round"/>
          <path d="M132 104L114 102" stroke="#74C0FC" stroke-width="4" stroke-linecap="round"/>
          <path d="M138 134L122 142" stroke="#38B6FF" stroke-width="3.6" stroke-linecap="round"/>
          <path d="M286 74L302 62" stroke="#38B6FF" stroke-width="4" stroke-linecap="round"/>
          <path d="M296 104L314 102" stroke="#74C0FC" stroke-width="4" stroke-linecap="round"/>
          <path d="M290 134L306 142" stroke="#38B6FF" stroke-width="3.6" stroke-linecap="round"/>
          <circle cx="118" cy="54" r="4.5" fill="#74C0FC"/>
          <circle cx="310" cy="54" r="4.5" fill="#74C0FC"/>
          <circle cx="106" cy="98" r="4" fill="#38B6FF"/>
          <circle cx="322" cy="98" r="4" fill="#38B6FF"/>
          <circle cx="176" cy="44" r="4.2" fill="#74C0FC"/>
          <circle cx="252" cy="44" r="4.2" fill="#74C0FC"/>
        </g>

        <!-- Clean Celebration Sparkles -->
        <g id="bathDoneSparkles" class="bath-done-sparkles" opacity="0">
          <polygon points="122,48 126,58 136,62 126,66 122,76 118,66 108,62 118,58" fill="#FFD43B" stroke="#F59F00" stroke-width="1.6" stroke-linejoin="round"/>
          <polygon points="304,46 308,56 318,60 308,64 304,74 300,64 290,60 300,56" fill="#FFD43B" stroke="#F59F00" stroke-width="1.6" stroke-linejoin="round"/>
          <polygon points="292,102 294.5,108 300.5,110.5 294.5,113 292,119 289.5,113 283.5,110.5 289.5,108" fill="#FFF3BF" stroke="#F59F00" stroke-width="1.4" stroke-linejoin="round"/>
          <polygon points="134,100 136.5,106 142.5,108.5 136.5,111 134,117 131.5,111 125.5,108.5 131.5,106" fill="#FFF3BF" stroke="#F59F00" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M214 34C204 26 206 16 214 22C222 16 224 26 214 34Z" fill="#FF6B9D" stroke="#4A3728" stroke-width="2" stroke-linejoin="round"/>
        </g>
      </svg>
    `;
  }

  /* ========================================================================
     UI Renderers: Steps Bar, Tool Dock & Live Visual Sync
     ======================================================================== */

  function getActiveStepIndex() {
    if (!bathState) return 0;
    const p = bathState.phase;
    if (p === 'flavor' || p === 'pouring') return 0;
    if (p === 'scrub') return 1;
    if (p === 'rinse' || p === 'shake') return 2;
    if (p === 'dry') return 3;
    return 4;
  }

  function renderStepsBarHTML() {
    const activeIdx = getActiveStepIndex();
    return STEPS.map((s, idx) => {
      const done = idx < activeIdx;
      const active = idx === activeIdx;
      const cls = done ? 'done' : (active ? 'active' : 'upcoming');
      return `
        <span class="bath-step-pill ${cls}" data-step-id="${s.id}">
          <span class="bath-step-num">${done ? '✓' : s.num}</span>
          <span class="bath-step-label">${s.zh}</span>
        </span>
      `;
    }).join('<span class="bath-step-arrow" aria-hidden="true">›</span>');
  }

  function countRemainingForPhase() {
    if (!bathState) return 5;
    if (bathState.phase === 'scrub') {
      return bathState.spots.filter(s => s.scrubProgress < 100).length;
    }
    if (bathState.phase === 'rinse') {
      return bathState.spots.filter(s => s.foamLevel > 0).length;
    }
    if (bathState.phase === 'dry') {
      return bathState.spots.filter(s => s.wetLevel > 0).length;
    }
    return 0;
  }

  function renderToolDockHTML() {
    const p = bathState.phase;
    const total = bathState.spots.length;
    const doneCount = total - countRemainingForPhase();

    if (p === 'flavor' || p === 'pouring') {
      return `
        <div class="bath-flavor-grid" id="bathFlavorGrid">
          ${FLAVORS.map(f => `
            <button
              class="bath-flavor-btn ${bathState.flavor && bathState.flavor.id === f.id ? 'selected' : ''}"
              type="button"
              data-flavor-id="${f.id}"
              style="--flav-bg:${f.foam};--flav-border:${f.stroke};--flav-accent:${f.sparkle};"
              ${p === 'pouring' ? 'disabled' : ''}
            >
              <span class="bath-flavor-bottle">${renderBottleSVG(f, 40)}</span>
              <span class="bath-flavor-meta">
                <span class="bath-flavor-name">${f.icon} ${f.zh}</span>
                ${HMC.state && HMC.state.lang !== 'zh' ? `<span class="bath-flavor-en">${f.en}</span>` : ''}
              </span>
            </button>
          `).join('')}
        </div>
      `;
    }

    if (p === 'scrub') {
      return `
        <div class="bath-draggable-dock">
          <div
            class="bath-tool-handle bath-tool-sponge hint-glow"
            id="bathToolHandle"
            data-tool="sponge"
            role="button"
            tabindex="0"
            aria-label="抓住海绵来回搓泥巴"
          >
            <span class="bath-tool-svg">${renderSpongeSVG(54)}</span>
            <span class="bath-tool-badge">🧽 抓海绵</span>
          </div>
          <div class="bath-tool-guide">
            <div class="bath-guide-hint">
              <span class="bath-hint-arrow" aria-hidden="true">👆</span>
              <span>抓住海绵在泥点上来回搓一搓！</span>
            </div>
            <div class="bath-progress-pills" id="bathSpotPills">
              <span class="bath-progress-label">搓出香香泡泡</span>
              <span class="bath-progress-count" id="bathSpotCount">${doneCount}/${total}</span>
            </div>
          </div>
        </div>
      `;
    }

    if (p === 'rinse' || p === 'shake') {
      const label = p === 'shake' ? '哗啦啦，甩干水珠中…' : '拖起花洒在泡泡上方左右淋水！';
      return `
        <div class="bath-draggable-dock">
          <div
            class="bath-tool-handle bath-tool-shower ${p === 'rinse' ? 'hint-glow' : 'tool-resting'}"
            id="bathToolHandle"
            data-tool="shower"
            role="button"
            tabindex="0"
            aria-label="拖花洒冲泡泡"
          >
            <span class="bath-tool-svg">${renderShowerheadSVG(52)}</span>
            <span class="bath-tool-badge">🚿 拖花洒</span>
          </div>
          <div class="bath-tool-guide">
            <div class="bath-guide-hint">
              <span class="bath-hint-arrow" aria-hidden="true">💦</span>
              <span>${label}</span>
            </div>
            <div class="bath-progress-pills" id="bathSpotPills">
              <span class="bath-progress-label">冲净泡泡</span>
              <span class="bath-progress-count" id="bathSpotCount">${doneCount}/${total}</span>
            </div>
          </div>
        </div>
      `;
    }

    if (p === 'dry') {
      return `
        <div class="bath-draggable-dock">
          <div
            class="bath-tool-handle bath-tool-dryer hint-glow"
            id="bathToolHandle"
            data-tool="dryer"
            role="button"
            tabindex="0"
            aria-label="拖吹风机吹蓬松"
          >
            <span class="bath-tool-svg">${renderHairdryerSVG(56)}</span>
            <span class="bath-tool-badge">💨 吹风机</span>
          </div>
          <div class="bath-tool-guide">
            <div class="bath-guide-hint">
              <span class="bath-hint-arrow" aria-hidden="true">🌬️</span>
              <span>拖着吹风机呼呼吹干水珠！</span>
            </div>
            <div class="bath-progress-pills" id="bathSpotPills">
              <span class="bath-progress-label">吹干水珠</span>
              <span class="bath-progress-count" id="bathSpotCount">${doneCount}/${total}</span>
            </div>
          </div>
        </div>
      `;
    }

    // Done celebration actions!
    return `
      <div class="bath-done-dock">
        <div class="bath-done-banner">✨ 洗白白吹蓬松，香喷喷好舒服！</div>
        <div class="bath-done-actions">
          <button class="bath-action-btn bath-replay-btn" id="bathReplayBtn" type="button">
            🔄 再洗一次
          </button>
          <button class="bath-action-btn bath-next-story-btn" id="bathToBedtimeBtn" type="button">
            🪥 去刷牙盖被子
          </button>
        </div>
      </div>
    `;
  }

  function updateStepsAndDockUI() {
    if (!mountContainer || !bathState) return;
    const stepsEl = mountContainer.querySelector('#bathStepsBar');
    if (stepsEl) stepsEl.innerHTML = renderStepsBarHTML();

    const dockEl = mountContainer.querySelector('#bathToolDock');
    if (dockEl) {
      dockEl.innerHTML = renderToolDockHTML();
      bindDockEvents();
    }
  }

  function updateSpotCountUI() {
    if (!mountContainer || !bathState) return;
    const countEl = mountContainer.querySelector('#bathSpotCount');
    if (countEl) {
      const total = bathState.spots.length;
      const done = total - countRemainingForPhase();
      countEl.textContent = `${done}/${total}`;
    }
  }

  function setChickExpression(expr) {
    if (!bathState) return;
    bathState.expression = expr;
    if (!mountContainer) return;
    const exprNodes = mountContainer.querySelectorAll('.chick-expr');
    exprNodes.forEach(node => {
      node.style.display = node.classList.contains(`expr-${expr}`) ? '' : 'none';
    });
  }

  function syncSceneVisuals() {
    if (!mountContainer || !bathState) return;
    const pal = getFlavorPalette();

    // Water tint
    const waterEl = mountContainer.querySelector('#bathWaterFill');
    if (waterEl) waterEl.setAttribute('fill', pal.water);

    // Pour FX colors
    const pourStream = mountContainer.querySelector('#bathPourStream');
    if (pourStream) pourStream.setAttribute('stroke', pal.stroke);
    const pourBody = mountContainer.querySelector('#bathPourBottleBody');
    if (pourBody) pourBody.setAttribute('fill', pal.bottleBody);
    const pourCap = mountContainer.querySelector('#bathPourBottleCap');
    if (pourCap) pourCap.setAttribute('fill', pal.bottleCap);

    // Ambient tub foam along water rim
    const tubFoam = mountContainer.querySelector('#bathTubFoam');
    if (tubFoam) {
      let rimOpacity = 0;
      if (bathState.phase === 'pouring') rimOpacity = 0.72;
      else if (bathState.phase === 'scrub') rimOpacity = 0.95;
      else if (bathState.phase === 'rinse') {
        const avgFoam = bathState.spots.reduce((acc, s) => acc + s.foamLevel, 0) / (bathState.spots.length * 100);
        rimOpacity = Math.max(0.18, avgFoam * 0.95);
      } else if (bathState.phase === 'shake' || bathState.phase === 'dry') {
        rimOpacity = 0.14;
      } else if (bathState.phase === 'done') {
        rimOpacity = 0.28;
      }
      tubFoam.setAttribute('opacity', rimOpacity.toFixed(2));
      tubFoam.querySelectorAll('circle').forEach((c, idx) => {
        if (idx % 2 === 0) c.setAttribute('fill', pal.foam);
        c.setAttribute('stroke', pal.stroke);
      });
    }

    // Update each of the 5 spots
    bathState.spots.forEach(spot => {
      const group = mountContainer.querySelector(`.bath-spot[data-spot-id="${spot.id}"]`);
      if (!group) return;
      const mudEl = group.querySelector('.spot-mud');
      const foamEl = group.querySelector('.spot-foam');
      const wetEl = group.querySelector('.spot-wet');

      // Mud visibility
      let mudOpacity = 0;
      let mudScale = 1;
      if (bathState.phase === 'flavor' || bathState.phase === 'pouring') {
        mudOpacity = 1;
        mudScale = 1;
      } else if (bathState.phase === 'scrub') {
        mudOpacity = Math.max(0, 1 - spot.scrubProgress / 92);
        mudScale = Math.max(0.15, 1 - (spot.scrubProgress / 100) * 0.78);
      }
      if (mudEl) {
        mudEl.setAttribute('opacity', mudOpacity.toFixed(2));
        mudEl.setAttribute('transform', `rotate(${spot.rot}) scale(${mudScale.toFixed(2)})`);
      }

      // Foam visibility
      let foamOpacity = 0;
      let foamScale = 0.2;
      if (bathState.phase === 'scrub') {
        foamOpacity = Math.min(1, spot.scrubProgress / 28);
        foamScale = 0.22 + 0.88 * (spot.scrubProgress / 100);
      } else if (bathState.phase === 'rinse') {
        foamOpacity = Math.min(1, spot.foamLevel / 25);
        foamScale = 0.22 + 0.88 * (spot.foamLevel / 100);
      }
      if (foamEl) {
        foamEl.setAttribute('opacity', foamOpacity.toFixed(2));
        foamEl.setAttribute('transform', `scale(${foamScale.toFixed(2)})`);
        foamEl.querySelectorAll('circle').forEach((c, idx) => {
          if (idx !== 2) c.setAttribute('fill', pal.foam);
          c.setAttribute('stroke', pal.stroke);
        });
      }

      // Wet droplet visibility
      let wetOpacity = 0;
      let wetScale = 0.2;
      if (bathState.phase === 'shake' || bathState.phase === 'dry') {
        wetOpacity = Math.min(1, spot.wetLevel / 24);
        wetScale = 0.28 + 0.78 * (spot.wetLevel / 100);
      }
      if (wetEl) {
        wetEl.setAttribute('opacity', wetOpacity.toFixed(2));
        wetEl.setAttribute('transform', `scale(${wetScale.toFixed(2)})`);
      }
    });

    // Clean halo & sparkles
    const halo = mountContainer.querySelector('#bathCleanHalo');
    const sparkles = mountContainer.querySelector('#bathDoneSparkles');
    const isDone = bathState.phase === 'done';
    if (halo) halo.setAttribute('opacity', isDone ? '0.88' : '0');
    if (sparkles) sparkles.setAttribute('opacity', isDone ? '1' : '0');

    const canvas = mountContainer.querySelector('#bathCanvas');
    if (canvas) {
      canvas.classList.toggle('bath-done-state', isDone);
    }

    updateSpotCountUI();
  }

  /* ========================================================================
     Micro-FX Helpers: Stage Micro-Toasts, Poppable Bubbles, Zip Assist
     ======================================================================== */

  function svgToPercent(svgX, svgY) {
    return {
      leftPct: Math.max(6, Math.min(94, (svgX / SVG_W) * 100)),
      topPct: Math.max(8, Math.min(90, (svgY / SVG_H) * 100))
    };
  }

  function spawnStageToast(text, svgX, svgY, color = '#FF5C9D') {
    if (!mountContainer) return;
    const fx = mountContainer.querySelector('#bathFxLayer');
    if (!fx) return;
    const { leftPct, topPct } = svgToPercent(svgX, svgY);
    const el = document.createElement('div');
    el.className = 'bath-micro-toast';
    el.textContent = text;
    el.style.left = `${leftPct}%`;
    el.style.top = `${topPct}%`;
    el.style.color = color;
    fx.appendChild(el);
    schedule(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 980);
  }

  function spawnSparkleStar(svgX, svgY, color = '#FFB703') {
    if (!mountContainer) return;
    const fx = mountContainer.querySelector('#bathFxLayer');
    if (!fx) return;
    const { leftPct, topPct } = svgToPercent(svgX, svgY);
    const el = document.createElement('span');
    el.className = 'bath-sparkle-pop';
    el.textContent = '✨';
    el.style.left = `${leftPct}%`;
    el.style.top = `${topPct}%`;
    el.style.color = color;
    fx.appendChild(el);
    schedule(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 680);
  }

  function spawnFloatingBubble(originSvgX = null, originSvgY = null) {
    if (!mountContainer || !bathState) return null;
    if (activeBubbleCount >= 12) return null;
    const layer = mountContainer.querySelector('#bathBubblesLayer');
    if (!layer) return null;

    const pal = getFlavorPalette();
    const id = ++bubbleUid;
    const sx = originSvgX != null ? originSvgX + (Math.random() * 44 - 22) : (120 + Math.random() * 190);
    const sy = originSvgY != null ? originSvgY + (Math.random() * 18 - 9) : (145 + Math.random() * 25);
    const { leftPct, topPct } = svgToPercent(sx, sy);
    const size = Math.round(28 + Math.random() * 18);
    const dur = (3.4 + Math.random() * 1.8).toFixed(2);
    const sway = Math.round(Math.random() * 34 - 17);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'floating-bubble';
    btn.dataset.bubbleId = String(id);
    btn.setAttribute('aria-label', '戳一戳飘浮泡泡');
    btn.style.left = `${leftPct}%`;
    btn.style.top = `${topPct}%`;
    btn.style.width = `${size}px`;
    btn.style.height = `${size}px`;
    btn.style.setProperty('--bub-tint', pal.water);
    btn.style.setProperty('--bub-stroke', pal.stroke);
    btn.style.setProperty('--bub-dur', `${dur}s`);
    btn.style.setProperty('--bub-sway', `${sway}px`);

    activeBubbleCount++;

    const removeBubble = () => {
      if (btn.dataset.removed === '1') return;
      btn.dataset.removed = '1';
      activeBubbleCount = Math.max(0, activeBubbleCount - 1);
      if (btn.parentNode) btn.parentNode.removeChild(btn);
    };

    const handlePop = (e) => {
      if (e) {
        e.stopPropagation();
        if (typeof e.preventDefault === 'function') e.preventDefault();
      }
      popBubble(btn, sx, sy);
    };

    btn.addEventListener('pointerdown', handlePop);
    btn.addEventListener('click', handlePop);
    btn.addEventListener('animationend', removeBubble);

    layer.appendChild(btn);
    schedule(removeBubble, Math.round(parseFloat(dur) * 1000) + 250);
    return btn;
  }

  function popBubble(bubbleEl, fallbackSvgX = 210, fallbackSvgY = 90) {
    if (!bathState) return false;
    if (bubbleEl && bubbleEl.dataset && bubbleEl.dataset.popped === '1') return false;

    let toastX = fallbackSvgX;
    let toastY = fallbackSvgY;

    if (bubbleEl && mountContainer) {
      bubbleEl.dataset.popped = '1';
      const canvas = mountContainer.querySelector('#bathCanvas');
      if (canvas && typeof canvas.getBoundingClientRect === 'function' && typeof bubbleEl.getBoundingClientRect === 'function') {
        const cr = canvas.getBoundingClientRect();
        const br = bubbleEl.getBoundingClientRect();
        if (cr.width > 0 && cr.height > 0 && br.width > 0) {
          toastX = ((br.left + br.width / 2 - cr.left) / cr.width) * SVG_W;
          toastY = ((br.top + br.height / 2 - cr.top) / cr.height) * SVG_H;
        }
      }
      if (bubbleEl.dataset.removed !== '1') {
        bubbleEl.dataset.removed = '1';
        activeBubbleCount = Math.max(0, activeBubbleCount - 1);
        if (bubbleEl.parentNode) bubbleEl.parentNode.removeChild(bubbleEl);
      }
    }

    bathState.bubblesPopped++;
    if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.pop) {
      HMC.audio.SFX.pop();
    }
    const pal = getFlavorPalette();
    spawnSparkleStar(toastX, toastY, pal.sparkle);
    spawnStageToast('啵！', toastX, Math.max(22, toastY - 12), pal.sparkle);
    return true;
  }

  /* ========================================================================
     Interactive Rubber Ducky Easter Egg (Active at ANY Step!)
     ======================================================================== */

  function tapDucky() {
    if (!bathState) return;
    bathState.duckyQuacks++;
    if (HMC.audio && HMC.audio.SFX) {
      if (typeof HMC.audio.SFX.quack === 'function') HMC.audio.SFX.quack();
      else if (typeof HMC.audio.SFX.pop === 'function') HMC.audio.SFX.pop();
    }

    if (mountContainer) {
      const ducky = mountContainer.querySelector('#bathDucky');
      if (ducky) {
        ducky.classList.remove('ducky-bounce');
        void ducky.offsetWidth;
        ducky.classList.add('ducky-bounce');
        schedule(() => ducky.classList.remove('ducky-bounce'), 560);
      }
      spawnSparkleStar(94, 134, '#38B6FF');
      spawnSparkleStar(118, 136, '#74C0FC');
      spawnStageToast('嘎嘎！', 108, 114, '#F59F00');
    }
  }

  /* ========================================================================
     Step 1: Select Bubble Flavor & Pour Splash
     ======================================================================== */

  function selectFlavor(flavorId, opts = {}) {
    if (!bathState) return false;
    if (bathState.phase !== 'flavor') return false;
    const flavor = FLAVOR_BY_ID[flavorId];
    if (!flavor) return false;

    bathState.flavor = flavor;
    bathState.phase = 'pouring';
    syncHabitStepIndex();

    if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.bubble) {
      HMC.audio.SFX.bubble();
    }
    schedule(() => {
      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.splash) {
        HMC.audio.SFX.splash();
      }
    }, 150);

    syncSceneVisuals();
    updateStepsAndDockUI();

    if (mountContainer) {
      const pourFx = mountContainer.querySelector('#bathPourFx');
      if (pourFx) {
        pourFx.setAttribute('opacity', '1');
        pourFx.classList.add('pouring-active');
      }
      spawnStageToast(`${flavor.icon} 倒泡泡啦！`, 246, 126, flavor.sparkle);
      for (let i = 0; i < 5; i++) {
        schedule(() => spawnFloatingBubble(165 + i * 24, 155), i * 85);
      }
    }

    const enterScrub = () => {
      if (!bathState || bathState.phase !== 'pouring') return;
      if (mountContainer) {
        const pourFx = mountContainer.querySelector('#bathPourFx');
        if (pourFx) {
          pourFx.setAttribute('opacity', '0');
          pourFx.classList.remove('pouring-active');
        }
      }
      bathState.phase = 'scrub';
      syncHabitStepIndex();
      syncSceneVisuals();
      updateStepsAndDockUI();
      if (HMC.audio && HMC.audio.setPrompt) {
        HMC.audio.setPrompt(flavor.pourZh, flavor.pourEn);
      }
    };

    if (opts.instant) {
      enterScrub();
    } else {
      schedule(enterScrub, 580);
    }
    return true;
  }

  /* ========================================================================
     Chick Reaction Helpers (Tickle, Rinse Scrunch, Fluff Sway, Shake-Off)
     ======================================================================== */

  function triggerTickleReaction() {
    if (!bathState || bathState.phase !== 'scrub') return;
    bathState.tickleCount++;
    setChickExpression('tickle');

    if (mountContainer) {
      const chick = mountContainer.querySelector('#bathChickGroup');
      if (chick) {
        chick.classList.add('chick-tickle-giggle');
      }
    }

    const now = Date.now();
    if (now - lastTickleToastTs > 1350) {
      lastTickleToastTs = now;
      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.cheep) {
        HMC.audio.SFX.cheep();
      }
      spawnStageToast('哈哈哈好痒呀！', 214, 52, '#FF5C9D');
    }

    if (tickleResetTimer) clearTimeout(tickleResetTimer);
    const token = mountToken;
    tickleResetTimer = setTimeout(() => {
      tickleResetTimer = null;
      if (token !== mountToken || !bathState) return;
      if (mountContainer) {
        const chick = mountContainer.querySelector('#bathChickGroup');
        if (chick) chick.classList.remove('chick-tickle-giggle');
      }
      if (bathState.phase === 'scrub') {
        setChickExpression('muddy');
      }
    }, 880);
  }

  function triggerActiveFluffSway() {
    if (!mountContainer || !bathState || bathState.phase !== 'dry') return;
    const chick = mountContainer.querySelector('#bathChickGroup');
    if (chick) chick.classList.add('chick-fluff-sway');
    if (activeToolEffectTimer) clearTimeout(activeToolEffectTimer);
    const token = mountToken;
    activeToolEffectTimer = setTimeout(() => {
      activeToolEffectTimer = null;
      if (token !== mountToken || !mountContainer) return;
      const c = mountContainer.querySelector('#bathChickGroup');
      if (c) c.classList.remove('chick-fluff-sway');
    }, 320);
  }

  /* ========================================================================
     Core Tactile Mechanics: Scrub / Rinse / Dry in SVG Coordinates
     ======================================================================== */

  function scrubAtSvgPoint(svgX, svgY, deltaDist = 18, hitRadiusSvg = 42) {
    if (!bathState || bathState.phase !== 'scrub') return false;
    const distGain = Math.max(4, Math.min(60, deltaDist)) * 1.4;
    let touchedAny = false;
    let touchedTummy = false;
    let newlyCleanedSpot = null;

    bathState.spots.forEach(spot => {
      if (spot.scrubProgress >= 100) return;
      const d = Math.hypot(spot.x - svgX, spot.y - svgY);
      if (d <= hitRadiusSvg) {
        touchedAny = true;
        const before = spot.scrubProgress;
        spot.scrubProgress = Math.min(100, spot.scrubProgress + distGain);
        if (spot.isTickle) touchedTummy = true;
        if (before < 100 && spot.scrubProgress >= 100) {
          newlyCleanedSpot = spot;
        }
      }
    });

    if (!touchedAny) return false;

    const now = Date.now();
    if (now - lastBubbleSfxTs > 180) {
      lastBubbleSfxTs = now;
      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.bubble) {
        HMC.audio.SFX.bubble();
      }
    }
    if (now - lastBubbleSpawnTs > 220) {
      lastBubbleSpawnTs = now;
      spawnFloatingBubble(svgX, svgY - 8);
    }

    if (touchedTummy) {
      triggerTickleReaction();
    }

    if (newlyCleanedSpot) {
      const pal = getFlavorPalette();
      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.pop) {
        HMC.audio.SFX.pop();
      }
      spawnSparkleStar(newlyCleanedSpot.x, newlyCleanedSpot.y, pal.sparkle);
      spawnFloatingBubble(newlyCleanedSpot.x, newlyCleanedSpot.y - 10);
    }

    syncSceneVisuals();

    // Check if all 5 mud spots are 100% foamy clean!
    if (bathState.spots.every(s => s.scrubProgress >= 100)) {
      completeScrubPhase();
    }
    return true;
  }

  function completeScrubPhase(opts = {}) {
    if (!bathState || bathState.phase !== 'scrub') return;
    stopDrag();

    bathState.spots.forEach(s => {
      s.scrubProgress = 100;
      s.foamLevel = 100;
    });

    if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.success) {
      HMC.audio.SFX.success();
    }
    spawnStageToast('🫧 泡泡满满啦！', 214, 48, getFlavorPalette().sparkle);
    for (let i = 0; i < 4; i++) {
      spawnFloatingBubble(150 + i * 40, 120);
    }

    if (HMC.audio && HMC.audio.setPrompt) {
      HMC.audio.setPrompt(
        '全身都是香香泡泡啦！现在抓起花洒冲干净吧！',
        'Covered in yummy bubbles! Grab the showerhead to rinse clean!'
      );
    }

    const enterRinse = () => {
      if (!bathState || bathState.phase !== 'scrub') return;
      bathState.phase = 'rinse';
      setChickExpression('rinse');
      syncHabitStepIndex();
      syncSceneVisuals();
      updateStepsAndDockUI();
    };

    if (opts.instant) {
      enterRinse();
    } else {
      schedule(enterRinse, 520);
    }
  }

  function rinseAtSvgPoint(svgX, svgY, deltaDist = 18, hitRadiusSvg = 44) {
    if (!bathState || bathState.phase !== 'rinse') return false;
    const rinseAmount = Math.max(7, Math.min(55, deltaDist) * 1.25);
    let hitAny = false;
    let newlyRinsedSpot = null;

    bathState.spots.forEach(spot => {
      if (spot.foamLevel <= 0) return;
      const directDist = Math.hypot(spot.x - svgX, spot.y - svgY);
      // Falling water column directly below showerhead hits foamy spots naturally!
      const inWaterColumn =
        Math.abs(spot.x - svgX) <= hitRadiusSvg * 1.1 &&
        spot.y >= svgY - 26 &&
        spot.y <= svgY + 140;

      if (directDist <= hitRadiusSvg || inWaterColumn) {
        hitAny = true;
        const before = spot.foamLevel;
        spot.foamLevel = Math.max(0, spot.foamLevel - rinseAmount);
        if (before > 0 && spot.foamLevel <= 0) {
          newlyRinsedSpot = spot;
        }
      }
    });

    if (!hitAny) return false;

    setChickExpression('rinse');

    const now = Date.now();
    if (now - lastRainSfxTs > 650) {
      lastRainSfxTs = now;
      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.rain) {
        HMC.audio.SFX.rain();
      }
    }

    if (newlyRinsedSpot) {
      spawnSparkleStar(newlyRinsedSpot.x, newlyRinsedSpot.y, '#38B6FF');
    }

    syncSceneVisuals();

    if (bathState.spots.every(s => s.foamLevel <= 0)) {
      startShakeOffThenDry();
    }
    return true;
  }

  function startShakeOffThenDry(opts = {}) {
    if (!bathState || bathState.phase !== 'rinse') return;
    stopDrag();

    bathState.phase = 'shake';
    bathState.spots.forEach(s => {
      s.foamLevel = 0;
      s.wetLevel = 100;
    });
    setChickExpression('rinse');
    syncHabitStepIndex();
    syncSceneVisuals();
    updateStepsAndDockUI();

    if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.splash) {
      HMC.audio.SFX.splash();
    }
    spawnStageToast('哗啦啦，甩干水珠！', 214, 48, '#228BE6');

    if (mountContainer) {
      const chick = mountContainer.querySelector('#bathChickGroup');
      const spray = mountContainer.querySelector('#bathShakeSpray');
      if (chick) chick.classList.add('chick-shake-off');
      if (spray) spray.setAttribute('opacity', '1');
    }

    const enterDry = () => {
      if (!bathState || bathState.phase !== 'shake') return;
      if (mountContainer) {
        const chick = mountContainer.querySelector('#bathChickGroup');
        const spray = mountContainer.querySelector('#bathShakeSpray');
        if (chick) chick.classList.remove('chick-shake-off');
        if (spray) spray.setAttribute('opacity', '0');
      }
      bathState.phase = 'dry';
      setChickExpression('fluff');
      syncHabitStepIndex();
      syncSceneVisuals();
      updateStepsAndDockUI();

      if (HMC.audio && HMC.audio.setPrompt) {
        HMC.audio.setPrompt(
          '哗啦啦甩干水珠！快拖起吹风机把毛毛吹蓬松吧！',
          'Shake shake! Now grab the warm hairdryer to fluff dry!'
        );
      }
    };

    if (opts.instant) {
      enterDry();
    } else {
      schedule(enterDry, 750);
    }
  }

  function dryAtSvgPoint(svgX, svgY, deltaDist = 18, hitRadiusSvg = 56) {
    if (!bathState || bathState.phase !== 'dry') return false;
    const dryAmount = Math.max(7, Math.min(55, deltaDist) * 1.25);
    let hitAny = false;
    let newlyDriedSpot = null;

    // Hairdryer aims warm breeze toward chick center (214, 118)
    const dirX = svgX >= 214 ? -1 : 1;

    bathState.spots.forEach(spot => {
      if (spot.wetLevel <= 0) return;
      const d = Math.hypot(spot.x - svgX, spot.y - svgY);
      const inBreezeCone =
        ((spot.x - svgX) * dirX >= -18 && (spot.x - svgX) * dirX <= 130) &&
        Math.abs(spot.y - svgY) <= 58;

      if (d <= hitRadiusSvg || inBreezeCone) {
        hitAny = true;
        const before = spot.wetLevel;
        spot.wetLevel = Math.max(0, spot.wetLevel - dryAmount);
        if (before > 0 && spot.wetLevel <= 0) {
          newlyDriedSpot = spot;
        }
      }
    });

    if (!hitAny) return false;

    setChickExpression('fluff');
    triggerActiveFluffSway();

    const now = Date.now();
    if (now - lastBlowSfxTs > 390) {
      lastBlowSfxTs = now;
      if (HMC.audio && HMC.audio.SFX && typeof HMC.audio.SFX.blow === 'function') {
        HMC.audio.SFX.blow();
      }
    }
    if (now - lastSparkleTs > 260) {
      lastSparkleTs = now;
      spawnSparkleStar(214 + (Math.random() * 88 - 44), 95 + (Math.random() * 64 - 28), '#FFB703');
    }

    if (newlyDriedSpot) {
      spawnSparkleStar(newlyDriedSpot.x, newlyDriedSpot.y, '#FFA94D');
      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.pop) {
        HMC.audio.SFX.pop();
      }
    }

    syncSceneVisuals();

    if (bathState.spots.every(s => s.wetLevel <= 0)) {
      completeBathCelebration();
    }
    return true;
  }

  function completeBathCelebration() {
    if (!bathState || bathState.completed) return;
    stopDrag();

    bathState.completed = true;
    bathState.phase = 'done';
    bathState.spots.forEach(s => {
      s.scrubProgress = 100;
      s.foamLevel = 0;
      s.wetLevel = 0;
    });
    setChickExpression('done');
    syncHabitStepIndex();
    syncSceneVisuals();
    updateStepsAndDockUI();

    if (mountContainer) {
      const chick = mountContainer.querySelector('#bathChickGroup');
      if (chick) {
        chick.classList.remove('chick-fluff-sway', 'chick-tickle-giggle', 'chick-shake-off');
        chick.classList.add('chick-happy-bounce');
      }
      const ducky = mountContainer.querySelector('#bathDucky');
      if (ducky) {
        ducky.classList.remove('ducky-bounce');
        void ducky.offsetWidth;
        ducky.classList.add('ducky-bounce');
      }
      spawnStageToast('✨ 香喷喷蓬松啦！', 214, 42, '#FF5C9D');
    }

    if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.fanfare) {
      HMC.audio.SFX.fanfare();
    }
    if (HMC.effects && HMC.effects.burstConfetti) {
      HMC.effects.burstConfetti(42);
    }
    if (HMC.effects && HMC.effects.awardStar) {
      HMC.effects.awardStar();
    }
    if (HMC.storage && HMC.storage.recordAttempt) {
      HMC.storage.recordAttempt('play_habits', true);
    }
    if (HMC.audio && HMC.audio.praiseWithPrompt) {
      HMC.audio.praiseWithPrompt(
        '洗白白吹蓬松，香喷喷的爱干净好宝宝！',
        'Squeaky clean and fluffy! What a great helper!'
      );
    }
  }

  /* ========================================================================
     Younger-Sister Gentle Tap Assist (Zero Frustration for 1.5–2yo!)
     ======================================================================== */

  function showBriefZipTool(toolType, spot) {
    if (!mountContainer || !spot) return;
    const fx = mountContainer.querySelector('#bathFxLayer');
    if (!fx) return;
    const { leftPct, topPct } = svgToPercent(spot.x, spot.y - (toolType === 'shower' ? 24 : 0));
    const el = document.createElement('div');
    el.className = `bath-zip-tool bath-zip-${toolType}`;
    el.style.left = `${leftPct}%`;
    el.style.top = `${topPct}%`;
    if (toolType === 'sponge') {
      el.innerHTML = renderSpongeSVG(48);
    } else if (toolType === 'shower') {
      el.innerHTML = `
        <div class="bath-zip-shower-head">${renderShowerheadSVG(46)}</div>
        <div class="bath-water-streams compact"><span></span><span></span><span></span></div>
      `;
    } else if (toolType === 'dryer') {
      el.innerHTML = `
        <div class="bath-zip-dryer-head">${renderHairdryerSVG(48)}</div>
        <div class="bath-wind-streams compact"><span></span><span></span><span></span></div>
      `;
    }
    fx.appendChild(el);
    schedule(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 360);
  }

  function tapSpotAssist(spotId) {
    if (!bathState) return false;
    const spot = bathState.spots.find(s => s.id === spotId);
    if (!spot) return false;

    if (bathState.phase === 'scrub') {
      if (spot.scrubProgress >= 100) return false;
      spot.scrubProgress = Math.min(100, spot.scrubProgress + 40);
      showBriefZipTool('sponge', spot);
      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.bubble) {
        HMC.audio.SFX.bubble();
      }
      spawnFloatingBubble(spot.x, spot.y - 10);
      spawnFloatingBubble(spot.x + 12, spot.y - 6);
      if (spot.isTickle) {
        triggerTickleReaction();
      } else {
        spawnStageToast('抓住海绵来回搓一搓更快哦！', spot.x, Math.max(30, spot.y - 24), '#F59F00');
      }
      if (spot.scrubProgress >= 100) {
        spawnSparkleStar(spot.x, spot.y, getFlavorPalette().sparkle);
      }
      syncSceneVisuals();
      if (bathState.spots.every(s => s.scrubProgress >= 100)) {
        completeScrubPhase();
      }
      return true;
    }

    if (bathState.phase === 'rinse') {
      if (spot.foamLevel <= 0) return false;
      spot.foamLevel = Math.max(0, spot.foamLevel - 45);
      showBriefZipTool('shower', spot);
      setChickExpression('rinse');
      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.rain) {
        HMC.audio.SFX.rain();
      }
      spawnStageToast('拖着花洒左右淋水更快哦！', spot.x, Math.max(30, spot.y - 24), '#228BE6');
      if (spot.foamLevel <= 0) {
        spawnSparkleStar(spot.x, spot.y, '#38B6FF');
      }
      syncSceneVisuals();
      if (bathState.spots.every(s => s.foamLevel <= 0)) {
        startShakeOffThenDry();
      }
      return true;
    }

    if (bathState.phase === 'dry') {
      if (spot.wetLevel <= 0) return false;
      spot.wetLevel = Math.max(0, spot.wetLevel - 45);
      showBriefZipTool('dryer', spot);
      setChickExpression('fluff');
      triggerActiveFluffSway();
      if (HMC.audio && HMC.audio.SFX && typeof HMC.audio.SFX.blow === 'function') {
        HMC.audio.SFX.blow();
      }
      spawnSparkleStar(spot.x, spot.y, '#FFA94D');
      spawnStageToast('拖着吹风机呼呼吹更暖和哦！', spot.x, Math.max(30, spot.y - 24), '#FF6B9D');
      syncSceneVisuals();
      if (bathState.spots.every(s => s.wetLevel <= 0)) {
        completeBathCelebration();
      }
      return true;
    }

    if (bathState.phase === 'done') {
      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.cheep) {
        HMC.audio.SFX.cheep();
      }
      spawnSparkleStar(spot.x, spot.y, '#FFD43B');
      spawnStageToast('✨ 香喷喷！', spot.x, Math.max(30, spot.y - 18), '#FF5C9D');
      return true;
    }

    return false;
  }

  /* ========================================================================
     Pointer Events Smooth Drag Engine (Touch + Mouse + Continuous Pour/Blow)
     ======================================================================== */

  function getToolCursorEl() {
    return mountContainer ? mountContainer.querySelector('#bathDragCursor') : null;
  }

  function screenToCanvasSvg(clientX, clientY) {
    if (!mountContainer) return null;
    const canvas = mountContainer.querySelector('#bathCanvas');
    if (!canvas || typeof canvas.getBoundingClientRect !== 'function') return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;

    // Slight upward offset on touch so little fingers never obscure the tool tip!
    const touchOffsetY = dragPointerType === 'touch' ? -28 : 0;
    const tipClientX = clientX;
    const tipClientY = clientY + touchOffsetY;

    const svgX = ((tipClientX - rect.left) / rect.width) * SVG_W;
    const svgY = ((tipClientY - rect.top) / rect.height) * SVG_H;
    const inside =
      svgX >= -24 && svgX <= SVG_W + 24 &&
      svgY >= -24 && svgY <= SVG_H + 24;
    // Generous >= 36px screen hit radius mapped into SVG space
    const hitRadiusSvg = Math.max(38, 36 * (SVG_W / rect.width));

    return { svgX, svgY, tipClientX, tipClientY, inside, hitRadiusSvg, scaleX: SVG_W / rect.width };
  }

  function updateDragCursorVisual(clientX, clientY, isOverCanvas, svgX) {
    const cursor = getToolCursorEl();
    if (!cursor) return;
    const touchOffsetY = dragPointerType === 'touch' ? -28 : 0;
    const x = clientX;
    const y = clientY + touchOffsetY;

    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
    cursor.classList.toggle('active-effect', !!isOverCanvas);

    if (dragTool === 'dryer') {
      // Auto-flip hairdryer so nozzle & warm golden breeze always aim toward the chick!
      const faceRight = typeof svgX === 'number' && svgX < 214;
      cursor.classList.toggle('face-right', faceRight);
    }
  }

  function renderDragCursorContent(tool) {
    const cursor = getToolCursorEl();
    if (!cursor) return;
    cursor.className = `bath-drag-cursor visible tool-${tool}`;
    if (tool === 'sponge') {
      cursor.innerHTML = `<div class="bath-cursor-tool">${renderSpongeSVG(64)}</div>`;
    } else if (tool === 'shower') {
      cursor.innerHTML = `
        <div class="bath-cursor-tool">${renderShowerheadSVG(64)}</div>
        <div class="bath-water-streams" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      `;
    } else if (tool === 'dryer') {
      cursor.innerHTML = `
        <div class="bath-cursor-tool">${renderHairdryerSVG(68)}</div>
        <div class="bath-wind-streams" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
      `;
    }
  }

  function startContinuousPourTick() {
    if (rafId !== null || typeof requestAnimationFrame !== 'function') return;
    lastRafTs = performance.now ? performance.now() : Date.now();

    const tick = (ts) => {
      rafId = null;
      if (!dragActive || !bathState) return;
      const now = ts || Date.now();
      const dtSec = Math.min(0.1, Math.max(0.01, (now - lastRafTs) / 1000));
      lastRafTs = now;

      if (dragTool === 'shower' || dragTool === 'dryer') {
        const pt = screenToCanvasSvg(dragCurX, dragCurY);
        if (pt && pt.inside) {
          const steadyDelta = dtSec * 40;
          if (dragTool === 'shower' && bathState.phase === 'rinse') {
            rinseAtSvgPoint(pt.svgX, pt.svgY, steadyDelta, pt.hitRadiusSvg);
          } else if (dragTool === 'dryer' && bathState.phase === 'dry') {
            dryAtSvgPoint(pt.svgX, pt.svgY, steadyDelta, Math.max(52, pt.hitRadiusSvg * 1.35));
          }
        }
      }

      if (dragActive) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
  }

  function onGlobalPointerMove(e) {
    if (!dragActive || !bathState) return;
    if (dragPointerId != null && e.pointerId != null && e.pointerId !== dragPointerId) return;

    const dx = e.clientX - dragLastX;
    const dy = e.clientY - dragLastY;
    const stepPx = Math.hypot(dx, dy);

    if (!dragMoved && Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY) > 10) {
      dragMoved = true;
      if (dragFromStageSpot) {
        renderDragCursorContent(dragTool);
        const handle = mountContainer && mountContainer.querySelector('#bathToolHandle');
        if (handle) handle.classList.add('is-dragging');
        if (dragTool === 'shower' || dragTool === 'dryer') {
          startContinuousPourTick();
        }
      }
    }

    dragLastX = e.clientX;
    dragLastY = e.clientY;
    dragCurX = e.clientX;
    dragCurY = e.clientY;

    if (dragFromStageSpot && !dragMoved) return;

    const pt = screenToCanvasSvg(e.clientX, e.clientY);
    updateDragCursorVisual(e.clientX, e.clientY, pt ? pt.inside : false, pt ? pt.svgX : 214);

    if (!pt || !pt.inside) return;

    const deltaDistSvg = stepPx * pt.scaleX;
    if (dragTool === 'sponge' && bathState.phase === 'scrub') {
      if (stepPx >= 1.5) {
        scrubAtSvgPoint(pt.svgX, pt.svgY, deltaDistSvg, pt.hitRadiusSvg);
      }
    } else if (dragTool === 'shower' && bathState.phase === 'rinse') {
      rinseAtSvgPoint(pt.svgX, pt.svgY, deltaDistSvg, pt.hitRadiusSvg);
    } else if (dragTool === 'dryer' && bathState.phase === 'dry') {
      dryAtSvgPoint(pt.svgX, pt.svgY, deltaDistSvg, Math.max(52, pt.hitRadiusSvg * 1.35));
    }
  }

  function onGlobalPointerUp(e) {
    if (!dragActive) return;
    if (dragPointerId != null && e && e.pointerId != null && e.pointerId !== dragPointerId) return;

    const wasTapOnSpot = dragFromStageSpot && !dragMoved;
    const tappedSpotId = dragFromStageSpot;
    stopDrag();

    if (wasTapOnSpot && tappedSpotId) {
      tapSpotAssist(tappedSpotId);
    }
  }

  function startDrag(tool, e, opts = {}) {
    if (!bathState || !mountContainer) return;
    stopDrag();

    dragActive = true;
    dragTool = tool;
    dragPointerId = e && e.pointerId != null ? e.pointerId : null;
    dragPointerType = (e && e.pointerType) || 'mouse';
    dragStartX = e ? e.clientX : 0;
    dragStartY = e ? e.clientY : 0;
    dragLastX = dragStartX;
    dragLastY = dragStartY;
    dragCurX = dragStartX;
    dragCurY = dragStartY;
    dragFromStageSpot = opts.fromSpotId || null;
    dragMoved = !dragFromStageSpot;

    if (!dragFromStageSpot) {
      const handle = mountContainer.querySelector('#bathToolHandle');
      if (handle) {
        handle.classList.add('is-dragging');
        if (handle.setPointerCapture && dragPointerId != null) {
          try { handle.setPointerCapture(dragPointerId); } catch (err) {}
        }
      }
      renderDragCursorContent(tool);
      const pt = screenToCanvasSvg(dragCurX, dragCurY);
      updateDragCursorVisual(dragCurX, dragCurY, pt ? pt.inside : false, pt ? pt.svgX : 214);
      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.pop) {
        HMC.audio.SFX.pop();
      }
      if (tool === 'shower' || tool === 'dryer') {
        startContinuousPourTick();
      }
    }

    window.addEventListener('pointermove', onGlobalPointerMove, { passive: true });
    window.addEventListener('pointerup', onGlobalPointerUp);
    window.addEventListener('pointercancel', onGlobalPointerUp);
  }

  function stopDrag() {
    if (!dragActive && rafId === null) return;
    const prevPointerId = dragPointerId;
    dragActive = false;
    dragPointerId = null;
    dragTool = null;
    dragFromStageSpot = null;
    dragMoved = false;

    if (rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    window.removeEventListener('pointermove', onGlobalPointerMove);
    window.removeEventListener('pointerup', onGlobalPointerUp);
    window.removeEventListener('pointercancel', onGlobalPointerUp);

    if (mountContainer) {
      const handle = mountContainer.querySelector('#bathToolHandle');
      if (handle) {
        handle.classList.remove('is-dragging');
        if (prevPointerId != null && handle.releasePointerCapture) {
          try { handle.releasePointerCapture(prevPointerId); } catch (err) {}
        }
      }
      const cursor = getToolCursorEl();
      if (cursor) {
        cursor.className = 'bath-drag-cursor';
        cursor.innerHTML = '';
      }
    }
  }

  /* ========================================================================
     DOM Event Binding & Lifecycle (mount / unmount / reset)
     ======================================================================== */

  function bindDockEvents() {
    if (!mountContainer) return;

    // Step 1 flavor bottles
    mountContainer.querySelectorAll('.bath-flavor-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectFlavor(btn.dataset.flavorId);
      });
    });

    // Step 2 / 3 / 4 draggable tool handle
    const handle = mountContainer.querySelector('#bathToolHandle');
    if (handle) {
      handle.addEventListener('pointerdown', (e) => {
        if (bathState.phase === 'shake') return;
        e.stopPropagation();
        if (typeof e.preventDefault === 'function') e.preventDefault();
        const tool = handle.dataset.tool;
        if (tool) startDrag(tool, e);
      });
      // Friendly keyboard / click hint if tapped without dragging
      handle.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Done celebration actions
    const replayBtn = mountContainer.querySelector('#bathReplayBtn');
    if (replayBtn) {
      replayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.pop) HMC.audio.SFX.pop();
        reset();
      });
    }

    const bedtimeBtn = mountContainer.querySelector('#bathToBedtimeBtn');
    if (bedtimeBtn) {
      bedtimeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof mountOpts.onSwitchStory === 'function') {
          mountOpts.onSwitchStory('bedtime');
        }
      });
    }
  }

  function bindSceneEvents() {
    if (!mountContainer) return;

    // Story switcher tabs
    mountContainer.querySelectorAll('.habit-tab-btn').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetStory = tab.dataset.story;
        if (targetStory === 'bath') {
          if (bathState && bathState.phase === 'done') {
            if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.pop) HMC.audio.SFX.pop();
            reset();
          }
          return;
        }
        if (typeof mountOpts.onSwitchStory === 'function') {
          mountOpts.onSwitchStory(targetStory);
        }
      });
    });

    // Rubber ducky interactive at ANY step!
    const ducky = mountContainer.querySelector('#bathDucky');
    if (ducky) {
      let lastDuckyPtrTs = 0;
      const onDuckyPoke = (e) => {
        e.stopPropagation();
        if (typeof e.preventDefault === 'function') e.preventDefault();
        lastDuckyPtrTs = Date.now();
        tapDucky();
      };
      ducky.addEventListener('pointerdown', onDuckyPoke);
      ducky.addEventListener('click', (e) => {
        e.stopPropagation();
        if (Date.now() - lastDuckyPtrTs < 380) return;
        tapDucky();
      });
      ducky.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') onDuckyPoke(e);
      });
    }

    // Direct touch/tap on the 5 chick spots: supports BOTH younger-sister tap assist AND direct finger scrubbing!
    mountContainer.querySelectorAll('.bath-spot').forEach(spotEl => {
      let lastSpotPtrTs = 0;
      spotEl.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (typeof e.preventDefault === 'function') e.preventDefault();
        lastSpotPtrTs = Date.now();
        const spotId = spotEl.dataset.spotId;
        if (!bathState || !spotId) return;

        if (bathState.phase === 'scrub') {
          startDrag('sponge', e, { fromSpotId: spotId });
        } else if (bathState.phase === 'rinse') {
          startDrag('shower', e, { fromSpotId: spotId });
        } else if (bathState.phase === 'dry') {
          startDrag('dryer', e, { fromSpotId: spotId });
        } else if (bathState.phase === 'done') {
          tapSpotAssist(spotId);
        } else if (bathState.phase === 'flavor') {
          // Gentle playful cue to pick a bubble bottle first
          if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.boing) HMC.audio.SFX.boing();
          spawnStageToast('先选一瓶泡泡液吧！', 214, 54, '#FF6B9D');
        }
      });
      spotEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (Date.now() - lastSpotPtrTs < 380) return;
        const spotId = spotEl.dataset.spotId;
        if (!bathState || !spotId) return;
        if (bathState.phase === 'flavor') {
          if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.boing) HMC.audio.SFX.boing();
          spawnStageToast('先选一瓶泡泡液吧！', 214, 54, '#FF6B9D');
        } else {
          tapSpotAssist(spotId);
        }
      });
    });
  }

  function renderFullShell() {
    if (!mountContainer || !bathState) return;
    mountContainer.innerHTML = `
      <div class="bath-stage" id="bathStage">
        <div class="bath-top-row">
          <div class="habit-tabs" id="habitTabs">
            <button class="habit-tab-btn active" data-story="bath" type="button">🛁 洗泡泡澡</button>
            <button class="habit-tab-btn" data-story="bedtime" type="button">🪥 刷牙盖被子</button>
          </div>
          <div class="bath-steps-bar" id="bathStepsBar" aria-label="洗澡进度">
            ${renderStepsBarHTML()}
          </div>
        </div>

        <div class="bath-workspace">
          <div class="habit-interactive-stage">
            <div class="bath-canvas" id="bathCanvas">
              ${renderBathtubSceneSVG()}
              <div class="bath-bubbles-layer" id="bathBubblesLayer"></div>
              <div class="bath-fx-layer" id="bathFxLayer" aria-hidden="true"></div>
            </div>
          </div>

          <div class="habit-tool-dock" id="bathToolDock">
            ${renderToolDockHTML()}
          </div>
        </div>

        <div class="bath-drag-cursor" id="bathDragCursor" aria-hidden="true"></div>
      </div>
    `;

    bindSceneEvents();
    bindDockEvents();
    setChickExpression(bathState.expression);
    syncSceneVisuals();
  }

  function mount(containerEl, opts = {}) {
    unmount();
    if (!containerEl) return;

    mountToken++;
    mountContainer = containerEl;
    mountOpts = opts || {};
    bathState = createFreshState();
    activeBubbleCount = 0;
    lastBubbleSfxTs = 0;
    lastBubbleSpawnTs = 0;
    lastTickleToastTs = 0;
    lastRainSfxTs = 0;
    lastBlowSfxTs = 0;
    lastSparkleTs = 0;
    syncHabitStepIndex();

    renderFullShell();

    if (opts.isFresh !== false && HMC.audio && HMC.audio.setPrompt) {
      HMC.audio.setPrompt(
        '先选一瓶香香的泡泡液倒进浴缸吧！',
        'Pick a yummy bubble bath bottle to pour in!'
      );
    }
  }

  function unmount() {
    mountToken++;
    stopDrag();
    clearAllTimers();
    activeBubbleCount = 0;
    mountContainer = null;
    mountOpts = {};
  }

  function reset() {
    if (!mountContainer) {
      bathState = createFreshState();
      return;
    }
    const prevContainer = mountContainer;
    const prevOpts = Object.assign({}, mountOpts, { isFresh: true });
    mount(prevContainer, prevOpts);
  }

  function getState() {
    return bathState;
  }

  HMC.habits = HMC.habits || {};
  HMC.habits.bath = {
    STEPS,
    FLAVORS,
    FLAVOR_BY_ID,
    MUD_SPOTS,
    mount,
    unmount,
    reset,
    getState,
    // Direct interaction APIs (also used by DOM handlers & automated verification)
    selectFlavor,
    scrubAtSvgPoint,
    rinseAtSvgPoint,
    dryAtSvgPoint,
    tapSpotAssist,
    tapDucky,
    spawnFloatingBubble,
    popBubble,
    completeScrubPhase,
    startShakeOffThenDry,
    completeBathCelebration
  };
})(window.HMC = window.HMC || {});
