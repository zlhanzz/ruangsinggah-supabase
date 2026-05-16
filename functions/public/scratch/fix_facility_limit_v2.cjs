const fs = require('fs');
const path = 'c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/MyKost.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Revert isPaid to <
content = content.replace(
    /const isPaid = \(rentEnd && currentBillDate <= rentEnd\);/g,
    'const isPaid = (rentEnd && currentBillDate < rentEnd);'
);

// 2. Add the limit logic before if (!isPaid)
content = content.replace(
    /if \(!isPaid\) \{(\s+const isFacilityPaid)/g,
    '// PENGAMAN: Jangan tampilkan tagihan fasilitas bulan depan jika sewa saat ini belum dibayar\n                                    const hasAlreadyAddedActiveFacility = processedExtraBills.some(b => !b.isRent && b.displayType === "active");\n                                    if (hasAlreadyAddedActiveFacility && currentBillDate > rentEnd) continue;\n\n                                    if (!isPaid) {$1'
);

// 3. Fix the filter at 2083 back to <
content = content.replace(
    /billDate <= rentEnd && bill\.displayType !== 'history'/g,
    "billDate < rentEnd && bill.displayType !== 'history'"
);

fs.writeFileSync(path, content);
console.log('Replacement done');
