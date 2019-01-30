/*
 * Textlayer Convert to CSS
 * https://github.com/nisio-k/ps-text-css
 */
function convertCSS(){

  var i;
  var doc = activeDocument;
  var target = doc.activeLayer;

  if (target.kind === LayerKind.TEXT){

    var dialog, val, indent, br;
    var flag = {
      indent : true,
      space  : true,
      br     : true
    };
    var item = target.textItem;
    var css = [];
    var color;
    // 色の取得
    try {
      color = String(item.color.rgb.hexValue);
    } catch(e) {
      color = '000000';
    }
    color = color.replace(/(\w)\1(\w)\2(\w)\3/g,'$1$2$3');
    css.push('color:' + '#' + color.toLowerCase() + ';');

    // フォントサイズ
    var fontSize = Number(item.size);
    css.push('font-size:' + fontSize + 'px' + ';');

    // ウェイト・イタリックの判定
    var fontStyle, fontWeight, fauxBold, fauxItalic;
    var fontFamily = item.font;
    try {
      fauxBold = item.fauxBold;
    } catch(e){
      fauxBold = false;
    }
    try {
      fauxItalic = item.fauxItalic;
    } catch(e){
      fauxItalic = false;
    }
    if( fontFamily.match(/light/i) !== null ){
      fontWeight = 'lighter';
    } else if( fontFamily.match(/bold/i) !== null || fauxBold ){
      fontWeight = 'bold';
    } else if( fontFamily.match(/italic/i) !== null || fauxItalic ) {
      fontStyle = 'italic';
    } else if( fontFamily.match(/black/i) !== null ){
      fontWeight = 'bolder';
    } else {
      fontStyle = false;
      fontWeight = false;
    }
    if(fontStyle) css.push('font-style:' + fontStyle + ';');
    if(fontWeight) css.push('font-weight:' + fontWeight + ';');

    // フォントファミリー
    fontFamily = fontFamily.replace(/-.+/, '');
    css.push('font-family:' + fontFamily + ', Helvetica, Arial, sans-serif;');

    // font-variant, text-transform
    var fontVariant, textTransform, textCase;
    try {
      textCase = String(item.capitalization);
    } catch(e) {
      textCase = false;
    }
    switch(textCase){
      case 'TextCase.NORMAL':
        fontVariant = false;
        textTransform = false;
        break;
      case 'TextCase.ALLCAPS':
        fontVariant = false;
        textTransform = 'uppercase';
        break;
      case 'TextCase.SMALLCAPS':
        fontVariant = 'small-caps';
        textTransform = false;
        break;
    }
    if(fontVariant) css.push('font-variant:' + fontVariant + ';');
    if(textTransform) css.push('text-transform:' + textTransform + ';');

    // 行間(line-height)
    var lineHeight;
    try {
      lineHeight = Number(item.leading) / fontSize;
    } catch(e) {
      lineHeight = 1.2;
    }
    css.push('line-height:' + String(lineHeight).replace('0.','') + ';');

    // センタリング・右揃えの判定(text-align)
    var justification, textAlign;
    try {
      justification = String(item.justification);
      textAlign = ( justification === 'Justification.LEFT')? textAlign = false: justification.replace('Justification.','').toLowerCase();
    } catch(e) {
      textAlign = false;
    }
    if(textAlign) css.push(textAlign);

    // インデント(text-indent)
    var textIndent;
    try {
      textIndent = (item.firstLineIndent)? Number(item.firstLineIndent): false;
    } catch(e) {
      textIndent = false;
    }
    if(textIndent) css.push('text-indent:' + textIndent + 'px' + ';');

    // 文字間(letter-spacing)
    var letterSpacing;
    try {
        letterSpacing = item.tracking / 1000;
    } catch(e) {
        letterSpacing = false;
    }
    if(letterSpacing) css.push('letter-spacing:' + String(letterSpacing).replace('0.','.') + 'em' + ';');

    // 長体・平体
    var transform, horizontalScale, verticalScale;
    try {
      horizontalScale = item.horizontalScale;
    } catch(e) {
      horizontalScale = 100;
    }
    try {
      verticalScale = item.verticalScale;
    } catch(e) {
      verticalScale = 100;
    }
    if(horizontalScale !== 100 && verticalScale !== 100){
      horizontalScale = String(horizontalScale / 100).replace('0.','.');
      verticalScale = String(verticalScale / 100).replace('0.','.');
      css.push('transform:' + 'scale(' + horizontalScale + ',' + verticalScale + ')' + ';');
    }

    var convert = function(type){
      if(type === 'indent'){
        flag.indent = true;
        flag.space = true;
        flag.br = true;
      } else if(type === 'compress') {
        flag.indent = false;
        flag.space = false;
        flag.br = false;
      } else {
        flag.indent = false;
        flag.space = false;
        flag.br = true;
      }
      indent = (flag.indent)? '    ': '';
      br = (flag.br)? '\r': '';
      space = (flag.space)? ' ': '';
      val = '.text' + space + '{' + br;
      for( i=0; i < css.length; i++ ){
        val = val + indent + css[i] + br;
      }
      if(type === 'indent') {
        val = val.replace(/:/g,': ');
      }
      val = val + '}';
    };
    convert();

    // ラジオボタンのラベルの位置・サイズ
    var label = {
      width : {
        noindent : 60,
        indent : 120,
        compress : 40
      },
      height : 30,
      x : {
        noindent : 10
      },
      y : 100
    };
    label.x.indent = label.x.noindent + label.width.noindent;
    label.x.compress = label.x.indent + label.width.indent;

    // ダイアログ
    dialog = new Window('dialog', 'Results:', [100, 100, 610, 280]);
    dialog.txt = dialog.add('edittext', [10, 10, 500, 100], val, { multiline : true, scrollable : false});
    dialog.radioNoIndent = dialog.add('radiobutton', [label.x.noindent, label.y, label.width.noindent, label.height + label.y], '標準');
    dialog.radioIndent = dialog.add('radiobutton', [label.x.indent, label.y, label.width.indent, label.height + label.y], 'インデントあり');
    dialog.radioCompress = dialog.add('radiobutton', [label.x.compress, label.y, label.width.compress, label.height + label.y], '圧縮');
    dialog.submit = dialog.add('button', [200, 140, 300, 140 + 25], 'OK', { name : 'ok'});
    dialog.radioNoIndent.onClick = function (){
      convert('noindent');
      dialog.txt.text = val;
    };
    dialog.radioIndent.onClick = function (){
      convert('indent');
      dialog.txt.text = val;
    };
    dialog.radioCompress.onClick = function (){
      convert('compress');
      dialog.txt.text = val;
    };
    dialog.show();

  } else {
    alert('テキストレイヤーを選択してください');
  }
}
convertCSS();
