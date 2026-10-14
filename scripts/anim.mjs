/**
 * Renders the "how Gabier works" explainer as a frame sequence, then encodes
 * it to MP4 / GIF / animated WebP.
 *
 *   node scripts/anim.mjs            # frames + encode (needs ffmpeg on PATH)
 *   node scripts/anim.mjs --frames   # frames only
 *
 * Same pipeline as scripts/og.mjs: satori lays the frame out and emits glyph
 * outlines, sharp rasterises. No font has to be installed, and no browser is
 * involved.
 *
 * The story, in two beats:
 *   1. one accepted login  -> one notification, within a second
 *   2. a 43-attempt scan   -> still one notification, because of the throttle
 * The second beat is the whole reason the project exists, so it gets the time.
 */
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";

import satori from "satori";
import sharp from "sharp";

const run = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const outDir = path.join(root, "public", "media");
const frameDir = path.join(os.tmpdir(), "gabier-anim-frames");

const W = 1200;
const H = 675;
const FPS = 15;
const DURATION = 13; // seconds
const TOTAL = DURATION * FPS;

const C = {
  bg: "#0F1B2D",
  bgDeep: "#0B1424",
  surface: "#132238",
  line: "#22344F",
  lineStrong: "#3A4F6E",
  ink: "#F4EFE6",
  inkMuted: "#BFC9D8",
  inkDim: "#8E9BB0",
  brand: "#E8613A",
  brandSoft: "#F2A27A",
  accent: "#2BB5A0",
  danger: "#E06C6C",
  discordBg: "#313338",
  discordEmbed: "#2B2D31",
};

/* ------------------------------------------------------------------ *
 * Timing helpers
 * ------------------------------------------------------------------ */
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Progress through [from, to] at time t, clamped to 0..1. */
const phase = (t, from, to) => clamp((t - from) / (to - from));

/** 0 -> 1 -> 0 over [from, to], for things that appear and leave. */
const pulse = (t, from, to) => {
  const p = phase(t, from, to);
  return Math.sin(p * Math.PI);
};

/* ------------------------------------------------------------------ *
 * satori element helpers
 * ------------------------------------------------------------------ */
const el = (type, props = {}, ...kids) => {
  const children = kids.flat().filter((k) => k !== null && k !== false && k !== undefined);
  return {
    type,
    props: {
      ...props,
      children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children,
    },
  };
};

const row = (style, ...kids) => el("div", { style: { display: "flex", alignItems: "center", ...style } }, ...kids);
const col = (style, ...kids) =>
  el("div", { style: { display: "flex", flexDirection: "column", ...style } }, ...kids);
const text = (value, style = {}) => el("div", { style: { display: "flex", ...style } }, value);

/* ------------------------------------------------------------------ *
 * The timeline
 * ------------------------------------------------------------------ */
const T = {
  // Beat 1: a legitimate login
  logIn: [0.4, 1.1], // the sshd line appears
  travel: [1.1, 3.0], // it crosses the pipeline
  card1: [2.8, 3.6], // the Discord notification lands
  hold1: [3.6, 5.0],
  // Beat 2: the scan
  scanIn: [5.2, 9.2], // failures pour in, the counter climbs
  firstFail: [5.7, 6.3], // burst = 1: the first one is sent in full
  held: [6.0, 9.4], // the "held" badge on notify.rs
  card2: [9.4, 10.2], // the single summary
  hold2: [10.2, 11.6],
  // Close
  outro: [11.6, 13.0],
};

const STAGES = [
  { file: "watch.rs", label: "follows the journal" },
  { file: "sshd.rs", label: "parses the line" },
  { file: "notify.rs", label: "filters and groups" },
  { file: "hook.rs", label: "posts the webhook" },
];

