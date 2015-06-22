//TODO incomplete.
var WEIGHTS = [
    1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1,
    1, 1, 10, 1, 30, 30, 30, 30, 1, 1, 10,
    1, 1, 20, 1, 40, 40, 60, 40, 1, 1, 40,
    1, 1, 1, 1, 1, 10, 10, 10, 1, 1, 10,
    1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10,
    1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10,
    1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10,
    1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10,
    1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10,
    1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 10,
    1, 1, 10, 40, 10, 50, 70, 1, 80, 1, 80,
];
var MAX = WEIGHTS.reduce(function (old, curr) { return old + curr; }, 0);
console.log(MAX);
function question() {
    var rd = Math.floor(MAX * Math.random());
    var accum = 0;
    for (var i_1 = 0; i_1 < WEIGHTS.length; ++i_1) {
        accum += WEIGHTS[i_1];
        if (accum >= rd)
            return [Math.floor(i_1 / 11) + 2, (i_1 % 11) + 2];
    }
    throw ('Error: did not find question.' + rd + ' ' + MAX + ' ' + accum);
}
;
//
// TESTING
//
var tmp = {};
var i = 10000;
while (i-- > 0) {
    var _a = question(), x = _a[0], y = _a[1];
    var m = x + '*' + y;
    tmp[m] = tmp[m] === undefined ? 0 : tmp[m] + 1;
}
for (var i_2 = 2; i_2 <= 12; i_2++) {
    var s = '';
    for (var j = 2; j <= 12; j++) {
        var v = tmp[i_2 + '*' + j];
        if (v === undefined)
            s += '\t' + 0;
        else
            s += '\t' + v;
    }
    console.log(s);
}
