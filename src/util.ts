const SELF_CLOSING_TAGS = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

const CLOSED_BY_PARENTS = new Set(['p', 'li', 'dd', 'rb', 'rt', 'rtc', 'rp', 'optgroup', 'option', 'tbody', 'tfoot', 'tr', 'td', 'th']);

const CLOSED_BY_SIBLINGS: { [tag: string]: Set<string> | undefined } = Object.freeze({
  p: new Set(['address', 'article', 'aside', 'blockquote', 'div', 'dl', 'fieldset', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul']),
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
});

export function isSelfClosing(closee: string) {
  return SELF_CLOSING_TAGS.has(closee);
}

export function isClosedBy(closee: string, closer: string) {
  const lookup = CLOSED_BY_SIBLINGS[closee];
  return lookup ? lookup.has(closer) : false;
}

export function isClosedByParent(closee: string) {
  return CLOSED_BY_PARENTS.has(closee);
}
