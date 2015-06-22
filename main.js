var RandomQuestion;
(function (RandomQuestion) {
    //TODO incomplete.
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
        1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 80,
    ];
    var MAX = WEIGHTS.reduce(function (old, curr) { return old + curr; }, 0);
    function ask() {
        var rd = Math.floor(MAX * Math.random());
        var accum = 0;
        for (var i = 0; i < WEIGHTS.length; ++i) {
            accum += WEIGHTS[i];
            if (accum >= rd)
                return [Math.floor(i / 11) + 2, (i % 11) + 2];
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
// Test.testRandomQuestion();
Test.testSequentialQuestion();
