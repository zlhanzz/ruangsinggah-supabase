const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const lines = code.split(/\r?\n/);
let foundRtIdx = -1;
let foundTempIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("map(fac") && lines[i].includes("rt.roomFacilities?.includes(fac)")) {
        foundRtIdx = i;
    }
    if (lines[i].includes("map(fac") && lines[i].includes("temporaryRoom.roomFacilities?.includes(fac)")) {
        foundTempIdx = i;
    }
}

// If they weren't found by the exact match above, search by line content
if (foundRtIdx === -1 || foundTempIdx === -1) {
    foundRtIdx = -1;
    foundTempIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(".map(fac => {") && lines[i].includes("Kasur") && lines[i].includes("Kamar Mandi Dalam")) {
            // Look ahead 5 lines for context
            let isRt = false;
            let isTemp = false;
            for (let j = 1; j <= 5; j++) {
                if (lines[i+j] && lines[i+j].includes("rt.roomFacilities")) {
                    isRt = true;
                }
                if (lines[i+j] && lines[i+j].includes("temporaryRoom.roomFacilities")) {
                    isTemp = true;
                }
            }
            if (isRt) foundRtIdx = i;
            if (isTemp) foundTempIdx = i;
        }
    }
}

if (foundTempIdx !== -1) {
    console.log("Found temporaryRoom block at line index:", foundTempIdx);
    const indentation = lines[foundTempIdx].match(/^\s*/)[0];
    const subInd = indentation + "    ";
    const subSubInd = subInd + "    ";
    const subSubSubInd = subSubInd + "    ";

    const newTempBlock = [
        `${indentation}{(() => {`,
        `${subInd}const current = temporaryRoom.roomFacilities || [];`,
        `${subInd}const isKosongan = current.includes('Kosongan (Tanpa Perabot)');`,
        `${subInd}return (`,
        `${subSubInd}<div className="flex bg-gray-100 p-1 rounded-xl gap-1 mb-3.5 border border-gray-200/80">`,
        `${subSubSubInd}<button`,
        `${subSubSubInd}    type="button"`,
        `${subSubSubInd}    onClick={() => {`,
        `${subSubSubInd}        const cleared = current.filter((f: string) => !['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater'].includes(f));`,
        `${subSubSubInd}        if (!cleared.includes('Kosongan (Tanpa Perabot)')) {`,
        `${subSubSubInd}            cleared.push('Kosongan (Tanpa Perabot)');`,
        `${subSubSubInd}        }`,
        `${subSubSubInd}        setTemporaryRoom({ ...temporaryRoom, roomFacilities: cleared });`,
        `${subSubSubInd}    }}`,
        `${subSubSubInd}    className={\`flex-1 py-2 rounded-lg text-[10px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${isKosongan ? 'bg-[#ff7a00] text-white shadow-sm scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}\`}`,
        `${subSubSubInd}>`,
        `${subSubSubInd}    <span className="material-symbols-outlined text-sm">block</span>`,
        `${subSubSubInd}    Kosongan (Tanpa Perabot)`,
        `${subSubSubInd}</button>`,
        `${subSubSubInd}<button`,
        `${subSubSubInd}    type="button"`,
        `${subSubSubInd}    onClick={() => {`,
        `${subSubSubInd}        const cleared = current.filter((f: string) => f !== 'Kosongan (Tanpa Perabot)');`,
        `${subSubSubInd}        setTemporaryRoom({ ...temporaryRoom, roomFacilities: cleared });`,
        `${subSubSubInd}    }}`,
        `${subSubSubInd}    className={\`flex-1 py-2 rounded-lg text-[10px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${!isKosongan ? 'bg-[#ff7a00] text-white shadow-sm scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}\`}`,
        `${subSubSubInd}>`,
        `${subSubSubInd}    <span className="material-symbols-outlined text-sm">check_circle</span>`,
        `${subSubSubInd}    Furnished (Isian)`,
        `${subSubSubInd}</button>`,
        `${subSubInd}</div>`,
        `${subInd});`,
        `${indentation}})()}`,
        ``,
        `${indentation}<div className="grid grid-cols-2 gap-y-3.5 gap-x-2">`,
        `${subInd}{['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Jendela Luar', 'Kamar Mandi Dalam', 'Dapur Dalam'].map(fac => {`,
        `${subSubInd}const isChecked = temporaryRoom.roomFacilities?.includes(fac);`,
        `${subSubInd}const isPerabot = ['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater'].includes(fac);`,
        `${subSubInd}const isKosongan = temporaryRoom.roomFacilities?.includes('Kosongan (Tanpa Perabot)');`,
        `${subSubInd}const isDisabled = isPerabot && isKosongan;`,
        `${subSubInd}return (`,
        `${subSubSubInd}<label key={fac} className={\`flex items-center gap-2.5 cursor-pointer transition-all \${isDisabled ? 'opacity-40 pointer-events-none' : ''}\`}>`,
        `${subSubSubInd}    <input `,
        `${subSubSubInd}        type="checkbox"`,
        `${subSubSubInd}        checked={isChecked && !isDisabled}`,
        `${subSubSubInd}        disabled={isDisabled}`,
        `${subSubSubInd}        onChange={() => {`,
        `${subSubSubInd}            const current = temporaryRoom.roomFacilities || [];`,
        `${subSubSubInd}            const updated = current.includes(fac)`,
        `${subSubSubInd}                ? current.filter((f: string) => f !== fac)`,
        `${subSubSubInd}                : [...current, fac];`,
        `${subSubSubInd}            setTemporaryRoom({ ...temporaryRoom, roomFacilities: updated });`,
        `${subSubSubInd}        }}`,
        `${subSubSubInd}        className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-5 h-5"`,
        `${subSubSubInd}    />`,
        `${subSubSubInd}    <span className="text-xs text-gray-700 uppercase tracking-wider font-semibold">{fac}</span>`,
        `${subSubSubInd}</label>`,
        `${subSubInd});`,
        `${subInd})}`
    ];

    // Find the end of the original loop (it should end at lines[foundTempIdx+19] or similar closing label/map)
    console.log("Replacing Temp lines from", foundTempIdx, "to", foundTempIdx + 19);
    lines.splice(foundTempIdx, 20, ...newTempBlock);
} else {
    console.error("ERROR: temporaryRoom block not found!");
}

