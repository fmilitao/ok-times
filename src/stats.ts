/// <reference path="../lib/d3.d.ts" />

module Stats {

	let svg: d3.Selection<SVGElement> = null;
	let queue: d3.Selection<SVGElement>[] = null;
	let trans: d3.Transition<SVGElement>[] = null;

	export function remove(){
		d3.select('svg').remove();
	};

	export function init(){
		svg = d3.select('svg');
		svg.attr('width', window.innerWidth-4); //FIXME: remove testing border
		svg.attr('height', window.innerHeight-4);

		queue = new Array();
		trans = new Array();
		// for (let i = 0; i < queue.length;++i){
		// 	queue[i] = null;
		// }
	};

	export function addPoint(p:number){
		const r = svg.append('rect')
			.style("fill", "blue")
			.attr("x", -60)
			.attr("y", 100)
			.attr("width", p)
			.attr("height", 20)
			.attr('opacity', 1);
		queue.push(r);
		
		const t = r.transition()
			.duration(1000)
			.ease("elastic")
			.attr("x", 60);

		trans.push(t);
	};

	export function updatePoint(p:number){
		trans[0].each('end',
			(d, i) => {
				trans[0] = queue[0].transition()
					.ease("linear")
					.attr("width", p);
			});
	};

};
