// generate.mjs — winner-template news-image generator (v0.1 skeleton).
// Entry copy for news-image-20261126: rendered stories-2026-11-26.json into
// entry.png (1024x1024, deterministic). Needs the news-toolkit fonts/ dir
// beside it plus satori + @resvg/resvg-js (see package.json).
// Input: a stories JSON (see examples/stories-2026-11-24.json). Output: 1024x1024 PNG.
// Layout follows the winner template from ~/workspace/top-entries-study.md §1.2:
// masthead, spec strip, region chips w/ counts, UTC timeline, day-in-numbers,
// numbered feature cards with drawn scenes, one-line briefs, pin map,
// date-check strip, methodology footer.
//
// Usage: node generate.mjs <stories.json> [out.png]
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const font = (f) => readFileSync(path.join(dir, 'fonts', f));
const FONTS = [
  { name: 'Noto Serif', data: font('NotoSerif-Regular.ttf'), weight: 400, style: 'normal' },
  { name: 'Noto Serif', data: font('NotoSerif-Bold.ttf'), weight: 700, style: 'normal' },
  { name: 'Noto Sans', data: font('NotoSans-Regular.ttf'), weight: 400, style: 'normal' },
  { name: 'Noto Sans', data: font('NotoSans-Bold.ttf'), weight: 700, style: 'normal' },
  { name: 'Noto Sans Condensed', data: font('NotoSans-Condensed.ttf'), weight: 400, style: 'normal' },
  { name: 'Noto Sans Condensed', data: font('NotoSans-CondensedBold.ttf'), weight: 700, style: 'normal' },
  { name: 'DejaVu Sans Mono', data: font('DejaVuSansMono.ttf'), weight: 400, style: 'normal' },
  { name: 'DejaVu Sans Mono', data: font('DejaVuSansMono-Bold.ttf'), weight: 700, style: 'normal' },
];

const el = (type, style, children, props = {}) => ({ type, props: { style, children, ...props } });
const div = (style, children) => el('div', style, children);

