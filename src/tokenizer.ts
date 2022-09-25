/* eslint-disable no-cond-assign */
import DEFAULT_ENTITIES from './default-entities';
import { Entities } from './types';
import * as chunks from './chunks';
import readAttribute from './read-attribute';
import deentify from './deentify';

/**
 * Options passed to a tokenizer on instantiation.
 */
export interface TokenizerOptions {
  entities?: Entities;
}

/**
 * A token emitted during a tokenizing run.
 */
export type Token
  = StartToken
  | OpeningTagToken
  | AttributeToken
  | OpeningTagEndToken
  | TextToken
  | CommentToken
  | ClosingTagToken
  | DoneToken;

/**
 * Base token with position
 */
export interface PositionedToken {
  position: {
    begin: number
    end: number
  }
}

/**
 * Start of tokenizing run.
 */
export interface StartToken extends PositionedToken {
  type: 'start';
}

/**
 * Beginning of opening tag.
 */
export interface OpeningTagToken extends PositionedToken {
  type: 'opening-tag';
  name: string;
}

/**
 * Attribute.
 */
export interface AttributeToken extends PositionedToken {
  type: 'attribute';
  name: string;
  value: string;
}

/**
 * End of opening tag.
 */
export interface OpeningTagEndToken extends PositionedToken {
  type: 'opening-tag-end';
  name: string;
  token: '>' | '/>';
}

/**
 * Text node chunk.
 */
export interface TextToken extends PositionedToken {
  type: 'text';
  text: string;
}

/**
 * Comment.
 */
export interface CommentToken extends PositionedToken {
  type: 'comment';
  text: string;
}

/**
 * Closing tag.
 */
export interface ClosingTagToken extends PositionedToken {
  type: 'closing-tag';
  name: string;
}

/**
 * End of tokenizing run.
 */
export interface DoneToken extends PositionedToken {
  type: 'done';
}

type State
  = 'inTag'
  | 'inComment'
  | 'inText'
  | 'inScript';

/**
 * A low-level tokenizer utility used by the HTML parser.
 */
export class Tokenizer {

  private readonly entityMap: Entities;

  /**
   * Static method to tokenize HTML without instantiating a Tokenizer instance.
   * @param html HTML string to tokenize.
   * @param opts Optional tokenizer configuration options.
   */
  static tokenize(html: string, opts: TokenizerOptions = {}) {
    const tokenizer = new Tokenizer(opts);
    return tokenizer.tokenize(html);
  }

  /**
   * Static factory to create a tokenizer.
   * @param opts Tokenizer options.
   */
  static from(opts: TokenizerOptions) {
    return new Tokenizer(opts);
  }

  private constructor(opts: TokenizerOptions) {
    this.entityMap = { ...DEFAULT_ENTITIES, ...opts.entities };
    Object.freeze(this);
  }

  /**
   * Tokenize an HTML string. Returns an iterator, thus allowing
   * tokens to be consumed via for/of or other iteration mechanisms.
   * @param html HTML string to tokenize.
   */
  *tokenize(html: string): IterableIterator<Token> {
    let currentText;
    for (const tkn of this._tokenize(html)) {
      if (tkn.type === 'text') {
        const text = tkn.text;
        if (currentText === undefined) {
          currentText = text;
        } else {
          currentText += text;
        }
      } else {
        if (currentText) {
          const deentText = deentify(currentText, this.entityMap);
          yield { position: tkn.position, type: 'text', text: deentText };
          currentText = undefined;
        }
        yield tkn;
      }
    }
  }

  private *_tokenize(html: string): IterableIterator<Token> {
    let pos = 0;
    let positionBegin = pos;
    let state: State = 'inText';
    let currentTag = '';
    let next;
    yield { position: { begin: positionBegin, end: pos }, type: 'start' };
    while (pos < html.length) {
      positionBegin = pos;
      if (state === 'inText') {
        const isBracket = html.charAt(pos) === '<'; // cheap pre-emptive check
        if (isBracket && (next = chunks.getOpeningTag(html, pos))) {
          pos += next.length;
          currentTag = next.match[2];
          yield { position: { begin: positionBegin, end: pos }, type: 'opening-tag', name: currentTag };
          state = 'inTag';
        } else if (isBracket && (next = chunks.getClosingTag(html, pos))) {
          pos += next.length;
          yield { position: { begin: positionBegin, end: pos }, type: 'closing-tag', name: next.match[2] };
        } else if (isBracket && (next = chunks.getCommentOpen(html, pos))) {
          pos += next.length;
          state = 'inComment';
        } else if (next = chunks.getText(html, pos)) {
          pos += next.length;
          yield { position: { begin: positionBegin, end: pos }, type: 'text', text: next.match[1] };
        } else {
          const text = html.substring(pos, pos + 1);
          pos += 1;
          yield { position: { begin: positionBegin, end: pos }, type: 'text', text };
        }
      } else if (state === 'inComment') {
        if (next = chunks.getComment(html, pos)) {
          pos += next.length;
          yield { position: { begin: positionBegin, end: pos }, type: 'comment', text: next.match[2] };
          state = 'inText';
        } else {
          yield { position: { begin: positionBegin, end: pos }, type: 'comment', text: html.substring(pos) };
          break;
        }
      } else if (state === 'inScript') {
        if (next = chunks.getScript(html, pos)) {
          pos += next.length;
          yield { position: { begin: positionBegin, end: pos }, type: 'text', text: next.match[2] };
          yield { position: { begin: positionBegin, end: pos }, type: 'closing-tag', name: 'script' };
          state = 'inText';
        } else {
          yield { position: { begin: positionBegin, end: pos }, type: 'text', text: html.substring(pos) };
          break;
        }
      } else if (state === 'inTag') {
        if (next = chunks.getAttributeName(html, pos)) {
          pos += next.length;
          const name = next.match[2];
          const hasVal = next.match[4];
          if (hasVal) {
            const read = readAttribute(html, pos);
            pos += read.length;
            yield { position: { begin: positionBegin, end: pos }, type: 'attribute', name, value: deentify(read.value, this.entityMap) };
          } else {
            yield { position: { begin: positionBegin, end: pos }, type: 'attribute', name, value: '' };
          }
        } else if (next = chunks.getTagEnd(html, pos)) {
          pos += next.length;
          const token = next.match[2] as '>' | '/>';
          yield { position: { begin: positionBegin, end: pos }, type: 'opening-tag-end', name: currentTag, token };
          state = currentTag === 'script' ? 'inScript' : 'inText';
        } else {
          state = 'inText';
        }
      } else {
        break;
      }
    }
    yield { position: { begin: positionBegin, end: pos }, type: 'done' };
  }
}
