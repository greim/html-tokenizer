export const getOpeningTag = chunker(/(<(([a-z0-9-]+:)?[a-z0-9-]+))/ig);
export const getText = chunker(/([^<]+)/g);
export const getClosingTag = chunker(/(<\/(([a-z0-9-]+:)?[a-z0-9-]+)>)/ig);
export const getCommentOpen = chunker(/(<!--)/g);
export const getComment = chunker(/(([\s\S]*?)-->)/g);
export const getScript = chunker(/(([\s\S]*?)<\/script>)/g);
export const getTagEnd = chunker(/(\s*(\/?>))/g);
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
