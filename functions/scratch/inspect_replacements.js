const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const content = fs.readFileSync(file, 'utf8');

const data = JSON.parse(fs.readFileSync('functions/scratch/extracted_stepper.json', 'utf8'));

data.tool_calls.forEach((tc, idx) => {
  if (tc.name === 'replace_file_content') {
    const args = tc.args || {};
    console.log(`\nTool call ${idx}: target file ${args.TargetFile}`);
    console.log(`StartLine: ${args.StartLine}, EndLine: ${args.EndLine}`);
    console.log(`TargetContent length: ${args.TargetContent.length}`);
    console.log(`ReplacementContent length: ${args.ReplacementContent.length}`);
  }
});
