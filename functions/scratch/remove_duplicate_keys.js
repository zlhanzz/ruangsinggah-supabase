const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. In closeKostManagerListing
content = content.replace(
  `            publicBathroomFacilities: [],\n            publicKitchenFacilities: [],\n            facilities: ['WiFi', 'Parkir Motor'],\n            location: { lat: -5.147665, lng: 119.432731 },\n            rules: ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],\n            image_urls: [],\n            campuses: [],\n            publicBathroomFacilities: []`,
  `            publicBathroomFacilities: [],\n            publicKitchenFacilities: [],\n            facilities: ['WiFi', 'Parkir Motor'],\n            location: { lat: -5.147665, lng: 119.432731 },\n            rules: ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],\n            image_urls: [],\n            campuses: []`
);

// 2. In openKostManagerListing fallback block
content = content.replace(
  `            roomTypes: [],\n            publicBathroomFacilities: [],\n            publicKitchenFacilities: [],\n        roomTypes: [],\n            facilities: ['WiFi', 'Parkir Motor', 'Dapur Bersama'],\n            location: { lat: -5.147665, lng: 119.432731 },\n            rules: ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],\n            image_urls: [],\n            campuses: [],\n            publicBathroomFacilities: []`,
  `            roomTypes: [],\n            publicBathroomFacilities: [],\n            publicKitchenFacilities: [],\n            facilities: ['WiFi', 'Parkir Motor', 'Dapur Bersama'],\n            location: { lat: -5.147665, lng: 119.432731 },\n            rules: ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],\n            image_urls: [],\n            campuses: []`
);

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
console.log("Duplicate key warnings successfully cleaned up.");
