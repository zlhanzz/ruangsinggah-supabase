const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. First occurrence (temporaryRoom)
content = content.replace(
  `                                                                                   const definedPeriods = (temporaryRoom.pricing || []).map((p: any) => p.period);
                                                                                   const list = definedPeriods.length > 0 ? definedPeriods : ['bulanan'];`,
  `                                                                                   const list = ['harian', 'mingguan', 'bulanan', '3bulanan', '6bulanan', 'tahunan'];`
);

// 2. Second occurrence (activeRoomIdx / rt)
content = content.replace(
  `                                                                                       const definedPeriods = (rt.pricing || []).map((p: any) => p.period);
                                                                                       const list = definedPeriods.length > 0 ? definedPeriods : ['bulanan'];`,
  `                                                                                       const list = ['harian', 'mingguan', 'bulanan', '3bulanan', '6bulanan', 'tahunan'];`
);

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
console.log("All subscription periods successfully added to occupant inputs.");
