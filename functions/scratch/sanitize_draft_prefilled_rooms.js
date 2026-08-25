const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// Find the draft loading logic
const searchStr = `        const draftKey = \`km_draft_\${req.id}\`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (parsed.kmListingForm) {`;

const replacementStr = `        const draftKey = \`km_draft_\${req.id}\`;
        // Fetch existing Kost Manager room types first to assist in sanitizing drafts
        let kmRoomTypes = [];
        try {
            // Find propertyId from transaction metadata if exists
            let propertyIdToFetch = null;
            if (req.transaction_id) {
                const { data: trxData } = await supabase
                    .from('transactions')
                    .select('metadata')
                    .eq('id', req.transaction_id)
                    .maybeSingle();
                if (trxData?.metadata?.propertyId) {
                    propertyIdToFetch = trxData.metadata.propertyId;
                }
            }

            let query = supabase.from('properties').select('id');
            if (propertyIdToFetch) {
                query = query.eq('id', propertyIdToFetch);
            } else {
                query = query.eq('owner_uid', req.user_id);
            }
            const { data: existingProps } = await query;
            const existingProp = existingProps?.[0];
            if (existingProp) {
                const { data: kmProp } = await supabase
                    .from('mitra_kostmanager')
                    .select('room_types')
                    .eq('property_id', existingProp.id)
                    .maybeSingle();
                if (kmProp && kmProp.room_types) {
                    kmRoomTypes = kmProp.room_types;
                }
            }
        } catch (e) {
            console.error("Error pre-fetching room types for draft sanitization:", e);
        }

        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (parsed.kmListingForm) {
                    // Sanitize draft: if no mitra_kostmanager record exists yet, do not load old prefilled default rooms
                    let draftRoomTypes = parsed.kmListingForm.roomTypes || [];
                    if (kmRoomTypes.length === 0) {
                        draftRoomTypes = draftRoomTypes.filter((r: any) => r.name !== '101' && r.name !== 'Tipe Standar');
                    }
                    parsed.kmListingForm.roomTypes = draftRoomTypes;`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replacementStr);
  console.log("Draft loader successfully updated to sanitize prefilled rooms.");
} else {
  console.error("CRITICAL: Draft loading logic not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
