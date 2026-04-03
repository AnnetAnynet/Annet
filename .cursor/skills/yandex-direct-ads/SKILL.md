---
name: yandex-direct-ads
description: Composes Yandex Direct ad campaigns — text-graphic ads, smart banners, image ads — following all character limits, field requirements, and quality policies. Can generate ad images using GPT Image MCP. Use when the user asks to create, write, or prepare Yandex Direct ads, объявления Яндекс Директ, рекламные объявления, баннеры, креативы для Директа.
---

# Yandex Direct — Ad Composer

Creates ready-to-upload Yandex Direct ads following all platform rules and character limits. Supports text-graphic ads, image banners (via GPT Image MCP), and smart banners.

## Ad Format Reference

### Text-Graphic Ad (Текстово-графическое объявление) — TGA

The primary format. All character counts include spaces.

| Field | Max chars | Required | Notes |
|-------|-----------|----------|-------|
| Заголовок 1 | **35** | ✅ | Shown in all placements |
| Заголовок 2 | **30** | ❌ | Shown on desktop search |
| Текст объявления | **81** | ✅ | Body copy |
| Отображаемая ссылка | **20** | ❌ | Path after domain (e.g. `/скидки`) |
| Целевая ссылка | — | ✅ | Landing page URL |

**Display URL** format: `domain.ru/[отображаемая-ссылка]` — use transliteration or meaningful slug.

#### Extensions (Дополнения)

**Быстрые ссылки** (Sitelinks): up to 8, shown 4 at a time
- Title: max **25** chars
- Description: max **60** chars
- Each must have a unique URL

**Уточнения** (Callouts): up to 50 total, max 4 shown simultaneously
- Each: max **25** chars
- Must be neutral facts, not CTAs

**Визитка** (vCard): address, phone, working hours — filled separately in Директ.

---

### Smart Banner (Смарт-баннер)

Auto-generated from product feed. Compose the **feed template fields** instead:

| Field | Max chars |
|-------|-----------|
| Заголовок | **56** |
| Дополнительный заголовок | **56** |
| Текст | **81** |
| Цена / старая цена | numeric |

---

### Image Ad (Графическое объявление)

Static or animated banner. Use GPT Image MCP to generate.

**Allowed sizes (px)**:

| Format | Size | Use case |
|--------|------|---------|
| Горизонтальный | 728×90 | Leaderboard |
| Горизонтальный | 970×250 | Billboard |
| Горизонтальный | 1456×180 | Wide billboard |
| Горизонтальный | 640×100 | Mobile banner |
| Горизонтальный | 640×200 | Mobile banner large |
| Квадрат | 1024×1024 | Universal |
| Вертикальный | 240×400 | Skyscraper |
| Вертикальный | 300×600 | Half-page |
| Вертикальный | 640×960 | Mobile full |
| Прямоугольник | 300×250 | Medium rectangle |
| Прямоугольник | 336×280 | Large rectangle |
| Прямоугольник | 960×640 | Landscape |

**File requirements**:
- Formats: JPG, PNG (static); GIF (animated)
- Max size: **150 KB** static, **4 MB** animated
- Recommended output format for MCP: `jpeg` (smaller file) or `png` (transparency)
- Use `quality: "medium"` or `"high"` based on file size budget

GPT Image closest sizes:
- `1024x1024` → квадрат (300×250 scale)
- `1536x1024` → горизонтальный (728×90, 970×250)
- `1024x1536` → вертикальный (300×600, 240×400)

---

## Yandex Direct — Prohibited Content

Always check before generating copy:

❌ **Strictly prohibited**:
- Phone numbers, emails, URLs in ad text or titles
- Excessive capitalization (e.g. `СКИДКА 50%` — entire words in caps)
- More than one `!` per sentence in body text
- Misleading claims (e.g. "Лучший в России" without proof)
- Competitor brand names in keywords/text (without authorization)
- Guarantees of results in prohibited niches (medicine, finance)
- Prices that don't match the landing page

⚠️ **Requires moderation / careful use**:
- Age-restricted products require `18+` marker
- Financial products require license numbers
- Medical services require license/disclaimer
- "Бесплатно" must be factually true

---

## Workflow

### Step 1 — Gather input

Collect from user:

| Input | Required | Example |
|-------|----------|---------|
| Product / service | ✅ | "Кухни на заказ в Москве" |
| USP (УТП) | ✅ | "От 30 000 руб., за 30 дней" |
| Target audience | ❌ | "Семьи, ремонт квартиры" |
| Landing page URL | ✅ | `https://example.ru/kuhni` |
| Display URL path | ❌ | `/кухни` |
| Keywords to use | ❌ | From semantic core |
| Tone | ❌ | деловой / дружелюбный / агрессивный |
| Generate image? | ❌ | Yes/No + style description |
| Ad count | ❌ | Default: 3 variants |

