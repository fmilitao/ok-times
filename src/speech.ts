
// for chrome
// since no good typescript declaration file appears to be available just leave
// these as 'any'
declare const webkitSpeechRecognition: any;
declare const webkitSpeechGrammarList: any;

module Speech {

    /**
     * Say some message through text-to-speech service.
     * 
     * @param message the message to say
     * @param locale the language of the message
     * @param callback the function to call when the message has been completely spoken.
     */
    export function say(
        message: string,
        locale: string,
        callback: (event: any) => void = undefined
    ) {
        const msg = new SpeechSynthesisUtterance();
        msg.onend = callback;
        msg.text = message;
        msg.lang = locale;

        window.speechSynthesis.speak(msg);
    }

    // JSpeech grammar for numbers-only.
    // TODO: not sure if this is working correctly since intermediate results may not be numbers.
    const grammar = '#JSGF V1.0; grammar numbers; public <numbers> = <com.sun.speech.app.numbers.digits>';
    const speechRecognitionList = new webkitSpeechGrammarList();
    speechRecognitionList.addFromString(grammar, 1);

    let recognition: any = null;

    /**
     * Aborts recognition, ignoring the final result if it was not
     * previously returned.
     */
    export function abortRecognition() {
        // if we have a running recognition abort it immediately.
        if (recognition !== null) {
            recognition.abort();
            recognition = null;
        }
    }

    /**
     * Start speech recognition.
     * 
     * @param locale the locale of the speech recognition (i.e. "en-US" or "pt-PT").
     * @param onresult the function to handle partial and full results of the recognition.
     */
    export function initRecognition(
        locale: string,
        onresult: (text: string) => void
    ) {
        // just to be sure that there are no other recognition going on.
        abortRecognition();

        recognition = new webkitSpeechRecognition();
        // not sure this grammars thing is doing anything useful...
        recognition.grammars = speechRecognitionList;
        recognition.lang = locale;
        // we will abort recognition when we are done, so leave this as continuous recording
        recognition.continuous = true;
        // all results matter for faster speeds in all languages
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        // adapted from:
        // https://developers.google.com/web/updates/2013/01/Voice-Driven-Web-Apps-Introduction-to-the-Web-Speech-API
        recognition.onresult = function (event: any) {
            let final_transcript = '';
            let interim_transcript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }

            // leave the next line there in case we need to debug the results
            // console.debug(`interim='${interim_transcript}' final='${final_transcript}'`);

            // If there is no 'final_transcript' just use 'interim_transcript'.
            // CAUTION: this is only valid because we know the answer we want and any intermediate
            // noise can be filtered out and ignored without any destructive impact in the application.
            // In other words, we only use speech to try to get to a fixed word/number and not to get
            // any open-ended words from the speech recognition API. Thus, doing this "truncation"
            // should be acceptable to us.
            final_transcript = final_transcript.trim();

            if (final_transcript === '') {
                final_transcript = interim_transcript.trim();
            }
            onresult(final_transcript);
        }

        recognition.start();
    }
}
