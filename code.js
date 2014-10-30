// Decide what list of Core5k-kanji we're operating on, and any other kanji NOT
// in those lists that are used as building blocks by those in the list.
var MIMIPRIMITIVES;
var m;
if (!false) {
    // Found using kanjiForPrimitives, and sorted according to RTK13 number
    MIMIPRIMITIVES =
        "吾朋昌亘旧升貝勺召肖圭灰苗呈享亭壮帝匕昆乞荒曽廷竜麻忍串憂戒乃吏隻叔" +
        "采" +
        "允丙勿尉斤斥唐之弔孝諸畜系卸宛凶亥奉垂票侯彦甚呉寅辰屯此奄呑尤或尭甫" +
        "曼云喬莫叩呆庄洛逢愈晃昏胡妾筑坐朔巽酋舜龍而";
    m = mimi1503;
} else {
    MIMIPRIMITIVES =
        "吾旦千舌升丸占貝勺右刀刃召則丁兄肖圭寺炎里林苗呈各軍享景舎周吉敬衣制" +
        "帝" +
        "童匕旨乞曽廷県羽麻忍志憂義吏更台波列竹丙勿祭斤矢弔射孝官交穴系令勇宛" +
        "尊凶辛亥責害兼門彦斉黄般呉免辰鬼屯奄或曼云莫叩洛昏妾坐巽酋舜";
    var m = mimi790;
}
m = m + MIMIPRIMITIVES;

// Here are some commonly-occurring patterns...
commonPatterns = "喿";

// These are global primitives that we don't want to break down, ever. Note that
// most of these are non-kanji radicals.
var PRIMITIVES = "艹亠聿戈𢦏巛巜⺀䒑儿昜翟𠘨兑爫廾𠫓豕𦍌习殳禾氺";

// These are kanji that are NOT in the RTK13 list that might be in the
// Mimi/Core5k lists.
KANJI += '澤籠';
KANJI = KANJI + PRIMITIVES;

// Here's a dictionary converting kanji to extra-RTK13 numbers
var kanji2number = {};
_.each(KANJI.split(""), function(k, i) { kanji2number[k] = i + 1; });

// Here are some globals that are useful
var _response;
var eidsarr;
var db = {};
var mimidb;
var d3Tree = d3.layout.tree().children(function(d){return d.chillenz});
var kanjiForPrimitives;

// The main workhorse
d3.xhr('eids.txt', 'text/plain', function(err, req) {
    if (err) {
        return console.error(err);
    }

    _response = req.responseText;
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
        // Find the kanji that differ between the RTK13-fully-pruned tree and
        // the Mimi-plus-MIMIPRIMITIVES-pruned trees
        var linkBreak = _.map(noMatchRTK13VsMimi, function(d) {
            var mimiPruned = d3Tree(
                convertIndentToJSON(prune(db[d].indent, m + PRIMITIVES)));
            var fullyPruned = d3Tree(convertIndentToJSON(prune(db[d].indent)));

            // Find the nodes that are in one but not the other
            var diffs = _.unique(_.difference(_.pluck(mimiPruned, 'namae'),
                                              _.pluck(fullyPruned, 'namae')));

            // Sort these nodes by depth.
            var sortedNodes = _.sortBy(
                _.flatten(_.map(diffs, function(name) {return _.where(
                                           mimiPruned, {'namae' : name});})),
                'depth');

            // Store the minimum-depth node. Robustness TODO: return all nodes
            // at the lowest depth instead of just one.
            return sortedNodes[0].namae;
        });
        kanjiForPrimitives = _.unique(linkBreak);
        // If these are printed, add them to MIMIPRIMITIVES
        kanjiForPrimitives =
            kanjiForPrimitives.join("").match(XRegExp('\\p{Han}', 'g'));
        console.log(kanjiForPrimitives.join(""));
        console.log(_.map(_.sortBy(kanjiForPrimitives,
                                   function(d) { return kanji2number[d]; }),
                          function(d) { return d + "," + kanji2number[d]; }));

        // Display these non-equivalently-prunable kanji EIDS trees for
        // inspection
        d3.select("#cont")
            .selectAll("div")
            .data(noMatchRTK13VsMimi)
            .enter()
            .append("div")
            .html(function(d, i) {
            breakStr = " (break at " + linkBreak[i] + ")";
            return "<hr>" + d + ": #" + kanji2number[d] + breakStr + "<br>" +
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

function plot(json) {
    var width = 960, height = 200;

    var tree = d3.layout.tree().size([ height, width - 160 ]).children(
        function(d){return d.chillenz;});

    var diagonal =
        d3.svg.diagonal().projection(function(d) { return [ d.y, d.x ]; });

    var svg = d3.select("#viz")
                  .insert("svg", ":first-child")
                  .attr("width", width)
                  .attr("height", height)
                  .append("g")
                  .attr("transform", "translate(40,0)");

    var nodes = tree.nodes(json), links = tree.links(nodes);

    var link = svg.selectAll("path.link")
                   .data(links)
                   .enter()
                   .append("path")
                   .attr("class", "link")
                   .attr("d", diagonal);

    var node =
        svg.selectAll("g.node")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform",
                  function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        node.append("circle")
            .attr("r", 4.5);

    node.append("text")
        .attr("dx", function(d) { return d.children ? -8 : 8; })
        .attr("dy", 3)
        .attr("text-anchor",
              function(d) { return d.children ? "end" : "start"; })
        .text(function(d) { return d.namae; });

    d3.select(self.frameElement).style("height", height + "px");
}


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
