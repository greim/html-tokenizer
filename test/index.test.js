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
  ;[{html:'',events:'start,done'},
    {html:'hello',events:'start,text,hello,done'},
    {html:'<i>hello',events:'start,opening-tag,i,opening-tag-end,i,>,text,hello,done'},
    {html:'<br/>',events:'start,opening-tag,br,opening-tag-end,br,/>,done'},
    {html:'<br><br/>',events:'start,opening-tag,br,opening-tag-end,br,>,opening-tag,br,opening-tag-end,br,/>,done'},
    {html:'<br />',events:'start,opening-tag,br,opening-tag-end,br,/>,done'},
    {html:'hello <br>',events:'start,text,hello ,opening-tag,br,opening-tag-end,br,>,done'},
    {html:'<i>hello',events:'start,opening-tag,i,opening-tag-end,i,>,text,hello,done'},
    {html:'yes <br> hello',events:'start,text,yes ,opening-tag,br,opening-tag-end,br,>,text, hello,done'},
    {html:'<p>hello</p>',events:'start,opening-tag,p,opening-tag-end,p,>,text,hello,closing-tag,p,done'},
    {html:'<p><br>hello</p>',events:'start,opening-tag,p,opening-tag-end,p,>,opening-tag,br,opening-tag-end,br,>,text,hello,closing-tag,p,done'},
    {html:'<br foo>',events:'start,opening-tag,br,attribute,foo,,opening-tag-end,br,>,done'},
    {html:'<br foo=>',events:'start,opening-tag,br,attribute,foo,,opening-tag-end,br,>,done'},
    {html:'<br foo=bar>',events:'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html:'<br foo =bar>',events:'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html:'<br foo= bar>',events:'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html:'<br foo = bar>',events:'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html:'<br foo=\'bar\'>',events:'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html:'<br foo="bar> hello <br>',events:'start,opening-tag,br,attribute,foo,bar> hello <br>,done'},
    {html:'<br foo=bar=baz>',events:'start,opening-tag,br,attribute,foo,bar=baz,opening-tag-end,br,>,done'},
    {html:'<br foo="bar">',events:'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html:'<br foo= "bar">',events:'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html:'<br foo ="bar">',events:'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html:'<br foo = "bar">',events:'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html:'<br foo="bar" baz="qux">',events:'start,opening-tag,br,attribute,foo,bar,attribute,baz,qux,opening-tag-end,br,>,done'},
    {html:'<br foo="bar" baz=\'qux\'>',events:'start,opening-tag,br,attribute,foo,bar,attribute,baz,qux,opening-tag-end,br,>,done'},
    {html:'<br\nfoo="bar"\nbaz="qux">',events:'start,opening-tag,br,attribute,foo,bar,attribute,baz,qux,opening-tag-end,br,>,done'},
    {html:'<input autofocus>',events:'start,opening-tag,input,attribute,autofocus,,opening-tag-end,input,>,done'},
    {html:'<!--x-->',events:'start,comment,x,done'},
    {html:'<!--x\n-->',events:'start,comment,x\n,done'},
    {html:'<!--\nx-->',events:'start,comment,\nx,done'},
    {html:'<!--\nx\n-->',events:'start,comment,\nx\n,done'},
    {html:'<!--',events:'start,done'},
    {html:'<!--x',events:'start,comment,x,done'},
    {html:'<!--x-- >',events:'start,comment,x-- >,done'},
    {html:'<!--x-->\n<!-- yz -->',events:'start,comment,x,text,\n,comment, yz ,done'},
    {html:'-->',events:'start,text,-->,done'},
    {html:'<!---->',events:'start,comment,,done'},
    {html:'<!--<!---->',events:'start,comment,<!--,done'},
    {html:'<span><!--x--></p>',events:'start,opening-tag,span,opening-tag-end,span,>,comment,x,closing-tag,p,done'},
    {html:'<',events:'start,text,<,done'},
    {html:'>',events:'start,text,>,done'},
    {html:'<<<',events:'start,text,<<<,done'},
    {html:'<><=',events:'start,text,<><=,done'},
    {html:'<a><b><c>x',events:'start,opening-tag,a,opening-tag-end,a,>,opening-tag,b,opening-tag-end,b,>,opening-tag,c,opening-tag-end,c,>,text,x,done'},
    {html:'</b></b>',events:'start,closing-tag,b,closing-tag,b,done'},
    {html:'<!doctype html><html>',events:'start,text,<!doctype html>,opening-tag,html,opening-tag-end,html,>,done'},
    {html:'<foo',events:'start,opening-tag,foo,done'},
    {html:'<foo<bar',events:'start,opening-tag,foo,opening-tag,bar,done'},
    {html:'<foo <foo',events:'start,opening-tag,foo,text, ,opening-tag,foo,done'},
    {html:'<foo <foo/> hello',events:'start,opening-tag,foo,text, ,opening-tag,foo,opening-tag-end,foo,/>,text, hello,done'},
    {html:'yes &amp; no',events:'start,text,yes & no,done'},
    {html:'yes &quot; no',events:'start,text,yes " no,done'},
    {html:'yes &lt; no',events:'start,text,yes < no,done'},
    {html:'yes &gt; no',events:'start,text,yes > no,done'},
    {html:'yes &#183; no',events:'start,text,yes · no,done'},
    {html:'&lt;img/&gt;',events:'start,text,<img/>,done'},
    {html:'&quot;hello&quot;',events:'start,text,"hello",done'},
    {html:'</bar>',events:'start,closing-tag,bar,done'},
    {html:'</ bar>',events:'start,text,</ bar>,done'},
    {html:'&#931;',events:'start,text,\u03A3,done'},
    {html:'&#0931;',events:'start,text,\u03A3,done'},
    {html:'&#x3A3;',events:'start,text,\u03A3,done'},
    {html:'&#x03A3;',events:'start,text,\u03A3,done'},
    {html:'&#x3a3;',events:'start,text,\u03A3,done'},
    {html:'&#xC6;',events:'start,text,\u00C6,done'},
    {html:'&nbsp;',events:'start,text,\u00A0,done'},
    {html:'&#160;&#160;&#160;',events:'start,text,\u00A0\u00A0\u00A0,done'},
    {html:'&copy;',events:'start,text,&copy;,done'},
    {html:'&copy;',events:'start,text,\u00A9,done',entities:{copy:'\u00A9'}},
    {html:'<foo:bar>',events:'start,opening-tag,foo:bar,opening-tag-end,foo:bar,>,done'},
    {html:'</foo:bar>',events:'start,closing-tag,foo:bar,done'},
    {html:'<foo:bar></foo:bar>',events:'start,opening-tag,foo:bar,opening-tag-end,foo:bar,>,closing-tag,foo:bar,done'},
    {html:'<script></script>',events:'start,opening-tag,script,opening-tag-end,script,>,closing-tag,script,done'},
    {html:'<script>alert("hello")</script>',events:'start,opening-tag,script,opening-tag-end,script,>,text,alert("hello"),closing-tag,script,done'},
    {html:'<script>for (var n=10,i=0; i<n; i++);</script>',events:'start,opening-tag,script,opening-tag-end,script,>,text,for (var n=10,i=0; i<n; i++);,closing-tag,script,done'},
    {html:'<script>\nfor (var n=10,i=0; i<n; i++);\n</script>',events:'start,opening-tag,script,opening-tag-end,script,>,text,\nfor (var n=10,i=0; i<n; i++);\n,closing-tag,script,done'},
    {html:'<script>alert("</script>")</script>',events:'start,opening-tag,script,opening-tag-end,script,>,text,alert(",closing-tag,script,text,"),closing-tag,script,done'},
    {html:'<script>alert("</scr"+"ipt>")</script>',events:'start,opening-tag,script,opening-tag-end,script,>,text,alert("</scr"+"ipt>"),closing-tag,script,done'},
    {html:'<div><p></div><b>',events:'start,opening-tag,div,opening-tag-end,div,>,opening-tag,p,opening-tag-end,p,>,closing-tag,div,opening-tag,b,opening-tag-end,b,>,done'},
  ].forEach(function(item) {
    (item.only?it.only:it)('should tokenize ' + JSON.stringify(item.html) + (item.entities?' with entities':''), function() {
      var result = collector(item.html, null, item.entities)
      //console.log(JSON.stringify(result))
      //console.log(JSON.stringify(item.events))
      assert.strictEqual(result, item.events)
    })
  })

  it('should cancel', function() {
    var result = collector('<br> foo', function(tkzr) {
      tkzr.on('opening-tag', function() {
        tkzr.cancel()
      })
    })
    assert.strictEqual(result, 'start,opening-tag,br,cancel')
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

    ;[{html:'',events:'start,done'},
      {html:'<br>',events:'start,open,br,{},true,close,br,true,done'},
      {html:'<br/>',events:'start,open,br,{},true,close,br,true,done'},
      {html:'<p>',events:'start,open,p,{},false,close,p,false,done'},
      {html:'<p>hello',events:'start,open,p,{},false,text,hello,close,p,false,done'},
      {html:'<p/>hello',events:'start,open,p,{},true,close,p,true,text,hello,done'},
      {html:'<b><i><u>',events:'start,open,b,{},false,open,i,{},false,open,u,{},false,close,u,false,close,i,false,close,b,false,done'},
      {html:'<b><i><u></u></i></b>',events:'start,open,b,{},false,open,i,{},false,open,u,{},false,close,u,false,close,i,false,close,b,false,done'},
      {html:'<b><i>what<u></u></i></b>',events:'start,open,b,{},false,open,i,{},false,text,what,open,u,{},false,close,u,false,close,i,false,close,b,false,done'},
      {html:'<br>foo</br>',events:'start,open,br,{},true,close,br,true,text,foo,done'},
      {html:'<br class="xyz">',events:'start,open,br,{"class":"xyz"},true,close,br,true,done'},
      {html:'<br id=" foo-bar" class="xyz">',events:'start,open,br,{"id":" foo-bar","class":"xyz"},true,close,br,true,done'},
      {html:'<br id=\' foo-bar\' class=\'xyz\'>',events:'start,open,br,{"id":" foo-bar","class":"xyz"},true,close,br,true,done'},
      {html:'<br id=foo-bar class=xyz>',events:'start,open,br,{"id":"foo-bar","class":"xyz"},true,close,br,true,done'},
      {html:'<br id\n   \t=\r\nfoo-bar class\n=\txyz>',events:'start,open,br,{"id":"foo-bar","class":"xyz"},true,close,br,true,done'},
      {html:'<br>>>',events:'start,open,br,{},true,close,br,true,text,>>,done'},
      {html:'<<<br>',events:'start,text,<<,open,br,{},true,close,br,true,done'},
      {html:'<b></b></pre>',events:'start,open,b,{},false,close,b,false,done'},
      {html:'<b></b></pre>hello',events:'start,open,b,{},false,close,b,false,text,hello,done'},
      {html:'<b></pre>',events:'start,open,b,{},false,close,b,false,done'},
      {html:'<pre',events:'start,done'},
      {html:'<pre ',events:'start,text, ,done'},
      {html:'zz<pre',events:'start,text,zz,done'},
      {html:'< br>',events:'start,text,< br>,done'},
      {html:'</br>',events:'start,done'},
      {html:'<!---->',events:'start,comment,,done'},
      {html:'<!--x-->',events:'start,comment,x,done'},
      {html:'<!--\nx\n-->',events:'start,comment,\nx\n,done'},
      {html:'<!--x-- >',events:'start,comment,x-- >,done'},
      {html:'<foo:bar>',events:'start,open,foo:bar,{},false,close,foo:bar,false,done'},
      {html:'</foo:bar>',events:'start,done'},
      {html:'<foo:bar></foo:bar>',events:'start,open,foo:bar,{},false,close,foo:bar,false,done'},
      {html:'<foo:bar yes="yes"></foo:bar>',events:'start,open,foo:bar,{"yes":"yes"},false,close,foo:bar,false,done'},
      {html:'<script type="text/javascript"></script>',events:'start,open,script,{"type":"text/javascript"},false,close,script,false,done'},
      {html:'<script>alert("hello")</script>',events:'start,open,script,{},false,text,alert("hello"),close,script,false,done'},
      {html:'<script>for (var n=10,i=0; i<n; i++);</script>',events:'start,open,script,{},false,text,for (var n=10,i=0; i<n; i++);,close,script,false,done'},
      {html:'<script>\nfor (var n=10,i=0; i<n; i++);\n</script>',events:'start,open,script,{},false,text,\nfor (var n=10,i=0; i<n; i++);\n,close,script,false,done'},
      {html:'<script><foo<foo<foo</script>',events:'start,open,script,{},false,text,<foo<foo<foo,close,script,false,done'},
      {html:'<script><![CDATA[ blah >> ></script>',events:'start,open,script,{},false,text,<![CDATA[ blah >> >,close,script,false,done'},
      {html:'<script><!--//--></script>',events:'start,open,script,{},false,text,<!--//-->,close,script,false,done'},
      {html:'<script>\n<!--\n//-->\n</script>',events:'start,open,script,{},false,text,\n<!--\n//-->\n,close,script,false,done'},
      {html:'<script>alert("</script>")</script>',events:'start,open,script,{},false,text,alert(",close,script,false,text,"),done'},
      {html:'<script>alert("</scr"+"ipt>")</script>',events:'start,open,script,{},false,text,alert("</scr"+"ipt>"),close,script,false,done'},
      {html:'<script defer>',events:'start,open,script,{"defer":""},false,close,script,false,done'},
      {html:'<foo<foo<foo/>',events:'start,open,foo,{},true,close,foo,true,done'},
      {html:'<foo<foo<foo/>>>',events:'start,open,foo,{},true,close,foo,true,text,>>,done'},

      //An li element's end tag may be omitted if the li element is immediately followed by another li element or if there is no more content in the parent element.
      {html:'<ul><li></li></ul>',events:'start,open,ul,{},false,open,li,{},false,close,li,false,close,ul,false,done'},
      // ----------------------
      {html:'<ul><li></ul>',events:'start,open,ul,{},false,open,li,{},false,close,li,false,close,ul,false,done'},
      {html:'<ul><li><li></ul>',events:'start,open,ul,{},false,open,li,{},false,close,li,false,open,li,{},false,close,li,false,close,ul,false,done'},
      {html:'<ul><li>a<li>b</ul>',events:'start,open,ul,{},false,open,li,{},false,text,a,close,li,false,open,li,{},false,text,b,close,li,false,close,ul,false,done'},

      //A dt element's end tag may be omitted if the dt element is immediately followed by another dt element or a dd element.
      {html:'<dl><dt></dt><dd></dd></dl>',events:'start,open,dl,{},false,open,dt,{},false,close,dt,false,open,dd,{},false,close,dd,false,close,dl,false,done'},
      // ----------------------
      {html:'<dl><dt><dd></dd></dl>',events:'start,open,dl,{},false,open,dt,{},false,close,dt,false,open,dd,{},false,close,dd,false,close,dl,false,done'},
      {html:'<dl><dt><dt></dt></dl>',events:'start,open,dl,{},false,open,dt,{},false,close,dt,false,open,dt,{},false,close,dt,false,close,dl,false,done'},

      //A dd element's end tag may be omitted if the dd element is immediately followed by another dd element or a dt element, or if there is no more content in the parent element.
      {html:'<dl><dd></dd></dl>',events:'start,open,dl,{},false,open,dd,{},false,close,dd,false,close,dl,false,done'},
      // ----------------------
      {html:'<dl><dd></dl>',events:'start,open,dl,{},false,open,dd,{},false,close,dd,false,close,dl,false,done'},
      {html:'<dl><dd><dd></dl>',events:'start,open,dl,{},false,open,dd,{},false,close,dd,false,open,dd,{},false,close,dd,false,close,dl,false,done'},
      {html:'<dl><dd><dt></dt></dl>',events:'start,open,dl,{},false,open,dd,{},false,close,dd,false,open,dt,{},false,close,dt,false,close,dl,false,done'},

      //A p element's end tag may be omitted if the p element is immediately followed by an address, article, aside, blockquote, div, dl, fieldset, footer, form, h1, h2, h3, h4, h5, h6, header, hgroup, hr, main, nav, ol, p, pre, section, table, ul, or if there is no more content in the parent element and the parent element is not an a element.
      {html:'<div><p></p></div><b>',events:'start,open,div,{},false,open,p,{},false,close,p,false,close,div,false,open,b,{},false,close,b,false,done'},
      {html:'<p></p><p></p>',events:'start,open,p,{},false,close,p,false,open,p,{},false,close,p,false,done'},
      {html:'<p><a>',events:'start,open,p,{},false,open,a,{},false,close,a,false,close,p,false,done'},
      {html:'<div><a></div><a>',events:'start,open,div,{},false,open,a,{},false,open,a,{},false,close,a,false,close,a,false,close,div,false,done'},
      // ----------------------
      {html:'<div><p></div><b>',events:'start,open,div,{},false,open,p,{},false,close,p,false,close,div,false,open,b,{},false,close,b,false,done'},
      {html:'<p><address>',events:'start,open,p,{},false,close,p,false,open,address,{},false,close,address,false,done'},
      {html:'<p><article>',events:'start,open,p,{},false,close,p,false,open,article,{},false,close,article,false,done'},
      {html:'<p><aside>',events:'start,open,p,{},false,close,p,false,open,aside,{},false,close,aside,false,done'},
      {html:'<p><blockquote>',events:'start,open,p,{},false,close,p,false,open,blockquote,{},false,close,blockquote,false,done'},
      {html:'<p><div>',events:'start,open,p,{},false,close,p,false,open,div,{},false,close,div,false,done'},
      {html:'<p><dl>',events:'start,open,p,{},false,close,p,false,open,dl,{},false,close,dl,false,done'},
      {html:'<p><fieldset>',events:'start,open,p,{},false,close,p,false,open,fieldset,{},false,close,fieldset,false,done'},
      {html:'<p><footer>',events:'start,open,p,{},false,close,p,false,open,footer,{},false,close,footer,false,done'},
      {html:'<p><form>',events:'start,open,p,{},false,close,p,false,open,form,{},false,close,form,false,done'},
      {html:'<p><h1>',events:'start,open,p,{},false,close,p,false,open,h1,{},false,close,h1,false,done'},
      {html:'<p><h2>',events:'start,open,p,{},false,close,p,false,open,h2,{},false,close,h2,false,done'},
      {html:'<p><h3>',events:'start,open,p,{},false,close,p,false,open,h3,{},false,close,h3,false,done'},
      {html:'<p><h4>',events:'start,open,p,{},false,close,p,false,open,h4,{},false,close,h4,false,done'},
      {html:'<p><h5>',events:'start,open,p,{},false,close,p,false,open,h5,{},false,close,h5,false,done'},
      {html:'<p><h6>',events:'start,open,p,{},false,close,p,false,open,h6,{},false,close,h6,false,done'},
      {html:'<p><header>',events:'start,open,p,{},false,close,p,false,open,header,{},false,close,header,false,done'},
      {html:'<p><hgroup>',events:'start,open,p,{},false,close,p,false,open,hgroup,{},false,close,hgroup,false,done'},
      {html:'<p><hr>',events:'start,open,p,{},false,close,p,false,open,hr,{},true,close,hr,true,done'},
      {html:'<p><main>',events:'start,open,p,{},false,close,p,false,open,main,{},false,close,main,false,done'},
      {html:'<p><nav>',events:'start,open,p,{},false,close,p,false,open,nav,{},false,close,nav,false,done'},
      {html:'<p><ol>',events:'start,open,p,{},false,close,p,false,open,ol,{},false,close,ol,false,done'},
      {html:'<p><p>',events:'start,open,p,{},false,close,p,false,open,p,{},false,close,p,false,done'},
      {html:'<p><pre>',events:'start,open,p,{},false,close,p,false,open,pre,{},false,close,pre,false,done'},
      {html:'<p><section>',events:'start,open,p,{},false,close,p,false,open,section,{},false,close,section,false,done'},
      {html:'<p><table>',events:'start,open,p,{},false,close,p,false,open,table,{},false,close,table,false,done'},
      {html:'<p><ul>',events:'start,open,p,{},false,close,p,false,open,ul,{},false,close,ul,false,done'},
      {html:'<p><ul>',events:'start,open,p,{},false,close,p,false,open,ul,{},false,close,ul,false,done'},

      //An rb element's end tag may be omitted if the rb element is immediately followed by an rb, rt, rtc or rp element, or if there is no more content in the parent element.
      {html:'<rb></rb>a',events:'start,open,rb,{},false,close,rb,false,text,a,done'},
      {html:'<rb></rb><rb></rb>a',events:'start,open,rb,{},false,close,rb,false,open,rb,{},false,close,rb,false,text,a,done'},
      {html:'<rb></rb><rt></rt>a',events:'start,open,rb,{},false,close,rb,false,open,rt,{},false,close,rt,false,text,a,done'},
      {html:'<rb></rb><rtc></rtc>a',events:'start,open,rb,{},false,close,rb,false,open,rtc,{},false,close,rtc,false,text,a,done'},
      {html:'<rb></rb><rp></rp>a',events:'start,open,rb,{},false,close,rb,false,open,rp,{},false,close,rp,false,text,a,done'},
      {html:'<x><rb></rb></x>a',events:'start,open,x,{},false,open,rb,{},false,close,rb,false,close,x,false,text,a,done'},
      {html:'<x><rb><foo></x>a',events:'start,open,x,{},false,open,rb,{},false,open,foo,{},false,text,a,close,foo,false,close,rb,false,close,x,false,done'},
      // ----------------------
      {html:'<rb><rb></rb>a',events:'start,open,rb,{},false,close,rb,false,open,rb,{},false,close,rb,false,text,a,done'},
      {html:'<rb><rt></rt>a',events:'start,open,rb,{},false,close,rb,false,open,rt,{},false,close,rt,false,text,a,done'},
      {html:'<rb><rtc></rtc>a',events:'start,open,rb,{},false,close,rb,false,open,rtc,{},false,close,rtc,false,text,a,done'},
      {html:'<rb><rp></rp>a',events:'start,open,rb,{},false,close,rb,false,open,rp,{},false,close,rp,false,text,a,done'},
      {html:'<x><rb></x>a',events:'start,open,x,{},false,open,rb,{},false,close,rb,false,close,x,false,text,a,done'},

      //An rt element's end tag may be omitted if the rt element is immediately followed by an rb, rt, rtc, or rp element, or if there is no more content in the parent element.
      {html:'<rt></rt>a',events:'start,open,rt,{},false,close,rt,false,text,a,done'},
      {html:'<rt></rt><rb></rb>a',events:'start,open,rt,{},false,close,rt,false,open,rb,{},false,close,rb,false,text,a,done'},
      {html:'<rt></rt><rt></rt>a',events:'start,open,rt,{},false,close,rt,false,open,rt,{},false,close,rt,false,text,a,done'},
      {html:'<rt></rt><rtc></rtc>a',events:'start,open,rt,{},false,close,rt,false,open,rtc,{},false,close,rtc,false,text,a,done'},
      {html:'<rt></rt><rp></rp>a',events:'start,open,rt,{},false,close,rt,false,open,rp,{},false,close,rp,false,text,a,done'},
      {html:'<x><rt></rt></x>a',events:'start,open,x,{},false,open,rt,{},false,close,rt,false,close,x,false,text,a,done'},
      {html:'<x><rt><foo></x>a',events:'start,open,x,{},false,open,rt,{},false,open,foo,{},false,text,a,close,foo,false,close,rt,false,close,x,false,done'},
      // ----------------------
      {html:'<rt><rb></rb>a',events:'start,open,rt,{},false,close,rt,false,open,rb,{},false,close,rb,false,text,a,done'},
      {html:'<rt><rt></rt>a',events:'start,open,rt,{},false,close,rt,false,open,rt,{},false,close,rt,false,text,a,done'},
      {html:'<rt><rtc></rtc>a',events:'start,open,rt,{},false,close,rt,false,open,rtc,{},false,close,rtc,false,text,a,done'},
      {html:'<rt><rp></rp>a',events:'start,open,rt,{},false,close,rt,false,open,rp,{},false,close,rp,false,text,a,done'},
      {html:'<x><rt></x>a',events:'start,open,x,{},false,open,rt,{},false,close,rt,false,close,x,false,text,a,done'},

      //An rtc element's end tag may be omitted if the rtc element is immediately followed by an rb, rtc or rp element, or if there is no more content in the parent element.
      {html:'<rtc></rtc>a',events:'start,open,rtc,{},false,close,rtc,false,text,a,done'},
      {html:'<rtc></rtc><rb></rb>a',events:'start,open,rtc,{},false,close,rtc,false,open,rb,{},false,close,rb,false,text,a,done'},
      {html:'<rtc></rtc><rtc></rtc>a',events:'start,open,rtc,{},false,close,rtc,false,open,rtc,{},false,close,rtc,false,text,a,done'},
      {html:'<rtc></rtc><rp></rp>a',events:'start,open,rtc,{},false,close,rtc,false,open,rp,{},false,close,rp,false,text,a,done'},
      {html:'<x><rtc></rtc></x>a',events:'start,open,x,{},false,open,rtc,{},false,close,rtc,false,close,x,false,text,a,done'},
      {html:'<x><rtc><foo></x>a',events:'start,open,x,{},false,open,rtc,{},false,open,foo,{},false,text,a,close,foo,false,close,rtc,false,close,x,false,done'},
      // ----------------------
      {html:'<rtc><rb></rb>a',events:'start,open,rtc,{},false,close,rtc,false,open,rb,{},false,close,rb,false,text,a,done'},
      {html:'<rtc><rtc></rtc>a',events:'start,open,rtc,{},false,close,rtc,false,open,rtc,{},false,close,rtc,false,text,a,done'},
      {html:'<rtc><rp></rp>a',events:'start,open,rtc,{},false,close,rtc,false,open,rp,{},false,close,rp,false,text,a,done'},
      {html:'<x><rtc></x>a',events:'start,open,x,{},false,open,rtc,{},false,close,rtc,false,close,x,false,text,a,done'},

      //An rp element's end tag may be omitted if the rp element is immediately followed by an rb, rt, rtc or rp element, or if there is no more content in the parent element.
      {html:'<rp></rp>a',events:'start,open,rp,{},false,close,rp,false,text,a,done'},
      {html:'<rp></rp><rb></rb>a',events:'start,open,rp,{},false,close,rp,false,open,rb,{},false,close,rb,false,text,a,done'},
      {html:'<rp></rp><rt></rt>a',events:'start,open,rp,{},false,close,rp,false,open,rt,{},false,close,rt,false,text,a,done'},
      {html:'<rp></rp><rtc></rtc>a',events:'start,open,rp,{},false,close,rp,false,open,rtc,{},false,close,rtc,false,text,a,done'},
      {html:'<rp></rp><rp></rp>a',events:'start,open,rp,{},false,close,rp,false,open,rp,{},false,close,rp,false,text,a,done'},
      {html:'<x><rp></rp></x>a',events:'start,open,x,{},false,open,rp,{},false,close,rp,false,close,x,false,text,a,done'},
      {html:'<x><rp><foo></x>a',events:'start,open,x,{},false,open,rp,{},false,open,foo,{},false,text,a,close,foo,false,close,rp,false,close,x,false,done'},
      // ----------------------
      {html:'<rp><rb></rb>a',events:'start,open,rp,{},false,close,rp,false,open,rb,{},false,close,rb,false,text,a,done'},
      {html:'<rp><rt></rt>a',events:'start,open,rp,{},false,close,rp,false,open,rt,{},false,close,rt,false,text,a,done'},
      {html:'<rp><rtc></rtc>a',events:'start,open,rp,{},false,close,rp,false,open,rtc,{},false,close,rtc,false,text,a,done'},
      {html:'<rp><rp></rp>a',events:'start,open,rp,{},false,close,rp,false,open,rp,{},false,close,rp,false,text,a,done'},
      {html:'<x><rp></x>a',events:'start,open,x,{},false,open,rp,{},false,close,rp,false,close,x,false,text,a,done'},

      //An optgroup element's end tag may be omitted if the optgroup element is immediately followed by another optgroup element, or if there is no more content in the parent element.
      {html:'<optgroup></optgroup><optgroup></optgroup>a',events:'start,open,optgroup,{},false,close,optgroup,false,open,optgroup,{},false,close,optgroup,false,text,a,done'},
      {html:'<x><optgroup></optgroup></x>a',events:'start,open,x,{},false,open,optgroup,{},false,close,optgroup,false,close,x,false,text,a,done'},
      {html:'<optgroup><x></x>a',events:'start,open,optgroup,{},false,open,x,{},false,close,x,false,text,a,close,optgroup,false,done'},
      // ----------------------
      {html:'<optgroup><optgroup></optgroup>a',events:'start,open,optgroup,{},false,close,optgroup,false,open,optgroup,{},false,close,optgroup,false,text,a,done'},
      {html:'<x><optgroup></x>a',events:'start,open,x,{},false,open,optgroup,{},false,close,optgroup,false,close,x,false,text,a,done'},

      //An option element's end tag may be omitted if the option element is immediately followed by another option element, or if it is immediately followed by an optgroup element, or if there is no more content in the parent element.
      {html:'<option></option><option></option>a',events:'start,open,option,{},false,close,option,false,open,option,{},false,close,option,false,text,a,done'},
      {html:'<option></option><optgroup></optgroup>a',events:'start,open,option,{},false,close,option,false,open,optgroup,{},false,close,optgroup,false,text,a,done'},
      {html:'<x><option></option></x>a',events:'start,open,x,{},false,open,option,{},false,close,option,false,close,x,false,text,a,done'},
      {html:'<option><x></x>a',events:'start,open,option,{},false,open,x,{},false,close,x,false,text,a,close,option,false,done'},
      // ----------------------
      {html:'<option><option></option>a',events:'start,open,option,{},false,close,option,false,open,option,{},false,close,option,false,text,a,done'},
      {html:'<option><optgroup></optgroup>a',events:'start,open,option,{},false,close,option,false,open,optgroup,{},false,close,optgroup,false,text,a,done'},
      {html:'<x><option></x>a',events:'start,open,x,{},false,open,option,{},false,close,option,false,close,x,false,text,a,done'},

      //A thead element's end tag may be omitted if the thead element is immediately followed by a tbody or tfoot element.
      {html:'<thead></thead><tbody></tbody>a',events:'start,open,thead,{},false,close,thead,false,open,tbody,{},false,close,tbody,false,text,a,done'},
      {html:'<thead></thead><tfoot></tfoot>a',events:'start,open,thead,{},false,close,thead,false,open,tfoot,{},false,close,tfoot,false,text,a,done'},
      {html:'<thead><a></a>a',events:'start,open,thead,{},false,open,a,{},false,close,a,false,text,a,close,thead,false,done'},
      // ----------------------
      {html:'<thead><tbody></tbody>a',events:'start,open,thead,{},false,close,thead,false,open,tbody,{},false,close,tbody,false,text,a,done'},
      {html:'<thead><tfoot></tfoot>a',events:'start,open,thead,{},false,close,thead,false,open,tfoot,{},false,close,tfoot,false,text,a,done'},

      //A tbody element's end tag may be omitted if the tbody element is immediately followed by a tbody or tfoot element, or if there is no more content in the parent element.
      {html:'<tbody></tbody><tbody></tbody>a',events:'start,open,tbody,{},false,close,tbody,false,open,tbody,{},false,close,tbody,false,text,a,done'},
      {html:'<tbody></tbody><tfoot></tfoot>a',events:'start,open,tbody,{},false,close,tbody,false,open,tfoot,{},false,close,tfoot,false,text,a,done'},
      {html:'<tbody><a></a>a',events:'start,open,tbody,{},false,open,a,{},false,close,a,false,text,a,close,tbody,false,done'},
      {html:'<x><tbody></tbody></x>a',events:'start,open,x,{},false,open,tbody,{},false,close,tbody,false,close,x,false,text,a,done'},
      // ----------------------
      {html:'<tbody><tbody></tbody>a',events:'start,open,tbody,{},false,close,tbody,false,open,tbody,{},false,close,tbody,false,text,a,done'},
      {html:'<tbody><tfoot></tfoot>a',events:'start,open,tbody,{},false,close,tbody,false,open,tfoot,{},false,close,tfoot,false,text,a,done'},
      {html:'<x><tbody></x>a',events:'start,open,x,{},false,open,tbody,{},false,close,tbody,false,close,x,false,text,a,done'},

      //A tfoot element's end tag may be omitted if the tfoot element is immediately followed by a tbody element, or if there is no more content in the parent element.
      {html:'<tfoot></tfoot><tbody></tbody>a',events:'start,open,tfoot,{},false,close,tfoot,false,open,tbody,{},false,close,tbody,false,text,a,done'},
      {html:'<tfoot><a></a>a',events:'start,open,tfoot,{},false,open,a,{},false,close,a,false,text,a,close,tfoot,false,done'},
      {html:'<x><tfoot></tfoot></x>a',events:'start,open,x,{},false,open,tfoot,{},false,close,tfoot,false,close,x,false,text,a,done'},
      // ----------------------
      {html:'<tfoot><tbody></tbody>a',events:'start,open,tfoot,{},false,close,tfoot,false,open,tbody,{},false,close,tbody,false,text,a,done'},
      {html:'<x><tfoot></x>a',events:'start,open,x,{},false,open,tfoot,{},false,close,tfoot,false,close,x,false,text,a,done'},

      //A tr element's end tag may be omitted if the tr element is immediately followed by another tr element, or if there is no more content in the parent element.
      {html:'<tr></tr><tr></tr>a',events:'start,open,tr,{},false,close,tr,false,open,tr,{},false,close,tr,false,text,a,done'},
      {html:'<tr><a></a>a',events:'start,open,tr,{},false,open,a,{},false,close,a,false,text,a,close,tr,false,done'},
      {html:'<x><tr></tr></x>a',events:'start,open,x,{},false,open,tr,{},false,close,tr,false,close,x,false,text,a,done'},
      // ----------------------
      {html:'<tr><tr></tr>a',events:'start,open,tr,{},false,close,tr,false,open,tr,{},false,close,tr,false,text,a,done'},
      {html:'<x><tr></x>a',events:'start,open,x,{},false,open,tr,{},false,close,tr,false,close,x,false,text,a,done'},

      //A td element's end tag may be omitted if the td element is immediately followed by a td or th element, or if there is no more content in the parent element.
      {html:'<td></td><td></td>a',events:'start,open,td,{},false,close,td,false,open,td,{},false,close,td,false,text,a,done'},
      {html:'<td></td><th></th>a',events:'start,open,td,{},false,close,td,false,open,th,{},false,close,th,false,text,a,done'},
      {html:'<td><a></a>a',events:'start,open,td,{},false,open,a,{},false,close,a,false,text,a,close,td,false,done'},
      {html:'<x><td></td></x>a',events:'start,open,x,{},false,open,td,{},false,close,td,false,close,x,false,text,a,done'},
      // ----------------------
      {html:'<td><td></td>a',events:'start,open,td,{},false,close,td,false,open,td,{},false,close,td,false,text,a,done'},
      {html:'<td><th></th>a',events:'start,open,td,{},false,close,td,false,open,th,{},false,close,th,false,text,a,done'},
      {html:'<x><td></x>a',events:'start,open,x,{},false,open,td,{},false,close,td,false,close,x,false,text,a,done'},

      //A th element's end tag may be omitted if the th element is immediately followed by a td or th element, or if there is no more content in the parent element.
      {html:'<th></th><td></td>a',events:'start,open,th,{},false,close,th,false,open,td,{},false,close,td,false,text,a,done'},
      {html:'<th></th><th></th>a',events:'start,open,th,{},false,close,th,false,open,th,{},false,close,th,false,text,a,done'},
      {html:'<th><a></a>a',events:'start,open,th,{},false,open,a,{},false,close,a,false,text,a,close,th,false,done'},
      {html:'<x><th></th></x>a',events:'start,open,x,{},false,open,th,{},false,close,th,false,close,x,false,text,a,done'},
      // ----------------------
      {html:'<th><td></td>a',events:'start,open,th,{},false,close,th,false,open,td,{},false,close,td,false,text,a,done'},
      {html:'<th><th></th>a',events:'start,open,th,{},false,close,th,false,open,th,{},false,close,th,false,text,a,done'},
      {html:'<x><th></x>a',events:'start,open,x,{},false,open,th,{},false,close,th,false,close,x,false,text,a,done'},

    ].forEach(function(item) {
      (item.only?it.only:it)('should parse '+JSON.stringify(item.html), function() {
        var events = parserCollector(item.html)
        assert.strictEqual(events, item.events)
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
      var args = [].slice.call(arguments).map(function(arg) {
        return typeof arg === 'string' ? arg : JSON.stringify(arg)
      })
      args.unshift(ev)
      result.push(args)
    })
  })
  parser.parse(html)
  return result.join(',')
}

function collector(html, cb, entities) {
  var result = [];
  var tkzr = makeTokListener(function(args) {
    result.push(args.join(','))
  }, entities)
  if (cb) { cb(tkzr) }
  tkzr.tokenize(html)
  return result.join(',')
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
