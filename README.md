# Jesus' Little Friends Learning Center, Inc. — Website

Marketing website for **JLFLC**, a Christ-centred early childhood learning center with campuses in
**Victorias City** and **Manapla**, Negros Occidental, Philippines.

- Facebook page: https://www.facebook.com/Jesus-Little-Friends-Learning-Center-Inc-100063909131137/
- SEC Reg. No. CN200925171

---

## Quick start

```bash
npm run dev
```

Then open **http://localhost:3000**

Use a different port if 3000 is taken:

```bash
PORT=3001 npm run dev
```

There are **no dependencies to install** — `server.js` is a small zero-dependency static file server built
on Node's `http` module. Node 18+ is required (developed on Node 22).

---

## Stack

The site is deliberately dependency-light and uses **external libraries via CDN**, so edits are visible on
reload without any build step.

| # | Library | Purpose | Loaded from |
|---|---------|---------|-------------|
| 1 | **Google Fonts** — Baloo 2, Nunito | Playful rounded display type + highly legible body type | `fonts.googleapis.com` |
| 2 | **Font Awesome 6.7.2** | Icon set (with SRI integrity hash) | `cdnjs.cloudflare.com` |
| 3 | **AOS 2.3.4** | Animate-On-Scroll reveal effects | `cdn.jsdelivr.net` |
| 4 | **Tailwind CSS 3.4.16** (Play CDN) | Layout & responsive utility styling | `cdn.tailwindcss.com` |
| 5 | **canvas-confetti 1.9.3** | Celebration when the enrollment form succeeds | `cdn.jsdelivr.net` |
| 6 | `assets/css/style.css` | Design tokens + custom components layered on Tailwind | local |
| 7 | `assets/js/main.js` | Nav, scroll spy, counters, tilt, form validation | local |

Tailwind's Play CDN prints a production warning in the console. That is expected — it is ideal for previewing
and iterating. If you ever want a production build, install the Tailwind CLI and replace the `<script>` tag
with a compiled stylesheet.

---

## Project structure

```
.
├── index.html              # the entire page (all sections)
├── assets/
│   ├── css/style.css       # design tokens, cards, forms, animations
│   ├── js/main.js          # site behaviour
│   └── photos/             # photographs (see below)
├── server.js               # zero-dependency static dev server
├── package.json
└── README.md
```

## Photographs

`assets/photos/` holds real pictures from the school's public Facebook page, downloaded, resized and
re-encoded locally (total ~310 KB):

| File | Size | Subject |
|------|------|---------|
| `campus-playground.jpg` | 900×507 | Playground, slide, swings, artificial turf |
| `class-workbook.jpg` | 443×590 | Pupil working in a workbook |
| `class-guided-help.jpg` | 443×590 | Teacher guiding a pupil one-to-one |
| `class-teacher-care.jpg` | 443×590 | Teacher encouraging two children |
| `class-play-baskets.jpg` | 443×590 | Child with colourful sorting baskets |
| `brand-sticker.jpg` | 720×720 | JLFLC logo sticker ("Victorias City") |

**These must be downloaded, never hot-linked.** Facebook CDN URLs are signed and expire, so linking
straight to `fbcdn.net` breaks after a few days. Re-download and re-commit any new photo you want to add.

The portrait photos are 443×590 but display in landscape-ish tiles, so each `<img>` carries an inline
`object-position` tuned to keep the faces in frame. `initPhotos()` in `main.js` fades each image in on
decode and drops in a neutral panel if a file is ever missing.

**Before publishing, confirm you have permission** to use photos of children on a public website, and
check whether the school wants identifiable pupils shown. Swap in different frames if not.

---

## Page sections

1. **Hero** — animated SVG scene, stat counters, CTAs
2. **Marquee** — infinite scrolling values ribbon
3. **About** — mission, vision, four value cards (CSS multi-column masonry)
4. **Programs** — Toddler, Nursery, Kinder 1, Kinder 2
5. **Why JLFLC** — six feature cards with cursor-follow glow
6. **Life at JLFLC** — two-column daily timeline + activity tiles (dark section)
7. **Alma Mater** — school hymn quote, links to the YouTube short
8. **Campuses** — Victorias and Manapla
9. **Enroll** — validated form that composes a ready-to-send message
10. **Footer** — links, campuses, registration number

