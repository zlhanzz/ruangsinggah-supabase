const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');

const checks = ['readyDate', 'residentKtpUrl', 'Dokumen Penghuni', 'Tanggal Kamar Siap Huni', 'formatThousand'];
checks.forEach(check => {
  const found = lines.some(line => line.includes(check));
  console.log(`Checking for "${check}": ${found ? 'FOUND' : 'NOT FOUND'}`);
});
