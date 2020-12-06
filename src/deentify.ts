import * as types from './types';

const PATTERN = /&(#?)([a-z0-9]+);/ig;
const HANDLERS = new WeakMap<types.Entities, HandlerFn>();

type HandlerFn = (text: string) => string;

function getHandler(map: types.Entities): HandlerFn {
  let handler = HANDLERS.get(map);
  if (!handler) {
    const callback = function(ent: string, isNum: boolean, content: string) {
      if (isNum) {
        const num = content.charAt(0) === 'x'
          ? parseInt('0' + content, 16)
          : parseInt(content, 10);
        return String.fromCharCode(num);
      } else {
        return map[content] || ent;
      }
    };
    handler = (text: string) => {
      return text.indexOf('&') > -1 // attempt short circuit
        ? text.replace(PATTERN, callback)
        : text;
    };
    HANDLERS.set(map, handler);
  }
  return handler;
}

export default function deentify(text: string, map: types.Entities) {
  const handler = getHandler(map);
  return handler(text);
}