// Recalculate foundRtIdx since lines were added to temp block
const codeIntermediate = lines.join('\n');
const lines2 = codeIntermediate.split(/\r?\n/);

foundRtIdx = -1;
for (let i = 0; i < lines2.length; i++) {
    if (lines2[i].includes(".map(fac => {") && lines2[i].includes("Kasur") && lines2[i].includes("Kamar Mandi Dalam")) {
        let isRt = false;
        for (let j = 1; j <= 5; j++) {
            if (lines2[i+j] && lines2[i+j].includes("rt.roomFacilities")) {
                isRt = true;
            }
        }
        if (isRt) {
            foundRtIdx = i;
            break;
        }
    }
}

if (foundRtIdx !== -1) {
    console.log("Found rt block at line index:", foundRtIdx);
    const indentation = lines2[foundRtIdx].match(/^\s*/)[0];
    const subInd = indentation + "    ";
    const subSubInd = subInd + "    ";
    const subSubSubInd = subSubInd + "    ";

    const newRtBlock = [
        `${indentation}{(() => {`,
        `${subInd}const current = rt.roomFacilities || [];`,
        `${subInd}const isKosongan = current.includes('Kosongan (Tanpa Perabot)');`,
        `${subInd}return (`,
        `${subSubInd}<div className="flex bg-gray-100 p-1 rounded-xl gap-1 mb-3.5 border border-gray-200/80">`,
        `${subSubSubInd}<button`,
        `${subSubSubInd}    type="button"`,
        `${subSubSubInd}    onClick={() => {`,
        `${subSubSubInd}        const cleared = current.filter((f: string) => !['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater'].includes(f));`,
        `${subSubSubInd}        if (!cleared.includes('Kosongan (Tanpa Perabot)')) {`,
        `${subSubSubInd}            cleared.push('Kosongan (Tanpa Perabot)');`,
        `${subSubSubInd}        }`,
        `${subSubSubInd}        const updatedRoomTypes = [...kmListingForm.roomTypes];`,
        `${subSubSubInd}        updatedRoomTypes[activeRoomIdx] = { ...rt, roomFacilities: cleared };`,
        `${subSubSubInd}        setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });`,
        `${subSubSubInd}    }}`,
        `${subSubSubInd}    className={\`flex-1 py-2 rounded-lg text-[10px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${isKosongan ? 'bg-[#ff7a00] text-white shadow-sm scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}\`}`,
        `${subSubSubInd}>`,
        `${subSubSubInd}    <span className="material-symbols-outlined text-sm">block</span>`,
        `${subSubSubInd}    Kosongan (Tanpa Perabot)`,
        `${subSubSubInd}</button>`,
        `${subSubSubInd}<button`,
        `${subSubSubInd}    type="button"`,
        `${subSubSubInd}    onClick={() => {`,
        `${subSubSubInd}        const cleared = current.filter((f: string) => f !== 'Kosongan (Tanpa Perabot)');`,
        `${subSubSubInd}        const updatedRoomTypes = [...kmListingForm.roomTypes];`,
        `${subSubSubInd}        updatedRoomTypes[activeRoomIdx] = { ...rt, roomFacilities: cleared };`,
        `${subSubSubInd}        setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });`,
        `${subSubSubInd}    }}`,
        `${subSubSubInd}    className={\`flex-1 py-2 rounded-lg text-[10px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 \${!isKosongan ? 'bg-[#ff7a00] text-white shadow-sm scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}\`}`,
        `${subSubSubInd}>`,
        `${subSubSubInd}    <span className="material-symbols-outlined text-sm">check_circle</span>`,
        `${subSubSubInd}    Furnished (Isian)`,
        `${subSubSubInd}</button>`,
        `${subSubInd}</div>`,
        `${subInd});`,
        `${indentation}})()}`,
        ``,
        `${indentation}<div className="grid grid-cols-2 gap-y-3.5 gap-x-2">`,
        `${subInd}{['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Jendela Luar', 'Kamar Mandi Dalam', 'Dapur Dalam'].map(fac => {`,
        `${subSubInd}const isChecked = rt.roomFacilities?.includes(fac);`,
        `${subSubInd}const isPerabot = ['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater'].includes(fac);`,
        `${subSubInd}const isKosongan = rt.roomFacilities?.includes('Kosongan (Tanpa Perabot)');`,
        `${subSubInd}const isDisabled = isPerabot && isKosongan;`,
        `${subSubInd}return (`,
        `${subSubSubInd}<label key={fac} className={\`flex items-center gap-2.5 cursor-pointer transition-all \${isDisabled ? 'opacity-40 pointer-events-none' : ''}\`}>`,
        `${subSubSubInd}    <input `,
        `${subSubSubInd}        type="checkbox"`,
        `${subSubSubInd}        checked={isChecked && !isDisabled}`,
        `${subSubSubInd}        disabled={isDisabled}`,
        `${subSubSubInd}        onChange={() => {`,
        `${subSubSubInd}            const current = rt.roomFacilities || [];`,
        `${subSubSubInd}            const updated = current.includes(fac)`,
        `${subSubSubInd}                ? current.filter((f: string) => f !== fac)`,
        `${subSubSubInd}                : [...current, fac];`,
        `${subSubSubInd}            const updatedRoomTypes = [...kmListingForm.roomTypes];`,
        `${subSubSubInd}            updatedRoomTypes[activeRoomIdx] = { ...rt, roomFacilities: updated };`,
        `${subSubSubInd}            setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });`,
        `${subSubSubInd}        }}`,
        `${subSubSubInd}        className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-5 h-5"`,
        `${subSubSubInd}    />`,
        `${subSubSubInd}    <span className="text-xs text-gray-700 uppercase tracking-wider font-semibold">{fac}</span>`,
        `${subSubSubInd}</label>`,
        `${subSubInd});`,
        `${subInd})}`
    ];

    console.log("Replacing Rt lines from", foundRtIdx, "to", foundRtIdx + 21);
    lines2.splice(foundRtIdx, 22, ...newRtBlock);
} else {
    console.error("ERROR: rt block not found!");
}

// Apply updates to customs filters
const codeFinal = lines2.join('\n');
const lines3 = codeFinal.split(/\r?\n/);
let patchCustomsCount = 0;

for (let i = 0; i < lines3.length; i++) {
    if (lines3[i].includes("const customs =") && lines3[i].includes("roomFacilities?.filter") && lines3[i].includes("Water Heater")) {
        const lineVal = lines3[i];
        const updatedLine = lineVal.replace(
            "!['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Kamar Mandi Dalam', 'Water Heater', 'Jendela Luar']",
            "!['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Kamar Mandi Dalam', 'Water Heater', 'Kosongan (Tanpa Perabot)', 'Jendela Luar', 'Dapur Dalam']"
        );
        lines3[i] = updatedLine;
        patchCustomsCount++;
    }
}
console.log(`Updated ${patchCustomsCount} customs filter lines.`);

fs.writeFileSync(targetFile, lines3.join('\n'), 'utf8');
console.log("AgentDashboard.tsx premium segmented Kosongan switcher changes successfully written.");
