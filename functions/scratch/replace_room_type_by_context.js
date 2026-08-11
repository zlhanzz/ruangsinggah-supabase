const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

let replacedTemp = false;
let replacedActive = false;

for (let i = 0; i < lines.length; i++) {
  // Find temporaryRoom select block
  if (!replacedTemp && lines[i].includes('label') && lines[i].includes('Tipe Kamar') && lines[i+1] && lines[i+1].includes('select')) {
    // Check if the next 3 lines contain temporaryRoom.type
    let isTemp = false;
    for (let k = i + 1; k < i + 5; k++) {
      if (lines[k] && lines[k].includes('temporaryRoom.type')) {
        isTemp = true;
        break;
      }
    }
    if (isTemp) {
      console.log("Found temporaryRoom Tipe Kamar block around line " + (i+1));
      let endSelectIdx = -1;
      for (let j = i + 1; j < i + 15; j++) {
        if (lines[j].includes('</select>')) {
          endSelectIdx = j;
          break;
        }
      }
      if (endSelectIdx !== -1) {
        const indent = lines[i].match(/^\s*/)[0];
        const newSelectBlock = `${indent}<select 
${indent}    value={['Standard', 'Premium', 'Deluxe', ''].includes(temporaryRoom.type || '') ? (temporaryRoom.type || '') : '__custom__'}
${indent}    onChange={e => {
${indent}        const val = e.target.value;
${indent}        if (val === '__custom__') {
${indent}            setTemporaryRoom({ ...temporaryRoom, type: 'Kustom' });
${indent}        } else {
${indent}            setTemporaryRoom({ ...temporaryRoom, type: val });
${indent}        }
${indent}    }}
${indent}    className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
${indent}>
${indent}    <option value="" disabled hidden>Pilih Tipe Kamar</option>
${indent}    <option value="Standard">Standard</option>
${indent}    <option value="Premium">Premium</option>
${indent}    <option value="Deluxe">Deluxe</option>
${indent}    <option value="__custom__">Tipe Kustom...</option>
${indent}</select>
${indent}{!['Standard', 'Premium', 'Deluxe', ''].includes(temporaryRoom.type || '') && (
${indent}    <div className="mt-1.5">
${indent}        <input 
${indent}            type="text"
${indent}            value={temporaryRoom.type === 'Kustom' ? '' : temporaryRoom.type}
${indent}            onChange={e => setTemporaryRoom({ ...temporaryRoom, type: e.target.value })}
${indent}            placeholder="Masukkan tipe kamar kustom..."
${indent}            className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
${indent}        />
${indent}    </div>
${indent})}`;

        lines.splice(i + 1, (endSelectIdx - i), newSelectBlock);
        replacedTemp = true;
        console.log("Successfully replaced temporaryRoom Tipe Kamar block.");
      }
    }
  }
}

// Re-split content to get updated line indexes
content = lines.join('\n');
const lines2 = content.split('\n');

for (let i = 0; i < lines2.length; i++) {
  // Find activeRoomIdx select block
  if (!replacedActive && lines2[i].includes('label') && lines2[i].includes('Tipe Kamar') && lines2[i+1] && lines2[i+1].includes('select')) {
    // Check if the next 3 lines contain rt.type
    let isActive = false;
    for (let k = i + 1; k < i + 5; k++) {
      if (lines2[k] && lines2[k].includes('rt.type')) {
        isActive = true;
        break;
      }
    }
    if (isActive) {
      console.log("Found activeRoomIdx Tipe Kamar block around line " + (i+1));
      let endSelectIdx = -1;
      for (let j = i + 1; j < i + 15; j++) {
        if (lines2[j].includes('</select>')) {
          endSelectIdx = j;
          break;
        }
      }
      if (endSelectIdx !== -1) {
        const indent = lines2[i].match(/^\s*/)[0];
        const newSelectBlock = `${indent}<select 
${indent}    value={['Standard', 'Premium', 'Deluxe', ''].includes(rt.type || '') ? (rt.type || '') : '__custom__'}
${indent}    onChange={e => {
${indent}        const val = e.target.value;
${indent}        const updated = [...kmListingForm.roomTypes];
${indent}        if (val === '__custom__') {
${indent}            updated[activeRoomIdx] = { ...rt, type: 'Kustom' };
${indent}        } else {
${indent}            updated[activeRoomIdx] = { ...rt, type: val };
${indent}        }
${indent}        setKmListingForm({ ...kmListingForm, roomTypes: updated });
${indent}    }}
${indent}    className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
${indent}>
${indent}    <option value="" disabled hidden>Pilih Tipe Kamar</option>
${indent}    <option value="Standard">Standard</option>
${indent}    <option value="Premium">Premium</option>
${indent}    <option value="Deluxe">Deluxe</option>
${indent}    <option value="__custom__">Tipe Kustom...</option>
${indent}</select>
${indent}{!['Standard', 'Premium', 'Deluxe', ''].includes(rt.type || '') && (
${indent}    <div className="mt-1.5">
${indent}        <input 
${indent}            type="text"
${indent}            value={rt.type === 'Kustom' ? '' : rt.type}
${indent}            onChange={e => {
${indent}                const updated = [...kmListingForm.roomTypes];
${indent}                updated[activeRoomIdx] = { ...rt, type: e.target.value };
${indent}                setKmListingForm({ ...kmListingForm, roomTypes: updated });
${indent}            }}
${indent}            placeholder="Masukkan tipe kamar kustom..."
${indent}            className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
${indent}        />
${indent}    </div>
${indent})}`;

        lines2.splice(i + 1, (endSelectIdx - i), newSelectBlock);
        replacedActive = true;
        console.log("Successfully replaced activeRoomIdx Tipe Kamar block.");
        break;
      }
    }
  }
}

let finalContent = lines2.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Finished rewriting.");
