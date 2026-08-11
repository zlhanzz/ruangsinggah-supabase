const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/supabase_schema.sql');
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr1 = `      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND (users.is_admin = true OR users.role = 'admin')`;

const replacementStr1 = `      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND (users.is_admin = true OR users.role::text = 'admin')`;

const targetStr2 = `      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role IN ('survey_agent', 'agen', 'agent', 'admin')`;

const replacementStr2 = `      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role::text IN ('survey_agent', 'agen', 'agent', 'admin')`;

let replaced = 0;
if (content.includes(targetStr1)) {
  content = content.replace(targetStr1, replacementStr1);
  replaced++;
}
if (content.includes(targetStr2)) {
  content = content.replace(targetStr2, replacementStr2);
  replaced++;
}

console.log(`Replaced matches: ${replaced}`);
fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
