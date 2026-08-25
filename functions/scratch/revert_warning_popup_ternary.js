const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');

// REVERT the ternary injection - restore original modal opening
// Remove the ternary structure and put back the simple modal opening
const TERNARY_OPEN = `{isExistingPropertyMigration && !warningAccepted ? (
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

const ORIGINAL_CONTENT_DIV = `<div className="bg-[#f8f9ff] text-[#0b1c30] w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 flex flex-col h-[90vh] max-h-[880px] overflow-hidden animate-in zoom-in-95 font-['Plus_Jakarta_Sans']">`;

if (code.includes(TERNARY_OPEN)) {
    code = code.replace(TERNARY_OPEN, ORIGINAL_CONTENT_DIV);
    console.log('Reverted ternary open to simple content div.');
} else {
    console.error('TERNARY_OPEN not found - looking for content div...');
    const idx = code.indexOf(ORIGINAL_CONTENT_DIV);
    if (idx > -1) {
        console.log('Content div already simple, no ternary to revert.');
    } else {
        console.error('Content div not found either!');
    }
}

// Also remove the ternary close )} that was incorrectly inserted after content div
// Find )} at line 6229 area (between </div> and </div>)
const WRONG_TERNARY_CLOSE = `                            </div>\n                        )}\n                    </div>\n                )}\n`;
const CORRECT_CLOSE = `                            </div>\n                    </div>\n                )}\n`;

if (code.includes(WRONG_TERNARY_CLOSE)) {
    code = code.replace(WRONG_TERNARY_CLOSE, CORRECT_CLOSE);
    console.log('Removed incorrect ternary close.');
} else {
    console.log('Wrong ternary close not found - checking current state...');
    // Try to find what is there
    const lines = code.split('\n');
    for (let i = 6222; i < 6238; i++) {
        if (lines[i] !== undefined) console.log('L' + (i+1) + ': ' + JSON.stringify(lines[i]));
    }
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log('Revert complete. Now we will add a separate overlay warning instead.');
