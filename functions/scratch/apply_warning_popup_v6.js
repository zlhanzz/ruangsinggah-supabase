const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');

const cleanString = (str) => str.replace(/\r\n/g, '\n');

// 1. Declare state variables next to isEditingKostManager state
const stateTarget = cleanString(`    const [isEditingKostManager, setIsEditingKostManager] = useState<SurveyRequest | null>(null);`);
const stateReplacement = cleanString(`    const [isEditingKostManager, setIsEditingKostManager] = useState<SurveyRequest | null>(null);
    const [isExistingPropertyMigration, setIsExistingPropertyMigration] = useState(false);
    const [warningAccepted, setWarningAccepted] = useState(false);`);

if (code.includes(stateTarget)) {
    code = code.replace(stateTarget, stateReplacement);
    console.log("1. State variables successfully added.");
} else {
    console.error("ERROR: stateTarget not found!");
}

// 2. Add closeKostManagerListing function before openKostManagerListing
const openMethodTarget = cleanString(`    const openKostManagerListing = async (req: SurveyRequest) => {`);
const openMethodReplacement = cleanString(`    const closeKostManagerListing = () => {
        setIsEditingKostManager(null);
        setIsExistingPropertyMigration(false);
        setWarningAccepted(false);
    };

    const openKostManagerListing = async (req: SurveyRequest) => {`);

if (code.includes(openMethodTarget)) {
    code = code.replace(openMethodTarget, openMethodReplacement);
    console.log("2. closeKostManagerListing helper successfully declared.");
} else {
    console.error("ERROR: openMethodTarget not found!");
}

// 3. Set states inside openKostManagerListing when existingProp is found
const openTarget = cleanString(`            if (existingProp) {
                console.log("openKostManagerListing: found existing property to load:", existingProp.id);`);

const openReplacement = cleanString(`            if (existingProp) {
                console.log("openKostManagerListing: found existing property to load:", existingProp.id);
                setIsExistingPropertyMigration(true);
                setWarningAccepted(false);`);

if (code.includes(openTarget)) {
    code = code.replace(openTarget, openReplacement);
    console.log("3. openKostManagerListing sets successfully added.");
} else {
    console.error("ERROR: openTarget not found!");
}

// 4. Update success save handler to call closeKostManagerListing()
const saveSuccessTarget = cleanString(`            setIsEditingKostManager(null);
            alert('Listing KostManager berhasil di-submit!');`);
const saveSuccessReplacement = cleanString(`            closeKostManagerListing();
            alert('Listing KostManager berhasil di-submit!');`);

if (code.includes(saveSuccessTarget)) {
    code = code.replace(saveSuccessTarget, saveSuccessReplacement);
    console.log("4. saveSuccessTarget updated to closeKostManagerListing().");
} else {
    console.error("ERROR: saveSuccessTarget not found!");
}

// 5. Update the render block for isEditingKostManager modal to incorporate the warning popup overlay
const renderTarget = cleanString(`                {isEditingKostManager && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsEditingKostManager(null)}></div>
                        <div className="bg-[#f8f9ff] text-[#0b1c30] w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 flex flex-col h-[90vh] max-h-[880px] overflow-hidden animate-in zoom-in-95 font-['Plus_Jakarta_Sans']">`);

const renderReplacement = cleanString(`                {isEditingKostManager && (
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
                            <div className="bg-[#f8f9ff] text-[#0b1c30] w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 flex flex-col h-[90vh] max-h-[880px] overflow-hidden animate-in zoom-in-95 font-['Plus_Jakarta_Sans']">`);

if (code.includes(renderTarget)) {
    code = code.replace(renderTarget, renderReplacement);
    console.log("5. Wizard modal render target successfully updated.");
} else {
    console.error("ERROR: renderTarget not found!");
}

// 6. Replace inline onClick={() => setIsEditingKostManager(null)} closures inside the modal
const backButtonTarget = cleanString(`                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (kmStep > 1) {
                                                setKmStep(kmStep - 1);
                                            } else {
                                                setIsEditingKostManager(null);
                                            }
                                        }}`);

const backButtonReplacement = cleanString(`                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (kmStep > 1) {
                                                setKmStep(kmStep - 1);
                                            } else {
                                                closeKostManagerListing();
                                            }
                                        }}`);

if (code.includes(backButtonTarget)) {
    code = code.replace(backButtonTarget, backButtonReplacement);
    console.log("6. backButtonTarget successfully updated.");
} else {
    console.error("ERROR: backButtonTarget not found!");
}

const xButtonTarget = cleanString(`                                <button onClick={() => setIsEditingKostManager(null)} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">&times;</button>`);
const xButtonReplacement = cleanString(`                                <button onClick={closeKostManagerListing} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">&times;</button>`);

if (code.includes(xButtonTarget)) {
    code = code.replace(xButtonTarget, xButtonReplacement);
    console.log("7. xButtonTarget successfully updated.");
} else {
    console.error("ERROR: xButtonTarget not found!");
}

const saveDraftTarget = cleanString(`                                        <button
                                            type="button"
                                            onClick={() => setIsEditingKostManager(null)}
                                            className="flex-1 h-[48px] border border-[#ff7a00] text-[#ff7a00] rounded-full font-bold text-xs uppercase tracking-wider hover:bg-orange-50 transition-colors"
                                        >
                                            Simpan Draft
                                        </button>`);

const saveDraftReplacement = cleanString(`                                        <button
                                            type="button"
                                            onClick={closeKostManagerListing}
                                            className="flex-1 h-[48px] border border-[#ff7a00] text-[#ff7a00] rounded-full font-bold text-xs uppercase tracking-wider hover:bg-orange-50 transition-colors"
                                        >
                                            Keluar
                                        </button>`);

if (code.includes(saveDraftTarget)) {
    code = code.replace(saveDraftTarget, saveDraftReplacement);
    console.log("8. saveDraftTarget successfully updated.");
} else {
    console.error("ERROR: saveDraftTarget not found!");
}

// 7. Replace the closing container divs to match the conditional ternary statement
const closeModalTarget = cleanString(`                            </div>
                        </div>
                    </div>
                )}`);

const closeModalReplacement = cleanString(`                            </div>
                        )}
                    </div>
                )}`);

if (code.includes(closeModalTarget)) {
    code = code.replace(closeModalTarget, closeModalReplacement);
    console.log("9. Closing container divs successfully updated.");
} else {
    console.error("ERROR: closeModalTarget not found!");
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("AgentDashboard.tsx popup warning updated successfully.");
