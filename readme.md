# HTML Tokenizer

A small, super-fast, event-driven, fault-tolerant, html tag-soup tokenizer that works in node or browsers via browserify.

Emits a stream of events telling you what things it finds in some purported HTML.
Includes a parser implementation, which attempts to find any HTML *structure* lurking within that stream.
Note: this is not spec conformant.

```
npm install html-tokenizer
```

## Tokenizer Example

```js
var Tokenizer = require('html-tokenizer')
var tokenizer = new Tokenizer()
...add some listeners...
tokenizer.tokenize('<p>hello</p>') // p tag start, p tag end, "hello", p tag close
tokenizer.tokenize('<foo></bar>') // foo tag start, foo tag end, bar tag close
```

## Parser Example

A basic HTML parser is included in the project but you have to require it separately.

```js
var Parser = require('html-tokenizer/parser')
var parser = new Parser()
...add some listeners...
parser.parse('<p>hello</p>') // open p tag, "hello", close p tag
parser.parse('<foo></bar>') // open foo tag, close foo tag (discards </bar> tag)
```

## Tokenizer API

 * `var Tokenizer = require('html-tokenizer')`
 * `var tokenizer = new Tokenizer()`
 * `tokenizer.on(event, fn)` - A tokenizer is an EventEmitter. Events are emitted synchronously.
 * `tokenizer.tokenize(html)` - Make sure you set up all your events before doing this!
 * `tokenizer.cancel()` - Abort the current parsing operation for whatever reason.
 * `tokenizer.entities(map)` - All numeric entity codes are supported, but only a few common text ones are. If you wanted exhaustive support, you could add a map here like `{ copy: '©' }` which will be merged over the ones it already supports.
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
 * event `"open" (name, attributes)` - A tag has opened
 * event `"close" (name)` - A tag has closed, either due to `</tag>` or `<tag/>`, or self-closers like `<br>`
 * event `"text" (text)` - Found some text
 * event `"comment" (commentText)` - Found a comment
 * event `"done" ()` - The parser finished

## Tokenizer Caveats

 * Does not handle `<![CDATA[]]>` (treats as text node)
 * Does not handle `<!doctype>` (treats as text node)
 * Does not handle `<? processing instructions ?>` (treats as text node)
 * Only converts a few `&entities;` by default
 * Won't handle every corner case identically to HTML5 browsers
 * Does not consume or produce Node.js streams
 * Mainly intended for client-side processing of small html snippets
 * On unrecoverable errors, finishes early rather than throwing
 * Performs best on clean markup
