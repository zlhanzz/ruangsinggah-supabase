const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Declare state for customKitchenFacilityInput
content = content.replace(
  "const [customBathroomFacilityInput, setCustomBathroomFacilityInput] = useState('');",
  "const [customBathroomFacilityInput, setCustomBathroomFacilityInput] = useState('');\n    const [customKitchenFacilityInput, setCustomKitchenFacilityInput] = useState('');"
);

// 2. Add kitchenFacilities copying to Copy helper
content = content.replace(
  "bathroomFacilities: sourceRoom.bathroomFacilities ? [...sourceRoom.bathroomFacilities] : []",
  "bathroomFacilities: sourceRoom.bathroomFacilities ? [...sourceRoom.bathroomFacilities] : [],\n                                                                             kitchenFacilities: sourceRoom.kitchenFacilities ? [...sourceRoom.kitchenFacilities] : []"
);

// Split into lines for precise block injection
const lines = content.split('\n');

// 3. For temporaryRoom (first occurrence of facilities grid):
// Find the roomFacilities list mapping
let tempFacListIdx = lines.findIndex((l, idx) => l.includes("['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Jendela Luar', 'Kamar Mandi Dalam']"));
if (tempFacListIdx !== -1) {
  console.log("Replacing roomFacilities checklist in temporaryRoom at line:", tempFacListIdx + 1);
  lines[tempFacListIdx] = lines[tempFacListIdx].replace(
    "['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Jendela Luar', 'Kamar Mandi Dalam']",
    "['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Jendela Luar', 'Kamar Mandi Dalam', 'Dapur Dalam']"
  );
  
  // Find the closing of Kamar Mandi Dalam nested block
  let tempBtmClosingIdx = -1;
  for (let i = tempFacListIdx; i < tempFacListIdx + 120; i++) {
    if (lines[i].includes("temporaryRoom.roomFacilities?.includes('Kamar Mandi Dalam')")) {
      // Look forward for the closing parentheses & bracket of this conditional render block
      let openBrackets = 1;
      for (let j = i + 1; j < i + 120; j++) {
        if (lines[j].includes('(')) openBrackets++;
        if (lines[j].includes(')')) openBrackets--;
        if (openBrackets === 0) {
          tempBtmClosingIdx = j;
          break;
        }
      }
      break;
    }
  }
  
  if (tempBtmClosingIdx !== -1) {
    console.log("Injecting Dapur Dalam sub-inputs for temporaryRoom at line:", tempBtmClosingIdx + 2);
    const tempDapurBlock = `                                                              {/* Nested kitchen facilities if Dapur Dalam is checked */}
                                                              {temporaryRoom.roomFacilities?.includes('Dapur Dalam') && (
                                                                  <div className="col-span-2 pl-6 mt-1.5 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-orange-50/30 p-3 rounded-xl">
                                                                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-0.5">Kelengkapan Dapur Dalam:</span>
                                                                      <div className="grid grid-cols-2 gap-2.5">
                                                                          {['Kompor', 'Kulkas', 'Wastafel Cuci Piring', 'Kitchen Set', 'Dispenser'].map(kfac => {
                                                                              const isKChecked = temporaryRoom.kitchenFacilities?.includes(kfac);
                                                                              return (
                                                                                  <label key={kfac} className="flex items-center gap-2 cursor-pointer">
                                                                                      <input 
                                                                                          type="checkbox"
                                                                                          checked={isKChecked}
                                                                                          onChange={() => {
                                                                                              const current = temporaryRoom.kitchenFacilities || [];
                                                                                              const updated = current.includes(kfac)
                                                                                                  ? current.filter((f: string) => f !== kfac)
                                                                                                  : [...current, kfac];
                                                                                              setTemporaryRoom({ ...temporaryRoom, kitchenFacilities: updated });
                                                                                          }}
                                                                                          className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5"
                                                                                      />
                                                                                      <span className="text-[11px] text-gray-600 font-bold uppercase">{kfac}</span>
                                                                                  </label>
                                                                              );
                                                                          })}
                                                                      </div>
                                                                      
                                                                      {/* Custom kitchen tags */}
                                                                      {temporaryRoom.kitchenFacilities?.filter((f: string) => !['Kompor', 'Kulkas', 'Wastafel Cuci Piring', 'Kitchen Set', 'Dispenser'].includes(f)).length > 0 && (
                                                                          <div className="flex flex-wrap gap-1.5 mt-1">
                                                                              {temporaryRoom.kitchenFacilities.filter((f: string) => !['Kompor', 'Kulkas', 'Wastafel Cuci Piring', 'Kitchen Set', 'Dispenser'].includes(f)).map((fac: string) => (
                                                                                  <span key={fac} className="bg-orange-100 text-[#ff7a00] px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                                                                                      {fac}
                                                                                      <button
                                                                                          type="button"
                                                                                          onClick={() => {
                                                                                              const current = temporaryRoom.kitchenFacilities || [];
                                                                                              setTemporaryRoom({ ...temporaryRoom, kitchenFacilities: current.filter((f) => f !== fac) });
                                                                                          }}
                                                                                          className="text-red-600 hover:text-red-850 font-bold text-xs"
                                                                                      >
                                                                                          &times;
                                                                                      </button>
                                                                                  </span>
                                                                              ))}
                                                                          </div>
                                                                      )}
                                                                      
                                                                      {/* Custom kitchen facility input adder */}
                                                                      <div className="flex gap-2 mt-1.5">
                                                                          <input 
                                                                              type="text"
                                                                              placeholder="Tambah kelengkapan dapur..."
                                                                              value={customKitchenFacilityInput}
                                                                              onChange={e => setCustomKitchenFacilityInput(e.target.value)}
                                                                              className="flex-1 h-[32px] px-3 border border-[#e0c0af] rounded-lg text-[10px] outline-none bg-white font-bold text-[#584235]"
                                                                          />
                                                                          <button
                                                                              type="button"
                                                                              onClick={() => {
                                                                                  if (customKitchenFacilityInput.trim()) {
                                                                                      const current = temporaryRoom.kitchenFacilities || [];
                                                                                      setTemporaryRoom({ ...temporaryRoom, kitchenFacilities: [...current, customKitchenFacilityInput.trim()] });
                                                                                  }
                                                                                  setCustomKitchenFacilityInput('');
                                                                              }}
                                                                              className="h-[32px] w-[32px] bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-sm rounded-lg flex items-center justify-center transition-colors"
                                                                          >
                                                                              +
                                                                          </button>
                                                                      </div>
                                                                  </div>
                                                              )}`;
    lines.splice(tempBtmClosingIdx + 1, 0, tempDapurBlock);
  }
}

