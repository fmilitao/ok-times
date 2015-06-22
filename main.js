var RandomQuestion;
(function (RandomQuestion) {
    // TODO finish copying table
    //from http://www.bbc.com/news/blogs-magazine-monitor-28143553
    var WEIGHTS = [
        1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1,
        1, 1, 10, 1, 30, 30, 30, 30, 1, 1, 10,
        1, 1, 20, 1, 40, 40, 60, 40, 1, 1, 40,
        1, 1, 1, 1, 1, 10, 10, 10, 1, 1, 10,
        1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10,
        1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10,
        1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10,
        1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10,
        1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10,
        1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10,
        1, 1, 10, 40, 10, 50, 50, 70, 60, 10, 80,
    ];
    var MAX = WEIGHTS.reduce(function (old, curr) { return old + curr; }, 0);
    function ask() {
        // random = [0, 1[
        var rd = Math.round(MAX * Math.random());
        var accum = 0;
        for (var i = 0; i < WEIGHTS.length; ++i) {
            accum += WEIGHTS[i];
            if (accum >= rd) {
                // floor is intentional to ensure 0..11 on same 'x'
                return [Math.floor(i / 11) + 2, (i % 11) + 2];
            }
        }
        throw ('Error: did not find question.' + rd + ' ' + MAX + ' ' + accum);
    }
    RandomQuestion.ask = ask;
    ;
})(RandomQuestion || (RandomQuestion = {}));
;
var SequentialQuestion;
(function (SequentialQuestion) {
    var aux = 0;
    function ask() {
        var i = aux; // increments to next
        aux = (aux + 1) % (11 * 11);
        return [Math.floor(i / 11) + 2, (i % 11) + 2];
    }
    SequentialQuestion.ask = ask;
    ;
})(SequentialQuestion || (SequentialQuestion = {}));
;
var Test;
(function (Test) {
    function testRandomQuestion() {
        var tmp = {};
        var i = 10000;
        while (i-- > 0) {
            var _a = RandomQuestion.ask(), x = _a[0], y = _a[1];
            var m = x + '*' + y;
            tmp[m] = tmp[m] === undefined ? 0 : tmp[m] + 1;
        }
        for (var i_1 = 2; i_1 <= 12; i_1++) {
            var s = '';
            for (var j = 2; j <= 12; j++) {
                var v = tmp[i_1 + '*' + j];
                if (v === undefined)
                    s += '\t' + 0;
                else
                    s += '\t' + v;
            }
            console.log(s);
        }
    }
    Test.testRandomQuestion = testRandomQuestion;
    ;
    function testSequentialQuestion() {
        var i = 12 * 12;
        while (i-- > 0) {
            console.log(SequentialQuestion.ask());
        }
    }
    Test.testSequentialQuestion = testSequentialQuestion;
    ;
})(Test || (Test = {}));
;
window.onload = function () {
    var W = window.innerWidth - 4;
    var H = window.innerHeight - 4;
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    canvas.focus();
    ctx.canvas.width = W;
    ctx.canvas.height = H;
    ctx.font = '40pt monospace';
    // ...
    var val = 0;
    var res = 0;
    var str = '';
    var ask = SequentialQuestion.ask;
    function redraw() {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#000000";
        if (val === res) {
            var _a = ask(), x = _a[0], y = _a[1];
            val = 0;
            res = x * y;
            str = x + ' * ' + y + ' ?';
        }
        ctx.fillText(str, 0, H / 2);
        if (val !== 0)
            ctx.fillText('' + val, 0, H / 2 + 50);
    }
    ;
    function keyUp(e) {
        console.log(e);
        if (e.keyCode === 13) {
            val = 0;
            res = 0;
            redraw();
            return;
        }
        if (e.keyCode === 81) {
            ask = ask === SequentialQuestion.ask ? RandomQuestion.ask : SequentialQuestion.ask;
            val = 0;
            res = 0;
            redraw();
            return;
        }
        // key numbers
        if (e.keyCode >= 48 && e.keyCode <= 57) {
            var k = e.keyCode - 48;
            val = val * 10 + k;
            redraw();
            return;
        }
    }
    ;
    window.addEventListener("keyup", keyUp, true);
    redraw();
};
