(function (HMC) {
  'use strict';

  function starPoly(cx, cy, r, fill, stroke = '#4A3728', sw = 2.4) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rad = (i % 2 === 0 ? r : r * 0.45);
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

  function heartD(cx, cy, size) {
    const r = size / 2;
    return `M${cx} ${(cy + r * 0.95).toFixed(1)} C${(cx - r * 1.35).toFixed(1)} ${(cy + r * 0.15).toFixed(1)} ${(cx - r * 1.1).toFixed(1)} ${(cy - r * 0.95).toFixed(1)} ${cx} ${(cy - r * 0.25).toFixed(1)} C${(cx + r * 1.1).toFixed(1)} ${(cy - r * 0.95).toFixed(1)} ${(cx + r * 1.35).toFixed(1)} ${(cy + r * 0.15).toFixed(1)} ${cx} ${(cy + r * 0.95).toFixed(1)} Z`;
  }

  function miniBlossom(cx, cy, petalFill, centerFill, pr = 4.6) {
    const dist = pr * 1.18;
    const petals = [];
    for (let i = 0; i < 5; i++) {
      const ang = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const px = (cx + Math.cos(ang) * dist).toFixed(1);
      const py = (cy + Math.sin(ang) * dist).toFixed(1);
      petals.push(`<circle cx="${px}" cy="${py}" r="${pr.toFixed(1)}" fill="${petalFill}" stroke="#4A3728" stroke-width="2"/>`);
    }
    return petals.join('') + `<circle cx="${cx}" cy="${cy}" r="${(pr * 0.85).toFixed(1)}" fill="${centerFill}" stroke="#4A3728" stroke-width="1.9"/>`;
  }

  // =====================
  // 1. HEAD (6 items)
  // =====================
  const HEAD_RENDERERS = {
    head_flower: () => `
      <g class="chicken-acc chicken-acc-head-flower">
        <path d="M47 39Q80 24 113 39" stroke="#3F9A29" stroke-width="6.4" stroke-linecap="round" fill="none"/>
        <path d="M47 39Q80 24 113 39" stroke="#51CF66" stroke-width="3" stroke-linecap="round" fill="none"/>
        <ellipse cx="47" cy="39" rx="6" ry="3.2" transform="rotate(-28 47 39)" fill="#69DB7C" stroke="#4A3728" stroke-width="2.2"/>
        <ellipse cx="113" cy="39" rx="6" ry="3.2" transform="rotate(28 113 39)" fill="#69DB7C" stroke="#4A3728" stroke-width="2.2"/>
        <ellipse cx="73" cy="23" rx="5.5" ry="3" transform="rotate(-18 73 23)" fill="#69DB7C" stroke="#4A3728" stroke-width="2"/>
        <ellipse cx="88" cy="23" rx="5.5" ry="3" transform="rotate(18 88 23)" fill="#69DB7C" stroke="#4A3728" stroke-width="2"/>
        ${miniBlossom(54, 34, '#FF9EC7', '#FFE066', 4.1)}
        ${miniBlossom(106, 34, '#74C0FC', '#FFF3BF', 4.1)}
        ${miniBlossom(67, 28, '#FFE066', '#FF922B', 4.4)}
        ${miniBlossom(93, 28, '#D0BFFF', '#FFE066', 4.4)}
        ${miniBlossom(80, 25, '#FFFFFF', '#FF6B9D', 4.8)}
      </g>
    `,

    crown: () => `
      <g class="chicken-acc chicken-acc-crown">
        <path d="M57 32L55 11L70 21L80 6L90 21L105 11L103 32Q80 37 57 32Z" fill="#FFD43B" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M58 29Q80 34 102 29" stroke="#F59F00" stroke-width="3" stroke-linecap="round"/>
        <circle cx="55" cy="10" r="3.4" fill="#FFE066" stroke="#4A3728" stroke-width="2.4"/>
        <circle cx="80" cy="5.5" r="3.8" fill="#FFE066" stroke="#4A3728" stroke-width="2.4"/>
        <circle cx="105" cy="10" r="3.4" fill="#FFE066" stroke="#4A3728" stroke-width="2.4"/>
        <circle cx="80" cy="24" r="4.2" fill="#FF6B9D" stroke="#4A3728" stroke-width="2.2"/>
        <circle cx="67" cy="25" r="2.6" fill="#74C0FC" stroke="#4A3728" stroke-width="1.8"/>
        <circle cx="93" cy="25" r="2.6" fill="#74C0FC" stroke="#4A3728" stroke-width="1.8"/>
      </g>
    `,

    head_bunny: () => `
      <g class="chicken-acc chicken-acc-head-bunny">
        <path d="M51 39C54 27 106 27 109 39" stroke="#4A3728" stroke-width="8" stroke-linecap="round" fill="none"/>
        <path d="M51 39C54 27 106 27 109 39" stroke="#FFC2E2" stroke-width="3.8" stroke-linecap="round" fill="none"/>
        <ellipse cx="65" cy="18" rx="9" ry="17" transform="rotate(-14 65 18)" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.6"/>
        <ellipse cx="65.5" cy="19" rx="4.6" ry="11.5" transform="rotate(-14 65.5 19)" fill="#FFB3D9"/>
        <path d="M89 31C87 16 92 4 102 5C110 6 112 16 104 22C101 25 99 28 97 32Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M92 27C91 17 95 9 101 10C106 11 106 16 101 20C98 22 96 25 95 28Z" fill="#FFB3D9"/>
        <path d="M90 31L83 27L84 35Z" fill="#63E6BE" stroke="#4A3728" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M96 31L103 27L102 35Z" fill="#63E6BE" stroke="#4A3728" stroke-width="2.2" stroke-linejoin="round"/>
        <circle cx="93" cy="31" r="3.4" fill="#96F2D7" stroke="#4A3728" stroke-width="2.2"/>
      </g>
    `,

    head_beret: () => `
      <g class="chicken-acc chicken-acc-head-beret">
        <path d="M49 36C45 20 64 11 86 13C106 15 116 25 111 36Q80 43 49 36Z" fill="#FF5D6C" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M52 34Q80 41 108 34" stroke="#E03E4F" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="64" cy="25" rx="1.7" ry="2.4" transform="rotate(-15 64 25)" fill="#FFE066"/>
        <ellipse cx="75" cy="28" rx="1.7" ry="2.4" fill="#FFE066"/>
        <ellipse cx="88" cy="29" rx="1.7" ry="2.4" fill="#FFE066"/>
        <ellipse cx="99" cy="25" rx="1.7" ry="2.4" transform="rotate(15 99 25)" fill="#FFE066"/>
        <ellipse cx="70" cy="20" rx="1.5" ry="2.1" fill="#FFE066"/>
        <ellipse cx="93" cy="20" rx="1.5" ry="2.1" fill="#FFE066"/>
        <path d="M82 14L72 17L77 22L82 18L87 22L92 17Z" fill="#51CF66" stroke="#4A3728" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M82 15C82 10 85 7 88 7" stroke="#3F9A29" stroke-width="3.4" stroke-linecap="round"/>
      </g>
    `,

    head_unicorn: () => `
      <g class="chicken-acc chicken-acc-head-unicorn">
        <path d="M51 38Q80 26 109 38" stroke="#4A3728" stroke-width="7.4" stroke-linecap="round" fill="none"/>
        <path d="M51 38Q80 26 109 38" stroke="#F3D9FA" stroke-width="3.4" stroke-linecap="round" fill="none"/>
        <polygon points="56,34 53,17 67,27" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
        <polygon points="58,31 56,21 64,27" fill="#FF9EC7"/>
        <polygon points="104,34 107,17 93,27" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
        <polygon points="102,31 104,21 96,27" fill="#FF9EC7"/>
        <path d="M72 31L80 3L88 31Z" fill="#FFE066" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M74 24L86 21" stroke="#FF85C0" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M76 17L84 14.5" stroke="#74C0FC" stroke-width="3" stroke-linecap="round"/>
        <path d="M78 10.5L82 9.5" stroke="#B197FC" stroke-width="2.6" stroke-linecap="round"/>
        <circle cx="71" cy="31" r="4.4" fill="#FF85C0" stroke="#4A3728" stroke-width="2.2"/>
        <circle cx="80" cy="30" r="4.8" fill="#74C0FC" stroke="#4A3728" stroke-width="2.2"/>
        <circle cx="89" cy="31" r="4.4" fill="#FFE066" stroke="#4A3728" stroke-width="2.2"/>
        ${sparklePoly(64, 10, 4.5, '#FFF9DB', '#F59F00', 1.1)}
        ${sparklePoly(97, 9, 4.2, '#E5DBFF', '#9775FA', 1.1)}
      </g>
    `,

    head_wizard: () => `
      <g class="chicken-acc chicken-acc-head-wizard">
        <ellipse cx="80" cy="36" rx="37" ry="9" fill="#5F3DC4" stroke="#4A3728" stroke-width="3.8"/>
        <path d="M55 34C58 16 70 6 95 4C90 12 96 22 105 34Z" fill="#7950F2" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M56 32Q80 39 104 32" stroke="#FFD43B" stroke-width="5.2" stroke-linecap="round"/>
        <path d="M56 32Q80 39 104 32" stroke="#4A3728" stroke-width="1.8" stroke-linecap="round" opacity="0.45"/>
        ${starPoly(76, 20, 6.2, '#FFE066', '#4A3728', 1.8)}
        <path d="M90 14C86 15 85 20 88 22.5C90.5 24.5 94 23.5 95.5 20.5C92 21.5 89.5 18.5 90 14Z" fill="#FFF3BF" stroke="#4A3728" stroke-width="1.4" stroke-linejoin="round"/>
        <circle cx="65" cy="25" r="2" fill="#FFF9DB"/>
        ${sparklePoly(101, 10, 4.4, '#FFE066', '#F59F00', 1.1)}
      </g>
    `
  };

  // =====================
  // 2. BODY (6 items)
  // =====================
  const BODY_RENDERERS = {
    body_apron: () => `
      <g class="chicken-acc chicken-acc-body-apron">
        <path d="M64 88L68 106M110 88L106 106" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/>
        <path d="M64 88L68 106M110 88L106 106" stroke="#4A3728" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M60 100H114L118 118H56Z" fill="#E6FCF5" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M44 117C40 134 45 147 56 149C65 151 74 148 82 151C90 154 98 150 107 151C116 151 128 148 134 139C138 133 136 123 133 117Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M46 142Q60 148 74 143Q88 149 102 144Q117 148 131 140" stroke="#96F2D7" stroke-width="3.6" stroke-linecap="round" fill="none"/>
        <path d="M43 117Q88 126 134 117" stroke="#FF85C0" stroke-width="6.4" stroke-linecap="round"/>
        <path d="M43 117Q88 126 134 117" stroke="#4A3728" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
        <path d="M72 126H104V138C104 144 97 147 88 147C79 147 72 144 72 138Z" fill="#E6FCF5" stroke="#4A3728" stroke-width="3" stroke-linejoin="round"/>
        ${miniBlossom(88, 136, '#FFFFFF', '#FFD43B', 3.7)}
      </g>
    `,

    body_overalls: () => `
      <g class="chicken-acc chicken-acc-body-overalls">
        <path d="M65 86L69 108M111 86L107 108" stroke="#4DABF7" stroke-width="8.5" stroke-linecap="round"/>
        <path d="M65 86L69 108M111 86L107 108" stroke="#4A3728" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M58 102H118L124 120H52Z" fill="#4DABF7" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M42 117C40 135 50 148 68 151L76 148L82 140H98L104 148L112 151C130 148 140 135 138 117Q90 125 42 117Z" fill="#339AF0" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M47 122Q90 129 133 122" stroke="#A5D8FF" stroke-width="2.2" stroke-dasharray="4 4" stroke-linecap="round"/>
        <rect x="74" y="110" width="28" height="20" rx="5" fill="#74C0FC" stroke="#4A3728" stroke-width="2.8"/>
        <path d="${heartD(88, 120, 10)}" fill="#FFE066" stroke="#4A3728" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="67" cy="105" r="3.8" fill="#FFD43B" stroke="#4A3728" stroke-width="2.2"/>
        <circle cx="109" cy="105" r="3.8" fill="#FFD43B" stroke="#4A3728" stroke-width="2.2"/>
      </g>
    `,

    body_raincoat: () => `
      <g class="chicken-acc chicken-acc-body-raincoat">
        <path d="M52 94C40 108 36 130 40 145Q90 156 140 145C144 130 140 108 128 94Q90 104 52 94Z" fill="#FFD43B" stroke="#4A3728" stroke-width="4" stroke-linejoin="round"/>
        <path d="M54 95L70 111L86 101L102 111L124 95Q89 103 54 95Z" fill="#FFE066" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M87 104V149" stroke="#4A3728" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M49 112C46 122 46 132 48 139" stroke="#FFF9DB" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
        <circle cx="87" cy="116" r="3.6" fill="#FF5D6C" stroke="#4A3728" stroke-width="2.2"/>
        <circle cx="87" cy="129" r="3.6" fill="#FF5D6C" stroke="#4A3728" stroke-width="2.2"/>
        <circle cx="87" cy="141" r="3.6" fill="#FF5D6C" stroke="#4A3728" stroke-width="2.2"/>
        <path d="M104 126H124V137C124 142 119 144 114 144C109 144 104 142 104 137Z" fill="#FFE878" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M114 130C111 134 110 137 114 139C118 137 117 134 114 130Z" fill="#38B6FF" stroke="#4A3728" stroke-width="1.6"/>
      </g>
    `,

    tutu: () => `
      <g class="chicken-acc chicken-acc-tutu">
        <path d="M36 121C30 132 30 142 38 145C45 148 53 145 58 149C65 154 75 150 82 152C90 155 98 152 106 152C114 152 122 154 129 149C135 145 142 148 148 143C153 139 151 129 144 121Q90 133 36 121Z" fill="#D9C2FF" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M38 119C35 129 40 137 48 139C55 141 62 138 69 142C76 146 84 142 90 144C97 146 104 142 112 142C119 142 126 145 133 139C140 136 145 129 142 119Q90 130 38 119Z" fill="#FFB3D9" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M38 118Q90 131 142 118" stroke="#FF6B9D" stroke-width="6.5" stroke-linecap="round"/>
        <path d="M38 118Q90 131 142 118" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round" opacity="0.65"/>
        <polygon points="62,130 63.8,133.2 67,135 63.8,136.8 62,140 60.2,136.8 57,135 60.2,133.2" fill="#FFF9DB" stroke="#F59F00" stroke-width="1.2" stroke-linejoin="round"/>
        <polygon points="118,131 119.8,134.2 123,136 119.8,137.8 118,141 116.2,137.8 113,136 116.2,134.2" fill="#FFF9DB" stroke="#F59F00" stroke-width="1.2" stroke-linejoin="round"/>
        <circle cx="90" cy="136" r="2.6" fill="#FFFFFF"/>
      </g>
    `,

    body_ballet: () => `
      <g class="chicken-acc chicken-acc-body-ballet">
        <path d="M62 96C72 104 106 104 116 96L122 120Q89 128 56 120Z" fill="#748FFC" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M76 105L102 115M102 105L76 115" stroke="#FFAED0" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M35 120C28 134 32 145 43 148C53 151 64 148 74 152C85 156 97 154 108 152C119 150 130 152 141 146C150 141 151 131 144 120Q90 132 35 120Z" fill="#5C7CFA" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M40 119C38 129 45 138 56 140C68 142 79 140 90 144C102 142 114 142 126 139C136 137 142 129 140 119Q90 130 40 119Z" fill="#B197FC" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M42 118Q90 130 138 118" stroke="#FFE066" stroke-width="5" stroke-linecap="round"/>
        ${starPoly(64, 134, 5.5, '#FFE066', '#4A3728', 1.5)}
        ${starPoly(116, 134, 5.5, '#FFE066', '#4A3728', 1.5)}
        ${sparklePoly(90, 136, 5.2, '#FFF9DB', '#F59F00', 1.2)}
        <circle cx="77" cy="144" r="2.2" fill="#FFF9DB"/>
        <circle cx="104" cy="144" r="2.2" fill="#FFF9DB"/>
      </g>
    `,

    body_mermaid: () => `
      <g class="chicken-acc chicken-acc-body-mermaid">
        <path d="M62 100C68 94 79 95 85 103C91 95 102 94 108 100C112 108 108 117 98 119H72C62 117 58 108 62 100Z" fill="#FFAED0" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M72 100L76 114M85 103V115M98 100L94 114" stroke="#E64980" stroke-width="1.8" stroke-linecap="round" opacity="0.65"/>
        <path d="M42 117C38 134 44 147 58 151Q90 159 122 151C136 147 142 134 138 117Q90 126 42 117Z" fill="#38D9A9" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M49 126Q58 135 67 126Q76 135 85 126Q94 135 103 126Q112 135 121 126Q130 135 135 127" stroke="#96F2D7" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M54 136Q63 145 72 136Q81 145 90 136Q99 145 108 136Q117 145 126 136" stroke="#B197FC" stroke-width="2.8" stroke-linecap="round" fill="none"/>
        <path d="M46 146C55 157 72 159 88 152C104 159 121 157 132 146C124 142 108 145 90 144C72 145 56 142 46 146Z" fill="#74C0FC" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
        <circle cx="85" cy="117" r="4" fill="#FFF9DB" stroke="#4A3728" stroke-width="2"/>
        <circle cx="62" cy="120" r="2.5" fill="#FFFFFF"/>
        <circle cx="118" cy="120" r="2.5" fill="#FFFFFF"/>
      </g>
    `
  };

  // =====================
  // 3. NECK (6 items + cape back cloak)
  // =====================
  const NECK_CAPE_BACK = () => `
    <g class="chicken-acc chicken-acc-neck-cape-back">
      <path d="M50 86C34 106 27 136 37 152Q90 164 145 152C155 136 148 106 132 86Q90 96 50 86Z" fill="#9C36B5" stroke="#4A3728" stroke-width="4" stroke-linejoin="round"/>
      <path d="M40 146Q90 158 142 146" stroke="#FFD43B" stroke-width="4.2" stroke-linecap="round" fill="none"/>
      ${starPoly(45, 132, 6, '#FFE066', '#4A3728', 1.6)}
      ${starPoly(137, 132, 6, '#FFE066', '#4A3728', 1.6)}
      ${sparklePoly(38, 114, 4.2, '#FFF9DB', '#F59F00', 1.1)}
      ${sparklePoly(144, 114, 4.2, '#FFF9DB', '#F59F00', 1.1)}
    </g>
  `;

  const NECK_RENDERERS = {
    bow: () => `
      <g class="chicken-acc chicken-acc-bow">
        <path d="M75 99L65 93L65 105Z" fill="#FF6B9D" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M85 99L95 93L95 105Z" fill="#FF6B9D" stroke="#4A3728" stroke-width="2.6" stroke-linejoin="round"/>
        <circle cx="80" cy="99" r="5" fill="#FF6B9D" stroke="#4A3728" stroke-width="2.6"/>
      </g>
    `,

    neck_bell: () => `
      <g class="chicken-acc chicken-acc-neck-bell">
        <path d="M54 93Q80 106 106 93" stroke="#4A3728" stroke-width="8.6" stroke-linecap="round" fill="none"/>
        <path d="M54 93Q80 106 106 93" stroke="#FF5D6C" stroke-width="4.4" stroke-linecap="round" fill="none"/>
        <circle cx="80" cy="109" r="9" fill="#FFD43B" stroke="#4A3728" stroke-width="3.2"/>
        <path d="M73 107Q80 111 87 107" stroke="#E09F00" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="80" cy="112" r="2.2" fill="#4A3728"/>
        <path d="M80 112V117" stroke="#4A3728" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M75 103A4.5 4.5 0 0 1 80 102" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
        ${sparklePoly(94, 107, 4, '#FFF9DB', '#F59F00', 1.1)}
      </g>
    `,

    neck_scarf: () => `
      <g class="chicken-acc chicken-acc-neck-scarf">
        <path d="M89 101L103 99L105 123L91 124Z" fill="#FF6B6B" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M90 108L104 107" stroke="#FFD43B" stroke-width="4.2"/>
        <path d="M90.5 115L104.5 114" stroke="#51CF66" stroke-width="4.2"/>
        <path d="M91 121L105 120" stroke="#38B6FF" stroke-width="3.4"/>
        <path d="M93 124V129M98 124V129M103 123V128" stroke="#4A3728" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M52 93Q80 107 108 93C111 97 110 103 105 106Q80 116 55 106C50 103 49 97 52 93Z" fill="#FF6B6B" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M62 99L65 108" stroke="#FFE066" stroke-width="4.4" stroke-linecap="round"/>
        <path d="M74 102L76 111" stroke="#69DB7C" stroke-width="4.4" stroke-linecap="round"/>
        <path d="M86 102L84 111" stroke="#74C0FC" stroke-width="4.4" stroke-linecap="round"/>
        <path d="M98 99L95 108" stroke="#C5A3FF" stroke-width="4.4" stroke-linecap="round"/>
      </g>
    `,

    neck_pearl: () => `
      <g class="chicken-acc chicken-acc-neck-pearl">
        <path d="M55 95Q80 110 105 95" stroke="#4A3728" stroke-width="2" fill="none"/>
        <circle cx="57" cy="96" r="4.1" fill="#FFFDF8" stroke="#4A3728" stroke-width="2.2"/>
        <circle cx="64" cy="100" r="4.3" fill="#FFFDF8" stroke="#4A3728" stroke-width="2.2"/>
        <circle cx="72" cy="103" r="4.5" fill="#FFFDF8" stroke="#4A3728" stroke-width="2.2"/>
        <circle cx="80" cy="104" r="4.8" fill="#FFFDF8" stroke="#4A3728" stroke-width="2.2"/>
        <circle cx="88" cy="103" r="4.5" fill="#FFFDF8" stroke="#4A3728" stroke-width="2.2"/>
        <circle cx="96" cy="100" r="4.3" fill="#FFFDF8" stroke="#4A3728" stroke-width="2.2"/>
        <circle cx="103" cy="96" r="4.1" fill="#FFFDF8" stroke="#4A3728" stroke-width="2.2"/>
        <circle cx="71" cy="101.5" r="1.2" fill="#FFFFFF"/>
        <circle cx="79" cy="102.5" r="1.3" fill="#FFFFFF"/>
        <circle cx="87" cy="101.5" r="1.2" fill="#FFFFFF"/>
        <path d="${heartD(80, 114, 11)}" fill="#FF85C0" stroke="#4A3728" stroke-width="2.4" stroke-linejoin="round"/>
        <circle cx="78" cy="112" r="1.4" fill="#FFFFFF"/>
      </g>
    `,

    neck_bib: () => `
      <g class="chicken-acc chicken-acc-neck-bib">
        <path d="M56 94Q80 105 104 94C106 108 98 125 80 125C62 125 54 108 56 94Z" fill="#FFF9F0" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M58 98Q80 107 102 98" stroke="#FF85C0" stroke-width="3.4" stroke-linecap="round" fill="none"/>
        <path d="M61 116Q70 123 80 122Q90 123 99 116" stroke="#FFAED0" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        <path d="M80 106C86 106 88 111 85 117C83 120 77 120 75 117C72 111 74 106 80 106Z" fill="#FF5D6C" stroke="#4A3728" stroke-width="2.2"/>
        <path d="M75 107L80 104L85 107L80 109Z" fill="#51CF66" stroke="#4A3728" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="78" cy="112" r="0.9" fill="#FFE066"/>
        <circle cx="82" cy="112" r="0.9" fill="#FFE066"/>
        <circle cx="80" cy="116" r="0.9" fill="#FFE066"/>
      </g>
    `,

    neck_cape: () => `
      <g class="chicken-acc chicken-acc-neck-cape">
        <path d="M52 93Q80 106 108 93" stroke="#4A3728" stroke-width="9.5" stroke-linecap="round" fill="none"/>
        <path d="M52 93Q80 106 108 93" stroke="#AE3EC9" stroke-width="5.2" stroke-linecap="round" fill="none"/>
        <circle cx="80" cy="102" r="7.5" fill="#FFD43B" stroke="#4A3728" stroke-width="2.8"/>
        ${starPoly(80, 102, 5.2, '#FFF3BF', '#B86E00', 1.2)}
      </g>
    `
  };

  // =====================
  // 4. EYES (6 items)
  // =====================
  const EYES_RENDERERS = {
    eyes_round: () => `
      <g class="chicken-acc chicken-acc-eyes-round">
        <path d="M47 59L54 59M106 59L113 59" stroke="#4A3728" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M77.5 59Q80 56 82.5 59" stroke="#4A3728" stroke-width="3.2" stroke-linecap="round"/>
        <circle cx="66" cy="60" r="11.5" fill="#D0EBFF" fill-opacity="0.34" stroke="#B06824" stroke-width="4.4"/>
        <circle cx="66" cy="60" r="11.5" fill="none" stroke="#4A3728" stroke-width="2"/>
        <circle cx="94" cy="60" r="11.5" fill="#D0EBFF" fill-opacity="0.34" stroke="#B06824" stroke-width="4.4"/>
        <circle cx="94" cy="60" r="11.5" fill="none" stroke="#4A3728" stroke-width="2"/>
        <path d="M59 55L63 52" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M87 55L91 52" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>
      </g>
    `,

    sunglasses: () => `
      <g class="chicken-acc chicken-acc-sunglasses">
        <path d="M47 57L53 56M107 56L113 57" stroke="#4A3728" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M76 57Q80 54 84 57" stroke="#4A3728" stroke-width="3.6" stroke-linecap="round"/>
        <rect x="52" y="51" width="25" height="17" rx="7" fill="#2B2D42" stroke="#4A3728" stroke-width="3.4"/>
        <rect x="83" y="51" width="25" height="17" rx="7" fill="#2B2D42" stroke="#4A3728" stroke-width="3.4"/>
        <path d="M57 55L62 63M63 54L66 59" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.82"/>
        <path d="M88 55L93 63M94 54L97 59" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.82"/>
      </g>
    `,

    eyes_heart: () => `
      <g class="chicken-acc chicken-acc-eyes-heart">
        <path d="M46 57L53 56M107 56L114 57" stroke="#4A3728" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M77 58Q80 55 83 58" stroke="#E64980" stroke-width="3.6" stroke-linecap="round"/>
        <path d="${heartD(66, 61, 25)}" fill="#FF6B9D" fill-opacity="0.82" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="${heartD(94, 61, 25)}" fill="#FF6B9D" fill-opacity="0.82" stroke="#4A3728" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M58 56L62 61" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M86 56L90 61" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>
      </g>
    `,

    eyes_star: () => `
      <g class="chicken-acc chicken-acc-eyes-star">
        <path d="M46 57L53 57M107 57L114 57" stroke="#4A3728" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M76 58Q80 55 84 58" stroke="#F59F00" stroke-width="3.6" stroke-linecap="round"/>
        ${starPoly(66, 60, 15.5, '#FFD43B', '#4A3728', 3)}
        ${starPoly(94, 60, 15.5, '#FFD43B', '#4A3728', 3)}
        ${starPoly(66, 60, 9.2, '#74C0FC', '#F59F00', 1.4)}
        ${starPoly(94, 60, 9.2, '#74C0FC', '#F59F00', 1.4)}
        <circle cx="63" cy="57" r="1.8" fill="#FFFFFF"/>
        <circle cx="91" cy="57" r="1.8" fill="#FFFFFF"/>
      </g>
    `,

    eyes_daisy: () => {
      const daisyRing = (cx, cy) => {
        const petals = [];
        for (let i = 0; i < 8; i++) {
          const ang = (Math.PI * 2 * i) / 8;
          const px = (cx + Math.cos(ang) * 11.2).toFixed(1);
          const py = (cy + Math.sin(ang) * 11.2).toFixed(1);
          petals.push(`<circle cx="${px}" cy="${py}" r="4.6" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.2"/>`);
        }
        return petals.join('') +
          `<circle cx="${cx}" cy="${cy}" r="8.4" fill="#FFD43B" stroke="#4A3728" stroke-width="2.8"/>` +
          `<path d="M${cx - 3.5} ${cy - 2.5}L${cx - 1} ${cy - 4.5}" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>`;
      };
      return `
        <g class="chicken-acc chicken-acc-eyes-daisy">
          <path d="M46 59L54 59M106 59L114 59" stroke="#3F9A29" stroke-width="3.6" stroke-linecap="round"/>
          <path d="M76 59Q80 56 84 59" stroke="#3F9A29" stroke-width="3.8" stroke-linecap="round"/>
          ${daisyRing(66, 60)}
          ${daisyRing(94, 60)}
        </g>
      `;
    },

    eyes_mask: () => `
      <g class="chicken-acc chicken-acc-eyes-mask">
        <path d="M46 53C50 45 64 46 80 52C96 46 110 45 114 53C116 63 108 72 95 71C88 70 84 66 80 64C76 66 72 70 65 71C52 72 44 63 46 53Z" fill="#B197FC" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M49 54C55 48 66 49 77 54M111 54C105 48 94 49 83 54" stroke="#FFD43B" stroke-width="2.4" stroke-linecap="round" fill="none"/>
        <ellipse cx="66" cy="60" rx="8.6" ry="6.2" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.6"/>
        <circle cx="67.5" cy="60" r="3.8" fill="#4A3728"/>
        <circle cx="69" cy="58.2" r="1.4" fill="#FFFFFF"/>
        <ellipse cx="94" cy="60" rx="8.6" ry="6.2" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.6"/>
        <circle cx="92.5" cy="60" r="3.8" fill="#4A3728"/>
        <circle cx="94" cy="58.2" r="1.4" fill="#FFFFFF"/>
        <path d="${heartD(80, 56, 8)}" fill="#FF6B9D" stroke="#FFD43B" stroke-width="1.6"/>
        ${sparklePoly(52, 52, 3.6, '#FFF9DB', '#F59F00', 1)}
        ${sparklePoly(108, 52, 3.6, '#FFF9DB', '#F59F00', 1)}
      </g>
    `
  };

  // =====================
  // 5. FEET (6 items)
  // =====================
  const FEET_RENDERERS = {
    feet_socks: () => `
      <g class="chicken-acc chicken-acc-feet-socks">
        <path d="M64 142H80V159C80 163 77 166 72 166H59C55 166 54 162 56 159C58 156 62 156 64 155Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <rect x="63" y="140" width="18" height="5.5" rx="2.5" fill="#FF5D6C" stroke="#4A3728" stroke-width="2.6"/>
        <path d="M65 150H79M65 156H79" stroke="#FF85C0" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M100 142H116V155C118 156 122 156 124 159C126 162 125 166 121 166H108C103 166 100 163 100 159Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <rect x="99" y="140" width="18" height="5.5" rx="2.5" fill="#FF5D6C" stroke="#4A3728" stroke-width="2.6"/>
        <path d="M101 150H115M101 156H115" stroke="#FF85C0" stroke-width="3.2" stroke-linecap="round"/>
      </g>
    `,

    boots: () => `
      <g class="chicken-acc chicken-acc-boots">
        <path d="M62 145H81V162C81 166 78 168 74 168H55C50 168 48 164 50 160C52 156 58 156 62 155Z" fill="#FFD43B" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <rect x="60" y="142" width="23" height="7" rx="3" fill="#FF4D5E" stroke="#4A3728" stroke-width="3.2"/>
        <path d="M66 152V158" stroke="#FFF9DB" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M99 145H118V155C122 156 128 156 130 160C132 164 130 168 125 168H106C102 168 99 166 99 162Z" fill="#FFD43B" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <rect x="97" y="142" width="23" height="7" rx="3" fill="#FF4D5E" stroke="#4A3728" stroke-width="3.2"/>
        <path d="M114 152V158" stroke="#FFF9DB" stroke-width="2.6" stroke-linecap="round"/>
      </g>
    `,

    feet_maryjane: () => `
      <g class="chicken-acc chicken-acc-feet-maryjane">
        <rect x="65" y="144" width="14" height="12" rx="3" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.8"/>
        <path d="M54 160C54 155 60 153 66 155H81V164C81 167 78 168 74 168H58C54 168 53 165 54 160Z" fill="#FF85C0" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M64 155Q72 151 80 156" stroke="#FF4D8D" stroke-width="3.2" stroke-linecap="round"/>
        <circle cx="63" cy="160" r="2.6" fill="#FFF9DB" stroke="#4A3728" stroke-width="1.6"/>
        <rect x="101" y="144" width="14" height="12" rx="3" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.8"/>
        <path d="M126 160C126 155 120 153 114 155H99V164C99 167 102 168 106 168H122C126 168 127 165 126 160Z" fill="#FF85C0" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M100 156Q108 151 116 155" stroke="#FF4D8D" stroke-width="3.2" stroke-linecap="round"/>
        <circle cx="117" cy="160" r="2.6" fill="#FFF9DB" stroke="#4A3728" stroke-width="1.6"/>
      </g>
    `,

    feet_sneakers: () => `
      <g class="chicken-acc chicken-acc-feet-sneakers">
        <path d="M62 146H81V165H53C49 165 49 158 55 155L62 153Z" fill="#38B6FF" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M51 163H82V168H53C50 168 50 165 51 163Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M51 162C51 158 54 155 59 155L58 163Z" fill="#FFE066" stroke="#4A3728" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M64 151H75M64 156H74" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M99 146H118V153L125 155C131 158 131 165 127 165H99Z" fill="#FF6B9D" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M98 163H129C130 165 130 168 127 168H98Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M129 162C129 158 126 155 121 155L122 163Z" fill="#FFE066" stroke="#4A3728" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M105 151H116M106 156H116" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>
      </g>
    `,

    feet_bunny: () => `
      <g class="chicken-acc chicken-acc-feet-bunny">
        <ellipse cx="64" cy="148" rx="4" ry="7.5" transform="rotate(-24 64 148)" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.6"/>
        <ellipse cx="72" cy="147" rx="4" ry="7.5" transform="rotate(8 72 147)" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.6"/>
        <ellipse cx="64.5" cy="149" rx="1.8" ry="4.5" transform="rotate(-24 64.5 149)" fill="#FFB3D9"/>
        <ellipse cx="72" cy="148" rx="1.8" ry="4.5" transform="rotate(8 72 148)" fill="#FFB3D9"/>
        <path d="M50 161C50 154 57 152 67 152H81C83 152 84 156 83 162C82 167 78 169 72 169H56C51 169 50 165 50 161Z" fill="#FFFDF8" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <circle cx="57" cy="160" r="1.8" fill="#4A3728"/>
        <circle cx="64" cy="160" r="1.8" fill="#4A3728"/>
        <circle cx="60.5" cy="163" r="1.8" fill="#FF85C0"/>
        <ellipse cx="108" cy="147" rx="4" ry="7.5" transform="rotate(-8 108 147)" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.6"/>
        <ellipse cx="116" cy="148" rx="4" ry="7.5" transform="rotate(24 116 148)" fill="#FFFFFF" stroke="#4A3728" stroke-width="2.6"/>
        <ellipse cx="108" cy="148" rx="1.8" ry="4.5" transform="rotate(-8 108 148)" fill="#FFB3D9"/>
        <ellipse cx="115.5" cy="149" rx="1.8" ry="4.5" transform="rotate(24 115.5 149)" fill="#FFB3D9"/>
        <path d="M130 161C130 154 123 152 113 152H99C97 152 96 156 97 162C98 167 102 169 108 169H124C129 169 130 165 130 161Z" fill="#FFFDF8" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <circle cx="116" cy="160" r="1.8" fill="#4A3728"/>
        <circle cx="123" cy="160" r="1.8" fill="#4A3728"/>
        <circle cx="119.5" cy="163" r="1.8" fill="#FF85C0"/>
      </g>
    `,

    feet_skates: () => `
      <g class="chicken-acc chicken-acc-feet-skates">
        <path d="M62 143H80V162H55C51 162 51 155 56 153L62 151Z" fill="#63E6BE" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M62 146H80" stroke="#FF85C0" stroke-width="3.4"/>
        <circle cx="52" cy="163" r="3.4" fill="#FF6B9D" stroke="#4A3728" stroke-width="2.2"/>
        <circle cx="61" cy="168.5" r="5" fill="#FFE066" stroke="#4A3728" stroke-width="2.8"/>
        <circle cx="75" cy="168.5" r="5" fill="#FF85C0" stroke="#4A3728" stroke-width="2.8"/>
        <circle cx="61" cy="168.5" r="1.6" fill="#FFFFFF"/>
        <circle cx="75" cy="168.5" r="1.6" fill="#FFFFFF"/>
        <path d="M100 143H118V151L124 153C129 155 129 162 125 162H100Z" fill="#63E6BE" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M100 146H118" stroke="#FF85C0" stroke-width="3.4"/>
        <circle cx="128" cy="163" r="3.4" fill="#FF6B9D" stroke="#4A3728" stroke-width="2.2"/>
        <circle cx="105" cy="168.5" r="5" fill="#FF85C0" stroke="#4A3728" stroke-width="2.8"/>
        <circle cx="119" cy="168.5" r="5" fill="#FFE066" stroke="#4A3728" stroke-width="2.8"/>
        <circle cx="105" cy="168.5" r="1.6" fill="#FFFFFF"/>
        <circle cx="119" cy="168.5" r="1.6" fill="#FFFFFF"/>
      </g>
    `
  };

  // =====================
  // 6. BACK (6 items)
  // =====================
  const BACK_RENDERERS = {
    back_bee: () => `
      <g class="chicken-acc chicken-acc-back-bee">
        <ellipse cx="29" cy="86" rx="20" ry="13" transform="rotate(-24 29 86)" fill="#E7F5FF" fill-opacity="0.92" stroke="#4A3728" stroke-width="3.6"/>
        <ellipse cx="27" cy="107" rx="15" ry="10" transform="rotate(16 27 107)" fill="#D0EBFF" fill-opacity="0.9" stroke="#4A3728" stroke-width="3.4"/>
        <path d="M20 83Q31 85 40 91M19 107Q29 106 37 104" stroke="#74C0FC" stroke-width="2.4" stroke-linecap="round"/>
        <ellipse cx="25" cy="80" rx="6" ry="2.8" transform="rotate(-24 25 80)" fill="#FFFFFF"/>
        <ellipse cx="151" cy="86" rx="20" ry="13" transform="rotate(24 151 86)" fill="#E7F5FF" fill-opacity="0.92" stroke="#4A3728" stroke-width="3.6"/>
        <ellipse cx="153" cy="107" rx="15" ry="10" transform="rotate(-16 153 107)" fill="#D0EBFF" fill-opacity="0.9" stroke="#4A3728" stroke-width="3.4"/>
        <path d="M160 83Q149 85 140 91M161 107Q151 106 143 104" stroke="#74C0FC" stroke-width="2.4" stroke-linecap="round"/>
        <ellipse cx="155" cy="80" rx="6" ry="2.8" transform="rotate(24 155 80)" fill="#FFFFFF"/>
      </g>
    `,

    back_butterfly: () => `
      <g class="chicken-acc chicken-acc-back-butterfly">
        <path d="M44 98C26 64 5 64 7 88C8 102 22 108 42 106Z" fill="#FF85C0" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M44 106C20 106 10 120 17 132C24 140 38 132 46 118Z" fill="#74C0FC" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
        <circle cx="22" cy="86" r="6" fill="#FFE066" stroke="#4A3728" stroke-width="2"/>
        <circle cx="27" cy="121" r="4.5" fill="#FFF3BF" stroke="#4A3728" stroke-width="1.8"/>
        <path d="M136 98C154 64 175 64 173 88C172 102 158 108 138 106Z" fill="#FF85C0" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M136 106C160 106 170 120 163 132C156 140 142 132 134 118Z" fill="#74C0FC" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
        <circle cx="158" cy="86" r="6" fill="#FFE066" stroke="#4A3728" stroke-width="2"/>
        <circle cx="153" cy="121" r="4.5" fill="#FFF3BF" stroke="#4A3728" stroke-width="1.8"/>
      </g>
    `,

    back_angel: () => `
      <g class="chicken-acc chicken-acc-back-angel">
        <path d="M46 96C34 66 10 62 7 81C5 90 12 96 18 96C10 100 8 111 16 115C13 121 19 130 30 126C36 124 44 116 48 108Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M18 96Q28 96 38 101M18 114Q29 112 40 112" stroke="#D0EBFF" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M134 96C146 66 170 62 173 81C175 90 168 96 162 96C170 100 172 111 164 115C167 121 161 130 150 126C144 124 136 116 132 108Z" fill="#FFFFFF" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M162 96Q152 96 142 101M162 114Q151 112 140 112" stroke="#D0EBFF" stroke-width="3.2" stroke-linecap="round"/>
        ${sparklePoly(16, 65, 4.6, '#FFE066', '#F59F00', 1.1)}
        ${sparklePoly(164, 65, 4.6, '#FFE066', '#F59F00', 1.1)}
      </g>
    `,

    wings: () => `
      <g class="chicken-acc chicken-acc-wings">
        <ellipse cx="26" cy="84" rx="20" ry="10.5" transform="rotate(-24 26 84)" fill="#FF85C0" stroke="#4A3728" stroke-width="3.8"/>
        <ellipse cx="22" cy="99" rx="19" ry="9.5" transform="rotate(-6 22 99)" fill="#FFE066" stroke="#4A3728" stroke-width="3.8"/>
        <ellipse cx="24" cy="113" rx="18" ry="9" transform="rotate(14 24 113)" fill="#69DB7C" stroke="#4A3728" stroke-width="3.8"/>
        <ellipse cx="32" cy="125" rx="15" ry="8" transform="rotate(30 32 125)" fill="#74C0FC" stroke="#4A3728" stroke-width="3.6"/>
        <ellipse cx="154" cy="84" rx="20" ry="10.5" transform="rotate(24 154 84)" fill="#FFA94D" stroke="#4A3728" stroke-width="3.8"/>
        <ellipse cx="158" cy="99" rx="19" ry="9.5" transform="rotate(6 158 99)" fill="#69DB7C" stroke="#4A3728" stroke-width="3.8"/>
        <ellipse cx="156" cy="113" rx="18" ry="9" transform="rotate(-14 156 113)" fill="#74C0FC" stroke="#4A3728" stroke-width="3.8"/>
        <ellipse cx="148" cy="125" rx="15" ry="8" transform="rotate(-30 148 125)" fill="#C5A3FF" stroke="#4A3728" stroke-width="3.6"/>
      </g>
    `,

    back_fairy: () => `
      <g class="chicken-acc chicken-acc-back-fairy">
        <path d="M45 96C30 58 6 54 7 78C8 94 22 103 43 104Z" fill="#96F2D7" fill-opacity="0.92" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M44 105C22 106 9 124 18 136C27 144 40 132 46 116Z" fill="#E5DBFF" fill-opacity="0.92" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M17 77Q28 84 39 95M23 127Q32 119 41 112" stroke="#FFD43B" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M135 96C150 58 174 54 173 78C172 94 158 103 137 104Z" fill="#96F2D7" fill-opacity="0.92" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M136 105C158 106 171 124 162 136C153 144 140 132 134 116Z" fill="#E5DBFF" fill-opacity="0.92" stroke="#4A3728" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M163 77Q152 84 141 95M157 127Q148 119 139 112" stroke="#FFD43B" stroke-width="2.4" stroke-linecap="round"/>
        ${sparklePoly(18, 62, 4.4, '#FFF9DB', '#F59F00', 1.1)}
        ${sparklePoly(162, 62, 4.4, '#FFF9DB', '#F59F00', 1.1)}
        <circle cx="24" cy="86" r="2.6" fill="#FFFFFF"/>
        <circle cx="156" cy="86" r="2.6" fill="#FFFFFF"/>
      </g>
    `,

    back_dragon: () => `
      <g class="chicken-acc chicken-acc-back-dragon">
        <path d="M44 96C34 74 20 64 10 68C6 78 8 95 14 112C20 107 26 114 31 122C36 116 42 116 46 114Z" fill="#51CF66" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M40 99C32 84 23 78 16 80C15 88 16 98 19 107C25 104 30 108 33 114C37 110 40 110 43 109Z" fill="#FFE066" stroke="#4A3728" stroke-width="2.2" stroke-linejoin="round"/>
        <circle cx="11" cy="68" r="4" fill="#A9E34B" stroke="#4A3728" stroke-width="2.6"/>
        <path d="M136 96C146 74 160 64 170 68C174 78 172 95 166 112C160 107 154 114 149 122C144 116 138 116 134 114Z" fill="#51CF66" stroke="#4A3728" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M140 99C148 84 157 78 164 80C165 88 164 98 161 107C155 104 150 108 147 114C143 110 140 110 137 109Z" fill="#FFE066" stroke="#4A3728" stroke-width="2.2" stroke-linejoin="round"/>
        <circle cx="169" cy="68" r="4" fill="#A9E34B" stroke="#4A3728" stroke-width="2.6"/>
      </g>
    `
  };

  // =====================
  // 7. HAND (6 items)
  // =====================
  const HAND_RENDERERS = {
    hand_lollipop: () => `
      <g class="chicken-acc chicken-acc-hand-lollipop">
        <path d="M138 122L155 78" stroke="#4A3728" stroke-width="7.4" stroke-linecap="round"/>
        <path d="M138 122L155 78" stroke="#FFFFFF" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M149 90L142 86L143 94Z" fill="#FF6B9D" stroke="#4A3728" stroke-width="2" stroke-linejoin="round"/>
        <path d="M153 91L160 88L158 96Z" fill="#FF6B9D" stroke="#4A3728" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="151" cy="91" r="2.8" fill="#FFAED0" stroke="#4A3728" stroke-width="1.8"/>
        <circle cx="159" cy="65" r="15.5" fill="#FF85C0" stroke="#4A3728" stroke-width="3.6"/>
        <path d="M159 53A12 12 0 0 1 171 65A10 10 0 0 1 157 74A7.5 7.5 0 0 1 151 64A5 5 0 0 1 160 61" stroke="#FFE066" stroke-width="4.2" stroke-linecap="round" fill="none"/>
        <path d="M159 57A8 8 0 0 1 167 65A6 6 0 0 1 157 70" stroke="#74C0FC" stroke-width="2.8" stroke-linecap="round" fill="none"/>
        <path d="M150 58A10 10 0 0 1 156 53" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>
      </g>
    `,

    hand_balloon: () => `
      <g class="chicken-acc chicken-acc-hand-balloon">
        <path d="M140 120C147 109 144 98 153 90C159 84 157 79 158 74" stroke="#4A3728" stroke-width="3" stroke-linecap="round" fill="none"/>
        <polygon points="155,75 161,75 158,70" fill="#FF5D8F" stroke="#4A3728" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="${heartD(158, 56, 32)}" fill="#FF6B9D" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M148 50C148 45 153 43 155 46" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
        <circle cx="147" cy="55" r="1.8" fill="#FFFFFF"/>
        ${sparklePoly(172, 41, 4, '#FFF9DB', '#F59F00', 1.1)}
      </g>
    `,

    hand_umbrella: () => `
      <g class="chicken-acc chicken-acc-hand-umbrella">
        <path d="M142 122C139 127 146 130 149 124L157 60" stroke="#4A3728" stroke-width="6.8" stroke-linecap="round" fill="none"/>
        <path d="M142 122C139 127 146 130 149 124L157 60" stroke="#E09F5A" stroke-width="2.8" stroke-linecap="round" fill="none"/>
        <path d="M131 64C133 44 148 37 160 39C172 41 178 52 177 69C172 64 166 64 162 68C157 63 150 62 146 66C141 62 135 62 131 64Z" fill="#FF6B8B" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M160 39C152 46 147 55 146 66M160 39C164 47 164 57 162 68" stroke="#FFE3EC" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="142" cy="54" r="2.2" fill="#FFFFFF"/>
        <circle cx="155" cy="52" r="2.2" fill="#FFFFFF"/>
        <circle cx="169" cy="56" r="2.2" fill="#FFFFFF"/>
        <path d="M155 40L160 34L165 41Z" fill="#51CF66" stroke="#4A3728" stroke-width="2.2" stroke-linejoin="round"/>
      </g>
    `,

    hand_icecream: () => `
      <g class="chicken-acc chicken-acc-hand-icecream">
        <polygon points="145,84 167,84 156,124" fill="#F6C270" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M149 92L161 98M151 102L160 107M162 91L151 99M160 101L153 108" stroke="#D99438" stroke-width="2" stroke-linecap="round"/>
        <circle cx="156" cy="74" r="12.5" fill="#FF9EC7" stroke="#4A3728" stroke-width="3.4"/>
        <circle cx="147" cy="82" r="4" fill="#FF9EC7" stroke="#4A3728" stroke-width="2.4"/>
        <circle cx="156" cy="83" r="4.2" fill="#FF9EC7" stroke="#4A3728" stroke-width="2.4"/>
        <circle cx="165" cy="82" r="4" fill="#FF9EC7" stroke="#4A3728" stroke-width="2.4"/>
        <circle cx="156" cy="58" r="11" fill="#C3FAE8" stroke="#4A3728" stroke-width="3.4"/>
        <circle cx="151" cy="56" r="1.5" fill="#FF5D6C"/>
        <circle cx="160" cy="55" r="1.5" fill="#FFD43B"/>
        <circle cx="157" cy="62" r="1.5" fill="#74C0FC"/>
        <circle cx="156" cy="45" r="4.4" fill="#FF4D5E" stroke="#4A3728" stroke-width="2.4"/>
        <path d="M156 41C158 37 161 36 163 37" stroke="#3F9A29" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="154.5" cy="43.8" r="1.2" fill="#FFFFFF"/>
      </g>
    `,

    wand: () => `
      <g class="chicken-acc chicken-acc-wand">
        <path d="M139 118L159 64" stroke="#4A3728" stroke-width="7.6" stroke-linecap="round"/>
        <path d="M139 118L159 64" stroke="#FFD43B" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M153 79L161 84" stroke="#FF85C0" stroke-width="3.2" stroke-linecap="round"/>
        ${starPoly(160, 58, 12.2, '#FFE066', '#4A3728', 3)}
        <circle cx="160" cy="58" r="3.2" fill="#FFF9DB"/>
        ${sparklePoly(145, 50, 5, '#FFF3BF', '#F59F00', 1.2)}
        <circle cx="173" cy="49" r="2.4" fill="#FF85C0"/>
        <circle cx="171" cy="74" r="2.2" fill="#74C0FC"/>
      </g>
    `,

    hand_guitar: () => `
      <g class="chicken-acc chicken-acc-hand-guitar">
        <g transform="rotate(24 150 96)">
          <rect x="146" y="48" width="8" height="36" rx="2" fill="#D99438" stroke="#4A3728" stroke-width="3"/>
          <rect x="144" y="42" width="12" height="10" rx="3" fill="#FF8A65" stroke="#4A3728" stroke-width="2.8"/>
          <circle cx="142" cy="45" r="2" fill="#FFE066" stroke="#4A3728" stroke-width="1.4"/>
          <circle cx="158" cy="45" r="2" fill="#FFE066" stroke="#4A3728" stroke-width="1.4"/>
          <circle cx="142" cy="50" r="2" fill="#FFE066" stroke="#4A3728" stroke-width="1.4"/>
          <circle cx="158" cy="50" r="2" fill="#FFE066" stroke="#4A3728" stroke-width="1.4"/>
          <path d="M139 84C135 84 134 94 139 99C132 106 132 122 143 125H157C168 122 168 106 161 99C166 94 165 84 161 84Z" fill="#FF8A65" stroke="#4A3728" stroke-width="3.6" stroke-linejoin="round"/>
          <circle cx="150" cy="100" r="6.5" fill="#4A3728" stroke="#FFE066" stroke-width="2.4"/>
          <rect x="143" y="113" width="14" height="4.5" rx="2" fill="#FFF3BF" stroke="#4A3728" stroke-width="2"/>
          <line x1="148" y1="52" x2="148" y2="113" stroke="#FFF9DB" stroke-width="1.2"/>
          <line x1="152" y1="52" x2="152" y2="113" stroke="#FFF9DB" stroke-width="1.2"/>
        </g>
        <circle cx="169" cy="54" r="3" fill="#FF6B9D" stroke="#4A3728" stroke-width="1.6"/>
        <path d="M172 54V43L177 45" stroke="#4A3728" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    `
  };

  const SLOT_MAPS = {
    head: HEAD_RENDERERS,
    body: BODY_RENDERERS,
    neck: NECK_RENDERERS,
    eyes: EYES_RENDERERS,
    feet: FEET_RENDERERS,
    back: BACK_RENDERERS,
    hand: HAND_RENDERERS
  };

  const ITEM_TO_SLOT = {};
  Object.keys(SLOT_MAPS).forEach(slot => {
    Object.keys(SLOT_MAPS[slot]).forEach(id => {
      ITEM_TO_SLOT[id] = slot;
    });
  });

  // Tight per-slot & per-item thumbnail viewBoxes so every prop fills its card cleanly
  const THUMB_VIEWBOX_BY_SLOT = {
    head: '36 -4 88 54',
    body: '26 82 128 80',
    neck: '46 82 68 48',
    eyes: '40 36 80 48',
    feet: '42 134 96 44',
    back: '0 48 180 98',
    hand: '122 32 60 100'
  };

  const THUMB_VIEWBOX_BY_ID = {
    head_flower:   '38 10 84 42',
    crown:         '44 -2 72 46',
    head_bunny:    '40 -2 80 48',
    head_beret:    '40 2 80 46',
    head_unicorn:  '42 -2 76 48',
    head_wizard:   '36 -2 88 52',
    body_apron:    '34 80 110 78',
    body_overalls: '34 80 112 78',
    body_raincoat: '32 84 116 74',
    tutu:          '26 108 130 54',
    body_ballet:   '26 88 130 72',
    body_mermaid:  '30 88 122 74',
    bow:           '58 84 44 30',
    neck_bell:     '48 84 64 40',
    neck_scarf:    '44 84 74 52',
    neck_pearl:    '48 86 64 40',
    neck_bib:      '50 86 60 46',
    neck_cape:     '22 78 136 90',
    eyes_round:    '42 40 76 40',
    sunglasses:    '42 40 76 40',
    eyes_heart:    '42 40 76 42',
    eyes_star:     '40 38 80 44',
    eyes_daisy:    '38 36 84 48',
    eyes_mask:     '40 38 80 42',
    feet_socks:    '48 134 84 38',
    boots:         '44 136 92 38',
    feet_maryjane: '46 138 88 36',
    feet_sneakers: '44 140 92 36',
    feet_bunny:    '42 136 96 40',
    feet_skates:   '44 136 92 44',
    back_bee:      '4 58 172 68',
    back_butterfly:'0 54 180 90',
    back_angel:    '0 54 180 82',
    wings:         '0 66 180 74',
    back_fairy:    '0 50 180 96',
    back_dragon:   '0 56 180 76',
    hand_lollipop: '128 42 54 88',
    hand_balloon:  '130 34 52 94',
    hand_umbrella: '124 30 58 104',
    hand_icecream: '132 32 48 98',
    wand:          '128 38 52 88',
    hand_guitar:   '120 38 62 96'
  };

  function getItemSlot(itemId) {
    if (typeof itemId !== 'string' || !itemId) return null;
    if (ITEM_TO_SLOT[itemId]) return ITEM_TO_SLOT[itemId];
    const catalog = HMC.data && HMC.data.WARDROBE_BY_ID;
    return (catalog && catalog[itemId] && catalog[itemId].slot) || null;
  }

  function renderLayer(slot, itemId, sleeping = false) {
    if (!slot || !itemId || typeof itemId !== 'string') return '';
    if (sleeping && (slot === 'head' || slot === 'eyes')) {
      return '';
    }
    if (slot === 'back' && itemId === 'neck_cape') {
      return NECK_CAPE_BACK();
    }
    const map = SLOT_MAPS[slot];
    if (!map || typeof map[itemId] !== 'function') return '';
    return map[itemId]();
  }

  function renderItemThumbnail(itemId, size = 46) {
    const slot = getItemSlot(itemId);
    if (!slot) return '';
    let inner = '';
    if (itemId === 'neck_cape') {
      inner = NECK_CAPE_BACK() + NECK_RENDERERS.neck_cape();
    } else {
      inner = renderLayer(slot, itemId, false);
    }
    if (!inner) return '';
    const vb = THUMB_VIEWBOX_BY_ID[itemId] || THUMB_VIEWBOX_BY_SLOT[slot] || '0 0 180 180';
    return `<svg class="wardrobe-thumb-svg" width="${size}" height="${size}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true">${inner}</svg>`;
  }

  HMC.svgWardrobe = {
    renderLayer,
    renderItemThumbnail,
    getItemSlot
  };
})(window.HMC = window.HMC || {});
