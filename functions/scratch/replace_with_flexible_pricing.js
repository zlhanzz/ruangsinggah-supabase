const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// 1. Update setTemporaryRoom template values
const oldRoomTemplate = `                                                     setTemporaryRoom({
                                                         name: '',
                                                         floor: '',
                                                         type: '',
                                                         status: '',
                                                         isAvailable: null,
                                                         price: '',
                                                         roomFacilities: [],
                                                         images: [],
                                                         readyDate: '',
                                                         residentName: '',
                                                         residentPhone: '',
                                                         startDate: '',
                                                         endDate: '',
                                                         residentKtpUrl: '',
                                                         paymentProofUrl: ''
                                                     });`;

const newRoomTemplate = `                                                     setTemporaryRoom({
                                                         name: '',
                                                         floor: '',
                                                         type: '',
                                                         status: '',
                                                         isAvailable: null,
                                                         price: '',
                                                         pricing: [{ period: 'bulanan', price: '' }],
                                                         roomFacilities: [],
                                                         images: [],
                                                         readyDate: '',
                                                         residentName: '',
                                                         residentPhone: '',
                                                         startDate: '',
                                                         endDate: '',
                                                         residentKtpUrl: '',
                                                         paymentProofUrl: ''
                                                     });`;

if (content.includes(oldRoomTemplate)) {
  content = content.replace(oldRoomTemplate, newRoomTemplate);
  console.log("Room template updated with default pricing profile.");
} else if (content.includes('pricing: [{ period: \'bulanan\'')) {
  console.log("Room template already updated.");
}

// Helper to construct the dynamic pricing JSX block for temporaryRoom
const pricingJsxTemp = `                                                     {/* Skema Tarif / Harga Kamar Section */}
                                                     <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                         <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                                             <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest">Skema Tarif / Harga Kamar</span>
                                                             <button 
                                                                 type="button" 
                                                                 onClick={() => {
                                                                     const currentPricing = temporaryRoom.pricing || [];
                                                                     const definedPeriods = currentPricing.map((p) => p.period);
                                                                     const nextPeriod = ['bulanan', 'tahunan', '6bulanan', '3bulanan', 'mingguan', 'harian'].find(p => !definedPeriods.includes(p)) || 'bulanan';
                                                                     const baseMonthlyPrice = Number(currentPricing.find((p) => p.period === 'bulanan')?.price) || Number(temporaryRoom.price) || 0;
                                                                     let defaultPrice = 0;
                                                                     if (nextPeriod === 'tahunan') defaultPrice = baseMonthlyPrice * 12;
                                                                     else if (nextPeriod === '6bulanan') defaultPrice = baseMonthlyPrice * 6;
                                                                     else if (nextPeriod === '3bulanan') defaultPrice = baseMonthlyPrice * 3;
                                                                     else defaultPrice = baseMonthlyPrice;

                                                                     setTemporaryRoom({
                                                                         ...temporaryRoom,
                                                                         pricing: [...currentPricing, { period: nextPeriod, price: defaultPrice || '' }]
                                                                     });
                                                                 }}
                                                                 className="text-[10px] font-bold text-[#ff7a00] hover:underline flex items-center gap-1"
                                                             >
                                                                 <span className="material-symbols-outlined text-xs">add</span> Tambah Skema Harga
                                                             </button>
                                                         </div>
                                                         
                                                         <div className="space-y-3">
                                                             {(() => {
                                                                 const pricing = temporaryRoom.pricing || [];
                                                                 const hasMonthly = pricing.some((p) => p.period === 'bulanan');
                                                                 if (!hasMonthly) {
                                                                     const monthlyPrice = temporaryRoom.price || '';
                                                                     temporaryRoom.pricing = [{ period: 'bulanan', price: monthlyPrice }, ...pricing];
                                                                 }
                                                                 return temporaryRoom.pricing.map((scheme, pIdx) => (
                                                                     <div key={pIdx} className="flex gap-2 items-center">
                                                                         <select
                                                                             value={scheme.period}
                                                                             onChange={(e) => {
                                                                                 const updatedPricing = [...temporaryRoom.pricing];
                                                                                 updatedPricing[pIdx] = { ...scheme, period: e.target.value };
                                                                                 setTemporaryRoom({ ...temporaryRoom, pricing: updatedPricing });
                                                                             }}
                                                                             className="bg-white border border-[#e0c0af] rounded-lg px-2 py-2 text-xs font-bold outline-none text-[#584235]"
                                                                         >
                                                                             <option value="bulanan">Bulanan</option>
                                                                             <option value="3bulanan">3 Bulan</option>
                                                                             <option value="6bulanan">6 Bulan</option>
                                                                             <option value="tahunan">Tahunan</option>
                                                                             <option value="mingguan">Mingguan</option>
                                                                             <option value="harian">Harian</option>
                                                                         </select>
                                                                         <div className="relative flex-grow">
                                                                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">Rp</span>
                                                                             <input
                                                                                 type="number"
                                                                                 value={scheme.price}
                                                                                 onChange={(e) => {
                                                                                     const val = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
                                                                                     const updatedPricing = [...temporaryRoom.pricing];
                                                                                     updatedPricing[pIdx] = { ...scheme, price: val };
                                                                                     
                                                                                     let legacyPriceUpdate = {};
                                                                                     if (scheme.period === 'bulanan') {
                                                                                         legacyPriceUpdate = { price: val };
                                                                                     }
                                                                                     setTemporaryRoom({ ...temporaryRoom, ...legacyPriceUpdate, pricing: updatedPricing });
                                                                                 }}
                                                                                 className="w-full h-[36px] pl-8 pr-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                 placeholder="Harga"
                                                                             />
                                                                         </div>
                                                                         {scheme.period !== 'bulanan' && (
                                                                             <button 
                                                                                 type="button" 
                                                                                 onClick={() => {
                                                                                     const updatedPricing = temporaryRoom.pricing.filter((_, idx) => idx !== pIdx);
                                                                                     setTemporaryRoom({ ...temporaryRoom, pricing: updatedPricing });
                                                                                 }}
                                                                                 className="text-red-500 hover:text-red-700 p-1"
                                                                             >
                                                                                 <span className="material-symbols-outlined text-base">delete</span>
                                                                             </button>
                                                                         )}
                                                                     </div>
                                                                 ));
                                                             })()}
                                                         </div>
                                                         <p className="text-[10px] text-gray-400 leading-normal italic">
                                                             * Jika tarif Tahunan tidak diisi, tarif tahunan akan dihitung 12x tarif Bulanan secara default.
                                                         </p>
                                                     </div>`;

