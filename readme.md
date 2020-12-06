# HTML Tokenizer (and Parser)

HTML tokenizer and parser!

- Small
- Synchronous
- Fault-tolerant
- Zero-dependencies
- Runs in the browser
- Written in TypeScript

A small, fast, iterator-based, fault-tolerant, HTML tokenizer and parser. Works in Node or in browsers. You pass it a string containing markup, and it iterator over things it finds.

```
npm install html-tokenizer
```

## Tokenizer or Parser?

This project contains a tokenizer and a parser, both of which iterate a sequence of things from a piece of markup. What's the difference? The tokenizer enumerates low-level syntax units. The parser enumerates higher-level markup structure. Therefore, you probably want the parser, not the tokenizer, unless you're looking to implement your own parser.

## Can this parse XML?

In some cases, yes. An HTML parser such as this works very hard to make sense out of even the most garbled input, so it can't be a standards-compliant XML parser, since that it won't throw at the first error. This also doesn't support more esoteric features of XML like processing instructions.

## Parser Example

```ts
import { Parser } from 'html-tokenizer';

const html = '<p class="foo">Hello<br/></p>';

for (const token of Parser.parse(html)) {
  switch (token.type) {
    case 'open': {
      console.log(`Opening tag: ${token.name}`);
      console.log('Attributes:', token.attributes);
    }
    case 'text': {
      console.log(`Text node: ${token.text}`);
    }
    case 'close': {
      console.log(`Closing tag: ${token.name}`);
    }
    case 'comment': {
      console.log(`Comment: ${token.text}`);
    }
  }
}
```

## Tokenizer Example

```ts
import { Tokenizer } from 'html-tokenizer';

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
  { type: 'done' },
]);
```

# API

## Parser API

### `Parser.from(opts)`

```ts
// using empty args
import { Parser } from 'html-tokenizer';
const parser = Parser.from({});

// with custom entity support
import { Parser } from 'html-tokenizer';
const entities = { copy: '\u00A9' };
const parser = Parser.from({ entities });

// with exhaustive entity support
import { Parser } from 'html-tokenizer';
import entities from 'html-tokenizer/lib/entities';
const parser = Parser.from({ entities });
```

`entities` is an optional object which maps HTML entities to unicode characters. This provides a way to expand the set of default-supported entities, which only include numeric codes like `&#160;`, plus the most common textual ones such as `&gt;` and `&nbsp;`. Exhaustive entity support should be used with caution in client-size apps, since the entities file is quite large.

### `Parser#parse(html)`

```ts
import Parser from 'html-tokenizer/parser';
for (const parseToken of Parser.parse(html, {})) {
  switch (parseToken.type) {
    case 'open': ...
    case 'text': ...
    // etc
  }
}
```

Accepts a string and returns an iterator of parse-token objects.

- `{ type: 'open', name, attributes, selfClosing }` - Opening tag. `selfClosing` will be true if this tag self-closes.
- `{ type: 'text', text }` - Text.
- `{ type: 'comment', text }` - Comment text.
- `{ type: 'close', name, selfClosing }` - Closing tag. `selfClosing` will be true if this was a self-closing tag.

### `Parser.parse(html, opts)`

This is a static convenience method so you can skip instantiating a parser. An instance is created internally and `opts` is passed to its constructor.

## Tokenizer API

### `Tokenizer.from(opts)`

```ts
// using empty options
import { Tokenizer } from 'html-tokenizer';
const tokenizer = Tokenizer.from({});

// with custom entity support
import { Tokenizer } from 'html-tokenizer';
const entities = { copy: '\u00A9' };
const tokenizer = Tokenizer.from({ entities });

// with exhaustive entity support
import { Tokenizer } from 'html-tokenizer';
import entities from 'html-tokenizer/lib/entities';
const tokenizer = Tokenizer.from({ entities });
```

`entities` is an optional object which maps HTML entities to unicode characters. This provides a way to expand the set of default-supported entities, which only include numeric codes like `&#160;`, plus the most common textual ones such as `&gt;` and `&nbsp;`. Exhaustive entity support should be used with caution in client-size apps, since the entities file is quite large.

### `Tokenizer#tokenize(html, opts)`

```ts
import { Tokenizer } from 'html-tokenizer';
for (const token of Tokenizer.tokenize(html, {})) {
  switch (token.type) {
    case 'opening-tag': ...
    case 'opening-tag-end': ...
    // etc
  }
}
```

Token objects:

- `{ type: 'start' }` - Generated at the beginning.
- `{ type: 'opening-tag', name }` - Beginning of opening tag, like `<foo`.
- `{ type: 'attribute', name, value }` - Only generated between "opening-tag" and "opening-tag-end" events.
- `{ type: 'opening-tag-end', name, token }` - Closing bracket of opening tag. `token` will either be `">"` or `"/>"`.
- `{ type: 'text', text }` - Text.
- `{ type: 'comment', text }` - Comment text.
- `{ type: 'closing-tag', name }` - Closing tag, like `</foo>`.
- `{ type: 'done' }` - Generated at the end.

### `Tokenizer.tokenize(html, opts)`

This is a static convenience method so you can skip instantiating a tokenizer. An instance is created internally and `opts` is passed to its constructor.

## Other Notes

- Does not handle `<![CDATA[]]>` (output as text).
- Does not handle `<!doctype>` (output as text).
- Does not handle `<? processing instructions ?>` (output as text).
- Does not consume or produce Node.js streams.
- Performs best on clean markup.
- Never intentionally throws.
- Tests pass on Node.js 6.x and above; fail on 5.x and below due to syntax issues.
- Performance gets better going from Node.js 6.x => 10.x.

## Changelog

- **4.0.0** - Project is re-written in TypeScript. Constructors on `Parser` and `Tokenizer` are made private, replaced with `.from()` static factories. `Tokenizer` is no longer default-exported from `'html-tokenizer'`, and `Parser` is no longer default-exported from `'html-tokenizer/parser'`. Instead, `Parser` and `Tokenizer` are both named exports from `'html-tokenizer'`. Also, exhaustive entities are now exported from `'html-tokenizer/lib/entities'`.
- **3.0.0** - This is a breaking change due to several things: 1) switching the API from event callbacks to iteration, 2) no longer extending `EventEmitter`, 3) making instances immutable, and 4) updating the JS syntax from circa-2014 to 2018 JavaScript. As of 3.x, tokenizer and parser state is now completely local to the returned iterator instance, which is by definition a throw-away object used once. Parser and tokenizer instances themselves are stateless and can be shared effortlessly across space and time. Also, in order to reduce install footprint, `lodash` is removed as a dependency, since it was only used for a few trivial things.
- **2.0.1** - Retroactive change to the 2.x line to remove `lodash` in order to reduce install footprint, but otherwise maintain full backwards compatibility.
