/*
 * Copyright (c) 2015 by Greg Reimer <gregreimer@gmail.com>
 * MIT License. See mit-license.txt for more info.
 */

'use strict'

var Tokenizer = require('../index')
  , Parser = require('../parser')
  , assert = require('assert')
  , fs = require('fs')
  , entityMap = require('../entity-map')

describe('html-tokenizer', function(){
  ;[{html:'',tokens:[['start'],['done']]},
    {html:'hello',tokens:[['start'],['text','hello'],['done']]},
    {html:'<i>hello',tokens:[['start'],['opening-tag','i'],['opening-tag-end','i','>'],['text','hello'],['done']]},
    {html:'<br/>',tokens:[['start'],['opening-tag','br'],['opening-tag-end','br','/>'],['done']]},
    {html:'<br><br/>',tokens:[['start'],['opening-tag','br'],['opening-tag-end','br','>'],['opening-tag','br'],['opening-tag-end','br','/>'],['done']]},
    {html:'<br />',tokens:[['start'],['opening-tag','br'],['opening-tag-end','br','/>'],['done']]},
    {html:'hello <br>',tokens:[['start'],['text','hello '],['opening-tag','br'],['opening-tag-end','br','>'],['done']]},
    {html:'<i>hello',tokens:[['start'],['opening-tag','i'],['opening-tag-end','i','>'],['text','hello'],['done']]},
    {html:'yes <br> hello',tokens:[['start'],['text','yes '],['opening-tag','br'],['opening-tag-end','br','>'],['text',' hello'],['done']]},
    {html:'<p>hello</p>',tokens:[['start'],['opening-tag','p'],['opening-tag-end','p','>'],['text','hello'],['closing-tag','p'],['done']]},
    {html:'<p><br>hello</p>',tokens:[['start'],['opening-tag','p'],['opening-tag-end','p','>'],['opening-tag','br'],['opening-tag-end','br','>'],['text','hello'],['closing-tag','p'],['done']]},
    {html:'<br foo>',tokens:[['start'],['opening-tag','br'],['attribute','foo',''],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo=>',tokens:[['start'],['opening-tag','br'],['attribute','foo',''],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo=bar>',tokens:[['start'],['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo =bar>',tokens:[['start'],['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo= bar>',tokens:[['start'],['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo = bar>',tokens:[['start'],['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo=\'bar\'>',tokens:[['start'],['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo="bar> hello <br>',tokens:[['start'],['opening-tag','br'],['attribute','foo','bar> hello <br>'],['done']]},
    {html:'<br foo=bar=baz>',tokens:[['start'],['opening-tag','br'],['attribute','foo','bar=baz'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo="bar">',tokens:[['start'],['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo= "bar">',tokens:[['start'],['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo ="bar">',tokens:[['start'],['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo = "bar">',tokens:[['start'],['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo="bar" baz="qux">',tokens:[['start'],['opening-tag','br'],['attribute','foo','bar'],['attribute','baz','qux'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo="bar" baz=\'qux\'>',tokens:[['start'],['opening-tag','br'],['attribute','foo','bar'],['attribute','baz','qux'],['opening-tag-end','br','>'],['done']]},
    {html:'<br\nfoo="bar"\nbaz="qux">',tokens:[['start'],['opening-tag','br'],['attribute','foo','bar'],['attribute','baz','qux'],['opening-tag-end','br','>'],['done']]},
    {html:'<input autofocus>',tokens:[['start'],['opening-tag','input'],['attribute','autofocus',''],['opening-tag-end','input','>'],['done']]},
    {html:'<!--x-->',tokens:[['start'],['comment','x'],['done']]},
    {html:'<!--x\n-->',tokens:[['start'],['comment','x\n'],['done']]},
    {html:'<!--\nx-->',tokens:[['start'],['comment','\nx'],['done']]},
    {html:'<!--\nx\n-->',tokens:[['start'],['comment','\nx\n'],['done']]},
    {html:'<!--',tokens:[['start'],['done']]},
    {html:'<!--x',tokens:[['start'],['comment','x'],['done']]},
    {html:'<!--x-- >',tokens:[['start'],['comment','x-- >'],['done']]},
    {html:'<!--x-->\n<!-- yz -->',tokens:[['start'],['comment','x'],['text','\n'],['comment',' yz '],['done']]},
    {html:'-->',tokens:[['start'],['text','-->'],['done']]},
    {html:'<!---->',tokens:[['start'],['comment',''],['done']]},
    {html:'<!--<!---->',tokens:[['start'],['comment','<!--'],['done']]},
    {html:'<span><!--x--></p>',tokens:[['start'],['opening-tag','span'],['opening-tag-end','span','>'],['comment','x'],['closing-tag','p'],['done']]},
    {html:'<',tokens:[['start'],['text','<'],['done']]},
    {html:'>',tokens:[['start'],['text','>'],['done']]},
    {html:'<<<',tokens:[['start'],['text','<<<'],['done']]},
    {html:'<><=',tokens:[['start'],['text','<><='],['done']]},
    {html:'<a><b><c>x',tokens:[['start'],['opening-tag','a'],['opening-tag-end','a','>'],['opening-tag','b'],['opening-tag-end','b','>'],['opening-tag','c'],['opening-tag-end','c','>'],['text','x'],['done']]},
    {html:'</b></b>',tokens:[['start'],['closing-tag','b'],['closing-tag','b'],['done']]},
    {html:'<!doctype html><html>',tokens:[['start'],['text','<!doctype html>'],['opening-tag','html'],['opening-tag-end','html','>'],['done']]},
    {html:'<foo',tokens:[['start'],['opening-tag','foo'],['done']]},
    {html:'<foo<bar',tokens:[['start'],['opening-tag','foo'],['opening-tag','bar'],['done']]},
    {html:'<foo <foo',tokens:[['start'],['opening-tag','foo'],['text',' '],['opening-tag','foo'],['done']]},
    {html:'<foo <foo/> hello',tokens:[['start'],['opening-tag','foo'],['text',' '],['opening-tag','foo'],['opening-tag-end','foo','/>'],['text',' hello'],['done']]},
    {html:'yes &amp; no',tokens:[['start'],['text','yes & no'],['done']]},
    {html:'yes &quot; no',tokens:[['start'],['text','yes " no'],['done']]},
    {html:'yes &lt; no',tokens:[['start'],['text','yes < no'],['done']]},
    {html:'yes &gt; no',tokens:[['start'],['text','yes > no'],['done']]},
    {html:'yes &#183; no',tokens:[['start'],['text','yes · no'],['done']]},
    {html:'&lt;img/&gt;',tokens:[['start'],['text','<img/>'],['done']]},
    {html:'&quot;hello&quot;',tokens:[['start'],['text','"hello"'],['done']]},
    {html:'</bar>',tokens:[['start'],['closing-tag','bar'],['done']]},
    {html:'</ bar>',tokens:[['start'],['text','</ bar>'],['done']]},
    {html:'&#931;',tokens:[['start'],['text','\u03A3'],['done']]},
    {html:'&#0931;',tokens:[['start'],['text','\u03A3'],['done']]},
    {html:'&#x3A3;',tokens:[['start'],['text','\u03A3'],['done']]},
    {html:'&#x03A3;',tokens:[['start'],['text','\u03A3'],['done']]},
    {html:'&#x3a3;',tokens:[['start'],['text','\u03A3'],['done']]},
    {html:'&#xC6;',tokens:[['start'],['text','\u00C6'],['done']]},
    {html:'&nbsp;',tokens:[['start'],['text','\u00A0'],['done']]},
    {html:'&#160;&#160;&#160;',tokens:[['start'],['text','\u00A0\u00A0\u00A0'],['done']]},
    {html:'&copy;',tokens:[['start'],['text','&copy;'],['done']]},
    {html:'&copy;',tokens:[['start'],['text','\u00A9'],['done']],entities:{copy:'\u00A9'}},
    {html:'<foo:bar>',tokens:[['start'],['opening-tag','foo:bar'],['opening-tag-end','foo:bar','>'],['done']]},
    {html:'</foo:bar>',tokens:[['start'],['closing-tag','foo:bar'],['done']]},
    {html:'<foo:bar></foo:bar>',tokens:[['start'],['opening-tag','foo:bar'],['opening-tag-end','foo:bar','>'],['closing-tag','foo:bar'],['done']]},
    {html:'<script></script>',tokens:[['start'],['opening-tag','script'],['opening-tag-end','script','>'],['closing-tag','script'],['done']]},
    {html:'<script>alert("hello")</script>',tokens:[['start'],['opening-tag','script'],['opening-tag-end','script','>'],['text','alert("hello")'],['closing-tag','script'],['done']]},
    {html:'<script>for (var n=10,i=0; i<n; i++);</script>',tokens:[['start'],['opening-tag','script'],['opening-tag-end','script','>'],['text','for (var n=10,i=0; i<n; i++);'],['closing-tag','script'],['done']]},
    {html:'<script>\nfor (var n=10,i=0; i<n; i++);\n</script>',tokens:[['start'],['opening-tag','script'],['opening-tag-end','script','>'],['text','\nfor (var n=10,i=0; i<n; i++);\n'],['closing-tag','script'],['done']]},
    {html:'<script>alert("</script>")</script>',tokens:[['start'],['opening-tag','script'],['opening-tag-end','script','>'],['text','alert("'],['closing-tag','script'],['text','")'],['closing-tag','script'],['done']]},
    {html:'<script>alert("</scr"+"ipt>")</script>',tokens:[['start'],['opening-tag','script'],['opening-tag-end','script','>'],['text','alert("</scr"+"ipt>")'],['closing-tag','script'],['done']]},
  ].forEach(function(item) {
    (item.only?it.only:it)('should tokenize ' + JSON.stringify(item.html) + (item.entities?' with entities':''), function() {
      var result = collector(item.html, null, item.entities)
      //console.log(JSON.stringify(result))
      //console.log(JSON.stringify(item.tokens))
      assert.deepEqual(result, item.tokens)
    })
  })

  it('should cancel', function() {
    var result = collector('<br> foo', function(tkzr) {
      tkzr.on('opening-tag', function() {
        tkzr.cancel()
      })
    })
    assert.deepEqual(result, [['start'],['opening-tag','br'],['cancel']])
  })

  it('should be re-usable', function() {

    var html = '<p>hello <a href="#">there</a></p> <br> <br> <!-- nope-->'
      , resultA = []
      , resultB = []
      , result
    var tkzr = makeTokListener(function(args) { result.push(args) })
    result = resultA, tkzr.tokenize(html)
    result = resultB, tkzr.tokenize(html)
    assert.deepEqual(resultA, resultB)
  })

  it('should not be running before', function() {

    var tkzr = new Tokenizer()
    assert.strictEqual(tkzr._running, undefined)
  })

  it('should be running during', function() {

    var tkzr = new Tokenizer()
    tkzr.on('opening-tag', function() {
      assert.strictEqual(tkzr._running, true)
    })
    tkzr.tokenize('<br>')
  })

  it('should not be running after', function() {

    var tkzr = new Tokenizer()
    tkzr.tokenize('<br>')
    assert.strictEqual(tkzr._running, undefined)
  })

  it('should expose more entities', function() {

    var tkzr = new Tokenizer({entities:entityMap})
      , ran = false
    tkzr.on('text', function(text) {
      assert.strictEqual(text, '\u00B0')
      ran = true
    })
    tkzr.tokenize('&deg;')
    assert.ok(ran, 'did not run')
  })

  describe('parser', function(){

    ;[{html:'',events:[['start'],['done']]},
      {html:'<br>',events:[['start'],['open','br',{},true],['close','br',true],['done']]},
      {html:'<br/>',events:[['start'],['open','br',{},true],['close','br',true],['done']]},
      {html:'<p>',events:[['start'],['open','p',{},false],['close','p',false],['done']]},
      {html:'<p>hello',events:[['start'],['open','p',{},false],['text','hello'],['close','p',false],['done']]},
      {html:'<p/>hello',events:[['start'],['open','p',{},true],['close','p',true],['text','hello'],['done']]},
      {html:'<b><i><u>',events:[['start'],['open','b',{},false],['open','i',{},false],['open','u',{},false],['close','u',false],['close','i',false],['close','b',false],['done']]},
      {html:'<b><i><u></u></i></b>',events:[['start'],['open','b',{},false],['open','i',{},false],['open','u',{},false],['close','u',false],['close','i',false],['close','b',false],['done']]},
      {html:'<b><i>what<u></u></i></b>',events:[['start'],['open','b',{},false],['open','i',{},false],['text','what'],['open','u',{},false],['close','u',false],['close','i',false],['close','b',false],['done']]},
      {html:'<br>foo</br>',events:[['start'],['open','br',{},true],['close','br',true],['text','foo'],['done']]},
      {html:'<br class="xyz">',events:[['start'],['open','br',{class:'xyz'},true],['close','br',true],['done']]},
      {html:'<br id=" foo-bar" class="xyz">',events:[['start'],['open','br',{id:' foo-bar',class:'xyz'},true],['close','br',true],['done']]},
      {html:'<br id=\' foo-bar\' class=\'xyz\'>',events:[['start'],['open','br',{id:' foo-bar',class:'xyz'},true],['close','br',true],['done']]},
      {html:'<br id=foo-bar class=xyz>',events:[['start'],['open','br',{id:'foo-bar',class:'xyz'},true],['close','br',true],['done']]},
      {html:'<br id\n   \t=\r\nfoo-bar class\n=\txyz>',events:[['start'],['open','br',{id:'foo-bar',class:'xyz'},true],['close','br',true],['done']]},
      {html:'<br>>>',events:[['start'],['open','br',{},true],['close','br',true],['text','>>'],['done']]},
      {html:'<<<br>',events:[['start'],['text','<<'],['open','br',{},true],['close','br',true],['done']]},
      {html:'<b></b></pre>',events:[['start'],['open','b',{},false],['close','b',false],['done']]},
      {html:'<b></b></pre>hello',events:[['start'],['open','b',{},false],['close','b',false],['text','hello'],['done']]},
      {html:'<b></pre>',events:[['start'],['open','b',{},false],['close','b',false],['done']]},
      {html:'<pre',events:[['start'],['done']]},
      {html:'<pre ',events:[['start'],['text',' '],['done']]},
      {html:'zz<pre',events:[['start'],['text','zz'],['done']]},
      {html:'< br>',events:[['start'],['text','< br>'],['done']]},
      {html:'</br>',events:[['start'],['done']]},
      {html:'<!---->',events:[['start'],['comment',''],['done']]},
      {html:'<!--x-->',events:[['start'],['comment','x'],['done']]},
      {html:'<!--\nx\n-->',events:[['start'],['comment','\nx\n'],['done']]},
      {html:'<!--x-- >',events:[['start'],['comment','x-- >'],['done']]},
      {html:'<foo:bar>',events:[['start'],['open','foo:bar',{},false],['close','foo:bar',false],['done']]},
      {html:'</foo:bar>',events:[['start'],['done']]},
      {html:'<foo:bar></foo:bar>',events:[['start'],['open','foo:bar',{},false],['close','foo:bar',false],['done']]},
      {html:'<foo:bar yes="yes"></foo:bar>',events:[['start'],['open','foo:bar',{yes:'yes'},false],['close','foo:bar',false],['done']]},
      {html:'<script type="text/javascript"></script>',events:[['start'],['open','script',{type:'text/javascript'},false],['close','script',false],['done']]},
      {html:'<script>alert("hello")</script>',events:[['start'],['open','script',{},false],['text','alert("hello")'],['close','script',false],['done']]},
      {html:'<script>for (var n=10,i=0; i<n; i++);</script>',events:[['start'],['open','script',{},false],['text','for (var n=10,i=0; i<n; i++);'],['close','script',false],['done']]},
      {html:'<script>\nfor (var n=10,i=0; i<n; i++);\n</script>',events:[['start'],['open','script',{},false],['text','\nfor (var n=10,i=0; i<n; i++);\n'],['close','script',false],['done']]},
      {html:'<script><foo<foo<foo</script>',events:[['start'],['open','script',{},false],['text','<foo<foo<foo'],['close','script',false],['done']]},
      {html:'<script><![CDATA[ blah >> ]]></script>',events:[['start'],['open','script',{},false],['text','<![CDATA[ blah >> ]]>'],['close','script',false],['done']]},
      {html:'<script><!--//--></script>',events:[['start'],['open','script',{},false],['text','<!--//-->'],['close','script',false],['done']]},
      {html:'<script>\n<!--\n//-->\n</script>',events:[['start'],['open','script',{},false],['text','\n<!--\n//-->\n'],['close','script',false],['done']]},
      {html:'<script>alert("</script>")</script>',events:[['start'],['open','script',{},false],['text','alert("'],['close','script',false],['text','")'],['done']]},
      {html:'<script>alert("</scr"+"ipt>")</script>',events:[['start'],['open','script',{},false],['text','alert("</scr"+"ipt>")'],['close','script',false],['done']]},
      {html:'<script defer>',events:[['start'],['open','script',{defer:''},false],['close','script',false],['done']]},
      {html:'<foo<foo>',events:[['start'],['open','foo',{},false],['close','foo',false],['done']]},
    ].forEach(function(item) {
      (item.only?it.only:it)('should parse '+JSON.stringify(item.html), function() {
        var events = parserCollector(item.html)
        assert.deepEqual(events, item.events)
      })
    })

    it('should pass through options', function() {
      var parser = new Parser({entities:entityMap})
        , ran = false
      parser.on('text', function(text) {
        assert.strictEqual(text, '\u00B0')
        ran = true
      })
      parser.parse('&deg;')
      assert.ok(ran, 'did not run')
    })

    it('should parse a wikipedia page', function() {
      function attify(atts) {
        return Object.keys(atts).map(function(name) {
          return ' ' + name + '="' + atts[name] + '"'
        }).join('')
      }
      var page = fs.readFileSync(__dirname + '/data/wikipedia.html', 'utf8')
      var parser = new Parser()
      var content = []
      parser.on('open', function(name, atts, immediateClose) {
        if (immediateClose) {
          content.push('<' + name + attify(atts) + ' />')
        } else {
          content.push('<' + name + attify(atts) + '>')
        }
      })
      parser.on('close', function(name, immediateClose) {
        if (!immediateClose) {
          content.push('</' + name + '>')
        }
      })
      parser.on('text', function(val) {
        content.push(val)
      })
      parser.on('comment', function(val) {
        content.push('<!--'+val+'-->')
      })
      parser.parse(page)
      content = content.join('')
      //console.log(content)
      //assert.strictEqual(content, page)
      assert.ok(/hello<\/html>$/.test(content))
    })
  })
})

function parserCollector(html) {
  var result = [];
  var parser = new Parser()
  ;['start','open','close','text','comment','done'].forEach(function(ev) {
    parser.on(ev, function() {
      var args = [].slice.call(arguments)
      args.unshift(ev)
      result.push(args)
    })
  })
  parser.parse(html)
  return result
}

function collector(html, cb, entities) {
  var result = [];
  var tkzr = makeTokListener(function(args) {
    result.push(args)
  }, entities)
  if (cb) { cb(tkzr) }
  tkzr.tokenize(html)
  return result
}

function makeTokListener(cb, entities) {
  var tkzr = new Tokenizer({entities:entities})
  ;['start','opening-tag','attribute','text','comment','opening-tag-end','closing-tag','done','cancel'].forEach(function(ev) {
    tkzr.on(ev, function() {
      var args = [].slice.call(arguments)
      args.unshift(ev)
      cb(args)
    })
  })
  return tkzr
}
