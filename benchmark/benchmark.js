/*
 * Copyright (c) 2015 by Greg Reimer <gregreimer@gmail.com>
 * MIT License. See mit-license.txt for more info.
 */

'use strict'

var Tokenizer = require('../index')
  , Parser = require('../parser')
  , html = '<b class="foo"><i><a href="http://www.google.com/">hello</a>goodbye</i></b>'

var tokenizer = new Tokenizer()
var start = Date.now()
var iterations = 100000
for (var i=0; i<iterations; i++) {
  tokenizer.tokenize(html)
}
var end = Date.now()
var diff = end - start
console.log('--------------')
console.log('tokenizing %s:', JSON.stringify(html))
console.log('took %sms to run %s times', diff, iterations)
console.log('%s ops/ms', (iterations / diff).toFixed(0))

var parser = new Parser()
var start = Date.now()
var iterations = 100000
for (var i=0; i<iterations; i++) {
  parser.parse(html)
}
var end = Date.now()
var diff = end - start
console.log('--------------')
console.log('parsing %s:', JSON.stringify(html))
console.log('took %sms to run %s times', diff, iterations)
console.log('%s ops/ms', (iterations / diff).toFixed(0))
