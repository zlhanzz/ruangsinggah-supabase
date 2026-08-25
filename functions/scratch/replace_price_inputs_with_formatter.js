const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Declare formatThousand and parseThousand helper functions AFTER closeKostManagerListing definition
const helperDef = "const closeKostManagerListing = () => {\n        setIsEditingKostManager(null);\n        setSearchParams({ status: agentTab });\n    };";
const helperIndex = content.indexOf(helperDef);
if (helperIndex !== -1) {
  const insertIndex = content.indexOf('\n', helperIndex + helperDef.length);
  const formatterHelpers = `
    const formatThousand = (val: any) => {
        if (val === undefined || val === null || val === '') return '';
        // Strip everything except digits
        const clean = val.toString().replace(/\\D/g, '');
        if (!clean) return '';
        return clean.replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');
    };

    const parseThousand = (str: string) => {
        if (!str) return '';
        const clean = str.replace(/\\D/g, '');
        if (!clean) return '';
        return parseFloat(clean) || 0;
    };
`;
  content = content.slice(0, insertIndex + 1) + formatterHelpers + content.slice(insertIndex + 1);
}

// 2. Replace temporaryRoom pricing input (formerly lines 3541 to 3557)
const tempInputDef = `                                                                              <input
                                                                                  type="number"
                                                                                  value={scheme.price}
                                                                                  onChange={(e) => {
                                                                                      const val = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);`;

const tempInputRepl = `                                                                              <input
                                                                                  type="text"
                                                                                  value={formatThousand(scheme.price)}
                                                                                  onChange={(e) => {
                                                                                      const val = parseThousand(e.target.value);`;

content = content.replace(tempInputDef, tempInputRepl);

// 3. Replace activeRoomIdx pricing input (formerly lines 4261 to 4277)
const activeInputDef = `                                                                              <input
                                                                                  type="number"
                                                                                  value={scheme.price}
                                                                                  onChange={(e) => {
                                                                                      const val = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);`;

const activeInputRepl = `                                                                              <input
                                                                                  type="text"
                                                                                  value={formatThousand(scheme.price)}
                                                                                  onChange={(e) => {
                                                                                      const val = parseThousand(e.target.value);`;

// Wait, the strings are identical, but we want to replace both occurrences!
// Since .replace() only replaces the first occurrence, let's call it twice or use a regex/index replacement.
// Let's do content = content.replace(new RegExp(escapeRegExp(activeInputDef), 'g'), ...)
// Wait, escaping is safer:
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
const escapedDef = escapeRegExp(tempInputDef);
content = content.replace(new RegExp(escapedDef, 'g'), tempInputRepl);

// 4. Replace rt.price input (formerly lines 4500 to 4509)
const rtPriceDef = `                                                                              <input 
                                                                                  type="number"
                                                                                  value={rt.price || ''}
                                                                                  onChange={e => {
                                                                                      const updated = [...kmListingForm.roomTypes];
                                                                                      updated[activeRoomIdx] = { ...rt, price: parseFloat(e.target.value) || 0 };`;

const rtPriceRepl = `                                                                              <input 
                                                                                  type="text"
                                                                                  value={formatThousand(rt.price || '')}
                                                                                  onChange={e => {
                                                                                      const updated = [...kmListingForm.roomTypes];
                                                                                      updated[activeRoomIdx] = { ...rt, price: parseThousand(e.target.value) || 0 };`;

content = content.replace(rtPriceDef, rtPriceRepl);

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');

console.log("Formatting price inputs successfully replaced.");
