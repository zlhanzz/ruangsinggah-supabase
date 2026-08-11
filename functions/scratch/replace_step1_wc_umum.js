const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Declare state for custom public bathroom facility input at the top
const stateTarget = `    const [customBathroomFacilityInput, setCustomBathroomFacilityInput] = useState('');`;
const stateReplacement = `    const [customBathroomFacilityInput, setCustomBathroomFacilityInput] = useState('');
    const [customPublicBathroomFacilityInput, setCustomPublicBathroomFacilityInput] = useState('');`;

content = content.replace(stateTarget, stateReplacement);

// 2. Locate the facilities mapping section in Step 1
const oldFacList = `['WiFi', 'Dapur Bersama', 'Area Parkir', 'Ruang Tamu', 'CCTV', 'Laundry']`;
const newFacList = `['WiFi', 'Dapur Bersama', 'Area Parkir', 'Ruang Tamu', 'CCTV', 'Laundry', 'WC Umum']`;

content = content.replace(oldFacList, newFacList);

// Update synonyms
const oldSynonyms = `                                                                               const synonyms: Record<string, string[]> = {
                                                                                   'wifi': ['wifi', 'wi-fi', 'internet'],
                                                                                   'dapur bersama': ['dapur', 'dapur bersama', 'dapur umum'],
                                                                                   'area parkir': ['parkir', 'parkiran', 'tempat parkir', 'area parkir', 'parkir motor', 'parkir mobil'],
                                                                                   'ruang tamu': ['ruang tamu', 'ruang santai'],
                                                                                   'cctv': ['cctv', 'kamera keamanan'],
                                                                                   'laundry': ['laundry', 'mesin cuci', 'cuci']
                                                                               };`;

const newSynonyms = `                                                                               const synonyms: Record<string, string[]> = {
                                                                                   'wifi': ['wifi', 'wi-fi', 'internet'],
                                                                                   'dapur bersama': ['dapur', 'dapur bersama', 'dapur umum'],
                                                                                   'area parkir': ['parkir', 'parkiran', 'tempat parkir', 'area parkir', 'parkir motor', 'parkir mobil'],
                                                                                   'ruang tamu': ['ruang tamu', 'ruang santai'],
                                                                                   'cctv': ['cctv', 'kamera keamanan'],
                                                                                   'laundry': ['laundry', 'mesin cuci', 'cuci'],
                                                                                   'wc umum': ['wc umum', 'kamar mandi umum']
                                                                               };`;

content = content.replace(oldSynonyms, newSynonyms);

// Update custom filtering list
content = content.replace(/!\['wifi', 'dapur bersama', 'area parkir', 'ruang tamu', 'cctv', 'laundry'\]/g, `!['wifi', 'dapur bersama', 'area parkir', 'ruang tamu', 'cctv', 'laundry', 'wc umum']`);

// 3. Inject nested sub-facilities block for 'WC Umum' in Step 1 layout
// Let's find the closing tag of the main grid. We'll search for the line containing `</div>` right after the facilities map.
const oldGridEndBlock = `                                                                </label>
                                                           );
                                                       })}
                                                 </div>`;

const newGridEndBlock = `                                                                </label>
                                                           );
                                                       })}

                                                     {/* Nested public bathroom facilities if WC Umum is checked */}
                                                     {checkHasFacility(kmListingForm.facilities, 'WC Umum') && (
                                                         <div className="col-span-2 pl-6 mt-1.5 border-l-2 border-[#ff7a00] flex flex-col gap-2.5 bg-orange-50/30 p-4 rounded-xl w-full">
                                                             <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-0.5">Kelengkapan WC Umum:</span>
                                                             <div className="grid grid-cols-2 gap-2.5">
                                                                 {['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Bak Mandi', 'Cermin', 'Wastafel'].map(bfac => {
                                                                     const isBChecked = kmListingForm.publicBathroomFacilities?.includes(bfac);
                                                                     return (
                                                                         <label key={bfac} className="flex items-center gap-2 cursor-pointer">
                                                                             <input 
                                                                                 type="checkbox"
                                                                                 checked={isBChecked}
                                                                                 onChange={() => {
                                                                                     const current = kmListingForm.publicBathroomFacilities || [];
                                                                                     const updated = current.includes(bfac)
                                                                                         ? current.filter((f: string) => f !== bfac)
                                                                                         : [...current, bfac];
                                                                                     setKmListingForm({ ...kmListingForm, publicBathroomFacilities: updated });
                                                                                 }}
                                                                                 className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5"
                                                                             />
                                                                             <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">{bfac}</span>
                                                                         </label>
                                                                     );
                                                                 })}

                                                                 {/* Custom WC Umum tags */}
                                                                 {(() => {
                                                                     const bCustoms = kmListingForm.publicBathroomFacilities?.filter((f: string) => !['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Bak Mandi', 'Cermin', 'Wastafel'].includes(f)) || [];
                                                                     if (bCustoms.length === 0) return null;
                                                                     return (
                                                                         <div className="col-span-2 flex flex-wrap gap-1 mt-1 border-t border-orange-100 pt-2">
                                                                             {bCustoms.map((fac) => (
                                                                                 <span key={fac} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-[#ff7a00] text-[9px] font-black rounded uppercase tracking-wider">
                                                                                     {fac}
                                                                                     <button 
                                                                                         type="button" 
                                                                                         onClick={() => {
                                                                                             const current = kmListingForm.publicBathroomFacilities || [];
                                                                                             setKmListingForm({ ...kmListingForm, publicBathroomFacilities: current.filter((f) => f !== fac) });
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

                                                                 {/* Custom WC Umum facility input adder */}
                                                                 <div className="col-span-2 flex gap-1.5 mt-1 border-t border-orange-100 pt-2">
                                                                     <input 
                                                                         type="text" 
                                                                         value={customPublicBathroomFacilityInput} 
                                                                         onChange={e => setCustomPublicBathroomFacilityInput(e.target.value)} 
                                                                         placeholder="Tambah kelengkapan WC Umum..." 
                                                                         className="flex-grow h-[32px] px-2.5 border border-[#e0c0af] rounded-lg text-[11px] bg-white outline-none text-[#584235] font-bold"
                                                                     />
                                                                     <button 
                                                                         type="button"
                                                                         onClick={() => {
                                                                             if (!customPublicBathroomFacilityInput.trim()) return;
                                                                             const current = kmListingForm.publicBathroomFacilities || [];
                                                                             if (!current.includes(customPublicBathroomFacilityInput.trim())) {
                                                                                 setKmListingForm({ ...kmListingForm, publicBathroomFacilities: [...current, customPublicBathroomFacilityInput.trim()] });
                                                                             }
                                                                             setCustomPublicBathroomFacilityInput('');
                                                                         }}
                                                                         className="h-[32px] px-3 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-[10px] uppercase rounded-lg flex items-center justify-center transition-colors shadow-sm"
                                                                     >
                                                                         +
                                                                     </button>
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     )}
                                                 </div>`;

content = content.replace(oldGridEndBlock, newGridEndBlock);

let finalContent = content;
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Finished updating Step 1 with WC Umum options.");