/** Which pipeline box is lit at time t, and how brightly. */
function stageGlow(t, index) {
  const [a, b] = T.travel;
  const span = (b - a) / STAGES.length;
  const start = a + span * index;
  const scanBurst = index === 2 ? pulse(t, T.scanIn[0], T.scanIn[1]) * 0.55 : 0;
  const scanFlow =
    index < 2 ? pulse(t, T.scanIn[0], T.scanIn[1]) * 0.3 : index === 3 ? pulse(t, T.card2[0] - 0.4, T.card2[1]) * 0.6 : 0;
  return clamp(Math.max(pulse(t, start, start + span * 1.35), scanBurst, scanFlow));
}

/* ------------------------------------------------------------------ *
 * Panels
 * ------------------------------------------------------------------ */
function terminalPanel(t) {
  const lines = [];

  // The accepted login.
  const inOpacity = phase(t, ...T.logIn);
  if (inOpacity > 0) {
    lines.push(
      row(
        { gap: 10, opacity: inOpacity },
        text("Accepted", { color: C.accent, fontFamily: "IBM Plex Mono", fontSize: 15 }),
        text("publickey for root from 203.0.113.42 port 51288", {
          color: C.ink,
          fontFamily: "IBM Plex Mono",
          fontSize: 15,
        }),
      ),
    );
  }

  // The scan: failures scroll past, faster than the eye can count.
  const scanP = phase(t, ...T.scanIn);
  if (scanP > 0) {
    // Six is what the panel holds without clipping the last line.
    const shown = Math.min(6, Math.floor(scanP * 22));
    const users = ["admin", "oracle", "postgres", "test", "ubuntu", "git", "deploy", "ftp", "root"];
    for (let i = 0; i < shown; i += 1) {
      const age = shown - i;
      lines.push(
        row(
          { gap: 10, opacity: clamp(1 - age * 0.085, 0.22, 1) },
          text("Failed", { color: C.danger, fontFamily: "IBM Plex Mono", fontSize: 15 }),
          text(`password for invalid user ${users[i % users.length]} from 185.243.96.107`, {
            color: C.inkMuted,
            fontFamily: "IBM Plex Mono",
            fontSize: 15,
          }),
        ),
      );
    }
  }

  return col(
    {
      width: 648,
      height: 300,
      backgroundColor: C.bgDeep,
      border: `1px solid ${C.line}`,
      borderRadius: 14,
      overflow: "hidden",
    },
    row(
      {
        justifyContent: "space-between",
        padding: "12px 18px",
        borderBottom: `1px solid ${C.line}`,
      },
      text("journalctl -fu ssh", { fontFamily: "IBM Plex Mono", fontSize: 14, color: C.inkDim }),
      row(
        { gap: 7 },
        el("div", { style: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.accent, display: "flex" } }),
        text("listening", { fontFamily: "IBM Plex Mono", fontSize: 13, color: C.inkDim }),
      ),
    ),
    col({ padding: "16px 18px", gap: 7, flex: 1, overflow: "hidden" }, ...lines),
  );
}

/** The accepted-login notification. */
function acceptedCard(t) {
  const p = phase(t, ...T.card1);
  const gone = phase(t, T.scanIn[0] + 0.3, T.scanIn[0] + 0.9);
  const opacity = clamp(p - gone);
  if (opacity <= 0) return null;

  return col(
    {
      width: 420,
      backgroundColor: C.discordBg,
      borderRadius: 12,
      padding: 16,
      gap: 10,
      opacity,
      transform: `translateY(${lerp(16, 0, easeOut(p))}px)`,
    },
    row(
      { gap: 9 },
      text("Gabier", { color: C.brandSoft, fontSize: 15, fontWeight: 700 }),
      el(
        "div",
        {
          style: {
            display: "flex",
            backgroundColor: "#5865F2",
            borderRadius: 4,
            padding: "1px 6px",
            fontSize: 10,
            fontWeight: 700,
            color: "#FFFFFF",
          },
        },
        "APP",
      ),
    ),
    col(
      {
        backgroundColor: C.discordEmbed,
        borderLeft: `4px solid ${C.accent}`,
        borderRadius: 4,
        padding: "12px 14px",
        gap: 8,
      },
      text("Connexion SSH acceptée", { color: C.ink, fontSize: 16, fontWeight: 700 }),
      row(
        { gap: 20 },
        col({ gap: 3 }, text("Utilisateur", { color: C.inkDim, fontSize: 11 }), text("root", { color: "#DBDEE1", fontFamily: "IBM Plex Mono", fontSize: 14 })),
        col({ gap: 3 }, text("IP", { color: C.inkDim, fontSize: 11 }), text("203.0.113.42", { color: "#DBDEE1", fontFamily: "IBM Plex Mono", fontSize: 14 })),
        col({ gap: 3 }, text("Méthode", { color: C.inkDim, fontSize: 11 }), text("publickey", { color: "#DBDEE1", fontFamily: "IBM Plex Mono", fontSize: 14 })),
      ),
    ),
  );
}

