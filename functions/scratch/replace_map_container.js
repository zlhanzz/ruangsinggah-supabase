const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = `                                                 <div className="border border-[#8c7263] rounded-xl overflow-hidden flex flex-col bg-[#f8f9ff]">
                                                     <div className="w-full h-36 bg-[#dce9ff] relative flex flex-col items-center justify-center p-3 text-center">
                                                         <span className="material-symbols-outlined text-[#ff7a00] text-4xl mb-1">location_on</span>
                                                         <p className="text-xs font-bold text-[#0b1c30]">Koordinat Terkunci</p>
                                                         <p className="text-[10px] text-gray-500 font-mono mt-1">Lat: {kmListingForm.location?.lat?.toFixed(6) || '-'}, Lng: {kmListingForm.location?.lng?.toFixed(6) || '-'}</p>
                                                     </div>`;

const replacementStr = `                                                 <div className="border border-[#e0c0af] rounded-xl overflow-hidden flex flex-col bg-[#f8f9ff]">
                                                     <div ref={kmMapRef} className="w-full h-40 z-0 relative" style={{ minHeight: '160px' }} />
                                                     <div className="bg-slate-50 border-t border-gray-100 p-2 flex justify-between items-center">
                                                         <p className="text-[10px] text-gray-700 font-black uppercase tracking-wider flex items-center gap-1">
                                                             <span className="material-symbols-outlined text-xs text-[#ff7a00]" style={{ fontVariationSettings: '"FILL" 1' }}>location_on</span>
                                                             Koordinat Terkunci
                                                         </p>
                                                         <p className="text-[9px] text-gray-500 font-mono bg-white px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                                                             Lat: {kmListingForm.location?.lat?.toFixed(6) || '-'}, Lng: {kmListingForm.location?.lng?.toFixed(6) || '-'}
                                                         </p>
                                                     </div>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log("Successfully replaced exact!");
} else {
  const cleanTarget = targetStr.replace(/\s+/g, ' ');
  const cleanContent = content.replace(/\s+/g, ' ');
  if (cleanContent.includes(cleanTarget)) {
    const escaped = targetStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    content = content.replace(new RegExp(escaped), replacementStr);
    console.log("Successfully replaced via regex!");
  } else {
    console.error("Could not find the target map container block in the file!");
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
