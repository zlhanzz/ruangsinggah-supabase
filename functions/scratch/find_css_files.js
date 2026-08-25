const fs = require('fs');
const path = require('path');

function findCssFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
                results = results.concat(findCssFiles(fullPath));
            }
        } else if (file.endsWith('.css')) {
            results.push(fullPath);
        }
    });
    return results;
}

const cssFiles = findCssFiles(path.join(__dirname, '../public'));
console.log("CSS Files found:", cssFiles);
