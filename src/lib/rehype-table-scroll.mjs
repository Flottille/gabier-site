/**
 * Wraps every markdown table in a scroll container, so a wide reference table
 * scrolls inside itself instead of widening the whole page on a phone.
 */
export function rehypeTableScroll() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (node.type !== "element" || node.tagName !== "table") return;
      if (!parent || index === null || index === undefined) return;
      if (parent.type === "element" && parent.properties?.className?.includes?.("table-scroll")) return;

      parent.children[index] = {
        type: "element",
        tagName: "div",
        // tabindex makes the overflow area reachable (and scrollable) by keyboard.
        properties: { className: ["table-scroll"], tabindex: 0 },
        children: [node],
      };
    });
  };
}

/** Minimal depth-first walk; avoids pulling unist-util-visit in for one plugin. */
function visit(node, callback, index = null, parent = null) {
  callback(node, index, parent);
  const children = node.children;
  if (!Array.isArray(children)) return;
  for (let i = children.length - 1; i >= 0; i -= 1) {
    visit(children[i], callback, i, node);
  }
}
