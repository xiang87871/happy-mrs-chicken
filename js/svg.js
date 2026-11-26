(function (HMC) {
  'use strict';

  let svgUid = 0;

  function renderChickenSVG(size = 148, sleeping = false, equippedOverride = null) {
    const equippedList = Array.isArray(equippedOverride)
      ? equippedOverride
      : (HMC.storage && HMC.storage.getWardrobe ? HMC.storage.getWardrobe().equipped : ['bow']);

    const bySlot = {};
    const catalog = HMC.data && HMC.data.WARDROBE_BY_ID;
    const legacySlots = {
      bow: 'neck',
      crown: 'head',
      boots: 'feet',
      sunglasses: 'eyes',
      tutu: 'body',
      wings: 'back',
      wand: 'hand'
    };
    equippedList.forEach(id => {
      if (typeof id !== 'string' || !id) return;
      const slot = (catalog && catalog[id] && catalog[id].slot)
        || (HMC.svgWardrobe && HMC.svgWardrobe.getItemSlot && HMC.svgWardrobe.getItemSlot(id))
        || legacySlots[id]
        || ((id.match(/^(head|body|neck|eyes|feet|back|hand)_/) || [])[1]);
      if (slot) bySlot[slot] = id;
    });

    const drawLayer = (slot, id) => {
      if (!id || !HMC.svgWardrobe || typeof HMC.svgWardrobe.renderLayer !== 'function') return '';
      return HMC.svgWardrobe.renderLayer(slot, id, sleeping);
    };

    const backWingsSvg = drawLayer('back', bySlot.back);
    const backCapeSvg = bySlot.neck === 'neck_cape' ? drawLayer('back', 'neck_cape') : '';
    const feetSvg = drawLayer('feet', bySlot.feet);
    const bodySvg = drawLayer('body', bySlot.body);
    const headSvg = drawLayer('head', bySlot.head);
    const eyesSvg = drawLayer('eyes', bySlot.eyes);
    const neckSvg = drawLayer('neck', bySlot.neck);
    const handSvg = drawLayer('hand', bySlot.hand);

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 180 180" fill="none">
        <ellipse class="ground-shadow" cx="90" cy="164" rx="50" ry="11" fill="#4B9A29" opacity="0.28"/>
        ${backWingsSvg}
        ${backCapeSvg}
        <path d="M72 138V158M72 158L60 163M72 158L72 165M72 158L82 162" stroke="#F59F00" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M108 138V158M108 158L98 162M108 158L108 165M108 158L120 163" stroke="#F59F00" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        ${feetSvg}
        <path d="M138 92C158 76 168 88 156 105C168 106 166 122 146 120" fill="#FFD94A" stroke="#4A3728" stroke-width="4.5" stroke-linejoin="round"/>
        <g class="chicken-wing-l">
          <path d="M36 96C18 96 14 118 32 126C40 130 48 122 48 112" fill="#FFE066" stroke="#4A3728" stroke-width="4.5" stroke-linecap="round"/>
        </g>
        <g class="chicken-wing-r">
          <path d="M134 94C152 98 154 120 136 126C126 130 120 120 122 110" fill="#FFE066" stroke="#4A3728" stroke-width="4.5" stroke-linecap="round"/>
        </g>
        <ellipse cx="90" cy="108" rx="54" ry="44" fill="#FFF3B0" stroke="#4A3728" stroke-width="5"/>
        <ellipse cx="86" cy="116" rx="34" ry="24" fill="#FFFBE0" opacity="0.8"/>
        ${bodySvg}
        <circle cx="80" cy="64" r="34" fill="#FFF3B0" stroke="#4A3728" stroke-width="5"/>
        ${sleeping ? `
          <path d="M50 48C56 18 96 14 112 42L128 32C122 50 112 52 106 50Z" fill="#748FFC" stroke="#4A3728" stroke-width="4" stroke-linejoin="round"/>
          <circle cx="131" cy="30" r="8" fill="#FFF7D6" stroke="#4A3728" stroke-width="3.5"/>
          <path d="M47 49Q80 39 113 48" stroke="#FFF7D6" stroke-width="8" stroke-linecap="round"/>
        ` : `
          <path d="M62 34C58 18 72 14 78 24C82 12 97 14 96 28C106 20 115 32 102 40Z" fill="#FF4D5E" stroke="#4A3728" stroke-width="4.2" stroke-linejoin="round"/>
        `}
        ${headSvg}
        ${sleeping ? `
          <path d="M60 63Q67 69 74 63" stroke="#4A3728" stroke-width="4" stroke-linecap="round"/>
          <path d="M88 63Q95 69 102 63" stroke="#4A3728" stroke-width="4" stroke-linecap="round"/>
        ` : `
          <circle cx="66" cy="60" r="7.5" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.2"/>
          <circle cx="67.5" cy="60" r="4" fill="#4A3728"/>
          <circle cx="69" cy="58" r="1.5" fill="#FFFFFF"/>
          <circle cx="94" cy="60" r="7.5" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.2"/>
          <circle cx="92.5" cy="60" r="4" fill="#4A3728"/>
          <circle cx="94" cy="58" r="1.5" fill="#FFFFFF"/>
        `}
        ${eyesSvg}
        <ellipse cx="55" cy="72" rx="7" ry="4.5" fill="#FF94C2" opacity="0.8"/>
        <ellipse cx="105" cy="72" rx="7" ry="4.5" fill="#FF94C2" opacity="0.8"/>
        <path d="M72 68L88 68L80 82Z" fill="#FF922B" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M76 82C74 91 86 91 84 82" fill="#FF4D5E" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
        ${neckSvg}
        ${handSvg}
      </svg>
    `;
  }

  function renderShapePath(shapeId, cx, cy, size, fill, opts = {}) {
    const r = size / 2;
    const stroke = opts.stroke || '#4A3728';
    const sw = opts.strokeWidth || 3.5;
    const dash = opts.dashed ? 'stroke-dasharray="6 4"' : '';
    const rot = opts.rotate ? `transform="rotate(${opts.rotate} ${cx} ${cy})"` : '';
    const attrs = `fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${dash} ${rot}`;

    if (shapeId === 'circle') {
      return `<circle cx="${cx}" cy="${cy}" r="${r}" ${attrs}/>`;
    }
    if (shapeId === 'square') {
      return `<rect x="${cx - r}" y="${cy - r}" width="${size}" height="${size}" rx="5" ${attrs}/>`;
    }
    if (shapeId === 'rectangle') {
      const w = size * 1.24;
      const h = size * 0.72;
      return `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="5" ${attrs}/>`;
    }
    if (shapeId === 'diamond') {
      const pts = `${cx},${cy - r * 1.06} ${cx + r * 0.82},${cy} ${cx},${cy + r * 1.06} ${cx - r * 0.82},${cy}`;
      return `<polygon points="${pts}" ${attrs} stroke-linejoin="round"/>`;
    }
    if (shapeId === 'semicircle') {
      const w = r * 1.08;
      return `<path d="M${cx - w} ${cy + r * 0.25} A${w} ${w} 0 0 1 ${cx + w} ${cy + r * 0.25} Z" ${attrs} stroke-linejoin="round"/>`;
    }
    if (shapeId === 'triangle') {
      const p1 = `${cx},${cy - r}`;
      const p2 = `${cx + r * 1.06},${cy + r * 0.9}`;
      const p3 = `${cx - r * 1.06},${cy + r * 0.9}`;
      return `<polygon points="${p1} ${p2} ${p3}" ${attrs} stroke-linejoin="round"/>`;
    }
    if (shapeId === 'star') {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const rad = (i % 2 === 0 ? r * 1.12 : r * 0.48);
        const ang = (Math.PI / 5) * i - Math.PI / 2;
        pts.push(`${(cx + Math.cos(ang) * rad).toFixed(1)},${(cy + Math.sin(ang) * rad).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(' ')}" ${attrs} stroke-linejoin="round"/>`;
    }
    if (shapeId === 'heart') {
      return `<path d="M${cx} ${cy + r * 0.95} C${cx - r * 1.35} ${cy + r * 0.15} ${cx - r * 1.1} ${cy - r * 0.95} ${cx} ${cy - r * 0.25} C${cx + r * 1.1} ${cy - r * 0.95} ${cx + r * 1.35} ${cy + r * 0.15} ${cx} ${cy + r * 0.95} Z" ${attrs} stroke-linejoin="round"/>`;
    }
    return '';
  }

  function renderEggSVG({ size = 76, base = '#FFE066', spot = '#FFFFFF', shape = null, shapeColor = '#FF6B6B' } = {}) {
    return `
      <svg width="${size}" height="${Math.round(size * 1.18)}" viewBox="0 0 80 96" fill="none">
        <ellipse class="ground-shadow" cx="40" cy="88" rx="22" ry="5" fill="#4B9A29" opacity="0.22"/>
        <path d="M40 8C59 8 71 36 71 58C71 76 58 88 40 88C22 88 9 76 9 58C9 36 21 8 40 8Z" fill="${base}" stroke="#4A3728" stroke-width="4.5"/>
        <ellipse cx="28" cy="30" rx="6" ry="12" transform="rotate(-18 28 30)" fill="#FFFFFF" opacity="0.5"/>
        ${shape ? renderShapePath(shape, 40, 56, 30, shapeColor) : `
          <circle cx="26" cy="54" r="6" fill="${spot}" opacity="0.8"/>
          <circle cx="52" cy="44" r="7" fill="${spot}" opacity="0.8"/>
          <circle cx="48" cy="68" r="5.5" fill="${spot}" opacity="0.8"/>
          <circle cx="28" cy="72" r="4.5" fill="${spot}" opacity="0.7"/>
        `}
      </svg>
    `;
  }

  function renderChickSVG({ size = 82, bodyColor = '#FFE066', accessory = 'bow', balloonShape = null, balloonColor = '#FF6B6B' } = {}) {
    let accSvg = '';
    if (accessory === 'bow') {
      accSvg = `
        <path d="M42 22L28 14L30 28Z" fill="#FF6B9D" stroke="#4A3728" stroke-width="3" stroke-linejoin="round"/>
        <path d="M48 22L62 14L60 28Z" fill="#FF6B9D" stroke="#4A3728" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="45" cy="22" r="5" fill="#FF9EC7" stroke="#4A3728" stroke-width="3"/>
      `;
    } else if (accessory === 'crown') {
      accSvg = `<polygon points="30,24 34,10 45,18 56,10 60,24" fill="#FFD43B" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>`;
    } else if (accessory === 'flower') {
      accSvg = `
        <circle cx="56" cy="22" r="5" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.5"/>
        <circle cx="64" cy="26" r="5" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.5"/>
        <circle cx="58" cy="32" r="5" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.5"/>
        <circle cx="52" cy="28" r="5" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.5"/>
        <circle cx="58" cy="27" r="4" fill="#FF922B" stroke="#4A3728" stroke-width="2"/>
      `;
    } else if (accessory === 'star') {
      accSvg = renderShapePath('star', 56, 22, 16, '#FFD43B');
    } else if (accessory === 'hat') {
      accSvg = `
        <ellipse cx="45" cy="24" rx="22" ry="6" fill="#74C0FC" stroke="#4A3728" stroke-width="3"/>
        <path d="M32 23C33 11 57 11 58 23Z" fill="#74C0FC" stroke="#4A3728" stroke-width="3"/>
      `;
    }

    const balloonSvg = balloonShape ? `
      <line x1="76" y1="62" x2="76" y2="34" stroke="#4A3728" stroke-width="2.5"/>
      ${renderShapePath(balloonShape, 76, 20, 22, balloonColor)}
    ` : '';

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 96 96" fill="none">
        <ellipse class="ground-shadow" cx="45" cy="88" rx="24" ry="5.5" fill="#4B9A29" opacity="0.24"/>
        <path d="M36 78V86M36 86L30 88M36 86L41 88" stroke="#FF922B" stroke-width="4" stroke-linecap="round"/>
        <path d="M54 78V86M54 86L49 88M54 86L60 88" stroke="#FF922B" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="18" cy="56" rx="8" ry="11" transform="rotate(24 18 56)" fill="${bodyColor}" stroke="#4A3728" stroke-width="3.8"/>
        <ellipse cx="72" cy="56" rx="8" ry="11" transform="rotate(-24 72 56)" fill="${bodyColor}" stroke="#4A3728" stroke-width="3.8"/>
        <circle cx="45" cy="53" r="28" fill="${bodyColor}" stroke="#4A3728" stroke-width="4.2"/>
        <path d="M40 26C38 17 45 16 46 24C49 17 55 19 50 26" fill="${bodyColor}" stroke="#4A3728" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
        ${accSvg}
        <circle cx="35" cy="48" r="4.2" fill="#4A3728"/>
        <circle cx="36.2" cy="46.8" r="1.4" fill="#FFFFFF"/>
        <circle cx="55" cy="48" r="4.2" fill="#4A3728"/>
        <circle cx="56.2" cy="46.8" r="1.4" fill="#FFFFFF"/>
        <circle cx="27" cy="55" r="4.5" fill="#FF85B3" opacity="0.72"/>
        <circle cx="63" cy="55" r="4.5" fill="#FF85B3" opacity="0.72"/>
        <polygon points="41,53 49,53 45,61" fill="#FF922B" stroke="#4A3728" stroke-width="3" stroke-linejoin="round"/>
        ${balloonSvg}
      </svg>
    `;
  }

  function renderNestSVG(fillColor, iconEmoji, scale = 1) {
    const w = Math.round(104 * scale);
    const h = Math.round(68 * scale);
    return `
      <svg width="${w}" height="${h}" viewBox="0 0 120 76" fill="none">
        <ellipse cx="60" cy="44" rx="50" ry="22" fill="${fillColor}" stroke="#4A3728" stroke-width="4.5"/>
        <ellipse cx="60" cy="36" rx="38" ry="13" fill="#FFFDF8" stroke="#4A3728" stroke-width="3.5"/>
        <path d="M18 46Q40 60 60 56Q82 60 102 46" stroke="#4A3728" stroke-width="3.2" stroke-linecap="round" opacity="0.5"/>
        <path d="M26 56Q60 68 94 56" stroke="#4A3728" stroke-width="3" stroke-linecap="round" opacity="0.45"/>
        <text x="60" y="42" text-anchor="middle" font-size="22">${iconEmoji}</text>
      </svg>
    `;
  }

  function renderCornSVG(size = 50) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
        <path d="M14 48C14 34 22 26 26 24L22 50Z" fill="#51CF66" stroke="#4A3728" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M50 48C50 34 42 26 38 24L42 50Z" fill="#51CF66" stroke="#4A3728" stroke-width="3.5" stroke-linejoin="round"/>
        <ellipse cx="32" cy="30" rx="14" ry="22" fill="#FFD43B" stroke="#4A3728" stroke-width="4"/>
        <path d="M22 24H42M20 32H44M22 40H42M28 11V48M36 11V48" stroke="#E09F00" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M22 46Q32 58 42 46" fill="#40C057" stroke="#4A3728" stroke-width="3.5" stroke-linejoin="round"/>
      </svg>
    `;
  }

  function renderGoldenEggSVG({ size = 80, cracks = 0 } = {}) {
    const uid = ++svgUid;
    const gradId = `hmcGoldEggGrad_${uid}`;
    const sheenId = `hmcGoldEggSheen_${uid}`;
    const clipId = `hmcGoldEggClip_${uid}`;
    const eggPath = 'M44 12C64 12 76 41 76 63C76 82 62 94 44 94C26 94 12 82 12 63C12 41 24 12 44 12Z';

    let crackSvg = '';
    if (cracks === 1) {
      crackSvg = `
        <path d="M21 57L32 50L40 60L51 51L60 59L68 53" stroke="#FFFBE0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>
        <path d="M21 56L32 49L40 59L51 50L60 58L68 52" stroke="#4A3728" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M40 59L43 68" stroke="#4A3728" stroke-width="2.8" stroke-linecap="round"/>
      `;
    } else if (cracks >= 2) {
      crackSvg = `
        <polygon points="18,57 30,47 41,58 53,46 68,55 61,65 50,57 40,68 28,58" fill="#FFFCE0" stroke="#F59F00" stroke-width="2"/>
        <circle cx="38" cy="56" r="3" fill="#4A3728"/>
        <circle cx="39" cy="55" r="1.1" fill="#FFFFFF"/>
        <circle cx="50" cy="55" r="3" fill="#4A3728"/>
        <circle cx="51" cy="54" r="1.1" fill="#FFFFFF"/>
        <path d="M18 57L30 47L41 58L53 46L68 55" stroke="#4A3728" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M24 61L28 58L40 68L50 57L61 65L66 60" stroke="#4A3728" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M41 58L44 37L51 30" stroke="#4A3728" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M40 68L35 79" stroke="#4A3728" stroke-width="2.8" stroke-linecap="round"/>
      `;
    }

    return `
      <svg width="${size}" height="${Math.round(size * 1.18)}" viewBox="0 0 88 104" fill="none">
        <defs>
          <linearGradient id="${gradId}" x1="12" y1="12" x2="76" y2="94" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFF5A8"/>
            <stop offset="28%" stop-color="#FFD43B"/>
            <stop offset="56%" stop-color="#FFB8DC"/>
            <stop offset="80%" stop-color="#A5D8FF"/>
            <stop offset="100%" stop-color="#FFE066"/>
          </linearGradient>
          <linearGradient id="${sheenId}" x1="16" y1="14" x2="68" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.55"/>
            <stop offset="45%" stop-color="#FFE066" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="#F59F00" stop-opacity="0.22"/>
          </linearGradient>
          <clipPath id="${clipId}">
            <path d="${eggPath}"/>
          </clipPath>
        </defs>
        <ellipse class="ground-shadow" cx="44" cy="96" rx="24" ry="5.5" fill="#4B9A29" opacity="0.24"/>
        <path d="${eggPath}" fill="url(#${gradId})"/>
        <g clip-path="url(#${clipId})">
          <path d="M8 38Q28 30 44 38T80 38V47Q62 55 44 47T8 47Z" fill="#FF85C0" opacity="0.62"/>
          <path d="M8 47Q28 39 44 47T80 47V56Q62 64 44 56T8 56Z" fill="#FFA94D" opacity="0.58"/>
          <path d="M8 56Q28 48 44 56T80 56V65Q62 73 44 65T8 65Z" fill="#FFE066" opacity="0.65"/>
          <path d="M8 65Q28 57 44 65T80 65V74Q62 82 44 74T8 74Z" fill="#69DB7C" opacity="0.56"/>
          <path d="M8 74Q28 66 44 74T80 74V83Q62 91 44 83T8 83Z" fill="#74C0FC" opacity="0.62"/>
          <path d="M8 83Q28 75 44 83T80 83V96H8Z" fill="#C5A3FF" opacity="0.62"/>
          <path d="${eggPath}" fill="url(#${sheenId})"/>
        </g>
        <path d="${eggPath}" fill="none" stroke="#4A3728" stroke-width="4.5" stroke-linejoin="round"/>
        <ellipse cx="30" cy="34" rx="6" ry="12" transform="rotate(-18 30 34)" fill="#FFFFFF" opacity="0.65"/>
        <circle cx="56" cy="30" r="3" fill="#FFFFFF" opacity="0.85"/>
        ${crackSvg}
        <polygon points="14,12 16,18 22,20 16,22 14,28 12,22 6,20 12,18" fill="#FFE066" stroke="#F59F00" stroke-width="1.6" stroke-linejoin="round"/>
        <polygon points="74,10 76,15 81,17 76,19 74,24 72,19 67,17 72,15" fill="#FFE066" stroke="#F59F00" stroke-width="1.6" stroke-linejoin="round"/>
        <polygon points="80,44 81.5,47.5 85,49 81.5,50.5 80,54 78.5,50.5 75,49 78.5,47.5" fill="#FFF3BF" stroke="#F59F00" stroke-width="1.4" stroke-linejoin="round"/>
      </svg>
    `;
  }

  function renderRareBuddySVG({ size = 88, buddyId = 'dino' } = {}) {
    if (HMC.svgBuddies && typeof HMC.svgBuddies.renderRareBuddySVG === 'function') {
      return HMC.svgBuddies.renderRareBuddySVG({ size, buddyId });
    }
    return renderChickSVG({ size });
  }

  function renderBathChickSVG({ size = 216, mudLevel = 3, bubbleLevel = 0, wetSparkle = false, cleanGlow = false } = {}) {
    const h = Math.round(size * 0.84);
    const mud1 = mudLevel >= 1 ? `
      <g class="habit-mud habit-mud-1">
        <ellipse cx="141" cy="102" rx="9" ry="6.5" transform="rotate(-14 141 102)" fill="#9C6B43" stroke="#6B4423" stroke-width="2"/>
        <circle cx="151" cy="94" r="3" fill="#9C6B43"/>
        <circle cx="133" cy="110" r="2.6" fill="#8A5A32"/>
      </g>
    ` : '';
    const mud2 = mudLevel >= 2 ? `
      <g class="habit-mud habit-mud-2">
        <ellipse cx="95" cy="74" rx="8.5" ry="5.5" transform="rotate(18 95 74)" fill="#9C6B43" stroke="#6B4423" stroke-width="2"/>
        <circle cx="88" cy="103" r="6" fill="#9C6B43" stroke="#6B4423" stroke-width="2"/>
        <circle cx="74" cy="106" r="3.5" fill="#8A5A32"/>
      </g>
    ` : '';
    const mud3 = mudLevel >= 3 ? `
      <g class="habit-mud habit-mud-3">
        <ellipse cx="116" cy="117" rx="12" ry="7.5" fill="#9C6B43" stroke="#6B4423" stroke-width="2.2"/>
        <circle cx="129" cy="67" r="4.5" fill="#9C6B43" stroke="#6B4423" stroke-width="1.8"/>
        <circle cx="104" cy="113" r="3.2" fill="#8A5A32"/>
      </g>
    ` : '';

    const bubbles1 = bubbleLevel >= 1 ? `
      <g class="habit-bubbles habit-bubbles-1">
        <circle cx="84" cy="126" r="13" fill="#FFFFFF" stroke="#74C0FC" stroke-width="2.4"/>
        <circle cx="102" cy="129" r="11" fill="#F4FBFF" stroke="#74C0FC" stroke-width="2.2"/>
        <circle cx="144" cy="127" r="12" fill="#FFFFFF" stroke="#74C0FC" stroke-width="2.4"/>
        <circle cx="116" cy="54" r="9" fill="#FFFFFF" stroke="#74C0FC" stroke-width="2.2"/>
        <circle cx="126" cy="57" r="7" fill="#F4FBFF" stroke="#74C0FC" stroke-width="2"/>
        <path d="M80 120A6 6 0 0 1 88 120" stroke="#A5D8FF" stroke-width="2" stroke-linecap="round"/>
      </g>
    ` : '';
    const bubbles2 = bubbleLevel >= 2 ? `
      <g class="habit-bubbles habit-bubbles-2">
        <circle cx="64" cy="123" r="14" fill="#FFFFFF" stroke="#74C0FC" stroke-width="2.4"/>
        <circle cx="123" cy="126" r="14" fill="#FFFFFF" stroke="#74C0FC" stroke-width="2.4"/>
        <circle cx="164" cy="124" r="13" fill="#F4FBFF" stroke="#74C0FC" stroke-width="2.4"/>
        <circle cx="107" cy="56" r="7.5" fill="#FFFFFF" stroke="#74C0FC" stroke-width="2"/>
        <circle cx="52" cy="84" r="8" fill="#EBF8FF" stroke="#74C0FC" stroke-width="2" opacity="0.92"/>
        <circle cx="182" cy="76" r="9" fill="#FFF0F6" stroke="#FFAED0" stroke-width="2" opacity="0.92"/>
        <circle cx="168" cy="56" r="6" fill="#EBF8FF" stroke="#74C0FC" stroke-width="1.8" opacity="0.9"/>
      </g>
    ` : '';
    const bubbles3 = bubbleLevel >= 3 ? `
      <g class="habit-bubbles habit-bubbles-3">
        <circle cx="50" cy="116" r="11" fill="#FFFFFF" stroke="#74C0FC" stroke-width="2.2"/>
        <circle cx="180" cy="116" r="11" fill="#FFFFFF" stroke="#74C0FC" stroke-width="2.2"/>
        <circle cx="92" cy="116" r="12" fill="#FFFFFF" stroke="#74C0FC" stroke-width="2.2"/>
        <circle cx="152" cy="115" r="11" fill="#FFFFFF" stroke="#74C0FC" stroke-width="2.2"/>
        <circle cx="120" cy="46" r="8" fill="#FFFFFF" stroke="#74C0FC" stroke-width="2"/>
        <circle cx="44" cy="56" r="10" fill="#F3EEFF" stroke="#B197FC" stroke-width="2" opacity="0.9"/>
        <circle cx="68" cy="40" r="6.5" fill="#EBF8FF" stroke="#74C0FC" stroke-width="1.8" opacity="0.9"/>
        <circle cx="192" cy="48" r="10.5" fill="#EBF8FF" stroke="#74C0FC" stroke-width="2" opacity="0.9"/>
        <circle cx="172" cy="34" r="5.5" fill="#FFF3BF" stroke="#FFD43B" stroke-width="1.8" opacity="0.9"/>
        <circle cx="189" cy="44" r="2.6" fill="#FFFFFF"/>
        <circle cx="41" cy="52" r="2.6" fill="#FFFFFF"/>
      </g>
    ` : '';

    const rinseSvg = wetSparkle ? `
      <g class="habit-rinse">
        <path d="M214 14C200 14 190 22 184 30" stroke="#ADB5BD" stroke-width="6" stroke-linecap="round"/>
        <ellipse cx="180" cy="34" rx="14" ry="8" transform="rotate(-32 180 34)" fill="#DEE2E6" stroke="#4A3728" stroke-width="3"/>
        <path d="M162 46C160 52 155 56 159 60C163 63 167 57 162 46Z" fill="#38B6FF" stroke="#1C7ED6" stroke-width="1.5"/>
        <path d="M144 40C142 47 137 51 141 55C145 58 149 52 144 40Z" fill="#74D2FF" stroke="#1C7ED6" stroke-width="1.5"/>
        <path d="M126 36C124 43 119 47 123 51C127 54 131 48 126 36Z" fill="#38B6FF" stroke="#1C7ED6" stroke-width="1.5"/>
        <path d="M98 44C96 51 91 55 95 59C99 62 103 56 98 44Z" fill="#74D2FF" stroke="#1C7ED6" stroke-width="1.5"/>
        <path d="M76 62C74 69 69 73 73 77C77 80 81 74 76 62Z" fill="#38B6FF" stroke="#1C7ED6" stroke-width="1.5"/>
        <path d="M164 74C162 81 157 85 161 89C165 92 169 86 164 74Z" fill="#74D2FF" stroke="#1C7ED6" stroke-width="1.5"/>
        <path d="M84 114Q90 108 96 114" stroke="#38B6FF" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M144 112Q150 106 156 112" stroke="#38B6FF" stroke-width="2.6" stroke-linecap="round"/>
      </g>
    ` : '';

    const towelAndGlowSvg = cleanGlow ? `
      <g class="habit-clean-glow">
        <path d="M86 67C92 43 144 43 150 67Q118 57 86 67Z" fill="#FFB8DC" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M112 52L99 42L102 58Z" fill="#FF85C0" stroke="#4A3728" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M124 52L137 42L134 58Z" fill="#FF85C0" stroke="#4A3728" stroke-width="2.8" stroke-linejoin="round"/>
        <circle cx="118" cy="52" r="5" fill="#FFE066" stroke="#4A3728" stroke-width="2.6"/>
        <polygon points="52,44 55,52 63,55 55,58 52,66 49,58 41,55 49,52" fill="#FFD43B" stroke="#F59F00" stroke-width="1.6" stroke-linejoin="round"/>
        <polygon points="188,42 191,50 199,53 191,56 188,64 185,56 177,53 185,50" fill="#FFD43B" stroke="#F59F00" stroke-width="1.6" stroke-linejoin="round"/>
        <polygon points="174,82 176,87 181,89 176,91 174,96 172,91 167,89 172,87" fill="#FFF3BF" stroke="#F59F00" stroke-width="1.4" stroke-linejoin="round"/>
        <polygon points="62,82 64,87 69,89 64,91 62,96 60,91 55,89 60,87" fill="#FFF3BF" stroke="#F59F00" stroke-width="1.4" stroke-linejoin="round"/>
        ${renderShapePath('heart', 120, 26, 16, '#FF6B9D', { strokeWidth: 2.2 })}
      </g>
    ` : '';

    return `
      <svg width="${size}" height="${h}" viewBox="0 0 240 200" fill="none">
        <circle cx="120" cy="104" r="82" fill="${cleanGlow ? '#FFF9DB' : '#E3F6FF'}"/>
        <!-- Chrome Faucet -->
        <path d="M196 124V96C196 86 212 86 212 96V102" stroke="#ADB5BD" stroke-width="8" stroke-linecap="round"/>
        <path d="M196 124V96C196 86 212 86 212 96V102" stroke="#4A3728" stroke-width="3" stroke-linecap="round"/>
        <circle cx="196" cy="112" r="5" fill="#74C0FC" stroke="#4A3728" stroke-width="2.5"/>
        <!-- Back Bathtub Rim & Water -->
        <ellipse cx="120" cy="126" rx="82" ry="18" fill="#D5EEFF" stroke="#4A3728" stroke-width="4"/>
        <ellipse cx="120" cy="128" rx="74" ry="13" fill="#8CE0FF"/>
        <!-- Chick Sitting in Tub -->
        <ellipse cx="75" cy="108" rx="11" ry="15" transform="rotate(28 75 108)" fill="#FFE066" stroke="#4A3728" stroke-width="4"/>
        <ellipse cx="161" cy="108" rx="11" ry="15" transform="rotate(-28 161 108)" fill="#FFE066" stroke="#4A3728" stroke-width="4"/>
        <circle cx="118" cy="96" r="39" fill="#FFE066" stroke="#4A3728" stroke-width="4.5"/>
        <path d="M111 58C108 45 118 45 119 55C123 46 131 49 125 58" fill="#FFE066" stroke="#4A3728" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
        ${cleanGlow ? `
          <path d="M96 90Q103 81 110 90" stroke="#4A3728" stroke-width="4" stroke-linecap="round"/>
          <path d="M126 90Q133 81 140 90" stroke="#4A3728" stroke-width="4" stroke-linecap="round"/>
        ` : `
          <circle cx="103" cy="88" r="5.5" fill="#4A3728"/>
          <circle cx="104.8" cy="86.2" r="1.8" fill="#FFFFFF"/>
          <circle cx="133" cy="88" r="5.5" fill="#4A3728"/>
          <circle cx="134.8" cy="86.2" r="1.8" fill="#FFFFFF"/>
        `}
        <ellipse cx="90" cy="98" rx="6.5" ry="4.5" fill="#FF85B3" opacity="0.78"/>
        <ellipse cx="146" cy="98" rx="6.5" ry="4.5" fill="#FF85B3" opacity="0.78"/>
        <polygon points="111,94 125,94 118,105" fill="#FF922B" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
        ${mud1}
        ${mud2}
        ${mud3}
        <!-- Tiny Rubber Ducky on Tub Rim -->
        <ellipse cx="52" cy="117" rx="10" ry="7" fill="#FFD43B" stroke="#4A3728" stroke-width="2.6"/>
        <circle cx="57" cy="109" r="6" fill="#FFD43B" stroke="#4A3728" stroke-width="2.6"/>
        <circle cx="59" cy="108" r="1.3" fill="#4A3728"/>
        <path d="M62 110L67 111L62 113Z" fill="#FF922B" stroke="#4A3728" stroke-width="1.6" stroke-linejoin="round"/>
        <!-- Front Bathtub Shell & Claw Feet -->
        <path d="M66 172L58 184H73L75 174Z" fill="#FFD43B" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M174 172L182 184H167L165 174Z" fill="#FFD43B" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M38 124C41 164 64 178 120 178C176 178 199 164 202 124Q120 140 38 124Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M46 146C55 166 78 173 120 173C162 173 185 166 194 146Q120 160 46 146Z" fill="#E7F5FF"/>
        <path d="M32 123Q120 141 208 123" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round"/>
        <path d="M32 123Q120 141 208 123" stroke="#4A3728" stroke-width="4.5" stroke-linecap="round"/>
        ${renderShapePath('heart', 120, 155, 16, '#FFAED0', { strokeWidth: 2.2 })}
        ${bubbles1}
        ${bubbles2}
        ${bubbles3}
        ${rinseSvg}
        ${towelAndGlowSvg}
      </svg>
    `;
  }

  function renderBedtimeChickSVG({ size = 216, crumbsLevel = 3, mintSparkle = false, tuckedIn = false } = {}) {
    const h = Math.round(size * 0.84);
    if (tuckedIn) {
      return `
        <svg width="${size}" height="${h}" viewBox="0 0 240 200" fill="none">
          <!-- Cozy Night Sky Halo -->
          <circle cx="120" cy="104" r="84" fill="#2A3E7A"/>
          <circle cx="120" cy="108" r="66" fill="#375096" opacity="0.65"/>
          <!-- Crescent Moon & Twinkling Stars -->
          <path d="M56 32C45 36 42 50 51 58C59 65 72 62 76 52C65 55 56 46 56 32Z" fill="#FFE875" stroke="#F59F00" stroke-width="2.4" stroke-linejoin="round"/>
          <polygon points="184,36 186,42 192,44 186,46 184,52 182,46 176,44 182,42" fill="#FFE875"/>
          <circle cx="164" cy="30" r="3" fill="#FFF3BF"/>
          <circle cx="84" cy="34" r="2.6" fill="#FFF3BF"/>
          <!-- Bed Headboard -->
          <rect x="42" y="72" width="156" height="72" rx="18" fill="#E3A96B" stroke="#4A3728" stroke-width="4.5"/>
          <circle cx="44" cy="70" r="9" fill="#F2C083" stroke="#4A3728" stroke-width="3.6"/>
          <circle cx="196" cy="70" r="9" fill="#F2C083" stroke="#4A3728" stroke-width="3.6"/>
          <!-- Fluffy Pillow -->
          <rect x="64" y="76" width="112" height="44" rx="20" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.8"/>
          <path d="M74 86Q120 80 166 86" stroke="#E9ECEF" stroke-width="3" stroke-linecap="round"/>
          <!-- Sleeping Chick Head -->
          <circle cx="120" cy="96" r="30" fill="#FFE066" stroke="#4A3728" stroke-width="4.2"/>
          <!-- Cozy Nightcap -->
          <path d="M93 84C98 56 135 54 148 79L165 72C159 86 150 88 144 86Z" fill="#748FFC" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
          <circle cx="168" cy="70" r="7" fill="#FFF7D6" stroke="#4A3728" stroke-width="3"/>
          <path d="M91 84Q120 75 149 84" stroke="#FFF7D6" stroke-width="7" stroke-linecap="round"/>
          <!-- Peaceful Closed Eyes & Rosy Cheeks -->
          <path d="M102 96Q108 102 114 96" stroke="#4A3728" stroke-width="3.6" stroke-linecap="round"/>
          <path d="M126 96Q132 102 138 96" stroke="#4A3728" stroke-width="3.6" stroke-linecap="round"/>
          <ellipse cx="97" cy="103" rx="5.5" ry="3.8" fill="#FF85B3" opacity="0.78"/>
          <ellipse cx="143" cy="103" rx="5.5" ry="3.8" fill="#FF85B3" opacity="0.78"/>
          <polygon points="115,101 125,101 120,109" fill="#FF922B" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
          <!-- Cozy Starry Quilt Pulled Snug -->
          <path d="M36 122C36 112 46 110 60 112Q120 122 180 112C194 110 204 112 204 122V172C204 180 196 184 186 184H54C44 184 36 180 36 172Z" fill="#FF9EC7" stroke="#4A3728" stroke-width="4.5" stroke-linejoin="round"/>
          <path d="M38 122Q120 134 202 122V137Q120 149 38 137Z" fill="#A5D8FF" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
          ${renderShapePath('star', 72, 160, 18, '#FFE875', { strokeWidth: 2 })}
          ${renderShapePath('star', 120, 164, 20, '#FFF3BF', { strokeWidth: 2 })}
          ${renderShapePath('star', 168, 160, 18, '#FFE875', { strokeWidth: 2 })}
          <circle cx="96" cy="154" r="3.5" fill="#FFFFFF" opacity="0.85"/>
          <circle cx="144" cy="154" r="3.5" fill="#FFFFFF" opacity="0.85"/>
          <!-- Dreamy Zzz -->
          <text x="164" y="58" font-size="18" font-weight="900" fill="#FFE875" stroke="#2A3E7A" stroke-width="1">Z</text>
          <text x="178" y="47" font-size="14" font-weight="900" fill="#FFF3BF">z</text>
          <text x="190" y="38" font-size="11" font-weight="900" fill="#FFFFFF">z</text>
        </svg>
      `;
    }

    const crumbs1 = crumbsLevel >= 1 ? `
      <g class="habit-crumbs habit-crumbs-1">
        <circle cx="135" cy="109" r="3.3" fill="#8D5524"/>
        <circle cx="140" cy="113" r="2" fill="#6B4423"/>
      </g>
    ` : '';
    const crumbs2 = crumbsLevel >= 2 ? `
      <g class="habit-crumbs habit-crumbs-2">
        <circle cx="104" cy="108" r="3.2" fill="#8D5524"/>
        <circle cx="109" cy="114" r="2.2" fill="#6B4423"/>
        <circle cx="82" cy="112" r="2.8" fill="#9C6B43"/>
      </g>
    ` : '';
    const crumbs3 = crumbsLevel >= 3 ? `
      <g class="habit-crumbs habit-crumbs-3">
        <ellipse cx="120" cy="109" rx="4.5" ry="3.2" fill="#7A4E2D"/>
        <circle cx="126" cy="113" r="2.4" fill="#8D5524"/>
        <circle cx="156" cy="111" r="2.8" fill="#9C6B43"/>
      </g>
    ` : '';

    const sparklingTeeth = (mintSparkle || crumbsLevel === 0) ? `
      <g class="habit-mint-sparkle">
        <circle cx="88" cy="112" r="7" fill="#C3FAE8" stroke="#20C997" stroke-width="2"/>
        <circle cx="93" cy="121" r="5" fill="#E6FCF5" stroke="#20C997" stroke-width="1.8"/>
        <circle cx="152" cy="112" r="7" fill="#C3FAE8" stroke="#20C997" stroke-width="2"/>
        <circle cx="147" cy="121" r="5" fill="#E6FCF5" stroke="#20C997" stroke-width="1.8"/>
        <polygon points="70,84 73,91 80,94 73,97 70,104 67,97 60,94 67,91" fill="#63E6BE" stroke="#12B886" stroke-width="1.5" stroke-linejoin="round"/>
        <polygon points="172,82 175,89 182,92 175,95 172,102 169,95 162,92 169,89" fill="#FFD43B" stroke="#F59F00" stroke-width="1.5" stroke-linejoin="round"/>
        ${crumbsLevel === 0 ? `
          <polygon points="120,100 122,105 127,107 122,109 120,114 118,109 113,107 118,105" fill="#FFF3BF" stroke="#F59F00" stroke-width="1.3" stroke-linejoin="round"/>
          <polygon points="184,56 186,61 191,63 186,65 184,70 182,65 177,63 182,61" fill="#63E6BE" stroke="#12B886" stroke-width="1.3" stroke-linejoin="round"/>
        ` : ''}
      </g>
    ` : '';

    return `
      <svg width="${size}" height="${h}" viewBox="0 0 240 200" fill="none">
        <!-- Soft Nursery Background -->
        <circle cx="120" cy="104" r="82" fill="#EDF4FF"/>
        <path d="M56 36C48 39 46 49 52 55C58 60 68 58 71 50C63 53 56 46 56 36Z" fill="#FFE066" stroke="#F59F00" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="182" cy="44" r="4" fill="#FFE066"/>
        <circle cx="192" cy="58" r="2.8" fill="#B197FC"/>
        <!-- Starry Pajama Body -->
        <path d="M72 180C72 144 92 132 120 132C148 132 168 144 168 180Z" fill="#8CCBFF" stroke="#4A3728" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M98 134L120 148L142 134" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        ${renderShapePath('star', 98, 162, 13, '#FFE875', { strokeWidth: 1.6 })}
        ${renderShapePath('star', 142, 162, 13, '#FFE875', { strokeWidth: 1.6 })}
        <circle cx="120" cy="160" r="3.5" fill="#FFFFFF" stroke="#4A3728" stroke-width="2"/>
        <!-- Raised Cute Wings -->
        <ellipse cx="70" cy="144" rx="11" ry="16" transform="rotate(24 70 144)" fill="#FFE066" stroke="#4A3728" stroke-width="3.8"/>
        <ellipse cx="170" cy="144" rx="11" ry="16" transform="rotate(-24 170 144)" fill="#FFE066" stroke="#4A3728" stroke-width="3.8"/>
        <!-- Fluffy Chick Head -->
        <circle cx="120" cy="90" r="46" fill="#FFE066" stroke="#4A3728" stroke-width="4.5"/>
        <path d="M113 45C110 31 120 31 121 42C125 32 135 35 128 45" fill="#FFE066" stroke="#4A3728" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Eyes -->
        ${crumbsLevel === 0 ? `
          <path d="M94 76Q102 66 110 76" stroke="#4A3728" stroke-width="4.2" stroke-linecap="round"/>
          <path d="M130 76Q138 66 146 76" stroke="#4A3728" stroke-width="4.2" stroke-linecap="round"/>
        ` : `
          <circle cx="102" cy="76" r="6" fill="#4A3728"/>
          <circle cx="104" cy="74" r="2" fill="#FFFFFF"/>
          <circle cx="138" cy="76" r="6" fill="#4A3728"/>
          <circle cx="140" cy="74" r="2" fill="#FFFFFF"/>
        `}
        <!-- Rosy Cheeks & Cute Upper Beak -->
        <ellipse cx="86" cy="89" rx="7" ry="4.8" fill="#FF85B3" opacity="0.78"/>
        <ellipse cx="154" cy="89" rx="7" ry="4.8" fill="#FF85B3" opacity="0.78"/>
        <polygon points="113,83 127,83 120,93" fill="#FF922B" stroke="#4A3728" stroke-width="3" stroke-linejoin="round"/>
        <!-- Big Toothy Smile -->
        <rect x="92" y="96" width="56" height="26" rx="13" fill="#FF7EA5" stroke="#4A3728" stroke-width="3.6"/>
        <rect x="97" y="100" width="46" height="18" rx="7" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.4"/>
        <line x1="109" y1="100" x2="109" y2="118" stroke="#CBD5E1" stroke-width="2"/>
        <line x1="120" y1="100" x2="120" y2="118" stroke="#CBD5E1" stroke-width="2"/>
        <line x1="131" y1="100" x2="131" y2="118" stroke="#CBD5E1" stroke-width="2"/>
        ${crumbs1}
        ${crumbs2}
        ${crumbs3}
        ${sparklingTeeth}
      </svg>
    `;
  }

  HMC.svg = {
    renderChickenSVG,
    renderShapePath,
    renderEggSVG,
    renderGoldenEggSVG,
    renderChickSVG,
    renderRareBuddySVG,
    renderNestSVG,
    renderCornSVG,
    renderBathChickSVG,
    renderBedtimeChickSVG
  };
})(window.HMC = window.HMC || {});
