const fs = require('fs');
const path = require('path');

const scratchDir = path.join(__dirname, '../scratch');
const files = fs.readdirSync(scratchDir);

files.forEach(file => {
    if (file.endsWith('.js')) {
        const filePath = path.join(scratchDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes("latitude") || content.includes("longitude")) {
            console.log(`Found in: ${file}`);
        }
    }
});
