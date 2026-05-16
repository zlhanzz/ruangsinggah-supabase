const fs = require('fs');
const path = 'c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/MyKost.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
    /const isFacilityPaid = processedExtraBills\.some\(\(b: any\) => \{/g,
    'const isFacilityPaid = !isPaid && processedExtraBills.some((b: any) => {'
);
fs.writeFileSync(path, content);
console.log('Replacement done');
