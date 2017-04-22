var Params;
(function (Params) {
    Params.timesText = "times";
    Params.readLocale = "en-US";
    Params.listenLocale = "en-US";
    Params.readQuestions = false;
    Params.listenAnswers = false;
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
                    case 'output-locale':
                        Params.readLocale = value;
                        break;
                    case 'input-locale':
                        Params.listenLocale = value;
                        break;
                    case 'locale':
                        Params.readLocale = value;
                        Params.listenLocale = value;
                        break;
                    case 'times-text':
                        Params.timesText = value;
                        break;
                    case 'voice-output':
                        Params.readQuestions = value.toLowerCase() === 'true';
                        break;
                    case 'voice-input':
                        Params.listenAnswers = value.toLowerCase() === 'true' && SpeechCheck.isSpeechRecognitionAvailable();
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
    var html_recording_status = document.getElementById('recording-status');
    var html_recorded_text = document.getElementById('recorded-text');
    var html_recording_symbol = document.getElementById('recording-symbol');
    var html_input_mode = document.getElementById('input-mode');
    var html_output_mode = document.getElementById('output-mode');
    var html_hint_mode = document.getElementById('hint-mode');
    var html_game_mode = document.getElementById('game-mode');
    var html_score = document.getElementById('score');
    var html_timer = document.getElementById('timer');
    var html_points = document.getElementById('points');
    var html_question = document.getElementById('question');
    var html_attempt = document.getElementById('attempt');
    var html_answer = document.getElementById('answer');
    var KEY_ENTER = 13;
    var KEY_SPACEBAR = 32;
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
    var showHintAfterSomeTime = Params.showHint;
    var multiplicationQuestion = Questions.parse(Params.questionMode);
    var score = 0;
    var attempt = '';
    var answer = '';
    var question = '';
    var questionStartTime = 0;
    var highlightWrongAnswerTimeout = 0;
    var highlightRightAnswerTimeout = 0;
    function startListening() {
        html_recording_symbol.innerHTML = '<span class="fa-stack fa-fw">' +
            '<i class="fa fa-circle-o-notch fa-spin fa-stack-2x green-color"></i>' +
            '<i class="fa fa-microphone fa-stack-1x" aria-hidden="true"></i></span>';
        html_recorded_text.innerHTML = '';
        Speech.initRecognition(Params.listenLocale, function (text) {
            html_recorded_text.innerHTML = "<i>" + text + "</i>";
            var lastWord = text.split(' ');
            lastWord = lastWord[lastWord.length - 1];
            var numbersOnly = lastWord.replace(/\D/g, '');
            if (numbersOnly.length > 0) {
                updateAttempt(parseInt(numbersOnly));
                update();
            }
        });
    }
    ;
    function stopListening() {
        html_recording_symbol.innerHTML = '<span class="fa-stack fa-fw">' +
            '<i class="fa fa-ban fa-stack-2x red-color"></i>' +
            '<i class="fa fa-microphone fa-stack-1x" aria-hidden="true"></i></span>';
        html_recorded_text.innerHTML = '';
        Speech.abortRecognition();
    }
    ;
    function nextQuestion() {
        var _a = multiplicationQuestion(), x = _a[0], y = _a[1];
        var newQuestion = x + ' &times; ' + y;
        if (newQuestion === question) {
            nextQuestion();
            return;
        }
        if (Params.listenAnswers && Params.readQuestions) {
            stopListening();
            Talk.say(x + " " + Params.timesText + " " + y, Params.readLocale, function (event) {
                if (highlightRightAnswerTimeout === 0) {
                    startListening();
                }
                else {
                    console.log('denied!!');
                }
            });
        }
        else {
            if (Params.readQuestions) {
                Talk.say(x + " " + Params.timesText + " " + y, Params.readLocale);
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
    function giveUp() {
        if (Params.listenAnswers) {
            stopListening();
        }
        var timeOnQuestion = Date.now() - questionStartTime;
        ProgressTracker.deselect();
        highlightRightAnswerTimeout = Date.now() + RIGHT_ANSWER_HIGHLIGHT_TIMEOUT;
        html_attempt.style.color = "#0D98BA";
        html_attempt.innerHTML = answer
            + "<font size=6pt><br/><i class='fa fa-star-o fa-fw' aria-hidden='true'></i> " + 0
            + '  <i class="fa fa-clock-o fa-fw" aria-hidden="true"></i> ' + Math.floor(timeOnQuestion / 1000) + "s </font>";
    }
    ;
    function switchQuestionFormat() {
        multiplicationQuestion = multiplicationQuestion === Questions.Random.ask ? Questions.Sequential.ask : Questions.Random.ask;
        giveUp();
    }
    ;
    function forceSpeechRecognitionRestart() {
        console.log('Forced speech restart!');
        stopListening();
        startListening();
    }
    ;
    window.onkeyup = function (e) {
        if (e.keyCode === KEY_ENTER && highlightRightAnswerTimeout === 0) {
            giveUp();
            return;
        }
        if (e.keyCode === KEY_H) {
            showHintAfterSomeTime = !showHintAfterSomeTime;
            return;
        }
        if (e.keyCode === KEY_Q) {
            switchQuestionFormat();
            return;
        }
        if (e.keyCode === KEY_SPACEBAR && Params.listenAnswers) {
            forceSpeechRecognitionRestart();
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
        var starIcon = maxScore <= 10 ? 'fa-star-o' : maxScore >= 50 ? 'fa-star' : 'fa-star-half-o';
        html_score.innerHTML = '<i class="fa fa-trophy fa-fw" aria-hidden="true"></i> ' + score;
        html_points.innerHTML = '<i class="fa ' + starIcon + ' fa-fw" aria-hidden="true"></i> ' + maxScore;
        html_timer.innerHTML = '<i class="fa fa-clock-o fa-fw" aria-hidden="true"></i> ' + (Math.floor(timeOnQuestion / 1000)) + 's';
        if (attempt === answer) {
            if (Params.listenAnswers) {
                stopListening();
            }
            score += maxScore;
            var color = maxScore > 50 ? ProgressTracker.GREEN : (maxScore <= 10 ? ProgressTracker.RED : ProgressTracker.YELLOW);
            ProgressTracker.deselect(color);
            highlightRightAnswerTimeout = Date.now() + RIGHT_ANSWER_HIGHLIGHT_TIMEOUT;
            html_attempt.style.color = "green";
            var htmlPoints = "<font size=6pt><br/><i>(+" + maxScore + " points)</i></font>";
            html_attempt.innerHTML = answer
                + "<font size=6pt><br/><i class='fa " + starIcon + " fa-fw' aria-hidden='true'></i> " + maxScore
                + '  <i class="fa fa-clock-o fa-fw" aria-hidden="true"></i> ' + Math.floor(timeOnQuestion / 1000) + "s </font>";
        }
    }
    ;
    function showHint(showHint) {
        html_hint_mode.innerHTML = '<span class="fa-stack fa-fw">' +
            '<i class="fa fa-square-o fa-stack-2x"></i>' +
            '<i class="fa fa-life-saver fa-stack-1x" aria-hidden="true"></i></span> Hints <b>' + (showHintAfterSomeTime ? 'on' : 'off') + '</b>.';
    }
    ;
    html_hint_mode.onclick = function () {
        showHintAfterSomeTime = !showHintAfterSomeTime;
        showHint(showHintAfterSomeTime);
    };
    html_hint_mode.title = 'Press to toggle showing hints.';
    function showGameMode(mode) {
        var icon = mode === Questions.Random.ask ? '<i class="fa fa-random fa-stack-1x" aria-hidden="true"></i>' : '<i class="fa fa-long-arrow-right fa-stack-1x" aria-hidden="true"></i>';
        var text = mode === Questions.Random.ask ? 'random' : 'sequential';
        html_game_mode.innerHTML = '<span class="fa-stack fa-fw"><i class="fa fa-square-o fa-stack-2x"></i>' + icon +
            '</span> Mode <b>' + text + '</b>.';
    }
    ;
    html_game_mode.onclick = function () {
        switchQuestionFormat();
        showGameMode(multiplicationQuestion);
    };
    html_game_mode.title = 'Press to switch between sequential/random modes.';
    if (Params.listenAnswers) {
        html_input_mode.innerHTML = '<span class="fa-stack fa-fw">' +
            '<i class="fa fa-square-o fa-stack-2x"></i>' +
            '<i class="fa fa-microphone fa-stack-1x" aria-hidden="true"></i></span> Input in <b>' + Params.listenLocale + '</b>.';
        html_recording_status.title = "Click or press 'spacebar' to force speech recognition restart.";
        html_recording_status.onclick = forceSpeechRecognitionRestart;
    }
    else {
        if (SpeechCheck.isSpeechRecognitionAvailable()) {
            html_input_mode.innerHTML = '<span class="fa-stack fa-fw">' +
                '<i class="fa fa-square-o fa-stack-2x"></i>' +
                '<i class="fa fa-microphone-slash fa-stack-1x" aria-hidden="true"></i></span> Input disabled.';
        }
        else {
            html_input_mode.innerHTML = '<span class="fa-stack fa-fw">' +
                '<i class="fa fa-square-o fa-stack-2x"></i>' +
                '<i class="fa fa-microphone fa-stack-1x" aria-hidden="true"></i></span> Input unavailable.';
        }
    }
    if (Params.readQuestions) {
        var icon = '<span class="fa-stack fa-fw"><i class="fa fa-square-o fa-stack-2x"></i><i class="fa fa-volume-up fa-stack-1x"></i></span>';
        html_output_mode.innerHTML = icon + ' Output in <b>' + Params.readLocale + "</b>.";
    }
    else {
        var icon = '<span class="fa-stack fa-fw"><i class="fa fa-square-o fa-stack-2x"></i><i class="fa fa-volume-off fa-stack-1x"></i></span>';
        html_output_mode.innerHTML = icon + " Output disabled.";
    }
    showHint(showHintAfterSomeTime);
    showGameMode(multiplicationQuestion);
    nextQuestion();
    loop(10, update);
};
//# sourceMappingURL=main.js.map