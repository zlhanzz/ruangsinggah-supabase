const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const target = `    const openKostManagerListing = async (req: SurveyRequest) => {
        setIsEditingKostManager(req);`;

const replacement = `    const openKostManagerListing = async (req: SurveyRequest) => {
        // Immediately detect if this is an existing property migration
        const initialPropertyId = req.property_id || req.transaction?.metadata?.propertyId;
        const isExisting = initialPropertyId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(initialPropertyId);
        
        setIsExistingPropertyMigration(!!isExisting);
        setWarningAccepted(!isExisting);

        setIsEditingKostManager(req);`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    console.log("openKostManagerListing signature and state set successfully updated.");
} else {
    // Try LF
    const targetLF = target.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(targetLF)) {
        code = codeLF.replace(targetLF, replacement);
        console.log("openKostManagerListing signature and state set (LF) successfully updated.");
    } else {
        console.error("ERROR: target not found!");
    }
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("AgentDashboard.tsx warning fix v2 patch applied successfully.");
