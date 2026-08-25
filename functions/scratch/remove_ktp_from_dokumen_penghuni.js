const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

const newDocTemp = `                                                              {/* Dokumen Penghuni */}
                                                              <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-2 bg-gray-50/30">
                                                                  <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Dokumen Penghuni</span>
                                                                  <div className="flex flex-col gap-1">
                                                                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Bukti Bayar / Kontrak</label>
                                                                      {temporaryRoom.paymentProofUrl ? (
                                                                          <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 relative group">
                                                                              <img src={temporaryRoom.paymentProofUrl} alt="Bukti Bayar" className="w-full h-full object-cover" />
                                                                              <button
                                                                                  type="button"
                                                                                  onClick={() => setTemporaryRoom({ ...temporaryRoom, paymentProofUrl: '' })}
                                                                                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md"
                                                                              >
                                                                                  &times;
                                                                              </button>
                                                                          </div>
                                                                      ) : (
                                                                          <div 
                                                                              onClick={async () => {
                                                                                  const input = document.createElement('input');
                                                                                  input.type = 'file';
                                                                                  input.accept = 'image/*';
                                                                                  input.onchange = async (e: any) => {
                                                                                      const file = e.target?.files?.[0];
                                                                                      if (file) {
                                                                                          setUploadingRooms(prev => ({ ...prev, [3001]: true }));
                                                                                          try {
                                                                                              const folder = \`kostmanager/residents/payment/\${Date.now()}\`;
                                                                                              const publicUrl = await uploadFileAndGetURL(file, folder);
                                                                                              setTemporaryRoom({ ...temporaryRoom, paymentProofUrl: publicUrl });
                                                                                          } catch (err) {
                                                                                              alert('Gagal unggah bukti: ' + (err as Error).message);
                                                                                          } finally {
                                                                                              setUploadingRooms(prev => ({ ...prev, [3001]: false }));
                                                                                          }
                                                                                      }
                                                                                  };
                                                                                  input.click();
                                                                              }}
                                                                              className="bg-white border-2 border-dashed border-[#ff7a00] rounded-xl flex flex-col items-center justify-center p-4 h-24 cursor-pointer hover:bg-orange-50/30 transition-all"
                                                                          >
                                                                              {uploadingRooms[3001] ? (
                                                                                  <span className="text-[10px] font-bold animate-pulse text-gray-500">Uploading...</span>
                                                                              ) : (
                                                                                  <>
                                                                                      <span className="material-symbols-outlined text-[#ff7a00] text-xl">receipt_long</span>
                                                                                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#ff7a00] mt-1 text-center">Upload Bukti</span>
                                                                                  </>
                                                                              )}
                                                                          </div>
                                                                      )}
                                                                  </div>
                                                              </div>`;

