const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines2 = content.split('\n');

let setStep3BtnIdx = -1;
for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].includes('Lanjut ke Step 3') && i > 4500) {
    console.log("Found Lanjut ke Step 3 text at index:", i, "line:", i + 1);
    for (let j = i - 5; j <= i; j++) {
      console.log(`Checking line ${j+1}: ${lines2[j]}`);
      if (lines2[j].includes('<button')) {
        setStep3BtnIdx = j;
        break;
      }
    }
    console.log("setStep3BtnIdx:", setStep3BtnIdx);
    if (setStep3BtnIdx !== -1) break;
  }
}
