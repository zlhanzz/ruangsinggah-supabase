const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../public/dist');
const destDir = path.join(__dirname, '../../public');

console.log("Source directory:", srcDir);
console.log("Destination directory:", destDir);

// Helper function to recursively copy directories
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  // Clear destDir first (except .git or important files if any, but since it's just static hosting, clear it)
  if (fs.existsSync(destDir)) {
    const items = fs.readdirSync(destDir);
    items.forEach(item => {
      if (item !== '.git' && item !== '.gitignore') {
        const itemPath = path.join(destDir, item);
        fs.rmSync(itemPath, { recursive: true, force: true });
      }
    });
  }
  
  copyDir(srcDir, destDir);
  console.log("Successfully copied Vite build output to root public hosting folder!");
} catch (err) {
  console.error("Error during copying:", err.message);
}
