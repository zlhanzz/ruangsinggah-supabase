const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Replace status: 'published' in handleSaveKostManagerListing payload
const payloadSearch = `                owner_uid: kmListingForm.owner_uid,
                room_types: kmListingForm.roomTypes,
                status: 'published',`;

const payloadReplacement = `                owner_uid: kmListingForm.owner_uid,
                room_types: kmListingForm.roomTypes,
                status: 'draft',`;

if (content.includes(payloadSearch)) {
  content = content.replace(payloadSearch, payloadReplacement);
  console.log("Property status in handleSaveKostManagerListing payload successfully changed to 'draft'.");
} else {
  console.error("CRITICAL: payloadSearch not found!");
}

// 2. Replace sync status updates
const syncSearch = `            // Sync status to COMPLETED & PENDING_ONBOARDING
            await supabase.from('survey_requests').update({ status: 'COMPLETED' }).eq('id', isEditingKostManager.id);
            await supabase.from('kostmanager_requests').update({ status: 'PENDING_ONBOARDING' }).eq('id', isEditingKostManager.id);`;

const syncReplacement = `            // Sync status to SUBMITTED & PENDING_ONBOARDING (with proper linking)
            await supabase.from('survey_requests').update({ status: 'SUBMITTED' }).eq('id', isEditingKostManager.id);
            if (isEditingKostManager.transaction_id && savedProperty) {
                await supabase.from('kostmanager_requests')
                    .update({ 
                        status: 'PENDING_ONBOARDING',
                        property_id: savedProperty.id
                    })
                    .eq('transaction_id', isEditingKostManager.transaction_id);
            }`;

if (content.includes(syncSearch)) {
  content = content.replace(syncSearch, syncReplacement);
  console.log("Status synchronization correctly updated to SUBMITTED and properly matched with transaction_id.");
} else {
  console.error("CRITICAL: syncSearch not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
