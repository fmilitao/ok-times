var RandomQuestion;
(function (RandomQuestion) {
    // TODO finish copying table
    //from http://www.bbc.com/news/blogs-magazine-monitor-28143553
    var WEIGHTS = [
        1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1,
        1, 1, 10, 1, 30, 30, 30, 30, 1, 1, 10,
        1, 1, 20, 1, 40, 40, 60, 40, 1, 1, 40,
        1, 1, 1, 1, 1, 10, 10, 10, 1, 1, 30,
        1, 1, 10, 40, 10, 50, 70, 80, 1, 1, 80,
        1, 1, 10, 40, 10, 50, 70, 80, 1, 1, 80,
        1, 1, 10, 60, 80, 80, 90, 90, 1, 1, 80,
        1, 1, 10, 50, 70, 80, 80, 80, 1, 1, 80,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10,
        1, 1, 10, 40, 10, 50, 70, 70, 60, 10, 80,
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
    var score = 0;
    var help = true;
    var attempt = '';
    var answer = '';
    var question = '';
    var wrong = 0;
    var timer = 0;
    var ask = null;
    var mode = '';
    function nextQuestion() {
        var _a = ask(), x = _a[0], y = _a[1];
        attempt = '';
        answer = (x * y).toString();
        question = x + ' * ' + y + ' ?';
        timer = 0;
    }
    ;
    function switchQuestionFormat() {
        mode = ask === RandomQuestion.ask ? 'Sequential' : 'Random';
        ask = ask === RandomQuestion.ask ? SequentialQuestion.ask : RandomQuestion.ask;
        nextQuestion();
    }
    ;
    function addNumber(n) {
        var tmp = attempt + n.toString();
        //console.log(res+' '+tmp+' '+res.indexOf(tmp));
        if (answer.indexOf(tmp) !== 0) {
            wrong = 200;
        }
        attempt = tmp;
    }
    ;
    window.onkeyup = function (e) {
        if (e.keyCode === 13) {
            nextQuestion();
            return;
        }
        if (e.keyCode === 72) {
            help = !help;
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
    };
    var html_question = document.getElementById('question');
    var html_mode = document.getElementById('mode');
    var html_score = document.getElementById('score');
    var html_attempt = document.getElementById('attempt');
    var html_answer = document.getElementById('answer');
    var past = Date.now();
    function draw() {
        var now = Date.now();
        var dt = now - past;
        past = now;
        if (wrong > 0) {
            html_attempt.style.color = "red";
        }
        else {
            html_attempt.style.color = "black";
        }
        html_question.innerHTML = question;
        var padded_attempt = attempt;
        while (padded_attempt.length < answer.length) {
            padded_attempt = padded_attempt + ' ';
        }
        html_attempt.innerHTML = padded_attempt;
        if (help) {
            // help if too much time without correct answer
            html_answer.style.color = "rgba(0, 0, 0, " + Math.min(((timer - 4000) / 9000), 0.5) + ")";
            html_answer.innerHTML = answer;
        }
        // timer
        html_mode.innerHTML = mode + (help ? ' (help on) ' : '') + ' ' + (Math.round(timer / 1000)) + 's';
        html_score.innerHTML = 'score: ' + score;
        if (attempt === answer) {
            score += 10 + (timer < 9000 ? Math.round(50 * (1 - ((timer + 1) / 6000))) : 0);
            nextQuestion();
        }
        if (wrong > 0) {
            wrong -= dt;
            if (wrong <= 0) {
                attempt = '';
            }
        }
        timer += dt;
        requestAnimationFrame(draw);
    }
    ;
    switchQuestionFormat();
    draw();
};
