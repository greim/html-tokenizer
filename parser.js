/*
 * Copyright (c) 2015 by Greg Reimer <gregreimer@gmail.com>
 * MIT License. See mit-license.txt for more info.
 */

'use strict'

var Tokenizer = require('./index')
  , EventEmitter = require('events').EventEmitter
  , util = require('util')
  , _ = require('lodash')

function Parser(opts) {
  opts = opts || {}
  EventEmitter.call(this)
  var tkzr = this._tokenizer = new Tokenizer(opts)
  var self = this
  // ----------------------
  tkzr.on('start', function(name) {
    self.emit('start')
  })
  // ----------------------
  tkzr.on('opening-tag', function(name) {
    self._stack.push({name:name,attributes:{}})
  })
  // ----------------------
  tkzr.on('closing-tag', function(name) {
    var current = self._stack.peek()
      , parent = self._stack.peek(1)
    if (current) {
      if (current.name === name) {
        self._stack.pop()
        self.emit('close', current.name, false)
      } else {
        if (parent && parent.name === name && isClosedByParent(current.name)) {
          self._stack.pop()
          self.emit('close', current.name, false)
          self._stack.pop()
          self.emit('close', parent.name, false)
        }
      }
    }
  })
  // ----------------------
  tkzr.on('opening-tag-end', function(name, token) {
    var current = self._stack.peek()
      , parent = self._stack.peek(1)
      , isSelfClose = token === '/>' || isSelfClosing(name)
    if (parent && isClosedBy(parent.name, current.name)) {
      self._stack.nip(1)
      self.emit('close', parent.name, false)
    }
    current.complete = true
    self.emit('open', current.name, current.attributes, isSelfClose)
    if (isSelfClose) {
      self._stack.pop()
      self.emit('close', current.name, true)
    }
  })
  // ----------------------
  tkzr.on('text', function(value) {
    self.emit('text', value)
  })
  // ----------------------
  tkzr.on('comment', function(value) {
    self.emit('comment', value)
  })
  // ----------------------
  tkzr.on('attribute', function(name, value) {
    var current = self._stack.peek()
    current.attributes[name] = value
  })
}

util.inherits(Parser, EventEmitter)

_.extend(Parser.prototype, {

  parse: function(html) {
    this._stack = makeStack()
    this._tokenizer.tokenize(html)
    while (this._stack.length > 0) {
      var next = this._stack.pop()
      if (next.complete) {
        this.emit('close', next.name, false)
      }
    }
    delete this._stack
    this.emit('done')
  }
})

var makeStack = (function() {
  function peek(n) {
    n = n || 0
    return this[this.length - (n + 1)]
  }
  function nip(n) {
    n = n || 0
    this.splice(this.length - (n + 1), 1)
  }
  return function() {
    var stack = []
    stack.peek = peek
    stack.nip = nip
    return stack
  }
})()

var isSelfClosing = (function() {
  var table = makeLookup('area,base,br,col,command,embed,hr,img,input,keygen,link,meta,param,source,track,wbr')
  return function(closee) {
    return !!table[closee]
  }
})()

var isClosedBy = (function() {
  var empty = {}
  var table = {
    p: makeLookup('address,article,aside,blockquote,div,dl,fieldset,footer,form,h1,h2,h3,h4,h5,h6,header,hgroup,hr,main,nav,ol,p,pre,section,table,ul'),
    li: makeLookup('li'),
    dt: makeLookup('dt,dd'),
    dd: makeLookup('dt,dd'),
    rb: makeLookup('rb,rt,rtc,rp'),
    rt: makeLookup('rb,rt,rtc,rp'),
    rtc: makeLookup('rb,rtc,rp'),
    rp: makeLookup('rb,rt,rtc,rp'),
    optgroup: makeLookup('optgroup'),
    option: makeLookup('option,optgroup'),
    thead: makeLookup('tbody,tfoot'),
    tbody: makeLookup('tbody,tfoot'),
    tfoot: makeLookup('tbody'),
    tr: makeLookup('tr'),
    td: makeLookup('td,th'),
    th: makeLookup('td,th'),
  }
  return function(closee, closer) {
    var lookup = table[closee] || empty
    return !!lookup[closer]
  }
})()

var isClosedByParent = (function() {
  var table = makeLookup('p,li,dd,rb,rt,rtc,rp,optgroup,option,tbody,tfoot,tr,td,th')
  return function(closee) {
    return !!table[closee]
  }
})()

function makeLookup(str) {
  var obj = {}
  str.split(',').forEach(function(x) { obj[x] = true })
  return obj
}

module.exports = Parser