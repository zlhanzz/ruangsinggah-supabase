const fs = require('fs');
const path = require('path');

const scratchDir = 'functions/scratch';
const files = fs.readdirSync(scratchDir);
const list = [];

files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(scratchDir, file);
    const stat = fs.statSync(filePath);
    list.push({
      file,
      mtime: stat.mtime
    });
  }
});

list.sort((a, b) => a.mtime - b.mtime);

list.forEach(item => {
  console.log(`${item.mtime.toLocaleString()} - ${item.file}`);
});
