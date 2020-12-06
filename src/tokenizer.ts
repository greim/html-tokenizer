/* eslint-disable no-cond-assign */
import defaultEntities from './default-entities';
import { Entities, Options } from './types';
import * as chunks from './chunks';
import readAttribute from './read-attribute';
import deentify from './deentify';

export type TokenizerOptions = Options;
export type Token = StartToken | OpeningTagToken | AttributeToken | OpeningTagEndToken | TextToken | CommentToken | ClosingTagToken | DoneToken;
export interface StartToken { type: 'start' }
export interface OpeningTagToken { type: 'opening-tag', name: string }
export interface AttributeToken { type: 'attribute', name: string, value: string }
export interface OpeningTagEndToken { type: 'opening-tag-end', name: string, token: '>' | '/>' }
export interface TextToken { type: 'text', text: string }
export interface CommentToken { type: 'comment', text: string }
export interface ClosingTagToken { type: 'closing-tag', name: string }
export interface DoneToken { type: 'done' }

type State = 'inTag' | 'inComment' | 'inText' | 'inScript';

export class Tokenizer {

  private readonly entityMap: Entities;

  static tokenize(html: string, opts?: TokenizerOptions) {
    const tokenizer = new Tokenizer(opts);
    return tokenizer.tokenize(html);
  }

  constructor(opts: TokenizerOptions = {}) {
    this.entityMap = { ...defaultEntities, ...opts.entities };
    Object.freeze(this);
  }

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
          yield { type: 'text', text: deentText };
          currentText = undefined;
        }
        yield tkn;
      }
    }
  }

  private *_tokenize(html: string): IterableIterator<Token> {
    yield { type: 'start' };
    let pos = 0;
    let state: State = 'inText';
    let currentTag = '';
    let next;
    while (pos < html.length) {
      if (state === 'inText') {
        const isBracket = html.charAt(pos) === '<'; // cheap pre-emptive check
        if (isBracket && (next = chunks.getOpeningTag(html, pos))) {
          pos += next.length;
          currentTag = next.match[2];
          yield { type: 'opening-tag', name: currentTag };
          state = 'inTag';
        } else if (isBracket && (next = chunks.getClosingTag(html, pos))) {
          pos += next.length;
          yield { type: 'closing-tag', name: next.match[2] };
        } else if (isBracket && (next = chunks.getCommentOpen(html, pos))) {
          pos += next.length;
          state = 'inComment';
        } else if (next = chunks.getText(html, pos)) {
          pos += next.length;
          yield { type: 'text', text: next.match[1] };
        } else {
          const text = html.substring(pos, pos + 1);
          pos += 1;
          yield { type: 'text', text };
        }
      } else if (state === 'inComment') {
        if (next = chunks.getComment(html, pos)) {
          pos += next.length;
          yield { type: 'comment', text: next.match[2] };
          state = 'inText';
        } else {
          yield { type: 'comment', text: html.substring(pos) };
          break;
        }
      } else if (state === 'inScript') {
        if (next = chunks.getScript(html, pos)) {
          pos += next.length;
          yield { type: 'text', text: next.match[2] };
          yield { type: 'closing-tag', name: 'script' };
          state = 'inText';
        } else {
          yield { type: 'text', text: html.substring(pos) };
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
            yield { type: 'attribute', name, value: deentify(read.value, this.entityMap) };
          } else {
            yield { type: 'attribute', name, value: '' };
          }
        } else if (next = chunks.getTagEnd(html, pos)) {
          pos += next.length;
          const token = next.match[2] as '>' | '/>';
          yield { type: 'opening-tag-end', name: currentTag, token };
          state = currentTag === 'script' ? 'inScript' : 'inText';
        } else {
          state = 'inText';
        }
      } else {
        break;
      }
    }
    yield { type: 'done' };
  }
}
