
/**
 * URL parameter parsing.
 * 
 * All variables were suppose to be exported as read-only but apparently that is not
 * being enforced by the compiler. Still, do not write to the exported variables
 * outside the scope of Params.
 */
module Params {
	// default values:
	export let timesText = "times";
	export let readLocale = "en-US";
	export let listenLocale = "en-US";
	export let readQuestions = true;
	export let listenAnswers = true && SpeechCheck.isSpeechRecognitionAvailable();
	export let showHint = true;
	export let questionMode = 'random';

	// load from URL, if present
	const splitParameters = document.URL.split('?');
	if (splitParameters.length > 1) {
		for (const parameter of splitParameters[1].split('&')) {
			const keyValuePair = parameter.split('=');
			if (keyValuePair.length > 1) {
				const [key, value] = keyValuePair;
				switch (key) {
					case 'mode':
						questionMode = value;
						break;
					case 'show-hint':
						showHint = value.toLowerCase() === 'true';
						break;
					case 'read-locale':
						readLocale = value;
						break;
					case 'listen-locale':
						listenLocale = value;
						break;
					case 'locale':
						// sets both at the same time
						readLocale = value;
						listenLocale = value;
						break;
					case 'times-text':
						timesText = value;
						break;
					case 'read-questions':
						readQuestions = value.toLowerCase() === 'true';
						break;
					case 'listen-answers':
						listenAnswers = value.toLowerCase() === 'true';
						break;
					default:
						console.warn(`Ignoring unknown paramter: ${key}=${value}.`);
						break;
				}
			}
		}
	}
};

module Questions {

	export function parse(mode: string) {
		const normalizedMode = mode.trim().toLowerCase();
		if (normalizedMode === 'random') {
			return Random.ask;
		}
		if (normalizedMode === 'sequential') {
			return Sequential.ask;
		}

		throw (`Error: unknown mode ${mode}.`);
	};

	/**
	 * Produces random multiplication questions based on
	 * the weights from its internal WEIGHTS table.
	 */
	export module Random {

		// Weight inspiration from the following sources:
		// * http://www.bbc.com/news/blogs-magazine-monitor-28143553
		// * http://www.bbc.com/news/magazine-32299402
		const WEIGHTS = // usage should be: times[x][y]
			[ // 2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12
				10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, // 2
				10, 10, 10, 10, 30, 30, 30, 30, 10, 10, 10, // 3
				10, 10, 20, 10, 40, 40, 60, 40, 10, 10, 40, // 4
				10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 30, // 5
				10, 10, 10, 40, 10, 50, 70, 80, 10, 10, 80, // 6
				10, 10, 10, 40, 10, 50, 70, 80, 10, 10, 80, // 7
				10, 10, 10, 60, 80, 80, 90, 90, 10, 10, 80, // 8
				10, 10, 10, 50, 70, 80, 80, 80, 10, 10, 80, // 9
				10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, // 10
				10, 10, 10, 40, 10, 50, 70, 10, 80, 10, 10, // 11
				10, 10, 10, 40, 10, 50, 70, 70, 60, 10, 80, // 12
			];

		const MAX = WEIGHTS.reduce((old, curr) => old + curr, 0);

		export function ask(): [number, number] {
			// random = [0, 1[
			const rd = Math.round(MAX * Math.random());

			let weightsAccum = 0;
			for (let i = 0; i < WEIGHTS.length; ++i) {
				weightsAccum += WEIGHTS[i];
				if (weightsAccum >= rd) {
					// floor is intentional to ensure 0..11 on same 'x'
					return [Math.floor(i / 11) + 2, (i % 11) + 2];
				}
			}

			throw (`Error: did not find question ${rd} ${MAX} ${weightsAccum}.`);
		};
	};

	/**
	 * Sequential multiplication questions starting from 2x2 to 12x12.
	 */
	export module Sequential {
		let questionPosition = 0;

		export function ask(): [number, number] {
			const currentQuestion = questionPosition;
			// increments to next question
			questionPosition = (questionPosition + 1) % (11 * 11);
			return [Math.floor(currentQuestion / 11) + 2, (currentQuestion % 11) + 2];
		};
	};
};

