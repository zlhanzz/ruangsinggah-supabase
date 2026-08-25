const fs = require('fs');
const code = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');

const oldRenderTarget = 'bg-gray-900/80 backdrop-blur-sm" onClick={closeKostManagerListing}></div>\n                        <div className="bg-[#f8f9ff]';
console.log('Has old closing div pattern:', code.includes(oldRenderTarget));

const warnTarget = 'isExistingPropertyMigration && !warningAccepted';
console.log('Has warning popup:', code.includes(warnTarget));

const lines = code.split('\n');
let kostManagerModalStart = -1;
lines.forEach((line, idx) => {
    if (line.includes('isEditingKostManager && (')) {
        kostManagerModalStart = idx;
    }
});
if (kostManagerModalStart > -1) {
    console.log('Modal render starts at line:', kostManagerModalStart + 1);
    for (let i = kostManagerModalStart; i <= kostManagerModalStart + 8; i++) {
        console.log(`L${i + 1}: ${lines[i]}`);
    }
}
