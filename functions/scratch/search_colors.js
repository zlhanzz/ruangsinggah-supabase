const fs = require('fs');
const path = require('path');

function searchDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
                searchDir(fullPath);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const matches = content.match(/#[0-9a-fA-F]{6}/g);
            if (matches) {
                matches.forEach(m => {
                    if (m.toLowerCase().startsWith('#f9') || m.toLowerCase().startsWith('#ea') || m.toLowerCase().startsWith('#ff')) {
                        console.log(`Found ${m} in ${fullPath}`);
                    }
                });
            }
        }
    });
}

searchDir(path.join(__dirname, '../public'));
