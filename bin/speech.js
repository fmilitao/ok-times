var BrowserChecks;
(function (BrowserChecks) {
    function isSpeechRecognitionAvailable() {
        return (typeof webkitSpeechRecognition) !== 'undefined' &&
            (typeof webkitSpeechGrammarList) !== 'undefined';
    }
    BrowserChecks.isSpeechRecognitionAvailable = isSpeechRecognitionAvailable;
    ;
    function isSpeechSynthesisAvailable() {
        return (typeof speechSynthesis) !== 'undefined';
    }
    BrowserChecks.isSpeechSynthesisAvailable = isSpeechSynthesisAvailable;
    ;
})(BrowserChecks || (BrowserChecks = {}));
var Talk;
(function (Talk) {
    function say(message, locale, callback) {
        if (callback === void 0) { callback = undefined; }
        var msg = new SpeechSynthesisUtterance();
        msg.onend = callback;
        msg.text = message;
        msg.lang = locale;
        speechSynthesis.speak(msg);
    }
    Talk.say = say;
    ;
    var Arrays = Array;
    function asyncCheckVoice(check) {
        speechSynthesis.onvoiceschanged = function () {
            var voices = speechSynthesis.getVoices();
            var voicesLangs = voices.map(function (x) { return x.lang; });
            var defaultVoice = voices.filter(function (x) { return x.default; }).map(function (x) { return x.lang; })[0];
            check(Arrays.from(new Set(voicesLangs).values()), defaultVoice);
        };
    }
    Talk.asyncCheckVoice = asyncCheckVoice;
    ;
    function quiet() {
        speechSynthesis.cancel();
    }
    Talk.quiet = quiet;
    ;
})(Talk || (Talk = {}));
var Speech;
(function (Speech) {
    var grammar = '#JSGF V1.0; grammar numbers; public <numbers> = <com.sun.speech.app.numbers.digits>';
    var speechRecognitionList = new webkitSpeechGrammarList();
    speechRecognitionList.addFromString(grammar, 1);
    var recognition = null;
    var DUMMY_CALLBACK = function (argument) { };
    var onErrorCallback = DUMMY_CALLBACK;
    var onResultCallback = DUMMY_CALLBACK;
    function abortRecognition() {
        if (recognition !== null) {
            recognition.abort();
            recognition = null;
        }
    }
    Speech.abortRecognition = abortRecognition;
    function startRecognition(locale) {
        abortRecognition();
        recognition = new webkitSpeechRecognition();
        recognition.grammars = speechRecognitionList;
        recognition.lang = locale;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.onresult = function (event) {
            var final_transcript = '';
            var interim_transcript = '';
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                }
                else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            final_transcript = final_transcript.trim();
            if (final_transcript === '') {
                final_transcript = interim_transcript.trim();
            }
            onResultCallback(final_transcript);
        };
        recognition.onerror = function (event) {
            onErrorCallback(event.error);
        };
        recognition.start();
    }
    Speech.startRecognition = startRecognition;
    ;
    function setOnErrorCallback(callback) {
        onErrorCallback = callback;
    }
    Speech.setOnErrorCallback = setOnErrorCallback;
    ;
    function setOnResult(callback) {
        onResultCallback = callback;
    }
    Speech.setOnResult = setOnResult;
    ;
})(Speech || (Speech = {}));
//# sourceMappingURL=speech.js.map