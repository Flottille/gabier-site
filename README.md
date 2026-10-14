# gabier.nebulabs.org

The website and documentation for [Gabier](https://github.com/Flottille/gabier), a small Rust daemon that
notifies Discord or Slack on SSH logins.

Astro 5, Tailwind v4, statically generated. No client framework, ~3 kB of JavaScript on the heaviest page.

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static site into dist/, then the Pagefind index
npm run preview   # serve dist/ exactly as production does
```

## Layout

```
src/
  config/site.ts        project facts: URLs, repo, version, measured figures
  config/shiki-theme.ts the code-highlighting theme, in the brand palette
  content/docs/*.mdx    the documentation; frontmatter drives nav and SEO
  content.config.ts     the docs collection schema
  components/           Astro components, no framework
  layouts/              BaseLayout (marketing) and DocsLayout (sidebar + TOC)
  lib/jsonld.ts         structured-data builders
  lib/docs.ts           docs ordering, grouping and URLs
  pages/                one file per route; docs/[...slug] renders the collection
  styles/global.css     Tailwind theme tokens, base layer, prose
scripts/og.mjs          generates favicons and the Open Graph cards
public/                 fonts, icons, OG images, _headers, _redirects
maquette/               the original static mockup this site was built from
```

**Everything project-specific lives in `src/config/site.ts`** — the domain, the repository, the version, the
navigation. Change it there and the whole site follows.

## Writing documentation

Add an `.mdx` file under `src/content/docs/`. The frontmatter is validated at build time:

```yaml
---
title: Throttling              # <h1> and <title>
navTitle: Throttling           # optional shorter sidebar label
eyebrow: Reference             # optional kicker above the <h1>
description: 40–300 chars      # meta description, required
group: Reference               # Getting started | Reference | Channels | More
order: 2                       # position in the group, and in prev/next
faq:                           # optional, emits FAQPage structured data
  - q: …
    a: …
---
```

The sidebar, the prev/next links, the table of contents, the sitemap and the search index all follow from
that. `index.mdx` is the section landing page and owns `/docs/` itself.

Markdown code fences are highlighted with the brand Shiki theme and get a copy button automatically. Tables
are wrapped in a scroll container by a rehype plugin, so a wide reference table never widens the page.

## SEO

- Canonical URL, Open Graph and Twitter tags on every page, from one `<Seo>` component.
- JSON-LD: `SoftwareApplication`, `WebSite`, `BreadcrumbList`, `HowTo` on the install pages, `TechArticle` on
  every docs page, and `FAQPage` where the frontmatter declares one.
- `sitemap-index.xml` with per-section priorities, and a generated `robots.txt`.
- Per-page 1200×630 Open Graph cards, committed under `public/og/`.
- Clean directory URLs with a trailing slash, enforced by `trailingSlash: 'always'`.

Regenerate the cards and icons after a copy change:

```sh
npm run og
```

It lays out the text with satori and rasterises with sharp, so no font has to be installed on the machine.

## Fonts

Space Grotesk and IBM Plex Mono are self-hosted from `public/fonts/`, copied out of the `@fontsource`
packages. Only the latin and latin-ext subsets, at the weights actually used. To refresh them after a
`@fontsource` upgrade:

```sh
cp node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-{500,700}-normal.woff2 public/fonts/
cp node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-ext-{500,700}-normal.woff2 public/fonts/
cp node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-{400,500}-normal.woff2 public/fonts/
cp node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-ext-{400,500}-normal.woff2 public/fonts/
```

## Search

Documentation search is [Pagefind](https://pagefind.app): a static index built from `dist/` after the Astro
build, over the elements marked `data-pagefind-body`. It therefore **only works in a production build** —
in `astro dev` the search box says so rather than failing.

```sh
npm run build && npm run preview
```

## Deployment

Cloudflare Pages, connected to this repository. Every push to `main` is built and published by Cloudflare;
pull requests get their own preview URL. GitHub Actions only type-checks and builds, as a guard.

One-time setup in the Cloudflare dashboard — **Workers & Pages → Create → Pages → Connect to Git**:

| Setting | Value |
| --- | --- |
| Repository | `Flottille/gabier-site` |
| Production branch | `main` |
| Framework preset | Astro (or None) |
| Build command | `npm run build` |
| Output directory | `dist` |

The Node version comes from `.node-version`, so there is no environment variable to set.

Then **Custom domains → Set up a domain → `gabier.nebulabs.org`**. Because the zone is already on this
Cloudflare account, the DNS record and the certificate are created automatically — nothing to add by hand.

### Headers and redirects

`public/_headers` and `public/_redirects` are read by Cloudflare Pages (GitHub Pages ignored both, which is
why the content policy had never actually been exercised).

The content security policy itself is **not** in `_headers`: Astro emits it as a `<meta>` tag so it can hash
its own inline scripts, whose hashes change on every build. `_headers` carries only `frame-ancestors`, which
a meta tag cannot express, plus the other security headers and the cache policy.

Two directives are load-bearing and easy to break:

- `script-src 'wasm-unsafe-eval'` and `worker-src 'self'` — Pagefind runs the search index as WebAssembly
  inside a Web Worker. Remove either and the search box silently finds nothing.
- `style-src 'unsafe-inline'` — a handful of components size elements with a `style` attribute, and
  attributes cannot be hashed.

Both live in `experimental.csp` in `astro.config.ts`.

## Before the first deploy

- [ ] Measure the binary and fill in `STATS` in `src/config/site.ts` — the build warns while `[X]` is still
      there.
- [ ] Connect the repository in Cloudflare Pages and attach gabier.nebulabs.org.

## The explainer animation

`scripts/anim.mjs` renders the "how it works" explainer — the accepted login, then
the 43-attempt scan that still produces one notification — and encodes it three ways
into `public/media/`:

```sh
node scripts/anim.mjs            # render + encode
node scripts/anim.mjs --frames   # frames only, into the temp dir
node scripts/anim.mjs --encode   # re-encode the frames already rendered
node scripts/anim.mjs --at 9.6   # a single frame, to check the layout
```

| File | Size | Use |
| --- | --- | --- |
| `how-it-works.mp4` | ~345 kB | Twitter/X, Discord, anywhere video is allowed |
| `how-it-works.gif` | ~1.1 MB | GitHub READMEs, where it is certain to animate |
| `how-it-works.webp` | ~370 kB | the web, when animated WebP is acceptable |

Frames come from satori + sharp, same as the OG cards. ffmpeg does the MP4 and the
GIF (its palettegen is far better than a generic quantiser); the WebP always goes
through sharp, which produces it eight times smaller than ffmpeg's libwebp here.
**Without ffmpeg the script still works** — it falls back to sharp for the GIF and
WebP, and skips the MP4.

Two things that will bite whoever edits it: arrows and other glyphs outside the latin
subset render as tofu, because the fonts are subset — draw them as SVG instead. And
sharp's `delay` option needs one entry per frame; a scalar is silently ignored and
the whole animation plays in a tenth of a second.
