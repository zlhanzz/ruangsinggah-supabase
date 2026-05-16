
import fs from 'fs';

const content = fs.readFileSync('c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/components/admin/ExtensionTransactionManagement.tsx', 'utf8');

function checkBrackets(str) {
    const stack = [];
    const open = { '(': ')', '[': ']', '{': '}' };
    const close = { ')': '(', ']': '[', '}': '{' };
    
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (open[char]) {
            stack.push({ char, pos: i });
        } else if (close[char]) {
            if (stack.length === 0) {
                console.log(`Unmatched closing bracket ${char} at position ${i}`);
                return;
            }
            const last = stack.pop();
            if (last.char !== close[char]) {
                console.log(`Mismatch: ${last.char} at ${last.pos} and ${char} at ${i}`);
                return;
            }
        }
    }
    
    if (stack.length > 0) {
        stack.forEach(s => {
            console.log(`Unclosed bracket ${s.char} at position ${s.pos}`);
            // Get line number
            const lines = str.substring(0, s.pos).split('\n');
            console.log(`Line: ${lines.length}`);
        });
    } else {
        console.log('All brackets are balanced!');
    }
}

checkBrackets(content);
