import Parser, { Attributes, ParseToken, TextParseToken } from './parser';
import * as assert from 'assert';
import * as fs from 'fs';
import cheerio from 'cheerio';
import entityMap from './entities';
import { Entities } from './lib/types';
import { join } from 'path';

interface TestDescr {
  html: string;
  events: string;
  entities?: Entities;
}

describe('html-tokenizer/parser', () => {

  const tests: TestDescr[] = [{html: '', events: ''},
    {html: '<br>', events: 'open,br,{},true,close,br,true'},
    {html: '<br/>', events: 'open,br,{},true,close,br,true'},
    {html: '<p>', events: 'open,p,{},false,close,p,false'},
    {html: '<p>hello', events: 'open,p,{},false,text,hello,close,p,false'},
    {html: '<p/>hello', events: 'open,p,{},true,close,p,true,text,hello'},
    {html: '<b><i><u>', events: 'open,b,{},false,open,i,{},false,open,u,{},false,close,u,false,close,i,false,close,b,false'},
    {html: '<b><i><u></u></i></b>', events: 'open,b,{},false,open,i,{},false,open,u,{},false,close,u,false,close,i,false,close,b,false'},
    {html: '<b><i>what<u></u></i></b>', events: 'open,b,{},false,open,i,{},false,text,what,open,u,{},false,close,u,false,close,i,false,close,b,false'},
    {html: '<br>foo</br>', events: 'open,br,{},true,close,br,true,text,foo'},
    {html: '<br class="xyz">', events: 'open,br,{"class":"xyz"},true,close,br,true'},
    {html: '<br id=" foo-bar" class="xyz">', events: 'open,br,{"id":" foo-bar","class":"xyz"},true,close,br,true'},
    {html: '<br id=\' foo-bar\' class=\'xyz\'>', events: 'open,br,{"id":" foo-bar","class":"xyz"},true,close,br,true'},
    {html: '<br id=foo-bar class=xyz>', events: 'open,br,{"id":"foo-bar","class":"xyz"},true,close,br,true'},
    {html: '<br id\n   \t=\r\nfoo-bar class\n=\txyz>', events: 'open,br,{"id":"foo-bar","class":"xyz"},true,close,br,true'},
    {html: '<br>>>', events: 'open,br,{},true,close,br,true,text,>>'},
    {html: '<<<br>', events: 'text,<<,open,br,{},true,close,br,true'},
    {html: '<b></b></pre>', events: 'open,b,{},false,close,b,false'},
    {html: '<b></b></pre>hello', events: 'open,b,{},false,close,b,false,text,hello'},
    {html: '<b></pre>', events: 'open,b,{},false,close,b,false'},
    {html: '<pre', events: ''},
    {html: '<pre ', events: 'text, '},
    {html: 'zz<pre', events: 'text,zz'},
    {html: '< br>', events: 'text,< br>'},
    {html: '</br>', events: ''},
    {html: '<!---->', events: 'comment,'},
    {html: '<!--x-->', events: 'comment,x'},
    {html: '<!--\nx\n-->', events: 'comment,\nx\n'},
    {html: '<!--x-- >', events: 'comment,x-- >'},
    {html: '<foo:bar>', events: 'open,foo:bar,{},false,close,foo:bar,false'},
    {html: '</foo:bar>', events: ''},
    {html: '<foo:bar></foo:bar>', events: 'open,foo:bar,{},false,close,foo:bar,false'},
    {html: '<foo:bar yes="yes"></foo:bar>', events: 'open,foo:bar,{"yes":"yes"},false,close,foo:bar,false'},
    {html: '<script type="text/javascript"></script>', events: 'open,script,{"type":"text/javascript"},false,close,script,false'},
    {html: '<script>alert("hello")</script>', events: 'open,script,{},false,text,alert("hello"),close,script,false'},
    {html: '<script>for (var n=10,i=0; i<n; i++);</script>', events: 'open,script,{},false,text,for (var n=10,i=0; i<n; i++);,close,script,false'},
    {html: '<script>\nfor (var n=10,i=0; i<n; i++);\n</script>', events: 'open,script,{},false,text,\nfor (var n=10,i=0; i<n; i++);\n,close,script,false'},
    {html: '<script><foo<foo<foo</script>', events: 'open,script,{},false,text,<foo<foo<foo,close,script,false'},
    {html: '<script><![CDATA[ blah >> ></script>', events: 'open,script,{},false,text,<![CDATA[ blah >> >,close,script,false'},
    {html: '<script><!--//--></script>', events: 'open,script,{},false,text,<!--//-->,close,script,false'},
    {html: '<script>\n<!--\n//-->\n</script>', events: 'open,script,{},false,text,\n<!--\n//-->\n,close,script,false'},
    {html: '<script>alert("</script>")</script>', events: 'open,script,{},false,text,alert(",close,script,false,text,")'},
    {html: '<script>alert("</scr"+"ipt>")</script>', events: 'open,script,{},false,text,alert("</scr"+"ipt>"),close,script,false'},
    {html: '<script defer>', events: 'open,script,{"defer":""},false,close,script,false'},
    {html: '<foo<foo<foo/>', events: 'open,foo,{},true,close,foo,true'},
    {html: '<foo<foo<foo/>>>', events: 'open,foo,{},true,close,foo,true,text,>>'},
    {html: '<br att=\'yes, "no", yes\'>', events: 'open,br,{"att":"yes, \\"no\\", yes"},true,close,br,true'},
    {html: '<br att=\'margin: 0px; padding: 3px 4px; width: 652px; color: rgb(153, 153, 153); font-family: "Open Sans", Helvetica, Arial, sans-serif; font-size: 11px; display: block;\'>', events: 'open,br,{"att":"margin: 0px; padding: 3px 4px; width: 652px; color: rgb(153, 153, 153); font-family: \\"Open Sans\\", Helvetica, Arial, sans-serif; font-size: 11px; display: block;"},true,close,br,true'},

    //An li element's end tag may be omitted if the li element is immediately followed by another li element or if there is no more content in the parent element.
    {html: '<ul><li></li></ul>a', events: 'open,ul,{},false,open,li,{},false,close,li,false,close,ul,false,text,a'},
    {html: '<ul><li></li><li></li></ul>a', events: 'open,ul,{},false,open,li,{},false,close,li,false,open,li,{},false,close,li,false,close,ul,false,text,a'},
    // ----------------------
    {html: '<ul><li></ul>a', events: 'open,ul,{},false,open,li,{},false,close,li,false,close,ul,false,text,a'},
    {html: '<ul><li><li></ul>a', events: 'open,ul,{},false,open,li,{},false,close,li,false,open,li,{},false,close,li,false,close,ul,false,text,a'},
    {html: '<ul><li>a<li>b</ul>a', events: 'open,ul,{},false,open,li,{},false,text,a,close,li,false,open,li,{},false,text,b,close,li,false,close,ul,false,text,a'},

    //A dt element's end tag may be omitted if the dt element is immediately followed by another dt element or a dd element.
    {html: '<dl><dt></dt><dd></dd></dl>a', events: 'open,dl,{},false,open,dt,{},false,close,dt,false,open,dd,{},false,close,dd,false,close,dl,false,text,a'},
    // ----------------------
    {html: '<dl><dt><dd></dd></dl>a', events: 'open,dl,{},false,open,dt,{},false,close,dt,false,open,dd,{},false,close,dd,false,close,dl,false,text,a'},
    {html: '<dl><dt><dt></dt></dl>a', events: 'open,dl,{},false,open,dt,{},false,close,dt,false,open,dt,{},false,close,dt,false,close,dl,false,text,a'},

    //A dd element's end tag may be omitted if the dd element is immediately followed by another dd element or a dt element, or if there is no more content in the parent element.
    {html: '<dl><dd></dd></dl>a', events: 'open,dl,{},false,open,dd,{},false,close,dd,false,close,dl,false,text,a'},
    {html: '<dl><dd></dd><dd></dd></dl>a', events: 'open,dl,{},false,open,dd,{},false,close,dd,false,open,dd,{},false,close,dd,false,close,dl,false,text,a'},
    // ----------------------
    {html: '<dl><dd></dl>a', events: 'open,dl,{},false,open,dd,{},false,close,dd,false,close,dl,false,text,a'},
    {html: '<dl><dd><dd></dl>a', events: 'open,dl,{},false,open,dd,{},false,close,dd,false,open,dd,{},false,close,dd,false,close,dl,false,text,a'},
    {html: '<dl><dd><dt></dt></dl>a', events: 'open,dl,{},false,open,dd,{},false,close,dd,false,open,dt,{},false,close,dt,false,close,dl,false,text,a'},

    //A p element's end tag may be omitted if the p element is immediately followed by an address, article, aside, blockquote, div, dl, fieldset, footer, form, h1, h2, h3, h4, h5, h6, header, hgroup, hr, main, nav, ol, p, pre, section, table, ul, or if there is no more content in the parent element and the parent element is not an a element.
    {html: '<div><p></p></div><b>', events: 'open,div,{},false,open,p,{},false,close,p,false,close,div,false,open,b,{},false,close,b,false'},
    {html: '<p></p><p></p>', events: 'open,p,{},false,close,p,false,open,p,{},false,close,p,false'},
    {html: '<p><a>', events: 'open,p,{},false,open,a,{},false,close,a,false,close,p,false'},
    {html: '<div><a></div><a>', events: 'open,div,{},false,open,a,{},false,open,a,{},false,close,a,false,close,a,false,close,div,false'},
    // ----------------------
    {html: '<div><p></div><b>', events: 'open,div,{},false,open,p,{},false,close,p,false,close,div,false,open,b,{},false,close,b,false'},
    {html: '<p><address>', events: 'open,p,{},false,close,p,false,open,address,{},false,close,address,false'},
    {html: '<p><article>', events: 'open,p,{},false,close,p,false,open,article,{},false,close,article,false'},
    {html: '<p><aside>', events: 'open,p,{},false,close,p,false,open,aside,{},false,close,aside,false'},
    {html: '<p><blockquote>', events: 'open,p,{},false,close,p,false,open,blockquote,{},false,close,blockquote,false'},
    {html: '<p><div>', events: 'open,p,{},false,close,p,false,open,div,{},false,close,div,false'},
    {html: '<p><dl>', events: 'open,p,{},false,close,p,false,open,dl,{},false,close,dl,false'},
    {html: '<p><fieldset>', events: 'open,p,{},false,close,p,false,open,fieldset,{},false,close,fieldset,false'},
    {html: '<p><footer>', events: 'open,p,{},false,close,p,false,open,footer,{},false,close,footer,false'},
    {html: '<p><form>', events: 'open,p,{},false,close,p,false,open,form,{},false,close,form,false'},
    {html: '<p><h1>', events: 'open,p,{},false,close,p,false,open,h1,{},false,close,h1,false'},
    {html: '<p><h2>', events: 'open,p,{},false,close,p,false,open,h2,{},false,close,h2,false'},
    {html: '<p><h3>', events: 'open,p,{},false,close,p,false,open,h3,{},false,close,h3,false'},
    {html: '<p><h4>', events: 'open,p,{},false,close,p,false,open,h4,{},false,close,h4,false'},
    {html: '<p><h5>', events: 'open,p,{},false,close,p,false,open,h5,{},false,close,h5,false'},
    {html: '<p><h6>', events: 'open,p,{},false,close,p,false,open,h6,{},false,close,h6,false'},
    {html: '<p><header>', events: 'open,p,{},false,close,p,false,open,header,{},false,close,header,false'},
    {html: '<p><hgroup>', events: 'open,p,{},false,close,p,false,open,hgroup,{},false,close,hgroup,false'},
    {html: '<p><hr>', events: 'open,p,{},false,close,p,false,open,hr,{},true,close,hr,true'},
    {html: '<p><main>', events: 'open,p,{},false,close,p,false,open,main,{},false,close,main,false'},
    {html: '<p><nav>', events: 'open,p,{},false,close,p,false,open,nav,{},false,close,nav,false'},
    {html: '<p><ol>', events: 'open,p,{},false,close,p,false,open,ol,{},false,close,ol,false'},
    {html: '<p><p>', events: 'open,p,{},false,close,p,false,open,p,{},false,close,p,false'},
    {html: '<p><pre>', events: 'open,p,{},false,close,p,false,open,pre,{},false,close,pre,false'},
    {html: '<p><section>', events: 'open,p,{},false,close,p,false,open,section,{},false,close,section,false'},
    {html: '<p><table>', events: 'open,p,{},false,close,p,false,open,table,{},false,close,table,false'},
    {html: '<p><ul>', events: 'open,p,{},false,close,p,false,open,ul,{},false,close,ul,false'},
    {html: '<p><ul>', events: 'open,p,{},false,close,p,false,open,ul,{},false,close,ul,false'},

    //An rb element's end tag may be omitted if the rb element is immediately followed by an rb, rt, rtc or rp element, or if there is no more content in the parent element.
    {html: '<rb></rb>a', events: 'open,rb,{},false,close,rb,false,text,a'},
    {html: '<rb></rb><rb></rb>a', events: 'open,rb,{},false,close,rb,false,open,rb,{},false,close,rb,false,text,a'},
    {html: '<rb></rb><rt></rt>a', events: 'open,rb,{},false,close,rb,false,open,rt,{},false,close,rt,false,text,a'},
    {html: '<rb></rb><rtc></rtc>a', events: 'open,rb,{},false,close,rb,false,open,rtc,{},false,close,rtc,false,text,a'},
    {html: '<rb></rb><rp></rp>a', events: 'open,rb,{},false,close,rb,false,open,rp,{},false,close,rp,false,text,a'},
    {html: '<x><rb></rb></x>a', events: 'open,x,{},false,open,rb,{},false,close,rb,false,close,x,false,text,a'},
    {html: '<x><rb><foo></x>a', events: 'open,x,{},false,open,rb,{},false,open,foo,{},false,text,a,close,foo,false,close,rb,false,close,x,false'},
    // ----------------------
    {html: '<rb><rb></rb>a', events: 'open,rb,{},false,close,rb,false,open,rb,{},false,close,rb,false,text,a'},
    {html: '<rb><rt></rt>a', events: 'open,rb,{},false,close,rb,false,open,rt,{},false,close,rt,false,text,a'},
    {html: '<rb><rtc></rtc>a', events: 'open,rb,{},false,close,rb,false,open,rtc,{},false,close,rtc,false,text,a'},
    {html: '<rb><rp></rp>a', events: 'open,rb,{},false,close,rb,false,open,rp,{},false,close,rp,false,text,a'},
    {html: '<x><rb></x>a', events: 'open,x,{},false,open,rb,{},false,close,rb,false,close,x,false,text,a'},

    //An rt element's end tag may be omitted if the rt element is immediately followed by an rb, rt, rtc, or rp element, or if there is no more content in the parent element.
    {html: '<rt></rt>a', events: 'open,rt,{},false,close,rt,false,text,a'},
    {html: '<rt></rt><rb></rb>a', events: 'open,rt,{},false,close,rt,false,open,rb,{},false,close,rb,false,text,a'},
    {html: '<rt></rt><rt></rt>a', events: 'open,rt,{},false,close,rt,false,open,rt,{},false,close,rt,false,text,a'},
    {html: '<rt></rt><rtc></rtc>a', events: 'open,rt,{},false,close,rt,false,open,rtc,{},false,close,rtc,false,text,a'},
    {html: '<rt></rt><rp></rp>a', events: 'open,rt,{},false,close,rt,false,open,rp,{},false,close,rp,false,text,a'},
    {html: '<x><rt></rt></x>a', events: 'open,x,{},false,open,rt,{},false,close,rt,false,close,x,false,text,a'},
    {html: '<x><rt><foo></x>a', events: 'open,x,{},false,open,rt,{},false,open,foo,{},false,text,a,close,foo,false,close,rt,false,close,x,false'},
    // ----------------------
    {html: '<rt><rb></rb>a', events: 'open,rt,{},false,close,rt,false,open,rb,{},false,close,rb,false,text,a'},
    {html: '<rt><rt></rt>a', events: 'open,rt,{},false,close,rt,false,open,rt,{},false,close,rt,false,text,a'},
    {html: '<rt><rtc></rtc>a', events: 'open,rt,{},false,close,rt,false,open,rtc,{},false,close,rtc,false,text,a'},
    {html: '<rt><rp></rp>a', events: 'open,rt,{},false,close,rt,false,open,rp,{},false,close,rp,false,text,a'},
    {html: '<x><rt></x>a', events: 'open,x,{},false,open,rt,{},false,close,rt,false,close,x,false,text,a'},

    //An rtc element's end tag may be omitted if the rtc element is immediately followed by an rb, rtc or rp element, or if there is no more content in the parent element.
    {html: '<rtc></rtc>a', events: 'open,rtc,{},false,close,rtc,false,text,a'},
    {html: '<rtc></rtc><rb></rb>a', events: 'open,rtc,{},false,close,rtc,false,open,rb,{},false,close,rb,false,text,a'},
    {html: '<rtc></rtc><rtc></rtc>a', events: 'open,rtc,{},false,close,rtc,false,open,rtc,{},false,close,rtc,false,text,a'},
    {html: '<rtc></rtc><rp></rp>a', events: 'open,rtc,{},false,close,rtc,false,open,rp,{},false,close,rp,false,text,a'},
    {html: '<x><rtc></rtc></x>a', events: 'open,x,{},false,open,rtc,{},false,close,rtc,false,close,x,false,text,a'},
    {html: '<x><rtc><foo></x>a', events: 'open,x,{},false,open,rtc,{},false,open,foo,{},false,text,a,close,foo,false,close,rtc,false,close,x,false'},
    // ----------------------
    {html: '<rtc><rb></rb>a', events: 'open,rtc,{},false,close,rtc,false,open,rb,{},false,close,rb,false,text,a'},
    {html: '<rtc><rtc></rtc>a', events: 'open,rtc,{},false,close,rtc,false,open,rtc,{},false,close,rtc,false,text,a'},
    {html: '<rtc><rp></rp>a', events: 'open,rtc,{},false,close,rtc,false,open,rp,{},false,close,rp,false,text,a'},
    {html: '<x><rtc></x>a', events: 'open,x,{},false,open,rtc,{},false,close,rtc,false,close,x,false,text,a'},

    //An rp element's end tag may be omitted if the rp element is immediately followed by an rb, rt, rtc or rp element, or if there is no more content in the parent element.
    {html: '<rp></rp>a', events: 'open,rp,{},false,close,rp,false,text,a'},
    {html: '<rp></rp><rb></rb>a', events: 'open,rp,{},false,close,rp,false,open,rb,{},false,close,rb,false,text,a'},
    {html: '<rp></rp><rt></rt>a', events: 'open,rp,{},false,close,rp,false,open,rt,{},false,close,rt,false,text,a'},
    {html: '<rp></rp><rtc></rtc>a', events: 'open,rp,{},false,close,rp,false,open,rtc,{},false,close,rtc,false,text,a'},
    {html: '<rp></rp><rp></rp>a', events: 'open,rp,{},false,close,rp,false,open,rp,{},false,close,rp,false,text,a'},
    {html: '<x><rp></rp></x>a', events: 'open,x,{},false,open,rp,{},false,close,rp,false,close,x,false,text,a'},
    {html: '<x><rp><foo></x>a', events: 'open,x,{},false,open,rp,{},false,open,foo,{},false,text,a,close,foo,false,close,rp,false,close,x,false'},
    // ----------------------
    {html: '<rp><rb></rb>a', events: 'open,rp,{},false,close,rp,false,open,rb,{},false,close,rb,false,text,a'},
    {html: '<rp><rt></rt>a', events: 'open,rp,{},false,close,rp,false,open,rt,{},false,close,rt,false,text,a'},
    {html: '<rp><rtc></rtc>a', events: 'open,rp,{},false,close,rp,false,open,rtc,{},false,close,rtc,false,text,a'},
    {html: '<rp><rp></rp>a', events: 'open,rp,{},false,close,rp,false,open,rp,{},false,close,rp,false,text,a'},
    {html: '<x><rp></x>a', events: 'open,x,{},false,open,rp,{},false,close,rp,false,close,x,false,text,a'},

    //An optgroup element's end tag may be omitted if the optgroup element is immediately followed by another optgroup element, or if there is no more content in the parent element.
    {html: '<optgroup></optgroup><optgroup></optgroup>a', events: 'open,optgroup,{},false,close,optgroup,false,open,optgroup,{},false,close,optgroup,false,text,a'},
    {html: '<x><optgroup></optgroup></x>a', events: 'open,x,{},false,open,optgroup,{},false,close,optgroup,false,close,x,false,text,a'},
    {html: '<optgroup><x></x>a', events: 'open,optgroup,{},false,open,x,{},false,close,x,false,text,a,close,optgroup,false'},
    // ----------------------
    {html: '<optgroup><optgroup></optgroup>a', events: 'open,optgroup,{},false,close,optgroup,false,open,optgroup,{},false,close,optgroup,false,text,a'},
    {html: '<x><optgroup></x>a', events: 'open,x,{},false,open,optgroup,{},false,close,optgroup,false,close,x,false,text,a'},

    //An option element's end tag may be omitted if the option element is immediately followed by another option element, or if it is immediately followed by an optgroup element, or if there is no more content in the parent element.
    {html: '<option></option><option></option>a', events: 'open,option,{},false,close,option,false,open,option,{},false,close,option,false,text,a'},
    {html: '<option></option><optgroup></optgroup>a', events: 'open,option,{},false,close,option,false,open,optgroup,{},false,close,optgroup,false,text,a'},
    {html: '<x><option></option></x>a', events: 'open,x,{},false,open,option,{},false,close,option,false,close,x,false,text,a'},
    {html: '<option><x></x>a', events: 'open,option,{},false,open,x,{},false,close,x,false,text,a,close,option,false'},
    // ----------------------
    {html: '<option><option></option>a', events: 'open,option,{},false,close,option,false,open,option,{},false,close,option,false,text,a'},
    {html: '<option><optgroup></optgroup>a', events: 'open,option,{},false,close,option,false,open,optgroup,{},false,close,optgroup,false,text,a'},
    {html: '<x><option></x>a', events: 'open,x,{},false,open,option,{},false,close,option,false,close,x,false,text,a'},

    //A thead element's end tag may be omitted if the thead element is immediately followed by a tbody or tfoot element.
    {html: '<thead></thead><tbody></tbody>a', events: 'open,thead,{},false,close,thead,false,open,tbody,{},false,close,tbody,false,text,a'},
    {html: '<thead></thead><tfoot></tfoot>a', events: 'open,thead,{},false,close,thead,false,open,tfoot,{},false,close,tfoot,false,text,a'},
    {html: '<thead><a></a>a', events: 'open,thead,{},false,open,a,{},false,close,a,false,text,a,close,thead,false'},
    // ----------------------
    {html: '<thead><tbody></tbody>a', events: 'open,thead,{},false,close,thead,false,open,tbody,{},false,close,tbody,false,text,a'},
    {html: '<thead><tfoot></tfoot>a', events: 'open,thead,{},false,close,thead,false,open,tfoot,{},false,close,tfoot,false,text,a'},

    //A tbody element's end tag may be omitted if the tbody element is immediately followed by a tbody or tfoot element, or if there is no more content in the parent element.
    {html: '<tbody></tbody><tbody></tbody>a', events: 'open,tbody,{},false,close,tbody,false,open,tbody,{},false,close,tbody,false,text,a'},
    {html: '<tbody></tbody><tfoot></tfoot>a', events: 'open,tbody,{},false,close,tbody,false,open,tfoot,{},false,close,tfoot,false,text,a'},
    {html: '<tbody><a></a>a', events: 'open,tbody,{},false,open,a,{},false,close,a,false,text,a,close,tbody,false'},
    {html: '<x><tbody></tbody></x>a', events: 'open,x,{},false,open,tbody,{},false,close,tbody,false,close,x,false,text,a'},
    // ----------------------
    {html: '<tbody><tbody></tbody>a', events: 'open,tbody,{},false,close,tbody,false,open,tbody,{},false,close,tbody,false,text,a'},
    {html: '<tbody><tfoot></tfoot>a', events: 'open,tbody,{},false,close,tbody,false,open,tfoot,{},false,close,tfoot,false,text,a'},
    {html: '<x><tbody></x>a', events: 'open,x,{},false,open,tbody,{},false,close,tbody,false,close,x,false,text,a'},

    //A tfoot element's end tag may be omitted if the tfoot element is immediately followed by a tbody element, or if there is no more content in the parent element.
    {html: '<tfoot></tfoot><tbody></tbody>a', events: 'open,tfoot,{},false,close,tfoot,false,open,tbody,{},false,close,tbody,false,text,a'},
    {html: '<tfoot><a></a>a', events: 'open,tfoot,{},false,open,a,{},false,close,a,false,text,a,close,tfoot,false'},
    {html: '<x><tfoot></tfoot></x>a', events: 'open,x,{},false,open,tfoot,{},false,close,tfoot,false,close,x,false,text,a'},
    // ----------------------
    {html: '<tfoot><tbody></tbody>a', events: 'open,tfoot,{},false,close,tfoot,false,open,tbody,{},false,close,tbody,false,text,a'},
    {html: '<x><tfoot></x>a', events: 'open,x,{},false,open,tfoot,{},false,close,tfoot,false,close,x,false,text,a'},

    //A tr element's end tag may be omitted if the tr element is immediately followed by another tr element, or if there is no more content in the parent element.
    {html: '<tr></tr><tr></tr>a', events: 'open,tr,{},false,close,tr,false,open,tr,{},false,close,tr,false,text,a'},
    {html: '<tr><a></a>a', events: 'open,tr,{},false,open,a,{},false,close,a,false,text,a,close,tr,false'},
    {html: '<x><tr></tr></x>a', events: 'open,x,{},false,open,tr,{},false,close,tr,false,close,x,false,text,a'},
    // ----------------------
    {html: '<tr><tr></tr>a', events: 'open,tr,{},false,close,tr,false,open,tr,{},false,close,tr,false,text,a'},
    {html: '<x><tr></x>a', events: 'open,x,{},false,open,tr,{},false,close,tr,false,close,x,false,text,a'},

    //A td element's end tag may be omitted if the td element is immediately followed by a td or th element, or if there is no more content in the parent element.
    {html: '<td></td><td></td>a', events: 'open,td,{},false,close,td,false,open,td,{},false,close,td,false,text,a'},
    {html: '<td></td><th></th>a', events: 'open,td,{},false,close,td,false,open,th,{},false,close,th,false,text,a'},
    {html: '<td><a></a>a', events: 'open,td,{},false,open,a,{},false,close,a,false,text,a,close,td,false'},
    {html: '<x><td></td></x>a', events: 'open,x,{},false,open,td,{},false,close,td,false,close,x,false,text,a'},
    // ----------------------
    {html: '<td><td></td>a', events: 'open,td,{},false,close,td,false,open,td,{},false,close,td,false,text,a'},
    {html: '<td><th></th>a', events: 'open,td,{},false,close,td,false,open,th,{},false,close,th,false,text,a'},
    {html: '<x><td></x>a', events: 'open,x,{},false,open,td,{},false,close,td,false,close,x,false,text,a'},

    //A th element's end tag may be omitted if the th element is immediately followed by a td or th element, or if there is no more content in the parent element.
    {html: '<th></th><td></td>a', events: 'open,th,{},false,close,th,false,open,td,{},false,close,td,false,text,a'},
    {html: '<th></th><th></th>a', events: 'open,th,{},false,close,th,false,open,th,{},false,close,th,false,text,a'},
    {html: '<th><a></a>a', events: 'open,th,{},false,open,a,{},false,close,a,false,text,a,close,th,false'},
    {html: '<x><th></th></x>a', events: 'open,x,{},false,open,th,{},false,close,th,false,close,x,false,text,a'},
    // ----------------------
    {html: '<th><td></td>a', events: 'open,th,{},false,close,th,false,open,td,{},false,close,td,false,text,a'},
    {html: '<th><th></th>a', events: 'open,th,{},false,close,th,false,open,th,{},false,close,th,false,text,a'},
    {html: '<x><th></x>a', events: 'open,x,{},false,open,th,{},false,close,th,false,close,x,false,text,a'},
    {html: '>', events: 'text,>'},
    {html: '/>', events: 'text,/>'},
  ];

  tests.forEach(item => {
    it('should parse '+JSON.stringify(item.html), () => {
      const events = parserCollector(item.html);
      assert.strictEqual(events, item.events);
    });
  });

  it('should pass through options', () => {
    const parser = new Parser({ entities: entityMap });
    const [tkn] = [...parser.parse('&deg;')].filter(isTextToken);
    assert.strictEqual(tkn.text, '\u00B0');
  });

  it('should be extendable', () => {
    class Parser2 extends Parser { foo() {} }
    const parser = new Parser2();
    const html = '<p>hello</p>';
    const a = [...parser.parse(html)];
    assert.ok(a.length > 0);
  });

  it('should have static', () => {
    const html = '<p>hello</p>';
    const a = [...Parser.parse(html)];
    assert.ok(a.length > 0);
  });

  it('should parse a wikipedia page', () => {
    function attify(atts: Attributes) {
      return Object.entries(atts)
        .map(([k, v]) => ` ${k}="${v}"`)
        .join('');
    }
    const path = join(__dirname, 'test-data', 'wikipedia.html');
    const page = fs.readFileSync(path, 'utf8');
    const parser = new Parser();
    let content = [];

    for (const tkn of parser.parse(page)) {
      if (tkn.type === 'open') {
        content.push(tkn.selfClosing
          ? `<${tkn.name}${attify(tkn.attributes)}/>`
          : `<${tkn.name}${attify(tkn.attributes)}>`
        );
      } else if (tkn.type === 'close' && !tkn.selfClosing) {
        content.push(`</${tkn.name}>`);
      } else if (tkn.type === 'text') {
        content.push(tkn.text);
      } else if (tkn.type === 'comment') {
        content.push(`<!--${tkn.text}-->`);
      }
    }
    const contentString = content.join('');
    const $ = cheerio.load(contentString);
    // console.log(content)
    assert.strictEqual($('.body').length, 5);
    assert.strictEqual($('script').length, 10);
    assert.strictEqual($('#n-mainpage-description').text(), 'Main page');
  });
});

function parserCollector(html: string) {
  const parser = new Parser();
  return [...parser.parse(html)]
    .map((item) => {
      const vals = Object.values(item)
        .map(val => typeof val === 'string'
          ? val
          : JSON.stringify(val)
        );
      return [...vals].join(',');
    })
    .join(',');
}

function isTextToken(tkn: ParseToken): tkn is TextParseToken {
  return tkn.type === 'text';
}
