const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = `                                                     {['WiFi', 'Dapur Bersama', 'Area Parkir', 'Ruang Tamu', 'CCTV', 'Laundry'].map(fac => {
                                                          const isChecked = checkHasFacility(kmListingForm.facilities, fac);
                                                          return (
                                                              <label key={fac} className={\`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all \${isChecked ? 'border-[#ff7a00] bg-orange-50/50 text-[#584235] font-bold' : 'border-[#e0c0af] bg-[#f8f9ff] text-gray-600'}\`}>
                                                                  <input 
                                                                      type="checkbox"
                                                                      checked={isChecked}
                                                                      onChange={() => {
                                                                          const current = kmListingForm.facilities || [];
                                                                          const hasIt = checkHasFacility(current, fac);
                                                                          let updated;
                                                                          if (hasIt) {
                                                                              const normalizedTarget = fac.toLowerCase().trim();
                                                                              const synonyms: Record<string, string[]> = {
                                                                                  'wifi': ['wifi', 'wi-fi', 'internet'],
                                                                                  'dapur bersama': ['dapur', 'dapur bersama', 'dapur umum'],
                                                                                  'area parkir': ['parkir', 'parkiran', 'tempat parkir', 'area parkir', 'parkir motor', 'parkir mobil'],
                                                                                  'ruang tamu': ['ruang tamu', 'ruang santai'],
                                                                                  'cctv': ['cctv', 'kamera keamanan'],
                                                                                  'laundry': ['laundry', 'mesin cuci', 'cuci']
                                                                              };
                                                                              const targetSyns = synonyms[normalizedTarget] || [normalizedTarget];
                                                                              updated = current.filter((f: string) => {
                                                                                  const nf = (f || '').toLowerCase().trim();
                                                                                  return !targetSyns.some(syn => nf.includes(syn) || syn.includes(nf));
                                                                              });
                                                                          } else {
                                                                              updated = [...current, fac];
                                                                          }
                                                                          setKmListingForm({ ...kmListingForm, facilities: updated });
                                                                      }}
                                                                      className="rounded text-[#ff7a00] focus:ring-[#ff7a00] border-gray-300 w-4 h-4"
                                                                  />
                                                                  <span className="text-xs uppercase tracking-wider">{fac}</span>
                                                              </label>
                                                          );
                                                      })}
                                                </div>`;

const replacementStr = `                                                     {['WiFi', 'Dapur Bersama', 'Area Parkir', 'Ruang Tamu', 'CCTV', 'Laundry'].map(fac => {
                                                          const isChecked = checkHasFacility(kmListingForm.facilities, fac);
                                                          return (
                                                              <label key={fac} className={\`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all \${isChecked ? 'border-[#ff7a00] bg-orange-50/50 text-[#584235] font-bold' : 'border-[#e0c0af] bg-[#f8f9ff] text-gray-600'}\`}>
                                                                  <input 
                                                                      type="checkbox"
                                                                      checked={isChecked}
                                                                      onChange={() => {
                                                                          const current = kmListingForm.facilities || [];
                                                                          const hasIt = checkHasFacility(current, fac);
                                                                          let updated;
                                                                          if (hasIt) {
                                                                              const normalizedTarget = fac.toLowerCase().trim();
                                                                              const synonyms: Record<string, string[]> = {
                                                                                  'wifi': ['wifi', 'wi-fi', 'internet'],
                                                                                  'dapur bersama': ['dapur', 'dapur bersama', 'dapur umum'],
                                                                                  'area parkir': ['parkir', 'parkiran', 'tempat parkir', 'area parkir', 'parkir motor', 'parkir mobil'],
                                                                                  'ruang tamu': ['ruang tamu', 'ruang santai'],
                                                                                  'cctv': ['cctv', 'kamera keamanan'],
                                                                                  'laundry': ['laundry', 'mesin cuci', 'cuci']
                                                                              };
                                                                              const targetSyns = synonyms[normalizedTarget] || [normalizedTarget];
                                                                              updated = current.filter((f: string) => {
                                                                                  const nf = (f || '').toLowerCase().trim();
                                                                                  return !targetSyns.some(syn => nf.includes(syn) || syn.includes(nf));
                                                                              });
                                                                          } else {
                                                                              updated = [...current, fac];
                                                                          }
                                                                          setKmListingForm({ ...kmListingForm, facilities: updated });
                                                                      }}
                                                                      className="rounded text-[#ff7a00] focus:ring-[#ff7a00] border-gray-300 w-4 h-4"
                                                                  />
                                                                  <span className="text-xs uppercase tracking-wider">{fac}</span>
                                                              </label>
                                                          );
                                                      })}
                                                </div>

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
                                                )}`;

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
    console.error("Could not find the target checkbox layout block in the file!");
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
