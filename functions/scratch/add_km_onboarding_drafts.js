const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Add Auto-save draft effect for kmListingForm after the surveyForm auto-save draft effect
const oldEffect = `    // Auto-save draft effect
    useEffect(() => {
        if (isEditingSurvey && surveyForm && Object.keys(surveyForm).length > 0) {
            const draftKey = \`survey_draft_\${isEditingSurvey.id}\`;
            localStorage.setItem(draftKey, JSON.stringify(surveyForm));
        }
    }, [surveyForm, isEditingSurvey]);`;

const newEffect = `    // Auto-save draft effect
    useEffect(() => {
        if (isEditingSurvey && surveyForm && Object.keys(surveyForm).length > 0) {
            const draftKey = \`survey_draft_\${isEditingSurvey.id}\`;
            localStorage.setItem(draftKey, JSON.stringify(surveyForm));
        }
    }, [surveyForm, isEditingSurvey]);

    // Auto-save Kost Manager Onboarding draft effect
    useEffect(() => {
        if (isEditingKostManager && kmListingForm && Object.keys(kmListingForm).length > 0) {
            const draftKey = \`km_draft_\${isEditingKostManager.id}\`;
            localStorage.setItem(draftKey, JSON.stringify(kmListingForm));
        }
    }, [kmListingForm, isEditingKostManager]);`;

if (content.includes(oldEffect)) {
  content = content.replace(oldEffect, newEffect);
  console.log("Auto-save draft effect for kmListingForm added.");
} else {
  console.log("CRITICAL: oldEffect NOT found!");
}

// 2. Load draft inside openKostManagerListing if exists
const oldOpenKm = `    const openKostManagerListing = async (req: SurveyRequest) => {
        setIsEditingKostManager(req);
        setKmActiveTab('info');
        setKmStep(1);
        
        try {`;

const newOpenKm = `    const openKostManagerListing = async (req: SurveyRequest) => {
        setIsEditingKostManager(req);
        setKmActiveTab('info');
        setKmStep(1);

        const draftKey = \`km_draft_\${req.id}\`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setKmListingForm(parsed);
                console.log("openKostManagerListing: loaded draft from localStorage");
                return;
            } catch (e) {
                console.error("Failed to parse saved draft:", e);
            }
        }
        
        try {`;

if (content.includes(oldOpenKm)) {
  content = content.replace(oldOpenKm, newOpenKm);
  console.log("Draft loading inside openKostManagerListing added.");
} else {
  console.log("CRITICAL: oldOpenKm NOT found!");
}

// 3. Clean up draft in handleSaveKostManagerListing on successful submit
const oldSaveKmEnd = `            alert('Listing properti & kamar berhasil disimpan! Status pengajuan kini PENDING ONBOARDING.');
            setIsEditingKostManager(null);
            await loadSurveyRequests();`;

const newSaveKmEnd = `            alert('Listing properti & kamar berhasil disimpan! Status pengajuan kini PENDING ONBOARDING.');
            localStorage.removeItem('km_draft_' + isEditingKostManager.id);
            setIsEditingKostManager(null);
            await loadSurveyRequests();`;

if (content.includes(oldSaveKmEnd)) {
  content = content.replace(oldSaveKmEnd, newSaveKmEnd);
  console.log("Draft cleanup on save added.");
} else {
  console.log("CRITICAL: oldSaveKmEnd NOT found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');

console.log("Done adding onboarding draft features.");
