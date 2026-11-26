// news-image-20261126 artwork generator (fresh implementation).
//
// Renders stories-2026-11-26.json into a 1024x1024 PNG "winner template"
// page with Satori (HTML/CSS -> SVG) and @resvg/resvg-js (SVG -> PNG).
// Deterministic: fonts are embedded from local TTF files, system fonts are
// disabled, and no randomness or clocks are used, so two runs write the
// same bytes. The entry itself ships the rendered entry.png; main.ts only
// copies and verifies it.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = 1024;

// ---------- tiny VNode helper (Satori accepts plain objects) ----------
function h(type, style, children, extra = {}) {
  return { type, props: { style, children, ...extra } };
}
function div(style, children) {
  return h("div", { display: "flex", ...style }, children);
}
function span(style, text) {
  return h("span", style, text);
}

// ---------- palette ----------
const INK = "#111111";
const PAPER = "#ffffff";
const RED = "#b3202c";
const GREEN = "#1c7a34";
const YELLOW = "#ffd21f";
const CREAM = "#f6f0da";
const NAVY = "#0b2a4a";
const LAND = "#2f7d3a";
const MUTED = "#555555";

// ---------- fonts ----------
function fontPath(name) {
  const candidates = [
    join(HERE, "fonts", name),
    join(HERE, "..", "news-toolkit", "fonts", name),
    join(process.env.HOME ?? "", "workspace", "news-toolkit", "fonts", name),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(`font not found: ${name} (looked in ${candidates.join(", ")})`);
}
function loadFont(name, family, weight) {
  return { name: family, data: readFileSync(fontPath(name)), weight, style: "normal" };
}
const FONTS = [
  loadFont("NotoSerif-Bold.ttf", "Serif", 700),
  loadFont("NotoSerif-Regular.ttf", "Serif", 400),
  loadFont("NotoSans-Regular.ttf", "Sans", 400),
  loadFont("NotoSans-Bold.ttf", "Sans", 700),
  loadFont("NotoSans-Condensed.ttf", "Cond", 400),
  loadFont("NotoSans-CondensedBold.ttf", "Cond", 700),
  loadFont("DejaVuSansMono.ttf", "Mono", 400),
  loadFont("DejaVuSansMono-Bold.ttf", "Mono", 700),
];

// ---------- data ----------
const data = JSON.parse(readFileSync(join(HERE, "stories-2026-11-26.json"), "utf8"));
const stories = data.stories;
const features = stories.filter((s) => s.feature);
const briefs = stories.filter((s) => !s.feature);

function countBy(items, key) {
  const out = new Map();
  for (const it of items) out.set(it[key], (out.get(it[key]) ?? 0) + 1);
  return out;
}
const regionCounts = countBy(stories, "region");
const topicCounts = countBy(stories, "topic");
const confCounts = countBy(stories, "confidence");
const sourceSet = new Set(stories.flatMap((s) => s.sources));
const REGION_ORDER = [
  "Europe", "East Asia", "SE Asia", "Oceania", "North America",
  "Africa", "Global", "South Asia", "Middle East",
];
const CONF_ORDER = ["OFFICIAL", "CONFIRMED", "REPORTED", "CLAIM", "ONGOING"];

// ---------- vector scenes (drawn in code, no photos) ----------
// Each scene is an inline SVG on a 64x52 stage.
function svg(children) {
  return h("svg", {}, children, { width: 58, height: 40, viewBox: "0 0 64 52" });
}
function path(d, fill, extra = {}) {
  return h("path", {}, [], { d, fill, ...extra });
}
function polyline(points, stroke, width = 2.5) {
  return h("polyline", {}, [], {
    points, fill: "none", stroke, "stroke-width": width,
    "stroke-linejoin": "round", "stroke-linecap": "round",
  });
}
function rect(x, y, w, hh, fill) {
  return h("rect", {}, [], { x, y, width: w, height: hh, fill });
}
function circle(cx, cy, r, fill, extra = {}) {
  return h("circle", {}, [], { cx, cy, r, fill, ...extra });
}

const SCENES = {
  fire: () =>
    svg([
      path("M32 4 C38 14 46 18 46 30 a14 14 0 1 1 -28 0 C18 20 26 14 32 4 Z", "#e8590c"),
      path("M32 16 C36 22 40 25 40 32 a8 8 0 1 1 -16 0 C24 26 28 22 32 16 Z", "#fab005"),
      rect(8, 44, 48, 3, "#8a5a2b"),
    ]),
  "chart-up": () =>
    svg([
      polyline("4,44 20,34 32,38 48,16 58,10", "#51cf66", 3),
      path("M50 8 L60 8 L60 18 L56 14 L52 18 Z", "#51cf66"),
      rect(4, 46, 56, 2, "#3b5bdb"),
    ]),
  "chart-down": () =>
    svg([
      polyline("4,10 20,20 32,16 48,38 58,44", "#ff6b6b", 3),
      path("M50 46 L60 46 L60 36 L56 40 L52 36 Z", "#ff6b6b"),
      rect(4, 46, 56, 2, "#3b5bdb"),
    ]),
  quake: () =>
    svg([
      polyline("2,26 14,26 19,10 25,42 30,18 34,26 62,26", "#ffd43b", 2.5),
      rect(2, 44, 60, 2, "#868e96"),
    ]),
  storm: () =>
    svg([
      circle(24, 20, 10, "#ced4da"),
      circle(38, 17, 12, "#dee2e6"),
      circle(48, 22, 8, "#ced4da"),
      polyline("18,34 14,44", "#4dabf7", 2.5),
      polyline("30,34 26,44", "#4dabf7", 2.5),
      polyline("42,34 38,44", "#4dabf7", 2.5),
      polyline("54,34 50,44", "#4dabf7", 2.5),
    ]),
  courthouse: () =>
    svg([
      path("M32 6 L58 18 L6 18 Z", "#e9ecef"),
      rect(10, 22, 5, 18, "#e9ecef"),
      rect(21, 22, 5, 18, "#e9ecef"),
      rect(32, 22, 5, 18, "#e9ecef"),
      rect(43, 22, 5, 18, "#e9ecef"),
      rect(6, 42, 52, 4, "#adb5bd"),
    ]),
  globe: () =>
    svg([
      circle(32, 26, 20, "none", { stroke: "#4dabf7", "stroke-width": 2.5 }),
      h("ellipse", {}, [], {
        cx: 32, cy: 26, rx: 9, ry: 20, fill: "none",
        stroke: "#4dabf7", "stroke-width": 1.8,
      }),
      polyline("12,26 52,26", "#4dabf7", 1.8),
      polyline("16,14 48,14", "#4dabf7", 1.5),
      polyline("16,38 48,38", "#4dabf7", 1.5),
    ]),
  factory: () =>
    svg([
      rect(8, 30, 34, 16, "#ced4da"),
      rect(12, 14, 6, 18, "#adb5bd"),
      rect(22, 10, 6, 22, "#adb5bd"),
      path("M42 46 L42 32 L52 38 L52 46 Z", "#ced4da"),
      circle(15, 8, 3, "#868e96"),
      circle(25, 4, 3.5, "#868e96"),
    ]),
  ship: () =>
    svg([
      path("M8 32 L56 32 L48 44 L16 44 Z", "#e8590c"),
      rect(24, 20, 16, 12, "#e9ecef"),
      rect(30, 12, 4, 8, "#adb5bd"),
      polyline("2,48 12,45 22,48 32,45 42,48 52,45 62,48", "#4dabf7", 2.5),
    ]),
  generic: () =>
    svg([
      rect(14, 6, 36, 40, "#e9ecef"),
      rect(20, 14, 24, 3, "#868e96"),
      rect(20, 21, 24, 3, "#868e96"),
      rect(20, 28, 16, 3, "#868e96"),
      rect(20, 35, 20, 3, "#868e96"),
    ]),
};
function sceneBox(type) {
  const draw = SCENES[type] ?? SCENES.generic;
  return div(
    {
      width: 64, height: 44, backgroundColor: NAVY, flexShrink: 0,
      alignItems: "center", justifyContent: "center",
    },
    [draw()],
  );
}

// ---------- header blocks ----------
function masthead() {
  return div(
    {
      flexDirection: "row", justifyContent: "space-between",
      alignItems: "flex-end", width: "100%",
    },
    [
      span(
        { fontFamily: "Serif", fontWeight: 700, fontSize: 30, color: INK },
        "THE WORLD IN ONE DAY",
      ),
      span(
        { fontFamily: "Sans", fontWeight: 700, fontSize: 14, color: INK },
        data.date_label,
      ),
    ],
  );
}

function blackBar() {
  const left = `${stories.length} STORIES • ${regionCounts.size} REGIONS • ${topicCounts.size} FIELDS`;
  return div(
    {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      backgroundColor: INK, padding: "4px 10px", width: "100%", marginTop: 5,
    },
    [
      span({ fontFamily: "Sans", fontWeight: 700, fontSize: 14, color: PAPER }, left),
      span(
        { fontFamily: "Sans", fontWeight: 700, fontSize: 12, color: PAPER },
        `EVERY ONE FROM ${data.date_label} (UTC)`,
      ),
    ],
  );
}

function whereRow() {
  const chips = REGION_ORDER.filter((r) => regionCounts.has(r)).map((r) =>
    div(
      {
        border: `1.5px solid ${INK}`, padding: "2px 7px", marginRight: 5,
        flexDirection: "row",
      },
      [
        span({ fontFamily: "Sans", fontWeight: 700, fontSize: 11, color: INK }, r),
        span(
          { fontFamily: "Sans", fontSize: 11, color: INK, marginLeft: 3 },
          `${regionCounts.get(r)}`,
        ),
      ],
    ),
  );
  return div(
    {
      flexDirection: "row", alignItems: "center", flexWrap: "wrap",
      width: "100%", marginTop: 5,
    },
    [
      span(
        { fontFamily: "Sans", fontWeight: 700, fontSize: 12, color: INK, marginRight: 6 },
        "WHERE:",
      ),
      ...chips,
      span(
        { fontFamily: "Sans", fontSize: 11, color: INK },
        `= ${stories.length} stories`,
      ),
    ],
  );
}

function timelineStrip() {
  // Feature order (1..13), matching the printed page.
  const timed = features.filter((s) => s.utc_time);
  const parts = timed.map((s) => `${s.utc_time} ${s.short}`);
  return div({ flexDirection: "row", width: "100%", marginTop: 4 }, [
    span(
      { fontFamily: "Sans", fontWeight: 700, fontSize: 9.2, color: INK, marginRight: 4 },
      "THE DAY IN UTC:",
    ),
    span(
      { fontFamily: "Sans", fontSize: 9.2, color: INK, flex: 1, lineHeight: 1.18 },
      parts.join(" · "),
    ),
  ]);
}

function numbersStrip() {
  const boxes = features.slice(0, 6).map((s) =>
    div(
      {
        flexDirection: "column", alignItems: "center", flex: 1,
        backgroundColor: CREAM, border: `1.5px solid ${INK}`,
        padding: "4px 4px", marginRight: 6,
      },
      [
        span({ fontFamily: "Serif", fontWeight: 700, fontSize: 14, color: INK }, s.key_figure),
        span(
          { fontFamily: "Sans", fontSize: 8, color: INK, textAlign: "center" },
          s.short,
        ),
      ],
    ),
  );
  return div({ flexDirection: "row", width: "100%", marginTop: 5 }, boxes);
}

// ---------- feature cards ----------
function confChip(label) {
  return div(
    {
      border: `1.5px solid ${GREEN}`, padding: "1px 5px", flexShrink: 0,
    },
    [
      span({ fontFamily: "Sans", fontWeight: 700, fontSize: 8, color: GREEN }, label),
    ],
  );
}

function featureCard(story, index) {
  const numChip = div(
    {
      width: 18, height: 18, backgroundColor: RED, flexShrink: 0,
      alignItems: "center", justifyContent: "center", marginRight: 5,
    },
    [
      span({ fontFamily: "Sans", fontWeight: 700, fontSize: 11, color: PAPER }, `${index + 1}`),
    ],
  );
  const header = div(
    { flexDirection: "row", alignItems: "center", width: "100%" },
    [
      numChip,
      span(
        { fontFamily: "Sans", fontWeight: 700, fontSize: 10, color: INK, flex: 1 },
        `${story.topic} · ${story.region.toUpperCase()}`,
      ),
      confChip(story.confidence),
    ],
  );
  const headline = span(
    {
      fontFamily: "Serif", fontWeight: 700, fontSize: 11.6, color: INK,
      lineHeight: 1.08, marginTop: 2,
    },
    story.headline,
  );
  const figureChip = div(
    { backgroundColor: INK, padding: "2px 6px", marginRight: 6 },
    [
      span({ fontFamily: "Sans", fontWeight: 700, fontSize: 11, color: YELLOW }, story.key_figure),
    ],
  );
  const metaRow = div(
    { flexDirection: "row", alignItems: "center", marginTop: 3 },
    [
      figureChip,
      span(
        { fontFamily: "Mono", fontSize: 9.5, color: INK },
        `${story.utc_time ?? ""} UTC`,
      ),
    ],
  );
  const detail = span(
    { fontFamily: "Sans", fontSize: 8, color: INK, lineHeight: 1.08, marginTop: 2 },
    story.detail ?? "",
  );
  const sources = span(
    { fontFamily: "Sans", fontSize: 7.6, color: MUTED, marginTop: 2 },
    `Sources: ${story.sources.join(" · ")}`,
  );
  const rightCol = div({ flexDirection: "column", flex: 1, marginLeft: 6 }, [
    metaRow,
    detail,
    sources,
  ]);
  const body = div({ flexDirection: "row", width: "100%", marginTop: 3 }, [
    sceneBox(story.scene_type),
    rightCol,
  ]);
  return div(
    {
      flexDirection: "column", flex: 1, border: `1.5px solid ${INK}`,
      padding: "5px 6px", marginRight: 6,
    },
    [header, headline, body],
  );
}

function atAGlance() {
  const confLine = CONF_ORDER.map((c) => `${c} ${confCounts.get(c) ?? 0}`).join(" · ");
  return div(
    {
      flexDirection: "column", flex: 2, backgroundColor: INK,
      padding: "10px 14px", justifyContent: "center",
    },
    [
      span({ fontFamily: "Sans", fontWeight: 700, fontSize: 12, color: YELLOW }, "AT A GLANCE"),
      span(
        { fontFamily: "Serif", fontWeight: 700, fontSize: 21, color: PAPER, marginTop: 4 },
        `${stories.length} stories · ${regionCounts.size} regions · ${topicCounts.size} fields`,
      ),
      span(
        { fontFamily: "Sans", fontSize: 11.5, color: PAPER, marginTop: 5 },
        confLine,
      ),
      span(
        { fontFamily: "Sans", fontSize: 11.5, color: PAPER, marginTop: 3 },
        `${sourceSet.size} named sources · every story dated ${data.date_label} (UTC)`,
      ),
    ],
  );
}

function featureGrid() {
  const rows = [];
  for (let i = 0; i < 12; i += 3) {
    rows.push(
      div({ flexDirection: "row", width: "100%", marginTop: 4 }, [
        featureCard(features[i], i),
        featureCard(features[i + 1], i + 1),
        featureCard(features[i + 2], i + 2),
      ]),
    );
  }
  rows.push(
    div({ flexDirection: "row", width: "100%", marginTop: 4 }, [
      featureCard(features[12], 12),
      atAGlance(),
    ]),
  );
  return div({ flexDirection: "column", width: "100%" }, rows);
}

// ---------- briefs ("ALSO TODAY") ----------
function briefLine(story, index) {
  return div({ flexDirection: "row", width: "100%", marginTop: 1.5 }, [
    span(
      { fontFamily: "Sans", fontWeight: 700, fontSize: 7.5, color: INK, marginRight: 3 },
      `${index + 1}.`,
    ),
    span(
      { fontFamily: "Sans", fontSize: 7.5, color: INK, lineHeight: 1.08, flex: 1 },
      `${story.headline} (${story.sources.join(", ")})`,
    ),
  ]);
}

function briefsBlock() {
  const half = Math.ceil(briefs.length / 2);
  const colA = briefs.slice(0, half).map((s, i) => briefLine(s, features.length + i));
  const colB = briefs
    .slice(half)
    .map((s, i) => briefLine(s, features.length + half + i));
  return div({ flexDirection: "column", flex: 1.35, marginRight: 10 }, [
    span(
      { fontFamily: "Sans", fontWeight: 700, fontSize: 12, color: INK },
      "ALSO TODAY",
    ),
    div({ flexDirection: "row", width: "100%", marginTop: 2 }, [
      div({ flexDirection: "column", flex: 1, marginRight: 8 }, colA),
      div({ flexDirection: "column", flex: 1 }, colB),
    ]),
  ]);
}

// ---------- pin map ----------
// Stylised continents as ellipses on a navy panel; pins placed by region.
const MAP_W = 412;
const MAP_H = 88;
function land(cx, cy, rx, ry) {
  return h("ellipse", {}, [], { cx, cy, rx, ry, fill: LAND });
}
function pin(x, y) {
  return [circle(x, y, 9, RED, { stroke: PAPER, "stroke-width": 1.5 })];
}
function pinLabel(x, y, n) {
  // Satori cannot render <text> inside SVG, so pin numbers are HTML
  // overlays positioned over the map panel.
  return div(
    {
      position: "absolute", left: x - 9, top: y - 9, width: 18, height: 18,
      alignItems: "center", justifyContent: "center",
    },
    [span({ fontFamily: "Sans", fontWeight: 700, fontSize: 9, color: PAPER }, `${n}`)],
  );
}
// x/y per feature index (1-based story number -> position on the panel)
const PIN_POS = {
  1: [199, 26], 2: [321, 30], 3: [339, 40], 4: [308, 58], 5: [372, 75],
  6: [60, 33], 7: [42, 47], 8: [217, 36], 9: [301, 42], 10: [193, 64],
  11: [180, 36], 12: [230, 53], 13: [80, 53],
};
function pinMap() {
  const lands = [
    land(64, 35, 56, 21),   // North America
    land(96, 75, 24, 15),   // South America
    land(196, 30, 38, 15),  // Europe
    land(202, 63, 31, 18),  // Africa
    land(301, 37, 71, 21),  // Asia
    land(308, 62, 27, 10),  // SE Asia
    land(369, 77, 27, 10),  // Oceania
  ];
  const pins = features.flatMap((_, i) => {
    const [x, y] = PIN_POS[i + 1] ?? [30 + i * 20, 30];
    return pin(x, y);
  });
  const labels = features.map((_, i) => {
    const [x, y] = PIN_POS[i + 1] ?? [30 + i * 20, 30];
    return pinLabel(x, y, i + 1);
  });
  const mapSvg = h("svg", {}, [...lands, ...pins], {
    width: MAP_W, height: MAP_H, viewBox: `0 0 ${MAP_W} ${MAP_H}`,
  });
  return div({ flexDirection: "column", width: "100%" }, [
    span(
      { fontFamily: "Sans", fontWeight: 700, fontSize: 11, color: INK },
      `WHERE IT HAPPENED — PINS 1–${features.length}`,
    ),
    div(
      {
        backgroundColor: NAVY, width: MAP_W, height: MAP_H, marginTop: 3,
        position: "relative",
      },
      [mapSvg, ...labels],
    ),
  ]);
}

// ---------- date check ----------
function dateCheck() {
  const items = data.excluded.map((e) =>
    span(
      { fontFamily: "Sans", fontSize: 7.6, color: INK, lineHeight: 1.1, marginTop: 0.5 },
      `• ${e.day}: ${e.headline}`,
    ),
  );
  return div(
    {
      flexDirection: "column", border: `1.5px solid ${RED}`,
      padding: "5px 8px", width: "100%", marginTop: 6,
    },
    [
      span({ fontFamily: "Sans", fontWeight: 700, fontSize: 10.5, color: RED }, "DATE CHECK"),
      span(
        { fontFamily: "Sans", fontSize: 7.6, color: INK, lineHeight: 1.15, marginTop: 2 },
        `Every story here happened or was first reported on ${data.date_label} (UTC), verified against dated sources. Left out as earlier news:`,
      ),
      ...items,
    ],
  );
}

// ---------- footer ----------
function footer() {
  return div(
    {
      flexDirection: "row", justifyContent: "space-between", width: "100%",
      marginTop: 4, borderTop: `1.5px solid ${INK}`, paddingTop: 3,
    },
    [
      span(
        { fontFamily: "Sans", fontSize: 7.8, color: INK, flex: 1 },
        "HOW SURE: OFFICIAL = on record · CONFIRMED = 2+ outlets · REPORTED = single wire/local · CLAIM = one side's account · ONGOING = still developing",
      ),
      span(
        { fontFamily: "Sans", fontSize: 7.8, color: INK, marginLeft: 10 },
        "Vector scenes drawn in code — no photos",
      ),
    ],
  );
}

// ---------- page ----------
function page() {
  const bottom = div({ flexDirection: "row", width: "100%", marginTop: 7 }, [
    briefsBlock(),
    div({ flexDirection: "column", flex: 1 }, [pinMap(), dateCheck()]),
  ]);
  return div(
    {
      flexDirection: "column", width: PAGE, height: PAGE,
      boxSizing: "border-box",
      backgroundColor: PAPER, border: `2px solid ${INK}`, padding: 11,
    },
    [
      masthead(),
      blackBar(),
      whereRow(),
      timelineStrip(),
      numbersStrip(),
      featureGrid(),
      bottom,
      footer(),
    ],
  );
}

// ---------- render ----------
const svgOut = await satori(page(), {
  width: PAGE,
  height: PAGE,
  fonts: FONTS,
  loadSystemFonts: false,
});
const png = new Resvg(svgOut, {
  fitTo: { mode: "width", value: PAGE },
  font: { loadSystemFonts: false },
})
  .render()
  .asPng();
const outPath = join(HERE, "entry.png");
writeFileSync(outPath, png);
console.log(`wrote ${outPath} (${png.length} bytes)`);
