var m =
    "一二三四五六七八九十口日月田目古明晶品呂早世自白中昇上下朝員見元頑万句的首\
乱直具真工左有切昭別町可子女好母小少大多夕汐外名石光太臭奇川水原願活消況土\
時火点魚埋同洞向字守完安寄貯木森柏朴村相机本未末味若苦葉暮犬状黙然猫牛特告\
先洗介界茶合塔王玉宝現全理主注柱金道導迫逃辺車連前格客夏条落冗運夢高塾京週\
士売学覚書敗故言計話詩語読調談式試域成城止歩企歴正定走超越是題建遠初布市姉\
製転雨雲冬天立泣章鐘商適敵叱頃北背比皆毎海乾腹複歌次姿音識境亡荒望方放激説\
増贈東地虹風起記電家豪場羊美詳達差着誰集進雑準確午許習曜濯困国因回店庭磨心\
忘認誌思恩応意想息恐惑感怖慌愉憶必手摩我議打捨指持拾描接掛研才財材存在及丈\
史奴怒友抜投設支反坂返乳浮将受授愛払広鉱弁始窓去法会至室致互育流出山岩密崎\
入込分貧公谷浴容欲常婆破残死瞬耳取最恥職聖敢聴懐慢買置環夫規替失蔵覧力男努\
励加協行律得待彼役徴街程和私秘利米迷奥数類様求球笑答人住位仲体件仕他伝休仮\
信例健側使便優傷付任代袋貸化花何荷俺内座挫卒傘以似宮年夜施遊旅物屋屈居局遅\
沢訳戸房戻涙示礼社視由油届笛押申伸神捜果所近折断質昨作急寝婦掃当争事康君両\
満画曲料図用備昔借散席度渡半伴判巻勝片不杯族知帰引強第与写身謝老考教者暑諸\
追師父効校足路踏過際随陽院降隣隠空突究窟探深丘糸締練緒続絵絡結終紀紹経約絹\
繰緑後幾機玄係懸服命冷鈴湧通危腕留印興酒配頭喜血盛爵退限眼良朗娘食飯飲館平\
呼評希胸離殺純璧避新薪親幸報刻述寒譲嬢素麦青情晴静績表割生星性春実勤難華乗\
今含念予預野嫌西価要南問間簡開閉聞非悲輩決快偉違干余除途束頼速整剣険重動働\
種病痴症疲痛医迎発形影杉顔参修珍文対済楽率英映赤変跡恋横色絶甘期基貴無粗助\
並普業僕共供異選囲悪触解再講構論編冊氏紙婚低民眠部郷響派脈段司伺詞飼航盤船\
暇来気飛妻面声誤邪番長張展単戦弾悩厳島援偶逆揺晩勉象馬験駅騒驚能態振送関魔\
雰也噂吠叶噌嬉牢靖醤雫澤";
var PRIMITIVES = "艹亠聿戈𢦏巛巜⺀䒑儿" + "昜翟𠘨兑";

KANJI += '澤';
KANJI = KANJI + PRIMITIVES;

var kanji2number = {};
_.each(KANJI.split(""), function(k, i) { kanji2number[k] = i+1; });

var _response;
var eidsarr;
var db = {};

var mimidb;

var DONTINCLUDE = "洛或妾舜曼竹奄坐勿叩屯巽昏";
var MIMIPRIMITIVES =
    "升貝勺千舌刀召丁肖兄寺占里林右莫苗各軍享丸周吾炎制\
衣云童匕乞曽羽廷麻忍志義舎旨圭台穴波旦呈列則吏更憂斤矢弔射孝交祭帝吉系県令\
勇宛官凶辛亥責害兼門丙景彦斉黄般呉免敬辰鬼尊";
MIMIPRIMITIVES += DONTINCLUDE;
// MIMIPRIMITIVES = "";

var MIMIKANJI = MIMIPRIMITIVES + m;

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

    // mimi kanji that could be simplified by pruning non-mimi
    var mPrim = PRIMITIVES + MIMIKANJI;
    var noMatchRTK13VsMimi = compareStringsToPrune(m, mPrim);
    var carets2brackets =
        function(s) { return s.replace(/</g, "[").replace(/>/g, "]"); };
    if (noMatchRTK13VsMimi.length > 0) {
        d3.select("#cont")
            .selectAll("div")
            .data(noMatchRTK13VsMimi)
            .enter()
            .append("div")
            .html(function(d, i) {
            return "<hr>" + d + ": #" + kanji2number[d] + "<br>" +
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
            return "#" + kanji2number[d] + ":<br>" +
                   carets2brackets(prune(db[d].indent, mPrim)) + "<hr>";
        }).style("white-space", "pre");
    }
});

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
