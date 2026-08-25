const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');
const lines = code.split('\n');

// Find the else branch (': (') that comes after the warning card
let elseStart = -1;
for (let i = 4110; i < 4125; i++) {
    if (lines[i] && lines[i].trim() === ') : (') {
        elseStart = i;
        console.log('Else branch at line', i + 1);
        break;
    }
}

if (elseStart === -1) {
    console.error('Else branch ") : (" not found!');
    process.exit(1);
}

// The content div starts at line elseStart + 1
const contentDivLine = elseStart + 1;
console.log('Content div (bg-[#f8f9ff]) at line', contentDivLine + 1, ':', lines[contentDivLine].substring(0, 80));

// Count div depth to find where the content div closes
let depth = 0;
let contentDivEnd = -1;
for (let i = contentDivLine; i < lines.length; i++) {
    const line = lines[i];
    // Count opening and closing divs, accounting for self-closing
    const opens = (line.match(/<div[\s>]/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    depth += opens - closes;
    if (depth === 0 && i > contentDivLine) {
        contentDivEnd = i;
        console.log('Content div closes at line', i + 1);
        console.log('Lines around closing:');
        for (let j = i - 4; j <= i + 5; j++) {
            console.log('L' + (j+1) + ': ' + lines[j]);
        }
        break;
    }
}

if (contentDivEnd === -1) {
    console.error('Content div end not found!');
    process.exit(1);
}

// Check if )} is already there after the content div end
const afterContent = lines[contentDivEnd + 1];
if (afterContent && afterContent.trim() === ')}') {
    console.log('Ternary close already exists at line', contentDivEnd + 2, '- no action needed.');
    process.exit(0);
}

// Insert )} to close the ternary after the content div
// The content div has 28 spaces indent, so ternary close has 24 spaces
const ternaryClose = '                        )}';
console.log('Inserting ternary close:', JSON.stringify(ternaryClose), 'after line', contentDivEnd + 1);
lines.splice(contentDivEnd + 1, 0, ternaryClose);

const newCode = lines.join('\n');
fs.writeFileSync(targetFile, newCode, 'utf8');
console.log('Ternary closing )} successfully inserted. Total lines now:', lines.length);
