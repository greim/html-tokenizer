# HTML Tokenizer

A small, super-fast, event-driven, fault-tolerant, html tag-soup tokenizer that works in node or browsers via browserify.

You pass it a string which is supposed to contain HTML, and it emits a stream of events telling you what things it finds.

```
npm install html-tokenizer
```

## Tokenizer Example

```js
var Tokenizer = require('html-tokenizer')
var tokenizer = new Tokenizer({entities:{copy:'\u00A9'}})
tokenizer.on('opening-tag', function(name) { ... })
tokenizer.on('closing-tag', function(name) { ... })
...etc...
tokenizer.tokenize('<p>Copyright &copy; 1998</p>')
tokenizer.tokenize('<foo></bar>')
```

## Parser Example

A basic HTML parser is included in the project which you can require separately.
Instead of just telling you what things it finds, its reveals the tag structure of the document.
The tokenizer makes no such guarantees.

```js
var Parser = require('html-tokenizer/parser')
var parser = new Parser({entities:{copy:'\u00A9'}})
parser.on('open', function(name, attributes) { ... })
parser.on('close', function(name) { ... })
...etc...
parser.parse('<p>Copyright &copy; 1998</p>')
parser.parse('<foo></bar>')
```

## Tokenizer API

Name | Description
---- | -----------
var Tokenizer = require('html-tokenizer') | Module exports a constructor.
new Tokenizer(opts) | Constructor takes options (optional).
opts.entities | Constructor option. Entity => charcode map, e.g. `{copy:'\u00A9'}`. Merged over the defaults. By default only numeric codes are supported, plus a small subset of textual ones.
Tokenizer.defaultEntityMap | Default set of entities.
tokenizer.on(event, fn) | Events are emitted synchronously during `tokenize()`.
tokenizer.tokenize(html) | Can be called arbitrarily many times per instance.
tokenizer.cancel() | Abort the current parsing operation for whatever reason.

### Events

Event | Signature | Description
----- | --------- | -----------
opening-tag | (name) | Beginning of opening tag, like `<foo`.
attribute | (name, value) | A single attribute.
text | (text) | Text snippet.
comment | (commentText) | Comment text.
opening-tag-end | (name, token) | Closing bracket of opening tag. `token` will either be `">"` or `"/>"`.
closing-tag | (name) | Closing tag, like `</foo>`.
done | () | All done.
cancel | () | Current `tokenize()` run was canceled before it finished.

## Parser API

Name | Description
---- | -----------
var Parser = require('html-tokenizer/parser') | Module exports a constructor.
var parser = new Parser(opts) | Constructor takes options (optional). Relevant options passed to `Tokenizer()`.
opts.entities | Constructor option. See above.
parser.on(event, fn) | Events are emitted synchronously during `parse()`.
parser.parse(html) | Can be called arbitrarily many times per instance.

### Events

Event | Signature | Description
----- | --------- | -----------
open | (name, attributes, immediateClose) | Opening tag. `immediateClose` will be true if tag self-closes.
close | (name, immediateClose) | Closing tag. `immediateClose` will be true if it's a self-close.
text | (text) | Text snippet.
comment | (commentText) | Comment text snippet.
done | () | All done.

## Tokenizer Caveats

 * Does not handle `<![CDATA[]]>` (passes through as text)
 * Does not handle `<!doctype>` (passes through as text)
 * Does not handle `<? processing instructions ?>` (passes through as text)
 * Only converts a few `&entities;` by default
 * Won't handle every corner case identically to HTML5 browsers
 * Does not consume or produce Node.js streams
 * Mainly intended for client-side processing of small html snippets
 * On unrecoverable errors, finishes early rather than throwing
 * Performs best on clean markup
