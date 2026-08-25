const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');

// Add warning overlay INSIDE the bg-[#f8f9ff] content div, right after it opens
// This overlay uses absolute positioning to cover the content
// When warningAccepted is false AND isExistingPropertyMigration is true, it covers everything

const TARGET = `<div className="bg-[#f8f9ff] text-[#0b1c30] w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 flex flex-col h-[90vh] max-h-[880px] overflow-hidden animate-in zoom-in-95 font-['Plus_Jakarta_Sans']">
                            
                            {/* TopAppBar header */}`;

const REPLACEMENT = `<div className="bg-[#f8f9ff] text-[#0b1c30] w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 flex flex-col h-[90vh] max-h-[880px] overflow-hidden animate-in zoom-in-95 font-['Plus_Jakarta_Sans']">
                            
                            {/* Warning overlay for existing property migration */}
                            {isExistingPropertyMigration && !warningAccepted && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-[#f8f9ff]/95 backdrop-blur-sm rounded-3xl">
                                    <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-5 border border-orange-100">
                                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-4xl text-orange-500">warning_amber</span>
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-extrabold text-[#0b1c30] mb-2">Peninjauan Ulang Data</h3>
                                            <p className="text-sm text-[#584235] leading-relaxed font-medium">
                                                Beberapa data secara otomatis sudah terisi, lakukan peninjauan ulang untuk memastikan kesesuaian data sudah benar.
                                            </p>
                                        </div>
                                        <div className="flex gap-3 w-full">
                                            <button
                                                type="button"
                                                onClick={closeKostManagerListing}
                                                className="flex-1 h-12 border border-gray-300 text-[#584235] rounded-full font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors"
                                            >
                                                Keluar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setWarningAccepted(true)}
                                                className="flex-[2] h-12 bg-[#ff7a00] hover:bg-orange-600 text-white rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
                                            >
                                                <span className="material-symbols-outlined text-base">check_circle</span>
                                                Saya Mengerti
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TopAppBar header */}`;

if (code.includes(TARGET)) {
    code = code.replace(TARGET, REPLACEMENT);
    console.log('Warning overlay successfully injected inside content div.');
    fs.writeFileSync(targetFile, code, 'utf8');
} else {
    console.error('TARGET not found!');
    const idx = code.indexOf('bg-[#f8f9ff] text-[#0b1c30] w-full max-w-2xl');
    if (idx > -1) {
        console.log('Found similar text at char', idx);
        console.log(JSON.stringify(code.substring(idx, idx + 200)));
    }
}
