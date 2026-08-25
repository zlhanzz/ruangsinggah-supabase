const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');
const lines = code.split('\n');

// Remove the misplaced )} at line 5464 (0-indexed: 5463)
// The target line is exactly '                        )}'
const targetLine = '                        )}';
let removedCount = 0;

// Find it in the range 5455-5475
for (let i = 5450; i < 5475; i++) {
    if (lines[i] === targetLine) {
        console.log('Removing misplaced )} at line', i + 1);
        lines.splice(i, 1);
        removedCount++;
        break; // Only remove the first occurrence in this range
    }
}

if (removedCount === 0) {
    console.error('Target line not found!');
    process.exit(1);
}

// Now we need to add the closing )} AFTER the entire KostManager content div closes
// Find the end of the large modal div (the one added for the ternary) 
// It should be after the content div closes
// Find where the modal outer div closes: look for the pattern near the end of the file
// The ternary structure: 
//   <div backdrop />
//   {isExistingPropertyMigration && !warningAccepted ? (<div warning card/>) : (<div content> ... </div>)}
//   </div> (outer fixed)
// )}

// Find the ")} at the very end of the modal block
// This is the last )} before closing the isEditingKostManager block
const fileContent = lines.join('\n');

// Look for the end of the KostManager modal
// The outermost modal should end with:
//         </div>     <- outer fixed div
//     )}             <- closes isEditingKostManager &&
// Pattern: the )} that closes isEditingKostManager && is at indent level 16 spaces
// and the last </div> before it at indent level 20 spaces

// Find the ternary closing )} that should be inserted before the last </div></div>)}
// The structure should be:
//   </div> <- closes content div (the bg-[#f8f9ff] one)
//   )}     <- closes ternary {isExistingPropertyMigration ? ... : (...)}
//   </div> <- closes outer fixed div
// )}       <- closes isEditingKostManager &&

// Find the last )}  that closes isEditingKostManager && 
let modalEndIdx = -1;
const linesArr = fileContent.split('\n');
for (let i = linesArr.length - 1; i >= 0; i--) {
    if (linesArr[i].trim() === ')}' && i > 6300) {
        modalEndIdx = i;
        console.log('Found potential modal end at line', i + 1, ':', JSON.stringify(linesArr[i]));
        console.log('Context lines around it:');
        for (let j = Math.max(0, i - 5); j <= Math.min(linesArr.length - 1, i + 3); j++) {
            console.log('L' + (j+1) + ': ' + linesArr[j]);
        }
        break;
    }
}

fs.writeFileSync(targetFile, linesArr.join('\n'), 'utf8');
console.log('Removed misplaced )}. Total lines now:', linesArr.length);
