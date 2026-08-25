const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Declare the parser function at the top level
const helperTarget = `const formatThousand = (val: any) => {`;
const helperReplacement = `const parsePaymentPeriod = (period: string) => {
    if (!period) return { amount: 1, unit: 'bulan' };
    const val = period.toLowerCase().trim();
    if (val === 'bulanan') return { amount: 1, unit: 'bulan' };
    if (val === 'tahunan') return { amount: 1, unit: 'tahun' };
    if (val === 'mingguan') return { amount: 1, unit: 'minggu' };
    if (val === 'harian') return { amount: 1, unit: 'hari' };
    if (val === '3bulanan') return { amount: 3, unit: 'bulan' };
    if (val === '6bulanan') return { amount: 6, unit: 'bulan' };
    
    const match = val.match(/^(\\d+)\\s*(hari|minggu|bulan|tahun)s?$/);
    if (match) {
        return { amount: parseInt(match[1]), unit: match[2] };
    }
    return { amount: 1, unit: 'bulan' };
};

const formatThousand = (val: any) => {`;

if (content.includes(helperTarget)) {
  content = content.replace(helperTarget, helperReplacement);
  console.log("parsePaymentPeriod helper function declared at top level.");
} else {
  console.error("CRITICAL: formatThousand helper target not found!");
}

const lines = content.split('\n');

// 2. Replace the first occurrence (temporaryRoom)
const tempIdx = lines.findIndex(l => l.includes("value={temporaryRoom.paymentPeriod || 'bulanan'}"));
if (tempIdx !== -1) {
  console.log(`Found temporaryRoom paymentPeriod select at line ${tempIdx + 1}`);
  // Let's find the start and end of the select block
  let startIdx = tempIdx;
  while (startIdx > 0 && !lines[startIdx].includes('<div className="flex flex-col gap-1">')) {
    startIdx--;
  }
  let endIdx = tempIdx;
  while (endIdx < lines.length && !lines[endIdx].includes('</select>')) {
    endIdx++;
  }
  if (lines[endIdx + 1].includes('</div>')) {
    endIdx++;
  }

  console.log(`Replacing temporaryRoom select block from line ${startIdx + 1} to ${endIdx + 1}`);

  const tempSelectReplacement = `                                                                       <div className="flex flex-col gap-1">
                                                                           <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Jenis Langganan</label>
                                                                           {(() => {
                                                                               const { amount, unit } = parsePaymentPeriod(temporaryRoom.paymentPeriod || 'bulanan');
                                                                               return (
                                                                                   <div className="flex gap-2">
                                                                                       <input 
                                                                                           type="number"
                                                                                           min="1"
                                                                                           value={amount}
                                                                                           onChange={e => {
                                                                                               const val = parseInt(e.target.value) || 1;
                                                                                               setTemporaryRoom({ ...temporaryRoom, paymentPeriod: \`\${val} \${unit}\` });
                                                                                           }}
                                                                                           className="w-20 h-[40px] px-2.5 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                       />
                                                                                       <select 
                                                                                           value={unit}
                                                                                           onChange={e => setTemporaryRoom({ ...temporaryRoom, paymentPeriod: \`\${amount} \${e.target.value}\` })}
                                                                                           className="flex-grow h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                       >
                                                                                           <option value="hari">Hari</option>
                                                                                           <option value="minggu">Minggu</option>
                                                                                           <option value="bulan">Bulan</option>
                                                                                           <option value="tahun">Tahun</option>
                                                                                       </select>
                                                                                   </div>
                                                                               );
                                                                           })()}
                                                                       </div>`;

  lines.splice(startIdx, (endIdx - startIdx + 1), tempSelectReplacement);
} else {
  console.error("CRITICAL: temporaryRoom paymentPeriod select not found!");
}

// 3. Re-split and replace the second occurrence (activeRoomIdx / rt)
const newContent = lines.join('\n');
const newLines = newContent.split('\n');

const activeIdx = newLines.findIndex(l => l.includes("value={rt.paymentPeriod || 'bulanan'}"));
if (activeIdx !== -1) {
  console.log(`Found activeRoomIdx paymentPeriod select at line ${activeIdx + 1}`);
  let startIdx = activeIdx;
  while (startIdx > 0 && !newLines[startIdx].includes('<div className="flex flex-col gap-1">')) {
    startIdx--;
  }
  let endIdx = activeIdx;
  while (endIdx < newLines.length && !newLines[endIdx].includes('</select>')) {
    endIdx++;
  }
  if (newLines[endIdx + 1].includes('</div>')) {
    endIdx++;
  }

  console.log(`Replacing activeRoomIdx select block from line ${startIdx + 1} to ${endIdx + 1}`);

  const activeSelectReplacement = `                                                                           <div className="flex flex-col gap-1">
                                                                               <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Jenis Langganan</label>
                                                                               {(() => {
                                                                                   const { amount, unit } = parsePaymentPeriod(rt.paymentPeriod || 'bulanan');
                                                                                   return (
                                                                                       <div className="flex gap-2">
                                                                                           <input 
                                                                                               type="number"
                                                                                               min="1"
                                                                                               value={amount}
                                                                                               onChange={e => {
                                                                                                   const val = parseInt(e.target.value) || 1;
                                                                                                   const updated = [...kmListingForm.roomTypes];
                                                                                                   updated[activeRoomIdx] = { ...rt, paymentPeriod: \`\${val} \${unit}\` };
                                                                                                   setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                               }}
                                                                                               className="w-20 h-[40px] px-2.5 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                           />
                                                                                           <select 
                                                                                               value={unit}
                                                                                               onChange={e => {
                                                                                                   const updated = [...kmListingForm.roomTypes];
                                                                                                   updated[activeRoomIdx] = { ...rt, paymentPeriod: \`\${amount} \${e.target.value}\` };
                                                                                                   setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                               }}
                                                                                               className="flex-grow h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                           >
                                                                                               <option value="hari">Hari</option>
                                                                                               <option value="minggu">Minggu</option>
                                                                                               <option value="bulan">Bulan</option>
                                                                                               <option value="tahun">Tahun</option>
                                                                                           </select>
                                                                                       </div>
                                                                                   );
                                                                               })()}
                                                                           </div>`;

  newLines.splice(startIdx, (endIdx - startIdx + 1), activeSelectReplacement);
} else {
  console.error("CRITICAL: activeRoomIdx paymentPeriod select not found!");
}

// Convert back to CRLF
let finalContent = newLines.join('\n');
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Flexible payment period selection applied successfully.");
