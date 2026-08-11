const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = `                                                     <button
                                                         type="button"
                                                         onClick={() => {
                                                             if (navigator.geolocation) {
                                                                 navigator.geolocation.getCurrentPosition((pos) => {
                                                                     setKmListingForm({
                                                                         ...kmListingForm,
                                                                         location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
                                                                     });
                                                                     alert('Koordinat properti presisi berhasil dikunci!');
                                                                 }, err => alert('Gagal membaca GPS: ' + err.message));
                                                             }
                                                         }}`;

const replacementStr = `                                                     <button
                                                         type="button"
                                                         onClick={() => {
                                                             if (confirmLocationChange()) {
                                                                 if (navigator.geolocation) {
                                                                     navigator.geolocation.getCurrentPosition((pos) => {
                                                                         setKmListingForm({
                                                                             ...kmListingForm,
                                                                             location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
                                                                         });
                                                                         alert('Koordinat properti presisi berhasil dikunci!');
                                                                     }, err => alert('Gagal membaca GPS: ' + err.message));
                                                                 }
                                                             }
                                                         }}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log("Successfully replaced geolocation button click!");
} else {
  // Try normalized replacement
  const cleanTarget = targetStr.replace(/\s+/g, ' ');
  const cleanContent = content.replace(/\s+/g, ' ');
  if (cleanContent.includes(cleanTarget)) {
    const escaped = targetStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    content = content.replace(new RegExp(escaped), replacementStr);
    console.log("Successfully replaced geolocation button click using regex!");
  } else {
    console.error("Could not find the target geolocation button block in the file!");
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