### Step 2 — Write ad variants

Generate **3 variants** per ad group. Each variant should test a different angle:
- Variant A: USP-focused (цена, срок, гарантия)
- Variant B: Benefit-focused (результат, комфорт, выгода)
- Variant C: CTA-focused (действие + дедлайн/ограничение)

**Title writing rules**:
- Include the main keyword in Заголовок 1 when possible
- Don't duplicate words between Заголовок 1 and Заголовок 2
- Заголовок 2 should add info, not repeat
- Always count characters before finalizing — **count spaces** too

**Body text rules**:
- Lead with the key benefit
- End with CTA (Звоните, Оставьте заявку, Узнайте цену)
- No phone/email/URL
- Max one exclamation mark

### Step 3 — Output ad set

Use this template for each variant:

```
═══════════════════════════════════════
ОБЪЯВЛЕНИЕ [N] — [Angle name]
═══════════════════════════════════════

Заголовок 1 (35):  [текст] → [X/35 симв.]
Заголовок 2 (30):  [текст] → [X/30 симв.]
Текст (81):        [текст] → [X/81 симв.]
Отображ. ссылка:   /[slug] → [X/20 симв.]
Целевая ссылка:    [URL]

БЫСТРЫЕ ССЫЛКИ:
1. [заголовок] (X/25) — [описание] (X/60) → [URL]
2. [заголовок] (X/25) — [описание] (X/60) → [URL]
3. [заголовок] (X/25) — [описание] (X/60) → [URL]
4. [заголовок] (X/25) — [описание] (X/60) → [URL]

УТОЧНЕНИЯ:
• [факт 1] (X/25)
• [факт 2] (X/25)
• [факт 3] (X/25)
• [факт 4] (X/25)
═══════════════════════════════════════
```

Always show the char count next to each field. Flag if over limit.

### Step 4 — Generate image (if requested)

Use `user-openai-gpt-image-mcp` → `create-image` tool.

**Choose size** based on the requested banner format:
- Горизонтальный баннер → `1536x1024`
- Вертикальный баннер → `1024x1536`
- Квадратный баннер → `1024x1024`

**Prompt structure** for ad images:
```
[Style direction]. [Product/service visual]. [Key message as visual element, not overlaid text].
Background: [color/mood]. No logos, no QR codes, no fine print.
Photorealistic / flat design / illustration — [match brand tone].
High contrast, suitable for web banner. [Size] format.
```

**Important**: Yandex Direct reviews images — avoid:
- Text overlaid on image (Direct adds its own text layer)
- Faces in close-up without context
- Misleading before/after
- Stock-photo clichés (handshake, thumbs-up in isolation)

Save to: `advertise/creatives/[campaign-name]-[size]-v[N].jpg`

Example call via MCP:
```
Tool: create-image
prompt: "Clean modern kitchen interior, warm lighting, white and wood tones, contemporary style. 
Empty kitchen showcasing quality craftsmanship. No people, no text, no overlays. 
Suitable for web banner, horizontal format."
size: "1536x1024"
quality: "high"
output: "file_output"
file_output: "C:/abs/path/to/advertise/creatives/kuhni-728x90-v1.jpg"
output_format: "jpeg"
output_compression: 85
```

### Step 5 — Validation checklist

Before finalizing, verify each ad:

```
ПРОВЕРКА ОБЪЯВЛЕНИЯ
─────────────────────────────────────
[ ] Заголовок 1: ≤ 35 симв.
[ ] Заголовок 2: ≤ 30 симв.
[ ] Текст: ≤ 81 симв.
[ ] Отображаемая ссылка: ≤ 20 симв.
[ ] Нет телефона/email/URL в тексте
[ ] Нет CAPS LOCK целыми словами
[ ] Не более одного ! в тексте
[ ] Цена соответствует лендингу
[ ] CTA присутствует
[ ] Ключевое слово в Заголовке 1
[ ] Быстрые ссылки: заголовок ≤ 25, описание ≤ 60
[ ] Уточнения: каждое ≤ 25 симв.
─────────────────────────────────────
```

## Example

**Input**: Кухни на заказ, Москва. УТП: от 35 000 руб., 28 дней. Лендинг: kitchen-msk.ru

```
ОБЪЯВЛЕНИЕ 1 — Цена + срок
─────────────────────────────
Заголовок 1: Кухни на заказ от 35 000 р.   → 30/35 ✅
Заголовок 2: Изготовление за 28 дней       → 26/30 ✅
Текст: Замер бесплатно. Более 200 проектов в Москве. Рассчитайте стоимость онлайн.  → 79/81 ✅
Отображ. ссылка: /кухни-на-заказ           → 16/20 ✅
```

## Additional resources

- For keyword selection, use the `wordstat-semantic-core` skill first, then pass top keywords here as context
- For editing an existing image banner, use `edit-image` MCP tool instead of `create-image`
