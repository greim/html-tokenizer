# HTML Tokenizer

A small, fast, iterator-driven, fault-tolerant, html or xml tokenizer that works in node but which is mainly intended as a lightweight client-side parser for small HTML snippets.
You input a string which is supposed to contain HTML, and it outputs descriptions of what things it finds.

```
npm install html-tokenizer
```

## Tokenizer

A tokenizer tells you things such as "here's an attribute" or "here's an opening tag," however these may or may not reflect well-formed HTML, depending on the input document.
For example the input `"<foo <foo"` will output two `opening-tag` items in a row.
If that bothers you, then what you probably want is a parser, not a tokenizer, so keep scrolling down.

```js
const Tokenizer = require('html-tokenizer');
const itr = Tokenizer.tokenize('<p>Hello</p>');
for (const token of itr) {
  const { type, ...data } = token;
  if (type === 'opening-tag') {
    console.log(`found a <${data.name}> tag`);
  }
}
```

## Parser

An HTML parser is included in the project which you can require separately.
Unlike the tokenizer, it seeks out structure in the document.
Malformed input will generally be output as text in these cases, rather than the parser throwing an error.
If that bothers you, you probably want to use a different lib.

```js
const Parser = require('html-tokenizer/parser')
const itr = Parser.parse('<p>Hello</p>');
for (const event of itr) {
  const { type, ...data } = event;
  if (type === 'open') {
    console.log(`found a <${data.name}> tag`);
  }
}
```

# API

## Tokenizer API

### `new Tokenizer(opts)`

```js
const Tokenizer = require('html-tokenizer');
const tokenizer = new Tokenizer({
  entities: { copy: '\u00A9' }
});
```

The only currently supported constructor option is an `entities` object which maps HTML entities to unicode characters.
This is optional and provides a way to expand the set of entities supported by default.
By default only numeric codes are supported, plus a small subset of textual ones. This small subset is defined in `default-entity-map.json`.

### `Tokenizer#tokenize(html)`

```js
const iterator = tokenizer.tokenize(html)
```

Returns an iterator.
`html` is a string.
Can be called arbitrarily many times per instance.
Items generated are objects with a `type` property.
Other data will be present on the item depending on the type:

 * `{ type: 'start' }`                        - Generated at the beginning.
 * `{ type: 'opening-tag', name }`            - Beginning of opening tag, like `<foo`.
 * `{ type: 'attribute', name, value }`       - Only generated between "opening-tag" and "opening-tag-end" events.
 * `{ type: 'opening-tag-end', name, token }` - Closing bracket of opening tag. `token` will either be `">"` or `"/>"`.
 * `{ type: 'text', text }`                   - Text.
 * `{ type: 'comment', text }`                - Comment text.
 * `{ type: 'closing-tag', name }`            - Closing tag, like `</foo>`.
 * `{ type: 'done' }`                         - Generated at the end.

### `Tokenizer.tokenize(html, opts)`

```js
const iterator = Tokenizer.tokenize(html, opts);
```

Static convenience method does the same thing as above, without needing to instantiate a tokenizer.

## Parser API

### `new Parser(opts)`

```js
const Parser = require('html-tokenizer/parser');
const parser = new Parser({
  entities: { copy: '\u00A9', ... }
});
```

The only currently supported constructor option is an `entities` object.
It's passed directly to the underlying tokenizer (see above).

### `Parser#parse(html)`

```js
const iterator = parser.parse(html);
```

Returns an iterator.
`html` is a string.
Can be called arbitrarily many times per instance.
Items generated are objects with a `type` property.
Other data will be present on the item depending on the type:

 * `{ type: 'start' }`                               - Generated at beginning.
 * `{ type: 'open', name, attributes, selfClosing }` - Opening tag. `selfClosing` will be true if this tag self-closes.
 * `{ type: 'text', text }`                          - Text.
 * `{ type: 'comment', text }`                       - Comment text.
 * `{ type: 'close', name, selfClosing }`            - Closing tag. `selfClosing` will be true if this was a self-closing tag.
 * `{ type: 'done' }`                                - Generated at end.

### `Parser.parse(html, opts)`

```js
const iterator = Parser.parse(html, opts);
```

Static convenience method does the same as above, avoiding need to instantiate a parser.

## Exhaustive Entity Support

`Tokenizer()` and `Parser()` take an `options.entities` object in order to optionally support a broad set of HTML textual character entities, rather than the small set of default ones.
Exhaustive support can be added by requiring the (large-ish) `entity-map.json` file.
Note that numeric entities such as `&#160;` are supported by default; the above only applies for textual ones such as `&deg;`.

```js
const Parser = require('html-tokenizer/parser');
const entities = require('html-tokenizer/entity-map');
const parser = new Parser({ entities });
```

## Other Notes

 * Does not handle `<![CDATA[]]>` (output as text).
 * Does not handle `<!doctype>` (output as text).
 * Does not handle `<? processing instructions ?>` (output as text).
 * Does not consume or produce Node.js streams.
 * Performs best on clean markup.
 * Never intentionally throws.
 * Tests pass on Node.js 6.x and above; fail on 5.x and below due to syntax issues.
 * Performance gets better and better going from Node.js 6.x => 10.x.

## Changelog

 * **3.0.0** - This is a breaking change due to several things: 1) switching the API from event callbacks to iteration, 2) no longer extending `EventEmitter`, 3) making instances immutable, and 4) updating the JS syntax from circa-2014 to 2018 JavaScript. As of 3.x, tokenizer and parser state is now completely local to the returned iterator instance, which is by definition a throw-away object used once. Parser and tokenizer instances themselves are stateless and can be shared effortlessly across space and time. Also, in order to reduce install footprint, `lodash` is removed as a dependency, since it was only used for a few trivial things.
 * **2.0.1** - Retroactive change to the 2.x line to remove `lodash` in order to reduce install footprint, but otherwise maintain full backwards compatibility.
