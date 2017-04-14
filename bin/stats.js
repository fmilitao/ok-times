var ProgressTracker;
(function (ProgressTracker) {
    var MAX = 11;
    var svg = null;
    var grid = [];
    var GRID_WIDTH;
    var GRID_HEIGHT;
    var F;
    var side, delta;
    var selectedCell = null;
    function toGridIndex(x, y) {
        return (x * MAX) + y;
    }
    ;
    function deltaX(i) {
        return (GRID_WIDTH / 2 - ((MAX / 2) * (side + delta))) + (i * (delta + side));
    }
    ;
    function deltaY(j) {
        return (F * 3) + ((MAX - 1 - j) * (side + delta));
    }
    ;
    function init(w, h, f) {
        var isResize = (svg !== null);
        svg = d3.select('svg');
        svg.attr('width', window.innerWidth);
        svg.attr('height', window.innerHeight);
        GRID_WIDTH = w;
        GRID_HEIGHT = h;
        F = f;
        side = Math.floor((F * 7) / MAX);
        delta = 5;
        for (var i = 0; i < MAX; ++i) {
            for (var j = 0; j < MAX; ++j) {
                if (!isResize) {
                    grid.push(svg.append("rect")
                        .attr("class", 'bl')
                        .style("fill", "#3c3c3c")
                        .attr("rx", 10)
                        .attr("ry", 10)
                        .attr('opacity', 0.1)
                        .attr("x", deltaX(i))
                        .attr("y", deltaY(j))
                        .attr("width", side)
                        .attr("height", side));
                }
                else {
                    if (selectedCell !== null && selectedCell.x === i && selectedCell.y === j) {
                        grid[toGridIndex(i, j)]
                            .attr("x", deltaX(i) - delta)
                            .attr("y", deltaY(j) - delta)
                            .attr("width", side + (delta * 2))
                            .attr("height", side + (delta * 2));
                    }
                    else {
                        grid[toGridIndex(i, j)]
                            .attr("x", deltaX(i))
                            .attr("y", deltaY(j))
                            .attr("width", side)
                            .attr("height", side);
                    }
                }
            }
        }
    }
    ProgressTracker.init = init;
    ;
    function select(x, y) {
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
    }
    ProgressTracker.select = select;
    ;
    function deselect(color) {
        if (color === void 0) { color = ProgressTracker.RED; }
        if (selectedCell !== null) {
            grid[toGridIndex(selectedCell.x, selectedCell.y)]
                .transition()
                .duration(500)
                .ease("elastic")
                .attr("x", deltaX(selectedCell.x))
                .attr("y", deltaY(selectedCell.y))
                .attr("width", side)
                .attr("height", side)
                .style("fill", color)
                .attr('opacity', 0.1);
            selectedCell = null;
        }
    }
    ProgressTracker.deselect = deselect;
    ;
    ProgressTracker.GREEN = "#00ff00";
    ProgressTracker.RED = "#ff0000";
    ProgressTracker.YELLOW = "#ffff00";
    function remove() {
        d3.select('svg').remove();
    }
    ProgressTracker.remove = remove;
    ;
})(ProgressTracker || (ProgressTracker = {}));
;
//# sourceMappingURL=stats.js.map