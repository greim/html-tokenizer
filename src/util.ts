/**
 * A list of tags which are self-closing in HTML.
 */
const SELF_CLOSING_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'command',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * A list of tags which are automatically closed
 * when closing tags for their parents are encountered.
 */
const CLOSED_BY_PARENTS = new Set([
  'p',
  'li',
  'dd',
  'rb',
  'rt',
  'rtc',
  'rp',
  'optgroup',
  'option',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
]);

/**
 * Tags which are closed when a start tag
 * of another type ocurrs.
 */
const CLOSED_BY_SIBLINGS: { [tag: string]: Set<string> | undefined } = {
  p: new Set([
    'address',
    'article',
    'aside',
    'blockquote',
    'div',
    'dl',
    'fieldset',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'hgroup',
    'hr',
    'main',
    'nav',
    'ol',
    'p',
    'pre',
    'section',
    'table',
    'ul',
  ]),
  li: new Set(['li']),
  dt: new Set(['dt', 'dd']),
  dd: new Set(['dt', 'dd']),
  rb: new Set(['rb', 'rt', 'rtc', 'rp']),
  rt: new Set(['rb', 'rt', 'rtc', 'rp']),
  rtc: new Set(['rb', 'rtc', 'rp']),
  rp: new Set(['rb', 'rt', 'rtc', 'rp']),
  optgroup: new Set(['optgroup']),
  option: new Set(['option', 'optgroup']),
  thead: new Set(['tbody', 'tfoot']),
  tbody: new Set(['tbody', 'tfoot']),
  tfoot: new Set(['tbody']),
  tr: new Set(['tr']),
  td: new Set(['td', 'th']),
  th: new Set(['td', 'th']),
};

/**
 * Determine whether a tag is a self-closing tag.
 */
export function isSelfClosing(tag: string): boolean {
  return SELF_CLOSING_TAGS.has(tag);
}

/**
 * Determine whether a tag is closed by another tag
 */
export function isClosedBy(tag: string, otherTag: string): boolean {
  return CLOSED_BY_SIBLINGS[tag]?.has(otherTag) ?? false;
}

/** Determine whether a tag is auto-closed by its parent. */
export function isClosedByParent(tag: string): boolean {
  return CLOSED_BY_PARENTS.has(tag);
}
