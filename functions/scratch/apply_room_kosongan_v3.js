const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const lines = code.split(/\r?\n/);
let foundIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const isChecked = temporaryRoom.roomFacilities?.includes(fac);") && lines[i-1].includes("Dapur Dalam")) {
        foundIdx = i;
        break;
    }
}

if (foundIdx !== -1) {
    console.log("Found target3 at line index:", foundIdx);
    
    // We want to replace lines[foundIdx-1] (the map statement) all the way down to lines[foundIdx+12] (the end of onChange)
    // Let's verify what the lines are:
    console.log("Line -1:", lines[foundIdx-1]);
    console.log("Line 0:", lines[foundIdx]);
    console.log("Line 1:", lines[foundIdx+1]);
    console.log("Line 2:", lines[foundIdx+2]);
    console.log("Line 3:", lines[foundIdx+3]);
    console.log("Line 4:", lines[foundIdx+4]);
    console.log("Line 5:", lines[foundIdx+5]);
    console.log("Line 6:", lines[foundIdx+6]);
    console.log("Line 7:", lines[foundIdx+7]);
    console.log("Line 8:", lines[foundIdx+8]);
    console.log("Line 9:", lines[foundIdx+9]);
    console.log("Line 10:", lines[foundIdx+10]);
    console.log("Line 11:", lines[foundIdx+11]);
    console.log("Line 12:", lines[foundIdx+12]);
    console.log("Line 13:", lines[foundIdx+13]);

    // Let's replace lines from foundIdx-1 to foundIdx+13 with the correct new lines!
    const indentation = lines[foundIdx-1].match(/^\s*/)[0];
    const subInd = indentation + "    ";
    const subSubInd = subInd + "    ";
    const subSubSubInd = subSubInd + "    ";
    
    const newLines = [
        `${indentation}{['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Kosongan (Tanpa Perabot)', 'Jendela Luar', 'Kamar Mandi Dalam', 'Dapur Dalam'].map(fac => {`,
        `${subInd}const isChecked = temporaryRoom.roomFacilities?.includes(fac);`,
        `${subInd}return (`,
        `${subSubInd}<label key={fac} className="flex items-center gap-2.5 cursor-pointer">`,
        `${subSubSubInd}<input `,
        `${subSubSubInd}    type="checkbox"`,
        `${subSubSubInd}    checked={isChecked}`,
        `${subSubSubInd}    onChange={() => {`,
        `${subSubSubInd}        const current = temporaryRoom.roomFacilities || [];`,
        `${subSubSubInd}        let updated = [];`,
        `${subSubSubInd}        if (fac === 'Kosongan (Tanpa Perabot)') {`,
        `${subSubSubInd}            const isAlreadyChecked = current.includes(fac);`,
        `${subSubSubInd}            if (isAlreadyChecked) {`,
        `${subSubSubInd}                updated = current.filter((f: string) => f !== fac);`,
        `${subSubSubInd}            } else {`,
        `${subSubSubInd}                updated = current.filter((f: string) => !['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater'].includes(f));`,
        `${subSubSubInd}                updated.push(fac);`,
        `${subSubSubInd}            }`,
        `${subSubSubInd}        } else {`,
        `${subSubSubInd}            const isPerabot = ['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater'].includes(fac);`,
        `${subSubSubInd}            if (current.includes(fac)) {`,
        `${subSubSubInd}                updated = current.filter((f: string) => f !== fac);`,
        `${subSubSubInd}            } else {`,
        `${subSubSubInd}                updated = [...current, fac];`,
        `${subSubSubInd}                if (isPerabot) {`,
        `${subSubSubInd}                    updated = updated.filter((f: string) => f !== 'Kosongan (Tanpa Perabot)');`,
        `${subSubSubInd}                }`,
        `${subSubSubInd}            }`,
        `${subSubSubInd}        }`,
        `${subSubSubInd}        setTemporaryRoom({ ...temporaryRoom, roomFacilities: updated });`,
        `${subSubSubInd}}}`
    ];
    
    // Replace in array
    lines.splice(foundIdx-1, 15, ...newLines);
    
    fs.writeFileSync(targetFile, lines.join('\n'), 'utf8');
    console.log("Successfully replaced Target 3!");
} else {
    console.error("Could not find Target 3 by line search!");
}
