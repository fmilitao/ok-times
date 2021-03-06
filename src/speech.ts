
// for chrome
// since no good typescript declaration file appears to be available just leave
// these as 'any'
declare const webkitSpeechRecognition: any;
declare const webkitSpeechGrammarList: any;

module BrowserChecks {
    /**
     * Whether the speech recognition types are available.
     */
    export function isSpeechRecognitionAvailable() {
        return (typeof webkitSpeechRecognition) !== 'undefined' &&
            (typeof webkitSpeechGrammarList) !== 'undefined';
    };

    /**
     * Whether the speech synthesis type is available.
     */
    export function isSpeechSynthesisAvailable() {
        return (typeof speechSynthesis) !== 'undefined';
    };
}

module Talk {
    const speechUtterance = new SpeechSynthesisUtterance();

    // only write it on the console, not the UI
    speechUtterance.onerror = function (event) {
        console.debug(event);
    };

    /**
     * Callback to call when talking ends.
     */
    export function onTalkEnd(callback: () => void) {
        speechUtterance.onend = callback;
    };

    export function setVoice(voice: SpeechSynthesisVoice) {
        speechUtterance.voice = voice;
    };

    /**
     * Say some message through text-to-speech service.
     * 
     * @param message the message to say
     * @param locale the language of the message
     * @param callback the function to call when the message has been completely spoken.
     */
    export function say(message: string) {
        speechUtterance.text = message;
        speechSynthesis.speak(speechUtterance);
    };

    export function asyncCheckVoice(check: (voices: SpeechSynthesisVoice[]) => void) {
        speechSynthesis.onvoiceschanged = function () {
            check(speechSynthesis.getVoices());
        };
    };

    /**
     * Stops speaking immediately.
     */
    export function quiet() {
        speechSynthesis.cancel();
    };
}

module Speech {
    // JSpeech grammar for numbers-only.
    // TODO: not sure if this is working correctly since intermediate results may not be numbers.
    const grammar = '#JSGF V1.0; grammar numbers; public <numbers> = <com.sun.speech.app.numbers.digits>';
    const speechRecognitionList = new webkitSpeechGrammarList();
    speechRecognitionList.addFromString(grammar, 1);

    let recognition: any = null;

    // dummy call back that does nothing when called.
    const DUMMY_CALLBACK = () => { /* intentionally empty */ };

    let onErrorCallback: (error: string) => void = DUMMY_CALLBACK;
    let onResultCallback: (result: string) => void = DUMMY_CALLBACK;
    let onStartCallback: () => void = DUMMY_CALLBACK;
    let onEndCallback: () => void = DUMMY_CALLBACK;

    export let speechCounter = 0;
    /**
     * Aborts recognition, ignoring the final result if it was not
     * previously returned.
     */
    export function abortRecognition() {
        // if we have a running recognition abort it immediately.
        if (recognition !== null) {
            recognition.onresult = DUMMY_CALLBACK;
            recognition.onerror = DUMMY_CALLBACK;
            recognition.abort();
            recognition = null;

            // to avoid waiting on the old recognition to actually abort.
            onEndCallback();
        }
    };

    /**
     * Start speech recognition.
     * 
     * @param locale the locale of the speech recognition (i.e. "en-US" or "pt-PT").
     */
    export function startRecognition(locale: string) {
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

        speechCounter += 1;
        const speechCounterId = speechCounter;

        // adapted from:
        // https://developers.google.com/web/updates/2013/01/Voice-Driven-Web-Apps-Introduction-to-the-Web-Speech-API
        recognition.onresult = function (event: any) {
            if (speechCounter !== speechCounterId) {
                console.warn(`Ignoring old event from ${speechCounterId} current is ${speechCounter}`);
                return;
            }

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
            onResultCallback(final_transcript);
        };

        recognition.onerror = function (event: any) {
            onErrorCallback(event.error);
        };

        recognition.onstart = onStartCallback;

        // we handle the on end event directly instead
        // recognition.onend = onEndCallback;
        recognition.start();
    };

    /**
     * Sets the callback for errors.
     */
    export function setOnError(callback: (error: string) => void) {
        onErrorCallback = callback;
    };

    /**
     * Sets the callback for results.
     */
    export function setOnResult(callback: (result: string) => void) {
        onResultCallback = callback;
    };

    /**
     * Sets the callback for when recognition starts.
     */
    export function setOnStart(callback: () => void) {
        onStartCallback = callback;
    };

    /**
     * Sets the callback for when recognition stops.
     */
    export function setOnEnd(callback: () => void) {
        onEndCallback = callback;
    };
}
