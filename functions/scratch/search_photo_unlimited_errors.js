const fs = require('fs');

console.log("=== make_room_photos_unlimited.js ===");
console.log(fs.readFileSync('functions/scratch/make_room_photos_unlimited.js', 'utf8'));

console.log("=== replace_photos_blocks_by_index.js ===");
console.log(fs.readFileSync('functions/scratch/replace_photos_blocks_by_index.js', 'utf8'));
