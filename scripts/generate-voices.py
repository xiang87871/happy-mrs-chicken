#!/usr/bin/env python3
"""
Generate the offline neural MP3 voice pack for Happy Mrs. Chicken:
- Daily Chinese:   zh-CN-YunxiaNeural (-4%)  — cute lively cartoon child voice
- Bedtime Chinese: zh-CN-XiaoxiaoNeural (-6%) — warm soothing bedtime storyteller voice
- English:         en-US-AnaNeural (-4%)      — cute children's English voice

Outputs:
- audio/v/<id>.mp3  (24kbps mono 24kHz MP3 via ffmpeg for tiny size + crisp speaker clarity)
- js/voice-pack.js  (HMC.voicePack lookup + dynamic template sequence resolver)
"""

import asyncio
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import edge_tts

ROOT = "/Users/lizhi/.gemini/antigravity/scratch/happy-mrs-chicken"
AUDIO_DIR = os.path.join(ROOT, "audio", "v")
PACK_JS = os.path.join(ROOT, "js", "voice-pack.js")

VOICE_DAILY_ZH = ("zh-CN-YunxiaNeural", "-4%")
VOICE_BEDTIME_ZH = ("zh-CN-XiaoxiaoNeural", "-6%")
VOICE_EN = ("en-US-AnaNeural", "-4%")

EMOJI_RE = re.compile(
    r"[\U0001F000-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF\u2300-\u23FF\uFE0E\uFE0F\u200D\u20E3]"
)

def normalize_key(text: str) -> str:
    if not text:
        return ""
    s = text.replace("【", "").replace("】", "")
    s = EMOJI_RE.sub("", s)
    s = re.sub(r"[\u00A0\u3000\s]+", " ", s).strip()
    s = re.sub(r"\.{3,}", "…", s)
    s = re.sub(r"~+", "～", s)
    # Match js/audio.js normalizeVoiceKey exactly
    s = re.sub(r"([\u4E00-\u9FFF\u3001-\u303F\uFF00-\uFFEF])\s+", r"\1", s)
    s = re.sub(r"\s+([\u4E00-\u9FFF\u3001-\u303F\uFF00-\uFFEF])", r"\1", s)
    s = re.sub(r"\s+([,.;:!?])", r"\1", s)
    return s.strip()

def load_js_catalog():
    """Extract live catalog data directly from js/data.js via Node so it never drifts."""
    node_code = r"""
const fs = require('fs');
const vm = require('vm');
const ctx = { window: {} };
ctx.window = ctx;
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), ctx);
const d = ctx.HMC.data;
console.log(JSON.stringify({
  COLORS: d.COLORS,
  BASIC_COLOR_IDS: d.BASIC_COLOR_IDS,
  BASE_PAINTS: d.BASE_PAINTS,
  MIX_RECIPES: d.MIX_RECIPES,
  SHAPES: d.SHAPES,
  BASIC_SHAPE_IDS: d.BASIC_SHAPE_IDS,
  ADV_SHAPE_IDS: d.ADV_SHAPE_IDS,
  BLUEPRINTS: d.BLUEPRINTS,
  SIZE_TIERS_3: d.SIZE_TIERS_3,
  NURSERY_SONGS: d.NURSERY_SONGS,
  RARE_BUDDIES: d.RARE_BUDDIES,
  WARDROBE_ITEMS: d.WARDROBE_ITEMS,
  MAX_CLASSIC_ITEMS: d.MAX_CLASSIC_ITEMS
}));
"""
    out = subprocess.check_output(["node", "-e", node_code, os.path.join(ROOT, "js", "data.js")], text=True)
    return json.loads(out)

