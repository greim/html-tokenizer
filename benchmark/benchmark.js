/*
 * Copyright (c) 2015 by Greg Reimer <gregreimer@gmail.com>
 * MIT License. See mit-license.txt for more info.
 */

'use strict'

var Tokenizer = require('../index')
  , Parser = require('../parser')
  , fs = require('fs')
  , smallHtml = '<b class="foo"><i><a href="http://www.google.com/">hello</a>goodbye</i></b>'
  , bigHtml = fs.readFileSync(__dirname + '/../test/data/wikipedia.html', 'utf8')
  , tokenizer = new Tokenizer()
  , parser = new Parser()

;[smallHtml, bigHtml].forEach(function(html) {

  var start, end, duration, i
    , iterations = Math.round(10000000 / html.length)

  start = Date.now()
  for (i=0; i<iterations; i++) {
    tokenizer.tokenize(html)
  }
  end = Date.now()
  duration = end - start
  console.log('--------------')
  console.log('tokenizing html snippet of size %s:', html.length)
  console.log('took %sms to run %s times', duration, iterations)
  console.log('~%s runs/ms', (iterations / duration).toFixed(0))
  console.log('~%s runs/s', ((iterations / duration) * 1000).toFixed(0))
  console.log('~%s ms/run', (duration/iterations).toFixed(3))
  console.log('~%s μs/run', ((duration/iterations)*1000).toFixed(3))

  start = Date.now()
  for (i=0; i<iterations; i++) {
    parser.parse(html)
  }
  end = Date.now()
  duration = end - start
  console.log('--------------')
  console.log('parsing html snippet of size %s:', html.length)
  console.log('took %sms to run %s times', duration, iterations)
  console.log('~%s runs/ms', (iterations / duration).toFixed(0))
  console.log('~%s runs/s', ((iterations / duration) * 1000).toFixed(0))
  console.log('~%s ms/run', (duration/iterations).toFixed(3))
  console.log('~%s μs/run', ((duration/iterations)*1000).toFixed(3))
})
