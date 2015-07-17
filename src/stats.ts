/// <reference path="../lib/d3.d.ts" />

module Stats {

	let svg: d3.Selection<SVGElement> = null;
	let queue: d3.Selection<SVGElement>[] = null;
	let trans: d3.Transition<SVGElement>[] = null;

	export function remove(){
		d3.select('svg').remove();
	};

	let s: d3.Selection<SVGElement>[] = [];

	let W: number, H: number, F: number;
	let side: number, delta: number;
	const MAX = 11; // max grid elements X/Y

	function deltaX(i:number){
		return (W / 2 - ((MAX/2) * (side+delta))) + (i * (delta+side)); // FIXME misaligned
	};
	function deltaY(j:number){
		return (F * 3) + ((MAX-1-j) * (side+delta));
	};

	export function init(w : number, h : number, f : number){
		const isResize = (svg !== null);
		svg = d3.select('svg');
		svg.attr('width', window.innerWidth);
		svg.attr('height', window.innerHeight);

		queue = [];
		trans = [];
		// for (let i = 0; i < queue.length;++i){
		// 	queue[i] = null;
		// }

		W = w; H = h; F = f;
		side = Math.floor((F * 7) / MAX);
		delta = 5;

		// remove all old stuff
		if( isResize ){
			for (let i = 0; i < s.length;++i)
				s[i].remove();
		}

		for (let i = 0; i < MAX; ++i)
			for (let j = 0; j < MAX; ++j) {
				s.push(
					svg.append("rect")
						.attr("class", 'bl')
						.style("fill", "#ff0000")
						.attr("rx", 10)
						.attr("ry", 10)
						.attr("x", deltaX(i) )
						.attr("y", deltaY(j) )
						.attr("width", side)
						.attr("height", side)
						.attr('opacity', 0.1)
					);
			}
	};

	export function select(i:number,j:number){
		s[(i * MAX) + j]
			.transition()
			.duration(500)
			.ease("elastic")
			.attr("x", deltaX(i) - delta)
			.attr("y", deltaY(j) - delta)
			.attr("width", side+(delta*2))
			.attr("height", side + (delta * 2))
			.attr('opacity', 0.2);
	};

	export function deselect(i: number, j: number, points:number) {
		s[(i * MAX) + j]
			.transition()
			.duration(500)
			.ease("elastic")
			.attr("x", deltaX(i))
			.attr("y", deltaY(j))
			.attr("width", side)
			.attr("height", side)
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
