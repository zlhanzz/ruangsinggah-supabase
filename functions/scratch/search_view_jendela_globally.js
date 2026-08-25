const fs = require('fs');
const glob = require('glob');

const files = glob.sync('functions/public/**/*.tsx');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.toLowerCase().includes('view / jendela') || content.toLowerCase().includes('view/jendela')) {
    console.log(`Found in: ${file}`);
  }
});
