/*
 * Copyright (c) 2015 by Greg Reimer <gregreimer@gmail.com>
 * MIT License. See mit-license.txt for more info.
 */

'use strict';

const Tokenizer = require('./index');
const types = require('./types');

class Parser {

  static parse(html, opts) {
    const parser = new Parser(opts);
    return parser.parse(html);
  }

  constructor(opts = {}) {
    this.tokenizer = new Tokenizer(opts);
    Object.freeze(this);
  }

  *parse(html) {
    const tkzr = this.tokenizer;
    const stack = makeStack();
    let pendingTag;

    for (const tkn of tkzr.tokenize(html)) {
      const { type, name, token, value } = tkn;
      if (type === types.OPENING_TAG) {
        pendingTag = { name, attributes: {} };
      } else if (type === types.CLOSING_TAG) {
        const current = stack.peek();
        const parent = stack.peek(1);
        if (current) {
          if (current.name === name) {
            stack.pop();
            yield { type: types.CLOSE, name: current.name, selfClosing: false };
          } else {
            if (parent && parent.name === name && isClosedByParent(current.name)) {
              stack.pop();
              yield { type: types.CLOSE, name: current.name, selfClosing: false };
              stack.pop();
              yield { type: types.CLOSE, name: parent.name, selfClosing: false };
            }
          }
        }
      } else if (type === types.OPENING_TAG_END) {
        const mightBeClosed = stack.peek();
        const isSelfClose = token === '/>' || isSelfClosing(name);
        if (mightBeClosed && isClosedBy(mightBeClosed.name, pendingTag.name)) {
          stack.pop();
          yield { type: types.CLOSE, name: mightBeClosed.name, selfClosing: false };
        }
        yield { type: types.OPEN, name: pendingTag.name, attributes: pendingTag.attributes, selfClosing: isSelfClose };
        if (isSelfClose) {
          yield { type: types.CLOSE, name: pendingTag.name, selfClosing: true };
        } else {
          stack.push(pendingTag);
        }
      } else if (type === types.TEXT) {
        // yield { type: 'text', text };
        yield tkn;
      } else if (type === types.COMMENT) {
        // yield { type: 'comment', text };
        yield tkn;
      } else if (type === types.ATTRIBUTE) {
        pendingTag.attributes[name] = value;
      } else if (type === types.START) {
        yield { type };
      }
    }
    while (stack.length > 0) {
      const next = stack.pop();
      yield { type: types.CLOSE, name: next.name, selfClosing: false };
    }
    yield { type: types.DONE };
  }
}

const makeStack = (() => {
  function peek(n = 0) {
    return this[this.length - (n + 1)];
  }
  return () => {
    const stack = [];
    stack.peek = peek;
    return stack;
  };
})();

const isSelfClosing = (() => {
  const table = makeLookup('area,base,br,col,command,embed,hr,img,input,keygen,link,meta,param,source,track,wbr');
  return (closee) => {
    return table.has(closee);
  };
})();

const isClosedBy = (() => {
  const empty = new Set();
  const table = Object.freeze({
    p: makeLookup('address,article,aside,blockquote,div,dl,fieldset,footer,form,h1,h2,h3,h4,h5,h6,header,hgroup,hr,main,nav,ol,p,pre,section,table,ul'),
    li: makeLookup('li'),
    dt: makeLookup('dt,dd'),
    dd: makeLookup('dt,dd'),
    rb: makeLookup('rb,rt,rtc,rp'),
    rt: makeLookup('rb,rt,rtc,rp'),
    rtc: makeLookup('rb,rtc,rp'),
    rp: makeLookup('rb,rt,rtc,rp'),
    optgroup: makeLookup('optgroup'),
    option: makeLookup('option,optgroup'),
    thead: makeLookup('tbody,tfoot'),
    tbody: makeLookup('tbody,tfoot'),
    tfoot: makeLookup('tbody'),
    tr: makeLookup('tr'),
    td: makeLookup('td,th'),
    th: makeLookup('td,th'),
  });
  return (closee, closer) => {
    const lookup = table[closee] || empty;
    return lookup.has(closer);
  };
})();

const isClosedByParent = (() => {
  const table = makeLookup('p,li,dd,rb,rt,rtc,rp,optgroup,option,tbody,tfoot,tr,td,th');
  return (closee) => {
    return table.has(closee);
  };
})();

function makeLookup(str) {
  return new Set(str.split(','));
}

module.exports = Parser;
