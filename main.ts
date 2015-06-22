
module RandomQuestion {
	
	//TODO incomplete.
	const WEIGHTS = // times[x][y]
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
			1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 80, // 12
		];

	const MAX = WEIGHTS.reduce((old, curr) => old + curr, 0);

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
	}
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

// Test.testRandomQuestion();
// Test.testSequentialQuestion();

