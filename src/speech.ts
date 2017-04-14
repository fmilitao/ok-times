
// for chrome
declare const webkitSpeechRecognition: any;
declare const webkitSpeechGrammarList: any;
// for firefox
// declare const SpeechRecognition: any;

// const SpeechRecognitionClass: any = SpeechRecognition || webkitSpeechRecognition;

module Speech {

    export function say(
        message: string,
        locale: string = "en-US",
        callback: (event: any) => void = undefined
    ) {
        const msg = new SpeechSynthesisUtterance();
        msg.text = message;
        msg.lang = locale;
        window.speechSynthesis.speak(msg);
        msg.onend = callback;
    }

    // JSpeech grammar for numbers-only
    const grammar = '#JSGF V1.0; grammar numbers; public <numbers> = <com.sun.speech.app.numbers.digits>';
    const speechRecognitionList = new webkitSpeechGrammarList();
    speechRecognitionList.addFromString(grammar, 1);

    let recognition: any = null;

    export function abortRecognition() {
        // if we have a running recognition abort it immediately.
        if (recognition !== null) {
            recognition.abort();
            recognition = null;
        }
    }

    export function initRecognition(
        locale: string,
        callback: (text: string) => void
    ) {
        // just to be sure that no other recognition is there.
        abortRecognition();

        recognition = new webkitSpeechRecognition();
        recognition.grammars = speechRecognitionList;
        recognition.lang = locale;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

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
            console.debug(`interim='${interim_transcript}' final='${final_transcript}'`);

            if (final_transcript === '') {
                final_transcript = interim_transcript;
            }
            callback(final_transcript);
        }

        recognition.start();
    }
}