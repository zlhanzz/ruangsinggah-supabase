const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

const newResidentBlockTemp = `                                                                      <div className="flex flex-col gap-1">
                                                                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Jenis Langganan</label>
                                                                          <select 
                                                                              value={temporaryRoom.paymentPeriod || 'bulanan'}
                                                                              onChange={e => setTemporaryRoom({ ...temporaryRoom, paymentPeriod: e.target.value })}
                                                                              className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                          >
                                                                              {(() => {
                                                                                  const definedPeriods = (temporaryRoom.pricing || []).map((p: any) => p.period);
                                                                                  const list = definedPeriods.length > 0 ? definedPeriods : ['bulanan'];
                                                                                  const labels: Record<string, string> = {
                                                                                      bulanan: 'Bulanan',
                                                                                      '3bulanan': '3 Bulan',
                                                                                      '6bulanan': '6 Bulan',
                                                                                      tahunan: 'Tahunan',
                                                                                      mingguan: 'Mingguan',
                                                                                      harian: 'Harian'
                                                                                  };
                                                                                  return list.map((period: string) => (
                                                                                      <option key={period} value={period}>{labels[period] || period}</option>
                                                                                  ));
                                                                              })()}
                                                                          </select>
                                                                      </div>
                                                                      <div className="grid grid-cols-2 gap-2">
                                                                          <div className="flex flex-col gap-1">
                                                                              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tanggal Masuk</label>
                                                                              <input 
                                                                                  type="date"
                                                                                  value={temporaryRoom.startDate || ''}
                                                                                  onChange={e => setTemporaryRoom({ ...temporaryRoom, startDate: e.target.value })}
                                                                                  className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                              />
                                                                          </div>
                                                                          <div className="flex flex-col gap-1">
                                                                              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tagihan Berikutnya</label>
                                                                              <input 
                                                                                  type="date"
                                                                                  value={temporaryRoom.endDate || ''}
                                                                                  onChange={e => setTemporaryRoom({ ...temporaryRoom, endDate: e.target.value })}
                                                                                  className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                              />
                                                                          </div>
                                                                      </div>`;

const newResidentBlockActive = `                                                                          <div className="flex flex-col gap-1">
                                                                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Jenis Langganan</label>
                                                                              <select 
                                                                                  value={rt.paymentPeriod || 'bulanan'}
                                                                                  onChange={e => {
                                                                                      const updated = [...kmListingForm.roomTypes];
                                                                                      updated[activeRoomIdx] = { ...rt, paymentPeriod: e.target.value };
                                                                                      setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                  }}
                                                                                  className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                              >
                                                                                  {(() => {
                                                                                      const definedPeriods = (rt.pricing || []).map((p: any) => p.period);
                                                                                      const list = definedPeriods.length > 0 ? definedPeriods : ['bulanan'];
                                                                                      const labels: Record<string, string> = {
                                                                                          bulanan: 'Bulanan',
                                                                                          '3bulanan': '3 Bulan',
                                                                                          '6bulanan': '6 Bulan',
                                                                                          tahunan: 'Tahunan',
                                                                                          mingguan: 'Mingguan',
                                                                                          harian: 'Harian'
                                                                                      };
                                                                                      return list.map((period: string) => (
                                                                                          <option key={period} value={period}>{labels[period] || period}</option>
                                                                                      ));
                                                                                  })()}
                                                                              </select>
                                                                          </div>
                                                                          <div className="grid grid-cols-2 gap-2">
                                                                              <div className="flex flex-col gap-1">
                                                                                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tanggal Masuk</label>
                                                                                  <input 
                                                                                      type="date"
                                                                                      value={rt.startDate || ''}
                                                                                      onChange={e => {
                                                                                          const updated = [...kmListingForm.roomTypes];
                                                                                          updated[activeRoomIdx] = { ...rt, startDate: e.target.value };
                                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                      }}
                                                                                      className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                  />
                                                                              </div>
                                                                              <div className="flex flex-col gap-1">
                                                                                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tagihan Berikutnya</label>
                                                                                  <input 
                                                                                      type="date"
                                                                                      value={rt.endDate || ''}
                                                                                      onChange={e => {
                                                                                          const updated = [...kmListingForm.roomTypes];
                                                                                          updated[activeRoomIdx] = { ...rt, endDate: e.target.value };
                                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                      }}
                                                                                      className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                  />
                                                                              </div>
                                                                          </div>`;

let replacedTemp = false;
let replacedActive = false;

for (let i = 0; i < lines.length; i++) {
  // Find "Mulai Masuk" in temporaryRoom
  if (!replacedTemp && lines[i].includes('Mulai Masuk') && lines[i].includes('label') && i < 4000) {
    // Find the enclosing grid div start (going backwards)
    let gridStartIdx = -1;
    for (let j = i; j > i - 10; j--) {
      if (lines[j].includes('<div') && lines[j].includes('grid-cols-2')) {
        gridStartIdx = j;
        break;
      }
    }
    // Find the enclosing grid div end (going forwards)
    let gridEndIdx = -1;
    let divCount = 1;
    if (gridStartIdx !== -1) {
      for (let j = gridStartIdx + 1; j < gridStartIdx + 30; j++) {
        const line = lines[j];
        if (line.includes('<div') && !line.includes('</div')) divCount++;
        if (line.includes('</div')) divCount--;
        if (divCount === 0) {
          gridEndIdx = j;
          break;
        }
      }
    }
    if (gridStartIdx !== -1 && gridEndIdx !== -1) {
      console.log(`Replacing temporaryRoom grid block at lines ${gridStartIdx+1} to ${gridEndIdx+1}`);
      lines.splice(gridStartIdx, gridEndIdx - gridStartIdx + 1, newResidentBlockTemp);
      replacedTemp = true;
    }
  }
}

// Re-split and find activeRoomIdx
let midContent = lines.join('\n');
const lines2 = midContent.split('\n');

for (let i = 0; i < lines2.length; i++) {
  // Find "Mulai Masuk" in activeRoomIdx (i > 4000)
  if (!replacedActive && lines2[i].includes('Mulai Masuk') && lines2[i].includes('label') && i > 4000) {
    let gridStartIdx = -1;
    for (let j = i; j > i - 10; j--) {
      if (lines2[j].includes('<div') && lines2[j].includes('grid-cols-2')) {
        gridStartIdx = j;
        break;
      }
    }
    let gridEndIdx = -1;
    let divCount = 1;
    if (gridStartIdx !== -1) {
      for (let j = gridStartIdx + 1; j < gridStartIdx + 30; j++) {
        const line = lines2[j];
        if (line.includes('<div') && !line.includes('</div')) divCount++;
        if (line.includes('</div')) divCount--;
        if (divCount === 0) {
          gridEndIdx = j;
          break;
        }
      }
    }
    if (gridStartIdx !== -1 && gridEndIdx !== -1) {
      console.log(`Replacing activeRoomIdx grid block at lines ${gridStartIdx+1} to ${gridEndIdx+1}`);
      lines2.splice(gridStartIdx, gridEndIdx - gridStartIdx + 1, newResidentBlockActive);
      replacedActive = true;
      break;
    }
  }
}

let finalContent = lines2.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Done updating resident information panels.");
