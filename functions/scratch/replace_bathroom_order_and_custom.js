const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Declare state for custom bathroom facility text input at the top
const stateTarget = `    const [customRoomFacilityInput, setCustomRoomFacilityInput] = useState('');`;
const stateReplacement = `    const [customRoomFacilityInput, setCustomRoomFacilityInput] = useState('');
    const [customBathroomFacilityInput, setCustomBathroomFacilityInput] = useState('');`;

content = content.replace(stateTarget, stateReplacement);

// 2. Define the new Fasilitas Kamar blocks for temporaryRoom and activeRoomIdx
const newTempFacJsx = `                                                     {/* Fasilitas Kamar */}
                                                     <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                         <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Fasilitas Kamar</span>
                                                         
                                                         {/* Standard checklist (Kamar Mandi Dalam at the end) */}
                                                         <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
                                                             {['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Jendela Luar', 'Kamar Mandi Dalam'].map(fac => {
                                                                 const isChecked = temporaryRoom.roomFacilities?.includes(fac);
                                                                 return (
                                                                     <label key={fac} className="flex items-center gap-2.5 cursor-pointer">
                                                                         <input 
                                                                             type="checkbox"
                                                                             checked={isChecked}
                                                                             onChange={() => {
                                                                                 const current = temporaryRoom.roomFacilities || [];
                                                                                 const updated = current.includes(fac)
                                                                                     ? current.filter((f: string) => f !== fac)
                                                                                     : [...current, fac];
                                                                                 setTemporaryRoom({ ...temporaryRoom, roomFacilities: updated });
                                                                             }}
                                                                             className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-5 h-5"
                                                                         />
                                                                         <span className="text-xs text-gray-700 uppercase tracking-wider font-semibold">{fac}</span>
                                                                     </label>
                                                                 );
                                                             })}

                                                             {/* Nested bathroom facilities if Kamar Mandi Dalam is checked */}
                                                             {temporaryRoom.roomFacilities?.includes('Kamar Mandi Dalam') && (
                                                                 <div className="col-span-2 pl-6 mt-1.5 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-orange-50/30 p-3 rounded-xl">
                                                                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-0.5">Kelengkapan Kamar Mandi Dalam:</span>
                                                                     <div className="grid grid-cols-2 gap-2.5">
                                                                         {['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Wastafel'].map(bfac => {
                                                                             const isBChecked = temporaryRoom.bathroomFacilities?.includes(bfac);
                                                                             return (
                                                                                 <label key={bfac} className="flex items-center gap-2 cursor-pointer">
                                                                                     <input 
                                                                                         type="checkbox"
                                                                                         checked={isBChecked}
                                                                                         onChange={() => {
                                                                                             const current = temporaryRoom.bathroomFacilities || [];
                                                                                             const updated = current.includes(bfac)
                                                                                                 ? current.filter((f: string) => f !== bfac)
                                                                                                 : [...current, bfac];
                                                                                             setTemporaryRoom({ ...temporaryRoom, bathroomFacilities: updated });
                                                                                         }}
                                                                                         className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5"
                                                                                     />
                                                                                     <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">{bfac}</span>
                                                                                 </label>
                                                                             );
                                                                         })}

                                                                         {/* Custom bathroom tags */}
                                                                         {(() => {
                                                                             const bCustoms = temporaryRoom.bathroomFacilities?.filter((f: string) => !['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Wastafel'].includes(f)) || [];
                                                                             if (bCustoms.length === 0) return null;
                                                                             return (
                                                                                 <div className="col-span-2 flex flex-wrap gap-1 mt-1 border-t border-orange-100 pt-2">
                                                                                     {bCustoms.map((fac) => (
                                                                                         <span key={fac} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-[#ff7a00] text-[9px] font-black rounded uppercase tracking-wider">
                                                                                             {fac}
                                                                                             <button 
                                                                                                 type="button" 
                                                                                                 onClick={() => {
                                                                                                     const current = temporaryRoom.bathroomFacilities || [];
                                                                                                     setTemporaryRoom({ ...temporaryRoom, bathroomFacilities: current.filter((f) => f !== fac) });
                                                                                                 }}
                                                                                                 className="hover:text-orange-700 text-xs font-bold leading-none p-0.5"
                                                                                             >
                                                                                                 &times;
                                                                                             </button>
                                                                                         </span>
                                                                                     ))}
                                                                                 </div>
                                                                             );
                                                                         })()}

                                                                         {/* Custom bathroom facility input adder */}
                                                                         <div className="col-span-2 flex gap-1.5 mt-1 border-t border-orange-100 pt-2">
                                                                             <input 
                                                                                 type="text" 
                                                                                 value={customBathroomFacilityInput} 
                                                                                 onChange={e => setCustomBathroomFacilityInput(e.target.value)} 
                                                                                 placeholder="Tambah kelengkapan WC..." 
                                                                                 className="flex-grow h-[28px] px-2 border border-[#e0c0af] rounded text-[11px] bg-white outline-none text-[#584235] font-bold"
                                                                             />
                                                                             <button 
                                                                                 type="button"
                                                                                 onClick={() => {
                                                                                     if (!customBathroomFacilityInput.trim()) return;
                                                                                     const current = temporaryRoom.bathroomFacilities || [];
                                                                                     if (!current.includes(customBathroomFacilityInput.trim())) {
                                                                                         setTemporaryRoom({ ...temporaryRoom, bathroomFacilities: [...current, customBathroomFacilityInput.trim()] });
                                                                                     }
                                                                                     setCustomBathroomFacilityInput('');
                                                                                 }}
                                                                                 className="h-[28px] px-3 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-[10px] uppercase rounded flex items-center justify-center transition-colors shadow-sm"
                                                                             >
                                                                                 +
                                                                             </button>
                                                                         </div>
                                                                     </div>
                                                                 </div>
                                                             )}
                                                         </div>

                                                         {/* Removable Custom Badges */}
                                                         {(() => {
                                                             const customs = temporaryRoom.roomFacilities?.filter((f) => !['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Kamar Mandi Dalam', 'Water Heater', 'Jendela Luar'].includes(f)) || [];
                                                             if (customs.length === 0) return null;
                                                             return (
                                                                 <div className="flex flex-wrap gap-1.5 mt-1 border-t border-gray-100 pt-3">
                                                                     {customs.map((fac) => (
                                                                         <span key={fac} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-[#ff7a00] text-[10px] font-black rounded-lg border border-orange-100 uppercase tracking-wider">
                                                                             {fac}
                                                                             <button 
                                                                                 type="button" 
                                                                                 onClick={() => {
                                                                                     const current = temporaryRoom.roomFacilities || [];
                                                                                     setTemporaryRoom({ ...temporaryRoom, roomFacilities: current.filter((f) => f !== fac) });
                                                                                 }}
                                                                                 className="hover:text-orange-700 text-xs font-bold leading-none p-0.5"
                                                                             >
                                                                                 &times;
                                                                             </button>
                                                                         </span>
                                                                     ))}
                                                                 </div>
                                                             );
                                                         })()}

                                                         {/* Custom Facility Adder Input */}
                                                         <div className="flex gap-2 mt-1 border-t border-gray-100 pt-3">
                                                             <input 
                                                                 type="text" 
                                                                 value={customRoomFacilityInput} 
                                                                 onChange={e => setCustomRoomFacilityInput(e.target.value)} 
                                                                 placeholder="Tambah fasilitas kustom..." 
                                                                 className="flex-grow h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white outline-none text-[#584235] font-bold"
                                                             />
                                                             <button 
                                                                 type="button"
                                                                 onClick={() => {
                                                                     if (!customRoomFacilityInput.trim()) return;
                                                                     const current = temporaryRoom.roomFacilities || [];
                                                                     if (!current.includes(customRoomFacilityInput.trim())) {
                                                                         setTemporaryRoom({ ...temporaryRoom, roomFacilities: [...current, customRoomFacilityInput.trim()] });
                                                                     }
                                                                     setCustomRoomFacilityInput('');
                                                                 }}
                                                                 className="h-[36px] px-4 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center transition-colors shadow-sm"
                                                             >
                                                                 Tambah
                                                             </button>
                                                         </div>
                                                     </div>`;

