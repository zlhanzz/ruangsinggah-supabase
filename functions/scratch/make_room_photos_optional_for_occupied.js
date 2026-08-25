const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Update temporaryRoom editor Foto Kamar description & labels mapping
const oldDescTemp = `<p className="text-[10px] text-gray-500 leading-relaxed mb-1">Unggah foto kondisi kamar saat ini untuk keperluan listing/marketing.</p>`;
const newDescTemp = `<p className="text-[10px] text-gray-500 leading-relaxed mb-1">
                                                                     {temporaryRoom.status === 'Terisi' 
                                                                         ? 'Unggah foto kondisi kamar saat ini (opsional, jika pemilik/penghuni berkenan).' 
                                                                         : 'Unggah foto kondisi kamar saat ini untuk keperluan listing/marketing.'}
                                                                 </p>`;

const oldMapTemp = `['Interior Kamar *Wajib', 'Kamar Mandi', 'View / Jendela', 'Lemari / Storage'].map((label, imgIdx) => {`;
const newMapTemp = `['Interior Kamar ' + (temporaryRoom.status === 'Terisi' ? '(Opsional)' : '*Wajib'), 'Kamar Mandi', 'View / Jendela', 'Lemari / Storage'].map((label, imgIdx) => {`;

content = content.replace(oldDescTemp, newDescTemp);
// Replace the first occurrence of oldMapTemp
content = content.replace(oldMapTemp, newMapTemp);

// 2. Update activeRoomIdx / rt editor Foto Kamar description & labels mapping
const oldDescActive = `<p className="text-[10px] text-gray-500 leading-relaxed mb-1">Unggah foto kondisi kamar saat ini untuk keperluan listing/marketing.</p>`;
const newDescActive = `<p className="text-[10px] text-gray-500 leading-relaxed mb-1">
                                                                     {rt.status === 'Terisi' 
                                                                         ? 'Unggah foto kondisi kamar saat ini (opsional, jika pemilik/penghuni berkenan).' 
                                                                         : 'Unggah foto kondisi kamar saat ini untuk keperluan listing/marketing.'}
                                                                 </p>`;

const oldMapActive = `['Interior Kamar *Wajib', 'Kamar Mandi', 'View / Jendela', 'Lemari / Storage'].map((label, imgIdx) => {`;
const newMapActive = `['Interior Kamar ' + (rt.status === 'Terisi' ? '(Opsional)' : '*Wajib'), 'Kamar Mandi', 'View / Jendela', 'Lemari / Storage'].map((label, imgIdx) => {`;

// Replace the second occurrence of oldDescTemp (which is now oldDescActive)
content = content.replace(oldDescActive, newDescActive);
// Replace the second occurrence of oldMapTemp (which is now oldMapActive)
content = content.replace(oldMapActive, newMapActive);

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');

console.log("Done updating room photos optional text for occupied status.");
