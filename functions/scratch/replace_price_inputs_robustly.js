const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Injected helper functions if not already present
if (!content.includes('const formatThousand =')) {
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
}

// 2. Perform robust replacements for input tags
// Replacement A: temporaryRoom & activeRoomIdx scheme price inputs
content = content.replace(
  /type="number"\s+value=\{scheme\.price\}\s+onChange=\{\(e\) => \{\s+const val = e\.target\.value === '' \? '' : \(parseFloat\(e\.target\.value\) \|\| 0\);/g,
  `type="text"
                                                                                  value={formatThousand(scheme.price)}
                                                                                  onChange={(e) => {
                                                                                      const val = parseThousand(e.target.value);`
);

// Replacement B: rt.price input
content = content.replace(
  /type="number"\s+value=\{rt\.price \|\| ''\}\s+onChange=\{e => \{\s+const updated = \[\.\.\.kmListingForm\.roomTypes\];\s+updated\[activeRoomIdx\] = \{ \.\.\.rt, price: parseFloat\(e\.target\.value\) \|\| 0 \};/g,
  `type="text"
                                                                                  value={formatThousand(rt.price || '')}
                                                                                  onChange={e => {
                                                                                      const updated = [...kmListingForm.roomTypes];
                                                                                      updated[activeRoomIdx] = { ...rt, price: parseThousand(e.target.value) || 0 };`
);

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');

console.log("Pricing input formatters replaced robustly.");
