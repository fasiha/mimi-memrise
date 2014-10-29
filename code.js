var m = mimi790;
m = mimi1503;

var PRIMITIVES = "艹亠聿戈𢦏巛巜⺀䒑儿" + "昜翟𠘨兑爫廾𠫓豕𦍌习殳禾氺";

KANJI += '澤籠';
KANJI = KANJI + PRIMITIVES;

var kanji2number = {};
_.each(KANJI.split(""), function(k, i) { kanji2number[k] = i + 1; });

var _response;
var eidsarr;
var db = {};

var mimidb;

var DONTINCLUDE = "洛或妾舜曼竹奄坐勿叩屯巽昏晃此";
var MIMIPRIMITIVES =
    "升貝勺千舌刀召丁肖兄寺占里林右莫苗各軍享丸周吾炎制\
衣云童匕乞曽羽廷麻忍志義舎旨圭台穴波旦呈列則吏更憂斤矢弔射孝交祭帝吉系県令\
勇宛官凶辛亥責害兼門丙景彦斉黄般呉免敬辰鬼尊刃酋" +
    "昌旧胡亘朋壮喬昆竜串荒戒乃";
MIMIPRIMITIVES += DONTINCLUDE;
MIMIPRIMITIVES = "";

m = m + MIMIPRIMITIVES;

var d3Tree = d3.layout.tree().children(function(d){return d.chillenz});

d3.xhr('eids.txt', 'text/plain', function(err, req) {
    if (err) {
        return console.error(err);
    }

    _response = req.responseText;
    // eidsarr = _response.match(/.:\n.*\n(【.*\n(?: .*\n)*)/g);
    XRegExp.forEach(_response, /(.):\n(.*)\n(【.*\n(?: .*\n)*)/g,
                    function(match) {
        db[match[1]] = {all : match[2], indent : match[3]};
    });
    mimidb = _.map(m.split(""), function(s) { return db[s]; });
    // Sort in Heisig order (RTK1 vs 3 split :(
    m = _.sortBy(m.split(""), function(s) { return kanji2number[s]; }).join("");

    // mimi kanji that could be simplified by pruning non-mimi
    var mPrim = PRIMITIVES + m;
    var noMatchRTK13VsMimi = compareStringsToPrune(m, mPrim);
    var carets2brackets =
        function(s) { return s.replace(/</g, "[").replace(/>/g, "]"); };
    var indent2oneline = function(s) { return s.replace(/\n +/g, ''); };
    if (noMatchRTK13VsMimi.length > 0) {

        d3.select("#cont")
            .selectAll("div")
            .data(noMatchRTK13VsMimi)
            .enter()
            .append("div")
            .html(function(d, i) {
            var mimiPruned = d3Tree(
                convertIndentToJSON(prune(db[d].indent, m + PRIMITIVES)));
            var fullyPruned = d3Tree(convertIndentToJSON(prune(db[d].indent)));
            var diffs = _.unique(_.difference(_.pluck(mimiPruned, 'namae'),
                                              _.pluck(fullyPruned, 'namae')));

            var sortedNodes = _.sortBy(
                _.flatten(_.map(diffs, function(name){return _.where(
                                           mimiPruned, {'namae' : name})})),
                'depth');
            var linkBreak = "(break at " + sortedNodes[0].namae + ")";

            return "<hr>" + d + ": #" + kanji2number[d] + linkBreak + "<br>" +
                   carets2brackets(prune(db[d].indent)) + "<br><br>" +
                   carets2brackets(prune(db[d].indent, mPrim));
        }).style("white-space", "pre");
    } else {
        d3.select("#cont")
            .selectAll("div")
            .data(m.split(""))
            .enter()
            .append("div")
            .html(function(d, i) {
            return "#" + kanji2number[d] + ": " +
                   indent2oneline(carets2brackets(prune(db[d].indent, mPrim)));
        }).style("white-space", "pre");
    }

});

function getLeaves(indented) {
    return _.pluck(_.filter(d3Tree(convertIndentToJSON(indented)), function(d) {
                       return typeof d.chillenz === 'undefined';
                   }),
                   'namae');
}

