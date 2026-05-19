
import fs from 'fs';
const filePath = 'c:\\Users\\ZHULL\\Desktop\\Firebase to Supabase\\functions\\public\\components\\admin\\SurveyManagement.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find the problematic line by content
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('})}                                );')) {
        console.log('Found problematic line at index:', i);
        // Replace this line and the next one
        lines[i] = lines[i].split('})}')[0] + '})}';
        if (lines[i+1] && lines[i+1].trim() === '})}') {
            lines.splice(i+1, 1);
        }
        break;
    }
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log('File fixed!');
