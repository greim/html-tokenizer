import { Tokenizer } from './tokenizer';
import { Entities } from './types';
import Stack from './stack';
import { isClosedBy, isClosedByParent, isSelfClosing } from './util';

/**
 * Options passed to a parser on instantiation.
 */
export interface ParserOptions {
  entities?: Entities;
}

/**
 * A token emitted during a parsing run.
 */
export type ParseToken
  = OpenParseToken
  | TextParseToken
  | CommentParseToken
  | CloseParseToken;

/**
 * Opening tag.
 */
export interface OpenParseToken {
  type: 'open';
  /** Name of tag. */
  name: string;
  /** Set of attributes. */
  attributes: Attributes;
  /** Whether this tag is self-closing. */
  selfClosing: boolean;
}

/**
 * Text token.
 */
export interface TextParseToken {
  type: 'text';
  /** The text content. */
  text: string;
}

/**
 * Comment.
 */
export interface CommentParseToken {
  type: 'comment';
  /** The comment content. */
  text: string;
}

/**
 * Closing tag.
 */
export interface CloseParseToken {
  type: 'close';
  /** Name of the tag. */
  name: string;
  /** Whether tag was self closing. */
  selfClosing: boolean;
}

/**
 * A set of attributes.
 */
export interface Attributes {
  [attrName: string]: string;
}

interface PendingTag {
  name: string;
  attributes: Attributes;
}

/**
 * An object capable of parsing HTML.
 */
export class Parser {

  private readonly tokenizer: Tokenizer;

  /**
   * Static method to parse HTML without instantiating a Parser instance.
   * @param html HTML string to parse.
   * @param opts Optional parser configuration options.
   */
  static parse(html: string, opts: ParserOptions = {}) {
    const parser = new Parser(opts);
    return parser.parse(html);
  }

  /**
   * Static factory to create a parser.
   * @param opts Parser options.
   */
  static from(opts: ParserOptions) {
    return new Parser(opts);
  }

  private constructor(opts: ParserOptions) {
    this.tokenizer = Tokenizer.from(opts);
    Object.freeze(this);
  }

  /**
   * Parse an HTML string. Returns an iterator, thus allowing parse
   * tokens to be consumed via for/of or other iteration mechanisms.
   * @param html HTML string to parse.
   */
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
