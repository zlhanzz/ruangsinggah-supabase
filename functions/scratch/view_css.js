const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/index.css');
if (fs.existsSync(filePath)) {
    console.log('index.css content:');
    console.log(fs.readFileSync(filePath, 'utf8'));
} else {
    console.log('index.css does not exist at ' + filePath);
}
