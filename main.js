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
    var FONT_H = 50;
    var W = window.innerWidth - 4;
    var H = window.innerHeight - 4;
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    canvas.focus();
    ctx.canvas.width = W;
    ctx.canvas.height = H;
    ctx.font = FONT_H + 'pt monospace';
    // ...
    var val = ''; // attempt
    var res = ''; // answer
    var str = ''; // question
    var wrong = 0;
    var ask = SequentialQuestion.ask;
    function nextQuestion() {
        var _a = ask(), x = _a[0], y = _a[1];
        val = '';
        res = (x * y).toString();
        str = x + ' * ' + y + ' ?';
    }
    ;
    function switchQuestionFormat() {
        ask = ask === SequentialQuestion.ask ? RandomQuestion.ask : SequentialQuestion.ask;
        nextQuestion();
    }
    ;
    function addNumber(n) {
        var tmp = val + n.toString();
        //console.log(res+' '+tmp+' '+res.indexOf(tmp));
        if (res.indexOf(tmp) == -1) {
            wrong = 200;
        }
        val = tmp;
    }
    ;
    function keyUp(e) {
        if (e.keyCode === 13) {
            nextQuestion();
            return;
        }
        if (e.keyCode === 81) {
            switchQuestionFormat();
            return;
        }
        if (e.keyCode >= 48 && e.keyCode <= 57) {
            addNumber(e.keyCode - 48);
            return;
        }
    }
    ;
    window.addEventListener("keyup", keyUp, true);
    var past = Date.now();
    function draw() {
        var now = Date.now();
        var dt = now - past;
        past = now;
        // cleans background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#000000";
        if (wrong > 0) {
            ctx.fillStyle = "#ff0000";
        }
        else {
            ctx.fillStyle = "#000000";
        }
        ctx.fillText(str, 0, H / 2);
        ctx.fillText(val, 0, H / 2 + FONT_H);
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillText(res, 0, H / 2 + FONT_H);
        if (val === res) {
            nextQuestion();
        }
        if (wrong > 0) {
            wrong -= dt;
            if (wrong <= 0) {
                val = '';
            }
        }
        requestAnimationFrame(draw);
    }
    ;
    draw();
};
