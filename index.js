/*
 * Copyright (c) 2015 by Greg Reimer <gregreimer@gmail.com>
 * MIT License. See mit-license.txt for more info.
 */

/* eslint-disable no-cond-assign */

'use strict';

const defaultEntityMap = require('./default-entity-map');
const types = require('./types');

// -----------------------------------------------

class Tokenizer {

  static tokenize(html, opts) {
    const tokenizer = new Tokenizer(opts);
    return tokenizer.tokenize(html);
  }

  constructor(opts = {}) {
    this.entityMap = Object.assign({}, defaultEntityMap, opts.entities);
    Object.freeze(this);
  }

  entities(map) {
    Object.assign(this.entityMap, map);
  }

  *tokenize(html) {
    let currentText;
    for (const tkn of this._tokenize(html)) {
      if (tkn.type === types.TEXT) {
        const text = tkn.text;
        if (currentText === undefined) {
          currentText = text;
        } else {
          currentText += text;
        }
      } else {
        if (currentText) {
          const deentText = deentityify(currentText, this.entityMap);
          yield { type: types.TEXT, text: deentText };
          currentText = undefined;
        }
        yield tkn;
      }
    }
  }

  *_tokenize(html) {
    yield { type: types.START };
    let pos = 0;
    let state = states.inText;
    let currentTag;
    let next;
    while (pos < html.length) {
      if (state === states.inText) {
        const isBracket = html.charAt(pos) === '<'; // cheap pre-emptive check
        if (isBracket && (next = chunk.getOpeningTag(html, pos))) {
          pos += next.length;
          currentTag = next.match[2];
          yield { type: types.OPENING_TAG, name: currentTag };
          state = states.inTag;
        } else if (isBracket && (next = chunk.getClosingTag(html, pos))) {
          pos += next.length;
          yield { type: types.CLOSING_TAG, name: next.match[2] };
        } else if (isBracket && (next = chunk.getCommentOpen(html, pos))) {
          pos += next.length;
          state = states.inComment;
        } else if (next = chunk.getText(html, pos)) {
          pos += next.length;
          yield { type: types.TEXT, text: next.match[1] };
        } else {
          const text = html.substring(pos, pos + 1);
          pos += 1;
          yield { type: types.TEXT, text };
        }
      } else if (state === states.inComment) {
        if (next = chunk.getComment(html, pos)) {
          pos += next.length;
          yield { type: types.COMMENT, text: next.match[2] };
          state = states.inText;
        } else {
          yield { type: types.COMMENT, text: html.substring(pos) };
          break;
        }
      } else if (state === states.inScript) {
        if (next = chunk.getScript(html, pos)) {
          pos += next.length;
          yield { type: types.TEXT, text: next.match[2] };
          yield { type: types.CLOSING_TAG, name: 'script' };
          state = states.inText;
        } else {
          yield { type: types.TEXT, text: html.substring(pos) };
          break;
        }
      } else if (state === states.inTag) {
        if (next = chunk.getAttributeName(html, pos)) {
          pos += next.length;
          const name = next.match[2];
          const hasVal = next.match[4];
          if (hasVal) {
            const read = readAttribute(html, pos);
            pos += read.length;
            yield { type: types.ATTRIBUTE, name, value: deentityify(read.value, this.entityMap) };
          } else {
            yield { type: types.ATTRIBUTE, name, value: '' };
          }
        } else if (next = chunk.getTagEnd(html, pos)) {
          pos += next.length;
          const token = next.match[2];
          yield { type: types.OPENING_TAG_END, name: currentTag, token };
          state = currentTag === 'script' ? states.inScript : states.inText;
        } else {
          state = states.inText;
        }
      } else {
        break;
      }
    }
    yield { type: types.DONE };
  }
}

// -----------------------------------------------

const states = {
  inTag: Symbol(),
  inComment: Symbol(),
  inText: Symbol(),
  inScript: Symbol(),
};

// -----------------------------------------------

const chunk = ((chnk) => {
  [
    { name: 'getOpeningTag', regex: /(<(([a-z0-9-]+:)?[a-z0-9-]+))/ig },
    { name: 'getText', regex: /([^<]+)/g },
    { name: 'getClosingTag', regex: /(<\/(([a-z0-9-]+:)?[a-z0-9-]+)>)/ig },
    { name: 'getCommentOpen', regex: /(<!--)/g },
    { name: 'getComment', regex: /(([\s\S]*?)-->)/g },
    { name: 'getScript', regex: /(([\s\S]*?)<\/script>)/g },
    { name: 'getTagEnd', regex: /(\s*(\/?>))/g },
    { name: 'getAttributeName', regex: /(\s+(([a-z0-9\-_]+:)?[a-z0-9\-_]+)(\s*=\s*)?)/ig },
  ].forEach(({ name, regex }) => {
    chnk[name] = (str, pos) => {
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
  });
  return chnk;
})({});

// -----------------------------------------------

const readAttribute = (() => {
  const patt = /(\s*([^>\s]*))/g;
  const quotes = new Set('"\'');
  return (str, pos) => {
    const quote = str.charAt(pos);
    const pos1 = pos + 1;
    if (quotes.has(quote)) {
      const nextQuote = str.indexOf(quote, pos1);
      if (nextQuote === -1) {
        return { length: str.length - pos, value: str.substring(pos1) };
      } else {
        return { length: (nextQuote - pos) + 1, value: str.substring(pos1, nextQuote) };
      }
    } else {
      patt.lastIndex = pos;
      const match = patt.exec(str);
      return { length: match[1].length, value: match[2] };
    }
  };
})();

// -----------------------------------------------

const deentityify = (() => {
  const patt = /&(#?)([a-z0-9]+);/ig;
  const handlers = new WeakMap();
  function getHandler(map) {
    let handler = handlers.get(map);
    if (!handler) {
      const callback = function(ent, isNum, content) {
        if (isNum) {
          const num = content.charAt(0) === 'x'
            ? parseInt('0' + content, 16)
            : parseInt(content, 10);
          return String.fromCharCode(num);
        } else {
          return map[content] || ent;
        }
      };
      handler = text => {
        return text.indexOf('&') > -1 // attempt short circuit
          ? text.replace(patt, callback)
          : text;
      };
      handlers.set(map, handler);
    }
    return handler;
  }

  return (text, map) => {
    const handler = getHandler(map);
    return handler(text);
  };
})();

// -----------------------------------------------

module.exports = Tokenizer;
