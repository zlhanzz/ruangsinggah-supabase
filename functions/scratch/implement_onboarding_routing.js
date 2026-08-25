const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Declare closeKostManagerListing helper and auto-load effect AFTER kmOriginalLocationRef definition
const refDef = "const kmOriginalLocationRef = useRef<any>(null);";
const refIndex = content.indexOf(refDef);
if (refIndex !== -1) {
  const insertIndex = content.indexOf('\n', refIndex);
  const helpers = `
    const closeKostManagerListing = () => {
        setIsEditingKostManager(null);
        setSearchParams({ status: agentTab });
    };

    // Auto-save Kost Manager Onboarding draft effect
    useEffect(() => {
        if (isEditingKostManager) {
            const draftKey = \`km_draft_\${isEditingKostManager.id}\`;
            const draftData = {
                kmListingForm,
                kmStep,
                temporaryRoom,
                activeRoomIdx,
                kmActiveTab,
                photoCategories
            };
            localStorage.setItem(draftKey, JSON.stringify(draftData));
        }
    }, [isEditingKostManager, kmListingForm, kmStep, temporaryRoom, activeRoomIdx, kmActiveTab, photoCategories]);

    // Auto-load onboarding from URL search params on refresh
    useEffect(() => {
        const onboardingIdStr = searchParams.get('onboarding_id');
        if (onboardingIdStr && surveyRequests && surveyRequests.length > 0 && !isEditingKostManager) {
            const reqId = parseInt(onboardingIdStr, 10);
            const found = surveyRequests.find(r => r.id === reqId);
            if (found) {
                openKostManagerListing(found);
            }
        }
    }, [searchParams, surveyRequests, isEditingKostManager]);
`;
  content = content.slice(0, insertIndex + 1) + helpers + content.slice(insertIndex + 1);
}

// 2. Modify openKostManagerListing to set URL search param and load all states from draft
const openDef = "const openKostManagerListing = async (req: SurveyRequest) => {";
const openIndex = content.indexOf(openDef);
if (openIndex !== -1) {
  const bodyIndex = content.indexOf('{', openIndex);
  const modifiedBody = `
        setIsEditingKostManager(req);
        setSearchParams({ status: agentTab, onboarding_id: req.id.toString() });

        const draftKey = \`km_draft_\${req.id}\`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (parsed.kmListingForm) {
                    setKmListingForm(parsed.kmListingForm);
                    setKmStep(parsed.kmStep || 1);
                    setTemporaryRoom(parsed.temporaryRoom || null);
                    setActiveRoomIdx(parsed.activeRoomIdx !== undefined ? parsed.activeRoomIdx : null);
                    setKmActiveTab(parsed.kmActiveTab || 'info');
                    if (parsed.photoCategories) {
                        setPhotoCategories(parsed.photoCategories);
                    }
                    console.log("Loaded complete onboarding draft from localStorage on open");
                    return;
                }
            } catch (e) {
                console.error("Failed to parse saved draft:", e);
            }
        }

        setKmActiveTab('info');
        setKmStep(1);
`;
  content = content.replace(
    `const openKostManagerListing = async (req: SurveyRequest) => {\n        setIsEditingKostManager(req);\n        setKmActiveTab('info');\n        setKmStep(1);`,
    `const openKostManagerListing = async (req: SurveyRequest) => {${modifiedBody}`
  );
}

// 3. Clean draft on successful submit
content = content.replace(
  `alert('Listing properti & kamar berhasil disimpan! Status pengajuan kini PENDING ONBOARDING.');\n            setIsEditingKostManager(null);`,
  `alert('Listing properti & kamar berhasil disimpan! Status pengajuan kini PENDING ONBOARDING.');\n            localStorage.removeItem(\`km_draft_\${isEditingKostManager.id}\`);\n            setIsEditingKostManager(null);\n            setSearchParams({ status: agentTab });`
);

// 4. Change occurrences of setIsEditingKostManager(null) to closeKostManagerListing()
content = content.replace(
  `onClick={() => setIsEditingKostManager(null)}></div>`,
  `onClick={closeKostManagerListing}></div>`
);
content = content.replace(
  `setIsEditingKostManager(null);`,
  `closeKostManagerListing();`
);
content = content.replace(
  `onClick={() => setIsEditingKostManager(null)} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">&times;</button>`,
  `onClick={closeKostManagerListing} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">&times;</button>`
);
content = content.replace(
  `onClick={() => setIsEditingKostManager(null)}\n                                            className="flex-grow py-3 border border-[#ff7a00] text-[#ff7a00] rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-wider hover:bg-orange-50/30 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-95"\n                                        >\n                                            Keluar`,
  `onClick={closeKostManagerListing}\n                                            className="flex-grow py-3 border border-[#ff7a00] text-[#ff7a00] rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-wider hover:bg-orange-50/30 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-95"\n                                        >\n                                            Keluar`
);
content = content.replace(
  `onClick={() => setIsEditingKostManager(null)}\n                                            className="flex-1 h-[48px] border border-[#ff7a00] text-[#ff7a00] rounded-full font-bold text-xs uppercase tracking-wider hover:bg-orange-50 transition-colors"\n                                        >\n                                            Simpan Draft`,
  `onClick={closeKostManagerListing}\n                                            className="flex-1 h-[48px] border border-[#ff7a00] text-[#ff7a00] rounded-full font-bold text-xs uppercase tracking-wider hover:bg-orange-50 transition-colors"\n                                        >\n                                            Keluar`
);

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');

console.log("Routing, auto-save state, and draft loading successfully implemented.");
