# HTML Tokenizer

A small, super-fast, event-driven, fault-tolerant, html tag-soup tokenizer that works in node or browsers via browserify.

You pass it a string which is supposed to contain HTML, and it emits a stream of events telling you what things it finds.

```
npm install html-tokenizer
```

## Tokenizer Example

```js
var Tokenizer = require('html-tokenizer')
var tokenizer = new Tokenizer()
tokenizer.on('opening-tag', function(name) { ... })
tokenizer.on('closing-tag', function(name) { ... })
...etc...
tokenizer.tokenize('<p>hello</p>')
tokenizer.tokenize('<foo></bar>')
```

## Parser Example

A basic HTML parser is included in the project which you can require separately.
Instead of just telling you what things it finds, its reveals the tag structure of the document.
The tokenizer makes no such guarantees.

```js
var Parser = require('html-tokenizer/parser')
var parser = new Parser()
parser.on('open', function(name, attributes) { ... })
parser.on('close', function(name) { ... })
...etc...
parser.parse('<p>hello</p>')
parser.parse('<foo></bar>')
```

## Tokenizer API

 * `var Tokenizer = require('html-tokenizer')`
 * `var tokenizer = new Tokenizer(opts)`
   * `opts.entities` All numeric entity codes are supported, but only a few common text ones are. If you wanted exhaustive support, you could add a map here like `{ copy: '©' }` which will be merged over the ones it already supports.
 * `tokenizer.on(event, fn)` - A tokenizer is an EventEmitter. Events are emitted synchronously.
 * `tokenizer.tokenize(html)` - Make sure you set up all your events before doing this!
 * `tokenizer.cancel()` - Abort the current parsing operation for whatever reason.
 * event `"opening-tag" (name)` - Found the beginning of a tag
 * event `"attribute" (name, value)` - Found an attribute
 * event `"text" (text)` - Found some text
 * event `"comment" (commentText)` - Found a comment
 * event `"opening-tag-end" (name, token)` - Found the end of an opening tag. `token` will either be `">"` or `"/>"` so between that and `name` you can make informed choices when writing your parser.
 * event `"closing-tag" (name)` - Found a closing tag like `</foo>`
 * event `"done" ()` - The tokenizer finished
 * event `"cancel" ()` - The tokenizer was canceled before it finished

## Parser API

 * `var Parser = require('html-tokenizer/parser')`
 * `var parser = new Parser()`
 * `parser.on(event, fn)` - A parser is an EventEmitter. Events are emitted synchronously.
 * `parser.parse(html)` - Make sure you set up all your events before doing this!
 * event `"open" (name, attributes, immediateClose)` - A tag has opened. `immediateClose` will be true if the tag self-closes.
 * event `"close" (name, immediateClose)` - A tag has closed, either due to `</tag>` or `<tag/>`, or self-closers like `<br>`. `immediateClose` will be true if this close was due to self-closing.
 * event `"text" (text)` - Found some text
 * event `"comment" (commentText)` - Found a comment
 * event `"done" ()` - The parser finished

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
