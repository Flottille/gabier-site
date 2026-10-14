import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

export const DOC_GROUPS = ["Getting started", "Reference", "Channels", "More"] as const;

const docs = defineCollection({
  loader: glob({ base: "./src/content/docs", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    /** Page <h1> and <title>. */
    title: z.string(),
    /** Shorter label for the sidebar. Falls back to `title`. */
    navTitle: z.string().optional(),
    /** Meta description. Required — every docs page is an entry point from search. */
    description: z.string().min(40).max(300),
    group: z.enum(DOC_GROUPS),
    /** Position inside the group, and the reading order used by prev/next. */
    order: z.number().int(),
    /** Optional kicker above the <h1>. */
    eyebrow: z.string().optional(),
    updated: z.coerce.date().optional(),
    /** Emitted as FAQPage structured data, for pages shaped like questions. */
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .optional(),
  }),
});

export const collections = { docs };
