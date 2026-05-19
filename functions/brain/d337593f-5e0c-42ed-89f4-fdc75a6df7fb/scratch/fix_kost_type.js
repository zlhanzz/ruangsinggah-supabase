
import fs from 'fs';
const filePath = 'c:\\Users\\ZHULL\\Desktop\\Firebase to Supabase\\functions\\public\\components\\admin\\SurveyManagement.tsx';
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(
    "{ id: 'room_facilities', label: 'Fasilitas Kamar', icon: '🛏️' }",
    "{ id: 'kost_type', label: 'Jenis Kost', icon: '👤' },\n                                                  { id: 'room_facilities', label: 'Fasilitas Kamar', icon: '🛏️' }"
);
fs.writeFileSync(filePath, content);
console.log('Fixed!');
