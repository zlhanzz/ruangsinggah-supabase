const fs = require('fs');
const html = fs.readFileSync('functions/scratch/short_link_page.html', 'utf8');

const r1 = /center(?:=|\\u003d)(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i;
const r2 = /center(?:=|\u003d)(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i;
const r3 = /center(?:=|\\u003d|\\\\u003d)(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i;

const r4 = /(?:@|%40)(-?\d+\.\d+),(?:%2C|,)?(-?\d+\.\d+)/i;

console.log("R1 Matched:", !!html.match(r1), html.match(r1)?.[0]);
console.log("R2 Matched:", !!html.match(r2), html.match(r2)?.[0]);
console.log("R3 Matched:", !!html.match(r3), html.match(r3)?.[0]);
console.log("R4 Matched:", !!html.match(r4), html.match(r4)?.[0]);
