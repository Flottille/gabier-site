/**
 * Inline icon set. Inline (rather than a sprite or an icon font) because there
 * are a dozen of them and they must never cost a request or a layout shift.
 *
 * Every path is drawn on a 24×24 grid, stroked with `currentColor`.
 */
export const ICON_PATHS = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>',
  sliders: '<path d="M4 6h16M4 12h10M4 18h7"/>',
  chat: '<path d="M4 4h16v12H8l-4 4z"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  brackets:
    '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  "arrow-right": '<path d="M4 12h14M13 6l6 6-6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  warning: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  "chevron-down": '<path d="M6 9l6 6 6-6"/>',
} as const;

export type IconName = keyof typeof ICON_PATHS;