// ---------- drawn scenes (flat SVG shapes; no <text> — resvg font DB) ----------
const SCENES = {
  'chart-up': (c) => `<rect width="200" height="80" fill="#0e2a3a"/><polyline points="6,64 50,50 95,56 140,32 194,12" fill="none" stroke="${c}" stroke-width="5"/><circle cx="194" cy="12" r="6" fill="${c}"/><rect x="14" y="34" width="9" height="38" fill="#7fb3c8"/><rect x="29" y="44" width="9" height="28" fill="#5b8fa8"/><rect x="44" y="26" width="9" height="46" fill="#9fd0e4"/>`,
  'chart-down': (c) => `<rect width="200" height="80" fill="#2a0e14"/><polyline points="6,16 50,30 95,24 140,48 194,68" fill="none" stroke="${c}" stroke-width="5"/><circle cx="194" cy="68" r="6" fill="${c}"/><rect x="14" y="30" width="9" height="42" fill="#c87f8f"/><rect x="29" y="40" width="9" height="32" fill="#a85b6e"/><rect x="44" y="24" width="9" height="48" fill="#e49fb0"/>`,
  ship: (c) => `<rect width="200" height="80" fill="#0d2f45"/><rect y="58" width="200" height="22" fill="#14506e"/><path d="M30 58 L170 58 L154 72 L46 72 Z" fill="${c}"/><rect x="86" y="30" width="28" height="28" fill="#e8eef2"/><rect x="96" y="18" width="8" height="14" fill="#e8eef2"/><circle cx="60" cy="48" r="4" fill="#ffd24d"/><circle cx="140" cy="48" r="4" fill="#ffd24d"/>`,
  plane: (c) => `<rect width="200" height="80" fill="#10283c"/><path d="M20 52 L120 34 L180 44 L120 52 L104 70 L96 52 Z" fill="${c}"/><circle cx="150" cy="44" r="4" fill="#10283c"/><path d="M8 66 q24 -8 48 0 q24 8 48 0 q24 -8 48 0 q24 8 40 2" stroke="#7fb3c8" stroke-width="3" fill="none"/>`,
  rocket: (c) => `<rect width="200" height="80" fill="#0a1428"/><path d="M100 6 q14 16 14 40 l-28 0 q0 -24 14 -40" fill="${c}"/><circle cx="100" cy="28" r="6" fill="#0a1428"/><path d="M86 46 l-12 18 l12 0 Z" fill="#e4572e"/><path d="M114 46 l12 18 l-12 0 Z" fill="#e4572e"/><path d="M94 58 q6 14 12 0 q-2 12 -6 16 q-4 -4 -6 -16" fill="#ffd24d"/><circle cx="30" cy="18" r="2.5" fill="#fff"/><circle cx="168" cy="26" r="2.5" fill="#fff"/><circle cx="150" cy="60" r="2" fill="#fff"/>`,
  factory: (c) => `<rect width="200" height="80" fill="#241a10"/><rect x="24" y="44" width="110" height="30" fill="${c}"/><rect x="34" y="18" width="12" height="30" fill="#8a6d4f"/><rect x="56" y="10" width="12" height="38" fill="#8a6d4f"/><circle cx="40" cy="12" r="7" fill="#cfc4b8" opacity="0.7"/><circle cx="62" cy="4" r="6" fill="#cfc4b8" opacity="0.55"/><rect x="36" y="56" width="12" height="10" fill="#ffd24d"/><rect x="56" y="56" width="12" height="10" fill="#ffd24d"/><rect x="76" y="56" width="12" height="10" fill="#ffd24d"/><rect x="96" y="56" width="12" height="10" fill="#ffd24d"/>`,
  fire: (c) => `<rect width="200" height="80" fill="#2b0f08"/><path d="M100 8 q22 26 12 44 q-4 8 -12 8 q-8 0 -12 -8 q-10 -18 12 -44" fill="${c}"/><path d="M100 34 q10 12 6 22 q-2 4 -6 4 q-4 0 -6 -4 q-4 -10 6 -22" fill="#ffd24d"/><rect y="68" width="200" height="12" fill="#170806"/>`,
  quake: (c) => `<rect width="200" height="80" fill="#101010"/><polyline points="0,40 40,40 52,40 60,14 70,66 80,26 88,40 130,40 140,20 150,60 158,40 200,40" fill="none" stroke="${c}" stroke-width="4"/>`,
  trophy: (c) => `<rect width="200" height="80" fill="#1c1a08"/><path d="M78 12 h44 v22 q0 16 -22 16 q-22 0 -22 -16 Z" fill="${c}"/><path d="M78 18 q-16 2 -12 16 q3 10 16 10" fill="none" stroke="${c}" stroke-width="5"/><path d="M122 18 q16 2 12 16 q-3 10 -16 10" fill="none" stroke="${c}" stroke-width="5"/><rect x="96" y="50" width="8" height="10" fill="${c}"/><rect x="84" y="60" width="32" height="7" fill="${c}"/>`,
  courthouse: (c) => `<rect width="200" height="80" fill="#141c26"/><path d="M100 8 L176 30 L24 30 Z" fill="${c}"/><rect x="34" y="36" width="10" height="32" fill="#dfe6ec"/><rect x="58" y="36" width="10" height="32" fill="#dfe6ec"/><rect x="82" y="36" width="10" height="32" fill="#dfe6ec"/><rect x="106" y="36" width="10" height="32" fill="#dfe6ec"/><rect x="130" y="36" width="10" height="32" fill="#dfe6ec"/><rect x="154" y="36" width="10" height="32" fill="#dfe6ec"/><rect x="24" y="70" width="152" height="6" fill="${c}"/>`,
  globe: (c) => `<rect width="200" height="80" fill="#0b1e2e"/><circle cx="100" cy="40" r="30" fill="#14506e"/><path d="M78 26 q14 -8 26 0 q-4 12 -14 12 q-12 0 -12 -12" fill="${c}"/><path d="M104 44 q16 -2 20 8 q-8 10 -20 6 q-8 -6 0 -14" fill="${c}"/><ellipse cx="100" cy="40" rx="30" ry="10" fill="none" stroke="#7fb3c8" stroke-width="1.5"/><ellipse cx="100" cy="40" rx="10" ry="30" fill="none" stroke="#7fb3c8" stroke-width="1.5"/>`,
  storm: (c) => `<rect width="200" height="80" fill="#141a24"/><ellipse cx="100" cy="28" rx="52" ry="16" fill="#5b6b7d"/><path d="M104 40 L88 62 L100 62 L90 78 L118 56 L104 56 L114 40 Z" fill="${c}"/>`,
  generic: (c) => `<rect width="200" height="80" fill="#1a1a1a"/><rect x="14" y="14" width="172" height="8" fill="${c}"/><rect x="14" y="30" width="130" height="8" fill="#888"/><rect x="14" y="46" width="150" height="8" fill="#666"/><rect x="14" y="62" width="100" height="8" fill="#444"/>`,
};
const sceneUri = (type, color = '#ffd24d') => {
  const body = (SCENES[type] ?? SCENES.generic)(color);
  return `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">${body}</svg>`).toString('base64')}`;
};

// ---------- pin map (continent blobs as SVG; pin numbers as Satori text overlays,
// because resvg skips SVG <text> with loadSystemFonts:false) ----------
const REGION_POS = { // rough [x,y] on a 300x150 map by region name
  'North America': [55, 42], 'Latin America': [82, 100], 'Europe': [152, 34],
  'Middle East': [178, 58], 'Africa': [158, 92], 'South Asia': [208, 60],
  'East Asia': [238, 48], 'SE Asia': [232, 78], 'Oceania': [262, 112],
  'Indian Ocean': [205, 105], 'Global': [150, 75],
};
const MAP_W = 320, MAP_H = 120; // displayed size; SVG viewBox is 300x150
function pinMap(features) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150">
    <rect width="300" height="150" fill="#0d2f45"/>
    <ellipse cx="58" cy="44" rx="42" ry="24" fill="#2e5f43"/><ellipse cx="84" cy="102" rx="20" ry="28" fill="#2e5f43"/>
    <ellipse cx="152" cy="36" rx="26" ry="16" fill="#2e5f43"/><ellipse cx="160" cy="92" rx="26" ry="30" fill="#2e5f43"/>
    <ellipse cx="216" cy="52" rx="44" ry="24" fill="#2e5f43"/><ellipse cx="262" cy="112" rx="18" ry="12" fill="#2e5f43"/>
    </svg>`;
  const uri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const sx = MAP_W / 300, sy = MAP_H / 150;
  const badges = features.map((s, i) => {
    const [x, y] = REGION_POS[s.region] ?? [150, 75];
    const jx = x + ((i * 11) % 23) - 11, jy = y + ((i * 7) % 17) - 8;
    return div({
      position: 'absolute', left: Math.round(jx * sx) - 7, top: Math.round(jy * sy) - 7,
      width: 14, height: 14, borderRadius: 7, backgroundColor: '#b3001b',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: 'DejaVu Sans Mono', fontWeight: 700, fontSize: 8.5,
    }, String(i + 1));
  });
  return div({ position: 'relative', width: MAP_W, height: MAP_H, border: '1.5px solid #111', marginTop: 2 }, [
    el('img', { position: 'absolute', left: 0, top: 0 }, null, { src: uri, width: MAP_W, height: MAP_H }),
    ...badges,
  ]);
}

