const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');
let lines = content.split('\n');
console.log(`Original line count: ${lines.length}`);

// 1. Locate start of old modal
let startIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('isEditingKostManager') && lines[i].includes('&&') && i < 1100 && i > 800) {
    startIndex = i;
    break;
  }
}

if (startIndex === -1) {
  console.error("Start index not found!");
  process.exit(1);
}

// 2. Locate end of old modal
let endIndex = -1;
for (let i = startIndex; i < lines.length - 2; i++) {
  if (
    lines[i].trim() === ')}' &&
    lines[i+1].trim() === '</div>' &&
    lines[i+2].includes('text-[9px]')
  ) {
    endIndex = i;
    break;
  }
}

if (endIndex === -1) {
  console.error("End index not found!");
  process.exit(1);
}

console.log(`Removing lines ${startIndex + 1} to ${endIndex + 1}`);

// Remove lines from startIndex to endIndex (inclusive)
const linesBefore = lines.slice(0, startIndex);
const linesAfter = lines.slice(endIndex + 1);

let newContent = [...linesBefore, ...linesAfter].join('\n');
let newLines = newContent.split('\n');
console.log(`Removed old modal. New line count: ${newLines.length}`);

// 3. Find insertion point in the new lines
let insertIndex = -1;
for (let i = newLines.length - 300; i < newLines.length; i++) {
  if (
    newLines[i].includes('                            </form>') && 
    newLines[i+1].includes('                        </div>') && 
    newLines[i+2].includes('                    </div>') && 
    newLines[i+3].trim() === ')}'
  ) {
    insertIndex = i + 4;
    break;
  }
}

if (insertIndex === -1) {
  console.error("Insertion point not found!");
  process.exit(1);
}

console.log(`Insertion point: line ${insertIndex + 1}`);

// 4. Read stepper code
const stepperCode = fs.readFileSync('functions/scratch/extracted_content_0.txt', 'utf8');

// 5. Insert stepper code
const finalLines = [
  ...newLines.slice(0, insertIndex),
  '',
  stepperCode,
  '',
  ...newLines.slice(insertIndex)
];

fs.writeFileSync(targetFile, finalLines.join('\n'), 'utf8');
console.log("Successfully rebuilt!");
