const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

// 1. Find the bottom editor block in the original file
const editorStartIdx = lines.findIndex(l => l.includes('Active Entry: Existing Room Detail Editor'));
if (editorStartIdx === -1) {
  if (content.includes('renderRoomEditor')) {
    console.log("Accordion layout already present in AgentDashboard.tsx. Skipping.");
    process.exit(0);
  }
  console.error("CRITICAL: Active Entry: Existing Room Detail Editor comment not found!");
  process.exit(1);
}

// Find {temporaryRoom === null && activeRoomIdx !== null ... && (() => {
let matchIdx = -1;
for (let i = editorStartIdx; i < lines.length; i++) {
  if (lines[i].includes('temporaryRoom === null && activeRoomIdx !== null') && lines[i].includes('(() => {')) {
    matchIdx = i;
    break;
  }
}

if (matchIdx === -1) {
  console.error("CRITICAL: editor match start line not found!");
  process.exit(1);
}

// Find ending line })()} before STEP 3
let step3Idx = lines.findIndex(l => l.includes('STEP 3: REVIEW'));
if (step3Idx === -1) {
  console.error("CRITICAL: STEP 3: REVIEW comment not found!");
  process.exit(1);
}

let endIdx = step3Idx;
while (endIdx > matchIdx && !lines[endIdx].includes('})()}')) {
  endIdx--;
}

if (endIdx === matchIdx) {
  console.error("CRITICAL: editor end line })()} not found!");
  process.exit(1);
}

console.log(`Found bottom editor block from line ${matchIdx + 1} to ${endIdx + 1}`);

// Extract the form content (inside p-4 space-y-5)
let innerStartIdx = -1;
for (let i = matchIdx; i <= endIdx; i++) {
  if (lines[i].includes('className="p-4 space-y-5"')) {
    innerStartIdx = i;
    break;
  }
}

let innerEndIdx = endIdx;
while (innerEndIdx > innerStartIdx && !lines[innerEndIdx].includes('Selesai & Tutup Editor')) {
  innerEndIdx--;
}
// Include the button close div
while (innerEndIdx < endIdx && !lines[innerEndIdx].includes('</div>')) {
  innerEndIdx++;
}

if (innerStartIdx === -1 || innerEndIdx === -1) {
  console.error(`CRITICAL: inner form boundaries not found! innerStartIdx: ${innerStartIdx}, innerEndIdx: ${innerEndIdx}`);
  process.exit(1);
}

console.log(`Extracted inner form from line ${innerStartIdx + 1} to ${innerEndIdx + 1}`);

const innerFormContent = lines.slice(innerStartIdx + 1, innerEndIdx).join('\n');

const renderRoomEditorDeclaration = `    const renderRoomEditor = (rt: any, idx: number) => {
        const activeRoomIdx = idx;
        const isOccupied = rt.isAvailable === false || rt.status === 'Terisi';
        return (
            <div className="p-4 space-y-5 cursor-default text-left border-t border-[#ffe2cc] bg-[#fffcfb]" onClick={e => e.stopPropagation()}>
${innerFormContent}
                
                {/* Selesai & Tutup Editor Button */}
                <button 
                    type="button"
                    onClick={() => {
                        setActiveRoomIdx(null);
                        alert('Perubahan kamar berhasil disimpan!');
                    }}
                    className="w-full h-[40px] bg-[#eff4ff] hover:bg-[#dce9ff] text-[#264191] font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center transition-colors border border-[#d3e4fe] shadow-sm mt-4"
                >
                    Selesai & Simpan Kamar
                </button>
            </div>
        );
    };`;

// 2. Locate roomTypes map block in original file
const mapStartIdx = lines.findIndex(l => l.includes('kmListingForm.roomTypes.map((rt: any, idx: number) => {'));
if (mapStartIdx === -1) {
  console.error("CRITICAL: roomTypes.map not found!");
  process.exit(1);
}

let returnIdx = -1;
for (let i = mapStartIdx; i < lines.length; i++) {
  if (lines[i].includes('return (')) {
    returnIdx = i;
    break;
  }
}

// Find the matching ); at the end of the return statement by checking indentation
const returnLine = lines[returnIdx];
const leadingSpaces = returnLine.match(/^\s*/)[0];
let mapEndIdx = -1;
for (let i = returnIdx + 1; i < lines.length; i++) {
  if (lines[i].startsWith(leadingSpaces + ');')) {
    mapEndIdx = i;
    break;
  }
}

