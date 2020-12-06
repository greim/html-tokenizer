/**
 * Opening tag chunker function.
 */
export const getOpeningTag = chunker(/(<(([a-z0-9-]+:)?[a-z0-9-]+))/ig);

/**
 * Text node chunker function.
 */
export const getText = chunker(/([^<]+)/g);

/**
 * Closing tag chunker function.
 */
export const getClosingTag = chunker(/(<\/(([a-z0-9-]+:)?[a-z0-9-]+)>)/ig);

/**
 * Comment open chunker function.
 */
export const getCommentOpen = chunker(/(<!--)/g);

/**
 * Comment content chunker function.
 */
export const getComment = chunker(/(([\s\S]*?)-->)/g);

/**
 * Script content chunker function.
 */
export const getScript = chunker(/(([\s\S]*?)<\/script>)/g);

/**
 * End tag chunker function.
 */
export const getTagEnd = chunker(/(\s*(\/?>))/g);

/**
 * Attribute name chunker function.
 */
export const getAttributeName = chunker(/(\s+(([a-z0-9\-_]+:)?[a-z0-9\-_]+)(\s*=\s*)?)/ig);

function chunker(regex: RegExp) {
  return (str: string, pos: number) => {
    regex.lastIndex = pos;
    const match = regex.exec(str);
    if (!match || match.index !== pos) {
      return undefined;
    } else {
      return {
        length: match[1].length,
        match,
      };
    }
  };
}
