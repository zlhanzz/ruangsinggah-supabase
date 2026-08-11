const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = `                                                 </div>

                                                 <div className="flex gap-2 mt-2">`;

const replacementStr = `                                                 </div>

                                                 {/* Custom Facilities Badges */}
                                                 {kmListingForm.facilities && kmListingForm.facilities.filter((f: string) => !['wifi', 'dapur bersama', 'area parkir', 'ruang tamu', 'cctv', 'laundry'].includes(f.toLowerCase().trim())).length > 0 && (
                                                     <div className="flex flex-wrap gap-1.5 mt-2">
                                                         {kmListingForm.facilities.filter((f: string) => !['wifi', 'dapur bersama', 'area parkir', 'ruang tamu', 'cctv', 'laundry'].includes(f.toLowerCase().trim())).map((fac: string) => (
                                                             <span key={fac} className="inline-flex items-center gap-1.5 bg-[#eff4ff] text-[#264191] text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-[#d3e4fe]">
                                                                 <span>{fac}</span>
                                                                 <button
                                                                     type="button"
                                                                     onClick={() => {
                                                                         setKmListingForm({
                                                                             ...kmListingForm,
                                                                             facilities: kmListingForm.facilities.filter((f: string) => f !== fac)
                                                                         });
                                                                     }}
                                                                     className="text-red-500 hover:text-red-700 font-bold ml-1 text-[11px] leading-none"
                                                                 >
                                                                     &times;
                                                                 </button>
                                                             </span>
                                                         ))}
                                                     </div>
                                                 )}

                                                 <div className="flex gap-2 mt-2">`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log("Successfully replaced exact!");
} else {
  // Let's search with whitespace normalization
  const cleanTarget = targetStr.replace(/\s+/g, ' ');
  const cleanContent = content.replace(/\s+/g, ' ');
  if (cleanContent.includes(cleanTarget)) {
    const escaped = targetStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    content = content.replace(new RegExp(escaped), replacementStr);
    console.log("Successfully replaced using whitespace-insensitive regex!");
  } else {
    console.error("Could not find the target layout block in the file!");
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
