/*
 * Copyright (c) 2015 by Greg Reimer <gregreimer@gmail.com>
 * MIT License. See mit-license.txt for more info.
 */

'use strict'

var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , _ = require('lodash')

// -----------------------------------------------

function Tokenizer(opts) {
  opts = opts || {}
  EventEmitter.call(this)
  this._entityMap = _.extend({}, Tokenizer.defaultEntityMap, opts.entities)
}

util.inherits(Tokenizer, EventEmitter)

_.extend(Tokenizer, {

  defaultEntityMap: {
    amp: '&',
    quot: '"',
    lt: '<',
    gt: '>',
    nbsp: '\u00A0',
  },
})

_.extend(Tokenizer.prototype, {

  cancel: function() {
    this._send('cancel')
  },

  entities: function(map) {
    _.extend(this._entityMap, map)
  },

  _send: function(ev) {
    if (!this._running) {
      return
    }
    if (ev === 'text') {
      var text = arguments[1]
      if (this._text === undefined) {
        this._text = text
      } else {
        this._text += text
      }
    } else {
      if (this._text) {
        var deentText = deentityify(this._text, this._entityMap)
        this.emit('text', deentText)
        delete this._text
      }
      var len = arguments.length
      if (len === 1) {
        this.emit(ev)
      } else if (len === 2) {
        this.emit(ev, arguments[1])
      } else if (len === 3) {
        this.emit(ev, arguments[1], arguments[2])
      } else {
        this.emit.apply(this, arguments)
      }
    }
    if (ev === 'cancel') {
      delete this._running
    }
  },

  tokenize: function(html) {
    this._running = true
    this._send('start')
    var pos = 0
      , state = states.inText
      , currentTag
      , next
    while (pos < html.length) {
      if (state === states.inText) {
        var isBracket = html.charAt(pos) === '<' // cheap pre-emptive check
        if (isBracket && (next = chunk.getOpeningTag(html, pos))) {
          pos += next.length
          currentTag = next.match[2]
          this._send('opening-tag', currentTag)
          state = states.inTag
        } else if (isBracket && (next = chunk.getClosingTag(html, pos))) {
          pos += next.length
          this._send('closing-tag', next.match[2])
        } else if (isBracket && (next = chunk.getCommentOpen(html, pos))) {
          pos += next.length
          state = states.inComment
        } else if (next = chunk.getText(html, pos)) {
          pos += next.length
          this._send('text', next.match[1])
        } else {
          var text = html.substring(pos, pos + 1)
          pos += 1
          this._send('text', text)
        }
      } else if (state === states.inComment) {
        if (next = chunk.getComment(html, pos)) {
          pos += next.length
          this._send('comment', next.match[2])
          state = states.inText
        } else {
          this._send('comment', html.substring(pos))
          break
        }
      } else if (state === states.inScript) {
        if (next = chunk.getScript(html, pos)) {
          pos += next.length
          this._send('text', next.match[2])
          this._send('closing-tag', 'script')
          state = states.inText
        } else {
          this._send('text', html.substring(pos))
          break
        }
      } else if (state === states.inTag) {
        if (next = chunk.getAttributeName(html, pos)) {
          pos += next.length
          var name = next.match[2]
          var hasVal = next.match[4]
          if (hasVal) {
            var read = readAttribute(html, pos)
            pos += read.length
            this._send('attribute', name, read.value)
          } else {
            this._send('attribute', name, '')
          }
        } else if (next = chunk.getTagEnd(html, pos)) {
          pos += next.length
          var token = next.match[2]
          this._send('opening-tag-end', currentTag, token)
          state = currentTag === 'script' ? states.inScript : states.inText
        } else {
          break
        }
      } else {
        break
      }
    }
    this._send('done')
    delete this._running
  }
})

// -----------------------------------------------

var states = {
  inTag: 'in tag',
  inComment: 'in comment',
  inText: 'in text',
  inScript: 'in script',
}

// -----------------------------------------------

var chunk = (function(chunk){
  ;[{ name: 'getOpeningTag',    regex: /(<(([a-z0-9\-]+:)?[a-z0-9\-]+))/ig },
    { name: 'getText',          regex: /([^<]+)/g },
    { name: 'getClosingTag',    regex: /(<\/(([a-z0-9\-]+:)?[a-z0-9\-]+)>)/ig },
    { name: 'getCommentOpen',   regex: /(<!\-\-)/g },
    { name: 'getComment',       regex: /(([\s\S]*?)\-\->)/g },
    { name: 'getScript',        regex: /(([\s\S]*?)<\/script>)/g },
    { name: 'getTagEnd',        regex: /(\s*(\/?>))/g },
    { name: 'getAttributeName', regex: /(\s+(([a-z0-9\-]+:)?[a-z0-9\-]+)(\s*=\s*)?)/ig },
  ].forEach(function(item) {
    chunk[item.name] = function(str, pos) {
      item.regex.lastIndex = pos
      var match = item.regex.exec(str)
      if (!match || match.index !== pos) {
        return undefined
      } else {
        return {
          length: match[1].length,
          match: match
        }
      }
    }
  })
  return chunk
})({})

// -----------------------------------------------

var readAttribute = (function() {
  var patt = /(\s*([^>\s]*))/g
  return function(str, pos) {
    var quote = str.charAt(pos)
    if (quote === '"' || quote === "'") {
      var nextQuote = str.indexOf(quote, pos + 1)
      if (nextQuote === -1) {
        return { length: str.length - pos, value: str.substring(pos + 1) }
      } else {
        return { length: (nextQuote - pos) + 1, value: str.substring(pos + 1, nextQuote) }
      }
    } else {
      patt.lastIndex = pos
      var match = patt.exec(str)
      return { length: match[1].length, value: match[2] }
    }
  }
})()

// -----------------------------------------------

var deentityify = (function() {
  var patt = /&(#?)([a-z0-9]+);/ig
  return function(text, map) {
    return text.replace(patt, function(ent, isNum, content) {
      if (isNum) {
        var num
        if (content.charAt(0) === 'x') {
          num = parseInt('0'+content, 16)
        } else {
          num = parseInt(content, 10)
        }
        return String.fromCharCode(num)
      } else {
        return map[content] || ent
      }
    })
  }
})()

// -----------------------------------------------

module.exports = Tokenizer
