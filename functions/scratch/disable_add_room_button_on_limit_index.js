const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

let addRoomBtnIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Add New Room Button') && i > 3200) {
    addRoomBtnIdx = i;
    break;
  }
}

if (addRoomBtnIdx !== -1) {
  // Find where the button closes (find next </button>)
  let closeButtonIdx = -1;
  for (let j = addRoomBtnIdx; j < addRoomBtnIdx + 45; j++) {
    if (lines[j].includes('</button>')) {
      closeButtonIdx = j;
      break;
    }
  }
  if (closeButtonIdx !== -1) {
    console.log("Found Add New Room button at line", addRoomBtnIdx + 1, "to", closeButtonIdx + 1);
    const oldBtnLines = lines.slice(addRoomBtnIdx + 1, closeButtonIdx + 1); // skip comment line
    const oldBtnBlock = oldBtnLines.join('\n');
    const newBtnBlock = `                                             {(kmListingForm.roomTypes?.length || 0) < (kmListingForm.totalRooms || 0) ? (
${oldBtnBlock}
                                             ) : (
                                                 <div className="text-center py-4 text-[#584235] text-xs font-bold bg-[#fff4eb] rounded-xl border border-dashed border-[#ffe2cc] leading-normal p-3">
                                                     Target jumlah kamar ({kmListingForm.totalRooms}) telah tercapai.
                                                     <br />
                                                     <span className="text-[10px] text-gray-500 font-normal italic">
                                                         * Hapus kamar aktif atau kembali ke Step 1 untuk menaikkan kapasitas kamar properti.
                                                     </span>
                                                 </div>
                                             )}`;
    lines.splice(addRoomBtnIdx + 1, closeButtonIdx - addRoomBtnIdx, newBtnBlock);
    
    let finalContent = lines.join('\n');
    // Convert back to CRLF
    finalContent = finalContent.replace(/\n/g, '\r\n');
    fs.writeFileSync(targetFile, finalContent, 'utf8');
    console.log("Add New Room button block wrapped successfully!");
  } else {
    console.log("CRITICAL: closeButtonIdx NOT found!");
  }
} else {
  console.log("CRITICAL: addRoomBtnIdx NOT found!");
}
