const fs = require('fs');
const path = 'c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/MyKost.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Revert isPaid and add limit logic
content = content.replace(
    /const isPaid = \(rentEnd && currentBillDate <= rentEnd\);(\s+)(if \(!isPaid\) \{)/g,
    'const isPaid = (rentEnd && currentBillDate < rentEnd);$1const hasAlreadyAddedActiveFacility = processedExtraBills.some(b => !b.isRent && b.displayType === "active");$1if (hasAlreadyAddedActiveFacility && currentBillDate > rentEnd) continue;$1if (!isPaid) {'
);

// 2. Also fix the filter at 2083 back to <
content = content.replace(
    /if \(!isNaN\(rentEnd\.getTime\(\)\)\) \{\s+const billDate = new Date\(bill\.dueDate \|\| bill\.created_at\);\s+if \(!isNaN\(billDate\.getTime\(\)\) && billDate <= rentEnd/g,
    'if (!isNaN(rentEnd.getTime())) {\n                                    const billDate = new Date(bill.dueDate || bill.created_at);\n                                    if (!isNaN(billDate.getTime()) && billDate < rentEnd'
);

fs.writeFileSync(path, content);
console.log('Replacement done');
