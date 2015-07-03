
module RandomQuestion {
	
	// TODO finish copying table
	//from http://www.bbc.com/news/blogs-magazine-monitor-28143553
	let WEIGHTS = // times[x][y]
		[ //   2,   3,   4,   5,   6,   7,   8,   9,  10,  11,  12
			1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, // 2
			1, 1, 10, 1, 30, 30, 30, 30, 1, 1, 10, // 3
			1, 1, 20, 1, 40, 40, 60, 40, 1, 1, 40, // 4
			1, 1, 1, 1, 1, 10, 10, 10, 1, 1, 10, // 5
			1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10, // 6
			1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10, // 7
			1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10, // 8
			1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10, // 9
			1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10, // 10
			1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10, // 11
			1, 1, 10, 40, 10, 50, 50, 70, 60, 10, 80, // 12
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

window.onload = function() {

	const NORMAL_FONT = {
		HEIGHT: 50,
		FONT: 50 + 'pt monospace',
	};
	const SMALL_FONT = {
		HEIGHT: 20,
		FONT: 20 + 'pt monospace',
	};

	const FONT_H = 50;
	const W = window.innerWidth - 4;
	const H = window.innerHeight - 4;
	const canvas = <HTMLCanvasElement> document.getElementById("canvas");
	const ctx = <CanvasRenderingContext2D> canvas.getContext("2d");

	canvas.focus();

	ctx.canvas.width = W;
	ctx.canvas.height = H;
	ctx.font = NORMAL_FONT.FONT;
	// ...

	let attempt = '';
	let answer = '';
	let question = '';
	let wrong = 0;
	let timer = 0;
	let ask = SequentialQuestion.ask;
	let mode = 'SequentialQuestion.ask';

	function nextQuestion() {
		const [x, y] = ask();
		attempt = '';
		answer = (x * y).toString();
		question = x + ' * ' + y + ' ?';
		timer = 0;
	};

	function switchQuestionFormat() {
		mode = ask === SequentialQuestion.ask ? 'RandomQuestion.ask' : 'SequentialQuestion.ask';
		ask = ask === SequentialQuestion.ask ? RandomQuestion.ask : SequentialQuestion.ask;
		nextQuestion();
	};

	function addNumber(n: number) {
		const tmp = attempt + n.toString();
		//console.log(res+' '+tmp+' '+res.indexOf(tmp));
		if (answer.indexOf(tmp) == -1) {
			wrong = 200;
		}
		attempt = tmp;
	};

	function keyUp(e: KeyboardEvent) {

		if (e.keyCode === 13) { // <ENTER> for next question
			nextQuestion();
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

	window.addEventListener("keyup", keyUp, true);


	let past = Date.now()
	function draw() {
		const now = Date.now();
		const dt = now - past;
		past = now;

		// cleans background
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, W, H);
		ctx.fillStyle = "#000000";

		if (wrong > 0) {
			ctx.fillStyle = "#ff0000";
		} else {
			ctx.fillStyle = "#000000";
		}

		ctx.font = NORMAL_FONT.FONT;
		ctx.fillText(question, 0, H / 2);
		ctx.fillText(attempt, 0, H / 2 + NORMAL_FONT.HEIGHT);

		ctx.fillStyle = "rgba(0, 0, 0, " + Math.min(((timer - 2000) / 6000), 0.6) + ")";
		ctx.fillText(answer, 0, H / 2 + NORMAL_FONT.HEIGHT);

		// should appear as time passes...
		ctx.font = SMALL_FONT.FONT;
		ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
		ctx.fillText(mode + ' ' + (Math.round(timer / 1000)) + 's', 0, 0 + SMALL_FONT.HEIGHT);

		if (attempt === answer) { // got answer right
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


    draw();
};

