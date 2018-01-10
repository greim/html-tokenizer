# HTML Tokenizer

A small, super-fast, event-driven, fault-tolerant, html tag-soup tokenizer that works in node but which is mainly intended as a lightweight client-side parser for small HTML snippets.
You pass it a string which is supposed to contain HTML, and it emits a stream of events telling you what things it finds.

```
npm install html-tokenizer
```

## Tokenizer

A tokenizer emits a stream of events such as "here's an attribute" or "here's an opening tag," *however* these won't necessarily reflect the structure of well-formed HTML document.
For example `<foo <foo` will produce two `opening-tag` events in a row.
If that bothers you, then what you probably want is a parser, not a tokenizer, so keep scrolling down.

```js
var Tokenizer = require('html-tokenizer')
var tokenizer = new Tokenizer()
tokenizer.on('opening-tag', function(name) { ... })
tokenizer.on('closing-tag', function(name) { ... })
...etc...
tokenizer.tokenize('<p>Hello</p>')
```

## Parser

A basic HTML parser is included in the project which you can require separately.
Unlike the tokenizer, it attempts to find structure in the document.
Note, the corner-case parsing rules for HTML5 are quite complicated and this may not cover them all.

```js
var Parser = require('html-tokenizer/parser')
var parser = new Parser()
parser.on('open', function(name, attributes) { ... })
parser.on('close', function(name) { ... })
...etc...
parser.parse('<p>Hello</p>')
```

## Tokenizer API

### `new Tokenizer(opts)`

```js
var Tokenizer = require('html-tokenizer')
var tokenizer = new Tokenizer({
  entities: { copy: '\u00A9' }
})
tokenizer.parse('<p>copyright &copy; 1993</p>')
```

The only currently supported constructor option is an `entities` object that maps HTML entities to their unicode counterparts.
This is optional and provides a way to expand the set of entities supported by default.
By default only numeric codes are supported, plus a small subset of textual ones found in `default-entity-map.json`.

### `on(event, handler)`

```js
tokenizer.on('opening-tag', function(name) {
  // name === 'foo'
})
tokenizer.tokenize('<foo')
```

A tokenizer instance is an `EventEmitter`.
Events are emitted during the `tokenize()` operation.
Supported events:

 * **start**           - *()*            - Emitted once per tokenize run.
 * **opening-tag**     - *(name)*        - Beginning of opening tag, like `<foo`.
 * **attribute**       - *(name, value)* - Only fires between "opening-tag" and "opening-tag-end" events.
 * **opening-tag-end** - *(name, token)* - Closing bracket of opening tag. `token` will either be `">"` or `"/>"`.
 * **text**            - *(text)*        - Text snippet.
 * **comment**         - *(text)*        - Comment text.
 * **closing-tag**     - *(name)*        - Closing tag, like `</foo>`.
 * **done**            - *()*            - All done.

### `tokenize(html)`

```js
tokenizer.tokenize('<span>hi</span>')
```

`html` is a string.
Can be called arbitrarily many times per instance.
`start` and `done` are emitted once per run.

## Parser API

### `new Parser(opts)`

```js
var Parser = require('html-tokenizer/parser')
var parser = new Parser({
  entities: { copy: '\u00A9', ... } // &copy; ...
})
```

The only currently supported constructor option is an `entities` object.
It's passed directly to the underlying tokenizer (see above).

### `parser.on(event, handler)`

```js
parser.on('open', function(name, attrs) {
  // name === 'div'
  // attrs === { class: 'success' }
})
parser.parse('<div class="success">')
```

A parser instance is an `EventEmitter`.
Events are emitted during the `parse()` operation.
Supported events:

 * **start**   - *()*                              - Emitted once at beginning.
 * **open**    - *(name, attributes, selfClosing)* - Opening tag. `selfClosing` will be true if this tag self-closes.
 * **text**    - *(text)*                          - Text snippet.
 * **comment** - *(text)*                          - Comment text snippet.
 * **close**   - *(name, selfClosing)*             - Closing tag. `selfClosing` will be true if this was a self-closing tag.
 * **done**    - *()*                              - All done.

### `parser.parse(html)`

```js
parser.parse('<p>hello</p>')
```

`html` is a string.
Can be called arbitrarily many times per instance.
`start` and `done` are emitted once per run.

## Exhaustive Entity Support

`Tokenizer()` and `Parser()` take an `options.entities` object in order to support more HTML character entities.
Support for a much wider set can be easily added by requiring the (large-ish) `entity-map.json` file.

```js
var Parser = require('html-tokenizer/parser')
var entityMap = require('html-tokenizer/entity-map')
new Parser({ entities: entityMap })
```

## Other Notes

 * Does not handle `<![CDATA[]]>` (passes through as text)
 * Does not handle `<!doctype>` (passes through as text)
 * Does not handle `<? processing instructions ?>` (passes through as text)
 * Does not consume or produce Node.js streams
 * Performs best on clean markup
 * Never intentionally throws
 * All methods and events are synchronous