// 4. For activeRoomIdx (second occurrence of facilities grid):
// Find the roomFacilities list mapping (re-search from the end since array size shifted)
let activeFacListIdx = lines.findIndex((l, idx) => idx > tempFacListIdx + 200 && l.includes("['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Jendela Luar', 'Kamar Mandi Dalam']"));
if (activeFacListIdx !== -1) {
  console.log("Replacing roomFacilities checklist in activeRoomIdx at line:", activeFacListIdx + 1);
  lines[activeFacListIdx] = lines[activeFacListIdx].replace(
    "['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Jendela Luar', 'Kamar Mandi Dalam']",
    "['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Jendela Luar', 'Kamar Mandi Dalam', 'Dapur Dalam']"
  );
  
  // Find the closing of Kamar Mandi Dalam nested block
  let activeBtmClosingIdx = -1;
  for (let i = activeFacListIdx; i < activeFacListIdx + 120; i++) {
    if (lines[i].includes("rt.roomFacilities?.includes('Kamar Mandi Dalam')")) {
      let openBrackets = 1;
      for (let j = i + 1; j < i + 120; j++) {
        if (lines[j].includes('(')) openBrackets++;
        if (lines[j].includes(')')) openBrackets--;
        if (openBrackets === 0) {
          activeBtmClosingIdx = j;
          break;
        }
      }
      break;
    }
  }
  
  if (activeBtmClosingIdx !== -1) {
    console.log("Injecting Dapur Dalam sub-inputs for activeRoomIdx at line:", activeBtmClosingIdx + 2);
    const activeDapurBlock = `                                                              {/* Nested kitchen facilities if Dapur Dalam is checked */}
                                                              {rt.roomFacilities?.includes('Dapur Dalam') && (
                                                                  <div className="col-span-2 pl-6 mt-1.5 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-orange-50/30 p-3 rounded-xl">
                                                                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-0.5">Kelengkapan Dapur Dalam:</span>
                                                                      <div className="grid grid-cols-2 gap-2.5">
                                                                          {['Kompor', 'Kulkas', 'Wastafel Cuci Piring', 'Kitchen Set', 'Dispenser'].map(kfac => {
                                                                              const isKChecked = rt.kitchenFacilities?.includes(kfac);
                                                                              return (
                                                                                  <label key={kfac} className="flex items-center gap-2 cursor-pointer">
                                                                                      <input 
                                                                                          type="checkbox"
                                                                                          checked={isKChecked}
                                                                                          onChange={() => {
                                                                                              const current = rt.kitchenFacilities || [];
                                                                                              const updated = current.includes(kfac)
                                                                                                  ? current.filter((f: string) => f !== kfac)
                                                                                                  : [...current, kfac];
                                                                                              const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                              updatedRoomTypes[activeRoomIdx] = { ...rt, kitchenFacilities: updated };
                                                                                              setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                          }}
                                                                                          className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5"
                                                                                      />
                                                                                      <span className="text-[11px] text-gray-600 font-bold uppercase">{kfac}</span>
                                                                                  </label>
                                                                              );
                                                                          })}
                                                                      </div>
                                                                      
                                                                      {/* Custom kitchen tags */}
                                                                      {rt.kitchenFacilities?.filter((f: string) => !['Kompor', 'Kulkas', 'Wastafel Cuci Piring', 'Kitchen Set', 'Dispenser'].includes(f)).length > 0 && (
                                                                          <div className="flex flex-wrap gap-1.5 mt-1">
                                                                              {rt.kitchenFacilities.filter((f: string) => !['Kompor', 'Kulkas', 'Wastafel Cuci Piring', 'Kitchen Set', 'Dispenser'].includes(f)).map((fac: string) => (
                                                                                  <span key={fac} className="bg-orange-100 text-[#ff7a00] px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                                                                                      {fac}
                                                                                      <button
                                                                                          type="button"
                                                                                          onClick={() => {
                                                                                              const current = rt.kitchenFacilities || [];
                                                                                              const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                              updatedRoomTypes[activeRoomIdx] = { ...rt, kitchenFacilities: current.filter((f) => f !== fac) };
                                                                                              setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                          }}
                                                                                          className="text-red-600 hover:text-red-850 font-bold text-xs"
                                                                                      >
                                                                                          &times;
                                                                                      </button>
                                                                                  </span>
                                                                              ))}
                                                                          </div>
                                                                      )}
                                                                      
                                                                      {/* Custom kitchen facility input adder */}
                                                                      <div className="flex gap-2 mt-1.5">
                                                                          <input 
                                                                              type="text"
                                                                              placeholder="Tambah kelengkapan dapur..."
                                                                              value={customKitchenFacilityInput}
                                                                              onChange={e => setCustomKitchenFacilityInput(e.target.value)}
                                                                              className="flex-1 h-[32px] px-3 border border-[#e0c0af] rounded-lg text-[10px] outline-none bg-white font-bold text-[#584235]"
                                                                          />
                                                                          <button
                                                                              type="button"
                                                                              onClick={() => {
                                                                                  if (customKitchenFacilityInput.trim()) {
                                                                                      const current = rt.kitchenFacilities || [];
                                                                                      const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                      updatedRoomTypes[activeRoomIdx] = { ...rt, kitchenFacilities: [...current, customKitchenFacilityInput.trim()] };
                                                                                      setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                  }
                                                                                  setCustomKitchenFacilityInput('');
                                                                              }}
                                                                              className="h-[32px] w-[32px] bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-sm rounded-lg flex items-center justify-center transition-colors"
                                                                          >
                                                                              +
                                                                          </button>
                                                                      </div>
                                                                  </div>
                                                              )}`;
    lines.splice(activeBtmClosingIdx + 1, 0, activeDapurBlock);
  }
}

let finalContent = lines.join('\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');

console.log("Done adding Dapur Dalam option.");
