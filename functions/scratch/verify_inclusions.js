const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
console.log("Includes totalRooms:", content.includes('totalRooms'));
console.log("Includes Kamar Belum Lengkap:", content.includes('Kamar Belum Lengkap'));
console.log("Includes Progres Pendataan Kamar:", content.includes('Progres Pendataan Kamar'));
console.log("Includes Target jumlah kamar:", content.includes('Target jumlah kamar'));
