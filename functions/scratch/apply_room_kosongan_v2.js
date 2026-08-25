const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const target3 = `                                                              {['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Jendela Luar', 'Kamar Mandi Dalam', 'Dapur Dalam'].map(fac => {
                                                                  const isChecked = temporaryRoom.roomFacilities?.includes(fac);
                                                                  return (
                                                                      <label key={fac} className="flex items-center gap-2.5 cursor-pointer">
                                                                          <input 
                                                                              type="checkbox"
                                                                              checked={isChecked}
                                                                              onChange={() => {
                                                                                  const current = temporaryRoom.roomFacilities || [];
                                                                                  const updated = current.includes(fac)
                                                                                      ? current.filter((f: string) => f !== fac)
                                                                                      : [...current, fac];
                                                                                  setTemporaryRoom({ ...temporaryRoom, roomFacilities: updated });
                                                                              }}`;

const replacement3 = `                                                              {['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Kosongan (Tanpa Perabot)', 'Jendela Luar', 'Kamar Mandi Dalam', 'Dapur Dalam'].map(fac => {
                                                                  const isChecked = temporaryRoom.roomFacilities?.includes(fac);
                                                                  return (
                                                                      <label key={fac} className="flex items-center gap-2.5 cursor-pointer">
                                                                          <input 
                                                                              type="checkbox"
                                                                              checked={isChecked}
                                                                              onChange={() => {
                                                                                  const current = temporaryRoom.roomFacilities || [];
                                                                                  let updated = [];
                                                                                  if (fac === 'Kosongan (Tanpa Perabot)') {
                                                                                      const isAlreadyChecked = current.includes(fac);
                                                                                      if (isAlreadyChecked) {
                                                                                          updated = current.filter((f: string) => f !== fac);
                                                                                      } else {
                                                                                          updated = current.filter((f: string) => !['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater'].includes(f));
                                                                                          updated.push(fac);
                                                                                      }
                                                                                  } else {
                                                                                      const isPerabot = ['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater'].includes(fac);
                                                                                      if (current.includes(fac)) {
                                                                                          updated = current.filter((f: string) => f !== fac);
                                                                                      } else {
                                                                                          updated = [...current, fac];
                                                                                          if (isPerabot) {
                                                                                              updated = updated.filter((f: string) => f !== 'Kosongan (Tanpa Perabot)');
                                                                                          }
                                                                                      }
                                                                                  }
                                                                                  setTemporaryRoom({ ...temporaryRoom, roomFacilities: updated });
                                                                              }}`;

if (code.includes(target3)) {
    code = code.replace(target3, replacement3);
    console.log("3. Temporary room checklist updated successfully.");
} else {
    // Try LF
    const target3LF = target3.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(target3LF)) {
        code = codeLF.replace(target3LF, replacement3);
        console.log("3. Temporary room checklist (LF) updated successfully.");
    } else {
        console.error("ERROR: target3 not found!");
    }
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("Done patching target 3.");
