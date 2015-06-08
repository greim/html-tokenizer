# HTML Tokenizer

A small, super-fast, event-driven, fault-tolerant, html tag-soup tokenizer that works in node but which is mainly intended as a lightweight parser for small HTML snippets that can run in browsers via browserify.
You pass it a string which is supposed to contain HTML, and it emits a stream of events telling you what things it finds.

```
npm install html-tokenizer
```

## Tokenizer

A tokenizer emits a stream of events such as "this looks like an attribute" or "this looks like an opening tag," *however* these won't necessarily be well-formed.
For example `<foo <foo` will produce two `opening-tag` events in a row.
If that bothers you, then what you probably want is a parser, not a tokenizer, so keep scrolling down.

```js
var Tokenizer = require('html-tokenizer')
var tokenizer = new Tokenizer({entities:{copy:'\u00A9'}})
tokenizer.on('opening-tag', function(name) { ... })
tokenizer.on('closing-tag', function(name) { ... })
...etc...
tokenizer.tokenize('<p>Copyright &copy; 1998</p>')
tokenizer.tokenize('<foo></bar>')
```

## Parser

A basic HTML parser is included in the project which you can require separately.
Instead of just telling you what things it finds, it attempts to find structure in the document.
The tokenizer makes no such guarantees.
Note, the corner-case parsing rules for HTML5 are quite complicated and this may not cover them all.

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

Events are emitted during the `tokenize()` operation.

Event | Signature | Description
----- | --------- | -----------
start | () | Emitted once at beginning.
opening-tag | (name) | Beginning of opening tag, like `<foo`.
attribute | (name, value) | Only fires between "opening-tag" and "opening-tag-end" events.
opening-tag-end | (name, token) | Closing bracket of opening tag. `token` will either be `">"` or `"/>"`.
text | (text) | Text snippet.
comment | (commentText) | Comment text.
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

Events are emitted during the `parse()` operation.

Event | Signature | Description
----- | --------- | -----------
start | () | Emitted once at beginning.
open | (name, attributes, selfClosing) | Opening tag. `selfClosing` will be true if this tag self-closes.
text | (text) | Text snippet.
comment | (commentText) | Comment text snippet.
close | (name, selfClosing) | Closing tag. `selfClosing` will be true if this was a self-closing tag.
done | () | All done.

## Entities

`Tokenizer()` and `Parser()` take an `options.entities` object in order to broaden the set of supported HTML character entities.
Exhaustive support can be added, however for browser-based apps this pulls in a large-ish file.
Thus, exhaustive entity support must be required separately.

```js
var Parser = require('html-tokenizer/parser')
var entityMap = require('html-tokenizer/entity-map')
new Parser({ entities: entityMap })
```

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
