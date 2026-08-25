const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Declare state variables next to isEditingKostManager state
const stateTarget = `    const [isEditingKostManager, setIsEditingKostManager] = useState<SurveyRequest | null>(null);`;
const stateReplacement = `    const [isEditingKostManager, setIsEditingKostManager] = useState<SurveyRequest | null>(null);
    const [isExistingPropertyMigration, setIsExistingPropertyMigration] = useState(false);
    const [warningAccepted, setWarningAccepted] = useState(false);`;

if (code.includes(stateTarget)) {
    code = code.replace(stateTarget, stateReplacement);
    console.log("1. State variables successfully added.");
} else {
    console.error("ERROR: stateTarget not found!");
}

// 2. Reset state variables in closeKostManagerListing
const closeTarget = `    const closeKostManagerListing = () => {
        setIsEditingKostManager(null);
        setMitraProfile(null);`;
const closeReplacement = `    const closeKostManagerListing = () => {
        setIsEditingKostManager(null);
        setIsExistingPropertyMigration(false);
        setWarningAccepted(false);
        setMitraProfile(null);`;

if (code.includes(closeTarget)) {
    code = code.replace(closeTarget, closeReplacement);
    console.log("2. closeKostManagerListing resets successfully added.");
} else {
    // try with LF
    const closeTargetLF = closeTarget.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(closeTargetLF)) {
        code = codeLF.replace(closeTargetLF, closeReplacement);
        console.log("2. closeKostManagerListing resets (LF) successfully added.");
    } else {
        console.error("ERROR: closeTarget not found!");
    }
}

// 3. Set states inside openKostManagerListing when existingProp is found
const openTarget = `            const existingProp = existingProps?.find(p => p.is_managed) || existingProps?.[0];

            if (existingProp) {
                console.log("openKostManagerListing: fallback to properties table:", existingProp.id);`;

const openReplacement = `            const existingProp = existingProps?.find(p => p.is_managed) || existingProps?.[0];

            if (existingProp) {
                console.log("openKostManagerListing: fallback to properties table:", existingProp.id);
                setIsExistingPropertyMigration(true);
                setWarningAccepted(false);`;

if (code.includes(openTarget)) {
    code = code.replace(openTarget, openReplacement);
    console.log("3. openKostManagerListing sets successfully added.");
} else {
    // try with LF
    const openTargetLF = openTarget.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(openTargetLF)) {
        code = codeLF.replace(openTargetLF, openReplacement);
        console.log("3. openKostManagerListing sets (LF) successfully added.");
    } else {
        console.error("ERROR: openTarget not found!");
    }
}

// 4. Update the render block for isEditingKostManager modal to incorporate the warning popup overlay
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
    console.log("4. Wizard modal render target successfully updated.");
} else {
    // try with LF
    const renderTargetLF = renderTarget.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(renderTargetLF)) {
        code = codeLF.replace(renderTargetLF, renderReplacement);
        console.log("4. Wizard modal render target (LF) successfully updated.");
    } else {
        console.error("ERROR: renderTarget not found!");
    }
}

// 5. Replace the closing container divs to match the conditional ternary statement
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
    console.log("5. Closing container divs successfully updated.");
} else {
    // try with LF
    const closeModalTargetLF = closeModalTarget.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(closeModalTargetLF)) {
        code = codeLF.replace(closeModalTargetLF, closeModalReplacement);
        console.log("5. Closing container divs (LF) successfully updated.");
    } else {
        console.error("ERROR: closeModalTarget not found!");
    }
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("AgentDashboard.tsx popup warning updated successfully.");
