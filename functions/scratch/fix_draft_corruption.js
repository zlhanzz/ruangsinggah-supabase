const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Update closeKostManagerListing to reset states to clean defaults
const closeTarget = `    const closeKostManagerListing = () => {
        setIsEditingKostManager(null);
        setMitraProfile(null);
        setSignatureData(null);
        setAgreedToTerms(false);
        setExpandedRoomIdx(null);
        setActivePhotoIdx(0);
        setSearchParams({ status: agentTab });
    };`;

const closeReplacement = `    const closeKostManagerListing = () => {
        setIsEditingKostManager(null);
        setMitraProfile(null);
        setSignatureData(null);
        setAgreedToTerms(false);
        setExpandedRoomIdx(null);
        setActivePhotoIdx(0);
        setKmListingForm({
            title: '',
            description: '',
            address: '',
            city: 'Makassar',
            area: '',
            type: 'Campur',
            price: 0,
            owner_uid: '',
            roomTypes: [],
            facilities: ['WiFi', 'Parkir Motor'],
            location: { lat: -5.147665, lng: 119.432731 },
            rules: ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
            image_urls: [],
            campuses: [],
            publicBathroomFacilities: []
        });
        setKmStep(1);
        setTemporaryRoom(null);
        setActiveRoomIdx(null);
        setPhotoCategories(['Bangunan Depan', 'Koridor', 'Parkiran', 'Lingkungan']);
        setSearchParams({ status: agentTab });
    };`;

if (content.includes(closeTarget)) {
  content = content.replace(closeTarget, closeReplacement);
  console.log("closeKostManagerListing updated to reset states on close.");
} else {
  console.error("CRITICAL: closeKostManagerListing target not found!");
}

// 2. Add totalRooms to default state schemas in openKostManagerListing
content = content.replace(
  "price: existingProp.price || 0,\n                    owner_uid: req.user_id,",
  "price: existingProp.price || 0,\n                    totalRooms: existingProp.total_rooms || 0,\n                    owner_uid: req.user_id,"
);

content = content.replace(
  "price: 0,\n            owner_uid: req.user_id,",
  "price: 0,\n            totalRooms: 0,\n            owner_uid: req.user_id,"
);

// 3. Update the auto-save draft effect to guard against empty owner_uid
const saveEffectTarget = `    // Auto-save Kost Manager Onboarding draft effect
    useEffect(() => {
        if (isEditingKostManager) {
            const draftKey = \`km_draft_\${isEditingKostManager.id}\`;`;

const saveEffectReplacement = `    // Auto-save Kost Manager Onboarding draft effect
    useEffect(() => {
        if (isEditingKostManager && kmListingForm.owner_uid) {
            const draftKey = \`km_draft_\${isEditingKostManager.id}\`;`;

if (content.includes(saveEffectTarget)) {
  content = content.replace(saveEffectTarget, saveEffectReplacement);
  console.log("Auto-save draft effect updated with owner_uid guard.");
} else {
  console.error("CRITICAL: Auto-save draft effect target not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
