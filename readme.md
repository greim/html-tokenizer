# HTML Tokenizer and Parser

## About tokenizers and parsers

What's a tokenizer, what's a parser, and what's the difference?

This lib contains an HTML tokenizer which takes HTML input and breaks it into tokens representing opening tags, attributes, etc. It blindly reports those tokens to you, without checking whether the sequence is a well-formed HTML document.

This lib also provides an HTML parser. It behaves much like a tokenizer, but goes farther, ensuring the token sequence is well-formed, tags are balanced, etc.

Why both a tokenizer and a parser? Long story short, use the parser, ignore the tokenizer. Building the tokenizer was a necessary step, since the parser uses it internally.

## This HTML parser is...

- Small
- Synchronous
- Iterator-based
- Fault-tolerant
- Zero-dependencies
- Runs in node or browsers
- Written in TypeScript

```
npm install html-tokenizer
```

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
      break;
    }
    case 'text': {
      console.log(`Text node: ${token.text}`);
      break;
    }
    case 'close': {
      console.log(`Closing tag: ${token.name}`);
      break;
    }
    case 'comment': {
      console.log(`Comment: ${token.text}`);
      break;
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

### `Parser.from(opts)` (static factory)

This is how to create parser instances.

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

### `Parser#parse(html)` (instance method)

This is an instance method to parse HTML.

```ts
import Parser from 'html-tokenizer/parser';
for (const token of Parser.parse(html, {})) {
  switch (token.type) {
    case 'open': ...
    case 'text': ...
    // etc
  }
}
```

Accepts a string and returns an iterator of parse token objects. Every token has a `type` property. Depending on the type, the token will have different properties.

- `token.type === 'open'` Opening tag.
  - `token.name` Tag name.
  - `token.attributes` Attributes key/value object.
  - `token.selfClosing` Boolean. True if it's a self-closing tag like `<br/>`.
- `token.type === 'text'` Text node.
  - `token.text` Text node content.
- `token.type === 'comment'` Comment node.
  - `token.text` Comment node content.
- `token.type === 'close'` Closing tag.
  - `token.name` Tag name.
  - `token.selfClosing` Boolean. True if it's a self-closing tag like `<br/>`.

### `Parser.parse(html, opts)` (static method)

This is a static convenience method so you can skip instantiating a parser. An instance is created internally and `opts` is passed to its constructor.

## Tokenizer API

### `Tokenizer.from(opts)` (static factory)

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

### `Tokenizer#tokenize(html, opts)` (instance method)

This is an instance method to tokenize HTML.

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

It accepts a string and returns an iterator of token objects. Every token has a `type` property. Depending on the type, the token will have different properties.

- `token.type === 'start'` Generated once at the beginning.
- `token.type === 'opening-tag'` Beginning of opening tag, like `<foo`.
  - `token.name` Tag name.
- `token.type === 'attribute'` Only generated between "opening-tag" and "opening-tag-end" events.
  - `token.name` Attribute name.
  - `token.value` Attribute value.
- `token.type === 'opening-tag-end'` Closing bracket of opening tag. `token` will either be `">"` or `"/>"`.
  - `token.name` Tag name.
  - `token.token` Either `/>` or `>`.
- `token.type === 'text'` Text node fragment.
  - `token.text` Text content.
- `token.type === 'comment'` Comment.
  - `token.text` Comment content.
- `token.type === 'closing-tag'` Closing tag, like `</foo>`.
  - `token.name` Tag name.
- `token.type === 'done'` Generated once at the end.

### `Tokenizer.tokenize(html, opts)` (static method)

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
