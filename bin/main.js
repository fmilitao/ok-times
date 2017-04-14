var Params;
(function (Params) {
    Params.timesText = "times";
    Params.readLocale = "en-US";
    Params.listenLocale = "en-US";
    Params.readQuestions = true;
    Params.listenAnswers = true;
    Params.showHint = true;
    Params.questionMode = 'random';
    var splitParameters = document.URL.split('?');
    if (splitParameters.length > 1) {
        for (var _i = 0, _a = splitParameters[1].split('&'); _i < _a.length; _i++) {
            var parameter = _a[_i];
            var keyValuePair = parameter.split('=');
            if (keyValuePair.length > 1) {
                var key = keyValuePair[0], value = keyValuePair[1];
                switch (key) {
                    case 'mode':
                        Params.questionMode = value;
                        break;
                    case 'show-hint':
                        Params.showHint = value.toLowerCase() === 'true';
                        break;
                    case 'read-locale':
                        Params.readLocale = value;
                        break;
                    case 'listen-locale':
                        Params.listenLocale = value;
                        break;
                    case 'locale':
                        Params.readLocale = value;
                        Params.listenLocale = value;
                        break;
                    case 'times-text':
                        Params.timesText = value;
                        break;
                    case 'read-questions':
                        Params.readQuestions = value.toLowerCase() === 'true';
                        break;
                    case 'listen-answers':
                        Params.listenAnswers = value.toLowerCase() === 'true';
                        break;
                    default:
                        console.warn("Ignoring unknown paramter: " + key + "=" + value + ".");
                        break;
                }
            }
        }
    }
})(Params || (Params = {}));
;
var Questions;
(function (Questions) {
    function parse(mode) {
        var normalizedMode = mode.trim().toLowerCase();
        if (normalizedMode === 'random') {
            return Random.ask;
        }
        if (normalizedMode === 'sequential') {
            return Sequential.ask;
        }
        throw ("Error: unknown mode " + mode + ".");
    }
    Questions.parse = parse;
    ;
    var Random;
    (function (Random) {
        var WEIGHTS = [
            10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
            10, 10, 10, 10, 30, 30, 30, 30, 10, 10, 10,
            10, 10, 20, 10, 40, 40, 60, 40, 10, 10, 40,
            10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 30,
            10, 10, 10, 40, 10, 50, 70, 80, 10, 10, 80,
            10, 10, 10, 40, 10, 50, 70, 80, 10, 10, 80,
            10, 10, 10, 60, 80, 80, 90, 90, 10, 10, 80,
            10, 10, 10, 50, 70, 80, 80, 80, 10, 10, 80,
            10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
            10, 10, 10, 40, 10, 50, 70, 10, 80, 10, 10,
            10, 10, 10, 40, 10, 50, 70, 70, 60, 10, 80,
        ];
        var MAX = WEIGHTS.reduce(function (old, curr) { return old + curr; }, 0);
        function ask() {
            var rd = Math.round(MAX * Math.random());
            var weightsAccum = 0;
            for (var i = 0; i < WEIGHTS.length; ++i) {
                weightsAccum += WEIGHTS[i];
                if (weightsAccum >= rd) {
                    return [Math.floor(i / 11) + 2, (i % 11) + 2];
                }
            }
            throw ("Error: did not find question " + rd + " " + MAX + " " + weightsAccum + ".");
        }
        Random.ask = ask;
        ;
    })(Random = Questions.Random || (Questions.Random = {}));
    ;
    var Sequential;
    (function (Sequential) {
        var questionPosition = 0;
        function ask() {
            var currentQuestion = questionPosition;
            questionPosition = (questionPosition + 1) % (11 * 11);
            return [Math.floor(currentQuestion / 11) + 2, (currentQuestion % 11) + 2];
        }
        Sequential.ask = ask;
        ;
    })(Sequential = Questions.Sequential || (Questions.Sequential = {}));
    ;
})(Questions || (Questions = {}));
;
window.onload = function () {
    var html_listener_status = document.getElementById('listenerStatus');
    var html_listener_mode = document.getElementById('listenerMode');
    var html_reader_mode = document.getElementById('readerMode');
    var html_mode = document.getElementById('mode');
    var html_score = document.getElementById('score');
    var html_points = document.getElementById('points');
    var html_question = document.getElementById('question');
    var html_attempt = document.getElementById('attempt');
    var html_answer = document.getElementById('answer');
    var html_add = document.getElementById('add');
    var KEY_ENTER = 13;
    var KEY_H = 72;
    var KEY_Q = 81;
    var KEY_0 = 48;
    var KEY_9 = 57;
    var HINT_START = 4000;
    var HINT_FULL = 9000;
    var HINT_MAX_OPACITY = 0.5;
    var MIN_SCORE = 10;
    var MAX_SCORE = 90;
    var SCORE_TIME = 7000;
    var WRONG_ATTEMPT_HIGHLIGHT_TIMEOUT = 1000;
    var RIGHT_ANSWER_HIGHLIGHT_TIMEOUT = 1000;
    var SCORE_ADD_NOTIFICATION_TIMEOUT = 1500;
    var showHintAfterSomeTime = Params.showHint;
    var multiplicationQuestion = Questions.parse(Params.questionMode);
    var score = 0;
    var attempt = '';
    var answer = '';
    var question = '';
    var questionStartTime = 0;
    var highlightWrongAnswerTimeout = 0;
    var highlightRightAnswerTimeout = 0;
    var addScoreNotificationTimeout = 0;
    function startListening() {
        html_listener_status.innerHTML = "<b>Speak up!</b>";
        Speech.initRecognition(Params.listenLocale, function (text) {
            html_listener_status.innerHTML = "<i>" + text + "</i>";
            var lastWord = text.split(' ');
            lastWord = lastWord[lastWord.length - 1];
            var numbersOnly = lastWord.replace(/\D/g, '');
            if (numbersOnly.length > 0) {
                updateAttempt(parseInt(numbersOnly));
                update();
            }
        });
    }
    function stopListening() {
        html_listener_status.innerHTML = "(Not listening.)";
        Speech.abortRecognition();
    }
    ;
    function nextQuestion() {
        var _a = multiplicationQuestion(), x = _a[0], y = _a[1];
        var q = x + ' &times; ' + y;
        if (q === question) {
            nextQuestion();
            return;
        }
        if (Params.listenAnswers && Params.readQuestions) {
            stopListening();
            Speech.say(x + " " + Params.timesText + " " + y, Params.readLocale, function (event) {
                startListening();
            });
        }
        else {
            if (Params.readQuestions) {
                Speech.say(x + " " + Params.timesText + " " + y, Params.readLocale);
            }
            if (Params.listenAnswers) {
                stopListening();
                startListening();
            }
        }
        attempt = '';
        answer = (x * y).toString();
        question = x + ' &times; ' + y;
        questionStartTime = Date.now();
        ProgressTracker.select(x - 2, y - 2);
    }
    ;
    function switchQuestionFormat() {
        multiplicationQuestion = multiplicationQuestion === Questions.Random.ask ? Questions.Sequential.ask : Questions.Random.ask;
        nextQuestion();
    }
    ;
    window.onkeyup = function (e) {
        if (e.keyCode === KEY_ENTER) {
            ProgressTracker.deselect();
            nextQuestion();
            return;
        }
        if (e.keyCode === KEY_H) {
            showHintAfterSomeTime = !showHintAfterSomeTime;
            return;
        }
        if (e.keyCode === KEY_Q) {
            ProgressTracker.deselect();
            switchQuestionFormat();
            return;
        }
        if (e.keyCode >= KEY_0 && e.keyCode <= KEY_9) {
            updateAttempt(e.keyCode - KEY_0);
            update();
            return;
        }
    };
    window.onresize = function () {
        var FRACTIONS = Math.round(window.innerHeight / 13);
        html_question.style.paddingTop = (1 * FRACTIONS) + 'px';
        html_question.style.fontSize = (2 * FRACTIONS) + 'px';
        html_attempt.style.paddingTop = (4 * FRACTIONS) + 'px';
        html_attempt.style.fontSize = (5 * FRACTIONS) + 'px';
        html_answer.style.paddingTop = html_attempt.style.paddingTop;
        html_answer.style.fontSize = html_attempt.style.fontSize;
        ProgressTracker.init(window.innerWidth, window.innerHeight, FRACTIONS);
    };
    window.onresize(null);
    html_mode.onclick = switchQuestionFormat;
    html_score.onclick = function () { return showHintAfterSomeTime = !showHintAfterSomeTime; };
    function loop(fps, callback) {
        var fpsInterval = 1000 / fps;
        var then = Date.now();
        var startTime = then;
        function animate() {
            requestAnimationFrame(animate);
            var now = Date.now();
            var elapsed = now - then;
            if (elapsed > fpsInterval) {
                then = now;
                callback();
            }
        }
        animate();
    }
    ;
    function updateAttempt(n) {
        if (highlightRightAnswerTimeout !== 0) {
            return;
        }
        if (highlightWrongAnswerTimeout > 0) {
            attempt = '';
            highlightWrongAnswerTimeout = 0;
            html_attempt.style.color = "black";
        }
        var completeAttempt = attempt + n.toString();
        if (answer.indexOf(completeAttempt) !== 0) {
            highlightWrongAnswerTimeout = Date.now() + WRONG_ATTEMPT_HIGHLIGHT_TIMEOUT;
            html_attempt.style.color = "red";
        }
        attempt = completeAttempt;
    }
    ;
    function update() {
        if (highlightRightAnswerTimeout !== 0) {
            if (Date.now() > highlightRightAnswerTimeout) {
                highlightRightAnswerTimeout = 0;
                attempt = '';
                html_attempt.style.color = "black";
                nextQuestion();
            }
            else {
                return;
            }
        }
        var timeOnQuestion = Date.now() - questionStartTime;
        html_question.innerHTML = question;
        if (highlightWrongAnswerTimeout !== 0 && Date.now() > highlightWrongAnswerTimeout) {
            attempt = '';
            highlightWrongAnswerTimeout = 0;
            html_attempt.style.color = "black";
        }
        var padded_attempt = attempt;
        while (padded_attempt.length < answer.length) {
            padded_attempt = padded_attempt + ' ';
        }
        html_attempt.innerHTML = padded_attempt;
        if (showHintAfterSomeTime) {
            var hint_opacity = Math.min(((timeOnQuestion - HINT_START) / HINT_FULL), HINT_MAX_OPACITY);
            html_answer.style.textShadow = "0px 0px 15px rgba(99, 99, 99, " + hint_opacity + ")";
            html_answer.innerHTML = answer;
        }
        else {
            html_answer.style.textShadow = "none";
        }
        var maxScore = MIN_SCORE + (timeOnQuestion < SCORE_TIME ? Math.round(MAX_SCORE * (1 - ((timeOnQuestion + 1) / SCORE_TIME))) : 0);
        html_points.innerHTML = 'max. points: ' + maxScore + ' (' + (Math.floor(timeOnQuestion / 1000)) + 's)';
        html_mode.innerHTML = multiplicationQuestion === Questions.Random.ask ? 'Random' : 'Sequential';
        html_score.innerHTML = (showHintAfterSomeTime ? ' [help on] ' : '') + 'score: ' + score;
        if (attempt === answer) {
            if (Params.listenAnswers) {
                stopListening();
            }
            score += maxScore;
            addScoreNotificationTimeout = Date.now() + SCORE_ADD_NOTIFICATION_TIMEOUT;
            html_add.innerHTML = '+' + maxScore + '!';
            var color = maxScore > 50 ? ProgressTracker.GREEN : (maxScore <= 10 ? ProgressTracker.RED : ProgressTracker.YELLOW);
            var message = maxScore > 50 ? "Excellent!!" : (maxScore <= 10 ? "Correct." : "Good!");
            ProgressTracker.deselect(color);
            highlightRightAnswerTimeout = Date.now() + RIGHT_ANSWER_HIGHLIGHT_TIMEOUT;
            html_attempt.style.color = "green";
            html_attempt.innerHTML = answer + "<font size=10pt><br/><i>" + message + "</i></font>";
        }
        if (Date.now() > addScoreNotificationTimeout) {
            html_add.innerHTML = '';
        }
    }
    ;
    if (Params.listenAnswers) {
        html_listener_mode.innerHTML = "Listening answers in " + Params.listenLocale + ".";
        html_listener_status.title = "Click to force speech recognition restart.";
        html_listener_status.onclick = function () {
            console.log('Forced speech restart!');
            stopListening();
            startListening();
        };
    }
    else {
        html_listener_mode.innerHTML = "Listening answers disabled.";
    }
    if (Params.readQuestions) {
        html_reader_mode.innerHTML = "Reading questions in " + Params.readLocale + ".";
    }
    else {
        html_reader_mode.innerHTML = "Reading questions disabled.";
    }
    nextQuestion();
    loop(10, update);
};
//# sourceMappingURL=main.js.map