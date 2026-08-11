const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add getImageUrlString helper function
const helperTarget = `    const checkHasFacility = (facilityList: string[], target: string) => {`;
const helperReplacement = `    const getImageUrlString = (img: any): string => {
        if (!img) return '';
        if (typeof img === 'string') return img;
        if (typeof img === 'object' && img.original) return img.original;
        if (typeof img === 'object' && img.url) return img.url;
        return '';
    };

    const checkHasFacility = (facilityList: string[], target: string) => {`;

if (content.includes(helperTarget)) {
  content = content.replace(helperTarget, helperReplacement);
  console.log("getImageUrlString helper added.");
} else {
  console.error("helperTarget not found!");
}

// 2. Format image_urls in handleSaveKostManagerListing
const saveTarget = `                rules: kmListingForm.rules,
                image_urls: kmListingForm.image_urls,
                campuses: kmListingForm.campuses`;

const saveReplacement = `                rules: kmListingForm.rules,
                image_urls: (kmListingForm.image_urls || []).map((img: any) => {
                    if (!img) return null;
                    if (typeof img === 'string') return { original: img };
                    if (typeof img === 'object' && img.original) return img;
                    return null;
                }).filter(Boolean),
                campuses: kmListingForm.campuses`;

if (content.includes(saveTarget)) {
  content = content.replace(saveTarget, saveReplacement);
  console.log("handleSaveKostManagerListing format added.");
} else {
  console.error("saveTarget not found!");
}

// 3. Update JSX rendering to use getImageUrlString
const jsxTarget = `                                                    {['Bangunan Depan', 'Koridor', 'Area Umum', 'Lingkungan'].map((label, idx) => {
                                                         const imgUrl = kmListingForm.image_urls?.[idx];`;

const jsxReplacement = `                                                    {['Bangunan Depan', 'Koridor', 'Area Umum', 'Lingkungan'].map((label, idx) => {
                                                         const imgUrl = getImageUrlString(kmListingForm.image_urls?.[idx]);`;

if (content.includes(jsxTarget)) {
  content = content.replace(jsxTarget, jsxReplacement);
  console.log("JSX rendering updated.");
} else {
  console.error("jsxTarget not found!");
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
