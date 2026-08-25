const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Fix kmLandmarkMapInstance useEffect recreation
const landmarkEffectTarget = `    useEffect(() => {
        if (kmLandmarkMapInstance.current) {
            kmLandmarkMapInstance.current.remove();
            kmLandmarkMapInstance.current = null;
            kmLandmarkMarkerInstance.current = null;
        }

        if (!isEditingKostManager || kmStep !== 1 || !kmLandmarkMapRef.current) return;
        const L = (window as any).L;
        if (!L) return;`;

const landmarkEffectReplacement = `    useEffect(() => {
        if (!isEditingKostManager || kmStep !== 1 || !kmLandmarkMapRef.current) {
            if (kmLandmarkMapInstance.current) {
                kmLandmarkMapInstance.current.remove();
                kmLandmarkMapInstance.current = null;
                kmLandmarkMarkerInstance.current = null;
            }
            return;
        }

        if (kmLandmarkMapInstance.current) {
            return;
        }
        const L = (window as any).L;
        if (!L) return;`;

if (content.includes(landmarkEffectTarget)) {
  content = content.replace(landmarkEffectTarget, landmarkEffectReplacement);
  console.log("Landmark map useEffect recreation guarded.");
} else {
  console.error("CRITICAL: Landmark map useEffect target not found!");
}

// 2. Fix kmMapInstance useEffect recreation
const mapEffectTarget = `    useEffect(() => {
        if (kmMapInstance.current) {
            kmMapInstance.current.remove();
            kmMapInstance.current = null;
            kmMarkerInstance.current = null;
        }

        if (!isEditingKostManager || kmStep !== 1 || !kmMapRef.current) return;
        const L = (window as any).L;
        if (!L) return;`;

const mapEffectReplacement = `    useEffect(() => {
        if (!isEditingKostManager || kmStep !== 1 || !kmMapRef.current) {
            if (kmMapInstance.current) {
                kmMapInstance.current.remove();
                kmMapInstance.current = null;
                kmMarkerInstance.current = null;
            }
            return;
        }

        if (kmMapInstance.current) {
            return;
        }
        const L = (window as any).L;
        if (!L) return;`;

if (content.includes(mapEffectTarget)) {
  content = content.replace(mapEffectTarget, mapEffectReplacement);
  console.log("Main map useEffect recreation guarded.");
} else {
  console.error("CRITICAL: Main map useEffect target not found!");
}

// 3. Fix uncontrolled to controlled input warnings by using !!isBChecked and !!isKChecked
// A. Dapur Bersama sub checkboxes
content = content.replace(
  `{['Kompor', 'Kulkas', 'Dispenser', 'Wastafel Cuci Piring', 'Peralatan Masak', 'Meja Makan'].map(kfac => {
                                                                const isKChecked = kmListingForm.publicKitchenFacilities?.includes(kfac);
                                                                return (
                                                                    <label key={kfac} className="flex items-center gap-2 cursor-pointer">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={isKChecked}`,
  `{['Kompor', 'Kulkas', 'Dispenser', 'Wastafel Cuci Piring', 'Peralatan Masak', 'Meja Makan'].map(kfac => {
                                                                const isKChecked = kmListingForm.publicKitchenFacilities?.includes(kfac);
                                                                return (
                                                                    <label key={kfac} className="flex items-center gap-2 cursor-pointer">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={!!isKChecked}`
);

// B. WC Umum sub checkboxes
content = content.replace(
  `{['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Wastafel'].map(bfac => {
                                                                const isBChecked = kmListingForm.publicBathroomFacilities?.includes(bfac);
                                                                return (
                                                                    <label key={bfac} className="flex items-center gap-2 cursor-pointer">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={isBChecked}`,
  `{['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Wastafel'].map(bfac => {
                                                                const isBChecked = kmListingForm.publicBathroomFacilities?.includes(bfac);
                                                                return (
                                                                    <label key={bfac} className="flex items-center gap-2 cursor-pointer">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={!!isBChecked}`
);

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
console.log("Uncontrolled to controlled warning fixed.");
