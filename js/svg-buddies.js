(function (HMC) {
  'use strict';

  function starPoly(cx, cy, r, fill, stroke = '#4A3728', sw = 2) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r * 0.45;
      const ang = (Math.PI / 5) * i - Math.PI / 2;
      pts.push(`${(cx + Math.cos(ang) * rad).toFixed(1)},${(cy + Math.sin(ang) * rad).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  }

  function sparklePoly(cx, cy, r, fill = '#FFF9DB', stroke = '#F59F00', sw = 1.2) {
    const ir = r * 0.34;
    const pts = [
      `${cx},${(cy - r).toFixed(1)}`,
      `${(cx + ir).toFixed(1)},${(cy - ir).toFixed(1)}`,
      `${(cx + r).toFixed(1)},${cy}`,
      `${(cx + ir).toFixed(1)},${(cy + ir).toFixed(1)}`,
      `${cx},${(cy + r).toFixed(1)}`,
      `${(cx - ir).toFixed(1)},${(cy + ir).toFixed(1)}`,
      `${(cx - r).toFixed(1)},${cy}`,
      `${(cx - ir).toFixed(1)},${(cy - ir).toFixed(1)}`
    ];
    return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  }

  function heartSvg(cx, cy, size, fill, stroke = '#4A3728', sw = 2) {
    const r = size / 2;
    const d = `M${cx} ${(cy + r * 0.95).toFixed(1)} C${(cx - r * 1.35).toFixed(1)} ${(cy + r * 0.15).toFixed(1)} ${(cx - r * 1.1).toFixed(1)} ${(cy - r * 0.95).toFixed(1)} ${cx} ${(cy - r * 0.25).toFixed(1)} C${(cx + r * 1.1).toFixed(1)} ${(cy - r * 0.95).toFixed(1)} ${(cx + r * 1.35).toFixed(1)} ${(cy + r * 0.15).toFixed(1)} ${cx} ${(cy + r * 0.95).toFixed(1)} Z`;
    return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  }

  function chickFeet(lx = 40, rx = 60, topY = 80, botY = 89) {
    return `
      <path d="M${lx} ${topY}V${botY}M${lx} ${botY}L${lx - 6} ${botY + 2}M${lx} ${botY}L${lx + 5} ${botY + 2}" stroke="#FF922B" stroke-width="4" stroke-linecap="round"/>
      <path d="M${rx} ${topY}V${botY}M${rx} ${botY}L${rx - 5} ${botY + 2}M${rx} ${botY}L${rx + 6} ${botY + 2}" stroke="#FF922B" stroke-width="4" stroke-linecap="round"/>
    `;
  }

  function chickFace(cx = 50, eyeY = 50, spread = 9, cheekFill = '#FF85B3', beakY = 54) {
    return `
      <circle cx="${cx - spread}" cy="${eyeY}" r="3.9" fill="#4A3728"/>
      <circle cx="${(cx - spread + 1.2).toFixed(1)}" cy="${(eyeY - 1.2).toFixed(1)}" r="1.35" fill="#FFFFFF"/>
      <circle cx="${cx + spread}" cy="${eyeY}" r="3.9" fill="#4A3728"/>
      <circle cx="${(cx + spread + 1.2).toFixed(1)}" cy="${(eyeY - 1.2).toFixed(1)}" r="1.35" fill="#FFFFFF"/>
      <ellipse cx="${cx - spread - 7}" cy="${eyeY + 6.5}" rx="4.4" ry="3.1" fill="${cheekFill}" opacity="0.76"/>
      <ellipse cx="${cx + spread + 7}" cy="${eyeY + 6.5}" rx="4.4" ry="3.1" fill="${cheekFill}" opacity="0.76"/>
      <polygon points="${cx - 4},${beakY} ${cx + 4},${beakY} ${cx},${beakY + 7}" fill="#FF922B" stroke="#4A3728" stroke-width="2.7" stroke-linejoin="round"/>
    `;
  }

  const BUDDY_RENDERERS = {
    // =========================================================================
    // 1. ANIMALS (动物朋友 — 6 buddies)
    // =========================================================================

    dino: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="27" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      <polygon points="58,21 69,18 64,29" fill="#FFE066" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
      <polygon points="65,33 76,33 69,43" fill="#A9E34B" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
      <polygon points="69,46 80,48 71,56" fill="#FFE066" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M64 67C80 68 90 57 88 47C82 54 75 56 64 55Z" fill="#58C952" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
      <rect x="34" y="76" width="11" height="13" rx="5.5" fill="#58C952" stroke="#4A3728" stroke-width="3.6"/>
      <rect x="52" y="76" width="11" height="13" rx="5.5" fill="#58C952" stroke="#4A3728" stroke-width="3.6"/>
      <ellipse cx="49" cy="65" rx="21" ry="18" fill="#58C952" stroke="#4A3728" stroke-width="4"/>
      <ellipse cx="46" cy="68" rx="12.5" ry="11" fill="#C4F7B2"/>
      <path d="M30 59C21 56 20 65 29 67" fill="#58C952" stroke="#4A3728" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M64 59C73 56 74 65 64 67" fill="#58C952" stroke="#4A3728" stroke-width="3.4" stroke-linecap="round"/>
      <ellipse cx="45" cy="36" rx="23" ry="18.5" fill="#58C952" stroke="#4A3728" stroke-width="4"/>
      <circle cx="36" cy="33" r="5.2" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.6"/>
      <circle cx="37" cy="33" r="2.8" fill="#4A3728"/>
      <circle cx="38" cy="31.8" r="1.15" fill="#FFFFFF"/>
      <circle cx="52" cy="33" r="5.2" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.6"/>
      <circle cx="53" cy="33" r="2.8" fill="#4A3728"/>
      <circle cx="54" cy="31.8" r="1.15" fill="#FFFFFF"/>
      <ellipse cx="28" cy="40.5" rx="4.4" ry="3.2" fill="#FF94C2" opacity="0.78"/>
      <ellipse cx="60" cy="40.5" rx="4.4" ry="3.2" fill="#FF94C2" opacity="0.78"/>
      <path d="M34 44Q44 51 54 44" stroke="#4A3728" stroke-width="3" stroke-linecap="round" fill="none"/>
      <polygon points="41,46 44,51 47,46" fill="#FFFFFF" stroke="#4A3728" stroke-width="1.8" stroke-linejoin="round"/>
    `,

    duck: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="26" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      <path d="M37 79L31 89H45L42 79Z" fill="#FF922B" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M58 79L55 89H69L63 79Z" fill="#FF922B" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
      <ellipse cx="22" cy="62" rx="8.5" ry="12.5" transform="rotate(20 22 62)" fill="#FFD43B" stroke="#4A3728" stroke-width="3.8"/>
      <ellipse cx="78" cy="62" rx="8.5" ry="12.5" transform="rotate(-20 78 62)" fill="#FFD43B" stroke="#4A3728" stroke-width="3.8"/>
      <ellipse cx="50" cy="63" rx="25" ry="21" fill="#FFD43B" stroke="#4A3728" stroke-width="4.2"/>
      <ellipse cx="50" cy="68" rx="15" ry="12" fill="#FFF3BF" opacity="0.88"/>
      <path d="M45 18C43 10 51 9 52 17C55 11 61 14 56 19" fill="#FFD43B" stroke="#4A3728" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="50" cy="36" r="19.5" fill="#FFD43B" stroke="#4A3728" stroke-width="4.2"/>
      <circle cx="41" cy="33" r="4" fill="#4A3728"/>
      <circle cx="42.2" cy="31.8" r="1.4" fill="#FFFFFF"/>
      <circle cx="59" cy="33" r="4" fill="#4A3728"/>
      <circle cx="60.2" cy="31.8" r="1.4" fill="#FFFFFF"/>
      <ellipse cx="33.5" cy="39.5" rx="4.2" ry="3" fill="#FF85B3" opacity="0.74"/>
      <ellipse cx="66.5" cy="39.5" rx="4.2" ry="3" fill="#FF85B3" opacity="0.74"/>
      <ellipse cx="50" cy="43.5" rx="11.5" ry="6.2" fill="#FF922B" stroke="#4A3728" stroke-width="3.2"/>
      <path d="M43 44.5Q50 48.5 57 44.5" stroke="#4A3728" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <path d="M46 58L36 52L36 64Z" fill="#339AF0" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M54 58L64 52L64 64Z" fill="#339AF0" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
      <circle cx="50" cy="58" r="4.5" fill="#74C0FC" stroke="#4A3728" stroke-width="2.6"/>
      <path d="M84 30C82 35 79 38 82.5 41C86 43 89 38 84 30Z" fill="#74C0FC" stroke="#1C7ED6" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M16 40C14.5 44 12 46.5 14.8 48.8C17.5 50.5 20 46.5 16 40Z" fill="#A5D8FF" stroke="#1C7ED6" stroke-width="1.6" stroke-linejoin="round"/>
    `,

    bunny: () => `
      <ellipse class="ground-shadow" cx="49" cy="91" rx="26" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      <circle cx="24" cy="74" r="7.5" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="38" cy="21" rx="8.2" ry="16" transform="rotate(-12 38 21)" fill="#FFF8FA" stroke="#4A3728" stroke-width="3.6"/>
      <ellipse cx="38.5" cy="22" rx="4.2" ry="10.5" transform="rotate(-12 38.5 22)" fill="#FFB8DC"/>
      <path d="M57 26C69 17 85 26 83 45C82 54 74 56 69 49C65 42 64 35 58 32Z" fill="#FFF8FA" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
      <path d="M63 29C71 24 78 30 77 43C76 47 72 48 70 44C68 38 66 33 63 29Z" fill="#FFB8DC"/>
      <ellipse cx="38" cy="84" rx="8" ry="6" fill="#FFF8FA" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="60" cy="84" rx="8" ry="6" fill="#FFF8FA" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="49" cy="67" rx="22" ry="19" fill="#FFF8FA" stroke="#4A3728" stroke-width="4"/>
      <ellipse cx="49" cy="70" rx="13" ry="12" fill="#FFE6F0"/>
      <ellipse cx="49" cy="43" rx="21" ry="18" fill="#FFF8FA" stroke="#4A3728" stroke-width="4"/>
      <circle cx="40" cy="41" r="3.9" fill="#4A3728"/>
      <circle cx="41.2" cy="39.8" r="1.35" fill="#FFFFFF"/>
      <circle cx="58" cy="41" r="3.9" fill="#4A3728"/>
      <circle cx="59.2" cy="39.8" r="1.35" fill="#FFFFFF"/>
      <ellipse cx="32.5" cy="47.5" rx="4.6" ry="3.2" fill="#FF9EC7" opacity="0.82"/>
      <ellipse cx="65.5" cy="47.5" rx="4.6" ry="3.2" fill="#FF9EC7" opacity="0.82"/>
      <polygon points="46,45.5 52,45.5 49,49.5" fill="#FF6B9D" stroke="#4A3728" stroke-width="2" stroke-linejoin="round"/>
      <path d="M44 51Q46.5 54 49 50.5Q51.5 54 54 51" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <path d="M51 24C48 18 57 16 58 23C58 27 52 29 51 24Z" fill="#FF5D6C" stroke="#4A3728" stroke-width="2.2"/>
      <path d="M50 22L54 18L59 21" stroke="#51CF66" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M49 62C56 62 60 68 57 76C55 81 43 81 41 76C38 68 42 62 49 62Z" fill="#FF5D6C" stroke="#4A3728" stroke-width="3"/>
      <path d="M42 63L49 67L56 63L52 60L49 63L46 60Z" fill="#51CF66" stroke="#4A3728" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="46" cy="71" r="1.2" fill="#FFE066"/>
      <circle cx="52" cy="71" r="1.2" fill="#FFE066"/>
      <circle cx="49" cy="76" r="1.2" fill="#FFE066"/>
      <ellipse cx="36" cy="68" rx="6" ry="5" transform="rotate(-18 36 68)" fill="#FFF8FA" stroke="#4A3728" stroke-width="3"/>
      <ellipse cx="62" cy="68" rx="6" ry="5" transform="rotate(18 62 68)" fill="#FFF8FA" stroke="#4A3728" stroke-width="3"/>
    `,

    bear: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="27" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      <circle cx="30" cy="23" r="9.5" fill="#D4925A" stroke="#4A3728" stroke-width="3.6"/>
      <circle cx="30" cy="23" r="4.8" fill="#FFE6C7"/>
      <circle cx="70" cy="23" r="9.5" fill="#D4925A" stroke="#4A3728" stroke-width="3.6"/>
      <circle cx="70" cy="23" r="4.8" fill="#FFE6C7"/>
      <ellipse cx="36" cy="83" rx="8.5" ry="6.5" fill="#D4925A" stroke="#4A3728" stroke-width="3.6"/>
      <ellipse cx="36" cy="84" rx="4.2" ry="3" fill="#FFE6C7"/>
      <ellipse cx="64" cy="83" rx="8.5" ry="6.5" fill="#D4925A" stroke="#4A3728" stroke-width="3.6"/>
      <ellipse cx="64" cy="84" rx="4.2" ry="3" fill="#FFE6C7"/>
      <ellipse cx="50" cy="65" rx="24" ry="20" fill="#D4925A" stroke="#4A3728" stroke-width="4"/>
      <ellipse cx="50" cy="40" rx="23" ry="19" fill="#D4925A" stroke="#4A3728" stroke-width="4"/>
      <ellipse cx="50" cy="46.5" rx="10.5" ry="7.2" fill="#FFF0D4" stroke="#4A3728" stroke-width="2.4"/>
      <ellipse cx="50" cy="43.5" rx="4" ry="2.8" fill="#4A3728"/>
      <path d="M45 48.5Q50 52 55 48.5" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <circle cx="40" cy="36.5" r="3.8" fill="#4A3728"/>
      <circle cx="41.2" cy="35.3" r="1.3" fill="#FFFFFF"/>
      <circle cx="60" cy="36.5" r="3.8" fill="#4A3728"/>
      <circle cx="61.2" cy="35.3" r="1.3" fill="#FFFFFF"/>
      <ellipse cx="32.5" cy="43" rx="4.3" ry="3" fill="#FF85B3" opacity="0.72"/>
      <ellipse cx="67.5" cy="43" rx="4.3" ry="3" fill="#FF85B3" opacity="0.72"/>
      <path d="M35 56Q50 62 65 56" stroke="#FF6B6B" stroke-width="5.5" stroke-linecap="round"/>
      <rect x="37" y="61" width="26" height="21" rx="9" fill="#FFD43B" stroke="#4A3728" stroke-width="3.2"/>
      <path d="M38 64Q44 71 49 66Q54 73 62 64V61H38Z" fill="#FFA94D" stroke="#4A3728" stroke-width="2.4" stroke-linejoin="round"/>
      <rect x="39" y="58" width="22" height="5.5" rx="2.7" fill="#FFE875" stroke="#4A3728" stroke-width="2.6"/>
      <ellipse cx="33" cy="69" rx="6.5" ry="5.5" transform="rotate(-16 33 69)" fill="#D4925A" stroke="#4A3728" stroke-width="3.2"/>
      <ellipse cx="67" cy="69" rx="6.5" ry="5.5" transform="rotate(16 67 69)" fill="#D4925A" stroke="#4A3728" stroke-width="3.2"/>
      <ellipse cx="83" cy="18" rx="4.2" ry="3" transform="rotate(-24 83 18)" fill="#E3F6FF" stroke="#4A3728" stroke-width="1.6"/>
      <ellipse cx="86" cy="24" rx="5.5" ry="4" fill="#FFE066" stroke="#4A3728" stroke-width="2"/>
      <line x1="85" y1="20.5" x2="85" y2="27.5" stroke="#4A3728" stroke-width="2"/>
    `,

    cat: () => `
      <ellipse class="ground-shadow" cx="49" cy="91" rx="26" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      <path d="M68 74C84 74 91 58 84 47C80 42 73 46 77 52C81 58 76 66 67 66Z" fill="#4A3F3A" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
      <polygon points="29,35 26,14 45,25" fill="#4A3F3A" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
      <polygon points="31,30 30,20 40,26" fill="#FFB8DC"/>
      <polygon points="69,35 72,14 53,25" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
      <polygon points="67,30 68,20 58,26" fill="#FFB8DC"/>
      <ellipse cx="38" cy="84" rx="7.5" ry="5.5" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="60" cy="84" rx="7.5" ry="5.5" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="49" cy="67" rx="22" ry="19" fill="#FFFFFF" stroke="#4A3728" stroke-width="4"/>
      <ellipse cx="36" cy="68" rx="8.5" ry="7.5" transform="rotate(-15 36 68)" fill="#4A3F3A"/>
      <ellipse cx="62" cy="73" rx="6.5" ry="5.5" transform="rotate(18 62 73)" fill="#4A3F3A"/>
      <ellipse cx="49" cy="41" rx="22" ry="18" fill="#FFFFFF" stroke="#4A3728" stroke-width="4"/>
      <path d="M29 37C30 26 41 22 49 24C45 31 39 36 29 37Z" fill="#4A3F3A"/>
      <circle cx="40" cy="40" r="3.9" fill="#4A3728"/>
      <circle cx="41.2" cy="38.8" r="1.35" fill="#FFFFFF"/>
      <circle cx="58" cy="40" r="3.9" fill="#4A3728"/>
      <circle cx="59.2" cy="38.8" r="1.35" fill="#FFFFFF"/>
      <ellipse cx="33" cy="46" rx="4.2" ry="2.9" fill="#FF94C2" opacity="0.78"/>
      <ellipse cx="65" cy="46" rx="4.2" ry="2.9" fill="#FF94C2" opacity="0.78"/>
      <polygon points="46,44 52,44 49,47.8" fill="#FF85B3" stroke="#4A3728" stroke-width="1.9" stroke-linejoin="round"/>
      <path d="M44 49.5Q46.5 52.5 49 49Q51.5 52.5 54 49.5" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <path d="M20 41L30 43M19 47L30 47" stroke="#4A3728" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M78 41L68 43M79 47L68 47" stroke="#4A3728" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M34 56Q49 62 64 56" stroke="#74C0FC" stroke-width="5.2" stroke-linecap="round"/>
      <circle cx="49" cy="60.5" r="5" fill="#FFD43B" stroke="#4A3728" stroke-width="2.5"/>
      <circle cx="49" cy="61.5" r="1.3" fill="#4A3728"/>
    `,

    panda: () => `
      <ellipse class="ground-shadow" cx="48" cy="91" rx="27" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      <circle cx="29" cy="22" r="9.2" fill="#3B322C" stroke="#4A3728" stroke-width="3.4"/>
      <circle cx="67" cy="22" r="9.2" fill="#3B322C" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="36" cy="83" rx="8.5" ry="6.5" fill="#3B322C" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="36" cy="84" rx="4" ry="2.8" fill="#FFB8DC"/>
      <ellipse cx="60" cy="83" rx="8.5" ry="6.5" fill="#3B322C" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="60" cy="84" rx="4" ry="2.8" fill="#FFB8DC"/>
      <ellipse cx="48" cy="66" rx="23" ry="19" fill="#FFFFFF" stroke="#4A3728" stroke-width="4"/>
      <path d="M27 59Q48 67 69 59C68 53 60 49 48 49C36 49 28 53 27 59Z" fill="#3B322C"/>
      <ellipse cx="26" cy="64" rx="7" ry="5.5" transform="rotate(-24 26 64)" fill="#3B322C" stroke="#4A3728" stroke-width="3"/>
      <ellipse cx="48" cy="40" rx="23" ry="18.5" fill="#FFFFFF" stroke="#4A3728" stroke-width="4"/>
      <ellipse cx="38" cy="39" rx="7.2" ry="5.8" transform="rotate(-18 38 39)" fill="#3B322C"/>
      <ellipse cx="58" cy="39" rx="7.2" ry="5.8" transform="rotate(18 58 39)" fill="#3B322C"/>
      <circle cx="38.5" cy="38.5" r="2.8" fill="#FFFFFF"/>
      <circle cx="39" cy="38.5" r="1.5" fill="#4A3728"/>
      <circle cx="57.5" cy="38.5" r="2.8" fill="#FFFFFF"/>
      <circle cx="58" cy="38.5" r="1.5" fill="#4A3728"/>
      <ellipse cx="31" cy="46.5" rx="4.2" ry="2.9" fill="#FF94C2" opacity="0.82"/>
      <ellipse cx="65" cy="46.5" rx="4.2" ry="2.9" fill="#FF94C2" opacity="0.82"/>
      <ellipse cx="48" cy="44" rx="3.8" ry="2.6" fill="#3B322C"/>
      <path d="M43 48.5Q48 52.5 53 48.5" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <rect x="75" y="29" width="6.5" height="50" rx="3.2" fill="#51CF66" stroke="#4A3728" stroke-width="2.8"/>
      <line x1="75" y1="45" x2="81.5" y2="45" stroke="#2F9E44" stroke-width="2.6"/>
      <line x1="75" y1="62" x2="81.5" y2="62" stroke="#2F9E44" stroke-width="2.6"/>
      <ellipse cx="86" cy="35" rx="7.5" ry="3.8" transform="rotate(-28 86 35)" fill="#69DB7C" stroke="#4A3728" stroke-width="2.4"/>
      <ellipse cx="86" cy="51" rx="7" ry="3.4" transform="rotate(20 86 51)" fill="#69DB7C" stroke="#4A3728" stroke-width="2.4"/>
      <ellipse cx="70" cy="64" rx="7" ry="5.5" transform="rotate(20 70 64)" fill="#3B322C" stroke="#4A3728" stroke-width="3"/>
    `,

    // =========================================================================
    // 2. MAGIC (童话魔法 — 6 buddies)
    // =========================================================================

    wizard: () => `
      <ellipse class="ground-shadow" cx="48" cy="91" rx="25" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      ${chickFeet(39, 57, 80, 89)}
      <line x1="70" y1="64" x2="85" y2="40" stroke="#8D5524" stroke-width="3.8" stroke-linecap="round"/>
      ${starPoly(86, 35, 8.2, '#FFD43B', '#4A3728', 2.2)}
      <circle cx="76" cy="24" r="2.4" fill="#FFE066"/>
      <circle cx="90" cy="49" r="2.1" fill="#B197FC"/>
      <ellipse cx="21" cy="62" rx="8" ry="10.5" transform="rotate(24 21 62)" fill="#FFE680" stroke="#4A3728" stroke-width="3.6"/>
      <ellipse cx="73" cy="62" rx="8" ry="10.5" transform="rotate(-24 73 62)" fill="#FFE680" stroke="#4A3728" stroke-width="3.6"/>
      <circle cx="48" cy="60" r="24.5" fill="#FFE680" stroke="#4A3728" stroke-width="4"/>
      <path d="M29 69Q48 80 67 69L63 79Q48 86 33 79Z" fill="#9C6ADE" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
      <circle cx="48" cy="75" r="4.2" fill="#FFD43B" stroke="#4A3728" stroke-width="2.2"/>
      ${chickFace(48, 55, 9, '#FF85B3', 59)}
      <ellipse cx="48" cy="38" rx="26" ry="7.2" fill="#7950F2" stroke="#4A3728" stroke-width="3.6"/>
      <path d="M28 37C31 17 44 8 60 7C56 16 60 25 68 37Z" fill="#9C6ADE" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
      <path d="M29 35Q48 41 67 35" stroke="#FFD43B" stroke-width="4.5" stroke-linecap="round"/>
      ${starPoly(47, 23, 5, '#FFE066', '#4A3728', 1.5)}
      <circle cx="38" cy="27" r="2" fill="#FFF3BF"/>
      <circle cx="55" cy="25" r="1.9" fill="#FFF3BF"/>
    `,

    rainbow: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="27" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      ${chickFeet(41, 59, 80, 89)}
      <ellipse cx="17" cy="49" rx="12.5" ry="7.6" transform="rotate(-18 17 49)" fill="#FF7EB6" stroke="#4A3728" stroke-width="3.2"/>
      <ellipse cx="16" cy="58" rx="11.5" ry="7" transform="rotate(4 16 58)" fill="#FFE066" stroke="#4A3728" stroke-width="3.2"/>
      <ellipse cx="20" cy="66" rx="10.5" ry="6.4" transform="rotate(22 20 66)" fill="#74C0FC" stroke="#4A3728" stroke-width="3.2"/>
      <ellipse cx="83" cy="49" rx="12.5" ry="7.6" transform="rotate(18 83 49)" fill="#FFA94D" stroke="#4A3728" stroke-width="3.2"/>
      <ellipse cx="84" cy="58" rx="11.5" ry="7" transform="rotate(-4 84 58)" fill="#69DB7C" stroke="#4A3728" stroke-width="3.2"/>
      <ellipse cx="80" cy="66" rx="10.5" ry="6.4" transform="rotate(-22 80 66)" fill="#B197FC" stroke="#4A3728" stroke-width="3.2"/>
      <path d="M41 32C37 20 44 16 47 27" fill="#FF7EB6" stroke="#4A3728" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M47 30C47 17 55 17 54 30" fill="#FFE066" stroke="#4A3728" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M53 31C57 19 64 22 59 33" fill="#74C0FC" stroke="#4A3728" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="50" cy="56" r="25.5" fill="#FFF4FA" stroke="#4A3728" stroke-width="4.2"/>
      ${chickFace(50, 51, 10, '#FF85C0', 56)}
      ${heartSvg(50, 72, 12, '#FF7EB6', '#4A3728', 2)}
      ${sparklePoly(18, 24, 5.5, '#FFE066', '#F59F00', 1.2)}
      ${sparklePoly(82, 24, 5, '#FFF3BF', '#F59F00', 1.2)}
    `,

    unicorn: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="26" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      ${chickFeet(41, 59, 80, 89)}
      <path d="M27 56C12 46 8 60 18 67C13 70 18 76 29 70Z" fill="#D0BFFF" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M73 56C88 46 92 60 82 67C87 70 82 76 71 70Z" fill="#A5D8FF" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
      <polygon points="31,42 26,23 41,33" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
      <polygon points="33,38 30,28 38,34" fill="#FF9EC7"/>
      <polygon points="69,42 74,23 59,33" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
      <polygon points="67,38 70,28 62,34" fill="#FF9EC7"/>
      <circle cx="50" cy="60" r="24.5" fill="#FAF2FF" stroke="#4A3728" stroke-width="4"/>
      <path d="M42 36L50 7L58 36Z" fill="#FFE066" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
      <path d="M44 28L56 25" stroke="#FF85C0" stroke-width="3" stroke-linecap="round"/>
      <path d="M46 21L54 18.5" stroke="#74C0FC" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M48 14L52 13" stroke="#B197FC" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="40" cy="36" r="5" fill="#FF9EC7" stroke="#4A3728" stroke-width="2.4"/>
      <circle cx="50" cy="34" r="5.5" fill="#74C0FC" stroke="#4A3728" stroke-width="2.4"/>
      <circle cx="60" cy="36" r="5" fill="#69DB7C" stroke="#4A3728" stroke-width="2.4"/>
      ${chickFace(50, 56, 9.5, '#FF9EC7', 60)}
      ${starPoly(50, 75, 5.5, '#C490FF', '#4A3728', 1.8)}
      ${sparklePoly(20, 22, 5.2, '#FFE066', '#F59F00', 1.2)}
      ${sparklePoly(82, 24, 4.6, '#FFE066', '#F59F00', 1.2)}
    `,

    fairy: () => `
      <ellipse class="ground-shadow" cx="48" cy="91" rx="25" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      ${chickFeet(39, 57, 80, 89)}
      <path d="M32 54C12 34 7 50 18 60C9 66 15 80 32 70Z" fill="#B2F2BB" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
      <circle cx="19" cy="52" r="3" fill="#FFF9DB"/>
      <path d="M64 54C84 34 89 50 78 60C87 66 81 80 64 70Z" fill="#FFC9E3" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
      <circle cx="77" cy="52" r="3" fill="#FFF9DB"/>
      <line x1="71" y1="67" x2="86" y2="45" stroke="#51CF66" stroke-width="3.4" stroke-linecap="round"/>
      <circle cx="86" cy="40" r="4" fill="#FF85C0" stroke="#4A3728" stroke-width="1.8"/>
      <circle cx="91" cy="44" r="4" fill="#FF85C0" stroke="#4A3728" stroke-width="1.8"/>
      <circle cx="86" cy="48" r="4" fill="#FF85C0" stroke="#4A3728" stroke-width="1.8"/>
      <circle cx="81" cy="44" r="4" fill="#FF85C0" stroke="#4A3728" stroke-width="1.8"/>
      <circle cx="86" cy="44" r="3.4" fill="#FFE066" stroke="#4A3728" stroke-width="1.6"/>
      <circle cx="48" cy="60" r="23.5" fill="#FFF0A8" stroke="#4A3728" stroke-width="4"/>
      <path d="M27 67L35 76L43 69L48 78L53 69L61 76L69 67C65 78 58 83 48 83C38 83 31 78 27 67Z" fill="#69DB7C" stroke="#4A3728" stroke-width="3" stroke-linejoin="round"/>
      ${chickFace(48, 54, 9, '#FF85B3', 58)}
      <path d="M24 41C25 25 36 18 48 18C60 18 71 25 72 41C65 34 57 38 48 33C39 38 31 34 24 41Z" fill="#FF85C0" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
      <path d="M40 21L48 15L56 21L52 24L48 20L44 24Z" fill="#51CF66" stroke="#4A3728" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M48 17C48 11 53 9 56 12" stroke="#3F9A29" stroke-width="3.2" stroke-linecap="round"/>
      ${sparklePoly(18, 25, 4.8, '#FFE066', '#F59F00', 1.2)}
    `,

    princess: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="28" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      <ellipse cx="40" cy="88" rx="6.5" ry="4" fill="#FF6B9D" stroke="#4A3728" stroke-width="2.8"/>
      <ellipse cx="60" cy="88" rx="6.5" ry="4" fill="#FF6B9D" stroke="#4A3728" stroke-width="2.8"/>
      <line x1="76" y1="67" x2="84" y2="44" stroke="#F59F00" stroke-width="3.4" stroke-linecap="round"/>
      ${heartSvg(85, 39, 13, '#FF6B9D', '#4A3728', 2.2)}
      <ellipse cx="25" cy="59" rx="7.5" ry="10" transform="rotate(24 25 59)" fill="#FFF5F9" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="75" cy="59" rx="7.5" ry="10" transform="rotate(-24 75 59)" fill="#FFF5F9" stroke="#4A3728" stroke-width="3.4"/>
      <path d="M29 63L20 86Q50 93 80 86L71 63Z" fill="#FF85C0" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
      <path d="M28 65Q39 76 50 67Q61 76 72 65L76 76Q63 83 50 76Q37 83 24 76Z" fill="#FFC9E3" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
      <circle cx="50" cy="50" r="22" fill="#FFF5F9" stroke="#4A3728" stroke-width="4"/>
      ${chickFace(50, 48, 8.8, '#FF94C2', 52)}
      <circle cx="42" cy="65" r="2.4" fill="#FFFFFF" stroke="#4A3728" stroke-width="1.4"/>
      <circle cx="47.3" cy="66.8" r="2.4" fill="#FFFFFF" stroke="#4A3728" stroke-width="1.4"/>
      <circle cx="52.7" cy="66.8" r="2.4" fill="#FFFFFF" stroke="#4A3728" stroke-width="1.4"/>
      <circle cx="58" cy="65" r="2.4" fill="#FFFFFF" stroke="#4A3728" stroke-width="1.4"/>
      <path d="M34 31L33 14L43 22L50 10L57 22L67 14L66 31Q50 35 34 31Z" fill="#FFD43B" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
      <circle cx="33" cy="13" r="2.8" fill="#FFE066" stroke="#4A3728" stroke-width="2"/>
      <circle cx="50" cy="9.5" r="3.2" fill="#FFE066" stroke="#4A3728" stroke-width="2"/>
      <circle cx="67" cy="13" r="2.8" fill="#FFE066" stroke="#4A3728" stroke-width="2"/>
      <circle cx="50" cy="24" r="3.2" fill="#FF4D5E" stroke="#4A3728" stroke-width="1.8"/>
      <circle cx="41" cy="25" r="2.2" fill="#74C0FC" stroke="#4A3728" stroke-width="1.6"/>
      <circle cx="59" cy="25" r="2.2" fill="#74C0FC" stroke="#4A3728" stroke-width="1.6"/>
    `,

    mermaid: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="29" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      <path d="M76 74C84 64 94 68 92 77C91 81 85 82 81 80C87 84 89 91 80 91C73 91 71 84 73 79Z" fill="#63E6BE" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M27 61C25 78 39 88 57 88C68 88 76 84 79 78C72 72 67 66 64 60Z" fill="#38D9A9" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
      <path d="M36 74Q41 79 46 74M48 75Q53 80 58 75M42 82Q47 86 52 82" stroke="#12B886" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <ellipse cx="22" cy="56" rx="7.5" ry="10" transform="rotate(24 22 56)" fill="#FFF3B0" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="70" cy="56" rx="7.5" ry="10" transform="rotate(-24 70 56)" fill="#FFF3B0" stroke="#4A3728" stroke-width="3.4"/>
      <circle cx="46" cy="50" r="22.5" fill="#FFF3B0" stroke="#4A3728" stroke-width="4"/>
      ${chickFace(46, 47, 8.8, '#FF85B3', 51)}
      <ellipse cx="39" cy="65" rx="6" ry="4.5" fill="#D0BFFF" stroke="#4A3728" stroke-width="2.2"/>
      <ellipse cx="53" cy="65" rx="6" ry="4.5" fill="#D0BFFF" stroke="#4A3728" stroke-width="2.2"/>
      <path d="M34 30C36 18 46 15 46 27C46 15 56 18 58 30Q46 33 34 30Z" fill="#FF85C0" stroke="#4A3728" stroke-width="2.8" stroke-linejoin="round"/>
      <circle cx="46" cy="27" r="3.4" fill="#FFF9DB" stroke="#4A3728" stroke-width="1.8"/>
      <circle cx="17" cy="30" r="6" fill="#E3F6FF" stroke="#38B6FF" stroke-width="2.2"/>
      <circle cx="15" cy="28" r="1.6" fill="#FFFFFF"/>
      <circle cx="82" cy="26" r="7" fill="#E3F6FF" stroke="#38B6FF" stroke-width="2.2"/>
      <circle cx="80" cy="24" r="2" fill="#FFFFFF"/>
      <circle cx="86" cy="43" r="4.2" fill="#E3F6FF" stroke="#38B6FF" stroke-width="2"/>
    `,

    // =========================================================================
    // 3. FOOD (甜蜜美食 — 6 buddies)
    // =========================================================================

    strawberry: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="25" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      ${chickFeet(41, 59, 80, 89)}
      <ellipse cx="22" cy="59" rx="7.5" ry="10.5" transform="rotate(24 22 59)" fill="#FF5D6C" stroke="#4A3728" stroke-width="3.6"/>
      <ellipse cx="78" cy="59" rx="7.5" ry="10.5" transform="rotate(-24 78 59)" fill="#FF5D6C" stroke="#4A3728" stroke-width="3.6"/>
      <path d="M24 54C23 36 35 29 50 29C65 29 77 36 76 54C75 73 63 85 50 86C37 85 25 73 24 54Z" fill="#FF5D6C" stroke="#4A3728" stroke-width="4" stroke-linejoin="round"/>
      <ellipse cx="50" cy="56" rx="18" ry="14.5" fill="#FFF3B0" stroke="#4A3728" stroke-width="3"/>
      ${chickFace(50, 54, 7.6, '#FF85B3', 57)}
      <ellipse cx="32" cy="72" rx="1.6" ry="2.4" fill="#FFE066"/>
      <ellipse cx="42" cy="78" rx="1.6" ry="2.4" fill="#FFE066"/>
      <ellipse cx="58" cy="78" rx="1.6" ry="2.4" fill="#FFE066"/>
      <ellipse cx="68" cy="72" rx="1.6" ry="2.4" fill="#FFE066"/>
      <ellipse cx="29" cy="46" rx="1.5" ry="2.2" fill="#FFE066"/>
      <ellipse cx="71" cy="46" rx="1.5" ry="2.2" fill="#FFE066"/>
      <path d="M27 36L38 41L45 34L50 42L55 34L62 41L73 36L64 28L50 32L36 28Z" fill="#51CF66" stroke="#4A3728" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M35 30C33 21 43 17 50 18C57 17 67 21 65 30Q50 34 35 30Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M44 19C42 11 50 8 50 8C50 8 58 11 56 19C54 23 46 23 44 19Z" fill="#FF5D6C" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M46 11L50 14L54 11" stroke="#51CF66" stroke-width="2.6" stroke-linecap="round"/>
    `,

    cupcake: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="26" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      <ellipse cx="24" cy="55" rx="7.5" ry="9.5" transform="rotate(24 24 55)" fill="#FFE680" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="76" cy="55" rx="7.5" ry="9.5" transform="rotate(-24 76 55)" fill="#FFE680" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="50" cy="52" rx="22" ry="18" fill="#FFE680" stroke="#4A3728" stroke-width="4"/>
      ${chickFace(50, 50, 8.5, '#FF85B3', 53)}
      <path d="M26 62L33 88H67L74 62Z" fill="#FF94C2" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
      <path d="M37 63L41 88M50 63V88M63 63L59 88" stroke="#E65C9C" stroke-width="3" stroke-linecap="round"/>
      <path d="M24 62Q31 68 38 62Q44 68 50 62Q56 68 62 62Q69 68 76 62" fill="#FFD6E8" stroke="#4A3728" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M27 39C25 27 36 22 50 22C64 22 75 27 73 39Q61 44 50 39Q39 44 27 39Z" fill="#FFC9E3" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
      <path d="M34 27C35 17 44 14 50 14C56 14 65 17 66 27Q50 32 34 27Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
      <line x1="36" y1="33" x2="40" y2="35" stroke="#74C0FC" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="59" y1="32" x2="64" y2="34" stroke="#FFE066" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="48" y1="23" x2="52" y2="21" stroke="#69DB7C" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="50" cy="13" r="5.5" fill="#FF4D5E" stroke="#4A3728" stroke-width="2.6"/>
      <circle cx="48.2" cy="11.2" r="1.4" fill="#FFFFFF"/>
      <path d="M51 8C53 5 57 5 59 7" stroke="#3F9A29" stroke-width="2.4" stroke-linecap="round"/>
    `,

    donut: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="27" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      ${chickFeet(41, 59, 81, 89)}
      <circle cx="50" cy="54" r="32" fill="#F6C270" stroke="#4A3728" stroke-width="4.2"/>
      <path d="M22 44C25 28 38 22 50 22C62 22 75 28 78 44C80 54 78 61 73 62C68 63 67 57 62 59C58 61 57 67 50 67C43 67 42 61 38 59C33 57 32 63 27 62C22 61 20 54 22 44Z" fill="#F783AC" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
      <line x1="34" y1="32" x2="39" y2="30" stroke="#FFE066" stroke-width="3" stroke-linecap="round"/>
      <line x1="59" y1="30" x2="64" y2="33" stroke="#74C0FC" stroke-width="3" stroke-linecap="round"/>
      <line x1="27" y1="47" x2="31" y2="51" stroke="#69DB7C" stroke-width="3" stroke-linecap="round"/>
      <line x1="70" y1="46" x2="73" y2="51" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <line x1="48" y1="27" x2="53" y2="27" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round"/>
      <circle cx="50" cy="54" r="18.5" fill="#FFE066" stroke="#4A3728" stroke-width="3.8"/>
      <path d="M45 36C44 29 50 29 51 35C54 30 58 32 54 36" fill="#FFE066" stroke="#4A3728" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      ${chickFace(50, 52, 7.2, '#FF85B3', 55)}
      <ellipse cx="29" cy="61" rx="6" ry="4.8" transform="rotate(-24 29 61)" fill="#FFE066" stroke="#4A3728" stroke-width="3"/>
      <ellipse cx="71" cy="61" rx="6" ry="4.8" transform="rotate(24 71 61)" fill="#FFE066" stroke="#4A3728" stroke-width="3"/>
    `,

    icecream: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="23" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      ${chickFeet(43, 57, 81, 89)}
      <path d="M30 61L50 88L70 61Z" fill="#F6C270" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
      <path d="M37 63L55 81M46 62L61 75M63 63L45 81M54 62L39 75" stroke="#D18E3A" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="25" cy="53" rx="7" ry="9" transform="rotate(22 25 53)" fill="#FFF9DB" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="75" cy="53" rx="7" ry="9" transform="rotate(-22 75 53)" fill="#FFF9DB" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="50" cy="51" rx="21.5" ry="17" fill="#FFF9DB" stroke="#4A3728" stroke-width="4"/>
      ${chickFace(50, 49, 8.2, '#FF94C2', 52)}
      <rect x="63" y="13" width="7.5" height="19" rx="3" transform="rotate(26 67 22)" fill="#E8A85A" stroke="#4A3728" stroke-width="2.6"/>
      <path d="M27 38C27 25 38 20 50 20C62 20 73 25 73 38C68 42 63 37 58 41C53 44 47 44 42 41C37 37 32 42 27 38Z" fill="#74C0FC" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
      <path d="M36 25C37 14 44 11 50 11C56 11 63 14 64 25Q50 30 36 25Z" fill="#FFB3D9" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
      <circle cx="50" cy="11" r="4.8" fill="#FF4D5E" stroke="#4A3728" stroke-width="2.4"/>
      <circle cx="48.5" cy="9.5" r="1.2" fill="#FFFFFF"/>
    `,

    peach: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="26" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      ${chickFeet(41, 59, 80, 89)}
      <ellipse cx="40" cy="19" rx="11" ry="5.5" transform="rotate(-28 40 19)" fill="#51CF66" stroke="#4A3728" stroke-width="3"/>
      <ellipse cx="61" cy="19" rx="11" ry="5.5" transform="rotate(28 61 19)" fill="#69DB7C" stroke="#4A3728" stroke-width="3"/>
      <path d="M50 28V16" stroke="#6B4423" stroke-width="3.6" stroke-linecap="round"/>
      <ellipse cx="20" cy="57" rx="7.5" ry="10.5" transform="rotate(22 20 57)" fill="#FFA8A8" stroke="#4A3728" stroke-width="3.6"/>
      <ellipse cx="80" cy="57" rx="7.5" ry="10.5" transform="rotate(-22 80 57)" fill="#FFA8A8" stroke="#4A3728" stroke-width="3.6"/>
      <path d="M50 29C32 21 19 37 22 58C24 76 38 85 50 85C62 85 76 76 78 58C81 37 68 21 50 29Z" fill="#FFC9C9" stroke="#4A3728" stroke-width="4" stroke-linejoin="round"/>
      <path d="M26 60C30 75 40 82 50 82C60 82 70 75 74 60C66 67 58 70 50 70C42 70 34 67 26 60Z" fill="#FFA8A8" opacity="0.72"/>
      <ellipse cx="36" cy="39" rx="4.5" ry="7.5" transform="rotate(25 36 39)" fill="#FFFFFF" opacity="0.5"/>
      ${chickFace(50, 53, 9.5, '#FF6B8B', 57)}
      ${sparklePoly(80, 28, 4.6, '#FFF3BF', '#F59F00', 1.2)}
    `,

    pudding: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="29" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      <ellipse cx="50" cy="83" rx="34" ry="8.5" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.6"/>
      <ellipse cx="50" cy="83" rx="26" ry="5" fill="#E3F6FF"/>
      <ellipse cx="23" cy="60" rx="7" ry="9.5" transform="rotate(24 23 60)" fill="#FFE066" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="77" cy="60" rx="7" ry="9.5" transform="rotate(-24 77 60)" fill="#FFE066" stroke="#4A3728" stroke-width="3.4"/>
      <path d="M26 78C26 53 33 31 50 31C67 31 74 53 74 78Q50 85 26 78Z" fill="#FFE066" stroke="#4A3728" stroke-width="4" stroke-linejoin="round"/>
      <path d="M31 44C33 30 67 30 69 44C65 48 61 42 57 47C53 51 47 44 43 48C39 52 34 46 31 44Z" fill="#B8621B" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
      <ellipse cx="42" cy="37" rx="5.5" ry="2.2" transform="rotate(-12 42 37)" fill="#E69A52" opacity="0.65"/>
      ${chickFace(50, 59, 9, '#FF85B3', 63)}
      <path d="M39 30C38 22 45 19 50 19C55 19 62 22 61 30Q50 33 39 30Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="50" cy="16" r="5.2" fill="#FF4D5E" stroke="#4A3728" stroke-width="2.5"/>
      <circle cx="48.5" cy="14.5" r="1.3" fill="#FFFFFF"/>
      <path d="M51 11C53 8 56 8 58 10" stroke="#3F9A29" stroke-width="2.3" stroke-linecap="round"/>
    `,

    // =========================================================================
    // 4. ADVENTURE (职业星空 — 6 buddies)
    // =========================================================================

    astronaut: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="26" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      <rect x="24" y="54" width="52" height="24" rx="10" fill="#4DABF7" stroke="#4A3728" stroke-width="3.4"/>
      <rect x="34" y="77" width="12" height="12" rx="5.5" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.4"/>
      <rect x="54" y="77" width="12" height="12" rx="5.5" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.4"/>
      <rect x="34" y="84" width="12" height="5" rx="2.5" fill="#4DABF7" stroke="#4A3728" stroke-width="2"/>
      <rect x="54" y="84" width="12" height="5" rx="2.5" fill="#4DABF7" stroke="#4A3728" stroke-width="2"/>
      <ellipse cx="24" cy="67" rx="7.5" ry="9" transform="rotate(24 24 67)" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="76" cy="67" rx="7.5" ry="9" transform="rotate(-24 76 67)" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.4"/>
      <ellipse cx="50" cy="69" rx="21" ry="15" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.8"/>
      <rect x="40" y="65" width="20" height="12" rx="4" fill="#4DABF7" stroke="#4A3728" stroke-width="2.4"/>
      <circle cx="45" cy="71" r="2.2" fill="#FF5D6C"/>
      <circle cx="50" cy="71" r="2.2" fill="#FFE066"/>
      <circle cx="55" cy="71" r="2.2" fill="#69DB7C"/>
      <line x1="50" y1="18" x2="50" y2="11" stroke="#4A3728" stroke-width="3.2" stroke-linecap="round"/>
      ${starPoly(50, 9.5, 5.2, '#FFD43B', '#4A3728', 1.8)}
      <circle cx="50" cy="42" r="24.5" fill="#E3F6FF" stroke="#4A3728" stroke-width="3.8"/>
      <circle cx="50" cy="44" r="18" fill="#FFE066" stroke="#4A3728" stroke-width="3.4"/>
      ${chickFace(50, 42, 7.2, '#FF85B3', 45)}
      <path d="M33 32A19 19 0 0 1 48 22" stroke="#FFFFFF" stroke-width="3.8" stroke-linecap="round" opacity="0.85"/>
      <path d="M32 58Q50 66 68 58" stroke="#4DABF7" stroke-width="4.8" stroke-linecap="round"/>
      ${sparklePoly(84, 22, 4.8, '#FFE066', '#F59F00', 1.2)}
    `,

    doctor: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="26" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      ${chickFeet(41, 59, 80, 89)}
      <ellipse cx="22" cy="65" rx="7.5" ry="10.5" transform="rotate(24 22 65)" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.6"/>
      <ellipse cx="78" cy="65" rx="7.5" ry="10.5" transform="rotate(-24 78 65)" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.6"/>
      <path d="M27 59C27 50 73 50 73 59L75 82Q50 88 25 82Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
      <line x1="50" y1="60" x2="50" y2="85" stroke="#CBD5E1" stroke-width="2.6"/>
      <rect x="55" y="70" width="12" height="9" rx="2.5" fill="#EEF8FF" stroke="#4A3728" stroke-width="2"/>
      <path d="M61 72V77M58.5 74.5H63.5" stroke="#FF6B6B" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="50" cy="43" r="21.5" fill="#FFE680" stroke="#4A3728" stroke-width="4"/>
      ${chickFace(50, 42, 8.6, '#FF85B3', 46)}
      <path d="M30 33Q50 24 70 33" stroke="#74C0FC" stroke-width="5.2" stroke-linecap="round" fill="none"/>
      <circle cx="50" cy="23" r="8.5" fill="#FFFFFF" stroke="#4A3728" stroke-width="3"/>
      <path d="M50 18.5V27.5M45.5 23H54.5" stroke="#FF6B6B" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M36 57C34 71 42 78 50 77C58 76 66 71 64 57" stroke="#339AF0" stroke-width="3.8" stroke-linecap="round" fill="none"/>
      ${heartSvg(50, 77, 11, '#FF6B6B', '#4A3728', 2)}
    `,

    chef: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="26" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      ${chickFeet(41, 59, 80, 89)}
      <line x1="74" y1="66" x2="84" y2="50" stroke="#C88A3B" stroke-width="3.6" stroke-linecap="round"/>
      <ellipse cx="86" cy="46" rx="5.5" ry="7" transform="rotate(26 86 46)" fill="#E6B88A" stroke="#4A3728" stroke-width="2.6"/>
      <ellipse cx="22" cy="64" rx="7.5" ry="10" transform="rotate(24 22 64)" fill="#FFE680" stroke="#4A3728" stroke-width="3.6"/>
      <ellipse cx="78" cy="64" rx="7.5" ry="10" transform="rotate(-24 78 64)" fill="#FFE680" stroke="#4A3728" stroke-width="3.6"/>
      <ellipse cx="50" cy="67" rx="23" ry="18" fill="#FFE680" stroke="#4A3728" stroke-width="4"/>
      <path d="M33 61H67L69 83Q50 88 31 83Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
      <circle cx="44" cy="70" r="2.2" fill="#4A3728"/>
      <circle cx="56" cy="70" r="2.2" fill="#4A3728"/>
      <circle cx="44" cy="77" r="2.2" fill="#4A3728"/>
      <circle cx="56" cy="77" r="2.2" fill="#4A3728"/>
      <circle cx="50" cy="49" r="20.5" fill="#FFE680" stroke="#4A3728" stroke-width="4"/>
      ${chickFace(50, 48, 8.4, '#FF85B3', 52)}
      <path d="M39 62L50 68L61 62L55 58L50 62L45 58Z" fill="#FF6B6B" stroke="#4A3728" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M31 35C24 28 28 16 39 17C42 9 58 9 61 17C72 16 76 28 69 35Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
      <rect x="32" y="31" width="36" height="8" rx="3" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.2"/>
      <line x1="34" y1="35" x2="66" y2="35" stroke="#FFB74D" stroke-width="3"/>
    `,

    firefighter: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="26" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      <rect x="35" y="78" width="11" height="11" rx="5" fill="#4A3728" stroke="#4A3728" stroke-width="2.6"/>
      <rect x="54" y="78" width="11" height="11" rx="5" fill="#4A3728" stroke="#4A3728" stroke-width="2.6"/>
      <line x1="36" y1="81" x2="45" y2="81" stroke="#FFE066" stroke-width="2.5"/>
      <line x1="55" y1="81" x2="64" y2="81" stroke="#FFE066" stroke-width="2.5"/>
      <path d="M76 62L84 56" stroke="#ADB5BD" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M76 62L84 56" stroke="#4A3728" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M87 52C91 48 94 50 92 54" stroke="#38B6FF" stroke-width="3" stroke-linecap="round" fill="none"/>
      <circle cx="91" cy="46" r="2.6" fill="#74C0FC"/>
      <circle cx="93" cy="58" r="2.2" fill="#74C0FC"/>
      <ellipse cx="23" cy="64" rx="7.5" ry="10" transform="rotate(24 23 64)" fill="#FF5252" stroke="#4A3728" stroke-width="3.6"/>
      <ellipse cx="77" cy="64" rx="7.5" ry="10" transform="rotate(-24 77 64)" fill="#FF5252" stroke="#4A3728" stroke-width="3.6"/>
      <path d="M27 59C27 51 73 51 73 59L75 82Q50 87 25 82Z" fill="#FF5252" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
      <rect x="27" y="71" width="46" height="6" rx="2" fill="#FFE066" stroke="#4A3728" stroke-width="2"/>
      <circle cx="50" cy="47" r="20.5" fill="#FFE066" stroke="#4A3728" stroke-width="4"/>
      ${chickFace(50, 46, 8.4, '#FF85B3', 50)}
      <path d="M23 36Q50 42 77 36L72 30H28Z" fill="#E03131" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
      <path d="M29 33C29 17 38 11 50 11C62 11 71 17 71 33Z" fill="#FF5252" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
      <path d="M43 19H57V27L50 32L43 27Z" fill="#FFD43B" stroke="#4A3728" stroke-width="2.4" stroke-linejoin="round"/>
      <circle cx="50" cy="24.5" r="2.4" fill="#FF5252"/>
    `,

    pirate: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="26" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      <rect x="35" y="78" width="11" height="11" rx="5" fill="#8D6E63" stroke="#4A3728" stroke-width="3"/>
      <rect x="54" y="78" width="11" height="11" rx="5" fill="#8D6E63" stroke="#4A3728" stroke-width="3"/>
      <path d="M72 60L89 47L93 52L75 65Z" fill="#FFD43B" stroke="#4A3728" stroke-width="2.8" stroke-linejoin="round"/>
      <line x1="80" y1="54" x2="84" y2="59" stroke="#C87B00" stroke-width="2.4"/>
      <ellipse cx="22" cy="64" rx="7.5" ry="10" transform="rotate(24 22 64)" fill="#FFE680" stroke="#4A3728" stroke-width="3.6"/>
      <ellipse cx="77" cy="64" rx="7.5" ry="10" transform="rotate(-24 77 64)" fill="#FFE680" stroke="#4A3728" stroke-width="3.6"/>
      <ellipse cx="50" cy="68" rx="23" ry="17" fill="#FFFFFF" stroke="#4A3728" stroke-width="4"/>
      <path d="M29 63H71M28 70H72M31 77H69" stroke="#FF6B6B" stroke-width="4.2" stroke-linecap="round"/>
      <rect x="28" y="72" width="44" height="6" rx="2" fill="#6D4C41" stroke="#4A3728" stroke-width="2.2"/>
      <rect x="45" y="71" width="10" height="8" rx="2" fill="#FFD43B" stroke="#4A3728" stroke-width="2"/>
      <circle cx="50" cy="48" r="20.5" fill="#FFE680" stroke="#4A3728" stroke-width="4"/>
      <path d="M31 38Q50 32 69 38" stroke="#FF5D6C" stroke-width="5.5" stroke-linecap="round"/>
      ${chickFace(50, 47, 8.4, '#FF85B3', 51)}
      <path d="M20 35C22 22 33 17 42 20C45 12 55 12 58 20C67 17 78 22 80 35Q50 40 20 35Z" fill="#5C4033" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
      <path d="M24 33Q50 38 76 33" stroke="#FFD43B" stroke-width="3.4" stroke-linecap="round"/>
      ${starPoly(50, 24, 5.8, '#FFD43B', '#4A3728', 1.8)}
    `,

    painter: () => `
      <ellipse class="ground-shadow" cx="50" cy="91" rx="26" ry="5.5" fill="#4B9A29" opacity="0.24"/>
      ${chickFeet(41, 59, 80, 89)}
      <line x1="76" y1="65" x2="88" y2="45" stroke="#C88A3B" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M87 43C90 38 95 39 93 45C91 49 86 48 87 43Z" fill="#FF7EB6" stroke="#4A3728" stroke-width="2.2" stroke-linejoin="round"/>
      <ellipse cx="77" cy="64" rx="7.5" ry="10" transform="rotate(-24 77 64)" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.6"/>
      <path d="M27 59C27 51 73 51 73 59L75 82Q50 87 25 82Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
      <circle cx="38" cy="70" r="3.4" fill="#FF5D6C"/>
      <circle cx="51" cy="76" r="3.6" fill="#FFD43B"/>
      <circle cx="62" cy="69" r="3.2" fill="#74C0FC"/>
      <circle cx="46" cy="65" r="2.6" fill="#69DB7C"/>
      <circle cx="50" cy="46" r="20.5" fill="#FFE680" stroke="#4A3728" stroke-width="4"/>
      ${chickFace(50, 45, 8.4, '#FF85B3', 49)}
      <path d="M26 34C22 20 38 12 56 14C73 16 79 25 74 34Q50 40 26 34Z" fill="#9775FA" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
      <path d="M29 33Q50 38 71 33" stroke="#7950F2" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M51 15C51 10 55 8 58 9" stroke="#4A3728" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M12 63C12 54 24 51 31 58C35 63 32 74 23 75C16 76 12 70 12 63Z" fill="#E6B88A" stroke="#4A3728" stroke-width="3"/>
      <circle cx="18" cy="60" r="2.6" fill="#FF5D6C"/>
      <circle cx="25" cy="60" r="2.6" fill="#FFD43B"/>
      <circle cx="17" cy="68" r="2.6" fill="#74C0FC"/>
      <circle cx="24" cy="69" r="2.6" fill="#51CF66"/>
    `
  };

  function renderRareBuddySVG({ size = 88, buddyId = 'dino' } = {}) {
    const renderer = BUDDY_RENDERERS[buddyId] || BUDDY_RENDERERS.dino;
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none">
        ${renderer()}
      </svg>
    `;
  }

  HMC.svgBuddies = {
    BUDDY_RENDERERS,
    renderRareBuddySVG
  };
})(window.HMC = window.HMC || {});
