
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
	export let readLocale = "";
	export let listenLocale = "";
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
					case 'output-locale':
						readLocale = value;
						break;
					case 'input-locale':
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
					default:
						console.warn(`Ignoring unknown paramter: ${key}=${value}.`);
						break;
				}
			}
		}
	}

	export let readQuestions = readLocale !== "";
	export let listenAnswers = listenLocale !== "" && SpeechCheck.isSpeechRecognitionAvailable();
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
	const html_recording_status = document.getElementById('recording-status');
	const html_recorded_text = document.getElementById('recorded-text');
	const html_recording_symbol = document.getElementById('recording-symbol');

	const html_input_mode = document.getElementById('input-mode');
	const html_output_mode = document.getElementById('output-mode');
	const html_hint_mode = document.getElementById('hint-mode');
	const html_game_mode = document.getElementById('game-mode');

	const html_score = document.getElementById('score');
	const html_timer = document.getElementById('timer');
	const html_points = document.getElementById('points');

	const html_question = document.getElementById('question');
	const html_attempt = document.getElementById('attempt');
	const html_answer = document.getElementById('answer');

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

	let showHintAfterSomeTime = Params.showHint;
	let multiplicationQuestion = Questions.parse(Params.questionMode);
	let score = 0;

	let attempt = '';
	let answer = '';
	let question = '';
	let questionStartTime = 0;

	let highlightWrongAnswerTimeout = 0;
	let highlightRightAnswerTimeout = 0;

	function startListening() {
		html_recording_symbol.innerHTML = '<span class="fa-stack fa-fw">' +
			'<i class="fa fa-circle-o-notch fa-spin fa-stack-2x green-color"></i>' +
			'<i class="fa fa-microphone fa-stack-1x" aria-hidden="true"></i></span>';

		html_recorded_text.innerHTML = '';

		Speech.initRecognition(
			Params.listenLocale,
			function (text: string) {
				html_recorded_text.innerHTML = "<i>" + text + "</i>";

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
		html_recording_symbol.innerHTML = '<span class="fa-stack fa-fw">' +
			'<i class="fa fa-ban fa-stack-2x red-color"></i>' +
			'<i class="fa fa-microphone fa-stack-1x" aria-hidden="true"></i></span>';
		
		html_recorded_text.innerHTML = '' ;

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

		const timeOnQuestion = Date.now() - questionStartTime;

		ProgressTracker.deselect();
		highlightRightAnswerTimeout = Date.now() + RIGHT_ANSWER_HIGHLIGHT_TIMEOUT;
		html_attempt.style.color = "#0D98BA";
		html_attempt.innerHTML = answer
				+ "<font size=6pt><br/><i class='fa fa-star-o fa-fw' aria-hidden='true'></i> " + 0 
				+ '  <i class="fa fa-clock-o fa-fw" aria-hidden="true"></i> ' + Math.floor(timeOnQuestion/1000) + "s </font>";
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

		// fills starts based on how much of the max score is left
		const starIcon = maxScore <= 10 ? 'fa-star-o' : maxScore >= 50 ? 'fa-star' : 'fa-star-half-o';

		html_score.innerHTML = '<i class="fa fa-trophy fa-fw" aria-hidden="true"></i> ' + score;
		html_points.innerHTML = '<i class="fa ' + starIcon + ' fa-fw" aria-hidden="true"></i> ' + maxScore;
		html_timer.innerHTML = '<i class="fa fa-clock-o fa-fw" aria-hidden="true"></i> ' + (Math.floor(timeOnQuestion / 1000)) + 's'

		// 5. Timeout counters update

		// got right answer
		if (attempt === answer) {
			// immediately stop listening
			if (Params.listenAnswers) {
				stopListening();
			}
			score += maxScore;

			const color = maxScore > 50 ? ProgressTracker.GREEN : (maxScore <= 10 ? ProgressTracker.RED : ProgressTracker.YELLOW);

			ProgressTracker.deselect(color);

			highlightRightAnswerTimeout = Date.now() + RIGHT_ANSWER_HIGHLIGHT_TIMEOUT;
			html_attempt.style.color = "green";

			// TODO: Figure out a font size so that these two do not fall off screen when the screen is too small.
			// hackish way to give some more feedback to the user about the time-to-answer performance
			const htmlPoints = "<font size=6pt><br/><i>(+" + maxScore + " points)</i></font>";
			html_attempt.innerHTML = answer
				+ "<font size=6pt><br/><i class='fa " + starIcon + " fa-fw' aria-hidden='true'></i> " + maxScore 
				+ '  <i class="fa fa-clock-o fa-fw" aria-hidden="true"></i> ' + Math.floor(timeOnQuestion/1000) + "s </font>";
		}
	};

	//
	// Startup Logic
	//

	// === Hints === //

	function showHint(showHint: boolean) {
		html_hint_mode.innerHTML = '<span class="fa-stack fa-fw">' +
			'<i class="fa fa-square-o fa-stack-2x"></i>' +
			'<i class="fa fa-life-saver fa-stack-1x" aria-hidden="true"></i></span> Hints <b>' + (showHintAfterSomeTime ? 'on' : 'off') + '</b>.';
	};

	// click events to toggle question format (when 'mode' is clicked and same for score for hints)
	html_hint_mode.onclick = function () {
		showHintAfterSomeTime = !showHintAfterSomeTime;
		showHint(showHintAfterSomeTime);
	};
	html_hint_mode.title = 'Press to toggle showing hints.'

	// === Game Mode === //

	function showGameMode(mode: () => [number, number]) {
		const icon = mode === Questions.Random.ask ? '<i class="fa fa-random fa-stack-1x" aria-hidden="true"></i>' : '<i class="fa fa-long-arrow-right fa-stack-1x" aria-hidden="true"></i>';
		const text = mode === Questions.Random.ask ? 'random' : 'sequential';
		html_game_mode.innerHTML = '<span class="fa-stack fa-fw"><i class="fa fa-square-o fa-stack-2x"></i>' + icon +
			'</span> Mode <b>' + text + '</b>.';
	};

	html_game_mode.onclick = function () {
		switchQuestionFormat();
		showGameMode(multiplicationQuestion);
	};
	html_game_mode.title = 'Press to switch between sequential/random modes.'

	// === Input === //

	if (Params.listenAnswers) {
		html_input_mode.innerHTML = '<span class="fa-stack fa-fw">' +
			'<i class="fa fa-square-o fa-stack-2x"></i>' +
			'<i class="fa fa-microphone fa-stack-1x" aria-hidden="true"></i></span> Input in <b>' + Params.listenLocale + '</b>.';

		// force listener restart in case listening failed to start for some reason
		html_recording_status.title = "Click or press 'spacebar' to force speech recognition restart.";
		html_recording_status.onclick = forceSpeechRecognitionRestart;
	} else {
		if (SpeechCheck.isSpeechRecognitionAvailable()) {
			html_input_mode.innerHTML = '<span class="fa-stack fa-fw">' +
				'<i class="fa fa-square-o fa-stack-2x"></i>' +
				'<i class="fa fa-microphone-slash fa-stack-1x" aria-hidden="true"></i></span> Input disabled.';
		} else {
			html_input_mode.innerHTML = '<span class="fa-stack fa-fw">' +
				'<i class="fa fa-square-o fa-stack-2x"></i>' +
				'<i class="fa fa-microphone fa-stack-1x" aria-hidden="true"></i></span> Input unavailable.';
		}
	}

	// === Output === //

	if (Params.readQuestions) {
		const icon = '<span class="fa-stack fa-fw"><i class="fa fa-square-o fa-stack-2x"></i><i class="fa fa-volume-up fa-stack-1x"></i></span>';
		html_output_mode.innerHTML = icon + ' Output in <b>' + Params.readLocale + "</b>.";
	} else {
		const icon = '<span class="fa-stack fa-fw"><i class="fa fa-square-o fa-stack-2x"></i><i class="fa fa-volume-off fa-stack-1x"></i></span>';
		html_output_mode.innerHTML = icon + " Output disabled.";
	}

	// === Initial Status === //

	showHint(showHintAfterSomeTime);
	showGameMode(multiplicationQuestion);

	// get the initial question
	nextQuestion();
	// 10 fps ought to be enough
	loop(10, update);
};