const newActiveFacJsx = `                                                     {/* Fasilitas Kamar */}
                                                     <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                         <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Fasilitas Kamar</span>
                                                         
                                                         {/* Standard checklist (Kamar Mandi Dalam at the end) */}
                                                         <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
                                                             {['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Jendela Luar', 'Kamar Mandi Dalam'].map(fac => {
                                                                 const isChecked = rt.roomFacilities?.includes(fac);
                                                                 return (
                                                                     <label key={fac} className="flex items-center gap-2.5 cursor-pointer">
                                                                         <input 
                                                                             type="checkbox"
                                                                             checked={isChecked}
                                                                             onChange={() => {
                                                                                 const current = rt.roomFacilities || [];
                                                                                 const updated = current.includes(fac)
                                                                                     ? current.filter((f: string) => f !== fac)
                                                                                     : [...current, fac];
                                                                                 const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                 updatedRoomTypes[activeRoomIdx] = { ...rt, roomFacilities: updated };
                                                                                 setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                             }}
                                                                             className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-5 h-5"
                                                                         />
                                                                         <span className="text-xs text-gray-700 uppercase tracking-wider font-semibold">{fac}</span>
                                                                     </label>
                                                                 );
                                                             })}

                                                             {/* Nested bathroom facilities if Kamar Mandi Dalam is checked */}
                                                             {rt.roomFacilities?.includes('Kamar Mandi Dalam') && (
                                                                 <div className="col-span-2 pl-6 mt-1.5 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-orange-50/30 p-3 rounded-xl">
                                                                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-0.5">Kelengkapan Kamar Mandi Dalam:</span>
                                                                     <div className="grid grid-cols-2 gap-2.5">
                                                                         {['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Wastafel'].map(bfac => {
                                                                             const isBChecked = rt.bathroomFacilities?.includes(bfac);
                                                                             return (
                                                                                 <label key={bfac} className="flex items-center gap-2 cursor-pointer">
                                                                                     <input 
                                                                                         type="checkbox"
                                                                                         checked={isBChecked}
                                                                                         onChange={() => {
                                                                                             const current = rt.bathroomFacilities || [];
                                                                                             const updated = current.includes(bfac)
                                                                                                 ? current.filter((f: string) => f !== bfac)
                                                                                                 : [...current, bfac];
                                                                                             const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                             updatedRoomTypes[activeRoomIdx] = { ...rt, bathroomFacilities: updated };
                                                                                             setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                         }}
                                                                                         className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5"
                                                                                     />
                                                                                     <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">{bfac}</span>
                                                                                 </label>
                                                                             );
                                                                         })}

                                                                         {/* Custom bathroom tags */}
                                                                         {(() => {
                                                                             const bCustoms = rt.bathroomFacilities?.filter((f: string) => !['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Wastafel'].includes(f)) || [];
                                                                             if (bCustoms.length === 0) return null;
                                                                             return (
                                                                                 <div className="col-span-2 flex flex-wrap gap-1 mt-1 border-t border-orange-100 pt-2">
                                                                                     {bCustoms.map((fac) => (
                                                                                         <span key={fac} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-[#ff7a00] text-[9px] font-black rounded uppercase tracking-wider">
                                                                                             {fac}
                                                                                             <button 
                                                                                                 type="button" 
                                                                                                 onClick={() => {
                                                                                                     const current = rt.bathroomFacilities || [];
                                                                                                     const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                                     updatedRoomTypes[activeRoomIdx] = { ...rt, bathroomFacilities: current.filter((f) => f !== fac) };
                                                                                                     setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                                 }}
                                                                                                 className="hover:text-orange-700 text-xs font-bold leading-none p-0.5"
                                                                                             >
                                                                                                 &times;
                                                                                             </button>
                                                                                         </span>
                                                                                     ))}
                                                                                 </div>
                                                                             );
                                                                         })()}

                                                                         {/* Custom bathroom facility input adder */}
                                                                         <div className="col-span-2 flex gap-1.5 mt-1 border-t border-orange-100 pt-2">
                                                                             <input 
                                                                                 type="text" 
                                                                                 value={customBathroomFacilityInput} 
                                                                                 onChange={e => setCustomBathroomFacilityInput(e.target.value)} 
                                                                                 placeholder="Tambah kelengkapan WC..." 
                                                                                 className="flex-grow h-[28px] px-2 border border-[#e0c0af] rounded text-[11px] bg-white outline-none text-[#584235] font-bold"
                                                                             />
                                                                             <button 
                                                                                 type="button"
                                                                                 onClick={() => {
                                                                                     if (!customBathroomFacilityInput.trim()) return;
                                                                                     const current = rt.bathroomFacilities || [];
                                                                                     if (!current.includes(customBathroomFacilityInput.trim())) {
                                                                                         const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                         updatedRoomTypes[activeRoomIdx] = { ...rt, bathroomFacilities: [...current, customBathroomFacilityInput.trim()] };
                                                                                         setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                     }
                                                                                     setCustomBathroomFacilityInput('');
                                                                                 }}
                                                                                 className="h-[28px] px-3 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-[10px] uppercase rounded flex items-center justify-center transition-colors shadow-sm"
                                                                             >
                                                                                 +
                                                                             </button>
                                                                         </div>
                                                                     </div>
                                                                 </div>
                                                             )}
                                                         </div>

                                                         {/* Removable Custom Badges */}
                                                         {(() => {
                                                             const customs = rt.roomFacilities?.filter((f) => !['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Kamar Mandi Dalam', 'Water Heater', 'Jendela Luar'].includes(f)) || [];
                                                             if (customs.length === 0) return null;
                                                             return (
                                                                 <div className="flex flex-wrap gap-1.5 mt-1 border-t border-gray-100 pt-3">
                                                                     {customs.map((fac) => (
                                                                         <span key={fac} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-[#ff7a00] text-[10px] font-black rounded-lg border border-orange-100 uppercase tracking-wider">
                                                                             {fac}
                                                                             <button 
                                                                                 type="button" 
                                                                                 onClick={() => {
                                                                                     const current = rt.roomFacilities || [];
                                                                                     const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                     updatedRoomTypes[activeRoomIdx] = { ...rt, roomFacilities: current.filter((f) => f !== fac) };
                                                                                     setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                 }}
                                                                                 className="hover:text-orange-700 text-xs font-bold leading-none p-0.5"
                                                                             >
                                                                                 &times;
                                                                             </button>
                                                                         </span>
                                                                     ))}
                                                                 </div>
                                                             );
                                                         })()}

                                                         {/* Custom Facility Adder Input */}
                                                         <div className="flex gap-2 mt-1 border-t border-gray-100 pt-3">
                                                             <input 
                                                                 type="text" 
                                                                 value={customRoomFacilityInput} 
                                                                 onChange={e => setCustomRoomFacilityInput(e.target.value)} 
                                                                 placeholder="Tambah fasilitas kustom..." 
                                                                 className="flex-grow h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white outline-none text-[#584235] font-bold"
                                                             />
                                                             <button 
                                                                 type="button"
                                                                 onClick={() => {
                                                                     if (!customRoomFacilityInput.trim()) return;
                                                                     const current = rt.roomFacilities || [];
                                                                     if (!current.includes(customRoomFacilityInput.trim())) {
                                                                         const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                         updatedRoomTypes[activeRoomIdx] = { ...rt, roomFacilities: [...current, customRoomFacilityInput.trim()] };
                                                                         setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                     }
                                                                     setCustomRoomFacilityInput('');
                                                                 }}
                                                                 className="h-[36px] px-4 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center transition-colors shadow-sm"
                                                             >
                                                                 Tambah
                                                             </button>
                                                         </div>
                                                     </div>`;

