const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// Regex to match the Nama Landmark input robustly, ignoring exact indentation
const inputRegex = /<input\s+type="text"\s+placeholder="Nama Landmark \(misal: Universitas Hasanuddin\)"\s+value=\{newLandmarkName\}\s+onChange=\{e\s*=>\s*setNewLandmarkName\(e\.target\.value\)\}\s+className="[^"]+"\s*\/>/;

if (inputRegex.test(content)) {
  const match = content.match(inputRegex)[0];
  // Extract indentation from the match if possible, or use standard spacing
  const indentMatch = content.match(new RegExp('\n(\\s*)' + match.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')));
  const indent = indentMatch ? indentMatch[1] : '                                                             ';
  
  const replacement = `<div className="flex gap-2 w-full">
${indent}    <input 
${indent}        type="text"
${indent}        placeholder="Nama Landmark (misal: Universitas Hasanuddin)"
${indent}        value={newLandmarkName}
${indent}        onChange={e => setNewLandmarkName(e.target.value)}
${indent}        className="flex-1 h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
${indent}    />
${indent}    <button
${indent}        type="button"
${indent}        onClick={async () => {
${indent}            if (!newLandmarkName.trim()) {
${indent}                alert('Ketik nama landmark / bangunan yang dicari terlebih dahulu');
${indent}                return;
${indent}            }
${indent}            try {
${indent}                const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(newLandmarkName)}&limit=1\`);
${indent}                const data = await res.json();
${indent}                if (data && data.length > 0) {
${indent}                    const found = {
${indent}                        lat: parseFloat(data[0].lat),
${indent}                        lng: parseFloat(data[0].lon)
${indent}                    };
${indent}                    setLandmarkLocation(found);
${indent}                    alert(\`Lokasi ditemukan: \${data[0].display_name}\`);
${indent}                } else {
${indent}                    alert('Lokasi tidak ditemukan di peta. Coba masukkan nama jalan/daerah yang lebih umum atau gunakan link Google Maps.');
${indent}                }
${indent}            } catch (err) {
${indent}                console.error(err);
${indent}                alert('Gagal melakukan pencarian lokasi.');
${indent}            }
${indent}        }}
${indent}        className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#ff7a00] font-bold text-xs uppercase px-3 rounded-lg border border-[#e0c0af] transition-colors"
${indent}    >
${indent}        Cari Lokasi
${indent}    </button>
${indent}</div>`;

  content = content.replace(match, replacement);
  console.log("Landmark search input successfully integrated via regex.");
} else {
  console.error("CRITICAL: Landmark input search target regex match not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