window.onload = function () {
	// get relevant HTML elements
	const html_listener_status = document.getElementById('listenerStatus');
	const html_listener_mode = document.getElementById('listenerMode');
	const html_reader_mode = document.getElementById('readerMode');

	const html_mode = document.getElementById('mode');
	const html_score = document.getElementById('score');
	const html_points = document.getElementById('points');

	const html_question = document.getElementById('question');
	const html_attempt = document.getElementById('attempt');
	const html_answer = document.getElementById('answer');
	const html_add = document.getElementById('add');

	// relevant key codes
	const KEY_ENTER = 13;
	const KEY_SPACEBAR = 32;
	const KEY_H = 72;
	const KEY_Q = 81;
	const KEY_0 = 48;
	const KEY_9 = 57;

	// hint constants in milliseconds
	const HINT_START = 4000;
	const HINT_FULL = 9000;
	// maximum opacity of the hint
	const HINT_MAX_OPACITY = 0.5;

	// scoring constants
	const MIN_SCORE = 10;
	const MAX_SCORE = 90;
	// time until score drains to minimum score, in milliseconds
	const SCORE_TIME = 7000;

	// how long to highlight a wrong attempt
	const WRONG_ATTEMPT_HIGHLIGHT_TIMEOUT = 1000;
	const RIGHT_ANSWER_HIGHLIGHT_TIMEOUT = 1000;
	const SCORE_ADD_NOTIFICATION_TIMEOUT = 1500;

	let showHintAfterSomeTime = Params.showHint;
	let multiplicationQuestion = Questions.parse(Params.questionMode);
	let score = 0;

	let attempt = '';
	let answer = '';
	let question = '';
	let questionStartTime = 0;

	let highlightWrongAnswerTimeout = 0;
	let highlightRightAnswerTimeout = 0;
	let addScoreNotificationTimeout = 0;

	function startListening() {
		html_listener_status.innerHTML = "<b>Speak up!</b>";

		Speech.initRecognition(
			Params.listenLocale,
			function (text: string) {
				html_listener_status.innerHTML = "<i>" + text + "</i>";

				// since due to continuous listening we may get multiple words
				// and because we want the *last* word given, we split by ' '
				// and then get the last word in that sequence
				let lastWord: any = text.split(' ');
				lastWord = lastWord[lastWord.length - 1];
				// removes all non-number elements
				const numbersOnly = lastWord.replace(/\D/g, '');
				if (numbersOnly.length > 0) {
					updateAttempt(parseInt(numbersOnly));
					update();
				}
			}
		)
	};

	function stopListening() {
		html_listener_status.innerHTML = "(Not listening. Press 'spacebar' to force listening.)";
		Speech.abortRecognition();
	};

	function nextQuestion() {
		const [x, y] = multiplicationQuestion();
		const newQuestion = x + ' &times; ' + y;
		if (newQuestion === question) {
			// same question! try again
			nextQuestion();
			return;
		}

		//
		// Speech logic
		//

		// read and listen
		if (Params.listenAnswers && Params.readQuestions) {
			stopListening();

			Talk.say(
				`${x} ${Params.timesText} ${y}`,
				Params.readLocale,
				(event: any) => {
					// While the question is being red, we may press the
					// skip question button, causing the speech to end
					// but then we do not want to listen to the answer.
					// Thus, we check that no timeout was placed.
					if (highlightRightAnswerTimeout === 0) {
						// only start recognition after speech ended
						startListening();
					} else {
						console.log('denied!!');
					}
				}
			);
		} else {
			// read-only
			if (Params.readQuestions) {
				Talk.say(
					`${x} ${Params.timesText} ${y}`,
					Params.readLocale
				);
			}

			// listen-only
			if (Params.listenAnswers) {
				stopListening();
				startListening();
			}
		}

		//
		// Game logic
		//

		attempt = '';
		answer = (x * y).toString();
		question = x + ' &times; ' + y;
		questionStartTime = Date.now();

		// shift numbers from [2,12] to [0,9] index range
		ProgressTracker.select(x - 2, y - 2);
	};

	function giveUp() {
		if (Params.listenAnswers) {
			stopListening();
		}

		ProgressTracker.deselect();
		highlightRightAnswerTimeout = Date.now() + RIGHT_ANSWER_HIGHLIGHT_TIMEOUT;
		html_attempt.style.color = "orange";
		html_attempt.innerHTML = answer + "<font size=8pt><br/><i>(now you know)</i></font>";
	};


	function switchQuestionFormat() {
		multiplicationQuestion = multiplicationQuestion === Questions.Random.ask ? Questions.Sequential.ask : Questions.Random.ask;
		// forget current question, move to new mode
		giveUp();
	};

	function forceSpeechRecognitionRestart() {
		console.log('Forced speech restart!');
		stopListening();
		startListening();
	};

	window.onkeyup = function (e: KeyboardEvent) {

		// <ENTER> for next question / give up on this question
		if (e.keyCode === KEY_ENTER && highlightRightAnswerTimeout === 0) {
			giveUp();
			return;
		}

		// 'h' for help toggle
		if (e.keyCode === KEY_H) {
			showHintAfterSomeTime = !showHintAfterSomeTime;
			return;
		}

		// 'q' for switching format
		if (e.keyCode === KEY_Q) {
			switchQuestionFormat();
			return;
		}

		// force voice recognition restart
		if (e.keyCode === KEY_SPACEBAR && Params.listenAnswers) {
			forceSpeechRecognitionRestart();
		}

		// numbers keys
		if (e.keyCode >= KEY_0 && e.keyCode <= KEY_9) {
			updateAttempt(e.keyCode - KEY_0);
			update();
			return;
		}
	};


	window.onresize = function () {
		// fractions of the height, split into equal sized cells
		const FRACTIONS = Math.round(window.innerHeight / 13);

		html_question.style.paddingTop = (1 * FRACTIONS) + 'px';
		html_question.style.fontSize = (2 * FRACTIONS) + 'px';
		html_attempt.style.paddingTop = (4 * FRACTIONS) + 'px';
		html_attempt.style.fontSize = (5 * FRACTIONS) + 'px';
		html_answer.style.paddingTop = html_attempt.style.paddingTop;
		html_answer.style.fontSize = html_attempt.style.fontSize;

		ProgressTracker.init(window.innerWidth, window.innerHeight, FRACTIONS);
	};

	// hack to force window initialization although it is not a real resize
	window.onresize(null);

	// click events to toggle question format (when 'mode' is clicked and same for score for hints)
	html_mode.onclick = switchQuestionFormat;
	html_score.onclick = () => showHintAfterSomeTime = !showHintAfterSomeTime;

	// control fps when using 'requestAnimationFrame'
	// from: http://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
	function loop(fps: number, callback: () => void): void {
		let fpsInterval = 1000 / fps;
		let then = Date.now();
		let startTime = then;

		function animate() {
			requestAnimationFrame(animate);

			let now = Date.now();
			let elapsed = now - then;

			if (elapsed > fpsInterval) {
				then = now;
				callback();
			}
		}

		animate();
	};

	function updateAttempt(n: number) {
		// ignore attempt to update while highlighting correct answer
		if (highlightRightAnswerTimeout !== 0) {
			return;
		}

		// if there was a previous wrong answer that we are highlighting, clear it
		if (highlightWrongAnswerTimeout > 0) {
			attempt = '';
			highlightWrongAnswerTimeout = 0;
			html_attempt.style.color = "black";
		}

		const completeAttempt = attempt + n.toString();

		// if wrong answer, even if partial.
		// (even partial matches will match 'answer' at index 0)
		if (answer.indexOf(completeAttempt) !== 0) {
			highlightWrongAnswerTimeout = Date.now() + WRONG_ATTEMPT_HIGHLIGHT_TIMEOUT;
			html_attempt.style.color = "red";
		}

		attempt = completeAttempt;
	};

	function update() {
		if (highlightRightAnswerTimeout !== 0) {
			// past the highlight timeout interval
			if (Date.now() > highlightRightAnswerTimeout) {
				highlightRightAnswerTimeout = 0;
				attempt = '';
				html_attempt.style.color = "black";

				nextQuestion();
			} else {
				// before the highlight correct answer timeout interval
				// return immediately so nothing updates
				return;
			}
		}

		// time since question started, in milliseconds
		const timeOnQuestion = Date.now() - questionStartTime;

		// 1. Question update
		html_question.innerHTML = question;

		// 2. Attempt update
		if (highlightWrongAnswerTimeout !== 0 && Date.now() > highlightWrongAnswerTimeout) {
			attempt = '';
			highlightWrongAnswerTimeout = 0;
			html_attempt.style.color = "black";
		}

		// pads the attempt to have the same length as the correct answer
		// so that a partial match will properly overlap any hint.
		// CAUTION: this requires a monospace font that has exact same space
		// for all number characters AND the white space character that is
		// used for padding. If you change the font to some other, it may
		// cause the hint to be misaligned with the attempt.
		let padded_attempt = attempt;
		while (padded_attempt.length < answer.length) {
			padded_attempt = padded_attempt + ' ';
		}
		html_attempt.innerHTML = padded_attempt;

		// 3. Hint update
		if (showHintAfterSomeTime) {
			// Opacity will kind of start at HINT_START although low values may not be all that
			// visible. By HINT_FULL it should be fully visible (i.e. after HINT_FULL-HINT_START
			// is the duration of the fade effect.
			const hint_opacity = Math.min(((timeOnQuestion - HINT_START) / HINT_FULL), HINT_MAX_OPACITY);

			// help if too much time without correct answer
			html_answer.style.textShadow = "0px 0px 15px rgba(99, 99, 99, " + hint_opacity + ")";
			html_answer.innerHTML = answer;
		} else {
			html_answer.style.textShadow = "none";
		}

		// 4. Status bar (score/max score and timer) update
		const maxScore = MIN_SCORE + (timeOnQuestion < SCORE_TIME ? Math.round(MAX_SCORE * (1 - ((timeOnQuestion + 1) / SCORE_TIME))) : 0);
		html_points.innerHTML = 'max. points: ' + maxScore + ' (' + (Math.floor(timeOnQuestion / 1000)) + 's)';
		html_mode.innerHTML = multiplicationQuestion === Questions.Random.ask ? 'Random' : 'Sequential';
		html_score.innerHTML = (showHintAfterSomeTime ? ' [help on] ' : '') + 'score: ' + score;

		// 5. Timeout counters update

		// got right answer
		if (attempt === answer) {
			// immediately stop listening
			if (Params.listenAnswers) {
				stopListening();
			}
			score += maxScore;

			// score increase notification timeout to SCORE_ADD_NOTIFICATION_TIMEOUT after correct answer
			// intentionally only shows last obtained score
			addScoreNotificationTimeout = Date.now() + SCORE_ADD_NOTIFICATION_TIMEOUT;
			html_add.innerHTML = '+' + maxScore + '!';

			const color = maxScore > 50 ? ProgressTracker.GREEN : (maxScore <= 10 ? ProgressTracker.RED : ProgressTracker.YELLOW);
			const message = maxScore > 50 ? "Excellent!!" : (maxScore <= 10 ? "Correct." : "Good!");

			ProgressTracker.deselect(color);

			highlightRightAnswerTimeout = Date.now() + RIGHT_ANSWER_HIGHLIGHT_TIMEOUT;
			html_attempt.style.color = "green";

			// TODO: Figure out a font size so that these two do not fall off screen when the screen is too small.
			// hackish way to give some more feedback to the user about the time-to-answer performance
			const htmlMessage = "<font size=10pt><br/><i>" + message + "</i></font>";
			const htmlPoints = "<font size=6pt><br/><i>(+" + maxScore + " points)</i></font>";
			html_attempt.innerHTML = answer + htmlMessage + htmlPoints;
		}

		// remove add score notification if we are already past the set timeout
		if (Date.now() > addScoreNotificationTimeout) {
			html_add.innerHTML = '';
		}
	};

	//
	// Startup Logic
	//

	if (Params.listenAnswers) {
		html_listener_mode.innerHTML = "Listening answers in " + Params.listenLocale + ".";

		// force listener restart in case listening failed to start for some reason
		html_listener_status.title = "Click to force speech recognition restart.";
		html_listener_status.onclick = forceSpeechRecognitionRestart;
	} else {
		if (SpeechCheck.isSpeechRecognitionAvailable()) {
			html_listener_mode.innerHTML = "Listening answers disabled (but available).";
		} else {
			html_listener_mode.innerHTML = "Listening answers unavailable.";
		}
	}

	if (Params.readQuestions) {
		html_reader_mode.innerHTML = "Reading questions in " + Params.readLocale + ".";
	} else {
		html_reader_mode.innerHTML = "Reading questions disabled.";
	}

	// get the initial question
	nextQuestion();
	// 10 fps ought to be enough
	loop(10, update);
};