function convertIndentToJSON(indented) {
    function findNumLeadingSpaces(s) { return s.match(/ */)[0].length; }
    function repeat(s, n) {
        return _.range(n).map(function() { return s; }).join("");
    }

    var arr = indented.split("\n");
    var numSpaces = _.map(arr, findNumLeadingSpaces);
    // requires last cahracter to be a newline, so arr[-1] is ''
    return JSON.parse(
        _.map(_.zip(arr, _.range(arr.length)), function(di) {
                  var d = '"' + di[0].replace(/ /g, "") + '", ', i = di[1];
                  if (i < arr.length - 1) {
                      var diff = numSpaces[i] - numSpaces[i + 1];
                      if (diff < 0) {
                          return '{"namae": ' + d + '"chillenz": [';
                      } else if (diff > 0) {
                          return '{"namae": ' + d + '}' +
                                 repeat("]}, ", diff / 2);
                      } else {
                          return '{"namae": ' + d + '}, ';
                      }
                  }
                  return "";
              })
            .join("")
            .replace(/, (\}|\]|$)/g, "$1"));
}

function convertIndentToJSONArray(indented) {
    function findNumLeadingSpaces(s) { return s.match(/ */)[0].length; }
    function repeat(s, n) {
        return _.range(n).map(function() { return s; }).join("");
    }

    var arr = indented.split("\n");
    var numSpaces = _.map(arr, findNumLeadingSpaces);
    // requires last cahracter to be a newline, so arr[-1] is ''
    return JSON.parse(
        _.map(_.zip(arr, _.range(arr.length)), function(di) {
                  var d = '"' + di[0].replace(/ /g, "") + '", ', i = di[1];
                  if (i == arr.length - 1) {
                      return "";
                  } else {
                      var diff = numSpaces[i] - numSpaces[i + 1];
                      return (diff < 0 ? "[" : "") + d +
                             (diff > 0 ? repeat("], ", diff / 2) : "");
                  }
              })
            .join("")
            .replace(/, (\]|$)/g, "$1"));
}

function compareStringsToPrune(mimi, s1, s2) {
    return _.filter(mimi.split(""), function(s) {
        var indented = db[s].indent;
        return prune(indented, s1) != prune(indented, s2);
    });
}

function prune(indentedString, stringsToPrune) {
    if (typeof stringsToPrune === 'undefined') {
        stringsToPrune = KANJI;
    }

    var massiveHanStr =
        '[⺀-\\u2efe㇀-\\u31ee㈀-㋾㌀-㏾㐀-\\u4dbe一-\\u9ffe豈-\\ufafe︰-﹎]|[\\ud840-\\ud868\\ud86a-\\ud86c][\\udc00-\\udfff]|\\ud869[\\udc00-\\udede\\udf00-\\udfff]|\\ud86d[\\udc00-\\udf3e\\udf40-\\udfff]|\\ud86e[\\udc00-\\udc1e]|\\ud87e[\\udc00-\\ude1e]';
    var hanRe = XRegExp(massiveHanStr);
    var spacesAnglesHanRe = XRegExp(' +<' + massiveHanStr + '>');

    var arr = indentedString.split('\n');

    for (var i = 0; i < arr.length; i++) {
        if (arr[i].search(spacesAnglesHanRe) >= 0) {
            var subKanji = arr[i].match(hanRe)[0],
                numSpaces = arr[i].search(subKanji) - 1,
                loc = stringsToPrune.indexOf(subKanji);
            if (loc >= 0) {
                // Prune tree!
                arr[i] = arr[i].replace(/>./, "").replace("<", "");
                for (var j = i + 1; j < arr.length; j++) {
                    if (arr[j].search(XRegExp(' {' + (numSpaces + 2) + '}')) >=
                        0) {
                        arr.splice(j, 1);
                        j--;
                    } else {
                        break;
                    }
                }
            }
        }
    }
    return arr.join('\n');
}
