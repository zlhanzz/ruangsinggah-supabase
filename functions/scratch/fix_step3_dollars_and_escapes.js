const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('kmStep === 3 && ('));
const endIdx = lines.findIndex(l => l.includes('Selesaikan & Submit'));

if (startIdx !== -1 && endIdx !== -1) {
  console.log(`Fixing dollars and escapes from line ${startIdx + 1} to ${endIdx + 100}`);
  
  for (let i = startIdx; i < endIdx + 100 && i < lines.length; i++) {
    let line = lines[i];
    
    // Replace JSX dollar signs
    line = line.replace(/\$\{mitraProfile/g, '{mitraProfile');
    line = line.replace(/\$\{activePhotoIdx \+ 1\}/g, '{activePhotoIdx + 1}');
    line = line.replace(/\$\{kmListingForm/g, '{kmListingForm');
    line = line.replace(/\$\{f\}/g, '{f}');
    line = line.replace(/\$\{isTerisi/g, '{isTerisi');
    line = line.replace(/\$\{rt\.name/g, '{rt.name');
    line = line.replace(/\$\{rt\.residentName/g, '{rt.residentName');
    line = line.replace(/\$\{rt\.residentPhone/g, '{rt.residentPhone');
    line = line.replace(/\$\{rt\.paymentPeriod/g, '{rt.paymentPeriod');
    line = line.replace(/\$\{formatThousand/g, '{formatThousand');
    line = line.replace(/\$\{rt\.maxOccupants/g, '{rt.maxOccupants');
    
    // Replace template literal escapes (backslashes)
    line = line.replace(/\\`Kamar \\\${idx \+ 1}\\`/g, '`Kamar ${idx + 1}`');
    line = line.replace(/`Kamar \\\${idx \+ 1}`/g, '`Kamar ${idx + 1}`');
    line = line.replace(/\\\${activePhotoIdx/g, '${activePhotoIdx');
    line = line.replace(/\\\${isTerisi/g, '${isTerisi');
    line = line.replace(/\\\${\(agreedToTerms/g, '${(agreedToTerms');
    
    lines[i] = line;
  }
  
  content = lines.join('\n');
  console.log("Successfully fixed JSX dollar signs and template literal backslashes in Step 3.");
} else {
  console.error("CRITICAL: Step 3 start or end index not found!", { startIdx, endIdx });
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
