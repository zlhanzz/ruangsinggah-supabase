const fs = require('fs');
const html = fs.readFileSync('functions/scratch/short_link_page.html', 'utf8');

// Regex 1: /center(?:=|\u003d)(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i
// Note: in JS regex literal, \u003d is treated as the character = because \u003d is the unicode escape sequence for =!
// So /center(?:=|\u003d)/ matches exactly center= ! It does NOT match center\u003d where backslash and u003d are separate characters in the string!
// Ah!!! That's why! In the HTML page, the text contains a literal backslash followed by 'u003d'.
// To match a literal backslash and 'u003d', the regex must be: /center(?:=|\\u003d)/ !
// Let's test this in Node.js!

const r1 = /center(?:=|\\u003d)(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i;
const r2 = /center(?:=|\u003d)(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i;
const r3 = /center(?:=|\\u003d|\\\\u003d)(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i;

console.log("R1 Match:", html.match(r1));
console.log("R2 Match:", html.match(r2));
console.log("R3 Match:", html.match(r3));

// Let's also test maps/place/@lat,lng or maps/place/%40lat,lng
const rPlace = /(?:@|%40)(-?\d+\.\d+),(?:%2C|,)?(-?\d+\.\d+)/i;
console.log("rPlace Match:", html.match(rPlace));
