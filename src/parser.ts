import { Tokenizer } from './tokenizer';
import { Options } from './types';
import Stack from './stack';
import { isClosedBy, isClosedByParent, isSelfClosing } from './util';

export type ParserOptions = Options;
export type ParseToken = OpenParseToken | TextParseToken | CommentParseToken | CloseParseToken;
export interface OpenParseToken { type: 'open'; name: string; attributes: Attributes; selfClosing: boolean; }
export interface TextParseToken { type: 'text'; text: string; }
export interface CommentParseToken { type: 'comment'; text: string; }
export interface CloseParseToken { type: 'close'; name: string; selfClosing: boolean; }

export interface Attributes {
  [attrName: string]: string;
}

interface PendingTag {
  name: string;
  attributes: Attributes;
}

export class Parser {

  private readonly tokenizer: Tokenizer;

  static parse(html: string, opts: ParserOptions = {}) {
    const parser = new Parser(opts);
    return parser.parse(html);
  }

  constructor(opts: ParserOptions = {}) {
    this.tokenizer = new Tokenizer(opts);
    Object.freeze(this);
  }

  *parse(html: string): IterableIterator<ParseToken> {
    const tkzr = this.tokenizer;
    const stack = new Stack<PendingTag>();
    let pendingTag: PendingTag | undefined = undefined;

    for (const tkn of tkzr.tokenize(html)) {
      if (tkn.type === 'opening-tag') {
        pendingTag = { name: tkn.name, attributes: {} };
      } else if (tkn.type === 'closing-tag') {
        const current = stack.peek();
        const parent = stack.peek(1);
        if (current) {
          if (current.name === tkn.name) {
            stack.pop();
            yield { type: 'close', name: current.name, selfClosing: false };
          } else {
            if (parent && parent.name === tkn.name && isClosedByParent(current.name)) {
              stack.pop();
              yield { type: 'close', name: current.name, selfClosing: false };
              stack.pop();
              yield { type: 'close', name: parent.name, selfClosing: false };
            }
          }
        }
      } else if (tkn.type === 'opening-tag-end') {
        if (pendingTag) {
          const mightBeClosed = stack.peek();
          const isSelfClose = tkn.token === '/>' || isSelfClosing(tkn.name);
          if (mightBeClosed && isClosedBy(mightBeClosed.name, pendingTag.name)) {
            stack.pop();
            yield { type: 'close', name: mightBeClosed.name, selfClosing: false };
          }
          yield { type: 'open', name: pendingTag.name, attributes: pendingTag.attributes, selfClosing: isSelfClose };
          if (isSelfClose) {
            yield { type: 'close', name: pendingTag.name, selfClosing: true };
          } else {
            stack.push(pendingTag);
          }
        } else {
          yield { type: 'text', text: tkn.token };
        }
      } else if (tkn.type === 'text') {
        yield tkn;
      } else if (tkn.type === 'comment') {
        yield tkn;
      } else if (tkn.type === 'attribute') {
        if (pendingTag) {
          pendingTag.attributes[tkn.name] = tkn.value;
        }
      }
    }
    for (const next of stack.drain()) {
      yield { type: 'close', name: next.name, selfClosing: false };
    }
  }
}