/**
 * The first refused attempt. With the default `burst = 1` it goes out in full,
 * immediately — only what follows is grouped. Leaving it out would make the
 * counters lie.
 */
function firstFailureCard(t) {
  const p = phase(t, T.firstFail[0], T.firstFail[1]);
  const gone = phase(t, T.card2[0] - 0.5, T.card2[0] + 0.1);
  const opacity = clamp(p - gone);
  if (opacity <= 0) return null;

  return col(
    {
      width: 420,
      backgroundColor: C.discordBg,
      borderRadius: 12,
      padding: 16,
      gap: 10,
      opacity,
      transform: `translateY(${lerp(14, 0, easeOut(p))}px)`,
    },
    row(
      { gap: 9 },
      text("Gabier", { color: C.brandSoft, fontSize: 15, fontWeight: 700 }),
      el(
        "div",
        {
          style: {
            display: "flex",
            backgroundColor: "#5865F2",
            borderRadius: 4,
            padding: "1px 6px",
            fontSize: 10,
            fontWeight: 700,
            color: "#FFFFFF",
          },
        },
        "APP",
      ),
    ),
    col(
      {
        backgroundColor: C.discordEmbed,
        borderLeft: `4px solid ${C.danger}`,
        borderRadius: 4,
        padding: "12px 14px",
        gap: 6,
      },
      text("Tentative refusée", { color: C.ink, fontSize: 16, fontWeight: 700 }),
      text("invalid user admin depuis 185.243.96.107", {
        color: "#DBDEE1",
        fontFamily: "IBM Plex Mono",
        fontSize: 13,
      }),
    ),
  );
}

/** The burst summary: the point of the whole animation. */
function burstCard(t) {
  const p = phase(t, ...T.card2);
  if (p <= 0) return null;

  return col(
    {
      width: 420,
      backgroundColor: C.discordBg,
      borderRadius: 12,
      padding: 16,
      gap: 10,
      opacity: p,
      transform: `translateY(${lerp(16, 0, easeOut(p))}px)`,
    },
    row(
      { gap: 9 },
      text("Gabier", { color: C.brandSoft, fontSize: 15, fontWeight: 700 }),
      el(
        "div",
        {
          style: {
            display: "flex",
            backgroundColor: "#5865F2",
            borderRadius: 4,
            padding: "1px 6px",
            fontSize: 10,
            fontWeight: 700,
            color: "#FFFFFF",
          },
        },
        "APP",
      ),
    ),
    col(
      {
        backgroundColor: C.discordEmbed,
        borderLeft: `4px solid ${C.brand}`,
        borderRadius: 4,
        padding: "12px 14px",
        gap: 8,
      },
      text("Rafale de tentatives SSH", { color: C.ink, fontSize: 16, fontWeight: 700 }),
      text("43 tentatives refusées depuis 185.243.96.107.", { color: "#DBDEE1", fontSize: 14 }),
      col(
        { gap: 3 },
        text("Comptes visés", { color: C.inkDim, fontSize: 11 }),
        text("admin, oracle, postgres, test, ubuntu", {
          color: "#DBDEE1",
          fontFamily: "IBM Plex Mono",
          fontSize: 13,
        }),
      ),
    ),
  );
}