// Helper to construct the dynamic pricing JSX block for activeRoomIdx
const pricingJsxActive = `                                                     {/* Skema Tarif / Harga Kamar Section */}
                                                     <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                         <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                                             <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest">Skema Tarif / Harga Kamar</span>
                                                             <button 
                                                                 type="button" 
                                                                 onClick={() => {
                                                                     const currentPricing = rt.pricing || [];
                                                                     const definedPeriods = currentPricing.map((p) => p.period);
                                                                     const nextPeriod = ['bulanan', 'tahunan', '6bulanan', '3bulanan', 'mingguan', 'harian'].find(p => !definedPeriods.includes(p)) || 'bulanan';
                                                                     const baseMonthlyPrice = Number(currentPricing.find((p) => p.period === 'bulanan')?.price) || Number(rt.price) || 0;
                                                                     let defaultPrice = 0;
                                                                     if (nextPeriod === 'tahunan') defaultPrice = baseMonthlyPrice * 12;
                                                                     else if (nextPeriod === '6bulanan') defaultPrice = baseMonthlyPrice * 6;
                                                                     else if (nextPeriod === '3bulanan') defaultPrice = baseMonthlyPrice * 3;
                                                                     else defaultPrice = baseMonthlyPrice;

                                                                     const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                     updatedRoomTypes[activeRoomIdx] = {
                                                                         ...rt,
                                                                         pricing: [...currentPricing, { period: nextPeriod, price: defaultPrice || '' }]
                                                                     };
                                                                     setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                 }}
                                                                 className="text-[10px] font-bold text-[#ff7a00] hover:underline flex items-center gap-1"
                                                             >
                                                                 <span className="material-symbols-outlined text-xs">add</span> Tambah Skema Harga
                                                             </button>
                                                         </div>
                                                         
                                                         <div className="space-y-3">
                                                             {(() => {
                                                                 const pricing = rt.pricing || [];
                                                                 const hasMonthly = pricing.some((p) => p.period === 'bulanan');
                                                                 if (!hasMonthly) {
                                                                     const monthlyPrice = rt.price || '';
                                                                     rt.pricing = [{ period: 'bulanan', price: monthlyPrice }, ...pricing];
                                                                 }
                                                                 return rt.pricing.map((scheme, pIdx) => (
                                                                     <div key={pIdx} className="flex gap-2 items-center">
                                                                         <select
                                                                             value={scheme.period}
                                                                             onChange={(e) => {
                                                                                 const updatedPricing = [...rt.pricing];
                                                                                 updatedPricing[pIdx] = { ...scheme, period: e.target.value };
                                                                                 const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                 updatedRoomTypes[activeRoomIdx] = { ...rt, pricing: updatedPricing };
                                                                                 setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                             }}
                                                                             className="bg-white border border-[#e0c0af] rounded-lg px-2 py-2 text-xs font-bold outline-none text-[#584235]"
                                                                         >
                                                                             <option value="bulanan">Bulanan</option>
                                                                             <option value="3bulanan">3 Bulan</option>
                                                                             <option value="6bulanan">6 Bulan</option>
                                                                             <option value="tahunan">Tahunan</option>
                                                                             <option value="mingguan">Mingguan</option>
                                                                             <option value="harian">Harian</option>
                                                                         </select>
                                                                         <div className="relative flex-grow">
                                                                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">Rp</span>
                                                                             <input
                                                                                 type="number"
                                                                                 value={scheme.price}
                                                                                 onChange={(e) => {
                                                                                     const val = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
                                                                                     const updatedPricing = [...rt.pricing];
                                                                                     updatedPricing[pIdx] = { ...scheme, price: val };
                                                                                     
                                                                                     let legacyPriceUpdate = {};
                                                                                     if (scheme.period === 'bulanan') {
                                                                                         legacyPriceUpdate = { price: val };
                                                                                     }
                                                                                     const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                     updatedRoomTypes[activeRoomIdx] = { ...rt, ...legacyPriceUpdate, pricing: updatedPricing };
                                                                                     setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                 }}
                                                                                 className="w-full h-[36px] pl-8 pr-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                 placeholder="Harga"
                                                                             />
                                                                         </div>
                                                                         {scheme.period !== 'bulanan' && (
                                                                             <button 
                                                                                 type="button" 
                                                                                 onClick={() => {
                                                                                     const updatedPricing = rt.pricing.filter((_, idx) => idx !== pIdx);
                                                                                     const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                     updatedRoomTypes[activeRoomIdx] = { ...rt, pricing: updatedPricing };
                                                                                     setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                 }}
                                                                                 className="text-red-500 hover:text-red-700 p-1"
                                                                             >
                                                                                 <span className="material-symbols-outlined text-base">delete</span>
                                                                             </button>
                                                                         )}
                                                                     </div>
                                                                 ));
                                                             })()}
                                                         </div>
                                                         <p className="text-[10px] text-gray-400 leading-normal italic">
                                                             * Jika tarif Tahunan tidak diisi, tarif tahunan akan dihitung 12x tarif Bulanan secara default.
                                                         </p>
                                                     </div>`;

