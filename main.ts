
module RandomQuestion {
	
	// TODO finish copying table
	//from http://www.bbc.com/news/blogs-magazine-monitor-28143553
	// note that '01' (binary notation) is 1. used for matching lengths
	let WEIGHTS = // times[x][y]
		[ // 2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12
			01, 01, 01, 01, 01, 01, 01, 10, 01, 01, 01, // 2
			01, 01, 10, 01, 30, 30, 30, 30, 01, 01, 10, // 3
			01, 01, 20, 01, 40, 40, 60, 40, 01, 01, 40, // 4
			01, 01, 01, 01, 01, 10, 10, 10, 01, 01, 30, // 5
			01, 01, 10, 40, 10, 50, 70, 80, 01, 01, 80, // 6
			01, 01, 10, 40, 10, 50, 70, 80, 01, 01, 80, // 7
			01, 01, 10, 60, 80, 80, 90, 90, 01, 01, 80, // 8
			01, 01, 10, 50, 70, 80, 80, 80, 01, 01, 80, // 9
			01, 01, 01, 01, 01, 01, 01, 01, 01, 01, 01, // 10
			01, 01, 10, 40, 10, 50, 70, 01, 80, 01, 10, // 11
			01, 01, 10, 40, 10, 50, 70, 70, 60, 10, 80, // 12
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

	export function ask() {
		const i = aux; // increments to next
		aux = (aux + 1) % (11 * 11);
		return [Math.floor(i / 11) + 2, (i % 11) + 2];
	};
};

/*
module Test {

	export function testRandomQuestion() {

		let tmp = {};
		let i = 10000;
		while (i-- > 0) {
			const [x, y] = RandomQuestion.ask();
			const m = x + '*' + y;
			tmp[m] = tmp[m] === undefined ? 0 : tmp[m] + 1;
			//	console.log(m);
		}

		for (let i = 2; i <= 12; i++) {
			let s = '';
			for (let j = 2; j <= 12; j++) {
				const v = tmp[i + '*' + j];
				if (v === undefined)
					s += '\t' + 0;
				else
					s += '\t' + v;
			}
			console.log(s);
		}

	};

	export function testSequentialQuestion() {
		let i = 12 * 12;
		while (i-- > 0) {
			console.log(SequentialQuestion.ask());
		}
	};

};
*/

window.onload = function() {

	const W = window.innerWidth;
    const H = window.innerHeight;

	let score = 0;
	let help = true;
	let attempt = '';
	let answer = '';
	let question = '';
	let wrong = 0;
	let timer = 0;
	let ask = null;
	let mode = '';

	function nextQuestion() {
		const [x, y] = ask();
		attempt = '';
		answer = (x * y).toString();
		question = x + ' &times; ' + y + ' ?';
		timer = 0;
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

	window.onkeyup = function(e: KeyboardEvent) {

		if (e.keyCode === 13) { // <ENTER> for next question
			nextQuestion();
			return;
		}

		if (e.keyCode === 72) { // 'h' for help toggle
			help = !help;
			return;
		}

		if (e.keyCode === 81) {  // 'q' for switching format
			switchQuestionFormat();
			return;
		}

		if (e.keyCode >= 48 && e.keyCode <= 57) { // numbers
			addNumber(e.keyCode - 48);
			return;
		}
	};

	const html_mode = document.getElementById('mode');
	const html_score = document.getElementById('score');
	const html_points = document.getElementById('points');

	const html_question = document.getElementById('question');
	const html_attempt = document.getElementById('attempt');
	const html_answer = document.getElementById('answer');

	// TODO: adjust these
	html_question.style.paddingTop = '10px';
	html_attempt.style.paddingTop = '100px';
	html_answer.style.paddingTop = html_attempt.style.paddingTop;

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
			html_answer.style.color = "rgba(0, 0, 0, " + Math.min(((timer - 4000) / 9000), 0.5) + ")";
			html_answer.innerHTML = answer;
		}

		// timer
		const max = 10 + (timer < 6000 ? Math.round(50 * (1 - ((timer + 1) / 6000))) : 0);
		html_mode.innerHTML = mode + (help ? ' [help on] ' : '');
		html_score.innerHTML = 'score: ' + score;
		html_points.innerHTML = 'max. points: '+max + ' (' + (Math.round(timer / 1000)) + 's)';

		if (attempt === answer) { // got answer right
			score += max;
			nextQuestion();
		}
		if (wrong > 0) {
			wrong -= dt;
			if (wrong <= 0) {
				attempt = '';
			}
		}

		timer += dt;

		requestAnimationFrame(draw);
	};

	switchQuestionFormat();
    draw();
};