function pipeline(t) {
  const boxes = STAGES.map((stage, i) => {
    const glow = stageGlow(t, i);
    const lit = glow > 0.04;
    return col(
      {
        width: 258,
        gap: 5,
        padding: "14px 16px",
        borderRadius: 12,
        backgroundColor: lit ? C.surface : C.bg,
        border: `1px solid ${lit ? (i === 3 ? C.brand : C.accent) : C.line}`,
        opacity: lerp(0.62, 1, glow),
      },
      text(stage.file, {
        fontFamily: "IBM Plex Mono",
        fontSize: 13,
        color: lit ? (i === 3 ? C.brandSoft : C.accent) : C.inkDim,
      }),
      text(stage.label, { fontSize: 15, color: lit ? C.ink : C.inkMuted, fontWeight: 700 }),
    );
  });

  // Drawn, not typed: U+2192 is outside the latin subset we ship, so the
  // font would render tofu.
  const arrow = () =>
    el(
      "svg",
      { width: 26, height: 12, viewBox: "0 0 26 12", fill: "none", style: { display: "flex" } },
      el("path", {
        d: "M1 6h21M18 1.5 22.5 6 18 10.5",
        stroke: C.lineStrong,
        strokeWidth: 1.6,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
    );

  const arrows = [arrow(), arrow(), arrow()];

  return row(
    { gap: 0, justifyContent: "space-between" },
    boxes[0],
    arrows[0],
    boxes[1],
    arrows[1],
    boxes[2],
    arrows[2],
    boxes[3],
  );
}

/** The counter that makes the throttle legible: in 43, out 1. */
function counters(t) {
  const scanP = phase(t, ...T.scanIn);
  const refused = Math.floor(scanP * 43);
  const heldP = phase(t, ...T.held);
  const sentBeat1 = phase(t, T.card1[0], T.card1[1]) > 0.5 ? 1 : 0;
  const sentFirstFail = phase(t, T.firstFail[0], T.firstFail[1]) > 0.5 ? 1 : 0;
  const sentBeat2 = phase(t, T.card2[0], T.card2[1]) > 0.5 ? 1 : 0;

  const stat = (label, value, color) =>
    col(
      { gap: 2, minWidth: 128 },
      text(label, { fontFamily: "IBM Plex Mono", fontSize: 12, color: C.inkDim }),
      text(String(value), { fontSize: 30, fontWeight: 700, color }),
    );

  return row(
    { gap: 28 },
    stat("received", scanP > 0 ? refused + 1 : sentBeat1, C.ink),
    stat("grouped", heldP > 0 ? Math.max(0, refused - 1) : 0, C.brandSoft),
    stat("notified", sentBeat1 + sentFirstFail + sentBeat2, C.accent),
  );
}

/* ------------------------------------------------------------------ *
 * Frame
 * ------------------------------------------------------------------ */
function caption(t) {
  if (t < T.travel[0]) return "An SSH login is accepted.";
  if (t < T.card1[0]) return "The line crosses the pipeline.";
  if (t < T.scanIn[0]) return "Notified in under a second.";
  if (t < T.card2[0]) return "A scan arrives: hundreds of attempts.";
  if (t < T.outro[0]) return "One notification. That is the whole point.";
  return "gabier.nebulabs.org";
}

function frame(t, crab) {
  const outroP = phase(t, ...T.outro);

  return el(
    "div",
    {
      style: {
        width: W,
        height: H,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "40px 48px",
        backgroundColor: C.bg,
        backgroundImage: `radial-gradient(900px 520px at 78% 12%, ${C.surface} 0%, ${C.bg} 60%)`,
        fontFamily: "Space Grotesk",
      },
    },

    // Header
    row(
      { justifyContent: "space-between" },
      row(
        { gap: 14 },
        el(
          "div",
          {
            style: {
              width: 52,
              height: 52,
              borderRadius: 13,
              backgroundColor: C.brand,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
          },
          el("img", { src: crab, width: 44, height: 44 }),
        ),
        col(
          { gap: 1 },
          text("Gabier", { fontSize: 28, fontWeight: 700, color: C.ink }),
          text("SSH notifications, Discord and Slack", { fontSize: 14, color: C.inkDim }),
        ),
      ),
      counters(t),
    ),

    // Middle: terminal + notifications
    row(
      { gap: 28, alignItems: "flex-start", opacity: lerp(1, 0.08, easeInOut(outroP)) },
      terminalPanel(t),
      col({ width: 420, gap: 14, justifyContent: "flex-start" }, acceptedCard(t), firstFailureCard(t), burstCard(t)),
    ),

    // Pipeline
    col({ gap: 14, opacity: lerp(1, 0.08, easeInOut(outroP)) }, pipeline(t)),

    // Caption
    row(
      { justifyContent: "space-between", alignItems: "flex-end" },
      text(caption(t), {
        fontSize: 21,
        color: outroP > 0.3 ? C.ink : C.inkMuted,
        fontWeight: outroP > 0.3 ? 700 : 500,
      }),
      text("MIT · Rust · zero dependencies", { fontSize: 14, color: C.inkDim, fontFamily: "IBM Plex Mono" }),
    ),
  );
}

/* ------------------------------------------------------------------ *
 * Render and encode
 * ------------------------------------------------------------------ */
async function loadFonts() {
  const file = (pkg, name) => path.join(root, "node_modules", pkg, "files", name);
  const [bold, medium, mono] = await Promise.all([
    readFile(file("@fontsource/space-grotesk", "space-grotesk-latin-700-normal.woff")),
    readFile(file("@fontsource/space-grotesk", "space-grotesk-latin-500-normal.woff")),
    readFile(file("@fontsource/ibm-plex-mono", "ibm-plex-mono-latin-500-normal.woff")),
  ]);
  return [
    { name: "Space Grotesk", data: bold, weight: 700, style: "normal" },
    { name: "Space Grotesk", data: medium, weight: 500, style: "normal" },
    { name: "IBM Plex Mono", data: mono, weight: 500, style: "normal" },
  ];
}

async function ffmpeg(args) {
  const bin = process.env.FFMPEG ?? "ffmpeg";
  await run(bin, args, { maxBuffer: 1 << 26 });
}

async function hasFfmpeg() {
  try {
    await run(process.env.FFMPEG ?? "ffmpeg", ["-version"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Encoding without ffmpeg. libvips represents an animation as one tall strip
 * plus a `pageHeight`, so the frames are scaled, concatenated and handed over
 * raw. Slower and a coarser GIF palette than ffmpeg's palettegen, but it keeps
 * the script runnable on a bare machine.
 */
async function encodeWithSharp(files, { webpOnly = false } = {}) {
  const strip = async (width, step) => {
    const height = Math.round((width / W) * H);
    const picked = files.filter((_, i) => i % step === 0);
    const raws = [];
    for (const file of picked) {
      raws.push(
        await sharp(file)
          .resize(width, height, { kernel: "lanczos3" })
          .removeAlpha()
          .ensureAlpha()
          .raw()
          .toBuffer(),
      );
    }
    return { buffer: Buffer.concat(raws), width, height, frames: picked.length };
  };

  const webpStrip = await strip(900, 1);
  await sharp(webpStrip.buffer, {
    raw: {
      width: webpStrip.width,
      height: webpStrip.height * webpStrip.frames,
      channels: 4,
      pageHeight: webpStrip.height,
    },
  })
    // delay must be one entry per frame: a scalar is silently ignored and
    // the whole animation plays in a flash.
    .webp({
      quality: 70,
      effort: 5,
      loop: 0,
      delay: Array(webpStrip.frames).fill(Math.round(1000 / FPS)),
    })
    .toFile(path.join(outDir, "how-it-works.webp"));
  console.log("media/how-it-works.webp");

  if (webpOnly) return;

  // Half the frame rate for the GIF: the format pays dearly per frame.
  const gifStrip = await strip(760, 2);
  await sharp(gifStrip.buffer, {
    raw: {
      width: gifStrip.width,
      height: gifStrip.height * gifStrip.frames,
      channels: 4,
      pageHeight: gifStrip.height,
    },
  })
    .gif({
      colours: 128,
      dither: 0.6,
      loop: 0,
      delay: Array(gifStrip.frames).fill(Math.round(2000 / FPS)),
    })
    .toFile(path.join(outDir, "how-it-works.gif"));
  console.log("media/how-it-works.gif");
}

async function main() {
  const framesOnly = process.argv.includes("--frames");
  // `--encode` reuses the frames already on disk, so tuning the encoder
  // does not mean re-rendering everything.
  const encodeOnly = process.argv.includes("--encode");
  const atIndex = process.argv.indexOf("--at");

  if (!encodeOnly) {
    await rm(frameDir, { recursive: true, force: true });
    await mkdir(frameDir, { recursive: true });
  }
  await mkdir(outDir, { recursive: true });

  const fonts = await loadFonts();
  const crabPng = await sharp(path.join(root, "src/assets/pince.png"))
    .resize(176, 176, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const crab = `data:image/png;base64,${crabPng.toString("base64")}`;

  // `--at 9.5` renders a single frame, for checking the layout without
  // waiting on the whole sequence.
  if (atIndex !== -1) {
    const t = Number(process.argv[atIndex + 1] ?? 0);
    const svg = await satori(frame(t, crab), { width: W, height: H, fonts });
    const out = path.join(outDir, `preview-${t}s.png`);
    await sharp(Buffer.from(svg)).png().toFile(out);
    console.log(out);
    return;
  }

  if (!encodeOnly) {
    process.stdout.write(`Rendu de ${TOTAL} images `);
    for (let i = 0; i < TOTAL; i += 1) {
      const t = i / FPS;
      const svg = await satori(frame(t, crab), { width: W, height: H, fonts });
      const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 6 }).toBuffer();
      await writeFile(path.join(frameDir, `f${String(i).padStart(4, "0")}.png`), png);
      if (i % 15 === 0) process.stdout.write(".");
    }
    console.log(` fait (${frameDir})`);
  }

  if (framesOnly) return;

  const files = Array.from({ length: TOTAL }, (_, i) =>
    path.join(frameDir, `f${String(i).padStart(4, "0")}.png`),
  ).filter((f) => existsSync(f));

  if (files.length === 0) {
    throw new Error(`aucune image dans ${frameDir} — relance sans --encode`);
  }

  if (!(await hasFfmpeg())) {
    console.log("ffmpeg introuvable : encodage via sharp (pas de MP4).");
    await encodeWithSharp(files);
    return;
  }

  const pattern = path.join(frameDir, "f%04d.png");
  const mp4 = path.join(outDir, "how-it-works.mp4");
  const gif = path.join(outDir, "how-it-works.gif");

  const palette = path.join(frameDir, "palette.png");

  // MP4: yuv420p and an even width, or half the players refuse it.
  await ffmpeg([
    "-y", "-framerate", String(FPS), "-i", pattern,
    "-vf", "scale=1200:676:flags=lanczos,setsar=1",
    "-c:v", "libx264", "-profile:v", "high", "-crf", "20", "-preset", "slow",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    mp4,
  ]);
  console.log("media/how-it-works.mp4");

  // GIF via a dedicated palette: flat dark UI colours band badly otherwise.
  await ffmpeg([
    "-y", "-framerate", String(FPS), "-i", pattern,
    "-vf", "scale=800:-1:flags=lanczos,palettegen=max_colors=128:stats_mode=diff",
    palette,
  ]);
  await ffmpeg([
    "-y", "-framerate", String(FPS), "-i", pattern, "-i", palette,
    "-lavfi", "scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle",
    "-loop", "0",
    gif,
  ]);
  console.log("media/how-it-works.gif");

  // libwebp through ffmpeg lands around 3 MB here; libvips does the same
  // job in under 400 kB, so the WebP always goes through sharp.
  await encodeWithSharp(files, { webpOnly: true });

  await rm(frameDir, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
