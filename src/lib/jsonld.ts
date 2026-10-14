import { SITE, LINKS } from "../config/site";

const abs = (path: string) => new URL(path, SITE.url).href;

/** The product itself. The main entity crawlers should attach to the site. */
export function softwareApplicationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE.url}/#software`,
    name: SITE.name,
    alternateName: "gabier",
    description: SITE.description,
    applicationCategory: "SecurityApplication",
    applicationSubCategory: "Server monitoring",
    operatingSystem: "Linux",
    softwareVersion: SITE.version,
    url: SITE.url,
    downloadUrl: LINKS.releases,
    installUrl: `${SITE.url}/install/`,
    codeRepository: LINKS.github,
    programmingLanguage: "Rust",
    license: "https://opensource.org/licenses/MIT",
    isAccessibleForFree: true,
    image: abs("/og/default.png"),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: SITE.author.name,
      url: SITE.author.url,
    },
    featureList: [
      "Real-time SSH login notifications",
      "Discord webhook support",
      "Slack webhook support",
      "journald and log-file sources",
      "Per-user and per-IP ignore lists",
      "Hardened systemd unit",
    ],
  };
}

export function webSiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: SITE.lang,
    publisher: {
      "@type": "Person",
      name: SITE.author.name,
      url: SITE.author.url,
    },
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbsLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: abs(crumb.path),
    })),
  };
}

export type QA = { question: string; answer: string };

export function faqLd(entries: QA[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export type HowToStep = { name: string; text: string };

export function howToLd(opts: { name: string; description: string; steps: HowToStep[]; totalTime?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: opts.name,
    description: opts.description,
    totalTime: opts.totalTime ?? "PT2M",
    tool: [{ "@type": "HowToTool", name: "A Linux server running sshd" }],
    step: opts.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

export function techArticleLd(opts: { title: string; description: string; path: string; section?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: opts.title,
    description: opts.description,
    url: abs(opts.path),
    inLanguage: SITE.lang,
    articleSection: opts.section,
    isPartOf: { "@id": `${SITE.url}/#website` },
    about: { "@id": `${SITE.url}/#software` },
    author: { "@type": "Person", name: SITE.author.name, url: SITE.author.url },
    license: "https://opensource.org/licenses/MIT",
  };
}