def build_corpus(cat):
    """Returns (daily_zh, bedtime_zh, en_map, splice_parts_zh) dicts mapping normalized_key -> spoken_text."""
    daily_zh = {}
    bedtime_zh = {}
    en_map = {}

    def add_zh(text, style="daily"):
        k = normalize_key(text)
        if not k:
            return
        if style == "bedtime":
            bedtime_zh[k] = k
        else:
            daily_zh[k] = k

    def add_en(text):
        k = normalize_key(text)
        if not k:
            return
        en_map[k] = k

    # ==========================================================
    # 1. BEDTIME / SLEEP SCENES -> 晓晓 (zh-CN-XiaoxiaoNeural -6%)
    # ==========================================================
    bedtime_lines_zh = [
        "快乐小鸡困啦，要睡觉咯。今天玩得真棒，让眼睛和小鸡一起休息一下吧，晚安哟！",
        "快乐小鸡困啦，要睡觉咯，晚安哟！",
        "有小恐龙陪着，好安心呀！现在抓住被角往上拉，帮小鸡盖好被子吧！",
        "有泰迪小熊陪着，好安心呀！现在抓住被角往上拉，帮小鸡盖好被子吧！",
        "有软软小兔陪着，好安心呀！现在抓住被角往上拉，帮小鸡盖好被子吧！",
        "啊～暖暖的小被子真舒服！最后往下拉一下灯绳关灯吧！",
        "刷完牙盖好被子关上灯，晚安好梦哟！",
    ]
    for s in bedtime_lines_zh:
        add_zh(s, "bedtime")

    bedtime_lines_en = [
        "Happy Mrs. Chicken is sleepy. Good night!",
        "Good morning! Happy Chicken is awake!",
        "So cozy with Little Dino! Pull the starry blanket up!",
        "So cozy with Teddy Bear! Pull the starry blanket up!",
        "So cozy with Fluffy Bunny! Pull the starry blanket up!",
        "Yawn~ So warm and cozy! Pull the star cord down to turn off the light!",
        "Sparkling teeth, cozy blanket, lights out — sweet dreams!",
    ]
    for s in bedtime_lines_en:
        add_en(s)

    # ==========================================================
    # 2. STATIC DAILY SCENES -> 云夏 (zh-CN-YunxiaNeural -4%)
    # ==========================================================
    static_daily_zh = [
        # App / Scenery / Weather
        "点草地任意地方，快乐小鸡就跑过去下蛋哦！",
        "太阳公公笑眯眯！",
        "下雨啦！小泥坑变大啦！",
        "雨停啦！天空出现美丽的彩虹！",
        "晴天啦！太阳公公笑眯眯！",
        "咕叽咕叽！小猪佩奇最喜欢跳泥坑啦！",
        "早上好！快乐小鸡睡醒啦！",
        # Party & Generic Parent Slot Previews
        "哇！集齐五颗星啦！快乐小鸡大派对！",
        "你真棒！答对啦！",
        "咯咯哒！下蛋啦！",
        "咯咯哒！快乐小鸡下蛋啦！",
        # Classic Meadow Toys & Hammer
        "哈哈！小鸡跳进大泥坑啦，咕叽咕叽！",
        "咻！小鸡滑滑梯下来啦！",
        "哇！小鸡在蹦蹦床上飞高高啦！",
        "先在草地上孵出小鸡，就可以抓小鸡来滑滑梯啦！",
        "先在草地上孵出小鸡，就可以抓小鸡来跳蹦蹦床啦！",
        "先在草地上孵出小鸡，就可以抓小鸡来跳泥坑啦！",
        "小锤子拿好啦！点一下彩虹金蛋砸开它吧！",
        "小锤子拿在手里呢！去点发光的彩虹金蛋，或再点右下角放下小锤子！",
        "这颗彩虹金蛋硬邦邦的！抓起或点一下右下角的小锤子砸开它吧！",
        "等快乐小鸡下出闪亮的彩虹金蛋，再用小锤子砸开它吧！",
        "小锤子收好啦！点草地任意地方继续下蛋哦！",
        "拖到发光的彩虹金蛋上砸一砸，或者点一下右下角小锤子再敲金蛋吧！",
        "哇！下了一颗闪闪发光的彩虹金蛋！用右下角的小锤子砸一下看看里面是谁！",
        "草地收干净啦！点草地任意地方继续下蛋吧！",
        f"哇，草地上已经摆满{cat['MAX_CLASSIC_ITEMS']}个啦！我们收进篮子重新玩吧！",
        # Habit: Bath
        "先选一瓶香香的泡泡液倒进浴缸吧！",
        "哇！香甜的草莓粉泡泡来啦！抓住海绵搓掉小泥点吧！",
        "哇！清爽的柠檬黄泡泡来啦！抓住海绵搓掉小泥点吧！",
        "哇！梦幻的蓝莓蓝泡泡来啦！抓住海绵搓掉小泥点吧！",
        "全身都是香香泡泡啦！现在抓起花洒冲干净吧！",
        "哗啦啦甩干水珠！快拖起吹风机把毛毛吹蓬松吧！",
        "洗白白吹蓬松，香喷喷的，你真棒！",
        # Habit: Bedtime brushing half (lively daily voice!)
        "选一个喜欢的牙膏口味，帮小鸡把牙膏挤到牙刷上吧！",
        "牙膏挤好啦！张大嘴巴，打跑蛀牙小怪兽！",
        "蛀牙怪兽全跑啦！拖起小水杯帮小鸡咕噜咕噜漱口吧！",
        "牙齿亮晶晶真棒！挑一个陪睡小伙伴抱进怀里吧！",
        # Play: Piano
        "自由弹琴时间！点一点彩虹小鸡唱歌吧！",
        # Math: Size & AddSub fixed lines
        "把蛋蛋从小到大排排队吧！先找最小的！",
        "把小鸡从小到大排排队吧！先找最小的！",
        "请把蛋蛋从最小到最大排排队吧！",
        "请把小鸡从最小到最大排排队吧！",
        "排得真整齐，从小到大一二三！",
        "排得真整齐，从小到大一二三四！",
        "再仔细比一比，还有一只更小一点的哦！",
        "再仔细比一比，还有一颗更小一点的哦！",
        "没关系，我们一起数一数草地上现在有几只小鸡吧！",
        # Shapes fixed lines
        "太棒啦！所有线索全都答对，小侦探真厉害！",
        "颜色和形状都对啦，可是大小不对哦，我们要找大大的那个！",
        "颜色和形状都对啦，可是大小不对哦，我们要找小小的那个！",
        "再核对一下线索吧！",
        "再看看图里的虚线形状哦！",
        "仔细看四个蛋上的形状，哪一个和大家不一样？",
        "火眼金睛！哪一个蛋的形状和大家不一样？",
        # Wardrobe fixed lines
        "咯咯哒！快乐小鸡今天的装扮真漂亮呀！",
        "哇！换上新造型啦，快乐小鸡真漂亮！",
        "全部脱下啦，干干净净的快乐小鸡！",
        "敲开草地上的彩虹金蛋来遇见它吧！",
        "脱下啦，换件漂亮的试试吧！",
        "多玩几关收集星星，就能解锁这件漂亮装扮啦！",
    ]
    for s in static_daily_zh:
        add_zh(s, "daily")

    static_en = [
        "Tap anywhere on the grass to lay an egg!",
        "Hello Mr. Sun!",
        "It is raining! The muddy puddle is getting bigger!",
        "The rain stopped! Look at the beautiful rainbow!",
        "Sunny day! Mr. Sun is smiling!",
        "Splash! Jumping in muddy puddles!",
        "Five stars! Happy Mrs. Chicken party!",
        "Great job! You got it right!",
        "Cluck cluck! Egg laid!",
        "Cluck cluck! Happy Mrs. Chicken laid an egg!",
        "Haha! Splashing in the big muddy puddle!",
        "Wheee! Down the rainbow slide!",
        "Whoa! Bouncing super high on the trampoline!",
        "Hatch a chick on the grass first to ride the slide!",
        "Hatch a chick on the grass first to jump on the trampoline!",
        "Hatch a chick on the grass first to jump in the puddle!",
        "Toy hammer ready! Tap the rainbow golden egg to crack it open!",
        "Tap the glowing rainbow golden egg, or tap again to put the hammer down!",
        "This rainbow golden egg is super hard! Grab or tap the toy hammer to crack it open!",
        "Wait for a sparkling rainbow golden egg, then crack it open with the toy hammer!",
        "Hammer put away! Tap anywhere on the grass to lay an egg!",
        "Drop the hammer onto a rainbow golden egg, or tap then tap the egg!",
        "Wow! A rainbow golden egg! Crack it open with the toy hammer!",
        "All tidy! Tap anywhere on the grass!",
        f"Wow, {cat['MAX_CLASSIC_ITEMS']}! Let us start a fresh meadow!",
        "Pick a yummy bubble bath bottle to pour in!",
        "Yum! Strawberry pink bubbles! Grab the sponge and scrub the mud!",
        "Yay! Lemon yellow bubbles! Grab the sponge and scrub the mud!",
        "Ooh! Blueberry blue bubbles! Grab the sponge and scrub the mud!",
        "Covered in yummy bubbles! Grab the showerhead to rinse clean!",
        "Shake shake! Now grab the warm hairdryer to fluff dry!",
        "Squeaky clean and fluffy! What a great helper!",
        "Pick a yummy toothpaste flavor and squeeze it onto the toothbrush!",
        "Toothpaste ready! Open wide and brush away the sugar bugs!",
        "All sugar bugs are gone! Drag the water cup to rinse clean!",
        "Sparkling clean teeth! Pick a bedtime buddy to cuddle!",
        "Free play! Tap any rainbow chick to make music!",
        "Line up the eggs from smallest to biggest!",
        "Line up the chicks from smallest to biggest!",
        "Order the eggs from smallest to biggest!",
        "Order the chicks from smallest to biggest!",
        "So neat! Smallest to biggest, one two three!",
        "So neat! Smallest to biggest, one two three four!",
        "Look closely, there is a smaller one!",
        "Great! Now find the next smallest one!",
        "No worries, let us count the chicks on the grass together!",
        "Super detective! You matched every clue!",
        "Right color and shape, check the size!",
        "Check the clues again!",
        "Look closely at the dashed outline!",
        "Which egg has a different shape?",
        "Cluck cluck! Happy Chicken looks so pretty today!",
        "Ta-da! A brand new outfit for Happy Chicken!",
        "All off! Fresh and clean Happy Chicken!",
        "Tap the rainbow golden egg on the grass to meet it!",
        "Took it off! Try another cute outfit!",
        "Collect more stars to unlock this pretty outfit!",
    ]
    for s in static_en:
        add_en(s)

    # ==========================================================
    # 3. 24 RARE BUDDIES (Exact ZH + EN)
    # ==========================================================
    for b in cat["RARE_BUDDIES"]:
        add_zh(b["praiseZh"], "daily")
        add_en(b["praiseEn"])

    # ==========================================================
    # 4. CLASSIC EGGS & CHICKS #1..15 (Exact ZH + EN)
    # ==========================================================
    for n in range(1, cat["MAX_CLASSIC_ITEMS"] + 1):
        if n in (5, 10, 15):
            add_zh(f"哇！下了{n}个蛋啦！等一会儿自己就会孵出小鸡哦！", "daily")
            add_en(f"Yay! {n} eggs! They will hatch by themselves soon!")
        else:
            add_zh(f"咯咯哒！第{n}个蛋，等一会儿自己就会孵出小鸡哦！", "daily")
            add_en(f"Cluck cluck! Egg number {n}! It will hatch by itself soon!")
        add_zh(f"哇！孵出了第{n}只小鸡！叽叽叽！", "daily")
        add_zh(f"第{n}只小鸡，叽叽叽！", "daily")
        add_zh(f"哇！小鸡都孵出来啦，草地上有{n}位小伙伴！", "daily")
        add_en(f"Pop! Baby chick number {n}!")
        add_en(f"Chick number {n}! Cheep cheep!")
        add_en(f"Hooray! {n} cute friends on the meadow!")

    # ==========================================================
    # 5. COLORS (Basic, Mix, Pattern — Exact + Clean Splice Phrases)
    # ==========================================================
    color_by_id = {c["id"]: c for c in cat["COLORS"]}
    for cid in cat["BASIC_COLOR_IDS"]:
        c = color_by_id[cid]
        add_zh(f"把{c['zh']}的蛋，放到{c['zh']}的窝里吧！", "daily")
        add_zh(f"真棒！这就是{c['zh']}！", "daily")
        # Splice phrases for wrong basic pick
        add_zh(f"这是{c['zh']}的窝哦，", "daily")
        add_zh(f"再找找{c['zh']}吧！", "daily")
        add_en(f"Find the {c['en']} nest!")
        add_en(f"Put the {c['en']} egg in the {c['en']} nest!")
        add_en(f"Great job! {c['en']}!")

    # Color Mix: all 5 recipes + base paints + all wrong-mix splice pieces
    for pid in cat["BASE_PAINTS"]:
        c = color_by_id[pid]
        add_zh(f"放进了{c['zh']}，再选第二种颜色吧！", "daily")
        add_en(f"{c['en']}! Pick one more color!")

    for rec in cat["MIX_RECIPES"]:
        a_c = color_by_id[rec["pair"][0]]
        b_c = color_by_id[rec["pair"][1]]
        t_c = color_by_id[rec["result"]]
        add_zh(f"调色魔法：{a_c['zh']}加什么颜色，能变出{t_c['zh']}蛋？", "daily")
        add_zh(f"调色魔法：{b_c['zh']}加什么颜色，能变出{t_c['zh']}蛋？", "daily")
        add_zh(f"魔法挑战！选两种颜色合在一起，变出{t_c['zh']}蛋吧！", "daily")
        add_zh(f"太厉害啦！{a_c['zh']}加{b_c['zh']}，真的变出了{t_c['zh']}！", "daily")
        add_zh(f"太厉害啦！{b_c['zh']}加{a_c['zh']}，真的变出了{t_c['zh']}！", "daily")
        add_zh(f"我们要变出{t_c['zh']}，再试一次吧！", "daily")
        add_en(f"{a_c['en']} plus what color makes {t_c['en']}?")
        add_en(f"{b_c['en']} plus what color makes {t_c['en']}?")
        add_en(f"Pick 2 colors to mix {t_c['en']}!")
        add_en(f"Magic! {a_c['en']} and {b_c['en']} make {t_c['en']}!")
        add_en(f"Magic! {b_c['en']} and {a_c['en']} make {t_c['en']}!")

    # All possible wrong-mix first halves ("哇，X加Y变成了Z哦！")
    mix_lookup = {
        ("red", "yellow"): "orange", ("yellow", "red"): "orange",
        ("yellow", "blue"): "green", ("blue", "yellow"): "green",
        ("red", "blue"): "purple", ("blue", "red"): "purple",
        ("red", "white"): "pink", ("white", "red"): "pink",
        ("blue", "white"): "skyblue", ("white", "blue"): "skyblue",
    }
    for a in cat["BASE_PAINTS"]:
        for b in cat["BASE_PAINTS"]:
            cA, cB = color_by_id[a], color_by_id[b]
            if a == b:
                res_zh = cA["zh"]
            elif (a == "yellow" and b == "white") or (a == "white" and b == "yellow"):
                res_zh = "淡黄色"
            else:
                res_zh = color_by_id[mix_lookup[(a, b)]]["zh"]
            add_zh(f"哇，{cA['zh']}加{cB['zh']}变成了{res_zh}哦！", "daily")

    # Color Pattern: 7 win sentences + splice phrases for dynamic sequences
    pattern_colors = ["red", "yellow", "blue", "green", "pink", "purple", "orange"]
    for cid in pattern_colors:
        c = color_by_id[cid]
        add_zh(f"真聪明！规律接龙成功，问号就是{c['zh']}！", "daily")
        add_zh(f"不是{c['zh']}哦，", "daily")
        add_zh(f"{c['zh'][0]}", "daily")  # single color syllable: 红/黄/蓝/绿/粉/紫/橙
        add_en(f"Awesome! The missing color is {c['en']}!")
    add_zh("找规律：", "daily")
    add_zh("听规律哦：", "daily")
    add_zh("问号", "daily")
    add_zh("问号该放什么颜色？", "daily")
    add_zh("再一起念一遍！", "daily")

    # ==========================================================
    # 6. MATH (Feed 1..8, Size Lv.1 & Lv.2, Add/Sub exact!)
    # ==========================================================
    for n in range(1, 9):
        add_zh(f"小鸡饿啦！请喂它吃{n}颗玉米吧！", "daily")
        add_zh(f"小鸡饿啦，请喂我吃{n}颗玉米吧！", "daily")
        add_zh(f"哇！刚刚好{n}颗玉米，真聪明！", "daily")
        add_zh(f"{n}", "daily")
        add_en(f"Feed the chick {n} corn!")
        add_en(f"Baby chick wants {n} corn!")
        add_en(f"Yum! Exactly {n} corn!")
        add_en(f"{n}")

    # Size Lv.1 exact prompts, wins & wrong comparisons
    tiers3 = cat["SIZE_TIERS_3"]
    add_zh("这颗小蛋蛋小小的，找一个小小的窝吧！", "daily")
    for t in tiers3:
        add_zh(f"帮这颗{t['eggZh']}找到刚刚好的{t['nestZh']}吧！", "daily")
        add_zh(f"太棒啦！{t['eggZh']}住进{t['nestZh']}里，刚刚好！", "daily")
        add_en(f"Put the {t['en']} egg in the {t['en']} nest!")
        add_en(f"Perfect! The {t['en']} egg fits the {t['en']} nest!")
        add_en(f"That {t['en']} egg is smaller! Find a smaller nest!")
        for p in tiers3:
            if p["id"] == t["id"]:
                continue
            if t["rank"] > p["rank"]:
                add_zh(f"这颗{t['eggZh']}太大啦，{p['nestZh']}装不下哦，试试更大的窝！", "daily")
                add_en(f"That {t['en']} egg is too big for the {p['en']} nest! Try a bigger nest!")
            else:
                add_zh(f"这颗{t['eggZh']}小小的，{p['nestZh']}太大啦，找一个小一点的窝吧！", "daily")

    for step in (1, 2, 3):
        add_zh(f"放好第{step}个啦，再找剩下的里面最小的！", "daily")

    # Add/Sub ALL valid combinations (exact natural full sentences!)
    for a in range(1, 6):
        for b in range(1, 5):
            ans = a + b
            if 2 <= ans <= 8:
                add_zh(f"草地上有{a}只小鸡，又孵出{b}只，现在一共有几只？", "daily")
                add_zh(f"答对啦！{a}加{b}等于{ans}！", "daily")
                add_en(f"{a} chicks plus {b} more — how many now?")
                add_en(f"Correct! {a} plus {b} equals {ans}!")
    for a in range(3, 9):
        for b in range(1, min(5, a)):
            ans = a - b
            if 1 <= ans <= 7:
                add_zh(f"草地上有{a}只小鸡，{b}只回家睡觉了，还剩几只？", "daily")
                add_zh(f"答对啦！{a}减{b}等于{ans}！", "daily")
                add_en(f"{a} chicks, {b} go home — how many left?")
                add_en(f"Correct! {a} minus {b} equals {ans}!")

    # ==========================================================
    # 7. SHAPES (Basic, Clue, Blueprint Build, Odd-One-Out)
    # ==========================================================
    shape_by_id = {s["id"]: s for s in cat["SHAPES"]}
    for sid in cat["BASIC_SHAPE_IDS"]:
        s = shape_by_id[sid]
        add_zh(f"找找一样的{s['zh']}在哪里？", "daily")
        add_zh(f"找一找一样的{s['zh']}吧！", "daily")
        add_zh(f"答对啦！这是{s['zh']}！", "daily")
        add_zh(f"这是{s['zh']}哦，", "daily")
        add_zh(f"再找找{s['zh']}吧！", "daily")
        add_en(f"Can you find the {s['en']}?")
        add_en(f"Find the matching {s['en']}!")
        add_en(f"Yes! It is a {s['en']}!")

    # Clue & Odd & Build shape parts
    add_zh("小侦探，找出", "daily")
    add_zh("大大的", "daily")
    add_zh("小小的", "daily")
    for cid in ["red", "yellow", "blue", "green", "pink", "purple"]:
        c = color_by_id[cid]
        add_zh(f"{c['zh']}的", "daily")
        add_zh(f"但颜色是{c['zh']}哦，", "daily")
        add_zh(f"我们要找{c['zh']}的！", "daily")
    for s in cat["SHAPES"]:
        add_zh(f"{s['zh']}蛋！", "daily")
        add_zh(f"形状是{s['zh']}没错，", "daily")
        add_zh(f"颜色对了，可是上面的形状是{s['zh']}哦，", "daily")
        add_zh(f"我们要找{s['zh']}！", "daily")
        add_zh(f"拼上{s['zh']}啦！继续拼搭吧！", "daily")
        add_zh(f"太厉害啦！其他三个都是{s['zh']}，", "daily")
        add_zh(f"只有这个是{s['zh']}！", "daily")
        add_zh(f"这个是{s['zh']}，另外还有两个也是{s['zh']}哦，不要看颜色，再找形状不一样的！", "daily")
        add_en(f"Nice {s['en']}! Keep building!")
        add_en(f"Three eggs have a {s['en']}. Ignore color and find the different shape!")

    # Blueprints (6)
    for bp in cat["BLUEPRINTS"]:
        add_zh(f"用下面的形状积木，帮小鸡拼出一座{bp['zh']}吧！", "daily")
        add_zh(f"哇！拼出了完整的{bp['zh']}，你是小小建筑师！", "daily")
        add_en(f"Build the {bp['en']} using the shapes below!")
        add_en(f"Hooray! You built the {bp['en']}!")

    # ==========================================================
    # 8. PIANO SONGS (3)
    # ==========================================================
    for song in cat["NURSERY_SONGS"]:
        add_zh(f"跟着发光的小星星，一起弹《{song['zh']}》吧！", "daily")
        add_zh(f"听完《{song['zh']}》示范啦，现在轮到你来弹哦！", "daily")
        add_zh(f"太棒啦！你弹完了一整首《{song['zh']}》！", "daily")
        add_en(f"Follow the glowing star to play {song['en']}!")
        add_en(f"Now it's your turn to play {song['en']}!")
        add_en(f"Bravo! You played the whole {song['en']} song!")

    # ==========================================================
    # 9. WARDROBE (42 items — exact wear & unlock!)
    # ==========================================================
    for item in cat["WARDROBE_ITEMS"]:
        add_zh(f"穿上{item['zh']}啦！真好看！", "daily")
        add_zh(f"太棒啦！解锁了{item['zh']}！", "daily")
        add_en(f"Wearing {item['en']}!")
        add_en(f"Awesome! Unlocked {item['en']}!")

    return daily_zh, bedtime_zh, en_map

