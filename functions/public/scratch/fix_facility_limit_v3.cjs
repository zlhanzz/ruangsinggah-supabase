const fs = require('fs');
const path = 'c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/MyKost.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Revert isPaid to < (already done but to be safe)
content = content.replace(
    /const isPaid = \(rentEnd && currentBillDate <= rentEnd\);/g,
    'const isPaid = (rentEnd && currentBillDate < rentEnd);'
);

// 2. Add the limit logic before isFacilityPaid
content = content.replace(
    /(\s+)const isFacilityPaid = !isPaid && processedExtraBills\.some/g,
    '$1// PENGAMAN: Jangan tampilkan tagihan fasilitas bulan depan jika sewa saat ini belum dibayar\n                                    const hasAlreadyAddedActiveFacility = processedExtraBills.some(b => !b.isRent && b.displayType === "active");\n                                    if (hasAlreadyAddedActiveFacility && currentBillDate > rentEnd) continue;\n\n$1const isFacilityPaid = !isPaid && processedExtraBills.some'
);

fs.writeFileSync(path, content);
console.log('Replacement done');
