const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Replace all occurrences of 'View / Jendela' with 'Tempat Tidur'
content = content.replace(/'View \/ Jendela'/g, "'Tempat Tidur'");

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Successfully replaced View / Jendela with Tempat Tidur.");
