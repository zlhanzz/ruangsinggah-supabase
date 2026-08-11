const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = `                                                     {['Bangunan Depan', 'Koridor', 'Area Umum', 'Lingkungan'].map((label, idx) => {
                                                         const imgUrl = kmListingForm.image_urls?.[idx];`;

const replacementStr = `                                                     {['Bangunan Depan', 'Koridor', 'Area Umum', 'Lingkungan'].map((label, idx) => {
                                                         const imgUrl = getImageUrlString(kmListingForm.image_urls?.[idx]);`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log("Successfully replaced exact!");
} else {
  // Try normalized replacement
  const cleanTarget = targetStr.replace(/\s+/g, ' ');
  const cleanContent = content.replace(/\s+/g, ' ');
  if (cleanContent.includes(cleanTarget)) {
    const escaped = targetStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    content = content.replace(new RegExp(escaped), replacementStr);
    console.log("Successfully replaced using regex!");
  } else {
    console.error("Could not find the target layout block in the file!");
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