// Replace Fasilitas Kamar blocks in content
const linesLines = content.split('\n');
let replacedTemp = false;
let replacedActive = false;

for (let i = 0; i < linesLines.length; i++) {
  if (!replacedTemp && linesLines[i].includes('Fasilitas Kamar') && linesLines[i].includes('span') && linesLines[i-1] && linesLines[i-1].includes('border-gray-150') && i < 3650) {
    let closingDivIdx = -1;
    let divCount = 0;
    for (let j = i - 1; j < i + 150; j++) {
      const line = linesLines[j];
      const hasOpen = line.includes('<div') && !line.includes('</div');
      const hasClose = line.includes('</div');
      if (hasOpen) divCount++;
      if (hasClose) divCount--;
      if (divCount === 0 && j > i) {
        closingDivIdx = j;
        break;
      }
    }
    if (closingDivIdx !== -1) {
      console.log(`Replacing temporaryRoom facilities block (lines ${i} to ${closingDivIdx+1})`);
      linesLines.splice(i - 1, closingDivIdx - i + 2, newTempFacJsx);
      replacedTemp = true;
    }
  }
}

// Re-split
let midContent = linesLines.join('\n');
const linesLines2 = midContent.split('\n');

for (let i = 0; i < linesLines2.length; i++) {
  if (!replacedActive && linesLines2[i].includes('Fasilitas Kamar') && linesLines2[i].includes('span') && linesLines2[i-1] && linesLines2[i-1].includes('border-gray-150') && i > 4000) {
    let closingDivIdx = -1;
    let divCount = 0;
    for (let j = i - 1; j < i + 150; j++) {
      const line = linesLines2[j];
      const hasOpen = line.includes('<div') && !line.includes('</div');
      const hasClose = line.includes('</div');
      if (hasOpen) divCount++;
      if (hasClose) divCount--;
      if (divCount === 0 && j > i) {
        closingDivIdx = j;
        break;
      }
    }
    if (closingDivIdx !== -1) {
      console.log(`Replacing activeRoomIdx facilities block (lines ${i} to ${closingDivIdx+1})`);
      linesLines2.splice(i - 1, closingDivIdx - i + 2, newActiveFacJsx);
      replacedActive = true;
      break;
    }
  }
}

let finalContent = linesLines2.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Finished updating Kamar Mandi Dalam ordering and custom nested WC facilities.");
