const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');
const lines = code.split('\n');

// Find bg-[#f8f9ff] content div line (should be around 4119)
let contentDivLine = -1;
for (let i = 4110; i < 4130; i++) {
    if (lines[i] && lines[i].includes('bg-[#f8f9ff]') && lines[i].includes('rounded-3xl')) {
        contentDivLine = i;
        console.log('Content div at line', i + 1);
        break;
    }
}

if (contentDivLine === -1) {
    console.error('Content div not found!');
    process.exit(1);
}

// Track JSX elements using a stack - more accurate than counting
// Look for <tagname and </tagname patterns
const stack = [];
let result = -1;

// Only track <div since our outer div is a div
for (let i = contentDivLine; i < lines.length; i++) {
    const line = lines[i];
    
    // Find all <div and </div>
    let pos = 0;
    while (pos < line.length) {
        if (line[pos] === '<') {
            if (line[pos+1] === '/') {
                // Closing tag
                stack.pop();
                if (stack.length === 0) {
                    result = i;
                    console.log('Content div closes at line', i + 1);
                    break;
                }
                pos += 2;
            } else if (line[pos+1] === '!') {
                // Comment
                pos++;
            } else {
                // Opening tag - find the tag name
                let tagEnd = pos + 1;
                while (tagEnd < line.length && line[tagEnd] !== ' ' && line[tagEnd] !== '>' && line[tagEnd] !== '/') {
                    tagEnd++;
                }
                const tagName = line.substring(pos + 1, tagEnd);
                // Self-closing tags don't push to stack
                // Find end of opening tag
                let tagClose = line.indexOf('>', pos);
                if (tagClose > -1 && line[tagClose - 1] === '/') {
                    // Self-closing
                    pos = tagClose + 1;
                } else {
                    stack.push(tagName);
                    pos = tagClose > -1 ? tagClose + 1 : pos + 1;
                }
            }
        } else {
            pos++;
        }
    }
    
    if (result !== -1) break;
}

if (result === -1) {
    console.log('Trying simple div counting...');
    let depth = 0;
    for (let i = contentDivLine; i < lines.length; i++) {
        const line = lines[i];
        const opens = (line.match(/<div[\s>]/g) || []).length;
        const closes = (line.match(/<\/div>/g) || []).length;
        depth += opens - closes;
        if (depth === 0 && i > contentDivLine) {
            result = i;
            console.log('Content div closes at line (simple count):', i + 1);
            break;
        }
    }
}

if (result > -1) {
    console.log('Lines around content div close:');
    for (let j = result - 3; j <= result + 5; j++) {
        console.log('L' + (j+1) + ': ' + JSON.stringify(lines[j]));
    }
}
