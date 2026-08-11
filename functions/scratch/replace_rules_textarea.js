const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = `                                                     {kmListingForm.rules && kmListingForm.rules.map((rule: string, rIdx: number) => (
                                                         <div key={rIdx} className="flex items-center gap-2">
                                                             <input 
                                                                 type="text"
                                                                 value={rule}
                                                                 onChange={e => {
                                                                     const updated = [...(kmListingForm.rules || [])];
                                                                     updated[rIdx] = e.target.value;
                                                                     setKmListingForm({ ...kmListingForm, rules: updated });
                                                                 }}
                                                                 className="flex-1 h-[38px] px-3 border border-[#8c7263] rounded-lg text-xs bg-white"
                                                             />`;

const replacementStr = `                                                     {kmListingForm.rules && kmListingForm.rules.map((rule: string, rIdx: number) => (
                                                         <div key={rIdx} className="flex items-center gap-2">
                                                             <textarea 
                                                                 value={rule}
                                                                 rows={2}
                                                                 maxLength={100}
                                                                 onChange={e => {
                                                                     const updated = [...(kmListingForm.rules || [])];
                                                                     updated[rIdx] = e.target.value.slice(0, 100);
                                                                     setKmListingForm({ ...kmListingForm, rules: updated });
                                                                 }}
                                                                 className="flex-1 min-h-[50px] p-2 border border-[#8c7263] rounded-lg text-[11px] bg-white resize-none leading-normal outline-none focus:ring-1 focus:ring-[#ff7a00]"
                                                             />`;

// Let's replace the first one with direct search-and-replace using regex or clean string
const escapedTarget = targetStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
content = content.replace(new RegExp(escapedTarget), replacementStr);

const inputTargetStr = `                                                    <div className="flex gap-2 mt-1">
                                                         <input 
                                                             type="text"
                                                             placeholder="Tambah peraturan baru..."
                                                             value={newRuleName}
                                                             onChange={e => setNewRuleName(e.target.value)}
                                                             className="flex-1 h-[36px] px-3 border border-gray-300 rounded-lg text-xs bg-white"
                                                         />`;

const inputReplacementStr = `                                                    <div className="flex gap-2 mt-1">
                                                         <input 
                                                             type="text"
                                                             placeholder="Tambah peraturan baru..."
                                                             value={newRuleName}
                                                             maxLength={100}
                                                             onChange={e => setNewRuleName(e.target.value.slice(0, 100))}
                                                             className="flex-1 h-[36px] px-3 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                                         />`;

const escapedInputTarget = inputTargetStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
content = content.replace(new RegExp(escapedInputTarget), inputReplacementStr);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Regex replacement done.");