def clip_id(prefix: str, key: str) -> str:
    h = hashlib.md5(key.encode("utf-8")).hexdigest()[:10]
    return f"{prefix}_{h}"

async def synth_and_compress(sem, text, voice, rate, out_mp3):
    if os.path.exists(out_mp3) and os.path.getsize(out_mp3) > 400:
        return os.path.getsize(out_mp3), False
    async with sem:
        for attempt in range(3):
            tmp_raw = out_mp3 + ".raw.mp3"
            try:
                comm = edge_tts.Communicate(text=text, voice=voice, rate=rate)
                await comm.save(tmp_raw)
                # Compress cleanly to 24kbps mono 24kHz MP3 + strip trailing silence jitter
                subprocess.run(
                    [
                        "ffmpeg", "-y", "-loglevel", "error",
                        "-i", tmp_raw,
                        "-ac", "1", "-ar", "24000",
                        "-c:a", "libmp3lame", "-b:a", "24k",
                        "-map_metadata", "-1",
                        out_mp3,
                    ],
                    check=True,
                )
                if os.path.exists(tmp_raw):
                    os.remove(tmp_raw)
                return os.path.getsize(out_mp3), True
            except Exception as exc:
                if os.path.exists(tmp_raw):
                    os.remove(tmp_raw)
                if attempt == 2:
                    raise RuntimeError(f"Failed TTS for {voice} '{text}': {exc}") from exc
                await asyncio.sleep(0.6 * (attempt + 1))

