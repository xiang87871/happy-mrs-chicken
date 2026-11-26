(function (HMC) {
  'use strict';

  const SVG_W = 420;
  const SVG_H = 260;

  const STEPS = [
    { id: 'paste',   num: 1, zh: '挤牙膏',   en: 'Paste',      icon: '🧴' },
    { id: 'brush',   num: 2, zh: '刷牙打怪', en: 'Brush',      icon: '🪥' },
    { id: 'plushie', num: 3, zh: '陪睡盖被', en: 'Tuck In',    icon: '🛏️' },
    { id: 'lamp',    num: 4, zh: '拉绳关灯', en: 'Lights Out', icon: '🌙' }
  ];

  const FLAVORS = [
    {
      id: 'strawberry',
      icon: '🍓',
      zh: '草莓味',
      en: 'Strawberry',
      paste: '#FF6B9D',
      foam: '#FFE3EE',
      dark: '#D6336C',
      tubeLight: '#FFA8C7',
      stripe: '#FFF0F6'
    },
    {
      id: 'orange',
      icon: '🍊',
      zh: '香橙味',
      en: 'Orange',
      paste: '#FF922B',
      foam: '#FFF0DB',
      dark: '#D9480F',
      tubeLight: '#FFC078',
      stripe: '#FFF8ED'
    },
    {
      id: 'watermelon',
      icon: '🍉',
      zh: '西瓜味',
      en: 'Watermelon',
      paste: '#51CF66',
      foam: '#E2FBE7',
      dark: '#2B8A3E',
      tubeLight: '#8CE99A',
      stripe: '#F2FDF4'
    }
  ];
  const FLAVOR_BY_ID = Object.fromEntries(FLAVORS.map(f => [f.id, f]));

  // 4 upper + 4 lower plump teeth in 420x260 open-mouth close-up
  const TEETH = [
    { id: 'u1', row: 'upper', x: 138, y: 103 },
    { id: 'u2', row: 'upper', x: 186, y: 100 },
    { id: 'u3', row: 'upper', x: 234, y: 100 },
    { id: 'u4', row: 'upper', x: 282, y: 103 },
    { id: 'l1', row: 'lower', x: 138, y: 196 },
    { id: 'l2', row: 'lower', x: 186, y: 199 },
    { id: 'l3', row: 'lower', x: 234, y: 199 },
    { id: 'l4', row: 'lower', x: 282, y: 196 }
  ];

  // 6 independent silly wiggling Candy/Germ Monsters on 6 distinct teeth
  const GERMS = [
    { id: 'g1', toothId: 'u1', x: 138, y: 108, color: '#9775FA', dark: '#5F3DC4', horn: 'twin',  flyDx: -135, flyDy: -95,  quote: '哎呀好香，快跑！' },
    { id: 'g2', toothId: 'u2', x: 186, y: 105, color: '#FF6B9D', dark: '#C2255C', horn: 'crown', flyDx: -42,  flyDy: -120, quote: '投降啦！' },
    { id: 'g3', toothId: 'u4', x: 282, y: 108, color: '#51CF66', dark: '#2B8A3E', horn: 'spike', flyDx: 135,  flyDy: -95,  quote: '好干净快逃！' },
    { id: 'g4', toothId: 'l1', x: 138, y: 192, color: '#FF922B', dark: '#D9480F', horn: 'ant',   flyDx: -135, flyDy: 85,   quote: '哎呀好香，快跑！' },
    { id: 'g5', toothId: 'l3', x: 234, y: 194, color: '#4DABF7', dark: '#1971C2', horn: 'twin',  flyDx: 48,   flyDy: 108,  quote: '投降啦！' },
    { id: 'g6', toothId: 'l4', x: 282, y: 192, color: '#F06595', dark: '#A61E4D', horn: 'spike', flyDx: 135,  flyDy: 85,   quote: '好干净快逃！' }
  ];

  const PLUSHIES = [
    {
      id: 'dino',
      icon: '🦖',
      zh: '小恐龙',
      en: 'Little Dino',
      color: '#69DB7C',
      belly: '#D3F9D8',
      dark: '#2B8A3E',
      bg: '#EBFBEE'
    },
    {
      id: 'bear',
      icon: '🧸',
      zh: '泰迪小熊',
      en: 'Teddy Bear',
      color: '#D49B6A',
      belly: '#FFE8CC',
      dark: '#8D5524',
      bg: '#FFF4E6'
    },
    {
      id: 'bunny',
      icon: '🐰',
      zh: '软软小兔',
      en: 'Fluffy Bunny',
      color: '#FFC9E3',
      belly: '#FFF0F7',
      dark: '#D6336C',
      bg: '#FFF0F6'
    }
  ];
  const PLUSHIE_BY_ID = Object.fromEntries(PLUSHIES.map(p => [p.id, p]));

  // Runtime lifecycle state
  let mountContainer = null;
  let mountOpts = {};
  let mountToken = 0;
  let timers = new Set();
  let rafId = null;

  let bedState = null;

  // Unified Pointer Drag Runtime
  let dragActive = false;
  let dragKind = null; // 'tube' | 'toothbrush' | 'cup' | 'plushie' | 'quilt' | 'lamp'
  let dragPointerId = null;
  let dragPointerType = 'mouse';
  let dragStartX = 0;
  let dragStartY = 0;
  let dragLastX = 0;
  let dragLastY = 0;
  let dragMoved = false;
  let dragPayload = null; // e.g., { germId } | { plushieId } | { startPct } | { fromStage }
  let dragCaptureEl = null;

  // Throttling timestamps
  let lastBubbleSfxTs = 0;
  let lastBrushSfxTs = 0;
  let lastFoamFxTs = 0;
  let lastQuiltSfxTs = 0;
  let lastCordTickTs = 0;

  function createFreshState() {
    return {
      phase: 'paste', // 'paste' | 'brush' | 'gargle' | 'plushie' | 'quilt' | 'lamp' | 'done'
      scene: 'paste', // 'paste' | 'mouth' | 'bedroom'
      flavor: FLAVORS[0], // Strawberry pre-selected!
      pastePct: 0,
      pasteLocked: false,
      brushLocked: false,
      germs: GERMS.map(g => ({
        id: g.id,
        toothId: g.toothId,
        x: g.x,
        y: g.y,
        color: g.color,
        dark: g.dark,
        horn: g.horn,
        flyDx: g.flyDx,
        flyDy: g.flyDy,
        quote: g.quote,
        cleanProgress: 0,
        defeated: false
      })),
      gargling: false,
      rinsedClean: false,
      plushie: null,
      plushieLocked: false,
      quiltPct: 0,
      quiltLocked: false,
      lampPullPx: 0,
      lampOff: false,
      chickBedroomExpr: 'happy', // 'happy' | 'yawn' | 'sleep'
      completed: false
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
    if (rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function getFlavor() {
    return (bedState && bedState.flavor) || FLAVORS[0];
  }

  function syncHabitStepIndex() {
    if (!HMC.state || !bedState) return;
    const map = {
      paste: 0,
      brush: 1,
      gargle: 1,
      plushie: 2,
      quilt: 2,
      lamp: 3,
      done: 4
    };
    HMC.state.habitStep = map[bedState.phase] != null ? map[bedState.phase] : 0;
  }

  function getActiveStepIndex() {
    if (!bedState) return 0;
    const p = bedState.phase;
    if (p === 'paste') return 0;
    if (p === 'brush' || p === 'gargle') return 1;
    if (p === 'plushie' || p === 'quilt') return 2;
    if (p === 'lamp') return 3;
    return 4;
  }

  /* ========================================================================
     Storybook SVG Renderers (Tools, Plushies, Tubes & 3 Rich Scenes)
     ======================================================================== */

  function renderTubeSVG(flavor, size = 54) {
    const f = flavor || FLAVORS[0];
    return `
      <svg width="${size}" height="${Math.round(size * 0.72)}" viewBox="0 0 84 60" fill="none" aria-hidden="true">
        <!-- Crimp tail -->
        <rect x="64" y="12" width="13" height="36" rx="4" fill="${f.dark}" stroke="#4A3728" stroke-width="3"/>
        <line x1="69" y1="16" x2="69" y2="44" stroke="#FFFFFF" stroke-width="2" opacity="0.5"/>
        <!-- Main tapered toothpaste tube body -->
        <path d="M22 20L66 13V47L22 40C18 39 16 35 16 30C16 25 18 21 22 20Z" fill="${f.paste}" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <!-- White stripe & cute fruit badge -->
        <path d="M28 19L58 15V45L28 41Z" fill="${f.stripe}" opacity="0.9"/>
        <text x="44" y="36" text-anchor="middle" font-size="18">${f.icon}</text>
        <!-- Glossy tube shine -->
        <path d="M25 22L60 17" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" opacity="0.72"/>
        <!-- Nozzle tip -->
        <path d="M9 26H17V34H9C7 34 6 32.5 6 30C6 27.5 7 26 9 26Z" fill="#FFFDF8" stroke="#4A3728" stroke-width="3" stroke-linejoin="round"/>
        <!-- Cute paste dollop peeking at nozzle -->
        <circle cx="4.5" cy="30" r="3.6" fill="${f.paste}" stroke="${f.dark}" stroke-width="1.4"/>
      </svg>
    `;
  }

  function renderLoadedToothbrushSVG(flavor, size = 66) {
    const f = flavor || FLAVORS[0];
    return `
      <svg width="${size}" height="${Math.round(size * 0.46)}" viewBox="0 0 112 52" fill="none" aria-hidden="true">
        <!-- Wavy flavored toothpaste ribbon on bristles -->
        <path d="M12 18C16 9 22 10 26 15C30 9 37 10 41 16C44 12 48 13 49 18Z" fill="${f.paste}" stroke="${f.dark}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M16 14Q21 11 25 14M30 14Q35 11 39 14" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.78"/>
        <!-- Clean white bristles -->
        <rect x="11" y="18" width="38" height="14" rx="5" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.8"/>
        <line x1="18" y1="19" x2="18" y2="31" stroke="#CED4DA" stroke-width="2"/>
        <line x1="26" y1="19" x2="26" y2="31" stroke="#CED4DA" stroke-width="2"/>
        <line x1="34" y1="19" x2="34" y2="31" stroke="#CED4DA" stroke-width="2"/>
        <line x1="42" y1="19" x2="42" y2="31" stroke="#CED4DA" stroke-width="2"/>
        <!-- Storybook sky-blue toothbrush handle -->
        <path d="M8 34C8 30 11 28 16 28H48L58 31H101C106 31 109 34 109 38C109 42 106 45 101 45H56L46 42H16C11 42 8 39 8 34Z" fill="#74C0FC" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
        <rect x="66" y="34.5" width="26" height="6.5" rx="3.2" fill="#FFF3BF" stroke="#4A3728" stroke-width="1.8"/>
        <path d="M16 33H44" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity="0.7"/>
      </svg>
    `;
  }

  function renderWaterCupSVG(size = 54) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 68 68" fill="none" aria-hidden="true">
        <!-- Cup Handle -->
        <path d="M48 25C58 25 60 44 48 45" stroke="#4DABF7" stroke-width="7" stroke-linecap="round"/>
        <path d="M48 25C58 25 60 44 48 45" stroke="#4A3728" stroke-width="2.8" stroke-linecap="round"/>
        <!-- Cup Body -->
        <path d="M14 17H50L45 55C44.5 59 41 61 36 61H28C23 61 19.5 59 19 55L14 17Z" fill="#A5D8FF" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <!-- Sparkling Blue Water Top -->
        <ellipse cx="32" cy="18" rx="18" ry="5.5" fill="#4DABF7" stroke="#4A3728" stroke-width="3"/>
        <ellipse cx="30" cy="18" rx="10" ry="2.4" fill="#D0EBFF" opacity="0.85"/>
        <!-- Cute Happy Face on Cup -->
        <circle cx="26" cy="36" r="2.3" fill="#4A3728"/>
        <circle cx="38" cy="36" r="2.3" fill="#4A3728"/>
        <path d="M29 41Q32 45 35 41" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="22" cy="39" r="2.6" fill="#FF85B3" opacity="0.65"/>
        <circle cx="42" cy="39" r="2.6" fill="#FF85B3" opacity="0.65"/>
        <!-- Water droplets sparkle -->
        <path d="M20 27L21.5 47" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" opacity="0.65"/>
      </svg>
    `;
  }

  function renderPlushieSVG(plushie, size = 56) {
    const p = plushie || PLUSHIES[0];
    if (p.id === 'dino') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 72 72" fill="none" aria-hidden="true">
          <!-- Cute back spikes -->
          <polygon points="15,24 23,20 22,30" fill="#FFD43B" stroke="#4A3728" stroke-width="2.4" stroke-linejoin="round"/>
          <polygon points="13,36 22,32 22,42" fill="#FFD43B" stroke="#4A3728" stroke-width="2.4" stroke-linejoin="round"/>
          <!-- Tail -->
          <path d="M18 52C10 52 8 44 15 41" fill="${p.color}" stroke="#4A3728" stroke-width="3" stroke-linecap="round"/>
          <!-- Plump dino body -->
          <ellipse cx="36" cy="48" rx="17" ry="16" fill="${p.color}" stroke="#4A3728" stroke-width="3.2"/>
          <ellipse cx="39" cy="50" rx="10" ry="11" fill="${p.belly}"/>
          <!-- Big friendly dino head -->
          <path d="M21 28C21 15 31 11 43 13C53 14 58 21 57 30C56 37 49 41 39 41C27 41 21 36 21 28Z" fill="${p.color}" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
          <!-- Eyes & rosy cheeks -->
          <circle cx="34" cy="25" r="3" fill="#4A3728"/>
          <circle cx="35" cy="24" r="1" fill="#FFFFFF"/>
          <circle cx="47" cy="25" r="3" fill="#4A3728"/>
          <circle cx="48" cy="24" r="1" fill="#FFFFFF"/>
          <ellipse cx="30" cy="30" rx="3.4" ry="2.2" fill="#FF85B3" opacity="0.7"/>
          <ellipse cx="51" cy="30" rx="3.4" ry="2.2" fill="#FF85B3" opacity="0.7"/>
          <path d="M37 31Q41 35 45 31" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round"/>
          <!-- Tiny arms & feet -->
          <ellipse cx="26" cy="47" rx="4.5" ry="3.2" transform="rotate(-24 26 47)" fill="${p.color}" stroke="#4A3728" stroke-width="2.4"/>
          <ellipse cx="48" cy="47" rx="4.5" ry="3.2" transform="rotate(24 48 47)" fill="${p.color}" stroke="#4A3728" stroke-width="2.4"/>
          <ellipse cx="28" cy="61" rx="6" ry="4" fill="${p.color}" stroke="#4A3728" stroke-width="2.6"/>
          <ellipse cx="45" cy="61" rx="6" ry="4" fill="${p.color}" stroke="#4A3728" stroke-width="2.6"/>
        </svg>
      `;
    }
    if (p.id === 'bear') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 72 72" fill="none" aria-hidden="true">
          <!-- Round teddy ears -->
          <circle cx="21" cy="18" r="8" fill="${p.color}" stroke="#4A3728" stroke-width="3"/>
          <circle cx="21" cy="18" r="4" fill="${p.belly}"/>
          <circle cx="51" cy="18" r="8" fill="${p.color}" stroke="#4A3728" stroke-width="3"/>
          <circle cx="51" cy="18" r="4" fill="${p.belly}"/>
          <!-- Plush body -->
          <ellipse cx="36" cy="50" rx="16" ry="14" fill="${p.color}" stroke="#4A3728" stroke-width="3.2"/>
          <ellipse cx="36" cy="51" rx="9.5" ry="9" fill="${p.belly}"/>
          <!-- Cute bowtie -->
          <path d="M30 40L36 43L42 40V46L36 43L30 46Z" fill="#FF6B9D" stroke="#4A3728" stroke-width="2" stroke-linejoin="round"/>
          <!-- Head -->
          <circle cx="36" cy="28" r="15.5" fill="${p.color}" stroke="#4A3728" stroke-width="3.2"/>
          <ellipse cx="36" cy="33" rx="8" ry="6.2" fill="${p.belly}"/>
          <ellipse cx="36" cy="30.5" rx="3.4" ry="2.3" fill="#4A3728"/>
          <path d="M33 35Q36 37.8 39 35" stroke="#4A3728" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="29" cy="25" r="2.7" fill="#4A3728"/>
          <circle cx="30" cy="24" r="0.9" fill="#FFFFFF"/>
          <circle cx="43" cy="25" r="2.7" fill="#4A3728"/>
          <circle cx="44" cy="24" r="0.9" fill="#FFFFFF"/>
          <ellipse cx="24.5" cy="30" rx="3.2" ry="2" fill="#FF85B3" opacity="0.65"/>
          <ellipse cx="47.5" cy="30" rx="3.2" ry="2" fill="#FF85B3" opacity="0.65"/>
          <!-- Paws -->
          <ellipse cx="21" cy="48" rx="5" ry="4" transform="rotate(-18 21 48)" fill="${p.color}" stroke="#4A3728" stroke-width="2.6"/>
          <ellipse cx="51" cy="48" rx="5" ry="4" transform="rotate(18 51 48)" fill="${p.color}" stroke="#4A3728" stroke-width="2.6"/>
          <circle cx="27" cy="61" r="5" fill="${p.color}" stroke="#4A3728" stroke-width="2.6"/>
          <circle cx="45" cy="61" r="5" fill="${p.color}" stroke="#4A3728" stroke-width="2.6"/>
        </svg>
      `;
    }
    // Fluffy Bunny
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <!-- Long floppy bunny ears -->
        <ellipse cx="26" cy="15" rx="6" ry="13" transform="rotate(-10 26 15)" fill="#FFFDF9" stroke="#4A3728" stroke-width="3"/>
        <ellipse cx="26" cy="16" rx="2.8" ry="8" transform="rotate(-10 26 16)" fill="#FFA8C7"/>
        <ellipse cx="46" cy="15" rx="6" ry="13" transform="rotate(10 46 15)" fill="#FFFDF9" stroke="#4A3728" stroke-width="3"/>
        <ellipse cx="46" cy="16" rx="2.8" ry="8" transform="rotate(10 46 16)" fill="#FFA8C7"/>
        <!-- Body -->
        <ellipse cx="36" cy="51" rx="15" ry="13" fill="#FFFDF9" stroke="#4A3728" stroke-width="3.2"/>
        <ellipse cx="36" cy="52" rx="9" ry="8" fill="#FFE3EE"/>
        <!-- Head -->
        <circle cx="36" cy="31" r="14.5" fill="#FFFDF9" stroke="#4A3728" stroke-width="3.2"/>
        <circle cx="30" cy="29" r="2.6" fill="#4A3728"/>
        <circle cx="31" cy="28" r="0.9" fill="#FFFFFF"/>
        <circle cx="42" cy="29" r="2.6" fill="#4A3728"/>
        <circle cx="43" cy="28" r="0.9" fill="#FFFFFF"/>
        <polygon points="34,33 38,33 36,35.5" fill="#FF6B9D"/>
        <path d="M33 37Q36 39.5 39 37" stroke="#4A3728" stroke-width="2.2" stroke-linecap="round"/>
        <ellipse cx="25.5" cy="33.5" rx="3.4" ry="2.2" fill="#FF85B3" opacity="0.72"/>
        <ellipse cx="46.5" cy="33.5" rx="3.4" ry="2.2" fill="#FF85B3" opacity="0.72"/>
        <!-- Paws -->
        <ellipse cx="23" cy="49" rx="4.5" ry="3.5" fill="#FFFDF9" stroke="#4A3728" stroke-width="2.5"/>
        <ellipse cx="49" cy="49" rx="4.5" ry="3.5" fill="#FFFDF9" stroke="#4A3728" stroke-width="2.5"/>
        <ellipse cx="28" cy="62" rx="5.5" ry="3.8" fill="#FFFDF9" stroke="#4A3728" stroke-width="2.5"/>
        <ellipse cx="44" cy="62" rx="5.5" ry="3.8" fill="#FFFDF9" stroke="#4A3728" stroke-width="2.5"/>
      </svg>
    `;
  }

  /* ========================================================================
     Scene 1 (Step 1): Pastel Sink Counter + Horizontal Toothbrush + Tube
     ======================================================================== */

  function renderPasteSceneSVG() {
    const f = getFlavor();
    const pct = bedState ? bedState.pastePct : 0;
    const clipW = Math.round((pct / 100) * 140);
    // Toothpaste tube slides smoothly across the bristles from x=88 to x=220
    const tubeX = Math.round(92 + (pct / 100) * 124);
    const tubeY = pct > 0 && pct < 100 ? 116 : 108;

    return `
      <svg class="bed-scene-svg" id="bedPasteSvg" viewBox="0 0 ${SVG_W} ${SVG_H}" preserveAspectRatio="xMidYMid meet" fill="none">
        <defs>
          <linearGradient id="sinkWallGrad" x1="0" y1="0" x2="0" y2="188" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#E6FCF5"/>
            <stop offset="100%" stop-color="#FFF9DB"/>
          </linearGradient>
          <linearGradient id="sinkCounterGrad" x1="0" y1="186" x2="0" y2="260" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="100%" stop-color="#E7F5FF"/>
          </linearGradient>
          <pattern id="sinkTilePattern" width="38" height="32" patternUnits="userSpaceOnUse">
            <rect width="38" height="32" fill="none" stroke="#C3FAE8" stroke-width="1.3" opacity="0.72"/>
          </pattern>
          <clipPath id="bedPasteClip">
            <rect id="bedPasteClipRect" x="82" y="106" width="${clipW}" height="52"/>
          </clipPath>
        </defs>

        <!-- Bright Pastel Bathroom Wall & Rounded Mirror -->
        <rect x="0" y="0" width="420" height="190" fill="url(#sinkWallGrad)"/>
        <rect x="0" y="0" width="420" height="186" fill="url(#sinkTilePattern)"/>
        <ellipse cx="210" cy="48" rx="116" ry="52" fill="#E7F5FF" stroke="#FFFFFF" stroke-width="6"/>
        <ellipse cx="210" cy="48" rx="119" ry="55" fill="none" stroke="#96F2D7" stroke-width="2.5"/>
        <path d="M138 30L164 62M156 26L176 50" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.72"/>

        <!-- Cute Little Chick Peeking Happily in Mirror -->
        <g opacity="0.92">
          <circle cx="210" cy="64" r="24" fill="#FFE066" stroke="#4A3728" stroke-width="3"/>
          <path d="M204 40C202 32 209 32 210 38C213 32 219 34 215 40" fill="#FFE066" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round"/>
          <circle cx="201" cy="61" r="3" fill="#4A3728"/>
          <circle cx="219" cy="61" r="3" fill="#4A3728"/>
          <circle cx="195" cy="67" r="3.6" fill="#FF85B3" opacity="0.7"/>
          <circle cx="225" cy="67" r="3.6" fill="#FF85B3" opacity="0.7"/>
          <polygon points="206,66 214,66 210,73" fill="#FF922B" stroke="#4A3728" stroke-width="2.2" stroke-linejoin="round"/>
        </g>

        <!-- Pastel Sink Countertop & Ceramic Rim -->
        <rect x="0" y="186" width="420" height="74" fill="url(#sinkCounterGrad)"/>
        <line x1="0" y1="186" x2="420" y2="186" stroke="#A5D8FF" stroke-width="4"/>
        <ellipse cx="210" cy="216" rx="176" ry="26" fill="#D0EBFF" opacity="0.55"/>

        <!-- Cute Background Rinse Cup on Counter Right -->
        <g opacity="0.88">
          <path d="M352 146H386L382 184C381 187 378 189 374 189H364C360 189 357 187 356 184L352 146Z" fill="#A5D8FF" stroke="#4A3728" stroke-width="2.8" stroke-linejoin="round"/>
          <ellipse cx="369" cy="147" rx="17" ry="4.2" fill="#74C0FC" stroke="#4A3728" stroke-width="2.4"/>
          <circle cx="364" cy="166" r="1.8" fill="#4A3728"/>
          <circle cx="374" cy="166" r="1.8" fill="#4A3728"/>
          <path d="M367 171Q369 174 371 171" stroke="#4A3728" stroke-width="2" stroke-linecap="round"/>
        </g>

        <!-- Guiding Dotted Track above Bristles -->
        <g id="bedPasteGuide" opacity="${pct >= 100 ? '0' : '0.85'}">
          <path d="M96 132H214" stroke="${f.dark}" stroke-width="3" stroke-dasharray="6 6" stroke-linecap="round" opacity="0.48"/>
          <polygon points="214,126 226,132 214,138" fill="${f.paste}" opacity="0.82"/>
        </g>

        <!-- Large Horizontal Storybook Toothbrush -->
        <g id="bedToothbrushStage">
          <!-- Shadow -->
          <ellipse cx="216" cy="216" rx="154" ry="12" fill="#94BFE0" opacity="0.35"/>

          <!-- Clean White Bristles Block -->
          <rect x="84" y="144" width="134" height="36" rx="12" fill="#FFFFFF" stroke="#4A3728" stroke-width="4"/>
          <g stroke="#CBD4DC" stroke-width="2.6" stroke-linecap="round">
            <line x1="102" y1="147" x2="102" y2="177"/>
            <line x1="120" y1="147" x2="120" y2="177"/>
            <line x1="138" y1="147" x2="138" y2="177"/>
            <line x1="156" y1="147" x2="156" y2="177"/>
            <line x1="174" y1="147" x2="174" y2="177"/>
            <line x1="192" y1="147" x2="192" y2="177"/>
            <line x1="206" y1="147" x2="206" y2="177"/>
          </g>

          <!-- Wavy Colored Toothpaste Ribbon (0% -> 100% clipped smoothly left to right!) -->
          <g clip-path="url(#bedPasteClip)" id="bedPasteRibbon">
            <path
              id="bedPasteRibbonFill"
              d="M84 146C88 124 102 124 112 135C122 121 138 122 148 134C158 120 175 122 184 134C194 122 208 125 216 140C219 146 215 151 208 151H91C85 151 82 149 84 146Z"
              fill="${f.paste}"
              stroke="${f.dark}"
              stroke-width="3.2"
              stroke-linejoin="round"
            />
            <path
              d="M95 137Q103 130 110 137M124 135Q134 128 143 135M160 135Q170 128 179 135M194 136Q202 130 209 138"
              stroke="#FFFFFF"
              stroke-width="3"
              stroke-linecap="round"
              opacity="0.78"
            />
          </g>

          <!-- Plump Toothbrush Handle -->
          <path
            d="M72 184C72 175 79 171 92 171H216L244 178H348C362 178 370 185 370 194C370 204 362 211 348 211H240L212 204H92C79 204 72 197 72 184Z"
            fill="#74C0FC"
            stroke="#4A3728"
            stroke-width="4.2"
            stroke-linejoin="round"
          />
          <!-- Handle Grip Cushion & Shine -->
          <rect x="262" y="185" width="76" height="17" rx="8.5" fill="#FFF3BF" stroke="#4A3728" stroke-width="2.6"/>
          <circle cx="282" cy="193.5" r="3.4" fill="#FFD43B"/>
          <circle cx="300" cy="193.5" r="3.4" fill="#FFD43B"/>
          <circle cx="318" cy="193.5" r="3.4" fill="#FFD43B"/>
          <path d="M92 180H208" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" opacity="0.65"/>

          <!-- Generous Bristles Hit Target (drag or tap!) -->
          <rect id="bedBristlesHit" class="bed-bristles-hit" x="72" y="114" width="158" height="78" rx="18" fill="transparent"/>
        </g>

        <!-- Interactive Toothpaste Tube (#bedTube) positioned right above the bristles -->
        <g id="bedTube" class="bed-tube-actor ${pct >= 100 ? 'tube-done' : ''}" transform="translate(${tubeX}, ${tubeY}) rotate(-34)" role="button" tabindex="0" aria-label="拖动或点一点牙膏挤到牙刷上">
          <!-- Soft pulsing halo around tube -->
          <circle cx="22" cy="-2" r="34" fill="${f.foam}" opacity="${pct >= 100 ? '0' : '0.62'}"/>
          <!-- Nozzle tip aligned right near (0,0) -->
          <path d="M-2 -5H10V7H-2C-5 7 -6 4.5 -6 1C-6 -2.5 -5 -5 -2 -5Z" fill="#FFFDF8" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
          <!-- Active squeeze drop -->
          <circle id="bedTubeDrop" cx="-7" cy="2" r="5" fill="${f.paste}" stroke="${f.dark}" stroke-width="1.6"/>
          <!-- Tube body -->
          <path id="bedTubeBody" d="M12 -10L66 -20V22L12 12C8 11 6 7 6 1C6 -5 8 -9 12 -10Z" fill="${f.paste}" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
          <path id="bedTubeStripe" d="M22 -12L56 -18V20L22 14Z" fill="${f.stripe}" opacity="0.92"/>
          <text id="bedTubeIcon" x="39" y="8" text-anchor="middle" font-size="20" transform="rotate(34 39 1)">${f.icon}</text>
          <!-- Crimp tail -->
          <rect id="bedTubeTail" x="64" y="-21" width="13" height="44" rx="4" fill="${f.dark}" stroke="#4A3728" stroke-width="3.2"/>
          <path d="M18 -8L58 -15" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.72"/>
          <!-- Generous touch hitbox -->
          <circle cx="28" cy="0" r="46" fill="transparent"/>
        </g>
      </svg>
    `;
  }

  /* ========================================================================
     Scene 2 (Step 2 & 2b): Giant Open-Mouth Close-Up + 6 Wiggling Germs + Gargle
     ======================================================================== */

  function renderGermMonsterSVG(germ, f) {
    let hornHtml = '';
    if (germ.horn === 'twin') {
      hornHtml = `
        <path d="M-9 -13L-14 -22L-4 -16Z" fill="${germ.dark}" stroke="#4A3728" stroke-width="2" stroke-linejoin="round"/>
        <path d="M9 -13L14 -22L4 -16Z" fill="${germ.dark}" stroke="#4A3728" stroke-width="2" stroke-linejoin="round"/>
      `;
    } else if (germ.horn === 'crown') {
      hornHtml = `
        <path d="M-11 -13L-9 -22L-2 -16L2 -23L8 -16L12 -21L10 -12Z" fill="#FFD43B" stroke="#4A3728" stroke-width="2" stroke-linejoin="round"/>
      `;
    } else if (germ.horn === 'spike') {
      hornHtml = `
        <polygon points="-4,-14 0,-24 5,-14" fill="${germ.dark}" stroke="#4A3728" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="-13" cy="-9" r="3.2" fill="${germ.color}" stroke="#4A3728" stroke-width="1.8"/>
        <circle cx="13" cy="-9" r="3.2" fill="${germ.color}" stroke="#4A3728" stroke-width="1.8"/>
      `;
    } else {
      hornHtml = `
        <line x1="-6" y1="-13" x2="-11" y2="-22" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="-11" cy="-22" r="3.4" fill="#FFD43B" stroke="#4A3728" stroke-width="1.8"/>
        <line x1="6" y1="-13" x2="11" y2="-22" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="11" cy="-22" r="3.4" fill="#FFD43B" stroke="#4A3728" stroke-width="1.8"/>
      `;
    }

    return `
      <g
        class="bed-germ"
        data-germ-id="${germ.id}"
        transform="translate(${germ.x}, ${germ.y})"
        style="--fly-x:${germ.flyDx}px;--fly-y:${germ.flyDy}px;"
      >
        <g class="germ-mover">
          <g class="germ-body-anim">
            ${hornHtml}
            <!-- Wobbly silly candy-germ body -->
            <path
              d="M-16 2C-18 -9 -10 -16 0 -16C11 -16 18 -9 16 2C19 9 13 16 5 14C0 17 -6 17 -10 13C-17 15 -20 8 -16 2Z"
              fill="${germ.color}"
              stroke="#4A3728"
              stroke-width="2.8"
              stroke-linejoin="round"
            />
            <!-- Googly eyes -->
            <circle cx="-6" cy="-3" r="5.2" fill="#FFFFFF" stroke="#4A3728" stroke-width="2"/>
            <circle cx="-4.8" cy="-2.5" r="2.3" fill="#4A3728"/>
            <circle cx="6.5" cy="-4" r="4.4" fill="#FFFFFF" stroke="#4A3728" stroke-width="2"/>
            <circle cx="5.6" cy="-3.4" r="2" fill="#4A3728"/>
            <!-- Cheeky monster grin -->
            <path d="M-7 6Q0 12 7 6" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round" fill="#7B2D3B"/>
            <polygon points="-4,6.5 -1,10 1,6.5" fill="#FFFFFF"/>
            <polygon points="2,6.5 4.5,9.5 6,6.5" fill="#FFFFFF"/>
          </g>
        </g>

        <!-- Flavor-tinted minty foam cloud over this tooth as child scrubs -->
        <g class="germ-foam" opacity="0" transform="scale(0.2)">
          <circle cx="-11" cy="2" r="10" fill="${f.foam}" stroke="${f.paste}" stroke-width="2"/>
          <circle cx="10" cy="3" r="9.5" fill="${f.foam}" stroke="${f.paste}" stroke-width="2"/>
          <circle cx="0" cy="-7" r="11" fill="#FFFFFF" stroke="${f.paste}" stroke-width="2"/>
          <circle cx="0" cy="7" r="8" fill="${f.foam}" stroke="${f.paste}" stroke-width="1.8"/>
          <path d="M-5 -10A6 6 0 0 1 5 -10" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
        </g>

        <!-- Generous hit circle for toddler scrubbing & tap-assist -->
        <circle class="germ-hit" cx="0" cy="0" r="28" fill="transparent"/>
      </g>
    `;
  }

  function renderMouthSceneSVG() {
    const f = getFlavor();
    const upperTeethHtml = TEETH.filter(t => t.row === 'upper').map(t => `
      <g class="bed-tooth" data-tooth-id="${t.id}" transform="translate(${t.x}, ${t.y})">
        <rect x="-21" y="-20" width="42" height="40" rx="13" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.6"/>
        <path d="M-12 -11V5" stroke="#E7F5FF" stroke-width="4.2" stroke-linecap="round"/>
        <g class="tooth-sparkle" id="toothSparkle-${t.id}" opacity="0">
          <polygon points="10,-12 12.2,-6.5 17.8,-4.5 12.2,-2.2 10,3.2 7.8,-2.2 2.2,-4.5 7.8,-6.5" fill="#FFD43B" stroke="#F59F00" stroke-width="1.3" stroke-linejoin="round"/>
          <circle cx="-11" cy="9" r="3" fill="#FFF3BF"/>
        </g>
      </g>
    `).join('');

    const lowerTeethHtml = TEETH.filter(t => t.row === 'lower').map(t => `
      <g class="bed-tooth" data-tooth-id="${t.id}" transform="translate(${t.x}, ${t.y})">
        <rect x="-21" y="-19" width="42" height="39" rx="13" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.6"/>
        <path d="M-12 -6V10" stroke="#E7F5FF" stroke-width="4.2" stroke-linecap="round"/>
        <g class="tooth-sparkle" id="toothSparkle-${t.id}" opacity="0">
          <polygon points="10,-10 12.2,-4.5 17.8,-2.5 12.2,-0.2 10,5.2 7.8,-0.2 2.2,-2.5 7.8,-4.5" fill="#FFD43B" stroke="#F59F00" stroke-width="1.3" stroke-linejoin="round"/>
          <circle cx="-11" cy="-9" r="3" fill="#FFF3BF"/>
        </g>
      </g>
    `).join('');

    return `
      <svg class="bed-scene-svg" id="bedMouthSvg" viewBox="0 0 ${SVG_W} ${SVG_H}" preserveAspectRatio="xMidYMid meet" fill="none">
        <defs>
          <radialGradient id="mouthBgGrad" cx="50%" cy="48%" r="65%">
            <stop offset="0%" stop-color="#FFFDF5"/>
            <stop offset="100%" stop-color="#DFF8F2"/>
          </radialGradient>
        </defs>

        <!-- Soft Pastel Background -->
        <rect x="0" y="0" width="420" height="260" fill="url(#mouthBgGrad)"/>

        <!-- Giant Cute Chick Face Close-Up -->
        <g id="bedMouthFace">
          <!-- Top Fluffy Head Tuft -->
          <path d="M194 14C190 1 206 1 210 12C216 1 232 4 224 15" fill="#FFE066" stroke="#4A3728" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- Giant Round Chick Face -->
          <ellipse cx="210" cy="146" rx="188" ry="136" fill="#FFE066" stroke="#4A3728" stroke-width="4.8"/>

          <!-- Sparkling Happy Eyes Above Mouth -->
          <g id="bedMouthEyesNormal">
            <circle cx="122" cy="48" r="14" fill="#4A3728"/>
            <circle cx="127" cy="43" r="5" fill="#FFFFFF"/>
            <circle cx="118" cy="53" r="2.2" fill="#FFFFFF"/>
            <circle cx="298" cy="48" r="14" fill="#4A3728"/>
            <circle cx="303" cy="43" r="5" fill="#FFFFFF"/>
            <circle cx="294" cy="53" r="2.2" fill="#FFFFFF"/>
          </g>
          <g id="bedMouthEyesHappy" style="display:none">
            <path d="M107 52Q122 34 137 52" stroke="#4A3728" stroke-width="5.5" stroke-linecap="round"/>
            <path d="M283 52Q298 34 313 52" stroke="#4A3728" stroke-width="5.5" stroke-linecap="round"/>
          </g>

          <!-- Cute Tiny Upper Beak Arch -->
          <path d="M192 54Q210 42 228 54L210 66Z" fill="#FF922B" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>

          <!-- Soft Rosy Cheeks -->
          <ellipse cx="64" cy="126" rx="22" ry="14" fill="#FF85B3" opacity="0.65"/>
          <ellipse cx="356" cy="126" rx="22" ry="14" fill="#FF85B3" opacity="0.65"/>

          <!-- Wide Open "啊——！" Mouth Cavity -->
          <rect x="86" y="72" width="248" height="168" rx="68" fill="#FF922B" stroke="#4A3728" stroke-width="4.5"/>
          <rect x="96" y="80" width="228" height="152" rx="58" fill="#7D2A3C" stroke="#4A3728" stroke-width="3.6"/>

          <!-- Soft Pink Tongue in Lower Mouth -->
          <path d="M138 198C144 166 178 158 210 166C242 158 276 166 282 198C268 224 152 224 138 198Z" fill="#FF85A1" stroke="#B83B5E" stroke-width="3"/>
          <path d="M210 169V194" stroke="#E64980" stroke-width="3" stroke-linecap="round" opacity="0.55"/>

          <!-- 4 Plump Upper White Teeth & 4 Plump Lower White Teeth -->
          <g id="bedUpperTeeth">${upperTeethHtml}</g>
          <g id="bedLowerTeeth">${lowerTeethHtml}</g>

          <!-- 6 Independent Wiggling Candy/Germ Monsters -->
          <g id="bedGermLayer">
            ${bedState.germs.map(g => renderGermMonsterSVG(g, f)).join('')}
          </g>

          <!-- Cheerful Brushing Foam Bubbles Waiting to be Rinsed (Mini-Step 2b) -->
          <g id="bedMouthFoam" opacity="0">
            <circle cx="132" cy="122" r="16" fill="${f.foam}" stroke="${f.paste}" stroke-width="2.6"/>
            <circle cx="164" cy="116" r="14" fill="#FFFFFF" stroke="${f.paste}" stroke-width="2.4"/>
            <circle cx="204" cy="118" r="15" fill="${f.foam}" stroke="${f.paste}" stroke-width="2.4"/>
            <circle cx="246" cy="116" r="14" fill="#FFFFFF" stroke="${f.paste}" stroke-width="2.4"/>
            <circle cx="282" cy="122" r="16" fill="${f.foam}" stroke="${f.paste}" stroke-width="2.6"/>
            <circle cx="142" cy="184" r="15" fill="${f.foam}" stroke="${f.paste}" stroke-width="2.6"/>
            <circle cx="182" cy="188" r="14" fill="#FFFFFF" stroke="${f.paste}" stroke-width="2.4"/>
            <circle cx="232" cy="188" r="15" fill="${f.foam}" stroke="${f.paste}" stroke-width="2.4"/>
            <circle cx="276" cy="184" r="15" fill="${f.foam}" stroke="${f.paste}" stroke-width="2.6"/>
            <circle cx="210" cy="152" r="13" fill="#FFFFFF" stroke="${f.paste}" stroke-width="2.2"/>
          </g>

          <!-- Gargle Water Pour + Puffed Cheeks Animation (Sub-Step 2b) -->
          <g id="bedGargleFx" class="bed-gargle-fx" opacity="0">
            <!-- Tilted Pouring Water Cup -->
            <g transform="translate(278, 30) rotate(-36)">
              <path d="M12 10H42L38 42C37 45 34 47 30 47H24C20 47 17 45 16 42L12 10Z" fill="#A5D8FF" stroke="#4A3728" stroke-width="3"/>
              <ellipse cx="27" cy="11" rx="15" ry="4.5" fill="#4DABF7" stroke="#4A3728" stroke-width="2.6"/>
            </g>
            <!-- Sparkling Blue Water Stream & Spray -->
            <path d="M276 62C246 86 228 112 212 146" stroke="#4DABF7" stroke-width="14" stroke-linecap="round" opacity="0.86"/>
            <path d="M276 62C246 86 228 112 212 146" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" opacity="0.75"/>
            <circle cx="182" cy="144" r="9" fill="#74C0FC"/>
            <circle cx="242" cy="152" r="8" fill="#4DABF7"/>
            <circle cx="196" cy="166" r="7" fill="#A5D8FF"/>
            <circle cx="228" cy="134" r="6" fill="#D0EBFF"/>
            <!-- Cute Puffed Rosy Gargle Cheeks -->
            <circle cx="72" cy="140" r="32" fill="#FF9EC7" stroke="#4A3728" stroke-width="3.6" opacity="0.9"/>
            <circle cx="348" cy="140" r="32" fill="#FF9EC7" stroke="#4A3728" stroke-width="3.6" opacity="0.9"/>
          </g>

          <!-- Click/Tap-Assist Target on Mouth for Gargle Phase -->
          <rect id="bedMouthHit" class="bed-mouth-hit" x="86" y="72" width="248" height="168" rx="68" fill="transparent" style="pointer-events:none;"/>
        </g>
      </svg>
    `;
  }

  /* ========================================================================
     Scene 3 (Step 3a, 3b, 4, Done): Cozy Evening -> Midnight Starry Bedroom
     ======================================================================== */

  function renderBedroomPlushieInline(plushie) {
    if (!plushie) return '';
    // Embedded nicely inside chick's right arm in 420x260 bedroom SVG
    return `
      <g class="bed-plushie-hugged" transform="translate(216, 118) scale(0.86)">
        ${renderPlushieSVG(plushie, 72).replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '')}
      </g>
    `;
  }

  function renderBedroomSceneSVG() {
    const plushie = bedState ? bedState.plushie : null;
    const isNight = !!(bedState && bedState.lampOff);
    const expr = (bedState && bedState.chickBedroomExpr) || 'happy';
    const cordPull = (bedState && bedState.lampPullPx) || 0;
    const cordEndY = 114 + cordPull;

    return `
      <svg class="bed-scene-svg" id="bedBedroomSvg" viewBox="0 0 ${SVG_W} ${SVG_H}" preserveAspectRatio="xMidYMid meet" fill="none">
        <defs>
          <linearGradient id="roomWallDay" x1="0" y1="0" x2="0" y2="215" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFF2DC"/>
            <stop offset="100%" stop-color="#FFE3EB"/>
          </linearGradient>
          <linearGradient id="roomWallNight" x1="0" y1="0" x2="0" y2="215" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#191E46"/>
            <stop offset="100%" stop-color="#2B316B"/>
          </linearGradient>
          <radialGradient id="lampGlowDay" cx="364" cy="52" r="175" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFF3BF" stop-opacity="0.72"/>
            <stop offset="52%" stop-color="#FFD43B" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="#FFD43B" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="lampGlowNight" cx="364" cy="48" r="68" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFE066" stop-opacity="0.34"/>
            <stop offset="100%" stop-color="#FFE066" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="winSkyEvening" x1="0" y1="22" x2="0" y2="108" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#9C89F5"/>
            <stop offset="65%" stop-color="#FFA8C7"/>
            <stop offset="100%" stop-color="#FFD8A8"/>
          </linearGradient>
          <linearGradient id="winSkyNight" x1="0" y1="22" x2="0" y2="108" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#0E1334"/>
            <stop offset="100%" stop-color="#242C66"/>
          </linearGradient>
        </defs>

        <!-- Bedroom Wall: Warm Evening & Midnight Starry Crossfade -->
        <rect x="0" y="0" width="420" height="218" fill="url(#roomWallDay)"/>
        <rect class="bed-night-layer" x="0" y="0" width="420" height="218" fill="url(#roomWallNight)" opacity="${isNight ? '1' : '0'}"/>

        <!-- Cozy Subtle Wall Dots -->
        <g opacity="0.22" fill="#FFFFFF">
          <circle cx="145" cy="36" r="3"/>
          <circle cx="195" cy="24" r="2.5"/>
          <circle cx="248" cy="40" r="3"/>
          <circle cx="294" cy="26" r="2.5"/>
          <circle cx="152" cy="74" r="2.5"/>
          <circle cx="268" cy="76" r="2.5"/>
        </g>

        <!-- Bedroom Wooden Floor & Soft Rug -->
        <rect x="0" y="216" width="420" height="44" fill="#F4CFA4"/>
        <rect class="bed-night-layer" x="0" y="216" width="420" height="44" fill="#1E1E3F" opacity="${isNight ? '0.84' : '0'}"/>
        <line x1="0" y1="216" x2="420" y2="216" stroke="#C59052" stroke-width="3"/>
        <ellipse cx="198" cy="246" rx="158" ry="12" fill="#FFD6E8" stroke="#FF9EC7" stroke-width="2.2" opacity="${isNight ? '0.42' : '0.9'}"/>

        <!-- Bedroom Window (Upper-Left): Evening Twilight -> Midnight Moon & Stars -->
        <g id="bedWindow">
          <rect x="20" y="20" width="84" height="84" rx="18" fill="url(#winSkyEvening)" stroke="#FFFFFF" stroke-width="5"/>
          <rect class="bed-night-layer" x="20" y="20" width="84" height="84" rx="18" fill="url(#winSkyNight)" opacity="${isNight ? '1' : '0'}"/>
          <!-- Evening Fluffy Cloud -->
          <path class="bed-day-layer" d="M34 86H76C80 86 83 83 83 80C83 77 80 75 77 75C76 70 72 67 66 67C62 67 59 69 57 72C53 71 49 74 49 78C45 78 34 81 34 86Z" fill="#FFF4E6" opacity="${isNight ? '0' : '0.85'}"/>
          <!-- Bright Golden Crescent Moon & Twinkling Stars (vivid in night mode!) -->
          <g class="bed-window-stars" opacity="${isNight ? '1' : '0.35'}">
            <path d="M52 34C41 37 38 51 47 59C54 65 65 63 69 56C60 59 51 52 52 42C52 39 53 36 52 34Z" fill="#FFE066" stroke="#F59F00" stroke-width="1.6" stroke-linejoin="round"/>
            <polygon points="82,36 83.6,40 87.6,41.6 83.6,43.2 82,47.2 80.4,43.2 76.4,41.6 80.4,40" fill="#FFF3BF"/>
            <polygon points="78,72 79.3,75 82.3,76.3 79.3,77.6 78,80.6 76.7,77.6 73.7,76.3 76.7,75" fill="#FFE066"/>
            <circle cx="38" cy="76" r="2.2" fill="#FFF3BF"/>
            <circle cx="67" cy="40" r="1.8" fill="#FFFFFF"/>
            <circle cx="91" cy="60" r="2" fill="#FFF3BF"/>
          </g>
          <!-- Window Crossbars & Frame -->
          <line x1="62" y1="20" x2="62" y2="104" stroke="#FFFFFF" stroke-width="3.6"/>
          <line x1="20" y1="62" x2="104" y2="62" stroke="#FFFFFF" stroke-width="3.6"/>
          <rect x="20" y="20" width="84" height="84" rx="18" fill="none" stroke="#4A3728" stroke-width="3.2"/>
          <rect x="14" y="101" width="96" height="8" rx="4" fill="#FFFDF9" stroke="#4A3728" stroke-width="2.6"/>
        </g>

        <!-- Glowing Warm Amber Wall-Lamp Cone (dims softly in night mode) -->
        <circle class="bed-day-layer" cx="364" cy="52" r="175" fill="url(#lampGlowDay)" opacity="${isNight ? '0' : '1'}"/>
        <circle class="bed-night-layer" cx="364" cy="48" r="68" fill="url(#lampGlowNight)" opacity="${isNight ? '1' : '0'}"/>

        <!-- Wooden Toddler Bed & Soft Pastel Pillow -->
        <g id="bedCribGroup">
          <!-- Rounded Wooden Headboard -->
          <rect x="66" y="102" width="264" height="80" rx="22" fill="#E6A96B" stroke="#4A3728" stroke-width="4"/>
          <rect x="78" y="112" width="240" height="60" rx="14" fill="#F5C996" stroke="#C5864B" stroke-width="2.2"/>
          <!-- Soft Cream Pillow -->
          <rect x="106" y="114" width="184" height="54" rx="22" fill="#FFF9E6" stroke="#4A3728" stroke-width="3.4"/>
          <path d="M122 126Q198 120 274 126" stroke="#FFFFFF" stroke-width="3.6" stroke-linecap="round" opacity="0.8"/>

          <!-- Bed Mattress Sheet -->
          <rect x="70" y="160" width="256" height="72" rx="14" fill="#FFF0F6" stroke="#4A3728" stroke-width="3.8"/>

          <!-- Happy Baby Chick Sitting in Star Pajamas on the Bed -->
          <g id="bedChickActor" class="bed-chick-actor ${isNight ? 'chick-sleeping' : ''}">
            <!-- Wings -->
            <ellipse cx="143" cy="176" rx="13" ry="18" transform="rotate(24 143 176)" fill="#B197FC" stroke="#4A3728" stroke-width="3.4"/>
            <ellipse cx="223" cy="176" rx="13" ry="18" transform="rotate(-24 223 176)" fill="#B197FC" stroke="#4A3728" stroke-width="3.4"/>

            <!-- Starry Lavender Pajama Torso -->
            <ellipse cx="183" cy="182" rx="38" ry="30" fill="#C5B3FF" stroke="#4A3728" stroke-width="3.8"/>
            <path d="M164 156Q183 166 202 156" stroke="#FFF3BF" stroke-width="4" stroke-linecap="round"/>
            <circle cx="170" cy="174" r="3" fill="#FFF3BF"/>
            <circle cx="195" cy="176" r="2.8" fill="#FFF3BF"/>
            <circle cx="183" cy="188" r="3.2" fill="#FFF3BF"/>

            <!-- Fluffy Chick Head -->
            <circle cx="183" cy="126" r="32" fill="#FFE066" stroke="#4A3728" stroke-width="3.8"/>
            <!-- Cozy Sleep Cap / Head Tuft -->
            <path d="M175 95C172 84 181 83 183 92C187 83 196 86 190 95" fill="#FFE066" stroke="#4A3728" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>

            <!-- Rosy Cheeks -->
            <ellipse cx="160" cy="133" rx="6.5" ry="4" fill="#FF85B3" opacity="0.72"/>
            <ellipse cx="206" cy="133" rx="6.5" ry="4" fill="#FF85B3" opacity="0.72"/>

            <!-- Bedroom Expression 1: HAPPY (waiting for plushie / pulling quilt) -->
            <g class="bed-chick-expr expr-happy" style="${expr === 'happy' ? '' : 'display:none'}">
              <circle cx="171" cy="123" r="4.6" fill="#4A3728"/>
              <circle cx="172.5" cy="121.4" r="1.6" fill="#FFFFFF"/>
              <circle cx="195" cy="123" r="4.6" fill="#4A3728"/>
              <circle cx="196.5" cy="121.4" r="1.6" fill="#FFFFFF"/>
              <polygon points="177,129 189,129 183,138" fill="#FF922B" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
              <path d="M178 139Q183 144 188 139" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round"/>
            </g>

            <!-- Bedroom Expression 2: YAWN (snuggled under cozy quilt, ready for lights out!) -->
            <g class="bed-chick-expr expr-yawn" style="${expr === 'yawn' ? '' : 'display:none'}">
              <path d="M164 123Q171 118 178 123" stroke="#4A3728" stroke-width="3.4" stroke-linecap="round"/>
              <path d="M188 123Q195 118 202 123" stroke="#4A3728" stroke-width="3.4" stroke-linecap="round"/>
              <polygon points="177,128 189,128 183,134" fill="#FF922B" stroke="#4A3728" stroke-width="2.4" stroke-linejoin="round"/>
              <ellipse cx="183" cy="141" rx="6.2" ry="7.2" fill="#FF6B9D" stroke="#4A3728" stroke-width="2.6"/>
            </g>

            <!-- Bedroom Expression 3: SLEEP (sweet peaceful sleeping smile after lights out!) -->
            <g class="bed-chick-expr expr-sleep" style="${expr === 'sleep' ? '' : 'display:none'}">
              <path d="M164 124Q171 130 178 124" stroke="#4A3728" stroke-width="3.4" stroke-linecap="round"/>
              <path d="M188 124Q195 130 202 124" stroke="#4A3728" stroke-width="3.4" stroke-linecap="round"/>
              <polygon points="178,130 188,130 183,137" fill="#FF922B" stroke="#4A3728" stroke-width="2.4" stroke-linejoin="round"/>
              <path d="M179 139Q183 143 187 139" stroke="#4A3728" stroke-width="2.2" stroke-linecap="round"/>
            </g>

            <!-- Chosen Plushie Cuddled in Chick's Arms! -->
            <g id="bedChickPlushieSlot">
              ${renderBedroomPlushieInline(plushie)}
            </g>
          </g>

          <!-- Wooden Bed Side Posts & Footboard Rail -->
          <rect x="62" y="154" width="12" height="90" rx="6" fill="#D99452" stroke="#4A3728" stroke-width="3.4"/>
          <rect x="322" y="154" width="12" height="90" rx="6" fill="#D99452" stroke="#4A3728" stroke-width="3.4"/>
          <rect x="62" y="226" width="272" height="16" rx="8" fill="#E6A96B" stroke="#4A3728" stroke-width="3.6"/>
        </g>

        <!-- Warm Amber Moon Wall-Lamp & Stretchable Star Pull-Cord (Upper-Right) -->
        <g id="bedWallLamp">
          <!-- Lamp Base Bracket -->
          <rect x="357" y="16" width="14" height="12" rx="4" fill="#E6A96B" stroke="#4A3728" stroke-width="2.6"/>
          <!-- Lamp Shade (Amber glow -> Soft cozy nightlight) -->
          <path
            id="bedLampShade"
            d="M342 52C342 32 352 24 364 24C376 24 386 32 386 52C386 58 380 62 364 62C348 62 342 58 342 52Z"
            fill="${isNight ? '#4C5696' : '#FFE066'}"
            stroke="#4A3728"
            stroke-width="3.4"
            stroke-linejoin="round"
          />
          <!-- Moon Emblem on Shade -->
          <path
            d="M364 34C358 36 356 44 361 49C365 53 372 51 374 47C369 49 364 45 364 39C364 37 365 35 364 34Z"
            fill="${isNight ? '#FFE066' : '#FFF9DB'}"
          />
          <!-- Stretchable Pull-Cord Line + Golden Star Knob -->
          <line
            id="bedLampCordLine"
            x1="364"
            y1="62"
            x2="364"
            y2="${cordEndY}"
            stroke="${isNight ? '#B197FC' : '#D9820B'}"
            stroke-width="3.2"
            stroke-linecap="round"
          />
          <g id="bedLampCordStar" transform="translate(364, ${cordEndY + 8})">
            <polygon
              points="0,-13 3.8,-4.2 13,-3.2 6,3 8.2,12.2 0,7.2 -8.2,12.2 -6,3 -13,-3.2 -3.8,-4.2"
              fill="#FFD43B"
              stroke="#4A3728"
              stroke-width="2.4"
              stroke-linejoin="round"
            />
          </g>
        </g>

        <!-- Dreamy Midnight Ambient Stars inside Room (when lights out!) -->
        <g class="bed-night-sparkles" opacity="${isNight ? '1' : '0'}">
          <polygon points="148,54 150.5,60 156.5,62.5 150.5,65 148,71 145.5,65 139.5,62.5 145.5,60" fill="#FFE066"/>
          <polygon points="274,46 276,51 281,53 276,55 274,60 272,55 267,53 272,51" fill="#FFF3BF"/>
          <circle cx="232" cy="72" r="2.8" fill="#FFE066"/>
          <circle cx="308" cy="86" r="2.5" fill="#D0BFFF"/>
        </g>
      </svg>
    `;
  }

  /* ========================================================================
     UI Renderers: Steps Bar, Tool Dock & Live Visual Sync
     ======================================================================== */

  function renderStepsBarHTML() {
    const activeIdx = getActiveStepIndex();
    return STEPS.map((s, idx) => {
      const done = idx < activeIdx;
      const active = idx === activeIdx;
      const cls = done ? 'done' : (active ? 'active' : 'upcoming');
      return `
        <span class="bath-step-pill bed-step-pill ${cls}" data-step-id="${s.id}">
          <span class="bath-step-num">${done ? '✓' : s.num}</span>
          <span class="bath-step-label">${s.zh}</span>
        </span>
      `;
    }).join('<span class="bath-step-arrow" aria-hidden="true">›</span>');
  }

  function countDefeatedGerms() {
    if (!bedState) return 0;
    return bedState.germs.filter(g => g.defeated).length;
  }

  function renderToolDockHTML() {
    const p = bedState.phase;
    const f = getFlavor();

    // Step 1: Flavor selector + squeeze toothpaste handle
    if (p === 'paste') {
      const pct = Math.round(bedState.pastePct);
      return `
        <div class="bed-paste-dock">
          <div class="bed-flavor-row" id="bedFlavorRow">
            ${FLAVORS.map(item => `
              <button
                class="bed-flavor-pill ${f.id === item.id ? 'selected' : ''}"
                type="button"
                data-flavor-id="${item.id}"
                style="--bf-paste:${item.paste};--bf-foam:${item.foam};--bf-dark:${item.dark};"
              >
                <span class="bed-flavor-emoji">${item.icon}</span>
                <span class="bed-flavor-label">${item.zh}</span>
              </button>
            `).join('')}
          </div>
          <div class="bed-paste-action-row">
            <div
              class="bath-tool-handle bed-tool-paste ${pct < 100 ? 'hint-glow' : ''}"
              id="bedToolHandle"
              data-tool="tube"
              role="button"
              tabindex="0"
              style="--bf-paste:${f.paste};--bf-foam:${f.foam};--bf-dark:${f.dark};"
              aria-label="拖动牙膏或点一点挤到牙刷上"
            >
              <span class="bath-tool-svg">${renderTubeSVG(f, 44)}</span>
              <span class="bath-tool-badge">🧴 挤牙膏</span>
            </div>
            <div class="bath-tool-guide bed-paste-guide">
              <div class="bath-guide-hint">
                <span class="bath-hint-arrow" aria-hidden="true">👉</span>
                <span>向右拖牙膏，挤在牙刷上！</span>
              </div>
              <div class="bed-meter-wrap">
                <div class="bed-meter-track">
                  <div class="bed-meter-fill" id="bedPasteMeterFill" style="width:${pct}%;background:${f.paste};"></div>
                </div>
                <span class="bath-progress-count" id="bedPastePctLabel">${pct}%</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Step 2a: Brush 6 germs away with loaded toothbrush
    if (p === 'brush') {
      const defeated = countDefeatedGerms();
      const total = bedState.germs.length;
      return `
        <div class="bath-draggable-dock">
          <div
            class="bath-tool-handle bed-tool-brush hint-glow"
            id="bedToolHandle"
            data-tool="toothbrush"
            role="button"
            tabindex="0"
            aria-label="抓住牙刷来回刷打跑蛀牙怪兽"
          >
            <span class="bath-tool-svg">${renderLoadedToothbrushSVG(f, 62)}</span>
            <span class="bath-tool-badge">🪥 抓牙刷</span>
          </div>
          <div class="bath-tool-guide">
            <div class="bath-guide-hint">
              <span class="bath-hint-arrow" aria-hidden="true">🪥</span>
              <span>抓住牙刷来回刷，打跑蛀牙小怪兽！</span>
            </div>
            <div class="bath-progress-pills">
              <span class="bath-progress-label">打跑怪兽</span>
              <span class="bath-progress-count" id="bedProgressCount">${defeated}/${total}</span>
            </div>
          </div>
        </div>
      `;
    }

    // Step 2b: Gargle with draggable water cup
    if (p === 'gargle') {
      const text = bedState.gargling ? '咕噜咕噜～噗！冲干净啦！' : '拖起小水杯到嘴巴上，咕噜咕噜漱口！';
      return `
        <div class="bath-draggable-dock">
          <div
            class="bath-tool-handle bath-tool-shower ${bedState.gargling ? 'tool-resting' : 'hint-glow'}"
            id="bedToolHandle"
            data-tool="cup"
            role="button"
            tabindex="0"
            aria-label="拖水杯漱口"
          >
            <span class="bath-tool-svg">${renderWaterCupSVG(48)}</span>
            <span class="bath-tool-badge">🥤 拖水杯漱口</span>
          </div>
          <div class="bath-tool-guide">
            <div class="bath-guide-hint">
              <span class="bath-hint-arrow" aria-hidden="true">💦</span>
              <span>${text}</span>
            </div>
            <div class="bath-progress-pills">
              <span class="bath-progress-label">咕噜漱口</span>
              <span class="bath-progress-count">${bedState.rinsedClean ? '✨ 亮晶晶' : '💧 待冲洗'}</span>
            </div>
          </div>
        </div>
      `;
    }

    // Step 3a: Choose/drag a bedtime plushie into chick's arms
    if (p === 'plushie') {
      return `
        <div class="bed-plushie-dock">
          <div class="bed-plushie-grid" id="bedPlushieGrid">
            ${PLUSHIES.map(item => `
              <div
                class="bed-plushie-card"
                data-plushie-id="${item.id}"
                role="button"
                tabindex="0"
                style="--pl-bg:${item.bg};--pl-border:${item.dark};"
                aria-label="拖动或点选${item.zh}陪睡"
              >
                <span class="bed-plushie-svg">${renderPlushieSVG(item, 46)}</span>
                <span class="bed-plushie-name">${item.icon} ${item.zh}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Step 3b: Pull the starry quilt UP from bottom of bed
    if (p === 'quilt') {
      const pct = Math.round(bedState.quiltPct);
      return `
        <div class="bed-action-guide-dock">
          <button class="bed-assist-pill-btn hint-glow" id="bedQuiltAssistBtn" type="button">
            ⬆️ 往上拉盖好被子
          </button>
          <div class="bath-tool-guide">
            <div class="bath-guide-hint">
              <span class="bath-hint-arrow" aria-hidden="true">🛏️</span>
              <span>抓住床尾小被子，亲手往上拉到下巴哦！</span>
            </div>
            <div class="bed-meter-wrap">
              <div class="bed-meter-track">
                <div class="bed-meter-fill" id="bedQuiltMeterFill" style="width:${pct}%;background:#FF85C0;"></div>
              </div>
              <span class="bath-progress-count" id="bedQuiltPctLabel">${pct}%</span>
            </div>
          </div>
        </div>
      `;
    }

    // Step 4: Pull the golden star lamp cord DOWN to switch off light
    if (p === 'lamp') {
      return `
        <div class="bed-action-guide-dock">
          <button class="bed-assist-pill-btn bed-lamp-assist-btn hint-glow" id="bedLampAssistBtn" type="button">
            ⬇️ 往下拉灯绳关灯
          </button>
          <div class="bath-tool-guide">
            <div class="bath-guide-hint">
              <span class="bath-hint-arrow" aria-hidden="true">🌟</span>
              <span>拉住右上角星星灯绳，往下拉“咔哒”关灯吧！</span>
            </div>
            <div class="bath-progress-pills">
              <span class="bath-progress-label">晚安最后一步</span>
              <span class="bath-progress-count">💡 亮着</span>
            </div>
          </div>
        </div>
      `;
    }

    // Done celebration actions!
    const buddyText = bedState.plushie ? `抱着${bedState.plushie.zh}` : '';
    return `
      <div class="bath-done-dock">
        <div class="bath-done-banner bed-done-banner">🌙 牙齿亮晶晶，${buddyText}盖好被子晚安好梦！</div>
        <div class="bath-done-actions">
          <button class="bath-action-btn bath-replay-btn" id="bedReplayBtn" type="button">
            🔄 再玩一次
          </button>
          <button class="bath-action-btn bath-next-story-btn" id="bedToBathBtn" type="button">
            🛁 去洗泡泡澡
          </button>
        </div>
      </div>
    `;
  }

  function updateStepsAndDockUI() {
    if (!mountContainer || !bedState) return;
    const stepsEl = mountContainer.querySelector('#bedStepsBar');
    if (stepsEl) stepsEl.innerHTML = renderStepsBarHTML();

    const dockEl = mountContainer.querySelector('#bedToolDock');
    if (dockEl) {
      dockEl.innerHTML = renderToolDockHTML();
      bindDockEvents();
    }
  }

  /* ========================================================================
     Scene Switching & Live Visual Sync
     ======================================================================== */

  function renderCanvasSceneHTML() {
    if (!bedState) return '';
    if (bedState.scene === 'paste') {
      return `
        ${renderPasteSceneSVG()}
        <div class="bed-fx-layer" id="bedFxLayer" aria-hidden="true"></div>
      `;
    }
    if (bedState.scene === 'mouth') {
      return `
        ${renderMouthSceneSVG()}
        <div class="bed-fx-layer" id="bedFxLayer" aria-hidden="true"></div>
      `;
    }
    // Bedroom scene with aligned starry quilt overlay, star pull-cord overlay, and floating Zzz!
    const isNight = !!bedState.lampOff;
    const showQuiltHandle = bedState.phase === 'quilt' && !bedState.quiltLocked;
    const showLampCue = bedState.phase === 'lamp' && !bedState.lampOff;
    const quiltHeightPct = (15 + (bedState.quiltPct / 100) * 20.8).toFixed(1);

    return `
      ${renderBedroomSceneSVG()}

      <!-- Interactive Pink Starry Quilt Overlay (#bedQuiltOverlay) aligned squarely to the crib -->
      <div
        class="bed-quilt-overlay ${bedState.phase === 'plushie' ? 'quilt-tucked-low' : ''} ${bedState.quiltLocked ? 'quilt-snug' : ''}"
        id="bedQuiltOverlay"
        style="height:${quiltHeightPct}%;"
      >
        <div class="bed-quilt-hem" aria-hidden="true"></div>
        <div class="bed-quilt-stars" aria-hidden="true">
          <span>⭐</span><span>✨</span><span>🌙</span><span>⭐</span><span>✨</span>
        </div>
        <button
          class="bed-quilt-handle ${showQuiltHandle ? 'visible' : ''}"
          id="bedQuiltHandle"
          type="button"
          aria-label="抓住被角往上拉盖好被子"
        >
          <span class="bed-quilt-arrows" aria-hidden="true">⬆️</span>
          <span>往上拉盖好被子</span>
          <span class="bed-quilt-arrows" aria-hidden="true">⬆️</span>
        </button>
      </div>

      <!-- Interactive Golden Star Lamp Pull-Cord Handle (#bedLampCord) -->
      <div
        class="bed-lamp-cord ${showLampCue ? 'cord-active' : ''} ${isNight ? 'cord-off' : ''}"
        id="bedLampCord"
        role="button"
        tabindex="0"
        aria-label="往下拉星星灯绳关灯"
        style="--cord-pull:${bedState.lampPullPx}px;"
      >
        <div class="bed-lamp-cord-hit">
          <span class="bed-lamp-cue-badge ${showLampCue ? 'visible' : ''}">⬇️ 往下拉关灯</span>
        </div>
      </div>

      <!-- Floating Dreamy Zzz... when Chick Sleeps -->
      <div class="bed-zzz-layer ${isNight ? 'visible' : ''}" id="bedZzzLayer" aria-hidden="true">
        <span class="bed-zzz z1">Z</span>
        <span class="bed-zzz z2">z</span>
        <span class="bed-zzz z3">z...</span>
        <span class="bed-zzz-moon">🌙</span>
      </div>

      <div class="bed-fx-layer" id="bedFxLayer" aria-hidden="true"></div>
    `;
  }

  function mountCurrentScene() {
    if (!mountContainer || !bedState) return;
    const canvas = mountContainer.querySelector('#bedCanvas');
    if (!canvas) return;
    canvas.classList.toggle('night-mode', !!bedState.lampOff);
    canvas.classList.toggle('bed-done-state', bedState.phase === 'done');
    canvas.innerHTML = renderCanvasSceneHTML();
    bindCanvasSceneEvents();
    syncSceneVisuals();
  }

  function syncSceneVisuals() {
    if (!mountContainer || !bedState) return;
    const f = getFlavor();
    const canvas = mountContainer.querySelector('#bedCanvas');
    if (canvas) {
      canvas.classList.toggle('night-mode', !!bedState.lampOff);
      canvas.classList.toggle('bed-done-state', bedState.phase === 'done');
    }

    if (bedState.scene === 'paste') {
      const pct = Math.max(0, Math.min(100, bedState.pastePct));
      const clipRect = mountContainer.querySelector('#bedPasteClipRect');
      if (clipRect) clipRect.setAttribute('width', String(Math.round((pct / 100) * 140)));

      const ribbonFill = mountContainer.querySelector('#bedPasteRibbonFill');
      if (ribbonFill) {
        ribbonFill.setAttribute('fill', f.paste);
        ribbonFill.setAttribute('stroke', f.dark);
      }

      const tube = mountContainer.querySelector('#bedTube');
      if (tube) {
        const tubeX = Math.round(92 + (pct / 100) * 124);
        const tubeY = pct > 0 && pct < 100 ? 116 : 108;
        tube.setAttribute('transform', `translate(${tubeX}, ${tubeY}) rotate(-34)`);
        tube.classList.toggle('tube-done', pct >= 100);
      }
      const tubeBody = mountContainer.querySelector('#bedTubeBody');
      if (tubeBody) tubeBody.setAttribute('fill', f.paste);
      const tubeStripe = mountContainer.querySelector('#bedTubeStripe');
      if (tubeStripe) tubeStripe.setAttribute('fill', f.stripe);
      const tubeTail = mountContainer.querySelector('#bedTubeTail');
      if (tubeTail) tubeTail.setAttribute('fill', f.dark);
      const tubeDrop = mountContainer.querySelector('#bedTubeDrop');
      if (tubeDrop) {
        tubeDrop.setAttribute('fill', f.paste);
        tubeDrop.setAttribute('stroke', f.dark);
      }
      const tubeIcon = mountContainer.querySelector('#bedTubeIcon');
      if (tubeIcon) tubeIcon.textContent = f.icon;

      const guide = mountContainer.querySelector('#bedPasteGuide');
      if (guide) guide.setAttribute('opacity', pct >= 100 ? '0' : '0.85');

      const meterFill = mountContainer.querySelector('#bedPasteMeterFill');
      if (meterFill) {
        meterFill.style.width = `${Math.round(pct)}%`;
        meterFill.style.background = f.paste;
      }
      const pctLabel = mountContainer.querySelector('#bedPastePctLabel');
      if (pctLabel) pctLabel.textContent = `${Math.round(pct)}%`;
      return;
    }

    if (bedState.scene === 'mouth') {
      bedState.germs.forEach(germ => {
        const gEl = mountContainer.querySelector(`.bed-germ[data-germ-id="${germ.id}"]`);
        if (gEl) {
          const mover = gEl.querySelector('.germ-mover');
          const foamEl = gEl.querySelector('.germ-foam');

          if (germ.defeated) {
            gEl.classList.add('germ-defeated');
          } else {
            gEl.classList.remove('germ-defeated');
            if (mover) {
              const shrink = Math.max(0.45, 1 - (germ.cleanProgress / 100) * 0.45);
              mover.setAttribute('transform', `scale(${shrink.toFixed(2)})`);
            }
          }

          if (foamEl) {
            const showFoam = !bedState.rinsedClean && germ.cleanProgress > 0;
            const foamOp = showFoam ? Math.min(0.96, 0.25 + (germ.cleanProgress / 100) * 0.75) : 0;
            const foamSc = showFoam ? (0.35 + (germ.cleanProgress / 100) * 0.72) : 0.2;
            foamEl.setAttribute('opacity', foamOp.toFixed(2));
            foamEl.setAttribute('transform', `scale(${foamSc.toFixed(2)})`);
          }
        }

        // Permanent bright sparkle on every defeated tooth!
        const sp = mountContainer.querySelector(`#toothSparkle-${germ.toothId}`);
        if (sp) {
          sp.setAttribute('opacity', (germ.defeated || bedState.rinsedClean) ? '1' : '0');
        }
      });

      // After rinse, ALL 8 teeth dazzle bright!
      TEETH.forEach(t => {
        const sp = mountContainer.querySelector(`#toothSparkle-${t.id}`);
        if (sp && bedState.rinsedClean) {
          sp.setAttribute('opacity', '1');
        }
      });

      // Cheerful foam layer during gargle phase (until rinsed clean)
      const mouthFoam = mountContainer.querySelector('#bedMouthFoam');
      if (mouthFoam) {
        const showMouthFoam = bedState.phase === 'gargle' && !bedState.rinsedClean;
        mouthFoam.setAttribute('opacity', showMouthFoam ? '0.94' : '0');
      }

      const gargleFx = mountContainer.querySelector('#bedGargleFx');
      if (gargleFx) {
        gargleFx.setAttribute('opacity', bedState.gargling ? '1' : '0');
        gargleFx.classList.toggle('gargle-active', !!bedState.gargling);
      }

      const eyesNormal = mountContainer.querySelector('#bedMouthEyesNormal');
      const eyesHappy = mountContainer.querySelector('#bedMouthEyesHappy');
      const happyEyes = bedState.rinsedClean || bedState.gargling;
      if (eyesNormal) eyesNormal.style.display = happyEyes ? 'none' : '';
      if (eyesHappy) eyesHappy.style.display = happyEyes ? '' : 'none';

      const mouthHit = mountContainer.querySelector('#bedMouthHit');
      if (mouthHit) {
        mouthHit.style.pointerEvents = (bedState.phase === 'gargle' && !bedState.gargling) ? 'auto' : 'none';
      }

      const countEl = mountContainer.querySelector('#bedProgressCount');
      if (countEl) {
        countEl.textContent = `${countDefeatedGerms()}/${bedState.germs.length}`;
      }
      return;
    }

    if (bedState.scene === 'bedroom') {
      const isNight = !!bedState.lampOff;
      mountContainer.querySelectorAll('.bed-night-layer').forEach(el => {
        el.setAttribute('opacity', isNight ? (el.tagName === 'rect' && el.getAttribute('y') === '216' ? '0.84' : '1') : '0');
      });
      mountContainer.querySelectorAll('.bed-day-layer').forEach(el => {
        el.setAttribute('opacity', isNight ? '0' : '1');
      });
      const winStars = mountContainer.querySelector('.bed-window-stars');
      if (winStars) winStars.setAttribute('opacity', isNight ? '1' : '0.35');
      const nightSparkles = mountContainer.querySelector('.bed-night-sparkles');
      if (nightSparkles) nightSparkles.setAttribute('opacity', isNight ? '1' : '0');

      const lampShade = mountContainer.querySelector('#bedLampShade');
      if (lampShade) lampShade.setAttribute('fill', isNight ? '#4C5696' : '#FFE066');

      // Bedroom chick expression
      mountContainer.querySelectorAll('.bed-chick-expr').forEach(el => {
        el.style.display = el.classList.contains(`expr-${bedState.chickBedroomExpr}`) ? '' : 'none';
      });
      const chickActor = mountContainer.querySelector('#bedChickActor');
      if (chickActor) {
        chickActor.classList.toggle('chick-sleeping', isNight);
      }

      // Plushie slot inside chick's arms
      const plushSlot = mountContainer.querySelector('#bedChickPlushieSlot');
      if (plushSlot) {
        const currentId = plushSlot.dataset.plushieId || '';
        const nextId = bedState.plushie ? bedState.plushie.id : '';
        if (currentId !== nextId) {
          plushSlot.dataset.plushieId = nextId;
          plushSlot.innerHTML = renderBedroomPlushieInline(bedState.plushie);
        }
      }

      // Starry quilt live height
      const quiltEl = mountContainer.querySelector('#bedQuiltOverlay');
      if (quiltEl) {
        const hPct = 15 + (Math.max(0, Math.min(100, bedState.quiltPct)) / 100) * 20.8;
        quiltEl.style.height = `${hPct.toFixed(1)}%`;
        quiltEl.classList.toggle('quilt-tucked-low', bedState.phase === 'plushie');
        quiltEl.classList.toggle('quilt-snug', !!bedState.quiltLocked);
      }
      const quiltHandle = mountContainer.querySelector('#bedQuiltHandle');
      if (quiltHandle) {
        quiltHandle.classList.toggle('visible', bedState.phase === 'quilt' && !bedState.quiltLocked);
      }
      const quiltMeter = mountContainer.querySelector('#bedQuiltMeterFill');
      if (quiltMeter) quiltMeter.style.width = `${Math.round(bedState.quiltPct)}%`;
      const quiltLabel = mountContainer.querySelector('#bedQuiltPctLabel');
      if (quiltLabel) quiltLabel.textContent = `${Math.round(bedState.quiltPct)}%`;

      // Lamp cord stretch sync
      const pull = Math.max(0, Math.min(40, bedState.lampPullPx));
      const cordEndY = 114 + pull;
      const cordLine = mountContainer.querySelector('#bedLampCordLine');
      if (cordLine) {
        cordLine.setAttribute('y2', String(cordEndY));
        cordLine.setAttribute('stroke', isNight ? '#B197FC' : '#D9820B');
      }
      const cordStar = mountContainer.querySelector('#bedLampCordStar');
      if (cordStar) {
        cordStar.setAttribute('transform', `translate(364, ${cordEndY + 8})`);
      }
      const cordOverlay = mountContainer.querySelector('#bedLampCord');
      if (cordOverlay) {
        cordOverlay.style.setProperty('--cord-pull', `${pull}px`);
        cordOverlay.classList.toggle('cord-active', bedState.phase === 'lamp' && !isNight);
        cordOverlay.classList.toggle('cord-off', isNight);
        const cue = cordOverlay.querySelector('.bed-lamp-cue-badge');
        if (cue) cue.classList.toggle('visible', bedState.phase === 'lamp' && !isNight);
      }

      const zzzLayer = mountContainer.querySelector('#bedZzzLayer');
      if (zzzLayer) zzzLayer.classList.toggle('visible', isNight);
    }
  }

  /* ========================================================================
     Micro-FX Helpers (Stage Toasts, Sparkles, Hearts, Zip Brush Assist)
     ======================================================================== */

  function svgToPercent(svgX, svgY) {
    return {
      leftPct: Math.max(8, Math.min(92, (svgX / SVG_W) * 100)),
      topPct: Math.max(10, Math.min(88, (svgY / SVG_H) * 100))
    };
  }

  function spawnStageToast(text, svgX, svgY, color = '#FF5C9D') {
    if (!mountContainer) return;
    const fx = mountContainer.querySelector('#bedFxLayer');
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

  function spawnStagePop(emoji, svgX, svgY, color = '#FFB703') {
    if (!mountContainer) return;
    const fx = mountContainer.querySelector('#bedFxLayer');
    if (!fx) return;
    const { leftPct, topPct } = svgToPercent(svgX, svgY);
    const el = document.createElement('span');
    el.className = 'bath-sparkle-pop';
    el.textContent = emoji;
    el.style.left = `${leftPct}%`;
    el.style.top = `${topPct}%`;
    el.style.color = color;
    fx.appendChild(el);
    schedule(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 700);
  }

  function showBriefZipBrush(germ) {
    if (!mountContainer || !germ) return;
    const fx = mountContainer.querySelector('#bedFxLayer');
    if (!fx) return;
    const { leftPct, topPct } = svgToPercent(germ.x + 14, germ.y);
    const el = document.createElement('div');
    el.className = 'bath-zip-tool bed-zip-brush';
    el.style.left = `${leftPct}%`;
    el.style.top = `${topPct}%`;
    el.innerHTML = renderLoadedToothbrushSVG(getFlavor(), 58);
    fx.appendChild(el);
    schedule(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 360);
  }

  /* ========================================================================
     Step 1 Mechanics: Flavor Selection & Toothpaste Squeeze (0% -> 100%)
     ======================================================================== */

  function selectFlavor(flavorId) {
    if (!bedState || bedState.phase !== 'paste' || bedState.pasteLocked) return false;
    const f = FLAVOR_BY_ID[flavorId];
    if (!f) return false;
    bedState.flavor = f;
    if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.pop) {
      HMC.audio.SFX.pop();
    }
    syncSceneVisuals();
    updateStepsAndDockUI();
    spawnStageToast(`${f.icon} ${f.zh}！`, 210, 88, f.dark);
    return true;
  }

  function squeezePaste(deltaPct, opts = {}) {
    if (!bedState || bedState.phase !== 'paste' || bedState.pasteLocked) return false;
    const gain = Math.max(0, Number(deltaPct) || 0);
    if (gain <= 0) return false;

    const prev = bedState.pastePct;
    bedState.pastePct = Math.min(100, prev + gain);
    const f = getFlavor();

    const now = Date.now();
    if (opts.forceSfx || now - lastBubbleSfxTs > 180) {
      lastBubbleSfxTs = now;
      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.bubble) {
        HMC.audio.SFX.bubble();
      }
    }

    if (now - lastFoamFxTs > 220) {
      lastFoamFxTs = now;
      const fxX = 94 + (bedState.pastePct / 100) * 120;
      spawnStagePop('✨', fxX, 126, f.paste);
    }

    syncSceneVisuals();

    if (bedState.pastePct >= 100) {
      completePasteStep(opts);
    }
    return true;
  }

  function completePasteStep(opts = {}) {
    if (!bedState || bedState.phase !== 'paste' || bedState.pasteLocked) return;
    stopActiveDrag();
    bedState.pastePct = 100;
    bedState.pasteLocked = true;
    syncSceneVisuals();

    const f = getFlavor();
    if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.success) {
      HMC.audio.SFX.success();
    }
    spawnStageToast('✨ 牙膏挤好啦！', 180, 96, f.dark);
    if (HMC.audio && HMC.audio.setPrompt) {
      HMC.audio.setPrompt(
        '牙膏挤好啦！张大嘴巴，打跑蛀牙小怪兽！',
        'Toothpaste ready! Open wide and brush away the sugar bugs!'
      );
    }

    const enterBrush = () => {
      if (!bedState || bedState.phase !== 'paste') return;
      bedState.phase = 'brush';
      bedState.scene = 'mouth';
      syncHabitStepIndex();
      mountCurrentScene();
      updateStepsAndDockUI();
    };

    if (opts.instant) {
      enterBrush();
    } else if (HMC.audio && typeof HMC.audio.waitForSpeechThen === 'function') {
      const token = mountToken;
      HMC.audio.waitForSpeechThen(
        800,
        enterBrush,
        () => token === mountToken && bedState && bedState.phase === 'paste',
        6000
      );
    } else {
      schedule(enterBrush, 800);
    }
  }

  /* ========================================================================
     Step 2 Mechanics: Brush 6 Candy/Germ Monsters + Mini-Step 2b Gargle
     ======================================================================== */

  function defeatGerm(germ) {
    if (!germ || germ.defeated) return;
    germ.cleanProgress = 100;
    germ.defeated = true;

    if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.pop) {
      HMC.audio.SFX.pop();
    }
    if (mountContainer) {
      const gEl = mountContainer.querySelector(`.bed-germ[data-germ-id="${germ.id}"]`);
      if (gEl) gEl.classList.add('germ-fly-off');
    }
    spawnStagePop('✨', germ.x, germ.y, '#FFB703');
    spawnStageToast(germ.quote, germ.x, Math.max(30, germ.y - 22), germ.dark);
  }

  function brushAtSvgPoint(svgX, svgY, deltaDist = 18, hitRadiusSvg = 40, opts = {}) {
    if (!bedState || bedState.phase !== 'brush') return false;
    const gain = Math.max(5, Math.min(58, deltaDist)) * 1.45;
    let touchedAny = false;
    const f = getFlavor();

    bedState.germs.forEach(germ => {
      if (germ.defeated) return;
      const d = Math.hypot(germ.x - svgX, germ.y - svgY);
      if (d <= hitRadiusSvg) {
        touchedAny = true;
        germ.cleanProgress = Math.min(100, germ.cleanProgress + gain);
        if (germ.cleanProgress >= 100) {
          defeatGerm(germ);
        }
      }
    });

    if (!touchedAny) return false;

    const now = Date.now();
    if (now - lastBrushSfxTs > 220) {
      lastBrushSfxTs = now;
      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.brush) {
        HMC.audio.SFX.brush();
      }
    }
    if (now - lastFoamFxTs > 190) {
      lastFoamFxTs = now;
      spawnStagePop('🫧', svgX + (Math.random() * 20 - 10), svgY - 8, f.paste);
    }

    syncSceneVisuals();

    if (bedState.germs.every(g => g.defeated)) {
      enterGargleSubStep(opts);
    }
    return true;
  }

  function tapGermAssist(germId, opts = {}) {
    if (!bedState || bedState.phase !== 'brush') return false;
    const germ = bedState.germs.find(g => g.id === germId);
    if (!germ || germ.defeated) return false;

    germ.cleanProgress = Math.min(100, germ.cleanProgress + 45);
    showBriefZipBrush(germ);
    if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.brush) {
      HMC.audio.SFX.brush();
    }
    spawnStagePop('🫧', germ.x, germ.y - 10, getFlavor().paste);

    if (germ.cleanProgress >= 100) {
      defeatGerm(germ);
    }
    syncSceneVisuals();

    if (bedState.germs.every(g => g.defeated)) {
      enterGargleSubStep(opts);
    }
    return true;
  }

  function enterGargleSubStep(opts = {}) {
    if (!bedState || bedState.phase !== 'brush' || bedState.brushLocked) return;
    bedState.brushLocked = true;
    stopActiveDrag();

    if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.success) {
      HMC.audio.SFX.success();
    }
    spawnStageToast('🎉 怪兽全打跑啦！', 210, 56, '#2B8A3E');

    const switchToGargle = () => {
      if (!bedState || bedState.phase !== 'brush') return;
      bedState.phase = 'gargle';
      syncHabitStepIndex();
      syncSceneVisuals();
      updateStepsAndDockUI();
      if (HMC.audio && HMC.audio.setPrompt) {
        HMC.audio.setPrompt(
          '蛀牙怪兽全跑啦！拖起小水杯帮小鸡咕噜咕噜漱口吧！',
          'All sugar bugs are gone! Drag the water cup to rinse clean!'
        );
      }
    };

    if (opts.instant) {
      switchToGargle();
    } else if (HMC.audio && typeof HMC.audio.waitForSpeechThen === 'function') {
      const token = mountToken;
      HMC.audio.waitForSpeechThen(
        700,
        switchToGargle,
        () => token === mountToken && bedState && bedState.phase === 'brush',
        6000
      );
    } else {
      schedule(switchToGargle, 700);
    }
  }

  function triggerGargle(opts = {}) {
    if (!bedState || bedState.phase !== 'gargle' || bedState.gargling) return false;
    stopActiveDrag();

    bedState.gargling = true;
    syncSceneVisuals();
    updateStepsAndDockUI();

    if (HMC.audio && HMC.audio.SFX && typeof HMC.audio.SFX.gargle === 'function') {
      HMC.audio.SFX.gargle();
    }
    spawnStageToast('咕噜咕噜～噗！', 210, 58, '#1C7ED6');
    spawnStagePop('💦', 148, 134, '#38B6FF');
    spawnStagePop('💦', 272, 134, '#38B6FF');
    spawnStagePop('✨', 210, 148, '#FFD43B');

    const finishRinse = () => {
      if (!bedState || bedState.phase !== 'gargle') return;
      bedState.gargling = false;
      bedState.rinsedClean = true;
      syncSceneVisuals();
      updateStepsAndDockUI();

      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.magic) {
        HMC.audio.SFX.magic();
      }
      spawnStageToast('✨ 牙齿亮晶晶！', 210, 56, '#F59F00');
      TEETH.forEach((t, idx) => {
        schedule(() => spawnStagePop('✨', t.x, t.y, '#FFD43B'), idx * 55);
      });

      const enterBedroom = () => {
        if (!bedState || bedState.phase !== 'gargle') return;
        bedState.phase = 'plushie';
        bedState.scene = 'bedroom';
        bedState.chickBedroomExpr = 'happy';
        syncHabitStepIndex();
        mountCurrentScene();
        updateStepsAndDockUI();
        if (HMC.audio && HMC.audio.setPrompt) {
          HMC.audio.setPrompt(
            '牙齿亮晶晶真棒！挑一个陪睡小伙伴抱进怀里吧！',
            'Sparkling clean teeth! Pick a bedtime buddy to cuddle!'
          );
        }
      };

      if (opts.instant) {
        enterBedroom();
      } else if (HMC.audio && typeof HMC.audio.waitForSpeechThen === 'function') {
        const token = mountToken;
        HMC.audio.waitForSpeechThen(
          900,
          enterBedroom,
          () => token === mountToken && bedState && bedState.phase === 'gargle',
          6000
        );
      } else {
        schedule(enterBedroom, 900);
      }
    };

    if (opts.instant) {
      finishRinse();
    } else {
      schedule(finishRinse, 620);
    }
    return true;
  }

  /* ========================================================================
     Step 3 Mechanics: Plushie Buddy + Vertical Upward Starry Quilt Pull
     ======================================================================== */

  function selectPlushie(plushieId, opts = {}) {
    if (!bedState || bedState.phase !== 'plushie' || bedState.plushieLocked) return false;
    const p = PLUSHIE_BY_ID[plushieId];
    if (!p) return false;

    stopActiveDrag();
    bedState.plushieLocked = true;
    bedState.plushie = p;
    syncSceneVisuals();

    if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.pop) {
      HMC.audio.SFX.pop();
    }

    spawnStagePop('💖', 208, 108, '#FF6B9D');
    spawnStagePop('✨', 252, 118, '#FFD43B');
    spawnStageToast(`💖 有${p.zh}陪着真好！`, 214, 72, '#D6336C');

    if (HMC.audio && HMC.audio.setPrompt) {
      HMC.audio.setPrompt(
        `有${p.zh}陪着，好安心呀！现在抓住被角往上拉，帮小鸡盖好被子吧！`,
        `So cozy with ${p.en}! Pull the starry blanket up!`,
        true,
        { voiceStyle: 'bedtime' }
      );
    }

    const enterQuilt = () => {
      if (!bedState || bedState.phase !== 'plushie') return;
      bedState.phase = 'quilt';
      syncHabitStepIndex();
      syncSceneVisuals();
      updateStepsAndDockUI();
    };

    if (opts.instant) {
      enterQuilt();
    } else if (HMC.audio && typeof HMC.audio.waitForSpeechThen === 'function') {
      const token = mountToken;
      HMC.audio.waitForSpeechThen(
        750,
        enterQuilt,
        () => token === mountToken && bedState && bedState.phase === 'plushie',
        6000
      );
    } else {
      schedule(enterQuilt, 750);
    }
    return true;
  }

  function setQuiltPct(pct, opts = {}) {
    if (!bedState || bedState.phase !== 'quilt' || bedState.quiltLocked) return false;
    const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
    const prev = bedState.quiltPct;
    bedState.quiltPct = clamped;

    const now = Date.now();
    if (clamped > prev + 3 && now - lastQuiltSfxTs > 280) {
      lastQuiltSfxTs = now;
      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.pop) {
        HMC.audio.SFX.pop();
      }
    }

    syncSceneVisuals();

    if (bedState.quiltPct >= 78) {
      completeQuiltPull(opts);
    }
    return true;
  }

  function pullQuiltStep(deltaPct = 40, opts = {}) {
    if (!bedState || bedState.phase !== 'quilt' || bedState.quiltLocked) return false;
    const next = Math.min(100, bedState.quiltPct + deltaPct);
    if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.pop) {
      HMC.audio.SFX.pop();
    }
    spawnStagePop('✨', 198, 174 - (next / 100) * 28, '#FF85C0');
    return setQuiltPct(next, opts);
  }

  function completeQuiltPull(opts = {}) {
    if (!bedState || bedState.phase !== 'quilt' || bedState.quiltLocked) return;
    stopActiveDrag();

    bedState.quiltPct = 100;
    bedState.quiltLocked = true;
    bedState.chickBedroomExpr = 'yawn';
    syncSceneVisuals();

    if (HMC.audio && HMC.audio.SFX && typeof HMC.audio.SFX.yawn === 'function') {
      HMC.audio.SFX.yawn();
    }
    spawnStageToast('啊～暖暖的小被子真舒服！', 198, 72, '#D6336C');
    spawnStagePop('💛', 184, 98, '#FFD43B');

    if (HMC.audio && HMC.audio.setPrompt) {
      HMC.audio.setPrompt(
        '啊～暖暖的小被子真舒服！最后往下拉一下灯绳关灯吧！',
        'Yawn~ So warm and cozy! Pull the star cord down to turn off the light!',
        true,
        { voiceStyle: 'bedtime' }
      );
    }

    const enterLamp = () => {
      if (!bedState || bedState.phase !== 'quilt') return;
      bedState.phase = 'lamp';
      syncHabitStepIndex();
      syncSceneVisuals();
      updateStepsAndDockUI();
    };

    if (opts.instant) {
      enterLamp();
    } else if (HMC.audio && typeof HMC.audio.waitForSpeechThen === 'function') {
      const token = mountToken;
      HMC.audio.waitForSpeechThen(
        800,
        enterLamp,
        () => token === mountToken && bedState && bedState.phase === 'quilt',
        6000
      );
    } else {
      schedule(enterLamp, 800);
    }
  }

  /* ========================================================================
     Step 4 Mechanics: Downward Star Lamp Pull-Cord -> Starry Midnight Lullaby
     ======================================================================== */

  function setLampPullPx(px) {
    if (!bedState || bedState.phase !== 'lamp' || bedState.lampOff) return false;
    const clamped = Math.max(0, Math.min(40, Number(px) || 0));
    bedState.lampPullPx = clamped;

    const now = Date.now();
    if (clamped >= 10 && now - lastCordTickTs > 320) {
      lastCordTickTs = now;
      spawnStagePop('⭐', 364, 122 + clamped, '#FFD43B');
    }

    syncSceneVisuals();

    if (clamped >= 22) {
      pullLampOff();
    }
    return true;
  }

  function pullLampOff() {
    if (!bedState || bedState.phase !== 'lamp' || bedState.lampOff || bedState.completed) return false;
    stopActiveDrag();

    bedState.lampPullPx = 0;
    bedState.lampOff = true;
    bedState.chickBedroomExpr = 'sleep';
    bedState.phase = 'done';
    bedState.completed = true;
    syncHabitStepIndex();
    syncSceneVisuals();
    updateStepsAndDockUI();

    if (HMC.audio && HMC.audio.SFX && typeof HMC.audio.SFX.clickSwitch === 'function') {
      HMC.audio.SFX.clickSwitch();
    }
    spawnStageToast('咔哒！晚安好梦 🌙', 226, 68, '#FFE066');
    spawnStagePop('🌙', 364, 96, '#FFE066');
    spawnStagePop('⭐', 184, 76, '#FFE066');

    schedule(() => {
      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.lullaby) {
        HMC.audio.SFX.lullaby();
      }
    }, 180);

    if (HMC.effects && HMC.effects.burstConfetti) {
      HMC.effects.burstConfetti(36);
    }
    const isParty = (HMC.effects && HMC.effects.awardStar) ? HMC.effects.awardStar() : false;
    if (HMC.storage && HMC.storage.recordAttempt) {
      HMC.storage.recordAttempt('play_habits', true);
    }
    const praiseZh = '刷完牙盖好被子关上灯，晚安好梦哟！';
    const praiseEn = 'Sparkling teeth, cozy blanket, lights out — sweet dreams!';
    if (isParty && HMC.audio && HMC.audio.setPrompt) {
      HMC.audio.setPrompt(praiseZh, praiseEn, false, { voiceStyle: 'bedtime' });
    } else if (HMC.audio && HMC.audio.praiseWithPrompt) {
      HMC.audio.praiseWithPrompt(praiseZh, praiseEn, { voiceStyle: 'bedtime' });
    }
    return true;
  }

  /* ========================================================================
     Unified Pointer Events Engine (Zero Leaks, Touch Offset, Generous Radius)
     ======================================================================== */

  function getDragCursorEl() {
    return mountContainer ? mountContainer.querySelector('#bedDragCursor') : null;
  }

  function screenToCanvasSvg(clientX, clientY) {
    if (!mountContainer) return null;
    const canvas = mountContainer.querySelector('#bedCanvas');
    if (!canvas || typeof canvas.getBoundingClientRect !== 'function') return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;

    const touchOffsetY = dragPointerType === 'touch' ? -28 : 0;
    const tipX = clientX;
    const tipY = clientY + touchOffsetY;

    const svgX = ((tipX - rect.left) / rect.width) * SVG_W;
    const svgY = ((tipY - rect.top) / rect.height) * SVG_H;
    const inside = svgX >= -24 && svgX <= SVG_W + 24 && svgY >= -24 && svgY <= SVG_H + 24;
    const hitRadiusSvg = Math.max(38, 38 * (SVG_W / rect.width));

    return { svgX, svgY, rect, inside, hitRadiusSvg, scaleX: SVG_W / rect.width, scaleY: SVG_H / rect.height };
  }

  function renderDragCursorContent(kind, payload) {
    const cursor = getDragCursorEl();
    if (!cursor) return;
    cursor.className = `bath-drag-cursor bed-drag-cursor visible tool-${kind}`;
    if (kind === 'tube') {
      cursor.innerHTML = `<div class="bath-cursor-tool">${renderTubeSVG(getFlavor(), 64)}</div>`;
    } else if (kind === 'toothbrush') {
      cursor.innerHTML = `<div class="bath-cursor-tool">${renderLoadedToothbrushSVG(getFlavor(), 78)}</div>`;
    } else if (kind === 'cup') {
      cursor.innerHTML = `<div class="bath-cursor-tool">${renderWaterCupSVG(62)}</div>`;
    } else if (kind === 'plushie') {
      const p = PLUSHIE_BY_ID[payload && payload.plushieId] || PLUSHIES[0];
      cursor.innerHTML = `<div class="bath-cursor-tool">${renderPlushieSVG(p, 68)}</div>`;
    }
  }

  function updateDragCursorPos(clientX, clientY, activeEffect = false) {
    const cursor = getDragCursorEl();
    if (!cursor) return;
    const touchOffsetY = dragPointerType === 'touch' ? -28 : 0;
    cursor.style.left = `${clientX}px`;
    cursor.style.top = `${clientY + touchOffsetY}px`;
    cursor.classList.toggle('active-effect', !!activeEffect);
  }

  function onGlobalPointerMove(e) {
    if (!dragActive || !bedState) return;
    if (dragPointerId != null && e.pointerId != null && e.pointerId !== dragPointerId) return;

    const dx = e.clientX - dragLastX;
    const dy = e.clientY - dragLastY;
    const totalMove = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
    const stepPx = Math.hypot(dx, dy);

    if (!dragMoved && totalMove > 10) {
      dragMoved = true;
      if (dragKind === 'toothbrush' && dragPayload && dragPayload.fromStage) {
        renderDragCursorContent('toothbrush');
        const h = mountContainer && mountContainer.querySelector('#bedToolHandle');
        if (h) h.classList.add('is-dragging');
      } else if (dragKind === 'plushie') {
        renderDragCursorContent('plushie', dragPayload);
        const card = mountContainer && mountContainer.querySelector(`.bed-plushie-card[data-plushie-id="${dragPayload.plushieId}"]`);
        if (card) card.classList.add('is-dragging');
      } else if (dragKind === 'tube' && dragPayload && !dragPayload.fromStage) {
        renderDragCursorContent('tube');
        const h = mountContainer && mountContainer.querySelector('#bedToolHandle');
        if (h) h.classList.add('is-dragging');
      }
    }

    dragLastX = e.clientX;
    dragLastY = e.clientY;

    // 1. Step 1: Toothpaste Squeeze Drag
    if (dragKind === 'tube' && bedState.phase === 'paste') {
      const pt = screenToCanvasSvg(e.clientX, e.clientY);
      if (dragPayload && !dragPayload.fromStage && dragMoved) {
        updateDragCursorPos(e.clientX, e.clientY, !!(pt && pt.inside));
      }
      if (pt && pt.inside && stepPx >= 1.5) {
        // Horizontal brushing motion across bristles squeezes paste smoothly!
        const inZone = pt.svgX >= 52 && pt.svgX <= 268 && pt.svgY >= 72 && pt.svgY <= 220;
        if (inZone || (dragPayload && dragPayload.fromStage)) {
          const deltaPct = Math.max(0.8, (stepPx * pt.scaleX) * 0.72);
          squeezePaste(deltaPct);
        }
      }
      return;
    }

    // 2. Step 2a: Toothbrush Scrub Drag
    if (dragKind === 'toothbrush' && bedState.phase === 'brush') {
      if (dragPayload && dragPayload.fromStage && !dragMoved) return;
      const pt = screenToCanvasSvg(e.clientX, e.clientY);
      updateDragCursorPos(e.clientX, e.clientY, !!(pt && pt.inside));
      if (pt && pt.inside && stepPx >= 1.5) {
        brushAtSvgPoint(pt.svgX, pt.svgY, stepPx * pt.scaleX, pt.hitRadiusSvg);
      }
      return;
    }

    // 3. Step 2b: Water Cup Drag onto Mouth
    if (dragKind === 'cup' && bedState.phase === 'gargle') {
      const pt = screenToCanvasSvg(e.clientX, e.clientY);
      const overMouth = !!(pt && pt.svgX >= 70 && pt.svgX <= 350 && pt.svgY >= 52 && pt.svgY <= 248);
      updateDragCursorPos(e.clientX, e.clientY, overMouth);
      if (overMouth && dragMoved) {
        triggerGargle();
      }
      return;
    }

    // 4. Step 3a: Plushie Drag onto Bed
    if (dragKind === 'plushie' && bedState.phase === 'plushie') {
      if (!dragMoved) return;
      const pt = screenToCanvasSvg(e.clientX, e.clientY);
      updateDragCursorPos(e.clientX, e.clientY, !!(pt && pt.inside));
      return;
    }

    // 5. Step 3b: Vertical UPWARD Starry Quilt Drag
    if (dragKind === 'quilt' && bedState.phase === 'quilt') {
      const canvas = mountContainer && mountContainer.querySelector('#bedCanvas');
      const rect = canvas && canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
      const pullSpanPx = Math.max(58, rect && rect.height ? rect.height * 0.34 : 88);
      const upwardPx = dragStartY - e.clientY;
      if (upwardPx > 4) {
        dragMoved = true;
        const startPct = (dragPayload && dragPayload.startPct) || 0;
        const nextPct = Math.max(startPct, Math.min(100, startPct + (upwardPx / pullSpanPx) * 100));
        setQuiltPct(nextPct);
      }
      return;
    }

    // 6. Step 4: Vertical DOWNWARD Star Lamp Pull-Cord Stretch
    if (dragKind === 'lamp' && bedState.phase === 'lamp') {
      const downwardPx = Math.max(0, e.clientY - dragStartY);
      if (downwardPx > 4) {
        dragMoved = true;
        setLampPullPx(downwardPx);
      }
      return;
    }
  }

  function onGlobalPointerUp(e) {
    if (!dragActive) return;
    if (dragPointerId != null && e && e.pointerId != null && e.pointerId !== dragPointerId) return;

    const kind = dragKind;
    const moved = dragMoved;
    const payload = dragPayload;
    const upX = e ? e.clientX : dragLastX;
    const upY = e ? e.clientY : dragLastY;

    stopActiveDrag();

    if (!bedState) return;

    // Step 1: Tap assist on tube/bristles/handle (+35% per tap!)
    if (kind === 'tube' && bedState.phase === 'paste' && !moved) {
      squeezePaste(35, { forceSfx: true });
      return;
    }

    // Step 2a: Tap assist directly on a germy tooth (+45%!)
    if (kind === 'toothbrush' && bedState.phase === 'brush' && !moved && payload && payload.germId) {
      tapGermAssist(payload.germId);
      return;
    }

    // Step 2b: Tap assist on cup handle triggers gargle directly for young toddlers!
    if (kind === 'cup' && bedState.phase === 'gargle' && !moved) {
      triggerGargle();
      return;
    }

    // Step 3a: Tap OR Drop Plushie onto bed places it warmly into chick's arms!
    if (kind === 'plushie' && bedState.phase === 'plushie' && payload && payload.plushieId) {
      if (!moved) {
        selectPlushie(payload.plushieId);
      } else {
        const pt = screenToCanvasSvg(upX, upY);
        if (pt && pt.inside) {
          selectPlushie(payload.plushieId);
        } else if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.boing) {
          HMC.audio.SFX.boing();
        }
      }
      return;
    }

    // Step 3b: Tap assist on quilt handle/overlay smoothly pulls quilt up by +40%!
    if (kind === 'quilt' && bedState.phase === 'quilt' && !moved) {
      pullQuiltStep(40);
      return;
    }

    // Step 4: Tap assist on lamp cord OR snap back if released before 22px pull threshold
    if (kind === 'lamp' && bedState.phase === 'lamp' && !bedState.lampOff) {
      if (!moved) {
        pullLampOff();
      } else {
        // Gentle spring back if not pulled all the way down yet
        bedState.lampPullPx = 0;
        syncSceneVisuals();
      }
    }
  }

  function startActiveDrag(kind, e, payload = {}) {
    if (!bedState || !mountContainer) return;
    stopActiveDrag();

    dragActive = true;
    dragKind = kind;
    dragPointerId = e && e.pointerId != null ? e.pointerId : null;
    dragPointerType = (e && e.pointerType) || 'mouse';
    dragStartX = e ? e.clientX : 0;
    dragStartY = e ? e.clientY : 0;
    dragLastX = dragStartX;
    dragLastY = dragStartY;
    dragMoved = false;
    dragPayload = payload || {};
    dragCaptureEl = (e && e.currentTarget) || null;

    if (dragCaptureEl && dragCaptureEl.setPointerCapture && dragPointerId != null) {
      try { dragCaptureEl.setPointerCapture(dragPointerId); } catch (err) {}
    }

    // Immediate floating cursor for dock-originated toothbrush & cup drags
    if ((kind === 'toothbrush' && !dragPayload.fromStage) || kind === 'cup') {
      const h = mountContainer.querySelector('#bedToolHandle');
      if (h) h.classList.add('is-dragging');
      renderDragCursorContent(kind, dragPayload);
      const pt = screenToCanvasSvg(dragStartX, dragStartY);
      updateDragCursorPos(dragStartX, dragStartY, !!(pt && pt.inside));
      if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.pop) {
        HMC.audio.SFX.pop();
      }
    }

    window.addEventListener('pointermove', onGlobalPointerMove, { passive: true });
    window.addEventListener('pointerup', onGlobalPointerUp);
    window.addEventListener('pointercancel', onGlobalPointerUp);
  }

  function stopActiveDrag() {
    if (!dragActive && rafId === null) return;
    const prevPtrId = dragPointerId;
    const prevCaptureEl = dragCaptureEl;

    dragActive = false;
    dragKind = null;
    dragPointerId = null;
    dragMoved = false;
    dragPayload = null;
    dragCaptureEl = null;

    if (rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    window.removeEventListener('pointermove', onGlobalPointerMove);
    window.removeEventListener('pointerup', onGlobalPointerUp);
    window.removeEventListener('pointercancel', onGlobalPointerUp);

    if (prevCaptureEl && prevPtrId != null && prevCaptureEl.releasePointerCapture) {
      try { prevCaptureEl.releasePointerCapture(prevPtrId); } catch (err) {}
    }

    if (mountContainer) {
      const handle = mountContainer.querySelector('#bedToolHandle');
      if (handle) handle.classList.remove('is-dragging');
      mountContainer.querySelectorAll('.bed-plushie-card.is-dragging').forEach(c => {
        c.classList.remove('is-dragging');
      });
      const cursor = getDragCursorEl();
      if (cursor) {
        cursor.className = 'bath-drag-cursor bed-drag-cursor';
        cursor.innerHTML = '';
      }
    }
  }

  /* ========================================================================
     DOM Event Binding (Shell, Scene & Dock)
     ======================================================================== */

  function bindCanvasSceneEvents() {
    if (!mountContainer || !bedState) return;

    // Scene 1: Paste (drag tube or bristles, or tap for +35% assist!)
    if (bedState.scene === 'paste') {
      const tube = mountContainer.querySelector('#bedTube');
      const bristles = mountContainer.querySelector('#bedBristlesHit');
      [tube, bristles].forEach(el => {
        if (!el) return;
        let lastPtrTs = 0;
        el.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          if (typeof e.preventDefault === 'function') e.preventDefault();
          lastPtrTs = Date.now();
          startActiveDrag('tube', e, { fromStage: true });
        });
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (Date.now() - lastPtrTs < 380) return;
          squeezePaste(35, { forceSfx: true });
        });
      });
      return;
    }

    // Scene 2: Giant Open Mouth (scrub/tap 6 germs + tap mouth for gargle assist!)
    if (bedState.scene === 'mouth') {
      mountContainer.querySelectorAll('.bed-germ').forEach(germEl => {
        let lastPtrTs = 0;
        germEl.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          if (typeof e.preventDefault === 'function') e.preventDefault();
          lastPtrTs = Date.now();
          const germId = germEl.dataset.germId;
          if (!bedState) return;
          if (bedState.phase === 'brush') {
            startActiveDrag('toothbrush', e, { fromStage: true, germId });
          } else if (bedState.phase === 'gargle') {
            triggerGargle();
          }
        });
        germEl.addEventListener('click', (e) => {
          e.stopPropagation();
          if (Date.now() - lastPtrTs < 380) return;
          const germId = germEl.dataset.germId;
          if (!bedState) return;
          if (bedState.phase === 'brush') tapGermAssist(germId);
          else if (bedState.phase === 'gargle') triggerGargle();
        });
      });

      const mouthHit = mountContainer.querySelector('#bedMouthHit');
      if (mouthHit) {
        let lastMouthPtrTs = 0;
        mouthHit.addEventListener('pointerdown', (e) => {
          if (!bedState || bedState.phase !== 'gargle') return;
          e.stopPropagation();
          if (typeof e.preventDefault === 'function') e.preventDefault();
          lastMouthPtrTs = Date.now();
          triggerGargle();
        });
        mouthHit.addEventListener('click', (e) => {
          if (!bedState || bedState.phase !== 'gargle') return;
          e.stopPropagation();
          if (Date.now() - lastMouthPtrTs < 380) return;
          triggerGargle();
        });
      }
      return;
    }

    // Scene 3: Bedroom (vertical quilt drag + downward lamp pull-cord!)
    if (bedState.scene === 'bedroom') {
      const quiltOverlay = mountContainer.querySelector('#bedQuiltOverlay');
      const quiltHandle = mountContainer.querySelector('#bedQuiltHandle');
      let lastQuiltPtrTs = 0;
      const onQuiltDown = (e) => {
        if (!bedState || bedState.phase !== 'quilt' || bedState.quiltLocked) return;
        e.stopPropagation();
        if (typeof e.preventDefault === 'function') e.preventDefault();
        lastQuiltPtrTs = Date.now();
        startActiveDrag('quilt', e, { startPct: bedState.quiltPct });
      };
      if (quiltHandle) {
        quiltHandle.addEventListener('pointerdown', onQuiltDown);
        quiltHandle.addEventListener('click', (e) => {
          e.stopPropagation();
          if (Date.now() - lastQuiltPtrTs < 380) return;
          pullQuiltStep(40);
        });
      }
      if (quiltOverlay) {
        quiltOverlay.addEventListener('pointerdown', onQuiltDown);
        quiltOverlay.addEventListener('click', (e) => {
          if (!bedState || bedState.phase !== 'quilt' || bedState.quiltLocked) return;
          e.stopPropagation();
          if (Date.now() - lastQuiltPtrTs < 380) return;
          pullQuiltStep(40);
        });
      }

      const lampCord = mountContainer.querySelector('#bedLampCord');
      if (lampCord) {
        let lastLampPtrTs = 0;
        lampCord.addEventListener('pointerdown', (e) => {
          if (!bedState || bedState.phase !== 'lamp' || bedState.lampOff) return;
          e.stopPropagation();
          if (typeof e.preventDefault === 'function') e.preventDefault();
          lastLampPtrTs = Date.now();
          startActiveDrag('lamp', e, {});
        });
        lampCord.addEventListener('click', (e) => {
          if (!bedState || bedState.phase !== 'lamp' || bedState.lampOff) return;
          e.stopPropagation();
          if (Date.now() - lastLampPtrTs < 380) return;
          pullLampOff();
        });
        lampCord.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            pullLampOff();
          }
        });
      }
    }
  }

  function bindDockEvents() {
    if (!mountContainer || !bedState) return;

    // Step 1: 3 Toothpaste flavors
    mountContainer.querySelectorAll('.bed-flavor-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectFlavor(btn.dataset.flavorId);
      });
    });

    // Step 1 / 2a / 2b: Draggable tool handle (#bedToolHandle)
    const handle = mountContainer.querySelector('#bedToolHandle');
    if (handle) {
      let lastHandlePtrTs = 0;
      handle.addEventListener('pointerdown', (e) => {
        if (!bedState || bedState.gargling) return;
        e.stopPropagation();
        if (typeof e.preventDefault === 'function') e.preventDefault();
        lastHandlePtrTs = Date.now();
        const tool = handle.dataset.tool;
        if (tool) startActiveDrag(tool, e, { fromStage: false });
      });
      handle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (Date.now() - lastHandlePtrTs < 380) return;
        if (bedState.phase === 'paste') squeezePaste(35, { forceSfx: true });
        else if (bedState.phase === 'gargle') triggerGargle();
      });
    }

    // Step 3a: 3 Bedtime Plushie cards (supports BOTH Drag-onto-Bed AND Tap!)
    mountContainer.querySelectorAll('.bed-plushie-card').forEach(card => {
      let lastCardPtrTs = 0;
      card.addEventListener('pointerdown', (e) => {
        if (!bedState || bedState.phase !== 'plushie') return;
        e.stopPropagation();
        if (typeof e.preventDefault === 'function') e.preventDefault();
        lastCardPtrTs = Date.now();
        startActiveDrag('plushie', e, { plushieId: card.dataset.plushieId });
      });
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        if (Date.now() - lastCardPtrTs < 380) return;
        selectPlushie(card.dataset.plushieId);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectPlushie(card.dataset.plushieId);
        }
      });
    });

    // Step 3b: Dock tap-assist button for pulling starry quilt up
    const quiltAssistBtn = mountContainer.querySelector('#bedQuiltAssistBtn');
    if (quiltAssistBtn) {
      quiltAssistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pullQuiltStep(40);
      });
    }

    // Step 4: Dock tap-assist button for pulling star lamp cord down
    const lampAssistBtn = mountContainer.querySelector('#bedLampAssistBtn');
    if (lampAssistBtn) {
      lampAssistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pullLampOff();
      });
    }

    // Done celebration actions
    const replayBtn = mountContainer.querySelector('#bedReplayBtn');
    if (replayBtn) {
      replayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (HMC.audio && HMC.audio.SFX && HMC.audio.SFX.pop) HMC.audio.SFX.pop();
        reset();
      });
    }

    const toBathBtn = mountContainer.querySelector('#bedToBathBtn');
    if (toBathBtn) {
      toBathBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof mountOpts.onSwitchStory === 'function') {
          mountOpts.onSwitchStory('bath');
        }
      });
    }
  }

  function bindShellEvents() {
    if (!mountContainer) return;
    mountContainer.querySelectorAll('.habit-tab-btn').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetStory = tab.dataset.story;
        if (targetStory === 'bedtime') {
          if (bedState && bedState.phase === 'done') {
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
  }

  function renderFullShell() {
    if (!mountContainer || !bedState) return;
    mountContainer.innerHTML = `
      <div class="bath-stage bed-stage" id="bedStage">
        <div class="bath-top-row bed-top-row">
          <div class="habit-tabs" id="habitTabs">
            <button class="habit-tab-btn" data-story="bath" type="button">🛁 洗泡泡澡</button>
            <button class="habit-tab-btn active" data-story="bedtime" type="button">🪥 刷牙盖被子</button>
          </div>
          <div class="bath-steps-bar bed-steps-bar" id="bedStepsBar" aria-label="睡前好习惯进度">
            ${renderStepsBarHTML()}
          </div>
        </div>

        <div class="bath-workspace bed-workspace">
          <div class="habit-interactive-stage">
            <div class="bath-canvas bed-canvas" id="bedCanvas"></div>
          </div>

          <div class="habit-tool-dock bed-tool-dock" id="bedToolDock">
            ${renderToolDockHTML()}
          </div>
        </div>

        <div class="bath-drag-cursor bed-drag-cursor" id="bedDragCursor" aria-hidden="true"></div>
      </div>
    `;

    bindShellEvents();
    mountCurrentScene();
    bindDockEvents();
  }

  /* ========================================================================
     Public Lifecycle API (mount / unmount / reset / getState)
     ======================================================================== */

  function mount(containerEl, opts = {}) {
    unmount();
    if (!containerEl) return;

    mountToken++;
    mountContainer = containerEl;
    mountOpts = opts || {};
    bedState = createFreshState();
    lastBubbleSfxTs = 0;
    lastBrushSfxTs = 0;
    lastFoamFxTs = 0;
    lastQuiltSfxTs = 0;
    lastCordTickTs = 0;
    syncHabitStepIndex();

    renderFullShell();

    if (opts.isFresh !== false && HMC.audio && HMC.audio.setPrompt) {
      HMC.audio.setPrompt(
        '选一个喜欢的牙膏口味，帮小鸡把牙膏挤到牙刷上吧！',
        'Pick a yummy toothpaste flavor and squeeze it onto the toothbrush!'
      );
    }
  }

  function unmount() {
    mountToken++;
    stopActiveDrag();
    clearAllTimers();
    if (HMC.audio && typeof HMC.audio.cancelPendingTransitions === 'function') {
      HMC.audio.cancelPendingTransitions();
    }
    mountContainer = null;
    mountOpts = {};
  }

  function reset() {
    if (!mountContainer) {
      bedState = createFreshState();
      return;
    }
    const prevContainer = mountContainer;
    const prevOpts = Object.assign({}, mountOpts, { isFresh: true });
    mount(prevContainer, prevOpts);
  }

  function getState() {
    return bedState;
  }

  HMC.habits = HMC.habits || {};
  HMC.habits.bedtime = {
    STEPS,
    FLAVORS,
    FLAVOR_BY_ID,
    TEETH,
    GERMS,
    PLUSHIES,
    PLUSHIE_BY_ID,
    mount,
    unmount,
    reset,
    getState,
    // Direct interaction APIs (used by DOM handlers & automated verification)
    selectFlavor,
    squeezePaste,
    completePasteStep,
    brushAtSvgPoint,
    tapGermAssist,
    enterGargleSubStep,
    triggerGargle,
    selectPlushie,
    setQuiltPct,
    pullQuiltStep,
    completeQuiltPull,
    setLampPullPx,
    pullLampOff
  };
})(window.HMC = window.HMC || {});
