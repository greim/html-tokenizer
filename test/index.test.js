/*
 * Copyright (c) 2015 by Greg Reimer <gregreimer@gmail.com>
 * MIT License. See mit-license.txt for more info.
 */

'use strict'

var Tokenizer = require('../index')
  , Parser = require('../parser')
  , assert = require('assert')
  , fs = require('fs')

describe.only('html-tokenizer', function(){
  ;[{html:'',tokens:[['done']]},
    {html:'hello',tokens:[['text','hello'],['done']]},
    {html:'<i>hello',tokens:[['opening-tag','i'],['opening-tag-end','i','>'],['text','hello'],['done']]},
    {html:'<br/>',tokens:[['opening-tag','br'],['opening-tag-end','br','/>'],['done']]},
    {html:'<br><br/>',tokens:[['opening-tag','br'],['opening-tag-end','br','>'],['opening-tag','br'],['opening-tag-end','br','/>'],['done']]},
    {html:'<br />',tokens:[['opening-tag','br'],['opening-tag-end','br','/>'],['done']]},
    {html:'hello <br>',tokens:[['text','hello '],['opening-tag','br'],['opening-tag-end','br','>'],['done']]},
    {html:'<i>hello',tokens:[['opening-tag','i'],['opening-tag-end','i','>'],['text','hello'],['done']]},
    {html:'yes <br> hello',tokens:[['text','yes '],['opening-tag','br'],['opening-tag-end','br','>'],['text',' hello'],['done']]},
    {html:'<p>hello</p>',tokens:[['opening-tag','p'],['opening-tag-end','p','>'],['text','hello'],['closing-tag','p'],['done']]},
    {html:'<p><br>hello</p>',tokens:[['opening-tag','p'],['opening-tag-end','p','>'],['opening-tag','br'],['opening-tag-end','br','>'],['text','hello'],['closing-tag','p'],['done']]},
    {html:'<br foo>',tokens:[['opening-tag','br'],['attribute','foo',''],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo=>',tokens:[['opening-tag','br'],['attribute','foo',''],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo=bar>',tokens:[['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo =bar>',tokens:[['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo= bar>',tokens:[['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo = bar>',tokens:[['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo=\'bar\'>',tokens:[['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo="bar> hello <br>',tokens:[['opening-tag','br'],['attribute','foo','bar> hello <br>'],['done']]},
    {html:'<br foo=bar=baz>',tokens:[['opening-tag','br'],['attribute','foo','bar=baz'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo="bar">',tokens:[['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo= "bar">',tokens:[['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo ="bar">',tokens:[['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo = "bar">',tokens:[['opening-tag','br'],['attribute','foo','bar'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo="bar" baz="qux">',tokens:[['opening-tag','br'],['attribute','foo','bar'],['attribute','baz','qux'],['opening-tag-end','br','>'],['done']]},
    {html:'<br foo="bar" baz=\'qux\'>',tokens:[['opening-tag','br'],['attribute','foo','bar'],['attribute','baz','qux'],['opening-tag-end','br','>'],['done']]},
    {html:'<br\nfoo="bar"\nbaz="qux">',tokens:[['opening-tag','br'],['attribute','foo','bar'],['attribute','baz','qux'],['opening-tag-end','br','>'],['done']]},
    {html:'<input autofocus>',tokens:[['opening-tag','input'],['attribute','autofocus',''],['opening-tag-end','input','>'],['done']]},
    {html:'<!--x-->',tokens:[['comment','x'],['done']]},
    {html:'<!--x\n-->',tokens:[['comment','x\n'],['done']]},
    {html:'<!--\nx-->',tokens:[['comment','\nx'],['done']]},
    {html:'<!--\nx\n-->',tokens:[['comment','\nx\n'],['done']]},
    {html:'<!--',tokens:[['done']]},
    {html:'<!--x',tokens:[['comment','x'],['done']]},
    {html:'<!--x-- >',tokens:[['comment','x-- >'],['done']]},
    {html:'<!--x-->\n<!-- yz -->',tokens:[['comment','x'],['text','\n'],['comment',' yz '],['done']]},
    {html:'-->',tokens:[['text','-->'],['done']]},
    {html:'<!---->',tokens:[['comment',''],['done']]},
    {html:'<!--<!---->',tokens:[['comment','<!--'],['done']]},
    {html:'<span><!--x--></p>',tokens:[['opening-tag','span'],['opening-tag-end','span','>'],['comment','x'],['closing-tag','p'],['done']]},
    {html:'<',tokens:[['text','<'],['done']]},
    {html:'>',tokens:[['text','>'],['done']]},
    {html:'<<<',tokens:[['text','<<<'],['done']]},
    {html:'<><=',tokens:[['text','<><='],['done']]},
    {html:'<a><b><c>x',tokens:[['opening-tag','a'],['opening-tag-end','a','>'],['opening-tag','b'],['opening-tag-end','b','>'],['opening-tag','c'],['opening-tag-end','c','>'],['text','x'],['done']]},
    {html:'</b></b>',tokens:[['closing-tag','b'],['closing-tag','b'],['done']]},
    {html:'<!doctype html><html>',tokens:[['text','<!doctype html>'],['opening-tag','html'],['opening-tag-end','html','>'],['done']]},
    {html:'<foo',tokens:[['opening-tag','foo'],['done']]},
    {html:'<foo <foo',tokens:[['opening-tag','foo'],['done']]},
    {html:'<foo <foo/> hello',tokens:[['opening-tag','foo'],['done']]},
    {html:'yes &amp; no',tokens:[['text','yes & no'],['done']]},
    {html:'yes &quot; no',tokens:[['text','yes " no'],['done']]},
    {html:'yes &lt; no',tokens:[['text','yes < no'],['done']]},
    {html:'yes &gt; no',tokens:[['text','yes > no'],['done']]},
    {html:'yes &#183; no',tokens:[['text','yes · no'],['done']]},
    {html:'&lt;img/&gt;',tokens:[['text','<img/>'],['done']]},
    {html:'&quot;hello&quot;',tokens:[['text','"hello"'],['done']]},
    {html:'</bar>',tokens:[['closing-tag','bar'],['done']]},
    {html:'</ bar>',tokens:[['text','</ bar>'],['done']]},
    {html:'&#931;',tokens:[['text','\u03A3'],['done']]},
    {html:'&#0931;',tokens:[['text','\u03A3'],['done']]},
    {html:'&#x3A3;',tokens:[['text','\u03A3'],['done']]},
    {html:'&#x03A3;',tokens:[['text','\u03A3'],['done']]},
    {html:'&#x3a3;',tokens:[['text','\u03A3'],['done']]},
    {html:'&#xC6;',tokens:[['text','\u00C6'],['done']]},
    {html:'&nbsp;',tokens:[['text','\u00A0'],['done']]},
    {html:'&#160;&#160;&#160;',tokens:[['text','\u00A0\u00A0\u00A0'],['done']]},
    {html:'&copy;',tokens:[['text','&copy;'],['done']]},
    {html:'&copy;',tokens:[['text','\u00A9'],['done']],entities:{copy:'\u00A9'}},
    {html:'<foo:bar>',tokens:[['opening-tag','foo:bar'],['opening-tag-end','foo:bar','>'],['done']]},
    {html:'</foo:bar>',tokens:[['closing-tag','foo:bar'],['done']]},
    {html:'<foo:bar></foo:bar>',tokens:[['opening-tag','foo:bar'],['opening-tag-end','foo:bar','>'],['closing-tag','foo:bar'],['done']]},
    {html:'<script></script>',tokens:[['opening-tag','script'],['opening-tag-end','script','>'],['closing-tag','script'],['done']]},
    {html:'<script>alert("hello")</script>',tokens:[['opening-tag','script'],['opening-tag-end','script','>'],['text','alert("hello")'],['closing-tag','script'],['done']]},
    {html:'<script>for (var n=10,i=0; i<n; i++);</script>',tokens:[['opening-tag','script'],['opening-tag-end','script','>'],['text','for (var n=10,i=0; i<n; i++);'],['closing-tag','script'],['done']]},
    {html:'<script>\nfor (var n=10,i=0; i<n; i++);\n</script>',tokens:[['opening-tag','script'],['opening-tag-end','script','>'],['text','\nfor (var n=10,i=0; i<n; i++);\n'],['closing-tag','script'],['done']]},
    {html:'<script>alert("</script>")</script>',tokens:[['opening-tag','script'],['opening-tag-end','script','>'],['text','alert("'],['closing-tag','script'],['text','")'],['closing-tag','script'],['done']]},
    {html:'<script>alert("</scr"+"ipt>")</script>',tokens:[['opening-tag','script'],['opening-tag-end','script','>'],['text','alert("</scr"+"ipt>")'],['closing-tag','script'],['done']]},
  ].forEach(function(item) {
    it('should tokenize ' + JSON.stringify(item.html) + (item.entities?' with entities':''), function() {
      var result = collector(item.html, function(tkzr) {
        if (item.entities) {
          tkzr.entities(item.entities)
        }
      })
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
    assert.deepEqual(result, [['opening-tag','br'],['cancel']])
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

  describe('parser', function(){

    ;[{html:'',events:[['done']]},
      {html:'<br>',events:[['open','br',{}],['close','br'],['done']]},
      {html:'<br/>',events:[['open','br',{}],['close','br'],['done']]},
      {html:'<p>',events:[['open','p',{}],['close','p'],['done']]},
      {html:'<p>hello',events:[['open','p',{}],['text','hello'],['close','p'],['done']]},
      {html:'<p/>hello',events:[['open','p',{}],['close','p'],['text','hello'],['done']]},
      {html:'<b><i><u>',events:[['open','b',{}],['open','i',{}],['open','u',{}],['close','u'],['close','i'],['close','b'],['done']]},
      {html:'<b><i><u></u></i></b>',events:[['open','b',{}],['open','i',{}],['open','u',{}],['close','u'],['close','i'],['close','b'],['done']]},
      {html:'<b><i>what<u></u></i></b>',events:[['open','b',{}],['open','i',{}],['text','what'],['open','u',{}],['close','u'],['close','i'],['close','b'],['done']]},
      {html:'<br>foo</br>',events:[['open','br',{}],['close','br'],['text','foo'],['done']]},
      {html:'<br class="xyz">',events:[['open','br',{class:'xyz'}],['close','br'],['done']]},
      {html:'<br id=" foo-bar" class="xyz">',events:[['open','br',{id:' foo-bar',class:'xyz'}],['close','br'],['done']]},
      {html:'<br id=\' foo-bar\' class=\'xyz\'>',events:[['open','br',{id:' foo-bar',class:'xyz'}],['close','br'],['done']]},
      {html:'<br id=foo-bar class=xyz>',events:[['open','br',{id:'foo-bar',class:'xyz'}],['close','br'],['done']]},
      {html:'<br id\n   \t=\r\nfoo-bar class\n=\txyz>',events:[['open','br',{id:'foo-bar',class:'xyz'}],['close','br'],['done']]},
      {html:'<br>>>',events:[['open','br',{}],['close','br'],['text','>>'],['done']]},
      {html:'<<<br>',events:[['text','<<'],['open','br',{}],['close','br'],['done']]},
      {html:'<b></b></pre>',events:[['open','b',{}],['close','b'],['done']]},
      {html:'<b></b></pre>hello',events:[['open','b',{}],['close','b'],['text','hello'],['done']]},
      {html:'<b></pre>',events:[['open','b',{}],['close','b'],['done']]},
      {html:'<pre',events:[['done']]},
      {html:'<pre ',events:[['done']]},
      {html:'zz<pre',events:[['text','zz'],['done']]},
      {html:'< br>',events:[['text','< br>'],['done']]},
      {html:'</br>',events:[['done']]},
      {html:'<!---->',events:[['comment',''],['done']]},
      {html:'<!--x-->',events:[['comment','x'],['done']]},
      {html:'<!--\nx\n-->',events:[['comment','\nx\n'],['done']]},
      {html:'<!--x-- >',events:[['comment','x-- >'],['done']]},
      {html:'<foo:bar>',events:[['open','foo:bar',{}],['close','foo:bar'],['done']]},
      {html:'</foo:bar>',events:[['done']]},
      {html:'<foo:bar></foo:bar>',events:[['open','foo:bar',{}],['close','foo:bar'],['done']]},
      {html:'<foo:bar yes="yes"></foo:bar>',events:[['open','foo:bar',{yes:'yes'}],['close','foo:bar'],['done']]},
      {html:'<script type="text/javascript"></script>',events:[['open','script',{type:'text/javascript'}],['close','script'],['done']]},
      {html:'<script>alert("hello")</script>',events:[['open','script',{}],['text','alert("hello")'],['close','script'],['done']]},
      {html:'<script>for (var n=10,i=0; i<n; i++);</script>',events:[['open','script',{}],['text','for (var n=10,i=0; i<n; i++);'],['close','script'],['done']]},
      {html:'<script>\nfor (var n=10,i=0; i<n; i++);\n</script>',events:[['open','script',{}],['text','\nfor (var n=10,i=0; i<n; i++);\n'],['close','script'],['done']]},
      {html:'<script><foo<foo<foo</script>',events:[['open','script',{}],['text','<foo<foo<foo'],['close','script'],['done']]},
      {html:'<script><![CDATA[ blah >> ]]></script>',events:[['open','script',{}],['text','<![CDATA[ blah >> ]]>'],['close','script'],['done']]},
      {html:'<script><!--//--></script>',events:[['open','script',{}],['text','<!--//-->'],['close','script'],['done']]},
      {html:'<script>\n<!--\n//-->\n</script>',events:[['open','script',{}],['text','\n<!--\n//-->\n'],['close','script'],['done']]},
      {html:'<script>alert("</script>")</script>',events:[['open','script',{}],['text','alert("'],['close','script'],['text','")'],['done']]},
      {html:'<script>alert("</scr"+"ipt>")</script>',events:[['open','script',{}],['text','alert("</scr"+"ipt>")'],['close','script'],['done']]},
      {html:'<script defer>',events:[['open','script',{defer:''}],['close','script'],['done']]},
    ].forEach(function(item) {
      it('should parse '+JSON.stringify(item.html), function() {
        var events = parserCollector(item.html)
        assert.deepEqual(events, item.events)
      })
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
      parser.on('open', function(name, atts) {
        content.push('<' + name + attify(atts) + '>')
      })
      parser.on('close', function(name) {
        content.push('</' + name + '>')
      })
      parser.on('text', function(val) {
        content.push(val)
      })
      parser.parse(page)
      content = content.join('')
      //assert.strictEqual(content, page)
    })
  })
})

function parserCollector(html) {
  var result = [];
  var parser = new Parser()
  ;['open','close','text','comment','done'].forEach(function(ev) {
    parser.on(ev, function() {
      var args = [].slice.call(arguments)
      args.unshift(ev)
      result.push(args)
    })
  })
  parser.parse(html)
  return result
}

function collector(html, cb) {
  var result = [];
  var tkzr = makeTokListener(function(args) {
    result.push(args)
  })
  if (cb) { cb(tkzr) }
  tkzr.tokenize(html)
  return result
}

function makeTokListener(cb) {
  var tkzr = new Tokenizer()
  ;['opening-tag','attribute','text','comment','opening-tag-end','closing-tag','done','cancel'].forEach(function(ev) {
    tkzr.on(ev, function() {
      var args = [].slice.call(arguments)
      args.unshift(ev)
      cb(args)
    })
  })
  return tkzr
}
