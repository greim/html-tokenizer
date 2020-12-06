# HTML Tokenizer (and Parser)

HTML tokenizer and parser!

- Small
- Synchronous
- Fault-tolerant
- Zero-dependencies
- Runs great in the browser
- Written in TypeScript

A small, blazing-fast, iterator-based, fault-tolerant, HTML tokenizer and parser. Works in Node or in browsers. You pass it a string containing markup, and it returns an iterator of things it finds.

This lib is written in TypeScript, but ships plain-old ES6 JavaScript along with TS definition files. It can therefore be used normally like any other JS dependency. If used in a TypeScript project, nothing changes except you get the added benefit of type safety and IDE integration.

```
npm install html-tokenizer
```

## Tokenizer or Parser?

This project contains a tokenizer and a parser, both of which iterate a sequence of things from a piece of markup. What's the difference? A tokenizer enumerates low-level syntax units. A parser (taking those units as input) enumerates high-level structure of the markup. Therefore, you likely want the parser, not the tokenizer, unless you're looking to implement your own parser.

## Can this parse XML?

In some cases, yes. An HTML parser such as this works very hard to make sense out of even the most garbled input, so it can't be a standards-compliant XML parser, since that it won't throw at the first error. This also doesn't support more esoteric features of XML like processing instructions.

## Tokenizer Example

```js
import Tokenizer from 'html-tokenizer';

const html = '<p class="foo">Hello<br/></p>';

const tokens = [...Tokenizer.tokenize(html)];

assert.deepEqual(tokens, [
  { type: 'start' },
  { type: 'opening-tag', name: 'p' },
  { type: 'attribute', name: 'class', value: 'foo' },
  { type: 'opening-tag-end', name: 'p', token: '>' },
  { type: 'text', text: 'Hello' },
  { type: 'opening-tag', name: 'br' },
  { type: 'opening-tag-end', name: 'br', token: '/>' },
  { type: 'closing-tag', name: 'p' },
  { type: 'done' }
]);
```

## Parser Example

```js
import Parser from 'html-tokenizer/parser';

const html = '<p class="foo">Hello<br/></p>';

const parseTokens = [...Parser.parse(html)];

assert.deepEqual(parseTokens, [
  { type: 'open', name: 'p', attributes: { class: 'foo' }, selfClosing: false },
  { type: 'text', text: 'Hello' },
  { type: 'open', name: 'br', attributes: {}, selfClosing: true },
  { type: 'close', name: 'br', selfClosing: true },
  { type: 'close', name: 'p', selfClosing: false },
]);
```

# API

## Tokenizer API

### `new Tokenizer(opts)`

```js
// using no-arg constructor
import Tokenizer from 'html-tokenizer';
const tokenizer = new Tokenizer();

// with custom entity support
import Tokenizer from 'html-tokenizer';
const entities = { copy: '\u00A9' };
const tokenizer = new Tokenizer({ entities });

// with exhaustive entity support
import Tokenizer from 'html-tokenizer';
import entities from 'html-tokenizer/entities';
const tokenizer = new Tokenizer({ entities });
```

`entities` is an optional object which maps HTML entities to unicode characters. This provides a way to expand the set of default-supported entities, which only include numeric codes like `&#160;`, plus the most common textual ones such as `&gt;` and `&nbsp;`. Exhaustive entity support should be used with caution in client-size apps, since the entities file is quite large.

### `Tokenizer#tokenize(html)`

```js
import Tokenizer from 'html-tokenizer';
const tokenizer = new Tokenizer();
for (const token of tokenizer.tokenize(html)) {
  switch (token.type) {
    case 'opening-tag': ...
    case 'opening-tag-end': ...
    // etc
  }
}
```

Token objects:

 * `{ type: 'start' }` - Generated at the beginning.
 * `{ type: 'opening-tag', name }` - Beginning of opening tag, like `<foo`.
 * `{ type: 'attribute', name, value }` - Only generated between "opening-tag" and "opening-tag-end" events.
 * `{ type: 'opening-tag-end', name, token }` - Closing bracket of opening tag. `token` will either be `">"` or `"/>"`.
 * `{ type: 'text', text }` - Text.
 * `{ type: 'comment', text }` - Comment text.
 * `{ type: 'closing-tag', name }` - Closing tag, like `</foo>`.
 * `{ type: 'done' }` - Generated at the end.

### `Tokenizer.tokenize(html, opts)`

This is a static convenience method so you can skip instantiating a tokenizer. An instance is created internally and `opts` is passed to its constructor.

## Parser API

### `new Parser(opts)`

```js
// using no-arg constructor
import Parser from 'html-tokenizer/parser';
const parser = new Parser();

// with custom entity support
import Parser from 'html-tokenizer/parser';
const entities = { copy: '\u00A9' };
const parser = new Parser({ entities });

// with exhaustive entity support
import Parser from 'html-tokenizer/parser';
import entities from 'html-tokenizer/entities';
const parser = new Parser({ entities });
```

Constructor options are identical to the `Tokenizer` API. See note on `entities` above.

### `Parser#parse(html)`

```js
import Parser from 'html-tokenizer/parser';
const parser = new Parser();
for (const parseToken of parser.parse(html)) {
  switch (parseToken.type) {
    case 'open': ...
    case 'text': ...
    // etc
  }
}
```

Accepts a string and returns an iterator of parse-token objects.

 * `{ type: 'open', name, attributes, selfClosing }` - Opening tag. `selfClosing` will be true if this tag self-closes.
 * `{ type: 'text', text }` - Text.
 * `{ type: 'comment', text }` - Comment text.
 * `{ type: 'close', name, selfClosing }` - Closing tag. `selfClosing` will be true if this was a self-closing tag.

### `Parser.parse(html, opts)`

This is a static convenience method so you can skip instantiating a parser. An instance is created internally and `opts` is passed to its constructor.

## Other Notes

 * Does not handle `<![CDATA[]]>` (output as text).
 * Does not handle `<!doctype>` (output as text).
 * Does not handle `<? processing instructions ?>` (output as text).
 * Does not consume or produce Node.js streams.
 * Performs best on clean markup.
 * Never intentionally throws.
 * Tests pass on Node.js 6.x and above; fail on 5.x and below due to syntax issues.
 * Performance gets better going from Node.js 6.x => 10.x.

## Changelog

 * **3.0.0** - This is a breaking change due to several things: 1) switching the API from event callbacks to iteration, 2) no longer extending `EventEmitter`, 3) making instances immutable, and 4) updating the JS syntax from circa-2014 to 2018 JavaScript. As of 3.x, tokenizer and parser state is now completely local to the returned iterator instance, which is by definition a throw-away object used once. Parser and tokenizer instances themselves are stateless and can be shared effortlessly across space and time. Also, in order to reduce install footprint, `lodash` is removed as a dependency, since it was only used for a few trivial things.
 * **2.0.1** - Retroactive change to the 2.x line to remove `lodash` in order to reduce install footprint, but otherwise maintain full backwards compatibility.
