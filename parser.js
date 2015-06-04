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
  tkzr.on('start', function(name) {
    self.emit('start')
  })
  tkzr.on('opening-tag', function(name) {
    self._stack.push({name:name,attributes:{}})
  })
  tkzr.on('closing-tag', function(name) {
    var current = self._stack.peek()
    if (current && current.name === name) {
      self._stack.pop()
      self.emit('close', current.name, false)
    }
  })
  tkzr.on('opening-tag-end', function(name, token) {
    var current = self._stack.peek()
      , isSelfClosing = token === '/>' || !!SELF_CLOSING[name]
    current.complete = true
    self.emit('open', current.name, current.attributes, isSelfClosing)
    if (isSelfClosing) {
      self._stack.pop()
      self.emit('close', current.name, true)
    }
  })
  tkzr.on('text', function(value) {
    self.emit('text', value)
  })
  tkzr.on('comment', function(value) {
    self.emit('comment', value)
  })
  tkzr.on('attribute', function(name, value) {
    var current = self._stack.peek()
    current.attributes[name] = value
  })
  tkzr.on('error', function() {
    tkzr.cancel()
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
  function peek() {
    return this[this.length - 1]
  }
  return function() {
    var stack = []
    stack.peek = peek
    return stack
  }
})()

var SELF_CLOSING = {
  area: true,
  base: true,
  br: true,
  col: true,
  command: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
}

module.exports = Parser