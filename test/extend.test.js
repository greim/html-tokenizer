/*
 * Copyright (c) 2015 by Greg Reimer <gregreimer@gmail.com>
 * MIT License. See mit-license.txt for more info.
 */

'use strict'

var extend = require('../extend')
  , assert = require('assert')

describe('extend', function(){

  it('returns first thing', function() {
    var first = {}
    var result = extend(first, { foo: 'bar' })
    assert.strictEqual(result, first)
  })

  it('extends one thing', function() {
    var result = extend({ a: 0, b: 2 }, { a: 1, c: 3 })
    assert.deepEqual(result, { a: 1, b: 2, c: 3 })
  })

  it('extends two things', function() {
    var result = extend({ a: 0, b: 2 }, { a: 1, c: 3 }, { d: 4 })
    assert.deepEqual(result, { a: 1, b: 2, c: 3, d: 4 })
  })

  it('extends two things', function() {
    var result = extend({ a: 0, b: 2 }, { a: 1, c: 3 }, { d: 4 })
    assert.deepEqual(result, { a: 1, b: 2, c: 3, d: 4 })
  })

  it('only extends own properties', function() {
    function Foo() {}
    Foo.prototype.x = 2
    var obj = new Foo()
    obj.a = 1
    var result = extend({}, obj)
    assert.deepEqual(result, { a: 1 })
  })
})
