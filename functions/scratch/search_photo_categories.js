const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('photoCategories') || line.includes('photo-category') || line.includes('kategori foto') || line.includes('Tambah Foto Kamar')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
