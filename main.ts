
module RandomQuestion {
	
	// TODO finish copying table
	//from http://www.bbc.com/news/blogs-magazine-monitor-28143553
	let WEIGHTS = // times[x][y]
		[ //   2,   3,   4,   5,   6,   7,   8,   9,  10,  11,  12
			1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, // 2
			1, 1, 10, 1, 30, 30, 30, 30, 1, 1, 10, // 3
			1, 1, 20, 1, 40, 40, 60, 40, 1, 1, 40, // 4
			1, 1, 1, 1, 1, 10, 10, 10, 1, 1, 30, // 5
			1, 1, 10, 40, 10, 50, 70, 80, 1, 1, 80, // 6
			1, 1, 10, 40, 10, 50, 70, 80, 1, 1, 80, // 7
			1, 1, 10, 60, 80, 80, 90, 90, 1, 1, 80, // 8
			1, 1, 10, 50, 70, 80, 80, 80, 1, 1, 80, // 9
			1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 10
			1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10, // 11
			1, 1, 10, 40, 10, 50, 70, 70, 60, 10, 80, // 12
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
	const BIG_FONT = {
		HEIGHT: 140,
		FONT: 140 + 'pt monospace',
	};

	const W = window.innerWidth - 4;
	const H = window.innerHeight - 4;
	const canvas = <HTMLCanvasElement> document.getElementById("canvas");
	const ctx = <CanvasRenderingContext2D> canvas.getContext("2d");

	canvas.focus();

	ctx.canvas.width = W;
	ctx.canvas.height = H;
	ctx.font = NORMAL_FONT.FONT;

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
		question = x + ' * ' + y + ' ?';
		timer = 0;
	};

	function switchQuestionFormat() {
		mode = ask === RandomQuestion.ask ? 'Sequential' : 'Random';
		ask = ask === RandomQuestion.ask ? SequentialQuestion.ask : RandomQuestion.ask;
		nextQuestion();
	};

	function addNumber(n: number) {
		const tmp = attempt + n.toString();
		//console.log(res+' '+tmp+' '+res.indexOf(tmp));
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


	const width = (s : string) => ctx.measureText(s).width;
	let past = Date.now();
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
		ctx.fillText(question, (W / 2 - (width(question)/ 2)), 0 + 4 * SMALL_FONT.HEIGHT);

		ctx.font = BIG_FONT.FONT;
		ctx.fillText(attempt, (W / 2 - (width(answer) / 2)), H / 2);

		if (help) {
			// help if too much time without correct answer
			ctx.fillStyle = "rgba(0, 0, 0, " + Math.min(((timer - 4000) / 9000), 0.5) + ")";
			ctx.fillText(answer, (W / 2 - (width(answer) / 2)), H / 2);
		}

		// timer
		ctx.font = SMALL_FONT.FONT;
		ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
		ctx.fillText(mode + (help ? ' (help on) ' : '') + ' ' + (Math.round(timer / 1000)) + 's', 0, 0 + SMALL_FONT.HEIGHT);
		ctx.fillText('score: '+score, 0, 0 + 2.5*SMALL_FONT.HEIGHT);

		if (attempt === answer) { // got answer right
			score += 10 + (timer < 9000 ? Math.round( 50*(1-(timer/6000)) ) : 0);
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

