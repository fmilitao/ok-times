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
    var speechUtterance = new SpeechSynthesisUtterance();
    speechUtterance.onerror = function (event) {
        console.debug(event);
    };
    function onTalkEnd(callback) {
        speechUtterance.onend = callback;
    }
    Talk.onTalkEnd = onTalkEnd;
    ;
    function setVoice(voice) {
        speechUtterance.voice = voice;
    }
    Talk.setVoice = setVoice;
    ;
    function say(message) {
        speechUtterance.text = message;
        speechSynthesis.speak(speechUtterance);
    }
    Talk.say = say;
    ;
    function asyncCheckVoice(check) {
        speechSynthesis.onvoiceschanged = function () {
            check(speechSynthesis.getVoices());
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
    var DUMMY_CALLBACK = function () { };
    var onErrorCallback = DUMMY_CALLBACK;
    var onResultCallback = DUMMY_CALLBACK;
    var onStartCallback = DUMMY_CALLBACK;
    var onEndCallback = DUMMY_CALLBACK;
    Speech.speechCounter = 0;
    function abortRecognition() {
        if (recognition !== null) {
            recognition.onresult = DUMMY_CALLBACK;
            recognition.onerror = DUMMY_CALLBACK;
            recognition.abort();
            recognition = null;
            onEndCallback();
        }
    }
    Speech.abortRecognition = abortRecognition;
    ;
    function startRecognition(locale) {
        abortRecognition();
        recognition = new webkitSpeechRecognition();
        recognition.grammars = speechRecognitionList;
        recognition.lang = locale;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        Speech.speechCounter += 1;
        var speechCounterId = Speech.speechCounter;
        recognition.onresult = function (event) {
            if (Speech.speechCounter !== speechCounterId) {
                console.warn("Ignoring old event from " + speechCounterId + " current is " + Speech.speechCounter);
                return;
            }
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
        recognition.onstart = onStartCallback;
        recognition.start();
    }
    Speech.startRecognition = startRecognition;
    ;
    function setOnError(callback) {
        onErrorCallback = callback;
    }
    Speech.setOnError = setOnError;
    ;
    function setOnResult(callback) {
        onResultCallback = callback;
    }
    Speech.setOnResult = setOnResult;
    ;
    function setOnStart(callback) {
        onStartCallback = callback;
    }
    Speech.setOnStart = setOnStart;
    ;
    function setOnEnd(callback) {
        onEndCallback = callback;
    }
    Speech.setOnEnd = setOnEnd;
    ;
})(Speech || (Speech = {}));
//# sourceMappingURL=speech.js.map