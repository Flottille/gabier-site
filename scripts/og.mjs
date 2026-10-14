/**
 * Generates the static assets that cannot come out of the Astro pipeline:
 * favicons, PWA icons, and one 1200×630 Open Graph image per page.
 *
 *   node scripts/og.mjs
 *
 * Text is laid out by satori (which emits glyph outlines, not <text>), then
 * rasterised by sharp — so no font needs to be installed on the machine.
 * Output lands in public/ and is meant to be committed: the pages only change
 * when the copy does.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import satori from "satori";
import sharp from "sharp";

const root = fileURLToPath(new URL("..", import.meta.url));
const publicDir = path.join(root, "public");
const ogDir = path.join(publicDir, "og");

const PALETTE = {
  bg: "#0F1B2D",
  bgDeep: "#0B1424",
  surface: "#132238",
  line: "#22344F",
  ink: "#F4EFE6",
  inkMuted: "#BFC9D8",
  brand: "#E8613A",
  accent: "#2BB5A0",
};

const PAGES = [
  {
    slug: "default",
    eyebrow: "SSH DAEMON · RUST · DISCORD & SLACK",
    title: "Know who boards your server.",
    subtitle: "SSH login alerts on Discord or Slack, within a second.",
  },
  {
    slug: "features",
    eyebrow: "FEATURES",
    title: "Everything a lookout needs.",
    subtitle: "Real time, hardened by default, one static binary.",
  },
  {
    slug: "how-it-works",
    eyebrow: "HOW IT WORKS",
    title: "Watch, recognize, shout.",
    subtitle: "Three stages, three source files, one async pipeline.",
  },
  {
    slug: "install",
    eyebrow: "INSTALL",
    title: "Two minutes to a running lookout.",
    subtitle: "One command, one webhook, one hardened systemd unit.",
  },
  {
    slug: "docs",
    eyebrow: "DOCUMENTATION",
    title: "Configure it once, forget it.",
    subtitle: "Config reference, CLI, events, channels, troubleshooting.",
  },
];

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

/** satori takes React-shaped objects; these helpers keep the tree readable. */
const el = (type, props = {}, ...children) => ({
  type,
  props: { ...props, children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children },
});

function card({ eyebrow, title, subtitle }, crabDataUri) {
  return el(
    "div",
    {
      style: {
        width: 1200,
        height: 630,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: PALETTE.bg,
        // A warm glow behind the crab, so the card is not a flat rectangle.
        backgroundImage: `radial-gradient(900px 500px at 88% 18%, ${PALETTE.surface} 0%, ${PALETTE.bg} 62%)`,
        padding: "64px 72px",
        fontFamily: "Space Grotesk",
      },
    },
    // Top row: wordmark
    el(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 20 } },
      el(
        "div",
        {
          style: {
            width: 68,
            height: 68,
            borderRadius: 17,
            backgroundColor: PALETTE.brand,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        },
        el("img", { src: crabDataUri, width: 58, height: 58 }),
      ),
      el("div", { style: { display: "flex", fontSize: 40, fontWeight: 700, color: PALETTE.ink, letterSpacing: -0.5 } }, "Gabier"),
    ),

    // Middle: the message
    el(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 20, maxWidth: 940 } },
      el(
        "div",
        {
          style: {
            display: "flex",
            fontFamily: "IBM Plex Mono",
            fontSize: 21,
            fontWeight: 500,
            letterSpacing: 3.4,
            color: PALETTE.accent,
          },
        },
        eyebrow,
      ),
      el(
        "div",
        { style: { display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2.4, color: PALETTE.ink } },
        title,
      ),
      el("div", { style: { display: "flex", fontSize: 30, fontWeight: 500, color: PALETTE.inkMuted } }, subtitle),
    ),

    // Bottom row: the install line and the domain
    el(
      "div",
      { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
      el(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 12,
            backgroundColor: PALETTE.surface,
            border: `1px solid ${PALETTE.line}`,
            borderRadius: 12,
            padding: "14px 22px",
            fontFamily: "IBM Plex Mono",
            fontSize: 25,
          },
        },
        el("div", { style: { display: "flex", color: PALETTE.accent } }, "$"),
        el("div", { style: { display: "flex", color: PALETTE.ink } }, "cargo install gabier"),
      ),
      el(
        "div",
        { style: { display: "flex", fontFamily: "IBM Plex Mono", fontSize: 25, color: PALETTE.inkMuted } },
        "gabier.sh",
      ),
    ),
  );
}

/** ICO is a tiny container; a single embedded PNG is valid and widely supported. */
function icoFromPng(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // width  (32px)
  entry.writeUInt8(32, 1); // height (32px)
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);

  return Buffer.concat([header, entry, png]);
}

/** The crab on its brand tile, used for every square icon. */
async function tile(size) {
  const inset = Math.round(size * 0.86);
  const radius = Math.round(size * 0.22);

  const crab = await sharp(path.join(root, "src/assets/pince.png"))
    .resize(inset, inset, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const background = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
       <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${PALETTE.brand}"/>
     </svg>`,
  );

  return sharp(background).composite([{ input: crab, gravity: "center" }]).png().toBuffer();
}

async function main() {
  await mkdir(ogDir, { recursive: true });

  const fonts = await loadFonts();

  // satori cannot read from disk, so the crab goes in as a data URI.
  const crabPng = await sharp(path.join(root, "src/assets/pince.png"))
    .resize(232, 232, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const crabDataUri = `data:image/png;base64,${crabPng.toString("base64")}`;

  for (const page of PAGES) {
    const svg = await satori(card(page, crabDataUri), { width: 1200, height: 630, fonts });
    const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
    await writeFile(path.join(ogDir, `${page.slug}.png`), png);
    console.log(`og/${page.slug}.png  ${(png.length / 1024).toFixed(0)} kB`);
  }

  // Icons
  const favicon32 = await tile(32);
  await writeFile(path.join(publicDir, "favicon.ico"), icoFromPng(favicon32));
  await writeFile(path.join(publicDir, "favicon-32.png"), favicon32);
  await writeFile(path.join(publicDir, "apple-touch-icon.png"), await tile(180));
  await writeFile(path.join(publicDir, "icon-192.png"), await tile(192));
  await writeFile(path.join(publicDir, "icon-512.png"), await tile(512));
  console.log("favicon.ico, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png");

  // An SVG favicon stays crisp in a pinned tab; the crab is referenced as a data URI.
  const crabIcon = await sharp(path.join(root, "src/assets/pince.png"))
    .resize(96, 96, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(
    path.join(publicDir, "favicon.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="${PALETTE.brand}"/>
  <image x="9" y="9" width="110" height="110" href="data:image/png;base64,${crabIcon.toString("base64")}"/>
</svg>
`,
  );
  console.log("favicon.svg");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
