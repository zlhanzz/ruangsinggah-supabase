const fs = require('fs');
const glob = require('glob');

const files = glob.sync('functions/public/**/*.*', { nodir: true });
files.forEach(file => {
  if (file.includes('sw.js') || file.includes('service-worker') || file.includes('register')) {
    console.log(`Matching file name: ${file}`);
  }
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('serviceWorker') || content.includes('caches.open')) {
    console.log(`Matching content in: ${file}`);
  }
});
