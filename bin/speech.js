var Speech;
(function (Speech) {
    function say(message, locale, callback) {
        if (callback === void 0) { callback = undefined; }
        var msg = new SpeechSynthesisUtterance();
        msg.onend = callback;
        msg.text = message;
        msg.lang = locale;
        window.speechSynthesis.speak(msg);
    }
    Speech.say = say;
    var grammar = '#JSGF V1.0; grammar numbers; public <numbers> = <com.sun.speech.app.numbers.digits>';
    var speechRecognitionList = new webkitSpeechGrammarList();
    speechRecognitionList.addFromString(grammar, 1);
    var recognition = null;
    function abortRecognition() {
        if (recognition !== null) {
            recognition.abort();
            recognition = null;
        }
    }
    Speech.abortRecognition = abortRecognition;
    function initRecognition(locale, onresult) {
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
            onresult(final_transcript);
        };
        recognition.start();
    }
    Speech.initRecognition = initRecognition;
})(Speech || (Speech = {}));
//# sourceMappingURL=speech.js.map