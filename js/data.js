(function (HMC) {
  'use strict';

  const COLORS = [
    { id: 'red',     zh: '红色',   en: 'Red',      fill: '#FF5D6C', light: '#FF9AA4', nestBg: '#FFE5E8', icon: '🍓' },
    { id: 'yellow',  zh: '黄色',   en: 'Yellow',   fill: '#FFD43B', light: '#FFF0A8', nestBg: '#FFF9D6', icon: '🌻' },
    { id: 'blue',    zh: '蓝色',   en: 'Blue',     fill: '#339AF0', light: '#A5D8FF', nestBg: '#E3F2FF', icon: '🫐' },
    { id: 'green',   zh: '绿色',   en: 'Green',    fill: '#51CF66', light: '#B2F2BB', nestBg: '#E6FAEA', icon: '🍀' },
    { id: 'orange',  zh: '橙色',   en: 'Orange',   fill: '#FF922B', light: '#FFD8A8', nestBg: '#FFF1E0', icon: '🍊' },
    { id: 'purple',  zh: '紫色',   en: 'Purple',   fill: '#9775FA', light: '#E5DBFF', nestBg: '#F3EEFF', icon: '🍇' },
    { id: 'pink',    zh: '粉色',   en: 'Pink',     fill: '#FF85C0', light: '#FFC9E3', nestBg: '#FFEBF5', icon: '🌸' },
    { id: 'skyblue', zh: '天蓝色', en: 'Sky Blue', fill: '#74C0FC', light: '#D0EBFF', nestBg: '#EBF7FF', icon: '☁️' },
    { id: 'white',   zh: '白色',   en: 'White',    fill: '#FFFFFF', light: '#F1F3F5', nestBg: '#F8F9FA', icon: '🥛' }
  ];
  const COLOR_BY_ID = Object.fromEntries(COLORS.map(c => [c.id, c]));

  const BASIC_COLOR_IDS = ['red', 'yellow', 'blue', 'green', 'pink', 'purple'];
  const BASE_PAINTS = ['red', 'yellow', 'blue', 'white'];
  const MIX_RECIPES = [
    { pair: ['red', 'yellow'],  result: 'orange' },
    { pair: ['yellow', 'blue'], result: 'green' },
    { pair: ['red', 'blue'],    result: 'purple' },
    { pair: ['red', 'white'],   result: 'pink' },
    { pair: ['blue', 'white'],  result: 'skyblue' }
  ];

  function getMixResult(a, b) {
    if (a === b) return COLOR_BY_ID[a];
    const key = [a, b].sort().join('+');
    const map = {
      'red+yellow': 'orange',
      'blue+yellow': 'green',
      'blue+red': 'purple',
      'red+white': 'pink',
      'blue+white': 'skyblue',
      'white+yellow': 'yellow'
    };
    if (key === 'white+yellow') {
      return { id: 'paleyellow', zh: '浅黄色', en: 'Light Yellow', fill: '#FFF3BF', light: '#FFF9DB', icon: '🍋' };
    }
    return COLOR_BY_ID[map[key]] || COLOR_BY_ID.purple;
  }

  const SHAPES = [
    { id: 'circle',     zh: '圆形',   en: 'Circle',     color: '#FF6B6B', bg: '#FFE8E8' },
    { id: 'triangle',   zh: '三角形', en: 'Triangle',   color: '#38B000', bg: '#E7F9E0' },
    { id: 'square',     zh: '正方形', en: 'Square',     color: '#339AF0', bg: '#E3F2FF' },
    { id: 'rectangle',  zh: '长方形', en: 'Rectangle',  color: '#FF922B', bg: '#FFF0E0' },
    { id: 'diamond',    zh: '菱形',   en: 'Diamond',    color: '#9775FA', bg: '#F2EBFF' },
    { id: 'semicircle', zh: '半圆形', en: 'Semicircle', color: '#20C997', bg: '#E3FAF3' },
    { id: 'star',       zh: '星星',   en: 'Star',       color: '#F59F00', bg: '#FFF4D6' },
    { id: 'heart',      zh: '爱心',   en: 'Heart',      color: '#F06595', bg: '#FFE6F0' }
  ];
  const SHAPE_BY_ID = Object.fromEntries(SHAPES.map(s => [s.id, s]));

  const BASIC_SHAPE_IDS = ['circle', 'triangle', 'square', 'star', 'heart'];
  const ADV_SHAPE_IDS = ['circle', 'triangle', 'square', 'rectangle', 'diamond', 'star', 'heart'];

  const ACCESSORIES = ['bow', 'crown', 'flower', 'star', 'hat'];
  const EGG_PALETTES = [
    { base: '#FFE066', spot: '#FF922B' },
    { base: '#FFA8D5', spot: '#FFFFFF' },
    { base: '#8CE99A', spot: '#FFF3BF' },
    { base: '#74C0FC', spot: '#FFFFFF' },
    { base: '#D0BFFF', spot: '#FFE066' },
    { base: '#FFC078', spot: '#FFFFFF' }
  ];
  const CHICK_COLORS = ['#FFE066', '#FFF0A8', '#FFD6E7', '#FFE3B3', '#C5F6FA'];
  const MAX_CLASSIC_ITEMS = 15;

  const RARE_CATEGORIES = [
    { id: 'animals',   icon: '🦕', zh: '动物朋友', en: 'Animal Friends' },
    { id: 'magic',     icon: '🧙', zh: '童话魔法', en: 'Magic Fairytale' },
    { id: 'food',      icon: '🍓', zh: '甜蜜美食', en: 'Sweet Treats' },
    { id: 'adventure', icon: '🚀', zh: '职业星空', en: 'Dream Jobs' }
  ];
  const RARE_CATEGORY_BY_ID = Object.fromEntries(RARE_CATEGORIES.map(c => [c.id, c]));

  const RARE_BUDDIES = [
    // 1. animals (🦕 动物朋友, 6 buddies)
    { id: 'dino',        category: 'animals',   zh: '绿色小恐龙',   shortZh: '小恐龙', en: 'Baby Dinosaur',     icon: '🦖', color: '#58C952', praiseZh: '嗷呜！孵出了乔治最爱的绿色小恐龙！',     praiseEn: 'Roar! A cute green baby dinosaur!' },
    { id: 'duck',        category: 'animals',   zh: '爱玩水小黄鸭', shortZh: '小黄鸭', en: 'Little Duckling',   icon: '🦆', color: '#FFD43B', praiseZh: '嘎嘎！孵出了爱跳泥坑的小黄鸭！',         praiseEn: 'Quack quack! A playful little duckling!' },
    { id: 'bunny',       category: 'animals',   zh: '草莓垂耳小兔', shortZh: '垂耳兔', en: 'Strawberry Bunny',  icon: '🐰', color: '#FF9EC7', praiseZh: '蹦蹦跳跳！孵出了草莓垂耳小兔！',         praiseEn: 'Hop hop! A sweet strawberry bunny!' },
    { id: 'bear',        category: 'animals',   zh: '蜂蜜小熊熊',   shortZh: '小熊熊', en: 'Honey Bear',        icon: '🧸', color: '#D4925A', praiseZh: '抱一抱！孵出了爱吃蜂蜜的小熊熊！',       praiseEn: 'Warm hugs! A cuddly honey bear!' },
    { id: 'cat',         category: 'animals',   zh: '奶牛小花猫',   shortZh: '小花猫', en: 'Spotted Kitty',     icon: '🐱', color: '#74C0FC', praiseZh: '喵呜！孵出了爱打呼噜的奶牛小花猫！',     praiseEn: 'Meow! An adorable spotted kitty!' },
    { id: 'panda',       category: 'animals',   zh: '滚滚小熊猫',   shortZh: '小熊猫', en: 'Bamboo Panda',      icon: '🐼', color: '#51CF66', praiseZh: '啃竹子咯！孵出了圆滚滚的小熊猫！',       praiseEn: 'Yum bamboo! A roly-poly bamboo panda!' },
    // 2. magic (🧙 童话魔法, 6 buddies)
    { id: 'wizard',      category: 'magic',     zh: '星空魔法小鸡', shortZh: '魔法鸡', en: 'Wizard Chick',      icon: '🧙', color: '#9C6ADE', praiseZh: '哇！孵出了会变星星魔术的魔法小鸡！',     praiseEn: 'Abracadabra! A starry wizard chick!' },
    { id: 'rainbow',     category: 'magic',     zh: '彩虹翅膀小鸡', shortZh: '彩虹鸡', en: 'Rainbow Chick',     icon: '🌈', color: '#FF7EB6', praiseZh: '好美呀！孵出了七彩彩虹翅膀小鸡！',       praiseEn: 'Look! A dazzling rainbow wing chick!' },
    { id: 'unicorn',     category: 'magic',     zh: '独角兽小鸡',   shortZh: '独角兽', en: 'Unicorn Chick',     icon: '🦄', color: '#C490FF', praiseZh: '叮铃铃！孵出了闪闪发光的独角兽小鸡！',   praiseEn: 'Sparkle! A magical unicorn chick!' },
    { id: 'fairy',       category: 'magic',     zh: '花仙子小鸡',   shortZh: '花仙子', en: 'Flower Fairy',      icon: '🧚', color: '#69DB7C', praiseZh: '花香飘飘！孵出了温柔的花仙子小鸡！',     praiseEn: 'Flutter flutter! A lovely flower fairy!' },
    { id: 'princess',    category: 'magic',     zh: '皇冠公主小鸡', shortZh: '公主鸡', en: 'Princess Chick',    icon: '👸', color: '#FF85C0', praiseZh: '转个圈圈！孵出了戴皇冠的公主小鸡！',     praiseEn: 'Twirl around! A royal princess chick!' },
    { id: 'mermaid',     category: 'magic',     zh: '人鱼泡泡小鸡', shortZh: '人鱼鸡', en: 'Mermaid Chick',     icon: '🧜‍♀️', color: '#38D9A9', praiseZh: '咕噜咕噜！孵出了会吐泡泡的人鱼小鸡！',   praiseEn: 'Bubble pop! A sparkling mermaid chick!' },
    // 3. food (🍓 甜蜜美食, 6 buddies)
    { id: 'strawberry',  category: 'food',      zh: '草莓奶油小鸡', shortZh: '草莓鸡', en: 'Strawberry Chick',  icon: '🍓', color: '#FF5D6C', praiseZh: '甜蜜蜜！孵出了草莓奶油小鸡！',           praiseEn: 'So sweet! A strawberry cream chick!' },
    { id: 'cupcake',     category: 'food',      zh: '纸杯蛋糕小鸡', shortZh: '蛋糕鸡', en: 'Cupcake Chick',     icon: '🧁', color: '#FF94C2', praiseZh: '香喷喷！孵出了软绵绵的纸杯蛋糕小鸡！',   praiseEn: 'Yummy! A sweet cupcake chick!' },
    { id: 'donut',       category: 'food',      zh: '糖霜甜甜圈鸡', shortZh: '甜甜圈', en: 'Donut Chick',       icon: '🍩', color: '#F783AC', praiseZh: '咬一口！孵出了彩虹糖霜甜甜圈鸡！',       praiseEn: 'Sprinkles! A glazed donut chick!' },
    { id: 'icecream',    category: 'food',      zh: '甜筒冰淇淋鸡', shortZh: '冰淇淋', en: 'Ice Cream Chick',   icon: '🍦', color: '#74C0FC', praiseZh: '冰凉凉！孵出了甜筒冰淇淋小鸡！',         praiseEn: 'Cool treat! An ice cream chick!' },
    { id: 'peach',       category: 'food',      zh: '粉红水蜜桃鸡', shortZh: '水蜜桃', en: 'Peach Chick',       icon: '🍑', color: '#FFA8A8', praiseZh: '水灵灵！孵出了粉红水蜜桃小鸡！',         praiseEn: 'Peachy keen! A rosy pink peach chick!' },
    { id: 'pudding',     category: 'food',      zh: '焦糖布丁小鸡', shortZh: '布丁鸡', en: 'Pudding Chick',     icon: '🍮', color: '#FCC419', praiseZh: '晃呀晃！孵出了Q弹的焦糖布丁小鸡！',      praiseEn: 'Wiggle jiggle! A caramel pudding chick!' },
    // 4. adventure (🚀 职业星空, 6 buddies)
    { id: 'astronaut',   category: 'adventure', zh: '太空宇航员鸡', shortZh: '宇航员', en: 'Astro Chick',       icon: '🧑‍🚀', color: '#4DABF7', praiseZh: '出发去太空！孵出了太空宇航员鸡！',       praiseEn: 'Blast off! A brave astro chick!' },
    { id: 'doctor',      category: 'adventure', zh: '爱心小医生鸡', shortZh: '小医生', en: 'Doctor Chick',      icon: '🩺', color: '#FF6B6B', praiseZh: '听听心跳！孵出了温柔的爱心小医生鸡！',   praiseEn: 'Check-up time! A caring doctor chick!' },
    { id: 'chef',        category: 'adventure', zh: '大厨蛋糕鸡',   shortZh: '小厨师', en: 'Chef Chick',        icon: '👨‍🍳', color: '#FFB74D', praiseZh: '叮咚出炉！孵出了手艺超棒的大厨蛋糕鸡！', praiseEn: 'Bon appetit! A master chef chick!' },
    { id: 'firefighter', category: 'adventure', zh: '勇敢消防员鸡', shortZh: '消防员', en: 'Firefighter Chick', icon: '🚒', color: '#FF5252', praiseZh: '呜哇呜哇！孵出了超勇敢的消防员鸡！',     praiseEn: 'Hero to the rescue! A brave firefighter chick!' },
    { id: 'pirate',      category: 'adventure', zh: '寻宝小船长鸡', shortZh: '小船长', en: 'Captain Chick',     icon: '🏴‍☠️', color: '#8D6E63', praiseZh: '扬帆起航！孵出了爱寻宝的小船长鸡！',     praiseEn: 'Ahoy matey! A treasure captain chick!' },
    { id: 'painter',     category: 'adventure', zh: '彩虹小画家鸡', shortZh: '小画家', en: 'Painter Chick',     icon: '🎨', color: '#9775FA', praiseZh: '画道彩虹！孵出了爱画画的小画家鸡！',     praiseEn: 'Paint a rainbow! A creative painter chick!' }
  ];
  const RARE_BUDDY_BY_ID = Object.fromEntries(RARE_BUDDIES.map(b => [b.id, b]));

  const WARDROBE_CATEGORIES = [
    { id: 'head', icon: '👑', zh: '头饰', en: 'Hats' },
    { id: 'body', icon: '👗', zh: '衣服', en: 'Outfits' },
    { id: 'neck', icon: '🎀', zh: '颈饰', en: 'Neck' },
    { id: 'eyes', icon: '🕶️', zh: '眼镜', en: 'Glasses' },
    { id: 'feet', icon: '👢', zh: '鞋袜', en: 'Shoes' },
    { id: 'back', icon: '🌈', zh: '翅膀', en: 'Wings' },
    { id: 'hand', icon: '🪄', zh: '手持', en: 'Props' }
  ];
  const WARDROBE_CATEGORY_BY_ID = Object.fromEntries(WARDROBE_CATEGORIES.map(c => [c.id, c]));

  const WARDROBE_ITEMS = [
    // 1. head (👑 头饰, 6 items)
    { id: 'head_flower',    slot: 'head', icon: '🌸',   zh: '春日花环',     en: 'Flower Crown',     cost: 1 },
    { id: 'crown',          slot: 'head', icon: '👑',   zh: '闪亮小皇冠',   en: 'Gold Crown',       cost: 3 },
    { id: 'head_bunny',     slot: 'head', icon: '🐰',   zh: '软软兔耳朵',   en: 'Bunny Ears',       cost: 6 },
    { id: 'head_beret',     slot: 'head', icon: '🍓',   zh: '草莓贝雷帽',   en: 'Berry Beret',      cost: 10 },
    { id: 'head_unicorn',   slot: 'head', icon: '🦄',   zh: '彩虹独角兽角', en: 'Unicorn Horn',     cost: 16 },
    { id: 'head_wizard',    slot: 'head', icon: '🧙',   zh: '星空魔法帽',   en: 'Starry Hat',       cost: 24 },
    // 2. body (👗 衣服, 6 items)
    { id: 'body_apron',     slot: 'body', icon: '🌼',   zh: '小花围裙',     en: 'Daisy Apron',      cost: 2 },
    { id: 'body_overalls',  slot: 'body', icon: '👖',   zh: '蓝牛仔背带裤', en: 'Denim Overalls',   cost: 5 },
    { id: 'body_raincoat',  slot: 'body', icon: '🌧️',   zh: '小鸭黄雨衣',   en: 'Duck Raincoat',    cost: 8 },
    { id: 'tutu',           slot: 'body', icon: '👗',   zh: '公主粉纱裙',   en: 'Princess Tutu',    cost: 12 },
    { id: 'body_ballet',    slot: 'body', icon: '🩰',   zh: '星空芭蕾裙',   en: 'Starry Ballet',    cost: 18 },
    { id: 'body_mermaid',   slot: 'body', icon: '🧜‍♀️', zh: '闪亮人鱼裙',   en: 'Mermaid Dress',    cost: 28 },
    // 3. neck (🎀 颈饰, 6 items)
    { id: 'bow',            slot: 'neck', icon: '🎀',   zh: '经典粉蝴蝶结', en: 'Pink Bow',         cost: 0 },
    { id: 'neck_bell',      slot: 'neck', icon: '🔔',   zh: '金色小铃铛',   en: 'Gold Bell',        cost: 2 },
    { id: 'neck_scarf',     slot: 'neck', icon: '🧣',   zh: '彩虹暖围巾',   en: 'Rainbow Scarf',    cost: 5 },
    { id: 'neck_pearl',     slot: 'neck', icon: '🫧',   zh: '珍珠小项链',   en: 'Pearl Necklace',   cost: 9 },
    { id: 'neck_bib',       slot: 'neck', icon: '🍓',   zh: '草莓小围兜',   en: 'Berry Bib',        cost: 14 },
    { id: 'neck_cape',      slot: 'neck', icon: '🦸',   zh: '星星小披风',   en: 'Star Cape',        cost: 20 },
    // 4. eyes (🕶️ 眼镜, 6 items)
    { id: 'eyes_round',     slot: 'eyes', icon: '👓',   zh: '可爱圆眼镜',   en: 'Round Glasses',    cost: 3 },
    { id: 'sunglasses',     slot: 'eyes', icon: '🕶️',   zh: '酷酷小墨镜',   en: 'Cool Shades',      cost: 8 },
    { id: 'eyes_heart',     slot: 'eyes', icon: '💖',   zh: '粉红爱心镜',   en: 'Heart Shades',     cost: 11 },
    { id: 'eyes_star',      slot: 'eyes', icon: '⭐',   zh: '闪亮星星镜',   en: 'Star Shades',      cost: 15 },
    { id: 'eyes_daisy',     slot: 'eyes', icon: '🌼',   zh: '小雏菊花镜',   en: 'Daisy Shades',     cost: 21 },
    { id: 'eyes_mask',      slot: 'eyes', icon: '🎭',   zh: '舞会闪亮眼罩', en: 'Party Mask',       cost: 30 },
    // 5. feet (👢 鞋袜, 6 items)
    { id: 'feet_socks',     slot: 'feet', icon: '🧦',   zh: '草莓条纹袜',   en: 'Stripe Socks',     cost: 1 },
    { id: 'boots',          slot: 'feet', icon: '👢',   zh: '佩奇黄雨靴',   en: 'Yellow Boots',     cost: 5 },
    { id: 'feet_maryjane',  slot: 'feet', icon: '🩰',   zh: '粉色公主鞋',   en: 'Pink Shoes',       cost: 9 },
    { id: 'feet_sneakers',  slot: 'feet', icon: '👟',   zh: '彩虹运动鞋',   en: 'Rainbow Sneakers', cost: 13 },
    { id: 'feet_bunny',     slot: 'feet', icon: '🐰',   zh: '绒绒兔拖鞋',   en: 'Bunny Slippers',   cost: 19 },
    { id: 'feet_skates',    slot: 'feet', icon: '🛼',   zh: '闪亮轮滑鞋',   en: 'Roller Skates',    cost: 26 },
    // 6. back (🌈 翅膀, 6 items)
    { id: 'back_bee',       slot: 'back', icon: '🐝',   zh: '小蜜蜂透明翅', en: 'Bee Wings',        cost: 4 },
    { id: 'back_butterfly', slot: 'back', icon: '🦋',   zh: '粉蓝蝴蝶翅',   en: 'Butterfly Wings',  cost: 8 },
    { id: 'back_angel',     slot: 'back', icon: '👼',   zh: '软绵天使羽翅', en: 'Angel Wings',      cost: 12 },
    { id: 'wings',          slot: 'back', icon: '🌈',   zh: '彩虹七彩翅',   en: 'Rainbow Wings',    cost: 16 },
    { id: 'back_fairy',     slot: 'back', icon: '🧚',   zh: '闪亮精灵花翅', en: 'Fairy Wings',      cost: 22 },
    { id: 'back_dragon',    slot: 'back', icon: '🐉',   zh: '可爱小龙翼',   en: 'Dragon Wings',     cost: 32 },
    // 7. hand (🪄 手持, 6 items)
    { id: 'hand_lollipop',  slot: 'hand', icon: '🍭',   zh: '彩虹棒棒糖',   en: 'Lollipop',         cost: 2 },
    { id: 'hand_balloon',   slot: 'hand', icon: '🎈',   zh: '粉红爱心气球', en: 'Heart Balloon',    cost: 6 },
    { id: 'hand_umbrella',  slot: 'hand', icon: '☂️',   zh: '草莓小花伞',   en: 'Berry Umbrella',   cost: 10 },
    { id: 'hand_icecream',  slot: 'hand', icon: '🍦',   zh: '双球冰淇淋',   en: 'Ice Cream',        cost: 14 },
    { id: 'wand',           slot: 'hand', icon: '🪄',   zh: '星光魔法棒',   en: 'Magic Wand',       cost: 20 },
    { id: 'hand_guitar',    slot: 'hand', icon: '🎸',   zh: '迷你小吉他',   en: 'Mini Guitar',      cost: 30 }
  ];
  const WARDROBE_BY_ID = Object.fromEntries(WARDROBE_ITEMS.map(item => [item.id, item]));

  const BLUEPRINTS = [
    {
      id: 'house', zh: '小房子', en: 'House', emoji: '🏠',
      parts: [
        { shape: 'triangle', cx: 100, cy: 52, size: 78, fill: '#FF6B6B' },
        { shape: 'square',   cx: 100, cy: 120, size: 74, fill: '#FFE066' }
      ],
      extras: `<rect x="88" y="122" width="24" height="35" rx="4" fill="#E07A5F" stroke="#4A3728" stroke-width="3"/><circle cx="107" cy="140" r="2.5" fill="#FFE066"/><rect x="70" y="96" width="16" height="16" rx="2" fill="#A5D8FF" stroke="#4A3728" stroke-width="2.5"/><rect x="114" y="96" width="16" height="16" rx="2" fill="#A5D8FF" stroke="#4A3728" stroke-width="2.5"/>`
    },
    {
      id: 'icecream', zh: '冰淇淋', en: 'Ice Cream', emoji: '🍦',
      parts: [
        { shape: 'circle',   cx: 100, cy: 56, size: 68, fill: '#FF9EC7' },
        { shape: 'triangle', cx: 100, cy: 120, size: 66, fill: '#F6C270', rotate: 180 }
      ],
      extras: `<circle cx="100" cy="20" r="8" fill="#FF4D5E" stroke="#4A3728" stroke-width="2.5"/><circle cx="84" cy="52" r="3" fill="#FFFFFF"/><circle cx="112" cy="48" r="3" fill="#FFE066"/><circle cx="102" cy="64" r="3" fill="#74C0FC"/>`
    },
    {
      id: 'rocket', zh: '小火箭', en: 'Rocket', emoji: '🚀',
      parts: [
        { shape: 'triangle',  cx: 100, cy: 40, size: 54, fill: '#FF5D6C' },
        { shape: 'rectangle', cx: 100, cy: 102, size: 66, fill: '#74C0FC', rotate: 90 },
        { shape: 'star',      cx: 100, cy: 98, size: 30, fill: '#FFE066' }
      ],
      extras: `<path d="M84 146Q100 174 116 146Z" fill="#FF922B" stroke="#4A3728" stroke-width="3"/><polygon points="75,118 58,142 75,140" fill="#FF5D6C" stroke="#4A3728" stroke-width="3"/><polygon points="125,118 142,142 125,140" fill="#FF5D6C" stroke="#4A3728" stroke-width="3"/>`
    },
    {
      id: 'sailboat', zh: '小帆船', en: 'Sailboat', emoji: '⛵',
      parts: [
        { shape: 'triangle',   cx: 104, cy: 62, size: 70, fill: '#FFE066' },
        { shape: 'semicircle', cx: 100, cy: 122, size: 96, fill: '#4DABF7', rotate: 180 }
      ],
      extras: `<line x1="98" y1="26" x2="98" y2="112" stroke="#4A3728" stroke-width="4" stroke-linecap="round"/><path d="M34 156Q58 146 82 156T130 156T170 156" stroke="#339AF0" stroke-width="4" stroke-linecap="round" fill="none"/>`
    },
    {
      id: 'tree', zh: '圣诞树', en: 'Tree', emoji: '🎄',
      parts: [
        { shape: 'star',      cx: 100, cy: 26, size: 32, fill: '#FFD43B' },
        { shape: 'triangle',  cx: 100, cy: 82, size: 84, fill: '#51CF66' },
        { shape: 'rectangle', cx: 100, cy: 142, size: 34, fill: '#B07240', rotate: 90 }
      ],
      extras: `<circle cx="90" cy="78" r="5" fill="#FF5D6C"/><circle cx="112" cy="94" r="5" fill="#FFE066"/><circle cx="88" cy="102" r="5" fill="#74C0FC"/>`
    },
    {
      id: 'kite', zh: '魔法风筝', en: 'Kite', emoji: '🪁',
      parts: [
        { shape: 'diamond', cx: 100, cy: 76, size: 92, fill: '#B197FC' },
        { shape: 'star',    cx: 100, cy: 76, size: 34, fill: '#FFE066' }
      ],
      extras: `<path d="M100 124Q116 142 96 164" stroke="#4A3728" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="107" cy="144" r="5" fill="#FF85C0" stroke="#4A3728" stroke-width="2"/>`
    }
  ];

  const SIZE_TIERS_3 = [
    { id: 'small',  rank: 0, zh: '小', en: 'Small',  eggZh: '小蛋', nestZh: '小窝', eggSize: 44, chickSize: 46, nestScale: 0.62 },
    { id: 'medium', rank: 1, zh: '中', en: 'Medium', eggZh: '中蛋', nestZh: '中窝', eggSize: 68, chickSize: 68, nestScale: 0.86 },
    { id: 'big',    rank: 2, zh: '大', en: 'Big',    eggZh: '大蛋', nestZh: '大窝', eggSize: 96, chickSize: 94, nestScale: 1.12 }
  ];

  const SIZE_TIERS_4 = [
    { id: 'xs', rank: 0, zh: '最小', en: 'Tiny',  eggSize: 38, chickSize: 40 },
    { id: 'sm', rank: 1, zh: '小',   en: 'Small', eggSize: 54, chickSize: 56 },
    { id: 'md', rank: 2, zh: '大',   en: 'Big',   eggSize: 72, chickSize: 74 },
    { id: 'lg', rank: 3, zh: '最大', en: 'Giant', eggSize: 92, chickSize: 92 }
  ];

  const PIANO_NOTES = [
    { num: 1, key: 'C5', freq: 523.25, solfege: 'Do',  zh: '哆', color: '#FF5D6C', light: '#FFE3E6', dark: '#D63848', accessory: 'bow' },
    { num: 2, key: 'D5', freq: 587.33, solfege: 'Re',  zh: '来', color: '#FF922B', light: '#FFF0DE', dark: '#D46B08', accessory: 'flower' },
    { num: 3, key: 'E5', freq: 659.25, solfege: 'Mi',  zh: '咪', color: '#FFD43B', light: '#FFF9D6', dark: '#C88A00', accessory: 'crown' },
    { num: 4, key: 'F5', freq: 698.46, solfege: 'Fa',  zh: '发', color: '#51CF66', light: '#E6FAEA', dark: '#2F9E44', accessory: 'star' },
    { num: 5, key: 'G5', freq: 783.99, solfege: 'Sol', zh: '嗦', color: '#38B6FF', light: '#E3F5FF', dark: '#1971C2', accessory: 'hat' },
    { num: 6, key: 'A5', freq: 880.00, solfege: 'La',  zh: '拉', color: '#5C7CFA', light: '#E8EDFF', dark: '#3B5BDB', accessory: 'bow' },
    { num: 7, key: 'B5', freq: 987.77, solfege: 'Si',  zh: '西', color: '#B197FC', light: '#F3EEFF', dark: '#7048E8', accessory: 'crown' }
  ];

  const NURSERY_SONGS = [
    { id: 'twinkle', icon: '⭐', zh: '小星星',   en: 'Twinkle Star',   notes: [1, 1, 5, 5, 6, 6, 5, 4, 4, 3, 3, 2, 2, 1] },
    { id: 'tigers',  icon: '🐯', zh: '两只老虎', en: 'Two Tigers',     notes: [1, 2, 3, 1, 1, 2, 3, 1, 3, 4, 5, 3, 4, 5] },
    { id: 'painter', icon: '🖌️', zh: '粉刷匠',   en: 'Little Painter', notes: [5, 3, 5, 3, 5, 3, 1, 2, 4, 3, 2, 5] }
  ];
  const NURSERY_SONG_BY_ID = Object.fromEntries(NURSERY_SONGS.map(s => [s.id, s]));

  const VOICE_SLOTS = [
    { id: 'praise', icon: '🌟', title: '答对夸奖',   hintTpl: '例：“你真棒！答对啦！”' },
    { id: 'lay',    icon: '🥚', title: '下蛋咯咯哒', hintTpl: '例：“咯咯哒！快乐小鸡下蛋啦！”' },
    { id: 'party',  icon: '🎉', title: '集星开派对', hintTpl: '例：“太厉害啦，开派对咯！”' },
    { id: 'sleep',  icon: '🌙', title: '护眼说晚安', hintTpl: '例：“小鸡睡觉咯，晚安哟！”' }
  ];
  const VOICE_SLOT_BY_ID = Object.fromEntries(VOICE_SLOTS.map(s => [s.id, s]));

  const INSIGHT_SKILLS = [
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
  const INSIGHT_SKILL_BY_ID = Object.fromEntries(INSIGHT_SKILLS.map(s => [s.id, s]));

  const prefs = HMC.storage ? HMC.storage.loadPrefs() : { lang: 'zh', soundOn: true };

  HMC.data = {
    COLORS,
    COLOR_BY_ID,
    BASIC_COLOR_IDS,
    BASE_PAINTS,
    MIX_RECIPES,
    getMixResult,
    SHAPES,
    SHAPE_BY_ID,
    BASIC_SHAPE_IDS,
    ADV_SHAPE_IDS,
    ACCESSORIES,
    EGG_PALETTES,
    CHICK_COLORS,
    MAX_CLASSIC_ITEMS,
    RARE_CATEGORIES,
    RARE_CATEGORY_BY_ID,
    RARE_BUDDIES,
    RARE_BUDDY_BY_ID,
    WARDROBE_CATEGORIES,
    WARDROBE_CATEGORY_BY_ID,
    WARDROBE_ITEMS,
    WARDROBE_BY_ID,
    BLUEPRINTS,
    SIZE_TIERS_3,
    SIZE_TIERS_4,
    PIANO_NOTES,
    NURSERY_SONGS,
    NURSERY_SONG_BY_ID,
    VOICE_SLOTS,
    VOICE_SLOT_BY_ID,
    INSIGHT_SKILLS,
    INSIGHT_SKILL_BY_ID
  };

  HMC.state = {
    mode: 'classic',
    soundOn: prefs.soundOn,
    lang: prefs.lang, // 'zh' | 'bi' | 'en'
    weather: 'sunny',
    stars: 0,
    totalStars: 0,
    lastPromptZh: '',
    lastPromptEn: '',
    lastPromptVoiceStyle: 'daily',
    classicItems: [],
    classicLayCount: 0,
    chickenX: 50,
    chickenY: 56,
    chickenFlip: false,
    lastLayTs: 0,
    // Color Challenge Mode (basic | mix | pattern)
    colorSubMode: 'mix',
    colorBasicRound: null,
    colorMixWins: 0,
    colorMixRound: null,
    colorPatternWins: 0,
    colorPatternRound: null,
    colorLocked: false,
    colorWrongCount: 0,
    // Math Growth Mode (feed | size | addsub)
    mathSubMode: 'feed',
    feedRound: null,
    feedLocked: false,
    feedCompletedCount: 0,
    sizeWins: 0,
    sizeRound: null,
    addSubWins: 0,
    addSubRound: null,
    mathLocked: false,
    mathWrongCount: 0,
    // Shape Challenge Mode (basic | clue | build | odd)
    shapeSubMode: 'clue',
    shapeBasicRound: null,
    shapeClueWins: 0,
    shapeClueRound: null,
    shapeBuildWins: 0,
    shapeBuildRound: null,
    shapeOddWins: 0,
    shapeOddRound: null,
    shapeLocked: false,
    shapeWrongCount: 0,
    // Play Park Mode (piano | habits)
    playSubMode: 'piano',
    pianoSongId: 'twinkle',
    pianoStep: 0,
    habitStory: 'bath',
    habitStep: 0,
    habitSubProgress: 0,
    // Eye-Care Timer
    timerEndAt: null,
    timerInterval: null
  };

  HMC.modes = HMC.modes || {};
})(window.HMC = window.HMC || {});
