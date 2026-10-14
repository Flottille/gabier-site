/**
 * A minimal TextMate theme that matches the Gabier palette, so highlighted
 * code on the site looks hand-coloured rather than bolted on.
 */
export const gabierDark = {
  name: 'gabier-dark',
  type: 'dark' as const,
  colors: {
    'editor.background': '#132238',
    'editor.foreground': '#F4EFE6',
  },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7C8CA3', fontStyle: 'italic' } },
    { scope: ['string', 'string.quoted', 'constant.other.symbol'], settings: { foreground: '#2BB5A0' } },
    { scope: ['constant.numeric', 'constant.language', 'constant.language.boolean'], settings: { foreground: '#2BB5A0' } },
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control'], settings: { foreground: '#F2A27A' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: '#F4EFE6' } },
    { scope: ['entity.name.type', 'support.type', 'entity.name.class', 'support.class'], settings: { foreground: '#F2A27A' } },
    { scope: ['variable', 'variable.other', 'meta.definition.variable'], settings: { foreground: '#BFC9D8' } },
    { scope: ['variable.parameter'], settings: { foreground: '#BFC9D8' } },
    { scope: ['punctuation', 'meta.brace', 'keyword.operator'], settings: { foreground: '#BFC9D8' } },
    // TOML / INI section headers and keys
    { scope: ['entity.name.section', 'entity.name.tag', 'support.type.property-name'], settings: { foreground: '#F2A27A' } },
    { scope: ['variable.other.key', 'support.type.property-name.toml'], settings: { foreground: '#F4EFE6' } },
    // Shell
    { scope: ['entity.name.command', 'support.function.builtin.shell'], settings: { foreground: '#F4EFE6' } },
    { scope: ['variable.language', 'constant.character.escape'], settings: { foreground: '#2BB5A0' } },
    { scope: ['invalid', 'invalid.illegal'], settings: { foreground: '#D64545' } },
  ],
};
