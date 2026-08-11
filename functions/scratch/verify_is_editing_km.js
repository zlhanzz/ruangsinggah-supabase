const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
console.log("File length:", content.length);
console.log("Contains isEditingKostManager?", content.includes('isEditingKostManager'));
console.log("Contains checkHasFacility?", content.includes('checkHasFacility'));
console.log("Contains getImageUrlString?", content.includes('getImageUrlString'));
console.log("Contains Custom Facilities Badges?", content.includes('Custom Facilities Badges'));
