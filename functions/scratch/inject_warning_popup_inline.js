const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');

const renderTarget = `                {isEditingKostManager && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={closeKostManagerListing}></div>
                        <div className="bg-[#f8f9ff] text-[#0b1c30] w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 flex flex-col h-[90vh] max-h-[880px] overflow-hidden animate-in zoom-in-95 font-['Plus_Jakarta_Sans']">`;

const renderReplacement = `                {isEditingKostManager && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={closeKostManagerListing}></div>
                        
                        {isExistingPropertyMigration && !warningAccepted ? (
                            <div className="bg-white text-[#0b1c30] w-full max-w-md rounded-3xl p-8 shadow-2xl relative z-20 flex flex-col items-center gap-6 animate-in zoom-in-95 font-['Plus_Jakarta_Sans'] border border-orange-200">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-2">
                                    <span className="material-symbols-outlined text-4xl">warning</span>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-extrabold text-[#0b1c30] mb-3">Peninjauan Ulang Properti</h3>
                                    <p className="text-sm font-semibold text-[#584235] leading-relaxed">
                                        Beberapa data secara otomatis sudah terisi, lakukan peninjauan ulang untuk memastikan kesesuaian data sudah benar.
                                    </p>
                                </div>
                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        type="button"
                                        onClick={closeKostManagerListing}
                                        className="flex-1 h-[48px] border border-gray-300 text-[#584235] rounded-full font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors"
                                    >
                                        Keluar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setWarningAccepted(true)}
                                        className="flex-[2] h-[48px] bg-[#ff7a00] hover:bg-orange-600 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-sm">done</span>
                                        Saya Mengerti
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#f8f9ff] text-[#0b1c30] w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 flex flex-col h-[90vh] max-h-[880px] overflow-hidden animate-in zoom-in-95 font-['Plus_Jakarta_Sans']">`;

if (code.includes(renderTarget)) {
    code = code.replace(renderTarget, renderReplacement);
    console.log("Warning popup render target successfully injected.");
} else {
    console.error("ERROR: renderTarget not found! Dumping first 200 chars of modal start...");
    const idx = code.indexOf('isEditingKostManager && (');
    if (idx > -1) {
        console.log(JSON.stringify(code.substring(idx, idx + 500)));
    }
}

// Replace the closing container divs to match the conditional ternary statement
// Find the last </div> closing inside the modal and add )}
const lines = code.split('\n');
let modalEndIdx = -1;
for (let i = lines.length - 1; i >= 0; i--) {
    // Look for the pattern that closes the whole KostManager modal
    if (lines[i].trim() === '</div>' && lines[i+1] && lines[i+1].trim() === '</div>' && lines[i+2] && lines[i+2].trim() === ')}') {
        // This is the 3-layer closing of: inner div, backdrop div, modal wrapper
        if (lines[i-1] && lines[i-1].includes('</div>')) {
            modalEndIdx = i;
            break;
        }
    }
}

if (modalEndIdx > -1) {
    console.log(`Found modal closing at line: ${modalEndIdx + 1}`);
    // Insert )} before the second </div> to close the ternary conditional
    lines.splice(modalEndIdx + 1, 0, '                        )}');
    code = lines.join('\n');
    console.log("Closing ternary div successfully inserted.");
} else {
    console.log("Modal end not found via pattern - using text replacement.");
    const closeModalTarget = `                            </div>
                        </div>
                    </div>
                )}`;

    const closeModalReplacement = `                            </div>
                        )}
                    </div>
                )}`;

    if (code.includes(closeModalTarget)) {
        code = code.replace(closeModalTarget, closeModalReplacement);
        console.log("Closing container divs successfully updated via text replacement.");
    } else {
        console.error("ERROR: closeModalTarget not found!");
    }
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("Warning popup successfully injected into AgentDashboard.tsx.");
