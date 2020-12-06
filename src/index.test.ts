import Tokenizer, { AttributeToken, TextToken, Token } from '.';
import * as assert from 'assert';
import entityMap from './entities';
import { Entities } from './lib/types';

interface TestDescr {
  html: string;
  events: string;
  entities?: Entities
}

describe('html-tokenizer', () => {

  const tests: TestDescr[] = [
    {html: '', events: 'start,done'},
    {html: 'hello', events: 'start,text,hello,done'},
    {html: '<i>hello', events: 'start,opening-tag,i,opening-tag-end,i,>,text,hello,done'},
    {html: '<br/>', events: 'start,opening-tag,br,opening-tag-end,br,/>,done'},
    {html: '<br><br/>', events: 'start,opening-tag,br,opening-tag-end,br,>,opening-tag,br,opening-tag-end,br,/>,done'},
    {html: '<br />', events: 'start,opening-tag,br,opening-tag-end,br,/>,done'},
    {html: 'hello <br>', events: 'start,text,hello ,opening-tag,br,opening-tag-end,br,>,done'},
    {html: '<i>hello', events: 'start,opening-tag,i,opening-tag-end,i,>,text,hello,done'},
    {html: 'yes <br> hello', events: 'start,text,yes ,opening-tag,br,opening-tag-end,br,>,text, hello,done'},
    {html: '<p>hello</p>', events: 'start,opening-tag,p,opening-tag-end,p,>,text,hello,closing-tag,p,done'},
    {html: '<p><br>hello</p>', events: 'start,opening-tag,p,opening-tag-end,p,>,opening-tag,br,opening-tag-end,br,>,text,hello,closing-tag,p,done'},
    {html: '<br foo>', events: 'start,opening-tag,br,attribute,foo,,opening-tag-end,br,>,done'},
    {html: '<br foo=>', events: 'start,opening-tag,br,attribute,foo,,opening-tag-end,br,>,done'},
    {html: '<br foo=bar>', events: 'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html: '<br foo =bar>', events: 'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html: '<br foo= bar>', events: 'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html: '<br foo = bar>', events: 'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html: '<br foo=\'bar\'>', events: 'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html: '<br foo="bar> hello <br>', events: 'start,opening-tag,br,attribute,foo,bar> hello <br>,done'},
    {html: '<br foo=bar=baz>', events: 'start,opening-tag,br,attribute,foo,bar=baz,opening-tag-end,br,>,done'},
    {html: '<br foo="bar">', events: 'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html: '<br foo= "bar">', events: 'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html: '<br foo ="bar">', events: 'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html: '<br foo = "bar">', events: 'start,opening-tag,br,attribute,foo,bar,opening-tag-end,br,>,done'},
    {html: '<br foo="bar" baz="qux">', events: 'start,opening-tag,br,attribute,foo,bar,attribute,baz,qux,opening-tag-end,br,>,done'},
    {html: '<br foo="bar" baz=\'qux\'>', events: 'start,opening-tag,br,attribute,foo,bar,attribute,baz,qux,opening-tag-end,br,>,done'},
    {html: '<br\nfoo="bar"\nbaz="qux">', events: 'start,opening-tag,br,attribute,foo,bar,attribute,baz,qux,opening-tag-end,br,>,done'},
    {html: '<input autofocus>', events: 'start,opening-tag,input,attribute,autofocus,,opening-tag-end,input,>,done'},
    {html: '<!--x-->', events: 'start,comment,x,done'},
    {html: '<!--x\n-->', events: 'start,comment,x\n,done'},
    {html: '<!--\nx-->', events: 'start,comment,\nx,done'},
    {html: '<!--\nx\n-->', events: 'start,comment,\nx\n,done'},
    {html: '<!--', events: 'start,done'},
    {html: '<!--x', events: 'start,comment,x,done'},
    {html: '<!--x-- >', events: 'start,comment,x-- >,done'},
    {html: '<!--x-->\n<!-- yz -->', events: 'start,comment,x,text,\n,comment, yz ,done'},
    {html: '-->', events: 'start,text,-->,done'},
    {html: '<!---->', events: 'start,comment,,done'},
    {html: '<!--<!---->', events: 'start,comment,<!--,done'},
    {html: '<span><!--x--></p>', events: 'start,opening-tag,span,opening-tag-end,span,>,comment,x,closing-tag,p,done'},
    {html: '<', events: 'start,text,<,done'},
    {html: '>', events: 'start,text,>,done'},
    {html: '<<<', events: 'start,text,<<<,done'},
    {html: '<><=', events: 'start,text,<><=,done'},
    {html: '<a><b><c>x', events: 'start,opening-tag,a,opening-tag-end,a,>,opening-tag,b,opening-tag-end,b,>,opening-tag,c,opening-tag-end,c,>,text,x,done'},
    {html: '</b></b>', events: 'start,closing-tag,b,closing-tag,b,done'},
    {html: '<!doctype html><html>', events: 'start,text,<!doctype html>,opening-tag,html,opening-tag-end,html,>,done'},
    {html: '<foo', events: 'start,opening-tag,foo,done'},
    {html: '<foo<bar', events: 'start,opening-tag,foo,opening-tag,bar,done'},
    {html: '<foo <foo', events: 'start,opening-tag,foo,text, ,opening-tag,foo,done'},
    {html: '<foo <foo/> hello', events: 'start,opening-tag,foo,text, ,opening-tag,foo,opening-tag-end,foo,/>,text, hello,done'},
    {html: 'yes &amp; no', events: 'start,text,yes & no,done'},
    {html: 'yes &quot; no', events: 'start,text,yes " no,done'},
    {html: 'yes &lt; no', events: 'start,text,yes < no,done'},
    {html: 'yes &gt; no', events: 'start,text,yes > no,done'},
    {html: 'yes &#183; no', events: 'start,text,yes · no,done'},
    {html: '&lt;img/&gt;', events: 'start,text,<img/>,done'},
    {html: '&quot;hello&quot;', events: 'start,text,"hello",done'},
    {html: '</bar>', events: 'start,closing-tag,bar,done'},
    {html: '</ bar>', events: 'start,text,</ bar>,done'},
    {html: '&#931;', events: 'start,text,\u03A3,done'},
    {html: '&#0931;', events: 'start,text,\u03A3,done'},
    {html: '&#x3A3;', events: 'start,text,\u03A3,done'},
    {html: '&#x03A3;', events: 'start,text,\u03A3,done'},
    {html: '&#x3a3;', events: 'start,text,\u03A3,done'},
    {html: '&#xC6;', events: 'start,text,\u00C6,done'},
    {html: '&nbsp;', events: 'start,text,\u00A0,done'},
    {html: '&#160;&#160;&#160;', events: 'start,text,\u00A0\u00A0\u00A0,done'},
    {html: '&copy;', events: 'start,text,&copy;,done'},
    {html: '&copy;', events: 'start,text,\u00A9,done', entities: {copy: '\u00A9'}},
    {html: '<foo:bar>', events: 'start,opening-tag,foo:bar,opening-tag-end,foo:bar,>,done'},
    {html: '</foo:bar>', events: 'start,closing-tag,foo:bar,done'},
    {html: '<foo:bar></foo:bar>', events: 'start,opening-tag,foo:bar,opening-tag-end,foo:bar,>,closing-tag,foo:bar,done'},
    {html: '<script></script>', events: 'start,opening-tag,script,opening-tag-end,script,>,closing-tag,script,done'},
    {html: '<script>alert("hello")</script>', events: 'start,opening-tag,script,opening-tag-end,script,>,text,alert("hello"),closing-tag,script,done'},
    {html: '<script>for (var n=10,i=0; i<n; i++);</script>', events: 'start,opening-tag,script,opening-tag-end,script,>,text,for (var n=10,i=0; i<n; i++);,closing-tag,script,done'},
    {html: '<script>\nfor (var n=10,i=0; i<n; i++);\n</script>', events: 'start,opening-tag,script,opening-tag-end,script,>,text,\nfor (var n=10,i=0; i<n; i++);\n,closing-tag,script,done'},
    {html: '<script>alert("</script>")</script>', events: 'start,opening-tag,script,opening-tag-end,script,>,text,alert(",closing-tag,script,text,"),closing-tag,script,done'},
    {html: '<script>alert("</scr"+"ipt>")</script>', events: 'start,opening-tag,script,opening-tag-end,script,>,text,alert("</scr"+"ipt>"),closing-tag,script,done'},
    {html: '<div><p></div><b>', events: 'start,opening-tag,div,opening-tag-end,div,>,opening-tag,p,opening-tag-end,p,>,closing-tag,div,opening-tag,b,opening-tag-end,b,>,done'},
    {html: '<br _foo="bar">', events: 'start,opening-tag,br,attribute,_foo,bar,opening-tag-end,br,>,done'},
  ];

  tests.forEach(item => {
    it('should tokenize ' + JSON.stringify(item.html) + (item.entities?' with entities':''), () => {
      const result = collector(item.html, item.entities || {});
      //console.log(JSON.stringify(result))
      //console.log(JSON.stringify(item.events))
      assert.strictEqual(result, item.events);
    });
  });

  it('should be repeatable', () => {
    const html = '<p>hello <a href="#">there</a></p> <br> <br> <!-- nope-->';
    const tkzr = new Tokenizer();
    const a = [...tkzr.tokenize(html)];
    const b = [...tkzr.tokenize(html)];
    assert.deepEqual(a, b);
  });

  it('should be extendable', () => {
    class Tokenizer2 extends Tokenizer { foo() {} }
    const tkzr = new Tokenizer2();
    const html = '<p>hello</p>';
    const a = [...tkzr.tokenize(html)];
    assert.ok(a.length > 0);
  });

  it('should have static', () => {
    const html = '<p>hello</p>';
    const a = [...Tokenizer.tokenize(html)];
    assert.ok(a.length > 0);
  });

  it('should parse entities', () => {
    const tkzr = new Tokenizer();
    const [tkn] = [...tkzr.tokenize('&amp;')].filter(isTextToken);
    assert.strictEqual(tkn.text, '&');
  });

  it('should parse entities in attributes', () => {
    const tkzr = new Tokenizer();
    const [tkn] = [...tkzr.tokenize('<x y="&amp;"/>')].filter(isAttrToken);
    assert.strictEqual(tkn.value, '&');
  });

  it('should expose more entities', () => {
    const tkzr = new Tokenizer({ entities: entityMap });
    const [tkn] = [...tkzr.tokenize('&deg;')].filter(isTextToken);
    assert.strictEqual(tkn.text, '\u00B0');
  });

  it('should parse more entities in attributes', () => {
    const tkzr = new Tokenizer({ entities: entityMap });
    const [tkn] = [...tkzr.tokenize('<x y="&deg;"/>')].filter(isAttrToken);
    assert.strictEqual(tkn.value, '\u00B0');
  });
});

function collector(html: string, entities: Entities) {
  const tkzr = new Tokenizer({ entities });
  return [...tkzr.tokenize(html)]
    .map((tkn) => {
      return [...Object.values(tkn)].join(',');
    })
    .join(',');
}

function isTextToken(tkn: Token): tkn is TextToken {
  return tkn.type === 'text';
}

function isAttrToken(tkn: Token): tkn is AttributeToken {
  return tkn.type === 'attribute';
}
