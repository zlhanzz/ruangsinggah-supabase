const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('useSearchParams') || line.includes('useNavigate') || line.includes('history') || line.includes('location')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
