# OK Times Table Practice #

An okay way to practice the times table, with questions ranging from 2 to 12.

## Quick Links

Links for convenient game modes (speech output and input may not be available on all browsers and operating systems):

* [Simple mode](http://fmilitao.github.io/ok-times/) - sound off, only keyboard as input.

* [Voice mode - US English](http://fmilitao.github.io/ok-times/?locale=en-US) - speech synthesis and recognition ON using 'US English'.

* [Voice mode - Portuguese](http://fmilitao.github.io/ok-times/?locale=pt-PT&times-text=vezes) - speech synthesis and recognition ON using 'Portuguese'.

## Details

There are two game modes:

* `random` - random mode was inspired by the BBC article http://www.bbc.com/news/blogs-magazine-monitor-28143553 that shows the "hardest" multiplication questions. This mode uses randomly selected multiplication questions but using the approximate weights from that article so that harder questions are more likely to be picked than easier ones.

* `sequential` - goes over all possible values of the 2 to 12 times table, sequentially and in order from the lower (2x2) to the higher (12x12) values.


Input can be through either keyboard or voice (if you are using Google Chrome with `webkitSpeechRecognition` support). For speech recognition to work correctly, you must give permission to the site to use your microphone. You should only be prompted for this permission when speech recognition starts for the first time.


Additional key bindings exist for convenience:

* `h` - to toggle *h*elp/assist (i.e. showing the blurred answer after a few seconds), which can also be done by clicking the score text.

* `q` - to toggle *q*uestion mode (`random` or `sequential`), which can also be done by clicking on the _Random_/_Sequential_ text.

* `enter` - to skip a question.

* `spacebar` - manually force speech recognition restart.


Finally, there are also a few URL parameters:

* `voice-output` - whether to read the questions through _speech synthesis_. Default: `false`.
* `voice-input` - whether to listen to the answers through _speech recognition_. Default: `false`.
* `output-locale` - the locale for speech synthesis. Default: `en-US`.
* `input-locale` - the locale for speech recognition. Default: `en-US`.
* `locale` - sets both locales for speech synthesis and recognition, at the same time.
* `mode` - game mode can be either `sequential` or `random`. Default: `random`.
* `show-hint` - whether to show an answer hint after a few seconds. Default: `true`.
* `times-text` - how the times symbol should be read. Default: `times`.


## Know Issues

* *Sometimes speech recognition does not start correctly!* If that happens just click the "(Not listening.)" text and speech recognition should be restated... which hopefully fixes the problem.
* If speech recognition happens to merge several numbers together by mistake, you should try to say some non-number word (like 'and') to help speech recognition separate the numbers. Only the number said last is considered by the game.
* For some reason, rendering SVGs with blur in Firefox is horribly slow.
* Speech recognition only works in Chrome.
* Speech recognition is off while speech synthesis is speaking, so you will have to wait until speech synthesis ends before you can answer. (But the score timers will not wait for this.) This pause is done to avoid the speech synthesis output to be used in speech recognition. If this becomes a problem, you can just turn off speech synthesis.

## Extra Credits

* Uses the awesome [Font Awesome](http://fontawesome.io/) for icons.

