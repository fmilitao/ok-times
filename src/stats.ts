/// <reference path="../lib/d3.d.ts" />

module Stats {

	let svg: d3.Selection<SVGElement> = null;
	let s: d3.Selection<SVGElement>[] = [];

	export function remove(){
		d3.select('svg').remove();
	};

	let W: number, H: number, F: number;
	let side: number, delta: number;
	const MAX = 11; // max grid elements X/Y
	let selected_x = -1, selected_y = -1;

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

		W = w; H = h; F = f;
		side = Math.floor((F * 7) / MAX);
		delta = 5;

		for (let i = 0; i < MAX; ++i) {
			for (let j = 0; j < MAX; ++j) {

				if (!isResize) {
					s.push(
						svg.append("rect")
							.attr("class", 'bl')
							.style("fill", "#3c3c3c")
							.attr("rx", 10)
							.attr("ry", 10)
							.attr('opacity', 0.1)
							// position stuff
							.attr("x", deltaX(i))
							.attr("y", deltaY(j))
							.attr("width", side)
							.attr("height", side)
						);
				}else{
					// resize
					if (selected_x === i && selected_y === j ) {
						s[(i * MAX) + j]
							.attr("x", deltaX(i) - delta)
							.attr("y", deltaY(j) - delta)
							.attr("width", side + (delta * 2))
							.attr("height", side + (delta * 2));
					}else{
						s[(i * MAX) + j]
							.attr("x", deltaX(i))
							.attr("y", deltaY(j))
							.attr("width", side)
							.attr("height", side);
					}
				}
			}
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
		
		selected_x = i;
		selected_y = j;
	};

	export function deselect(points:number) {
		const i = selected_x;
		const j = selected_y;
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

		selected_x = -1;
		selected_y = -1;
	};

};
