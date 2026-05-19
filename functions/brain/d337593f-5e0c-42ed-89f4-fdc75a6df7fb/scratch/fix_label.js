
import fs from 'fs';
const filePath = 'c:\\Users\\ZHULL\\Desktop\\Firebase to Supabase\\functions\\public\\components\\admin\\SurveyManagement.tsx';
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace("{ id: 'building_conditions', label: 'Kondisi Bangunan', icon: '🏠' }", "{ id: 'building_conditions', label: 'Kondisi Bangunan/Kamar', icon: '🏠' }");
fs.writeFileSync(filePath, content);
console.log('Fixed!');
