const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// Find where temporaryRoom roomFacilities block is.
// It matches: {['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Jendela Luar', 'Kamar Mandi Dalam', 'Dapur Dalam'].map(fac => {
// but we want to only find the one that has temporaryRoom inside it.

const regex = /\{\['Kasur',\s*'Lemari',\s*'Meja Belajar',\s*'AC',\s*'Kipas Angin',\s*'Water Heater',\s*'Jendela Luar',\s*'Kamar Mandi Dalam',\s*'Dapur Dalam'\]\.map\(fac\s*=>\s*\{\s*const\s*isChecked\s*=\s*temporaryRoom\.roomFacilities\?\.includes\(fac\);[\s\S]*?setTemporaryRoom\(\{[\s\S]*?\}\);\s*\}\)\}/;

const match = code.match(regex);
if (match) {
    console.log("Matched regex!");
    const matchedText = match[0];
    
    const replacement = `{['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Kosongan (Tanpa Perabot)', 'Jendela Luar', 'Kamar Mandi Dalam', 'Dapur Dalam'].map(fac => {
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
    
    // Replace only up to the end of onChange. Let's make sure we replace the whole block correctly.
    // Let's do a more precise replacement.
} else {
    console.log("No match found!");
}