if (returnIdx === -1 || mapEndIdx === -1) {
  console.error(`CRITICAL: map boundaries not found! returnIdx: ${returnIdx}, mapEndIdx: ${mapEndIdx}`);
  process.exit(1);
}

console.log(`Found map block return from line ${returnIdx + 1} to ${mapEndIdx + 1}`);

const accordionReplacement = `                                                              return (
                                                                  <div 
                                                                      key={idx} 
                                                                      className={\`bg-white hover:shadow-md rounded-xl border transition-all cursor-pointer overflow-hidden \${isActive ? 'border-[#ff7a00] ring-1 ring-[#ff7a00] shadow-sm' : 'border-gray-200'}\`}
                                                                  >
                                                                      {/* Card Header (Clickable for Expand/Collapse) */}
                                                                      <div 
                                                                          onClick={() => {
                                                                              setTemporaryRoom(null);
                                                                              if (isActive) {
                                                                                  setActiveRoomIdx(null);
                                                                              } else {
                                                                                  setActiveRoomIdx(idx);
                                                                              }
                                                                          }}
                                                                          className="p-4 flex justify-between items-center"
                                                                      >
                                                                          <div className="flex items-center gap-3">
                                                                              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-[#ff7a00]">
                                                                                  <span className="material-symbols-outlined">bed</span>
                                                                              </div>
                                                                              <div>
                                                                                  <p className="text-xs font-bold text-gray-900">{rt.name || \`Kamar \${idx + 1}\`}</p>
                                                                                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                                                                                      {rt.floor || 'Lantai 1'} • {rt.type || 'Standard'}
                                                                                  </p>
                                                                              </div>
                                                                          </div>
                                                                          <div className="flex items-center gap-2">
                                                                              {isOccupied ? (
                                                                                  <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider border border-green-200">Terisi</span>
                                                                              ) : (
                                                                                  <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-[10px] font-black uppercase tracking-wider border border-orange-200">Kosong</span>
                                                                              )}
                                                                              <button
                                                                                  type="button"
                                                                                  onClick={(e) => {
                                                                                      e.stopPropagation();
                                                                                      const updated = kmListingForm.roomTypes.filter((_: any, rIdx: number) => rIdx !== idx);
                                                                                      setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                      if (activeRoomIdx === idx) {
                                                                                          setActiveRoomIdx(null);
                                                                                      } else if (activeRoomIdx !== null && activeRoomIdx > idx) {
                                                                                          setActiveRoomIdx(activeRoomIdx - 1);
                                                                                      }
                                                                                  }}
                                                                                  className="text-red-500 hover:text-red-700 p-1.5 rounded-lg mr-1"
                                                                              >
                                                                                  <span className="material-symbols-outlined text-base">delete</span>
                                                                              </button>
                                                                              <span 
                                                                                  className="material-symbols-outlined text-gray-400 transition-transform duration-300"
                                                                                  style={{ transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                                                              >
                                                                                  keyboard_arrow_down
                                                                              </span>
                                                                          </div>
                                                                      </div>

                                                                      {/* Accordion Body */}
                                                                      <div 
                                                                          style={{
                                                                              display: 'grid',
                                                                              gridTemplateRows: isActive ? '1fr' : '0fr',
                                                                              transition: 'grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease-in-out',
                                                                              opacity: isActive ? 1 : 0
                                                                          }}
                                                                      >
                                                                          <div style={{ minHeight: 0, overflow: 'hidden' }}>
                                                                              {renderRoomEditor(rt, idx)}
                                                                          </div>
                                                                      </div>
                                                                  </div>
                                                              );`;

// Find where renderTasks is declared in original file
const renderTasksIdx = lines.findIndex(l => l.includes('const renderTasks = () => {'));
if (renderTasksIdx === -1) {
  console.error("CRITICAL: const renderTasks = () => { not found!");
  process.exit(1);
}

// Apply edits bottom-to-top
console.log(`Removing old bottom editor block from line ${editorStartIdx + 1} to ${endIdx + 1}`);
lines.splice(editorStartIdx, (endIdx - editorStartIdx + 1));

console.log(`Replacing map return block from line ${returnIdx + 1} to ${mapEndIdx + 1}`);
lines.splice(returnIdx, (mapEndIdx - returnIdx + 1), accordionReplacement);

console.log(`Declaring renderRoomEditor at line ${renderTasksIdx + 1}`);
lines.splice(renderTasksIdx, 0, renderRoomEditorDeclaration);

// Write file
let finalOutput = lines.join('\n');
finalOutput = finalOutput.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalOutput, 'utf8');
console.log("Room list editor transformed to helper and accordion integration completed successfully.");
