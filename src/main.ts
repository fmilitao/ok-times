
module RandomQuestion {

	// Weight inspiration from the following sources:
	// * http://www.bbc.com/news/blogs-magazine-monitor-28143553
	// * http://www.bbc.com/news/magazine-32299402
	let WEIGHTS = // usage should be: times[x][y]
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

	let MAX = WEIGHTS.reduce((old, curr) => old + curr, 0);

	export function ask(): [number, number] {
		// random = [0, 1[
		const rd = Math.round(MAX * Math.random());

		let accum = 0;
		for (let i = 0; i < WEIGHTS.length; ++i) {
			accum += WEIGHTS[i];
			if (accum >= rd) {
				// floor is intentional to ensure 0..11 on same 'x'
				return [Math.floor(i / 11) + 2, (i % 11) + 2];
			}
		}

		throw ('Error: did not find question.' + rd + ' ' + MAX + ' ' + accum);
	};

};

module SequentialQuestion {
	let aux = 0;

	export function ask(): [number, number] {
		const i = aux; // increments to next
		aux = (aux + 1) % (11 * 11);
		return [Math.floor(i / 11) + 2, (i % 11) + 2];
	};
};

window.onload = function () {

	const html_mode = document.getElementById('mode');
	const html_score = document.getElementById('score');
	const html_points = document.getElementById('points');

	const html_question = document.getElementById('question');
	const html_attempt = document.getElementById('attempt');
	const html_answer = document.getElementById('answer');
	const html_add = document.getElementById('add');

	let score = 0;
	let help = true;
	let attempt = '';
	let answer = '';
	let question = '';
	let wrong = 0;
	let timer = 0;
	let ask: () => [number, number] = null;
	let mode = '';
	let add = 0;

	function nextQuestion() {
		const [x, y] = ask();
		const q = x + ' &times; ' + y;
		if (q === question) {
			// same question! try again
			nextQuestion();
			return;
		}
		attempt = '';
		answer = (x * y).toString();
		question = x + ' &times; ' + y;
		timer = 0;

		// shift numbers from [2,12] to [0,9] index range
		Stats.select(x - 2, y - 2);
	};

	function switchQuestionFormat() {
		mode = ask === RandomQuestion.ask ? 'Sequential' : 'Random';
		ask = ask === RandomQuestion.ask ? SequentialQuestion.ask : RandomQuestion.ask;
		nextQuestion();
	};

	function addNumber(n: number) {
		const tmp = attempt + n.toString();
		if (answer.indexOf(tmp) !== 0) {
			wrong = 200;
		}
		attempt = tmp;
	};

	const KEY_ENTER = 13;
	const KEY_H = 72;
	const KEY_Q = 81;
	const KEY_0 = 48;
	const KEY_9 = 57;

	window.onkeyup = function (e: KeyboardEvent) {

		if (e.keyCode === KEY_ENTER) { // <ENTER> for next question
			Stats.deselect(0); // give up on this question
			nextQuestion();
			return;
		}

		if (e.keyCode === KEY_H) { // 'h' for help toggle
			help = !help;
			return;
		}

		if (e.keyCode === KEY_Q) {  // 'q' for switching format
			Stats.deselect(0); // give up on this question
			switchQuestionFormat();
			return;
		}

		if (e.keyCode >= KEY_0 && e.keyCode <= KEY_9) { // numbers
			addNumber(e.keyCode - KEY_0);
			return;
		}
	};

	window.onresize = function () {
		const W = window.innerWidth;
		const H = window.innerHeight;
		// fractions of the H
		const F = Math.round(H / 12);
		html_question.style.paddingTop = F + 'px';
		html_question.style.fontSize = 2 * F + 'px';
		html_attempt.style.paddingTop = 4 * F + 'px';
		html_attempt.style.fontSize = 5 * F + 'px';
		html_answer.style.paddingTop = html_attempt.style.paddingTop;
		html_answer.style.fontSize = html_attempt.style.fontSize;

		Stats.init(W, H, F);
	};

	window.onresize(null);

	html_mode.onclick = function () {
		switchQuestionFormat();
	};
	html_score.onclick = function () {
		help = !help;
	};

	let past = Date.now();
	function draw() {
		const now = Date.now();
		const dt = now - past;
		past = now;

		if (wrong > 0) {
			html_attempt.style.color = "red";
		} else {
			html_attempt.style.color = "black";
		}

		html_question.innerHTML = question;

		let padded_attempt = attempt;
		while (padded_attempt.length < answer.length) {
			padded_attempt = padded_attempt + ' ';
		}
		html_attempt.innerHTML = padded_attempt;

		if (help) {
			// help if too much time without correct answer
			html_answer.style.textShadow = "0px 0px 15px rgba(99, 99, 99, " + Math.min(((timer - 4000) / 9000), 0.5) + ")";
			html_answer.innerHTML = answer;
		} else {
			html_answer.style.textShadow = "none";
		}

		// timer
		const max = 10 + (timer < 6000 ? Math.round(50 * (1 - ((timer + 1) / 6000))) : 0);
		html_mode.innerHTML = mode;
		html_score.innerHTML = (help ? ' [help on] ' : '') + 'score: ' + score;
		html_points.innerHTML = 'max. points: ' + max + ' (' + (Math.round(timer / 1000)) + 's)';

		if (attempt === answer) { // got answer right
			score += max;
			add = 1500;
			html_add.innerHTML = '+' + max + '!';
			Stats.deselect(max);
			nextQuestion();
		}
		if (wrong > 0) {
			wrong -= dt;
			if (wrong <= 0) {
				attempt = '';
			}
		}
		if (add > 0) {
			add -= dt;
			if (add <= 0) {
				html_add.innerHTML = '';
			}
		}

		timer += dt;

		requestAnimationFrame(draw);
	};

	switchQuestionFormat();
	draw();
};

