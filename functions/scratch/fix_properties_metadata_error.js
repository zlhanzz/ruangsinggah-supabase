const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// Search for the metadata object inside propertyPayload
const metadataSearch = `                campuses: kmListingForm.campuses,
                metadata: {
                    publicBathroomFacilities: kmListingForm.publicBathroomFacilities || [],
                    publicKitchenFacilities: kmListingForm.publicKitchenFacilities || [],
                    digitalSignature: signatureData
                }`;

const metadataReplacement = `                campuses: kmListingForm.campuses`;

if (content.includes(metadataSearch)) {
  content = content.replace(metadataSearch, metadataReplacement);
  console.log("Successfully removed metadata column from properties payload.");
} else {
  console.error("CRITICAL: metadata block inside propertyPayload not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