// ---------- components ----------
const CONF_COLOR = { OFFICIAL: '#1450a0', CONFIRMED: '#1c6e3c', REPORTED: '#8a6d00', CLAIM: '#b3001b', ONGOING: '#555' };

// ---------- auto-fit: shrink cards/fonts as feature rows grow so the page
// never overflows the 1024 frame. Tuned tiers: <=4 rows roomy, 5 rows compact,
// 6+ rows tight. ----------
function fitFor(featureCount, briefCount) {
  const rows = Math.ceil(featureCount / 3);
  if (rows <= 4) return { cardH: 126, headlineFs: 12.5, detailFs: 9, srcFs: 9.5, imgW: 108, imgH: 43, briefFs: 9.5, rowGap: 6, mastheadFs: 34, numFs: 17 };
  if (rows === 5) return { cardH: 101, headlineFs: 11.5, detailFs: 8.4, srcFs: 9, imgW: 96, imgH: 38, briefFs: 9, rowGap: 4, mastheadFs: 31, numFs: 16 };
  return { cardH: 94, headlineFs: 10.5, detailFs: 8, srcFs: 8.5, imgW: 88, imgH: 34, briefFs: 8.5, rowGap: 4, mastheadFs: 28, numFs: 15 };
}

function FeatureCard(s, n, fit) {
  return div({
    width: 328, height: fit.cardH, display: 'flex', flexDirection: 'column',
    border: '1.5px solid #111', padding: 6, boxSizing: 'border-box',
    backgroundColor: '#fffdf6', overflow: 'hidden',
  }, [
    div({ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, [
      div({ display: 'flex', flexDirection: 'row', alignItems: 'center' }, [
        div({ backgroundColor: '#b3001b', color: '#fff', fontFamily: 'DejaVu Sans Mono', fontWeight: 700, fontSize: 13, padding: '0px 5px', marginRight: 5 }, String(n)),
        div({ fontFamily: 'Noto Sans Condensed', fontWeight: 700, fontSize: 10.5, letterSpacing: 0.5, color: '#333' }, `${s.topic} · ${s.region.toUpperCase()}`),
      ]),
      div({ border: `1.5px solid ${CONF_COLOR[s.confidence] ?? '#555'}`, color: CONF_COLOR[s.confidence] ?? '#555', fontFamily: 'DejaVu Sans Mono', fontWeight: 700, fontSize: 9, padding: '0px 4px' }, s.confidence),
    ]),
    div({ display: 'flex', flexDirection: 'row', marginTop: 4 }, [
      el('img', { border: '1px solid #111' }, null, { src: sceneUri(s.scene_type), width: fit.imgW, height: fit.imgH }),
      div({ display: 'flex', flexDirection: 'column', marginLeft: 6, flexGrow: 1 }, [
        div({ fontFamily: 'Noto Serif', fontWeight: 700, fontSize: fit.headlineFs, lineHeight: 1.05, color: '#111' }, s.headline),
        div({ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 2 }, [
          s.key_figure ? div({ backgroundColor: '#111', color: '#ffd24d', fontFamily: 'DejaVu Sans Mono', fontWeight: 700, fontSize: 11, padding: '1px 5px', marginRight: 5 }, s.key_figure) : div({}, ''),
          div({ fontFamily: 'DejaVu Sans Mono', fontSize: 9.5, color: '#555' }, s.utc_time ? `${s.utc_time} UTC` : ''),
        ]),
      ]),
    ]),
    div({ fontFamily: 'Noto Sans', fontSize: fit.detailFs, lineHeight: 1.12, color: '#222', marginTop: 3 }, s.detail ?? ''),
    div({ fontFamily: 'Noto Sans Condensed', fontSize: fit.srcFs, color: '#555', borderTop: '1px solid #bbb', marginTop: 2, paddingTop: 2 }, `Sources: ${(s.sources ?? []).join(' · ')}`),
  ]);
}

function buildPage(data) {
  const stories = data.stories;
  const features = stories.filter((s) => s.feature);
  const briefs = stories.filter((s) => !s.feature);
  const regions = {};
  for (const s of stories) regions[s.region] = (regions[s.region] ?? 0) + 1;
  const fields = new Set(stories.map((s) => s.topic)).size;
  const dateLabel = data.date_label; // e.g. "TUESDAY 24 NOVEMBER 2026"
  const timeline = features.filter((s) => s.utc_time).slice(0, 8);
  const numbers = features.filter((s) => s.key_figure).slice(0, 6);
  const fit = fitFor(features.length, briefs.length);

  const rows = [];
  for (let i = 0; i < features.length; i += 3) rows.push(features.slice(i, i + 3));

  return div({
    width: 1024, height: 1024, display: 'flex', flexDirection: 'column',
    backgroundColor: '#fdfaf3', padding: 10, boxSizing: 'border-box',
    fontFamily: 'Noto Sans', color: '#111',
  }, [
    // masthead
    div({ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '4px solid #111', paddingBottom: 4 }, [
      div({ fontFamily: 'Noto Serif', fontWeight: 700, fontSize: fit.mastheadFs, lineHeight: 1 }, 'THE WORLD IN ONE DAY'),
      div({ fontFamily: 'DejaVu Sans Mono', fontWeight: 700, fontSize: 15 }, dateLabel),
    ]),
    // spec strip
    div({ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#111', color: '#fdfaf3', padding: '4px 8px', marginTop: 5, fontFamily: 'DejaVu Sans Mono', fontWeight: 700, fontSize: 13 }, [
      div({}, `${stories.length} STORIES • ${Object.keys(regions).length} REGIONS • ${fields} FIELDS`),
      div({}, `EVERY ONE FROM ${dateLabel} (UTC)`),
    ]),
    // region chips
    div({ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginTop: 5, fontFamily: 'Noto Sans Condensed', fontSize: 12.5 }, [
      div({ fontWeight: 700, marginRight: 6 }, 'WHERE:'),
      ...Object.entries(regions).map(([r, n]) => div({ border: '1px solid #111', padding: '0px 5px', marginRight: 4, marginBottom: 2 }, `${r} ${n}`)),
      div({ marginLeft: 4 }, `= ${stories.length} stories`),
    ]),
    // UTC timeline strip
    div({ display: 'flex', flexDirection: 'row', borderTop: '1.5px solid #111', borderBottom: '1.5px solid #111', padding: '3px 0', marginTop: 4, fontFamily: 'Noto Sans Condensed', fontSize: 11.5 }, [
      div({ fontWeight: 700, marginRight: 6, whiteSpace: 'nowrap' }, 'THE DAY IN UTC:'),
      div({}, timeline.map((s) => `${s.utc_time} ${s.short ?? s.headline}`).join('  ·  ')),
    ]),
    // day in numbers
    div({ display: 'flex', flexDirection: 'row', marginTop: 5 }, numbers.map((s) => div({
      flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      border: '1.5px solid #111', marginRight: 5, padding: '3px 2px', backgroundColor: '#fff3c4',
    }, [
      div({ fontFamily: 'DejaVu Sans Mono', fontWeight: 700, fontSize: fit.numFs }, s.key_figure),
      div({ fontFamily: 'Noto Sans Condensed', fontSize: 9.5, textAlign: 'center' }, s.short ?? s.headline),
    ]))),
    // feature cards grid (a short last row gets an AT A GLANCE filler panel
    // so the frame stays near-zero-whitespace)
    ...rows.map((row, ri) => div({ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: fit.rowGap },
      [...row.map((s, ci) => FeatureCard(s, ri * 3 + ci + 1, fit)),
       ...(row.length < 3 ? [div({
         width: (3 - row.length) * 328 + (3 - row.length - 1) * 10, height: fit.cardH,
         display: 'flex', flexDirection: 'column', border: '1.5px solid #111',
         padding: 8, boxSizing: 'border-box', backgroundColor: '#111', color: '#fdfaf3',
       }, [
         div({ fontFamily: 'Noto Sans Condensed', fontWeight: 700, fontSize: 13, letterSpacing: 1 }, 'AT A GLANCE'),
         div({ fontFamily: 'DejaVu Sans Mono', fontWeight: 700, fontSize: 15, marginTop: 4, color: '#ffd24d' },
           `${stories.length} stories · ${Object.keys(regions).length} regions · ${fields} fields`),
         div({ fontFamily: 'Noto Sans', fontSize: 10.5, lineHeight: 1.35, marginTop: 4 },
           ['OFFICIAL', 'CONFIRMED', 'REPORTED', 'CLAIM', 'ONGOING']
             .map((c) => [c, stories.filter((s) => s.confidence === c).length])
             .filter(([, n]) => n > 0)
             .map(([c, n]) => `${c} ${n}`)
             .join(' · ')),
         div({ fontFamily: 'Noto Sans', fontSize: 10.5, lineHeight: 1.35, marginTop: 2 },
           `${new Set(stories.flatMap((s) => s.sources ?? [])).size} named sources · every story dated ${dateLabel} (UTC)`),
       ])] : [])])),
    // bottom section: briefs (left) | pin map + date check (right)
    div({ display: 'flex', flexDirection: 'row', marginTop: 5, borderTop: '2px solid #111', paddingTop: 4 }, [
      div({ display: 'flex', flexDirection: 'row', width: '62%', paddingRight: 8 }, [
        div({ display: 'flex', flexDirection: 'column', width: '50%', paddingRight: 6 }, [
          div({ fontFamily: 'Noto Sans Condensed', fontWeight: 700, fontSize: 12.5 }, 'ALSO TODAY'),
          ...briefs.slice(0, Math.ceil(briefs.length / 2)).map((s, i) =>
            div({ fontFamily: 'Noto Sans Condensed', fontSize: fit.briefFs, lineHeight: 1.15 }, `${features.length + i + 1}. ${s.headline} (${(s.sources ?? [])[0] ?? ''})`)),
        ]),
        div({ display: 'flex', flexDirection: 'column', width: '50%' }, [
          div({ fontFamily: 'Noto Sans Condensed', fontWeight: 700, fontSize: 12.5, color: '#fdfaf3' }, '.'),
          ...briefs.slice(Math.ceil(briefs.length / 2)).map((s, i) =>
            div({ fontFamily: 'Noto Sans Condensed', fontSize: fit.briefFs, lineHeight: 1.15 }, `${features.length + Math.ceil(briefs.length / 2) + i + 1}. ${s.headline} (${(s.sources ?? [])[0] ?? ''})`)),
        ]),
      ]),
      div({ display: 'flex', flexDirection: 'column', width: '38%' }, [
        div({ fontFamily: 'Noto Sans Condensed', fontWeight: 700, fontSize: 11.5 }, `WHERE IT HAPPENED — PINS 1–${features.length}`),
        pinMap(features),
        div({ display: 'flex', flexDirection: 'column', border: '1.5px solid #b3001b', padding: 5, backgroundColor: '#fff5f5', marginTop: 5 }, [
          div({ fontFamily: 'Noto Sans Condensed', fontWeight: 700, fontSize: 12, color: '#b3001b' }, 'DATE CHECK'),
          div({ fontFamily: 'Noto Sans', fontSize: 9, lineHeight: 1.2 }, `Every story here happened or was first reported on ${dateLabel} (UTC), verified against dated sources. Left out as earlier news:`),
          ...(data.excluded ?? []).map((x) => div({ fontFamily: 'Noto Sans Condensed', fontSize: 9.5, lineHeight: 1.2 }, `• ${x.day}: ${x.headline}`)),
        ]),
      ]),
    ]),
    // methodology footer
    div({ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderTop: '2px solid #111', marginTop: 6, paddingTop: 3, fontFamily: 'Noto Sans Condensed', fontSize: 10.5, color: '#333' }, [
      div({}, 'HOW SURE: OFFICIAL = on record · CONFIRMED = 2+ outlets · REPORTED = single wire/local · CLAIM = one side\u2019s account · ONGOING = still developing'),
      div({}, 'Vector scenes drawn in code — no photos'),
    ]),
  ]);
}

// ---------- main ----------
const [inputPath, outPath = 'out/news-image.png'] = process.argv.slice(2);
if (!inputPath) { console.error('Usage: node generate.mjs <stories.json> [out.png]'); process.exit(2); }
const data = JSON.parse(readFileSync(inputPath, 'utf8'));

const t0 = performance.now();
const svg = await satori(buildPage(data), { width: 1024, height: 1024, fonts: FONTS });
const t1 = performance.now();
const png = new Resvg(svg, { background: '#fdfaf3', font: { loadSystemFonts: false } }).render().asPng();
const t2 = performance.now();

writeFileSync(outPath, png);
console.log(`OK  stories: ${data.stories.length}  satori: ${(t1 - t0).toFixed(0)} ms  resvg: ${(t2 - t1).toFixed(0)} ms  png: ${png.length} bytes -> ${outPath}`);