async def main():
    os.makedirs(AUDIO_DIR, exist_ok=True)
    cat = load_js_catalog()
    daily_zh, bedtime_zh, en_map = build_corpus(cat)

    jobs = []
    manifest_daily = {}
    manifest_bedtime = {}
    manifest_en = {}

    for k, spoken in daily_zh.items():
        cid = clip_id("zd", k)
        manifest_daily[k] = cid
        jobs.append((cid, spoken, VOICE_DAILY_ZH[0], VOICE_DAILY_ZH[1]))

    for k, spoken in bedtime_zh.items():
        cid = clip_id("zb", k)
        manifest_bedtime[k] = cid
        jobs.append((cid, spoken, VOICE_BEDTIME_ZH[0], VOICE_BEDTIME_ZH[1]))

    for k, spoken in en_map.items():
        cid = clip_id("en", k)
        manifest_en[k] = cid
        jobs.append((cid, spoken, VOICE_EN[0], VOICE_EN[1]))

    print(f"Total clips planned: {len(jobs)} (daily_zh={len(daily_zh)}, bedtime_zh={len(bedtime_zh)}, en={len(en_map)})")
    sem = asyncio.Semaphore(10)
    results = await asyncio.gather(*[
        synth_and_compress(sem, spoken, voice, rate, os.path.join(AUDIO_DIR, f"{cid}.mp3"))
        for (cid, spoken, voice, rate) in jobs
    ])
    total_bytes = sum(r[0] for r in results)
    newly_gen = sum(1 for r in results if r[1])
    print(f"Done! {len(jobs)} MP3s ready ({newly_gen} newly synthesized), total size: {total_bytes / 1024 / 1024:.2f} MB")

    # Write compact js/voice-pack.js
    js_content = f"""(function (HMC) {{
  'use strict';

  // Auto-generated by scripts/generate-voices.py
  // Daily Chinese: zh-CN-YunxiaNeural (-4%) | Bedtime Chinese: zh-CN-XiaoxiaoNeural (-6%) | English: en-US-AnaNeural (-4%)
  const EXACT_ZH_DAILY = {json.dumps(manifest_daily, ensure_ascii=False, separators=(',', ':'))};
  const EXACT_ZH_BEDTIME = {json.dumps(manifest_bedtime, ensure_ascii=False, separators=(',', ':'))};
  const EXACT_EN = {json.dumps(manifest_en, ensure_ascii=False, separators=(',', ':'))};

  function getBaseUrl() {{
    return window.__HMC_SINGLE_FILE__ ? '../audio/v/' : 'audio/v/';
  }}

  function toUrl(id) {{
    return id ? (getBaseUrl() + id + '.mp3') : null;
  }}

  function toUrls(ids) {{
    const out = [];
    for (let i = 0; i < ids.length; i++) {{
      if (!ids[i]) return null;
      out.push(getBaseUrl() + ids[i] + '.mp3');
    }}
    return out.length ? out : null;
  }}

  function norm(text) {{
    if (HMC.audio && typeof HMC.audio.normalizeVoiceKey === 'function') {{
      return HMC.audio.normalizeVoiceKey(text);
    }}
    return String(text || '').trim();
  }}

  function resolveDynamicZh(key, voiceStyle) {{
    const D = EXACT_ZH_DAILY;
    let m;

    // 1. Color basic wrong: 这是红色 的窝哦，再找找黄色吧！
    m = key.match(/^(这是[^，]+的窝哦，)(再找找[^！]+吧！)$/);
    if (m && D[m[1]] && D[m[2]]) return toUrls([D[m[1]], D[m[2]]]);

    // 2. Color mix wrong: 哇，X加Y变成了Z哦！我们要变出W，再试一次吧！
    m = key.match(/^(哇，[^！]+哦！)(我们要变出[^！]+，再试一次吧！)$/);
    if (m && D[m[1]] && D[m[2]]) return toUrls([D[m[1]], D[m[2]]]);

    // 3. Color pattern prompt: 找规律：红、黄、红、黄、问号？问号该放什么颜色？
    m = key.match(/^(找规律：|听规律哦：)([^？]+)？(问号该放什么颜色？)?$/);
    if (m) {{
      const tokens = m[2].split('、').filter(Boolean);
      const ids = [D[m[1]]];
      for (let i = 0; i < tokens.length; i++) ids.push(D[tokens[i]]);
      if (m[3]) ids.push(D[m[3]]);
      const urls = toUrls(ids);
      if (urls) return urls;
    }}

    // 4. Color pattern wrong: 不是红色哦，再一起念一遍：红、黄...！
    m = key.match(/^(不是[^，]+哦，)再一起念一遍：([^！]+)！$/);
    if (m) {{
      const tokens = m[2].split('、').filter(Boolean);
      const ids = [D[m[1]], D['再一起念一遍！']];
      for (let i = 0; i < tokens.length; i++) ids.push(D[tokens[i]]);
      const urls = toUrls(ids);
      if (urls) return urls;
    }}

    // 5. Shape basic wrong: 这是圆形哦，再找找三角形吧！
    m = key.match(/^(这是[^，]+哦，)(再找找[^！]+吧！)$/);
    if (m && D[m[1]] && D[m[2]]) return toUrls([D[m[1]], D[m[2]]]);

    // 6. Shape clue prompt: 小侦探：找出大大的红色圆形蛋！ / 小侦探，找出红色的圆形蛋吧！
    m = key.match(/^小侦探[：，]找出(大大的|小小的)?(红色|黄色|蓝色|绿色|粉色|紫色|橙色|天蓝色|白色)的?([^蛋]+蛋)吧?！?$/);
    if (m) {{
      const ids = [D['小侦探，找出']];
      if (m[1]) ids.push(D[m[1]]);
      ids.push(D[m[2] + '的']);
      ids.push(D[m[3] + '！']);
      const urls = toUrls(ids);
      if (urls) return urls;
    }}

    // 7. Shape clue wrong diagnostic (color mismatch)
    m = key.match(/^(形状是[^，]+没错，)(但颜色是[^，]+哦，)(我们要找[^！]+的！)$/);
    if (m && D[m[1]] && D[m[2]] && D[m[3]]) return toUrls([D[m[1]], D[m[2]], D[m[3]]]);

    // 8. Shape clue wrong diagnostic (shape mismatch)
    m = key.match(/^(颜色对了，可是上面的形状是[^，]+哦，)(我们要找[^！]+！)$/);
    if (m && D[m[1]] && D[m[2]]) return toUrls([D[m[1]], D[m[2]]]);

    // 9. Shape clue generic wrong
    if (/^这个是.+再核对一下线索吧！$/.test(key) && D['再核对一下线索吧！']) {{
      return [toUrl(D['再核对一下线索吧！'])];
    }}

    // 10. Shape blueprint partial build: 拼上三角形啦！还需要...
    m = key.match(/^拼上([^啦]+)啦！还需要/);
    if (m && D[`拼上${{m[1]}}啦！继续拼搭吧！`]) {{
      return [toUrl(D[`拼上${{m[1]}}啦！继续拼搭吧！`])];
    }}

    // 11. Shape blueprint wrong: 图上虚线框里不需要...
    if (/^图上虚线框里不需要/.test(key) && D['再看看图里的虚线形状哦！']) {{
      return [toUrl(D['再看看图里的虚线形状哦！'])];
    }}

    // 12. Shape odd-one-out win: 太厉害啦！其他三个都是X，只有这个是Y！
    m = key.match(/^(太厉害啦！其他三个都是[^，]+，)(只有这个是[^！]+！)$/);
    if (m && D[m[1]] && D[m[2]]) return toUrls([D[m[1]], D[m[2]]]);

    // 13. Wardrobe takeoff & locked universal
    if (/^脱下.+啦！$/.test(key) && D['脱下啦，换件漂亮的试试吧！']) {{
      return [toUrl(D['脱下啦，换件漂亮的试试吧！'])];
    }}
    if (/^再收集\d+颗星星就能解锁.+啦！$/.test(key) && D['多玩几关收集星星，就能解锁这件漂亮装扮啦！']) {{
      return [toUrl(D['多玩几关收集星星，就能解锁这件漂亮装扮啦！'])];
    }}

    return null;
  }}

  function resolveDynamicEn(key) {{
    const E = EXACT_EN;
    if (/^Took off .+$/.test(key) && E['Took it off! Try another cute outfit!']) {{
      return [toUrl(E['Took it off! Try another cute outfit!'])];
    }}
    if (/^Collect \d+ more stars to unlock .+$/.test(key) && E['Collect more stars to unlock this pretty outfit!']) {{
      return [toUrl(E['Collect more stars to unlock this pretty outfit!'])];
    }}
    return null;
  }}

  function resolve(text, lang, voiceStyle = 'daily') {{
    const key = norm(text);
    if (!key) return null;

    if (lang === 'en') {{
      const id = EXACT_EN[key];
      if (id) return [toUrl(id)];
      return resolveDynamicEn(key);
    }}

    // Chinese lookup: honor bedtime style (XiaoxiaoNeural) first when requested
    if (voiceStyle === 'bedtime' && EXACT_ZH_BEDTIME[key]) {{
      return [toUrl(EXACT_ZH_BEDTIME[key])];
    }}
    if (EXACT_ZH_DAILY[key]) {{
      return [toUrl(EXACT_ZH_DAILY[key])];
    }}
    if (EXACT_ZH_BEDTIME[key]) {{
      return [toUrl(EXACT_ZH_BEDTIME[key])];
    }}

    return resolveDynamicZh(key, voiceStyle);
  }}

  HMC.voicePack = {{
    resolve,
    getStats: () => ({{
      dailyZh: Object.keys(EXACT_ZH_DAILY).length,
      bedtimeZh: Object.keys(EXACT_ZH_BEDTIME).length,
      en: Object.keys(EXACT_EN).length
    }})
  }};
}})(window.HMC = window.HMC || {{}});
"""
    with open(PACK_JS, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"Wrote {PACK_JS} ({len(js_content)} bytes)")

if __name__ == "__main__":
    asyncio.run(main())
