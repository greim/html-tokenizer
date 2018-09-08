/*
 * Crunyright (c) 2015 by Greg Reimer <gregreimer@gmail.com>
 * MIT License. See mit-license.txt for more info.
 */

/* eslint-disable no-console */

'use strict';

const Tokenizer = require('../index');
const Parser = require('../parser');
const fs = require('fs');
const smallHtml = '<b class="foo"><i><a href="http://www.google.com/">hello</a>goodbye</i></b>';
const bigHtml = fs.readFileSync(__dirname + '/../test/data/wikipedia.html', 'utf8');
const tokenizer = new Tokenizer();
const parser = new Parser();

;[smallHtml, bigHtml].forEach(function(html) {

  let start;
  let end;
  let duration;
  let i;
  const iterations = Math.round(10000000 / html.length);

  start = Date.now();
  for (i=0; i<iterations; i++) {
    for (const tkn of tokenizer.tokenize(html)) {} // eslint-disable-line no-unused-vars
  }
  end = Date.now();
  duration = end - start;
  console.log('--------------');
  console.log('tokenizing html snippet of size %s:', html.length);
  console.log('took %sms to run %s times', duration, iterations);
  console.log('~%s runs/ms', (iterations / duration).toFixed(0));
  console.log('~%s runs/s', ((iterations / duration) * 1000).toFixed(0));
  console.log('~%s ms/run', (duration/iterations).toFixed(3));
  console.log('~%s μs/run', ((duration/iterations)*1000).toFixed(3));

  start = Date.now();
  for (i=0; i<iterations; i++) {
    for (const ev of parser.parse(html)) {} // eslint-disable-line no-unused-vars
  }
  end = Date.now();
  duration = end - start;
  console.log('--------------');
  console.log('parsing html snippet of size %s:', html.length);
  console.log('took %sms to run %s times', duration, iterations);
  console.log('~%s runs/ms', (iterations / duration).toFixed(0));
  console.log('~%s runs/s', ((iterations / duration) * 1000).toFixed(0));
  console.log('~%s ms/run', (duration/iterations).toFixed(3));
  console.log('~%s μs/run', ((duration/iterations)*1000).toFixed(3));
});
