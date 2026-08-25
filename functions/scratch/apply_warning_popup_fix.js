const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Find the start of openKostManagerListing function
const openFuncStart = `    const openKostManagerListing = async (req: SurveyRequest) => {
        const draftKey = \`km_draft_\${req.id}\`;
        
        // Pre-fetch room types if property is already created in mitra_kostmanager or properties table`;

// Let's replace the top of openKostManagerListing to check for existing propertyId immediately
const openFuncReplacement = `    const openKostManagerListing = async (req: SurveyRequest) => {
        const draftKey = \`km_draft_\${req.id}\`;
        
        // Immediately detect if this is an existing property migration
        const initialPropertyId = req.property_id || req.transaction?.metadata?.propertyId;
        const isExisting = initialPropertyId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\[0-9a-f\]{12}$/i.test(initialPropertyId);
        
        setIsExistingPropertyMigration(!!isExisting);
        setWarningAccepted(!isExisting);

        // Pre-fetch room types if property is already created in mitra_kostmanager or properties table`;

if (code.includes(openFuncStart)) {
    code = code.replace(openFuncStart, openFuncReplacement);
    console.log("1. Top of openKostManagerListing successfully updated.");
} else {
    // Try LF or search for exact string
    const openFuncStartLF = openFuncStart.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(openFuncStartLF)) {
        code = codeLF.replace(openFuncStartLF, openFuncReplacement);
        console.log("1. Top of openKostManagerListing (LF) successfully updated.");
    } else {
        console.error("ERROR: openFuncStart not found!");
    }
}

// 2. Update the async block in openKostManagerListing to also set states if propertyId is found in async metadata
const asyncMetadataTarget = `                if (trxData?.metadata?.propertyId) {
                    propertyIdToFetch = trxData.metadata.propertyId;
                    console.log("openKostManagerListing: found propertyId in transaction metadata:", propertyIdToFetch);
                }`;

const asyncMetadataReplacement = `                if (trxData?.metadata?.propertyId) {
                    propertyIdToFetch = trxData.metadata.propertyId;
                    console.log("openKostManagerListing: found propertyId in transaction metadata:", propertyIdToFetch);
                    setIsExistingPropertyMigration(true);
                    setWarningAccepted(false);
                }`;

if (code.includes(asyncMetadataTarget)) {
    code = code.replace(asyncMetadataTarget, asyncMetadataReplacement);
    console.log("2. Async metadata block successfully updated.");
} else {
    const asyncMetadataTargetLF = asyncMetadataTarget.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(asyncMetadataTargetLF)) {
        code = codeLF.replace(asyncMetadataTargetLF, asyncMetadataReplacement);
        console.log("2. Async metadata block (LF) successfully updated.");
    } else {
        console.error("ERROR: asyncMetadataTarget not found!");
    }
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("AgentDashboard.tsx warning fix patch applied successfully.");
