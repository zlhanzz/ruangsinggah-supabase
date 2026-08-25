const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Declare state and useEffect after newLandmarkName state declaration
const stateTarget = `    const [newRuleName, setNewRuleName] = useState('');
    const [newLandmarkName, setNewLandmarkName] = useState('');`;

const stateReplacement = `    const [newRuleName, setNewRuleName] = useState('');
    const [newLandmarkName, setNewLandmarkName] = useState('');
    const [landmarkSuggestions, setLandmarkSuggestions] = useState<any[]>([]);

    useEffect(() => {
        if (!newLandmarkName || newLandmarkName.trim().length < 3) {
            setLandmarkSuggestions([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(newLandmarkName)}&limit=5\`);
                const data = await res.json();
                if (data) {
                    setLandmarkSuggestions(data);
                }
            } catch (e) {
                console.error("Suggestion fetch failed:", e);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [newLandmarkName]);`;

if (content.includes(stateTarget)) {
  content = content.replace(stateTarget, stateReplacement);
  console.log("Landmark autocomplete states and hook successfully declared after newLandmarkName.");
} else {
  console.error("CRITICAL: newLandmarkName state declaration not found!");
}

// 2. Replace the search layout inside Landmark Form
const formRegex = /<div className="flex gap-2 w-full">\s*<input\s+type="text"\s+placeholder="Nama Landmark \(misal: Universitas Hasanuddin\)"\s+value=\{newLandmarkName\}\s+onChange=\{e\s*=>\s*setNewLandmarkName\(e\.target\.value\)\}\s+className="[^"]+"\s*\/>[\s\S]*?<\/button>\s*<\/div>/;

if (formRegex.test(content)) {
  const match = content.match(formRegex)[0];
  const indentMatch = content.match(new RegExp('\n(\\s*)' + match.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').substring(0, 100)));
  const indent = indentMatch ? indentMatch[1] : '                                                             ';
  
  const replacement = `<div className="flex flex-col gap-1 w-full relative">
${indent}    <div className="flex gap-2 w-full">
${indent}        <input 
${indent}            type="text"
${indent}            placeholder="Nama Landmark (misal: Universitas Hasanuddin)"
${indent}            value={newLandmarkName}
${indent}            onChange={e => setNewLandmarkName(e.target.value)}
${indent}            className="flex-1 h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
${indent}        />
${indent}        <button
${indent}            type="button"
${indent}            onClick={async () => {
${indent}                if (!newLandmarkName.trim()) {
${indent}                    alert('Ketik nama landmark / bangunan yang dicari terlebih dahulu');
${indent}                    return;
${indent}                }
${indent}                try {
${indent}                    const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(newLandmarkName)}&limit=1\`);
${indent}                    const data = await res.json();
${indent}                    if (data && data.length > 0) {
${indent}                        const found = {
${indent}                            lat: parseFloat(data[0].lat),
${indent}                            lng: parseFloat(data[0].lon)
${indent}                        };
${indent}                        setLandmarkLocation(found);
${indent}                        setLandmarkSuggestions([]);
${indent}                        alert(\`Lokasi ditemukan: \${data[0].display_name}\`);
${indent}                    } else {
${indent}                        alert('Lokasi tidak ditemukan di peta. Coba masukkan nama jalan/daerah yang lebih umum atau gunakan link Google Maps.');
${indent}                    }
${indent}                } catch (err) {
${indent}                    console.error(err);
${indent}                    alert('Gagal melakukan pencarian lokasi.');
${indent}                }
${indent}            }}
${indent}            className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#ff7a00] font-bold text-xs uppercase px-3 rounded-lg border border-[#e0c0af] transition-colors"
${indent}        >
${indent}            Cari
${indent}        </button>
${indent}    </div>
${indent}    
${indent}    {/* Floating Autocomplete Suggestions */}
${indent}    {landmarkSuggestions.length > 0 && (
${indent}        <div className="absolute top-[40px] left-0 right-0 bg-white border border-[#e0c0af] rounded-lg shadow-xl z-[9999] max-h-48 overflow-y-auto divide-y divide-gray-100">
${indent}            {landmarkSuggestions.map((suggestion, idx) => (
${indent}                <div 
${indent}                    key={idx}
${indent}                    onClick={() => {
${indent}                        const shortName = suggestion.display_name.split(',')[0];
${indent}                        setNewLandmarkName(shortName);
${indent}                        setLandmarkLocation({
${indent}                            lat: parseFloat(suggestion.lat),
${indent}                            lng: parseFloat(suggestion.lon)
${indent}                        });
${indent}                        setLandmarkSuggestions([]);
${indent}                    }}
${indent}                    className="p-2.5 text-[10px] text-gray-700 font-medium hover:bg-orange-50 cursor-pointer transition-colors text-left truncate"
${indent}                    title={suggestion.display_name}
${indent}                >
${indent}                    📍 {suggestion.display_name}
${indent}                </div>
${indent}            ))}
${indent}        </div>
${indent}    )}
${indent}</div>`;

  content = content.replace(match, replacement);
  console.log("Landmark autocomplete suggestion view integrated successfully.");
} else {
  console.error("CRITICAL: Landmark form regex match not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
