import { getCollection, type CollectionEntry } from "astro:content";
import { DOC_GROUPS } from "../content.config";

export type Doc = CollectionEntry<"docs">;

/** `index` is the section landing page, so it owns `/docs/` itself. */
export const docHref = (id: string) => (id === "index" ? "/docs/" : `/docs/${id}/`);

/** The file name relative to the content directory, for "edit this page" links. */
export const docFile = (entry: Doc) => entry.filePath?.split("/docs/").pop() ?? `${entry.id}.mdx`;

/** Reading order: groups in the declared order, then `order` inside each group. */
export async function getSortedDocs(): Promise<Doc[]> {
  const docs = await getCollection("docs");
  return docs.sort((a, b) => {
    const groupDelta = DOC_GROUPS.indexOf(a.data.group) - DOC_GROUPS.indexOf(b.data.group);
    return groupDelta !== 0 ? groupDelta : a.data.order - b.data.order;
  });
}

export type DocGroup = { title: string; items: Doc[] };

export function groupDocs(docs: Doc[]): DocGroup[] {
  return DOC_GROUPS.map((title) => ({
    title,
    items: docs.filter((doc) => doc.data.group === title),
  })).filter((group) => group.items.length > 0);
}
