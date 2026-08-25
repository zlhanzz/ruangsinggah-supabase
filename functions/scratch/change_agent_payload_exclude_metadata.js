const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const targetStr = `                const kmPropertyPayload = {
                    property_id: savedProperty.id,
                    owner_uid: isEditingKostManager.user_id,
                    title: propertyPayload.title,
                    description: propertyPayload.description,
                    price: propertyPayload.price,
                    facilities: propertyPayload.facilities,
                    address: propertyPayload.address,
                    city: propertyPayload.city,
                    area: propertyPayload.area,
                    location: propertyPayload.location,
                    rules: propertyPayload.rules,
                    campuses: propertyPayload.campuses,
                    image_urls: propertyPayload.image_urls,
                    room_types: propertyPayload.room_types,
                    metadata: {
                        publicBathroomFacilities: kmListingForm.publicBathroomFacilities || [],
                        publicKitchenFacilities: kmListingForm.publicKitchenFacilities || []
                    }
                };`;

const replacementStr = `                const kmPropertyPayload = {
                    property_id: savedProperty.id,
                    owner_uid: isEditingKostManager.user_id,
                    title: propertyPayload.title,
                    description: propertyPayload.description,
                    price: propertyPayload.price,
                    facilities: propertyPayload.facilities,
                    address: propertyPayload.address,
                    city: propertyPayload.city,
                    area: propertyPayload.area,
                    location: propertyPayload.location,
                    rules: propertyPayload.rules,
                    campuses: propertyPayload.campuses,
                    image_urls: propertyPayload.image_urls,
                    room_types: propertyPayload.room_types
                };`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log("Successfully excluded metadata from kmPropertyPayload in AgentDashboard.tsx");
} else {
  console.log("WARNING: Target string not found in AgentDashboard.tsx!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
