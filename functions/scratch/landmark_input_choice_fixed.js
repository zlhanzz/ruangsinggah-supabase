const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

// 1. Declare state variable for input choice method if not already present
let stateSearchIdx = lines.findIndex(l => l.includes("const [newLandmarkName, setNewLandmarkName] = useState('');"));
if (stateSearchIdx !== -1 && !lines.some(l => l.includes('landmarkInputMethod'))) {
  lines.splice(stateSearchIdx + 1, 0, "    const [landmarkInputMethod, setLandmarkInputMethod] = useState<'search' | 'gmaps'>('search');");
  console.log("landmarkInputMethod state successfully declared.");
}

// 2. Find Form Tambah Landmark block boundaries
const startIdx = lines.findIndex(l => l.includes('Form Tambah Landmark') && l.includes('span'));
const endIdx = lines.findIndex((l, idx) => idx > startIdx && l.includes('Simpan Landmark'));

if (startIdx !== -1 && endIdx !== -1) {
  // Find ") : ("
  let formContainerStart = startIdx - 1;
  while (formContainerStart > 0 && !lines[formContainerStart].includes(') : (')) {
    formContainerStart--;
  }
  
  // Find the button container start line index
  let formContainerEnd = endIdx;
  while (formContainerEnd > startIdx && !lines[formContainerEnd].includes('className="flex gap-2 mt-2"')) {
    formContainerEnd--;
  }
  
  console.log(`Replacing landmark form container from line ${formContainerStart + 1} to ${formContainerEnd + 1}`);

  const formReplacement = `                                                     ) : (
                                                         <div className="flex flex-col gap-3 bg-[#fdfdfd] p-3 rounded-lg border border-[#e0c0af]/50 mt-1">
                                                             <div className="flex justify-between items-center mb-0.5">
                                                                 <span className="text-[10px] font-bold text-[#584235] uppercase tracking-wider">Form Tambah Landmark</span>
                                                                 <button
                                                                     type="button"
                                                                     onClick={() => {
                                                                         setNewLandmarkName('');
                                                                         setGoogleMapsUrlInput('');
                                                                         setShowAddLandmarkForm(false);
                                                                     }}
                                                                     className="text-gray-450 hover:text-gray-650 text-xs font-bold"
                                                                 >
                                                                     Batal
                                                                 </button>
                                                             </div>

                                                             {/* Choice Selection Tabs */}
                                                             <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                                                                 <button
                                                                     type="button"
                                                                     onClick={() => setLandmarkInputMethod('search')}
                                                                     className={\`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all \\\${landmarkInputMethod === 'search' ? 'bg-white text-[#ff7a00] shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
                                                                 >
                                                                     Cari Nama Lokasi
                                                                 </button>
                                                                 <button
                                                                     type="button"
                                                                     onClick={() => setLandmarkInputMethod('gmaps')}
                                                                     className={\`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all \\\${landmarkInputMethod === 'gmaps' ? 'bg-white text-[#ff7a00] shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
                                                                 >
                                                                     Konversi Link GMaps
                                                                 </button>
                                                             </div>

                                                             {/* Conditional Input Methods */}
                                                             {landmarkInputMethod === 'search' ? (
                                                                 <div className="flex flex-col gap-1 w-full relative">
                                                                     <div className="flex gap-2 w-full">
                                                                         <input 
                                                                             type="text"
                                                                             placeholder="Nama Landmark (misal: Universitas Hasanuddin)"
                                                                             value={newLandmarkName}
                                                                             onChange={e => setNewLandmarkName(e.target.value)}
                                                                             className="flex-1 h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                         />
                                                                         <button
                                                                             type="button"
                                                                             onClick={async () => {
                                                                                 if (!newLandmarkName.trim()) {
                                                                                     alert('Ketik nama landmark / bangunan yang dicari terlebih dahulu');
                                                                                     return;
                                                                                 }
                                                                                 try {
                                                                                     const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(newLandmarkName)}&limit=1\`);
                                                                                     const data = await res.json();
                                                                                     if (data && data.length > 0) {
                                                                                         const found = {
                                                                                             lat: parseFloat(data[0].lat),
                                                                                             lng: parseFloat(data[0].lon)
                                                                                         };
                                                                                         setLandmarkLocation(found);
                                                                                         setLandmarkSuggestions([]);
                                                                                         alert(\`Lokasi ditemukan: \${data[0].display_name}\`);
                                                                                     } else {
                                                                                         alert('Lokasi tidak ditemukan di peta. Coba masukkan nama jalan/daerah yang lebih umum atau gunakan link Google Maps.');
                                                                                     }
                                                                                 } catch (err) {
                                                                                     console.error(err);
                                                                                     alert('Gagal melakukan pencarian lokasi.');
                                                                                 }
                                                                             }}
                                                                             className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#ff7a00] font-bold text-xs uppercase px-3 rounded-lg border border-[#e0c0af] transition-colors"
                                                                         >
                                                                             Cari
                                                                         </button>
                                                                     </div>
                                                                     
                                                                     {/* Floating Autocomplete Suggestions */}
                                                                     {landmarkSuggestions.length > 0 && (
                                                                         <div className="absolute top-[40px] left-0 right-0 bg-white border border-[#e0c0af] rounded-lg shadow-xl z-[9999] max-h-48 overflow-y-auto divide-y divide-gray-100">
                                                                             {landmarkSuggestions.map((suggestion, idx) => (
                                                                                 <div 
                                                                                     key={idx}
                                                                                     onClick={() => {
                                                                                         const shortName = suggestion.display_name.split(',')[0];
                                                                                         setNewLandmarkName(shortName);
                                                                                         setLandmarkLocation({
                                                                                             lat: parseFloat(suggestion.lat),
                                                                                             lng: parseFloat(suggestion.lon)
                                                                                         });
                                                                                         setLandmarkSuggestions([]);
                                                                                     }}
                                                                                     className="p-2.5 text-[10px] text-gray-700 font-medium hover:bg-orange-50 cursor-pointer transition-colors text-left truncate"
                                                                                     title={suggestion.display_name}
                                                                                 >
                                                                                     📍 {suggestion.display_name}
                                                                                 </div>
                                                                             ))}
                                                                         </div>
                                                                     )}
                                                                 </div>
                                                             ) : (
                                                                 <div className="flex flex-col gap-2 w-full">
                                                                     {/* GMaps URL Input */}
                                                                     <div className="flex flex-col gap-1">
                                                                         <span className="text-[9px] font-bold text-[#584235] uppercase tracking-wider">Konversi Link Google Maps / Koordinat:</span>
                                                                         <div className="flex gap-2">
                                                                             <input 
                                                                                 type="text"
                                                                                 placeholder="Tempel link Google Maps / koordinat raw"
                                                                                 value={googleMapsUrlInput}
                                                                                 onChange={e => {
                                                                                     setGoogleMapsUrlInput(e.target.value);
                                                                                     const parsed = parseGoogleMapsUrl(e.target.value);
                                                                                     if (parsed) {
                                                                                         setLandmarkLocation(parsed);
                                                                                         if (parsed.name) {
                                                                                             setNewLandmarkName(parsed.name);
                                                                                         }
                                                                                     }
                                                                                 }}
                                                                                 className="flex-1 h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white outline-none"
                                                                             />
                                                                             <button
                                                                                 type="button"
                                                                                 onClick={async () => {
                                                                                     const parsed = parseGoogleMapsUrl(googleMapsUrlInput);
                                                                                     if (parsed) {
                                                                                         setLandmarkLocation(parsed);
                                                                                         if (parsed.name) {
                                                                                             setNewLandmarkName(parsed.name);
                                                                                         }
                                                                                         alert('Berhasil mengonversi koordinat dari input!');
                                                                                     } else if (googleMapsUrlInput.includes('maps.app.goo.gl') || googleMapsUrlInput.includes('goo.gl')) {
                                                                                         alert('Mengonversi short link Google Maps... Silakan tunggu sebentar.');
                                                                                         const shortParsed = await parseShortLinkCoordinates(googleMapsUrlInput);
                                                                                         if (shortParsed) {
                                                                                             setLandmarkLocation(shortParsed);
                                                                                             if (shortParsed.name) {
                                                                                                 setNewLandmarkName(shortParsed.name);
                                                                                             }
                                                                                             alert('Berhasil mengonversi koordinat dari short link maps!');
                                                                                         } else {
                                                                                             alert('Gagal mengonversi short link. Pastikan link maps valid dan aktif.');
                                                                                         }
                                                                                     } else {
                                                                                         alert('Format tidak dikenali atau koordinat tidak ditemukan.');
                                                                                     }
                                                                                 }}
                                                                                 className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#264191] font-bold text-xs uppercase px-3 rounded-lg border border-[#d3e4fe] transition-colors"
                                                                             >
                                                                                 Konversi
                                                                             </button>
                                                                         </div>
                                                                     </div>

                                                                     {/* Extracted Landmark Name Review */}
                                                                     <div className="flex flex-col gap-1">
                                                                         <span className="text-[9px] font-bold text-[#584235] uppercase tracking-wider">Nama Landmark (Hasil Konversi / Edit):</span>
                                                                         <input 
                                                                             type="text"
                                                                             placeholder="Nama bangunan hasil konversi"
                                                                             value={newLandmarkName}
                                                                             onChange={e => setNewLandmarkName(e.target.value)}
                                                                             className="w-full h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                         />
                                                                     </div>
                                                                 </div>
                                                             )}

                                                             {/* Map Preview and Location Coordinates */}
                                                             <div className="flex flex-col gap-1 w-full mt-1">
                                                                 <span className="text-[9px] font-bold text-[#584235] uppercase tracking-wider">Tentukan Lokasi Landmark di Peta:</span>
                                                                 <div ref={kmLandmarkMapRef} className="w-full h-32 z-0 relative rounded-lg border border-[#e0c0af]" style={{ minHeight: '120px' }} />
                                                                 <p className="text-[8px] text-gray-500 font-mono mt-1 bg-white px-2 py-0.5 rounded border border-gray-200 self-end shadow-sm">
                                                                     Lat: {landmarkLocation.lat.toFixed(6)}, Lng: {landmarkLocation.lng.toFixed(6)}
                                                                 </p>
                                                             </div>`;
  
  lines.splice(formContainerStart, formContainerEnd - formContainerStart, formReplacement);
  console.log("Landmark form block successfully replaced with tab-choice layout.");
} else {
  console.error("CRITICAL: landmark form boundaries not found!", { startIdx, endIdx });
}

const finalResult = lines.join('\n');

// Convert back to CRLF
content = finalResult.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
