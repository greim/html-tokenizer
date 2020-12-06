const PATTERN = /(\s*([^>\s]*))/g;
const QUOTES = new Set('"\'');

export default function(str: string, pos: number) {
  const quote = str.charAt(pos);
  const pos1 = pos + 1;
  if (QUOTES.has(quote)) {
    const nextQuote = str.indexOf(quote, pos1);
    if (nextQuote === -1) {
      return { length: str.length - pos, value: str.substring(pos1) };
    } else {
      return { length: (nextQuote - pos) + 1, value: str.substring(pos1, nextQuote) };
    }
  } else {
    PATTERN.lastIndex = pos;
    const match = PATTERN.exec(str) || [];
    return { length: match[1].length, value: match[2] };
  }
};
