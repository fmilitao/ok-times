/// <reference path="../lib/d3.d.ts" />

module Stats {

	let svg: d3.Selection<SVGElement> = null;
	let queue: d3.Selection<SVGElement>[] = null;
	let trans: d3.Transition<SVGElement>[] = null;

	export function remove(){
		d3.select('svg').remove();
	};

	let s: any[] = [];

	export function init(){
		svg = d3.select('svg');
		svg.attr('width', window.innerWidth-4); //FIXME: remove testing border
		svg.attr('height', window.innerHeight-4);

		queue = [];
		trans = [];
		// for (let i = 0; i < queue.length;++i){
		// 	queue[i] = null;
		// }

		// FIXME: copy paste from other
		const W = window.innerWidth;
		const H = window.innerHeight;
		// fractions of the H
		const F = Math.round(H / 12);

		for (var i = 0; i < 11; ++i)
			for (var j = 0; j < 11; ++j) {
				s.push(
					svg.append("rect")
						.attr("class", 'bl')
						.style("fill", "#ff0000")
						.attr("rx", 15)
						.attr("ry", 15)
						.attr("x", (W/2-(5*50)) + (i * (50))) //FIXME not fully aligned!!
						.attr("y", (F*3) + (j * (50)))
						.attr("width", 40)
						.attr("height", 40)
						.attr('opacity', 0.1)
					);
			}
	};

	export function select(i:number,j:number){
		// FIXME: copy paste from other
		const W = window.innerWidth;
		const H = window.innerHeight;
		// fractions of the H
		const F = Math.round(H / 12);
		s[(i*11)+j]
			.transition()
			.duration(500)
			.ease("elastic")
			.attr("x", (W / 2 - (5 * 50)) + (i * (50)) - 5)
			.attr("y", (F * 3) + (j * (50)) - 5)
			.attr("width", 50)
			.attr("height", 50)
			.attr('opacity', 0.2);
	};

	export function deselect(i: number, j: number, points:number) {
		// FIXME: copy paste from other
		const W = window.innerWidth;
		const H = window.innerHeight;
		// fractions of the H
		const F = Math.round(H / 12);

		s[(i * 11) + j]
			.transition()
			.duration(500)
			.ease("elastic")
			.attr("x", (W / 2 - (5 * 50)) + (i * (50)))
			.attr("y", (F * 3) + (j * (50)) )
			.attr("width", 40)
			.attr("height", 40)
			.style("fill", (points > 30 ? "#00ff00" : (points <= 10 ? '#ff0000' : '#ffff00')))
			.attr('opacity', 0.1);
	};


// FIXME: http://bl.ocks.org/mbostock/3943967 ??
	export function addPoint(p:number){
		function push(i:number,max:number){
			//console.log(max + ' ' + i + ' ' + (max - i) + ' ' + (max - i) * 25);
			return (d : any, j : any) => {
					trans[i] = queue[i].transition()
						.ease("linear")
						.attr("y", (max-i+1)*25+100 )
						.attr("width", p);
				};
		};

		// push old elements down
		for (let i = trans.length-1; i >= 0; --i) {
			console.log(i + ' ' + trans[i]);
			trans[i].each('end', push(i, (trans.length - 1)));
		}

		const r = svg.append('rect')
			.style("fill", "blue")
			.attr("x", -60)
			.attr("y", 100)
			.attr("width", p)
			.attr("height", 20)
			.attr('opacity', 0.5);
		queue.push(r);

		const t = r.transition()
			.duration(1000)
			.ease("elastic")
			.attr("x", 60);

		trans.push(t);

	};

	export function updatePoint(p:number){
		// trans[0].each('end',
		// 	(d, i) => {
		// 		trans[0] = queue[0].transition()
		// 			.ease("linear")
		// 			.attr("width", p);
		// 	});
	};

};