const newDocActive = `                                                                  {/* Dokumen Penghuni */}
                                                                  <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-2 bg-gray-50/30">
                                                                      <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Dokumen Penghuni</span>
                                                                      <div className="flex flex-col gap-1">
                                                                          <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Bukti Bayar / Kontrak</label>
                                                                          {rt.paymentProofUrl ? (
                                                                              <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 relative group">
                                                                                  <img src={rt.paymentProofUrl} alt="Bukti Bayar" className="w-full h-full object-cover" />
                                                                                  <button
                                                                                      type="button"
                                                                                      onClick={() => {
                                                                                          const updated = [...kmListingForm.roomTypes];
                                                                                          updated[activeRoomIdx] = { ...rt, paymentProofUrl: '' };
                                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                      }}
                                                                                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md"
                                                                                  >
                                                                                      &times;
                                                                                  </button>
                                                                              </div>
                                                                          ) : (
                                                                              <div 
                                                                                  onClick={async () => {
                                                                                      const input = document.createElement('input');
                                                                                      input.type = 'file';
                                                                                      input.accept = 'image/*';
                                                                                      input.onchange = async (e: any) => {
                                                                                          const file = e.target?.files?.[0];
                                                                                          if (file) {
                                                                                              setUploadingRooms(prev => ({ ...prev, [4001]: true }));
                                                                                              try {
                                                                                                  const folder = \`kostmanager/residents/payment/\${Date.now()}\`;
                                                                                                  const publicUrl = await uploadFileAndGetURL(file, folder);
                                                                                                  const updated = [...kmListingForm.roomTypes];
                                                                                                  updated[activeRoomIdx] = { ...rt, paymentProofUrl: publicUrl };
                                                                                                  setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                              } catch (err) {
                                                                                                  alert('Gagal unggah bukti: ' + (err as Error).message);
                                                                                              } finally {
                                                                                                  setUploadingRooms(prev => ({ ...prev, [4001]: false }));
                                                                                              }
                                                                                          }
                                                                                      };
                                                                                      input.click();
                                                                                  }}
                                                                                  className="bg-white border-2 border-dashed border-[#ff7a00] rounded-xl flex flex-col items-center justify-center p-4 h-24 cursor-pointer hover:bg-orange-50/30 transition-all"
                                                                              >
                                                                                  {uploadingRooms[4001] ? (
                                                                                      <span className="text-[10px] font-bold animate-pulse text-gray-500">Uploading...</span>
                                                                                  ) : (
                                                                                      <>
                                                                                          <span className="material-symbols-outlined text-[#ff7a00] text-xl">receipt_long</span>
                                                                                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#ff7a00] mt-1 text-center">Upload Bukti</span>
                                                                                      </>
                                                                                  )}
                                                                              </div>
                                                                          )}
                                                                      </div>
                                                                  </div>`;

let replacedTemp = false;
let replacedActive = false;

for (let i = 0; i < lines.length; i++) {
  // Find "Dokumen Penghuni" in temporaryRoom
  if (!replacedTemp && lines[i].includes('Dokumen Penghuni') && lines[i].includes('span') && lines[i-1] && lines[i-1].includes('border-gray-150') && i < 4000) {
    let containerStart = i - 1;
    let containerEnd = -1;
    let divCount = 0;
    for (let j = containerStart; j < containerStart + 150; j++) {
      const line = lines[j];
      const hasOpen = line.includes('<div') && !line.includes('</div');
      const hasClose = line.includes('</div');
      if (hasOpen) divCount++;
      if (hasClose) divCount--;
      if (divCount === 0 && j > containerStart) {
        containerEnd = j;
        break;
      }
    }
    if (containerEnd !== -1) {
      console.log(`Replacing temporaryRoom Dokumen Penghuni block at lines ${containerStart+1} to ${containerEnd+1}`);
      lines.splice(containerStart, containerEnd - containerStart + 1, newDocTemp);
      replacedTemp = true;
    }
  }
}

// Re-split
let midContent = lines.join('\n');
const lines2 = midContent.split('\n');

for (let i = 0; i < lines2.length; i++) {
  // Find "Dokumen Penghuni" in activeRoomIdx (i > 4300)
  if (!replacedActive && lines2[i].includes('Dokumen Penghuni') && lines2[i].includes('span') && lines2[i-1] && lines2[i-1].includes('border-gray-150') && i > 4300) {
    let containerStart = i - 1;
    let containerEnd = -1;
    let divCount = 0;
    for (let j = containerStart; j < containerStart + 150; j++) {
      const line = lines2[j];
      const hasOpen = line.includes('<div') && !line.includes('</div');
      const hasClose = line.includes('</div');
      if (hasOpen) divCount++;
      if (hasClose) divCount--;
      if (divCount === 0 && j > containerStart) {
        containerEnd = j;
        break;
      }
    }
    if (containerEnd !== -1) {
      console.log(`Replacing activeRoomIdx Dokumen Penghuni block at lines ${containerStart+1} to ${containerEnd+1}`);
      lines2.splice(containerStart, containerEnd - containerStart + 1, newDocActive);
      replacedActive = true;
      break;
    }
  }
}

let finalContent = lines2.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Done removing KTP from resident documents panel.");