// Find where Detail Kamar block ends in temporaryRoom editor
const tempLines = content.split('\n');
let replacedTempJsx = false;
let replacedActiveJsx = false;

for (let i = 0; i < tempLines.length; i++) {
  if (!replacedTempJsx && tempLines[i].includes('Detail Kamar') && tempLines[i].includes('span') && tempLines[i-1] && tempLines[i-1].includes('border-gray-150')) {
    // Correct closing <div> detection by excluding </div> and increasing range limit
    let closingDivIdx = -1;
    let divCount = 0;
    for (let j = i - 1; j < i + 150; j++) {
      const line = tempLines[j];
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
      console.log("Inserting temporaryRoom pricing JSX after line " + (closingDivIdx + 1));
      tempLines.splice(closingDivIdx + 1, 0, pricingJsxTemp);
      replacedTempJsx = true;
    }
  }
}

// Re-split content
let midContent = tempLines.join('\n');
const tempLines2 = midContent.split('\n');

for (let i = 0; i < tempLines2.length; i++) {
  // Let's find the activeRoomIdx Detail Kamar Section container. 
  // Since we already inserted the first one, let's find the second "Detail Kamar" container (i > 3500)
  if (!replacedActiveJsx && tempLines2[i].includes('Detail Kamar') && tempLines2[i].includes('span') && tempLines2[i-1] && tempLines2[i-1].includes('border-gray-150') && i > 3500) {
    let closingDivIdx = -1;
    let divCount = 0;
    for (let j = i - 1; j < i + 150; j++) {
      const line = tempLines2[j];
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
      console.log("Inserting activeRoomIdx pricing JSX after line " + (closingDivIdx + 1));
      tempLines2.splice(closingDivIdx + 1, 0, pricingJsxActive);
      replacedActiveJsx = true;
    }
  }
}

let finalContent = tempLines2.join('\n');

// 3. Remove old single "Harga Sewa Bulanan (Rp)" inputs from both Kosong sections if they exist
const oldPriceInputBlockTemp = `                                                                     <div className="flex flex-col gap-1">
                                                                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Harga Sewa Bulanan (Rp)</label>
                                                                         <input 
                                                                             type="number"
                                                                             value={temporaryRoom.price || ''}
                                                                             onChange={e => setTemporaryRoom({ ...temporaryRoom, price: parseFloat(e.target.value) || 0 })}
                                                                             className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none"
                                                                             placeholder="contoh: 1500000"
                                                                         />
                                                                     </div>`;

const oldPriceInputBlockActive = `                                                                          <div className="flex flex-col gap-1">
                                                                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Harga Sewa Bulanan (Rp)</label>
                                                                              <input 
                                                                                  type="number"
                                                                                  value={rt.price || ''}
                                                                                  onChange={e => {
                                                                                      const updated = [...kmListingForm.roomTypes];
                                                                                      updated[activeRoomIdx] = { ...rt, price: parseFloat(e.target.value) || 0 };
                                                                                      setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                  }}
                                                                                  className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none"
                                                                                  placeholder="contoh: 1500000"
                                                                              />
                                                                          </div>`;

if (finalContent.includes(oldPriceInputBlockTemp)) {
  finalContent = finalContent.replace(oldPriceInputBlockTemp, '');
  console.log("Removed old single price input from temporaryRoom Kosong section.");
}
if (finalContent.includes(oldPriceInputBlockActive)) {
  finalContent = finalContent.replace(oldPriceInputBlockActive, '');
  console.log("Removed old single price input from activeRoomIdx Kosong section.");
}

// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Done updating flexible pricing profiles.");
