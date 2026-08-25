const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// Find and replace the localStorage loading block inside openKostManagerListing
const targetSearch = `        const draftKey = \`km_draft_\${req.id}\`;
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
        }`;

const targetReplacement = `        const draftKey = \`km_draft_\${req.id}\`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (parsed.kmListingForm) {
                    // Merge draft with request data to ensure title and address are never lost
                    const mergedForm = {
                        ...parsed.kmListingForm,
                        title: parsed.kmListingForm.title || req.kost_name,
                        address: parsed.kmListingForm.address || req.kost_address,
                        owner_uid: parsed.kmListingForm.owner_uid || req.user_id
                    };
                    setKmListingForm(mergedForm);
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
        }`;

if (content.includes(targetSearch)) {
  content = content.replace(targetSearch, targetReplacement);
  console.log("Onboarding draft loading logic successfully updated.");
} else {
  // Let's do a more generic replace if formatting differs
  const genericSearch = `if (parsed.kmListingForm) {\n                    setKmListingForm(parsed.kmListingForm);`;
  const genericReplacement = `if (parsed.kmListingForm) {
                    const mergedForm = {
                        ...parsed.kmListingForm,
                        title: parsed.kmListingForm.title || req.kost_name,
                        address: parsed.kmListingForm.address || req.kost_address,
                        owner_uid: parsed.kmListingForm.owner_uid || req.user_id
                    };
                    setKmListingForm(mergedForm);`;
  if (content.includes(genericSearch)) {
    content = content.replace(genericSearch, genericReplacement);
    console.log("Onboarding draft loading logic successfully updated (generic).");
  } else {
    console.error("CRITICAL: target draft block not found!");
  }
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
