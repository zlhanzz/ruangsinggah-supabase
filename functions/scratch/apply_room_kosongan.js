const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// Target 1: Line 2418 (checklist in inline activeRoom rendering)
const target1 = `                                                             {['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Jendela Luar', 'Kamar Mandi Dalam', 'Dapur Dalam'].map(fac => {
                                                                 const isChecked = rt.roomFacilities?.includes(fac);
                                                                 return (
                                                                     <label key={fac} className="flex items-center gap-2.5 cursor-pointer">
                                                                         <input 
                                                                             type="checkbox"
                                                                             checked={isChecked}
                                                                             onChange={() => {
                                                                                 const current = rt.roomFacilities || [];
                                                                                 const updated = current.includes(fac)
                                                                                     ? current.filter((f: string) => f !== fac)
                                                                                     : [...current, fac];
                                                                                 const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                 updatedRoomTypes[activeRoomIdx] = { ...rt, roomFacilities: updated };
                                                                                 setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                             }}`;

const replacement1 = `                                                             {['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Kosongan (Tanpa Perabot)', 'Jendela Luar', 'Kamar Mandi Dalam', 'Dapur Dalam'].map(fac => {
                                                                 const isChecked = rt.roomFacilities?.includes(fac);
                                                                 return (
                                                                     <label key={fac} className="flex items-center gap-2.5 cursor-pointer">
                                                                         <input 
                                                                             type="checkbox"
                                                                             checked={isChecked}
                                                                             onChange={() => {
                                                                                 const current = rt.roomFacilities || [];
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
                                                                                 const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                 updatedRoomTypes[activeRoomIdx] = { ...rt, roomFacilities: updated };
                                                                                 setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                             }}`;

if (code.includes(target1)) {
    code = code.replace(target1, replacement1);
    console.log("1. Inline activeRoom checklist updated successfully.");
} else {
    // Try LF
    const target1LF = target1.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(target1LF)) {
        code = codeLF.replace(target1LF, replacement1);
        console.log("1. Inline activeRoom checklist (LF) updated successfully.");
    } else {
        console.error("ERROR: target1 not found!");
    }
}

// Target 2: Line 2607 (customs filter in room list overview)
const target2 = `const customs = rt.roomFacilities?.filter((f) => !['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Kamar Mandi Dalam', 'Water Heater', 'Jendela Luar', 'Dapur Dalam'].includes(f)) || [];`;
const replacement2 = `const customs = rt.roomFacilities?.filter((f) => !['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Kamar Mandi Dalam', 'Water Heater', 'Kosongan (Tanpa Perabot)', 'Jendela Luar', 'Dapur Dalam'].includes(f)) || [];`;

if (code.includes(target2)) {
    code = code.replace(target2, replacement2);
    console.log("2. Room list overview customs filter updated successfully.");
} else {
    const target2LF = target2.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(target2LF)) {
        code = codeLF.replace(target2LF, replacement2);
        console.log("2. Room list overview customs filter (LF) updated successfully.");
    } else {
        console.error("ERROR: target2 not found!");
    }
}

// Target 3: Line 5772 (checklist in temporaryRoom rendering)
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
    const target3LF = target3.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(target3LF)) {
        code = codeLF.replace(target3LF, replacement3);
        console.log("3. Temporary room checklist (LF) updated successfully.");
    } else {
        console.error("ERROR: target3 not found!");
    }
}

// Target 4: Line 5949 (customs filter in temporaryRoom room facilities list)
const target4 = `const customs = temporaryRoom.roomFacilities?.filter((f) => !['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Kamar Mandi Dalam', 'Water Heater', 'Jendela Luar', 'Dapur Dalam'].includes(f)) || [];`;
const replacement4 = `const customs = temporaryRoom.roomFacilities?.filter((f) => !['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Kamar Mandi Dalam', 'Water Heater', 'Kosongan (Tanpa Perabot)', 'Jendela Luar', 'Dapur Dalam'].includes(f)) || [];`;

if (code.includes(target4)) {
    code = code.replace(target4, replacement4);
    console.log("4. Temporary room customs filter updated successfully.");
} else {
    const target4LF = target4.replace(/\r\n/g, '\n');
    const codeLF = code.replace(/\r\n/g, '\n');
    if (codeLF.includes(target4LF)) {
        code = codeLF.replace(target4LF, replacement4);
        console.log("4. Temporary room customs filter (LF) updated successfully.");
    } else {
        console.error("ERROR: target4 not found!");
    }
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("Done applying Kosongan (Tanpa Perabot) changes.");
