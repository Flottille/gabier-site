/**
 * Single source of truth for everything that is "the project" rather than "the site".
 *
 * Two repositories under the `Flottille` organisation:
 *   Flottille/gabier       the Rust daemon
 *   Flottille/gabier-site  this site
 *
 * TODO before going live: fill in `stats` once the binary has been measured.
 */

export const SITE = {
  name: 'Gabier',
  shortName: 'Gabier',
  tagline: 'Know who boards your server.',
  description:
    'Gabier watches SSH logins on your VPS and pings you on Discord or Slack within a second. One Rust binary, zero dependencies, with burst throttling so a port-22 scan never drowns the real login.',
  /** Canonical origin, no trailing slash. Drives canonical URLs, the sitemap and OG tags. */
  url: 'https://gabier.nebulabs.org',
  lang: 'en',
  locale: 'en_US',
  version: '0.1.0',
  license: 'MIT',
  author: {
    name: 'Thibault Pointurier',
    url: 'https://github.com/ThibaultPointurier',
  },
  org: 'Flottille',
  repo: {
    owner: 'Flottille',
    name: 'gabier',
    branch: 'main',
  },
  /** The repository holding this site, for "edit this page". */
  siteRepo: {
    owner: 'Flottille',
    name: 'gabier-site',
    branch: 'main',
  },
  crate: 'gabier',
} as const;

const repoUrl = `https://github.com/${SITE.repo.owner}/${SITE.repo.name}`;
const siteRepoUrl = `https://github.com/${SITE.siteRepo.owner}/${SITE.siteRepo.name}`;
const rawRepo = `https://raw.githubusercontent.com/${SITE.repo.owner}/${SITE.repo.name}/${SITE.repo.branch}`;

export const LINKS = {
  github: repoUrl,
  org: `https://github.com/${SITE.org}`,
  issues: `${repoUrl}/issues`,
  discussions: `${repoUrl}/discussions`,
  releases: `${repoUrl}/releases`,
  latestRelease: `${repoUrl}/releases/latest/download`,
  contributing: `${repoUrl}/blob/${SITE.repo.branch}/CONTRIBUTING.md`,
  exampleConfig: `${repoUrl}/blob/${SITE.repo.branch}/config.example.toml`,
  serviceUnit: `${repoUrl}/blob/${SITE.repo.branch}/systemd/gabier.service`,
  installScript: `${repoUrl}/blob/${SITE.repo.branch}/install.sh`,
  rawServiceUnit: `${rawRepo}/systemd/gabier.service`,
  source: {
    sshd: `${repoUrl}/blob/${SITE.repo.branch}/src/sshd.rs`,
    watch: `${repoUrl}/blob/${SITE.repo.branch}/src/watch.rs`,
    notify: `${repoUrl}/blob/${SITE.repo.branch}/src/notify.rs`,
    hook: `${repoUrl}/blob/${SITE.repo.branch}/src/hook.rs`,
  },
  editDocs: (file: string) =>
    `${siteRepoUrl}/edit/${SITE.siteRepo.branch}/src/content/docs/${file}`,
} as const;

/** Measured figures shown on the site. Replace the placeholders once you have real numbers. */
export const STATS = {
  binarySize: '[X] MB',
  idleRss: '[X] MB',
  /** Hard ceiling set by the systemd unit. */
  memoryMax: '64 MB',
  runtimeDeps: '0',
  linesOfRust: '[X]',
} as const;

export const NAV = [
  { href: '/features/', label: 'Features' },
  { href: '/how-it-works/', label: 'How it works' },
  { href: '/install/', label: 'Install' },
  { href: '/docs/', label: 'Docs' },
] as const;

/** The daemon is not on crates.io yet, so the headline command is a clone-and-build. */
export const INSTALL_ONELINER = `cargo build --release && sudo ./install.sh`;
