const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// Find the duplicate closeKostManagerListing block (the one that calls closeKostManagerListing() recursively)
let dupStart = -1;
for (let i = 280; i < lines.length; i++) {
  if (lines[i].includes('const closeKostManagerListing = () =>') && lines[i+1] && lines[i+1].includes('closeKostManagerListing();')) {
    dupStart = i;
    break;
  }
}

if (dupStart !== -1) {
  // We want to delete the duplicate function and the duplicated useEffects that follow it.
  // The first useEffect starts with // Auto-save Kost Manager Onboarding draft effect
  // The second useEffect starts with // Auto-load onboarding from URL search params on refresh
  // Let's find where the duplicate section ends.
  let dupEnd = -1;
  let effectCount = 0;
  for (let j = dupStart; j < dupStart + 100; j++) {
    if (lines[j].includes('}, [searchParams, surveyRequests, isEditingKostManager]);')) {
      dupEnd = j;
      break;
    }
  }
  
  if (dupEnd !== -1) {
    console.log(`Removing duplicate declaration block from line ${dupStart + 1} to ${dupEnd + 1}`);
    lines.splice(dupStart, dupEnd - dupStart + 1);
  }
}

let finalContent = lines.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');

console.log("Duplicate closeKostManagerListing and effects successfully removed.");
