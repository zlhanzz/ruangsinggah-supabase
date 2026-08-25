const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const lines = code.split(/\r?\n/);
let foundRtIdx = -1;
let foundTempIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(".map(fac => {") && lines[i].includes("Kasur") && lines[i].includes("Kamar Mandi Dalam")) {
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

console.log("=== TEMPORARY ROOM MATCH ===");
if (foundTempIdx !== -1) {
    console.log("Index:", foundTempIdx);
    for (let k = 0; k < 25; k++) {
        console.log(`${foundTempIdx + k}: ${lines[foundTempIdx + k]}`);
    }
} else {
    console.log("Not found temp");
}

console.log("=== RT MATCH ===");
if (foundRtIdx !== -1) {
    console.log("Index:", foundRtIdx);
    for (let k = 0; k < 25; k++) {
        console.log(`${foundRtIdx + k}: ${lines[foundRtIdx + k]}`);
    }
} else {
    console.log("Not found rt");
}
