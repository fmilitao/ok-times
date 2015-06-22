
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
			if (accum >= rd){
				// floor is intentional to ensure 0..11 on same 'x'
				return [Math.floor(i / 11) + 2, (i % 11) + 2];
			}
		}

		throw ('Error: did not find question.' + rd + ' ' + MAX + ' ' + accum);
	};

};

module SequentialQuestion {
	let aux = 0;

	export function ask () {
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

	const FONT_H = 50;
	const W = window.innerWidth - 4;
	const H = window.innerHeight - 4;
	const canvas = <HTMLCanvasElement> document.getElementById("canvas");
	const ctx = <CanvasRenderingContext2D> canvas.getContext("2d");

	canvas.focus();

	ctx.canvas.width = W;
	ctx.canvas.height = H;
	ctx.font = FONT_H+'pt monospace';
	// ...

	let val = 0;
	let res = 0;
	let str = '';
	let ask = SequentialQuestion.ask;

	function redraw(){
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, W, H);
		ctx.fillStyle = "#000000";

		if (val === res) {
			const [x, y] = ask();
			val = 0;
			res = x * y;
			str = x + ' * ' + y + ' ?';
		}
		ctx.fillText(str, 0, H / 2);
		if (val !== 0)
			ctx.fillText('' + val, 0, H / 2 + FONT_H);
	};

	function keyUp(e: KeyboardEvent) {

		if( e.keyCode === 13 ){ // enter for next question
			val = 0;
			res = 0;
			redraw();
			return;
		}

		if( e.keyCode === 81 ){ // 'q' for switching format
			ask = ask === SequentialQuestion.ask ? RandomQuestion.ask : SequentialQuestion.ask;
			val = 0;
			res = 0;
			redraw();
			return;
		}

		// key numbers
		if( e.keyCode >= 48 && e.keyCode <= 57 ){
			const k = e.keyCode - 48;
			val = val * 10 + k;
			redraw();
			return;
		}

	};

	window.addEventListener("keyup", keyUp, true);

    redraw();
};

