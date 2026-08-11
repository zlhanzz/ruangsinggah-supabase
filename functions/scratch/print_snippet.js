const fs = require('fs');
const content = fs.readFileSync('functions/scratch/extracted_content_0.txt', 'utf8');
console.log("Length:", content.length);
console.log("Snippet:", content.substring(0, 500));
