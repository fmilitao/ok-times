/// <reference path="../lib/d3.d.ts" />

// FIXME use this: import * as d3 from "d3";

module ProgressTracker {
	// max grid elements per row / column
	const MAX = 11;

	let svg: d3.Selection<SVGElement> = null;
	let grid: d3.Selection<SVGElement>[] = [];

	let GRID_WIDTH: number;
	let GRID_HEIGHT: number;
	let F: number; // FIXME: wtf is this? fractions of height?
	let side: number, delta: number;

	let selectedCell: { x: number, y: number } | null = null;

	/**
	 * Converts a (x,y) position in the table to the index in
	 * the single dimension grid.
	 * 
	 * @param x the x position in the table
	 * @param y the y position in the table
	 */
	function toGridIndex(x: number, y: number): number {
		return (x * MAX) + y;
	};

	function deltaX(i: number) {
		// FIXME misaligned!
		return (GRID_WIDTH / 2 - ((MAX / 2) * (side + delta))) + (i * (delta + side));
	};
	function deltaY(j: number) {
		return (F * 3) + ((MAX - 1 - j) * (side + delta));
	};

	export function init(w: number, h: number, f: number) {
		const isResize = (svg !== null);
		svg = d3.select('svg');
		svg.attr('width', window.innerWidth);
		svg.attr('height', window.innerHeight);

		GRID_WIDTH = w;
		GRID_HEIGHT = h;
		F = f;
		side = Math.floor((F * 7) / MAX);
		delta = 5;

		for (let i = 0; i < MAX; ++i) {
			for (let j = 0; j < MAX; ++j) {

				if (!isResize) {
					grid.push(
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
				} else {
					// resize
					if (selectedCell !== null && selectedCell.x === i && selectedCell.y === j) {
						grid[toGridIndex(i, j)]
							.attr("x", deltaX(i) - delta)
							.attr("y", deltaY(j) - delta)
							.attr("width", side + (delta * 2))
							.attr("height", side + (delta * 2));
					} else {
						grid[toGridIndex(i, j)]
							.attr("x", deltaX(i))
							.attr("y", deltaY(j))
							.attr("width", side)
							.attr("height", side);
					}
				}
			}
		}

	};


	export function select(x: number, y: number) {
		if (selectedCell !== null) {
			this.deselect();
		}

		grid[toGridIndex(x, y)]
			.transition()
			.duration(500)
			.ease("elastic")
			.attr("x", deltaX(x) - delta)
			.attr("y", deltaY(y) - delta)
			.attr("width", side + (delta * 2))
			.attr("height", side + (delta * 2))
			.attr('opacity', 0.2);

		selectedCell = { x: x, y: y };
	};

	/**
	 * Deselects current tracking.
	 * 
	 * @param points - the score that caused the tracking state-change, default to 0 (no points).
	 */
	export function deselect(points: number = 0) {
		if (selectedCell !== null) {
			grid[toGridIndex(selectedCell.x, selectedCell.y)]
				.transition()
				.duration(500)
				.ease("elastic")
				.attr("x", deltaX(selectedCell.x))
				.attr("y", deltaY(selectedCell.y))
				.attr("width", side)
				.attr("height", side)
				.style("fill", (points > 30 ? "#00ff00" : (points <= 10 ? '#ff0000' : '#ffff00')))
				.attr('opacity', 0.1);

			selectedCell = null;
		}
	};

	/**
	 * Removes the SVG element from the document.
	 */
	export function remove() {
		d3.select('svg').remove();
	};
};