---

## Things worth knowing before you edit

**AOS and horizontal overflow.** AOS starts every `[data-aos]` element at `opacity: 0` and offsets
`fade-left` / `fade-right` by 100px. That offset can widen the document and produce a horizontal
scrollbar, so `html` carries `overflow-x: clip` (with `hidden` as a fallback) in `style.css`. Keep that
rule. If AOS ever fails to load, `initAOS()` in `main.js` strips the `data-aos` attributes so the page
still renders, and a `<noscript>` rule in `index.html` covers JavaScript being disabled entirely.

**Don't use `fa-house-chimney-heart`.** It is a Font Awesome **Pro** icon and silently renders nothing
in the free set. That is why "Feels like home" uses `fa-house-chimney-user`. If you add icons, check
them against `css/all.min.css` for the free build.

**`font-800` is a custom class.** Tailwind has no `font-800`; it is defined in `style.css` as
`font-weight: 800` to pair with the `font-display` (Baloo 2) family.

**The marquee needs its template duplicated.** `initMarquee()` clones `#marqueeItems` twice into
`.marquee-run` children so the `translateX(-50%)` keyframe loops seamlessly. Editing the ribbon text
means editing the `<template>`, not the rendered markup.

---

## Enrollment form

The form is **client-side only** — there is no backend, and nothing is stored or transmitted. On submit it:

1. Validates every field inline (required fields, min length, phone digit count)
2. Composes a formatted message from the answers
3. Copies it to the clipboard
4. Shows a success card with a preview and a deep link to the Facebook page
5. Fires a confetti celebration

To capture real submissions later, point the submit handler in `assets/js/main.js` at a form service
(Formspree, Google Apps Script, a Web3Forms key, etc.) or your own endpoint.

---

## Design system

| Token | Value | Use |
|-------|-------|-----|
| `cream` | `#FFFCF7` | Page background |
| `sand` | `#FDF6EC` | Alternating section background |
| `ink` | `#1B2A4A` | Headings / dark sections |
| `ink-soft` / `ink-mute` | `#4A5A78` / `#8494B0` | Body / secondary text |
| `sun` | `#F59E0B` | Primary — CTA, warmth, faith |
| `sky2` | `#38BDF8` | Secondary — links, trust |
| `berry` | `#FB7192` | Accent — love, celebration |
| `leaf` | `#34D399` | Accent — growth, "now enrolling" |

Radii are generous (`4xl`–`6xl`) and shadows are soft and warm to match the rounded, friendly typography.

---

## Content notes

Everything factual on the page comes from public information:

- Name, location, tagline, SEC number and 5.0 rating — from the Facebook page and public listings
- Campuses (Victorias & Manapla) and levels (Toddler, Nursery, Kinder 1, Kinder 2) — from page posts
- Alma Mater lyrics — from the published school hymn video

**Placeholders to replace with real content:**

- The gallery now uses real photographs, but only six were recoverable from the public page. Add more
  under `assets/photos/` and add another `<figure class="photo-tile">` to the grid. The grid is
  2 / 3 / 4 columns at mobile / `sm` / `lg`, so add tiles in multiples of 2, 3 or 4 to keep rows even.
- Age bands are labelled "approx." because exact cut-offs vary. Update the `<p>` under each program title.
- Exact campus addresses and phone numbers are not published on Facebook, so the page links out to
  Facebook for directions instead of guessing. Add them to the Campus cards when you have them.
- The canonical URL and `og:image` are placeholders — update for production hosting.

---

## Accessibility & performance

- Semantic landmarks (`header`, `main`, `section`, `nav`, `footer`), one `h1`, labelled form controls
- Visible focus rings, `aria-expanded` on the menu toggle, `aria-live` on the form result
- `prefers-reduced-motion` disables animation, smooth scrolling and counters
- Inline SVG (no image requests) plus `font-display: swap` on webfonts
