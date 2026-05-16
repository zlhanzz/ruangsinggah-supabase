const fs = require('fs');
const path = 'c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/MyKost.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
    /const isPaid = \(rentEnd && currentBillDate < rentEnd\);/g,
    'const isPaid = (rentEnd && currentBillDate <= rentEnd);'
);
fs.writeFileSync(path, content);
console.log('Replacement done');
