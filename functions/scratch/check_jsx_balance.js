const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\r\n').join('\n').split('\n');

// Print temporaryRoom block from 3560 to 4240 with indentation
let openCount = 0;
let closeCount = 0;
let fragOpen = 0;
let fragClose = 0;

for (let i = 3550; i < 4150; i++) {
  const line = lines[i];
  if (!line) continue;
  
  // Count <> and </>
  const matchOpen = line.match(/<>/g);
  const matchClose = line.match(/<\/>/g);
  
  if (matchOpen) fragOpen += matchOpen.length;
  if (matchClose) fragClose += matchClose.length;
  
  console.log(`${i+1}: [O:${fragOpen}, C:${fragClose}] ${line}`);
}
