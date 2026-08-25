const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Revert changes bypassed for sequential application
const execSync = require('child_process').execSync;

// 2. Define formatThousand and parseThousand helper functions at the top of the file (after imports, e.g. line 28)
const importLine = "import { Page } from '../types';";
const importIndex = content.indexOf(importLine);
if (importIndex !== -1) {
  const insertIndex = content.indexOf('\n', importIndex);
  const formatterHelpers = `
const formatThousand = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    // Strip everything except digits
    const clean = val.toString().replace(/\\D/g, '');
    if (!clean) return '';
    return clean.replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');
};

const parseThousand = (str: string) => {
    if (!str) return '';
    const clean = str.replace(/\\D/g, '');
    if (!clean) return '';
    return parseFloat(clean) || 0;
};
`;
  content = content.slice(0, insertIndex + 1) + formatterHelpers + content.slice(insertIndex + 1);
}

// 3. Declare closeKostManagerListing helper and auto-load effect AFTER kmOriginalLocationRef definition
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

// 4. Modify openKostManagerListing to set URL search param and load all states from draft
const openDef = "const openKostManagerListing = async (req: SurveyRequest) => {\n        setIsEditingKostManager(req);\n        setKmActiveTab('info');\n        setKmStep(1);";
content = content.replace(openDef, `const openKostManagerListing = async (req: SurveyRequest) => {
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
        setKmStep(1);`);

// 5. Clean draft on successful submit
content = content.replace(
  `alert('Listing properti & kamar berhasil disimpan! Status pengajuan kini PENDING ONBOARDING.');\n            setIsEditingKostManager(null);`,
  `alert('Listing properti & kamar berhasil disimpan! Status pengajuan kini PENDING ONBOARDING.');\n            localStorage.removeItem(\`km_draft_\${isEditingKostManager.id}\`);\n            setIsEditingKostManager(null);\n            setSearchParams({ status: agentTab });`
);

// 6. Change occurrences of setIsEditingKostManager(null) to closeKostManagerListing()
content = content.replace(
  /onClick=\{\(\) => setIsEditingKostManager\(null\)\}/g,
  `onClick={closeKostManagerListing}`
);
content = content.replace(
  /setIsEditingKostManager\(null\);/g,
  `closeKostManagerListing();`
);
content = content.replace(
  `onClick={() => setIsEditingKostManager(null)} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">&times;</button>`,
  `onClick={closeKostManagerListing} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">&times;</button>`
);
content = content.replace(
  `onClick={() => setIsEditingKostManager(null)}\n                                            className="flex-1 h-[48px] border border-[#ff7a00] text-[#ff7a00] rounded-full font-bold text-xs uppercase tracking-wider hover:bg-orange-50 transition-colors"\n                                        >\n                                            Simpan Draft`,
  `onClick={closeKostManagerListing}\n                                            className="flex-1 h-[48px] border border-[#ff7a00] text-[#ff7a00] rounded-full font-bold text-xs uppercase tracking-wider hover:bg-orange-50 transition-colors"\n                                        >\n                                            Keluar`
);

// 7. Perform robust regex replacements for the pricing scheme input fields and the room price input fields
content = content.replace(
  /type="number"\s+value=\{scheme\.price\}\s+onChange=\{\(e\) => \{\s+const val = e\.target\.value === '' \? '' : \(parseFloat\(e\.target\.value\) \|\| 0\);/g,
  `type="text"
                                                                                  value={formatThousand(scheme.price)}
                                                                                  onChange={(e) => {
                                                                                      const val = parseThousand(e.target.value);`
);

content = content.replace(
  /type="number"\s+value=\{rt\.price \|\| ''\}\s+onChange=\{e => \{\s+const updated = \[\.\.\.kmListingForm\.roomTypes\];\s+updated\[activeRoomIdx\] = \{ \.\.\.rt, price: parseFloat\(e\.target\.value\) \|\| 0 \};/g,
  `type="text"
                                                                                  value={formatThousand(rt.price || '')}
                                                                                  onChange={e => {
                                                                                      const updated = [...kmListingForm.roomTypes];
                                                                                      updated[activeRoomIdx] = { ...rt, price: parseThousand(e.target.value) || 0 };`
);

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');

console.log("Clean code changes successfully written.");
